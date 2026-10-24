import { useState } from 'react'
import { Banknote, Building2, FileText, Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { deudaProveedor } from '../logic'
import { fmtDate, money, normalize } from '../utils'
import ComprobanteModal from '../components/Comprobante'
import { Badge, Button, Confirm, cx, ErrorBox, Field, IconButton, Input, Modal, PageHeader, SearchInput, Segmented, SuccessModal, Table, useToast } from '../components/ui'

const vacio = { nombre: '', cuit: '', telefono: '', email: '' }

export default function Proveedores() {
  const { state, api } = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(vacio)
  const [baja, setBaja] = useState(null)
  const [error, setError] = useState('')
  const [pagar, setPagar] = useState(null)
  const [compraId, setCompraId] = useState(null)
  const [metodo, setMetodo] = useState('Transferencia')
  const [ok, setOk] = useState(null)
  const [comp, setComp] = useState(null)
  const adeudadas = (id) => state.compras.filter((c) => c.proveedorId === id && c.estado !== 'Pendiente' && !c.pago).sort((a, b) => a.fecha.localeCompare(b.fecha))
  const confirmarPago = () => {
    try {
      setOk(api.pagarProveedor(compraId, metodo))
      setPagar(null)
    } catch (e) {
      setError(e.message)
    }
  }
  const rows = state.proveedores.filter((p) => p.estado === 'Activo' && (!q || normalize(p.nombre).includes(normalize(q)) || p.cuit.includes(q)))
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const abrir = (p) => {
    setForm(p ? { ...p } : vacio)
    setError('')
    setModal(p ?? 'nuevo')
  }
  const guardar = () => {
    try {
      if (modal === 'nuevo') api.registrarProveedor(form)
      else api.modificarProveedor(modal.id, form)
      toast(modal === 'nuevo' ? 'Proveedor registrado correctamente.' : 'Proveedor modificado.')
      setModal(null)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Proveedores"
        subtitle="Datos de contacto y deuda por compras recibidas sin pagar."
        actions={
          <Button icon={Plus} onClick={() => abrir(null)}>
            Registrar Proveedor
          </Button>
        }
      />
      <SearchInput value={q} onChange={setQ} placeholder="Buscar por razón social o CUIT..." className="mb-4 max-w-md" />
      <Table
        rows={rows}
        footer={`Mostrando ${rows.length} proveedores`}
        columns={[
          {
            header: 'Proveedor',
            render: (p) => (
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-ink-800">{p.nombre}</p>
                  <p className="font-mono text-xs text-ink-400">CUIT {p.cuit}</p>
                </div>
              </div>
            ),
          },
          {
            header: 'Contacto',
            className: 'hidden md:table-cell',
            render: (p) => (
              <div className="space-y-0.5 text-xs text-ink-500">
                <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{p.telefono}</p>
                {p.email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{p.email}</p>}
              </div>
            ),
          },
          { header: 'Compras', align: 'center', className: 'hidden sm:table-cell', render: (p) => state.compras.filter((c) => c.proveedorId === p.id).length },
          {
            header: 'Deuda',
            align: 'right',
            render: (p) => {
              const d = deudaProveedor(state, p.id)
              return d ? (
                <div className="flex items-center justify-end gap-2">
                  <span className="font-semibold text-warn-600">{money(d)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Banknote}
                    onClick={() => {
                      setCompraId(adeudadas(p.id)[0]?.id ?? null)
                      setMetodo('Transferencia')
                      setError('')
                      setPagar(p)
                    }}
                  >
                    Pagar
                  </Button>
                </div>
              ) : (
                <Badge>Al día</Badge>
              )
            },
          },
          {
            header: '',
            align: 'right',
            render: (p) => (
              <div className="flex justify-end gap-1">
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
        title={modal === 'nuevo' ? 'Registrar Proveedor' : 'Modificar Proveedor'}
        icon={Building2}
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
          <Field label="Razón social *" className="sm:col-span-2">
            <Input value={form.nombre} onChange={set('nombre')} autoFocus />
          </Field>
          <Field label="CUIT *" hint={modal !== 'nuevo' ? 'El CUIT no se puede modificar.' : 'Formato 30-12345678-9'}>
            <Input value={form.cuit} onChange={set('cuit')} disabled={modal !== 'nuevo'} placeholder="30-12345678-9" />
          </Field>
          <Field label="Teléfono *">
            <Input value={form.telefono} onChange={set('telefono')} />
          </Field>
          <Field label="Email" className="sm:col-span-2">
            <Input type="email" value={form.email} onChange={set('email')} />
          </Field>
          <div className="sm:col-span-2">
            <ErrorBox>{error}</ErrorBox>
          </div>
        </div>
      </Modal>
      <Modal
        open={!!pagar}
        onClose={() => setPagar(null)}
        title={pagar ? `Registrar Pago a ${pagar.nombre}` : ''}
        icon={Banknote}
        footer={
          <>
            <Button variant="outline" onClick={() => setPagar(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarPago} disabled={!compraId}>
              Registrar pago
            </Button>
          </>
        }
      >
        {pagar && (
          <div className="space-y-4">
            <p className="text-sm text-ink-500">Compras recibidas sin pago. Seleccioná la que vas a saldar.</p>
            <div className="space-y-2">
              {adeudadas(pagar.id).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCompraId(c.id)}
                  className={cx('flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition', compraId === c.id ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' : 'border-ink-100 hover:border-brand-300')}
                >
                  <div>
                    <p className="font-mono text-xs font-semibold text-ink-700">{c.numero}</p>
                    <p className="text-xs text-ink-400">
                      Recibida el {fmtDate(c.fechaRecepcion)} · <span className="text-ink-500">{c.estado}</span>
                    </p>
                  </div>
                  <span className="font-bold text-ink-800">{money(c.total)}</span>
                </button>
              ))}
            </div>
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
        rows={ok ? [['Compra', ok.compra.numero], ['Proveedor', state.proveedores.find((p) => p.id === ok.compra.proveedorId)?.nombre], ['Monto', money(ok.compra.pago.monto)], ['Método', ok.compra.pago.metodo], ['Comprobante', ok.comprobante.numero]] : []}
        extra={
          ok && (
            <Button variant="outline" icon={FileText} onClick={() => setComp(ok.comprobante.numero)}>
              Ver comprobante
            </Button>
          )
        }
      />
      {comp && <ComprobanteModal numero={comp} onClose={() => setComp(null)} />}
      <Confirm
        open={!!baja}
        onClose={() => setBaja(null)}
        title="Baja de Proveedor"
        confirmText="Dar de baja"
        onConfirm={() => {
          api.bajaProveedor(baja.id)
          toast(`${baja.nombre} fue dado de baja.`)
          setBaja(null)
        }}
      >
        {baja && (
          <>
            ¿Confirmás la baja de <b>{baja.nombre}</b>? No se podrán registrar nuevas compras a este proveedor.
          </>
        )}
      </Confirm>
    </>
  )
}
