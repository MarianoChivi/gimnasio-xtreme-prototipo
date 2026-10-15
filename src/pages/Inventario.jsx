import { useState } from 'react'
import { ArrowDownUp, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { money, normalize } from '../utils'
import { Badge, Button, Confirm, cx, ErrorBox, Field, IconButton, Input, Modal, PageHeader, SearchInput, Segmented, Select, Table, Tabs, Textarea, useToast } from '../components/ui'

export const CATEGORIAS = ['Suplementos', 'Bebidas', 'Accesorios', 'Indumentaria']
const vacio = { nombre: '', categoria: '', descripcion: '', precioVenta: '', stock: '0', stockMinimo: '5' }

function StockBar({ p }) {
  const pct = Math.min(100, (p.stock / Math.max(p.stockMinimo * 2, 1)) * 100)
  const bajo = p.stock < p.stockMinimo
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-100">
        <div className={cx('h-full rounded-full', p.stock === 0 ? 'bg-danger-500' : bajo ? 'bg-warn-500' : 'bg-brand-500')} style={{ width: `${pct}%` }} />
      </div>
      <span className={cx('text-sm font-semibold tabular-nums', bajo ? 'text-warn-600' : 'text-ink-700')}>{p.stock}</span>
      <span className="text-xs text-ink-300">/ mín. {p.stockMinimo}</span>
    </div>
  )
}

export default function Inventario() {
  const { state, api, usuario } = useStore()
  const toast = useToast()
  const pt = usuario.rol === 'Propietario'
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Todas')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(vacio)
  const [ajuste, setAjuste] = useState(null)
  const [aj, setAj] = useState({ tipo: 'Incremento', cantidad: '' })
  const [baja, setBaja] = useState(null)
  const [error, setError] = useState('')

  const activos = state.productos.filter((p) => p.estado === 'Activo')
  const rows = activos.filter((p) => (cat === 'Todas' || (cat === 'Stock bajo' ? p.stock < p.stockMinimo : p.categoria === cat)) && (!q || normalize(p.nombre).includes(normalize(q))))
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const abrir = (p) => {
    setForm(p ? { ...p, precioVenta: String(p.precioVenta), stock: String(p.stock), stockMinimo: String(p.stockMinimo) } : vacio)
    setError('')
    setModal(p ?? 'nuevo')
  }
  const guardar = () => {
    try {
      if (modal === 'nuevo') api.registrarProducto(form)
      else api.modificarProducto(modal.id, form)
      toast(modal === 'nuevo' ? 'Producto registrado correctamente.' : 'Producto modificado.')
      setModal(null)
    } catch (e) {
      setError(e.message)
    }
  }
  const guardarAjuste = () => {
    try {
      const p = api.ajustarStock(ajuste.id, aj.tipo, aj.cantidad)
      toast(`Stock de ${p.nombre} actualizado: ${p.stock} unidades.`)
      setAjuste(null)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle="Productos a la venta, stock disponible y alertas de stock mínimo."
        actions={
          pt && (
            <Button icon={Plus} onClick={() => abrir(null)}>
              Registrar Producto
            </Button>
          )
        }
      />
      <Tabs
        value={cat}
        onChange={setCat}
        tabs={['Todas', ...CATEGORIAS, 'Stock bajo'].map((c) => ({
          value: c,
          label: c,
          count: c === 'Todas' ? activos.length : c === 'Stock bajo' ? activos.filter((p) => p.stock < p.stockMinimo).length : activos.filter((p) => p.categoria === c).length,
        }))}
      />
      <SearchInput value={q} onChange={setQ} placeholder="Buscar producto..." className="mb-4 max-w-md" />
      <Table
        rows={rows}
        footer={`Mostrando ${rows.length} producto${rows.length === 1 ? '' : 's'}`}
        columns={[
          {
            header: 'Producto',
            render: (p) => (
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-400">
                  <Package className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-ink-800">{p.nombre}</p>
                  <p className="text-xs text-ink-400">{p.descripcion}</p>
                </div>
              </div>
            ),
          },
          { header: 'Categoría', key: 'categoria', className: 'hidden md:table-cell' },
          { header: 'Precio', align: 'right', render: (p) => money(p.precioVenta) },
          { header: 'Stock', render: (p) => <StockBar p={p} /> },
          { header: 'Estado', className: 'hidden sm:table-cell', render: (p) => <Badge>{p.stock === 0 ? 'Sin stock' : p.stock < p.stockMinimo ? 'Stock bajo' : 'Activo'}</Badge> },
          {
            header: '',
            align: 'right',
            render: (p) =>
              pt && (
                <div className="flex justify-end gap-1">
                  <IconButton
                    icon={ArrowDownUp}
                    title="Ajuste de stock"
                    variant="brand"
                    onClick={() => {
                      setAj({ tipo: 'Incremento', cantidad: '' })
                      setError('')
                      setAjuste(p)
                    }}
                  />
                  <IconButton icon={Pencil} title="Modificar" onClick={() => abrir(p)} />
                  <IconButton icon={Trash2} title="Dar de baja" onClick={() => setBaja(p)} />
                </div>
              ),
          },
        ]}
      />

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'nuevo' ? 'Registrar Producto' : 'Modificar Producto'}
        icon={Package}
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button onClick={guardar}>{modal === 'nuevo' ? 'Registrar' : 'Guardar cambios'}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre *" className="sm:col-span-2">
            <Input value={form.nombre} onChange={set('nombre')} autoFocus placeholder="Ej. Proteína Whey 1kg" />
          </Field>
          <Field label="Categoría *">
            <Select value={form.categoria} onChange={set('categoria')}>
              <option value="">Seleccioná...</option>
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Precio de venta ($) *">
            <Input type="number" min="1" value={form.precioVenta} onChange={set('precioVenta')} />
          </Field>
          <Field label="Stock inicial" hint={modal !== 'nuevo' ? 'El stock se modifica con un ajuste.' : undefined}>
            <Input type="number" min="0" value={form.stock} onChange={set('stock')} disabled={modal !== 'nuevo'} />
          </Field>
          <Field label="Stock mínimo">
            <Input type="number" min="0" value={form.stockMinimo} onChange={set('stockMinimo')} />
          </Field>
          <Field label="Descripción" className="sm:col-span-2">
            <Textarea rows={2} value={form.descripcion} onChange={set('descripcion')} />
          </Field>
          <div className="sm:col-span-2">
            <ErrorBox>{error}</ErrorBox>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!ajuste}
        onClose={() => setAjuste(null)}
        title="Ajuste de Stock"
        icon={ArrowDownUp}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setAjuste(null)}>
              Cancelar
            </Button>
            <Button onClick={guardarAjuste}>Confirmar ajuste</Button>
          </>
        }
      >
        {ajuste && (
          <div className="space-y-4">
            <div className="rounded-lg bg-ink-50 px-4 py-3 text-sm">
              <p className="font-semibold text-ink-700">{ajuste.nombre}</p>
              <p className="text-ink-400">Stock actual: {ajuste.stock} unidades</p>
            </div>
            <Field label="Tipo de ajuste">
              <Segmented options={['Incremento', 'Decremento']} value={aj.tipo} onChange={(t) => setAj({ ...aj, tipo: t })} />
            </Field>
            <Field label="Cantidad">
              <Input type="number" min="1" value={aj.cantidad} onChange={(e) => setAj({ ...aj, cantidad: e.target.value })} autoFocus />
            </Field>
            {Number(aj.cantidad) > 0 && (
              <p className="text-sm text-ink-500">
                Stock resultante: <b>{ajuste.stock + (aj.tipo === 'Incremento' ? 1 : -1) * Number(aj.cantidad)}</b>
              </p>
            )}
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
      </Modal>

      <Confirm
        open={!!baja}
        onClose={() => setBaja(null)}
        title="Baja de Producto"
        confirmText="Dar de baja"
        onConfirm={() => {
          api.bajaProducto(baja.id)
          toast(`${baja.nombre} fue dado de baja.`)
          setBaja(null)
        }}
      >
        {baja && (
          <>
            ¿Confirmás la baja de <b>{baja.nombre}</b>? Dejará de aparecer en ventas y compras.
          </>
        )}
      </Confirm>
    </>
  )
}
