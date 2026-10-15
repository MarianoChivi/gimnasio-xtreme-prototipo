import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Banknote, ClipboardList, FileText, Inbox, PackagePlus, Plus, Truck, X } from 'lucide-react'
import { useStore } from '../store'
import { stockBajo } from '../logic'
import { fmtDate, money, normalize } from '../utils'
import ComprobanteModal from '../components/Comprobante'
import { Badge, Button, Card, ErrorBox, Field, IconButton, Input, Modal, PageHeader, SearchInput, Section, Segmented, Select, SuccessModal, Table, Tabs } from '../components/ui'

function NuevaCompra() {
  const { state, api } = useStore()
  const nav = useNavigate()
  const [proveedorId, setProveedorId] = useState('')
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState(null)
  const productos = state.productos.filter((p) => p.estado === 'Activo')
  const bajo = stockBajo(state)
  const prod = (id) => state.productos.find((p) => p.id === id)

  const agregar = (id, cant) => {
    id = Number(id)
    cant = Number(cant)
    if (!id) return setError('Seleccioná un producto.')
    if (!Number.isInteger(cant) || cant <= 0) return setError('La cantidad debe ser un entero mayor a cero.')
    setError('')
    setItems((xs) => (xs.some((x) => x.productoId === id) ? xs.map((x) => (x.productoId === id ? { ...x, cantidad: x.cantidad + cant } : x)) : [...xs, { productoId: id, cantidad: cant }]))
    setProductoId('')
    setCantidad('1')
  }

  const confirmar = () => {
    try {
      setOk(api.registrarCompra(Number(proveedorId), items))
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Section title="Proveedor">
          <Select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} className="max-w-md">
            <option value="">Seleccioná el proveedor...</option>
            {state.proveedores
              .filter((p) => p.estado === 'Activo')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · CUIT {p.cuit}
                </option>
              ))}
          </Select>
        </Section>
        <Section title="Agregar Productos">
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_120px_auto]">
            <Field label="Producto">
              <Select value={productoId} onChange={(e) => setProductoId(e.target.value)}>
                <option value="">Seleccioná un producto...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (stock {p.stock})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Cantidad">
              <Input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            </Field>
            <Button variant="outline" icon={Plus} onClick={() => agregar(productoId, cantidad)}>
              Agregar
            </Button>
          </div>
        </Section>
        <Table
          rows={items}
          rowKey={(i) => i.productoId}
          empty="Todavía no agregaste productos a la compra."
          columns={[
            { header: 'Producto', render: (i) => prod(i.productoId).nombre },
            { header: 'Stock actual', render: (i) => prod(i.productoId).stock, className: 'hidden sm:table-cell' },
            { header: 'Cant. solicitada', align: 'right', render: (i) => <b>{i.cantidad}</b> },
            { header: 'Quitar', align: 'right', render: (i) => <IconButton icon={X} variant="danger" title="Quitar" className="h-7 w-7" onClick={() => setItems(items.filter((x) => x !== i))} /> },
          ]}
        />
        <ErrorBox>{error}</ErrorBox>
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="outline"
            size="lg"
            className="min-w-[140px]"
            onClick={() => {
              setItems([])
              setProveedorId('')
            }}
          >
            Cancelar
          </Button>
          <Button size="lg" icon={Truck} className="min-w-[170px]" onClick={confirmar} disabled={!items.length || !proveedorId}>
            Registrar Compra
          </Button>
        </div>
      </div>
      <div>
        <Card accent="bg-warn-500" className="p-5 pl-6">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-warn-600">
            <AlertTriangle className="h-4 w-4" /> Productos con stock bajo
          </p>
          <p className="mt-0.5 text-xs text-ink-400">Sugerencia para incluir en la compra</p>
          <ul className="mt-4 space-y-2">
            {bajo.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-warn-50/60 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-ink-700">{p.nombre}</p>
                  <p className="text-xs text-ink-400">
                    Stock {p.stock} / mínimo {p.stockMinimo}
                  </p>
                </div>
                <Button size="sm" variant="ghost" icon={PackagePlus} onClick={() => agregar(p.id, Math.max(p.stockMinimo * 2 - p.stock, 1))}>
                  {p.stockMinimo * 2 - p.stock}
                </Button>
              </li>
            ))}
            {bajo.length === 0 && <li className="text-sm text-ink-400">No hay productos por debajo del mínimo.</li>}
          </ul>
        </Card>
      </div>
      <SuccessModal
        open={!!ok}
        onClose={() => nav('/compras?tab=pendientes')}
        title="Compra registrada correctamente"
        rows={
          ok
            ? [
                ['Compra', ok.numero],
                ['Proveedor', state.proveedores.find((p) => p.id === ok.proveedorId)?.nombre],
                ['Productos', ok.detalles.length],
                ['Estado', <Badge key="e">{ok.estado}</Badge>],
              ]
            : []
        }
      >
        <p className="mb-4 text-sm text-ink-500">Cuando llegue la mercadería, registrá la recepción para actualizar el stock.</p>
      </SuccessModal>
    </div>
  )
}

function Listado({ soloPendientes }) {
  const { state, api } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [pagar, setPagar] = useState(null)
  const [metodo, setMetodo] = useState('Transferencia')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(null)
  const [comp, setComp] = useState(null)
  const prov = (id) => state.proveedores.find((p) => p.id === id)?.nombre ?? ''
  const rows = state.compras
    .filter((c) => (soloPendientes ? c.estado === 'Pendiente' : true))
    .filter((c) => !q || c.numero.toLowerCase().includes(q.toLowerCase()) || normalize(prov(c.proveedorId)).includes(normalize(q)))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  const confirmarPago = () => {
    try {
      setOk(api.pagarProveedor(pagar.id, metodo))
      setPagar(null)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <SearchInput value={q} onChange={setQ} placeholder="Buscar por compra o proveedor..." className="mb-4 max-w-md" />
      <Table
        rows={rows}
        empty={soloPendientes ? 'No hay compras pendientes de recepción.' : 'No hay compras registradas.'}
        footer={soloPendientes ? `Mostrando ${rows.length} compra${rows.length === 1 ? '' : 's'} pendiente${rows.length === 1 ? '' : 's'} de recepción` : `Mostrando ${rows.length} compras`}
        columns={[
          { header: 'Compra', render: (c) => <span className="font-mono text-xs font-semibold">{c.numero}</span> },
          { header: 'Fecha', render: (c) => fmtDate(c.fecha) },
          { header: 'Proveedor', render: (c) => prov(c.proveedorId) },
          { header: 'Productos', className: 'hidden lg:table-cell', render: (c) => c.detalles.map((d) => `${d.cantSolicitada}× ${state.productos.find((p) => p.id === d.productoId)?.nombre}`).join(', ') },
          { header: 'Total', align: 'right', render: (c) => (c.estado === 'Pendiente' ? <span className="text-ink-300">-</span> : money(c.total)) },
          { header: 'Estado', render: (c) => <Badge>{c.estado}</Badge> },
          ...(!soloPendientes ? [{ header: 'Pago', render: (c) => (c.estado === 'Pendiente' ? <span className="text-xs text-ink-300">-</span> : c.pago ? <Badge>Pagado</Badge> : <Badge>A pagar</Badge>) }] : []),
          {
            header: '',
            align: 'right',
            render: (c) =>
              c.estado === 'Pendiente' ? (
                <Button size="sm" variant="outline" icon={Inbox} onClick={() => nav(`/compras/${c.id}/recepcion`)}>
                  Registrar recepción
                </Button>
              ) : !c.pago ? (
                <Button
                  size="sm"
                  variant="outline"
                  icon={Banknote}
                  onClick={() => {
                    setError('')
                    setMetodo('Transferencia')
                    setPagar(c)
                  }}
                >
                  Pagar
                </Button>
              ) : (
                <IconButton icon={FileText} title="Ver comprobante de pago" onClick={() => setComp(c.pago.comprobante)} />
              ),
          },
        ]}
      />
      <Modal
        open={!!pagar}
        onClose={() => setPagar(null)}
        title="Registrar Pago a Proveedor"
        icon={Banknote}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPagar(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarPago}>Registrar pago</Button>
          </>
        }
      >
        {pagar && (
          <div className="space-y-4">
            <dl className="divide-y divide-ink-100 rounded-xl border border-ink-100 text-sm">
              {[
                ['Compra', pagar.numero],
                ['Proveedor', prov(pagar.proveedorId)],
                ['Estado', pagar.estado],
                ['Monto a pagar', money(pagar.total)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between px-4 py-2.5">
                  <dt className="text-ink-400">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <Field label="Método de pago">
              <Segmented options={['Efectivo', 'Transferencia']} value={metodo} onChange={setMetodo} />
            </Field>
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
      </Modal>
      <SuccessModal
        open={!!ok}
        onClose={() => setOk(null)}
        title="Pago a proveedor registrado"
        rows={ok ? [['Compra', ok.compra.numero], ['Proveedor', prov(ok.compra.proveedorId)], ['Monto', money(ok.compra.pago.monto)], ['Método', ok.compra.pago.metodo], ['Comprobante', ok.comprobante.numero]] : []}
        extra={
          ok && (
            <Button variant="outline" icon={FileText} onClick={() => setComp(ok.comprobante.numero)}>
              Ver comprobante
            </Button>
          )
        }
      />
      {comp && <ComprobanteModal numero={comp} onClose={() => setComp(null)} />}
    </>
  )
}

export default function Compras() {
  const { state } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'nueva'
  return (
    <>
      <PageHeader title="Compras" subtitle="Pedidos a proveedores, recepción de mercadería y pagos." />
      <Tabs
        value={tab}
        onChange={(v) => setParams(v === 'nueva' ? {} : { tab: v })}
        tabs={[
          { value: 'nueva', label: 'Registrar Compra', icon: Truck },
          { value: 'pendientes', label: 'Pendientes de recepción', icon: Inbox, count: state.compras.filter((c) => c.estado === 'Pendiente').length },
          { value: 'todas', label: 'Todas las compras', icon: ClipboardList },
        ]}
      />
      {tab === 'nueva' && <NuevaCompra />}
      {tab === 'pendientes' && <Listado soloPendientes />}
      {tab === 'todas' && <Listado />}
    </>
  )
}
