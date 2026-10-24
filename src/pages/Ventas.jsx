import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Ban, FileText, List, Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { cajaAbierta, cajaDe } from '../logic'
import { fmtDateTime, money, normalize } from '../utils'
import ComprobanteModal from '../components/Comprobante'
import AnularModal from '../components/AnularModal'
import { Badge, Button, Card, cx, ErrorBox, Field, IconButton, InfoBox, PageHeader, SearchInput, Segmented, SuccessModal, Table, Tabs, useToast } from '../components/ui'

const CAT_COLOR = {
  Suplementos: 'bg-brand-50 text-brand-700',
  Bebidas: 'bg-sky-50 text-sky-700',
  Accesorios: 'bg-amber-50 text-amber-700',
  Indumentaria: 'bg-violet-50 text-violet-700',
}

function NuevaVenta() {
  const { state, api } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Todas')
  const [items, setItems] = useState([])
  const [metodo, setMetodo] = useState('Efectivo')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(null)
  const [comp, setComp] = useState(null)
  const caja = cajaAbierta(state)

  const productos = state.productos.filter((p) => p.estado === 'Activo')
  const cats = ['Todas', ...new Set(productos.map((p) => p.categoria))]
  const visibles = productos.filter((p) => (cat === 'Todas' || p.categoria === cat) && (!q || normalize(p.nombre).includes(normalize(q))))
  const prod = (id) => state.productos.find((p) => p.id === id)
  const total = items.reduce((a, it) => a + it.cantidad * prod(it.productoId).precioVenta, 0)

  const agregar = (p, delta = 1) => {
    const it = items.find((x) => x.productoId === p.id)
    const cant = (it?.cantidad ?? 0) + delta
    if (cant > p.stock) return setError(`Stock insuficiente de ${p.nombre} (disponible: ${p.stock}).`)
    setError('')
    if (cant <= 0) setItems(items.filter((x) => x.productoId !== p.id))
    else setItems(it ? items.map((x) => (x.productoId === p.id ? { ...x, cantidad: cant } : x)) : [...items, { productoId: p.id, cantidad: cant }])
  }

  const confirmar = () => {
    try {
      const r = api.registrarVenta(items, metodo)
      setOk(r)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }
  const limpiar = () => {
    setItems([])
    setError('')
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <div className="space-y-4">
        {!caja && (
          <InfoBox tone="warn">
            La caja está cerrada. <Link to="/caja" className="font-semibold underline">Abrí la caja</Link> para poder confirmar ventas.
          </InfoBox>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar producto..." className="flex-1" />
          <div className="flex gap-1 overflow-x-auto">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cx('shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition', cat === c ? 'bg-ink-700 text-white' : 'bg-white text-ink-500 ring-1 ring-ink-100 hover:bg-ink-50')}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {visibles.map((p) => {
            const enCarrito = items.find((i) => i.productoId === p.id)?.cantidad ?? 0
            const sin = p.stock === 0
            return (
              <button
                key={p.id}
                disabled={sin}
                onClick={() => agregar(p)}
                className={cx(
                  'group relative flex flex-col rounded-xl border bg-white p-4 text-left shadow-card transition',
                  sin ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg',
                  enCarrito ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-ink-100',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={cx('rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', CAT_COLOR[p.categoria] ?? 'bg-ink-50 text-ink-600')}>{p.categoria}</span>
                  {enCarrito > 0 && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">{enCarrito}</span>}
                </div>
                <p className="mt-3 font-semibold text-ink-800">{p.nombre}</p>
                <p className="line-clamp-1 text-xs text-ink-400">{p.descripcion}</p>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-lg font-extrabold text-ink-800">{money(p.precioVenta)}</p>
                  <p className={cx('text-xs font-medium', p.stock < p.stockMinimo ? 'text-warn-600' : 'text-ink-400')}>{sin ? 'Sin stock' : `Stock: ${p.stock}`}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="xl:sticky xl:top-24 xl:self-start">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between bg-ink-700 px-5 py-4 text-white">
            <p className="flex items-center gap-2 font-semibold">
              <ShoppingCart className="h-4 w-4" /> Detalle de la venta
            </p>
            <span className="text-xs text-white/60">{items.length} producto{items.length === 1 ? '' : 's'}</span>
          </div>
          <div className="max-h-72 divide-y divide-ink-100 overflow-y-auto px-5">
            {items.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center text-sm text-ink-400">
                <Package className="mb-2 h-8 w-8 text-ink-200" />
                Tocá un producto para agregarlo
              </div>
            )}
            {items.map((it) => {
              const p = prod(it.productoId)
              return (
                <div key={it.productoId} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">{p.nombre}</p>
                    <p className="text-xs text-ink-400">{money(p.precioVenta)} c/u</p>
                  </div>
                  <div className="flex items-center rounded-lg border border-ink-200">
                    <button className="px-2 py-1 text-ink-500 hover:text-brand-600" onClick={() => agregar(p, -1)} aria-label="Restar">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{it.cantidad}</span>
                    <button className="px-2 py-1 text-ink-500 hover:text-brand-600" onClick={() => agregar(p, 1)} aria-label="Sumar">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="w-20 text-right text-sm font-semibold tabular-nums">{money(it.cantidad * p.precioVenta)}</p>
                  <IconButton icon={Trash2} title="Quitar" variant="danger" className="h-7 w-7" onClick={() => agregar(p, -it.cantidad)} />
                </div>
              )
            })}
          </div>
          <div className="space-y-4 border-t border-ink-100 bg-ink-50/50 px-5 py-4">
            <Field label="Método de pago">
              <Segmented options={['Efectivo', 'Transferencia']} value={metodo} onChange={setMetodo} />
            </Field>
            <div className="flex items-center justify-between border-t border-ink-200 pt-4">
              <span className="font-semibold text-ink-600">Total</span>
              <span className="text-2xl font-extrabold text-ink-800">{money(total)}</span>
            </div>
            <ErrorBox>{error}</ErrorBox>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" onClick={limpiar} disabled={!items.length}>
                Cancelar
              </Button>
              <Button size="lg" onClick={confirmar} disabled={!items.length}>
                Confirmar Venta
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <SuccessModal
        open={!!ok}
        onClose={() => {
          setOk(null)
          limpiar()
        }}
        title="Venta registrada correctamente"
        rows={
          ok
            ? [
                ['Venta', ok.venta.numero],
                ['Productos', ok.venta.items.reduce((a, i) => a + i.cantidad, 0)],
                ['Método', ok.venta.metodo],
                ['Total', money(ok.venta.total)],
                ['Comprobante', ok.comprobante.numero],
              ]
            : []
        }
        extra={
          ok && (
            <Button variant="outline" icon={FileText} onClick={() => setComp(ok.comprobante.numero)}>
              Ver comprobante
            </Button>
          )
        }
      />
      {comp && <ComprobanteModal numero={comp} onClose={() => setComp(null)} />}
    </div>
  )
}

function Listado() {
  const { state, api } = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [comp, setComp] = useState(null)
  const [anular, setAnular] = useState(null)
  const rows = state.ventas
    .filter((v) => !q || v.numero.toLowerCase().includes(q.toLowerCase()) || v.comprobante.toLowerCase().includes(q.toLowerCase()) || v.items.some((i) => normalize(i.nombre).includes(normalize(q))))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 80)
  return (
    <>
      <SearchInput value={q} onChange={setQ} placeholder="Buscar por número de venta, comprobante o producto..." className="mb-4 max-w-md" />
      <Table
        rows={rows}
        footer={`Mostrando las últimas ${rows.length} ventas`}
        columns={[
          { header: 'Venta', render: (v) => <span className="font-mono text-xs font-semibold">{v.numero}</span> },
          { header: 'Fecha', render: (v) => fmtDateTime(v.fecha) },
          { header: 'Comprobante', render: (v) => <span className="font-mono text-xs">{v.comprobante}</span>, className: 'hidden md:table-cell' },
          { header: 'Productos', render: (v) => v.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(', '), className: 'hidden xl:table-cell max-w-xs truncate' },
          { header: 'Total', align: 'right', render: (v) => money(v.total) },
          { header: 'Estado', render: (v) => <Badge>{v.estado}</Badge> },
          {
            header: '',
            align: 'right',
            render: (v) => (
              <div className="flex justify-end gap-1">
                <IconButton icon={FileText} title="Ver comprobante" onClick={() => setComp(v.comprobante)} />
                {v.estado === 'Confirmada' && <IconButton icon={Ban} title="Anular venta" variant="danger" onClick={() => setAnular(v)} />}
              </div>
            ),
          },
        ]}
      />
      <AnularModal
        open={!!anular}
        onClose={() => setAnular(null)}
        title="Anular Venta"
        caja={anular && cajaDe(state, anular.cajaId)}
        rows={anular ? [['Venta', anular.numero], ['Fecha', fmtDateTime(anular.fecha)], ['Productos', anular.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(', ')], ['Total', money(anular.total)], ['Comprobante', anular.comprobante], ['Estado', <Badge key="e">{anular.estado}</Badge>]] : []}
        onConfirm={() => {
          try {
            api.anularVenta(anular.id)
            toast(`Venta ${anular.numero} anulada. Se repuso el stock y se restó de la caja del día.`)
          } catch (e) {
            toast(e.message, 'error')
          }
          setAnular(null)
        }}
      >
        Los productos vuelven al stock, el monto se resta de la caja del día y el comprobante queda anulado.
      </AnularModal>
      {comp && <ComprobanteModal numero={comp} onClose={() => setComp(null)} />}
    </>
  )
}

export default function Ventas() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'nueva'
  return (
    <>
      <PageHeader title="Ventas" subtitle="Venta de productos en el mostrador del gimnasio." />
      <Tabs
        value={tab}
        onChange={(v) => setParams(v === 'nueva' ? {} : { tab: v })}
        tabs={[
          { value: 'nueva', label: 'Registrar Venta', icon: ShoppingCart },
          { value: 'listado', label: 'Ventas registradas', icon: List },
        ]}
      />
      {tab === 'nueva' ? <NuevaVenta /> : <Listado />}
    </>
  )
}
