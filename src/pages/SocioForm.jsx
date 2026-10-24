import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Save, UserPlus } from 'lucide-react'
import { useStore } from '../store'
import { cajaAbierta, valorVigente } from '../logic'
import { fmtDate, money, periodoLabel } from '../utils'
import ComprobanteModal from '../components/Comprobante'
import { Badge, Button, ErrorBox, Field, InfoBox, Input, PageHeader, Section, Segmented, SuccessModal } from '../components/ui'

export default function SocioForm() {
  const { dni } = useParams()
  const { state, api, estadoSocio } = useStore()
  const nav = useNavigate()
  const socio = dni ? state.socios.find((s) => s.dni === dni) : null
  const editar = !!dni
  const [form, setForm] = useState(() => (socio ? { ...socio } : { dni: '', nombre: '', apellido: '', telefono: '', email: '' }))
  const [metodo, setMetodo] = useState('Efectivo')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(null)
  const [comp, setComp] = useState(null)

  if (editar && !socio) return <Navigate to="/socios" replace />
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const caja = cajaAbierta(state)
  const valor = valorVigente(state)

  const submit = (e) => {
    e.preventDefault()
    try {
      setOk(editar ? { socio: api.modificarSocio(dni, form) } : api.registrarSocio(form, metodo))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <PageHeader
        title={editar ? 'Modificar Socio' : 'Registrar Socio'}
        subtitle={editar ? `${socio.nombre} ${socio.apellido} · DNI ${socio.dni}` : 'Cargá los datos del nuevo socio y el pago de su primera cuota.'}
        actions={
          <Button variant="ghost" icon={ArrowLeft} onClick={() => nav(-1)}>
            Volver
          </Button>
        }
      />
      <form onSubmit={submit} className="max-w-4xl space-y-6">
        <Section title="Datos del Socio">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="DNI *" hint={editar ? 'El DNI identifica al socio y no se puede modificar.' : 'Sin puntos, 7 u 8 dígitos.'}>
              <Input value={form.dni} onChange={set('dni')} disabled={editar} inputMode="numeric" maxLength={8} placeholder="Ej. 40123456" autoFocus={!editar} />
            </Field>
            <Field label="Nombre *">
              <Input value={form.nombre} onChange={set('nombre')} placeholder="Nombre" />
            </Field>
            <Field label="Apellido *">
              <Input value={form.apellido} onChange={set('apellido')} placeholder="Apellido" />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input type="email" value={form.email} onChange={set('email')} placeholder="correo@ejemplo.com" />
            </Field>
            <Field label="Teléfono *">
              <Input value={form.telefono} onChange={set('telefono')} placeholder="Ej. 387 512-3344" />
            </Field>
          </div>
          {editar && (
            <p className="mt-4 text-xs text-ink-400">
              Estado actual: <b className="text-ink-600">{estadoSocio.get(socio.dni)}</b> · Ingreso: {fmtDate(socio.fechaIngreso)}
            </p>
          )}
        </Section>

        {!editar && (
          <Section title="Pago de la Primera Cuota">
            <div className="grid items-end gap-4 sm:grid-cols-2">
              <Field label="Método de pago">
                <Segmented options={['Efectivo', 'Transferencia']} value={metodo} onChange={setMetodo} />
              </Field>
              <Field label="Valor de la cuota vigente">
                <Input value={money(valor)} disabled />
              </Field>
            </div>
            <p className="mt-4 text-xs text-ink-400">El pago se registra en la caja del día y se emite el comprobante automáticamente.</p>
          </Section>
        )}

        {!editar && !caja && (
          <InfoBox tone="warn">
            La caja está cerrada. <Link to="/caja" className="font-semibold underline">Abrí la caja</Link> para poder registrar el socio y el pago de su primera cuota.
          </InfoBox>
        )}
        <ErrorBox>{error}</ErrorBox>
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" size="lg" className="min-w-[140px]" onClick={() => nav(-1)}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" icon={editar ? Save : UserPlus} className="min-w-[170px]">
            {editar ? 'Guardar cambios' : 'Registrar Socio'}
          </Button>
        </div>
      </form>

      <SuccessModal
        open={!!ok}
        onClose={() => nav(editar ? `/socios/${dni}` : '/socios')}
        title={editar ? 'Socio modificado' : 'Socio registrado exitosamente'}
        rows={
          !ok
            ? []
            : editar
              ? [['Socio', `${ok.socio.nombre} ${ok.socio.apellido}`], ['DNI', ok.socio.dni], ['Teléfono', ok.socio.telefono], ['Email', ok.socio.email || '-']]
              : [
                  ['Socio', `${ok.socio.nombre} ${ok.socio.apellido} (DNI ${ok.socio.dni})`],
                  ['Estado', <Badge key="e">{ok.estadoSocio}</Badge>],
                  ['Primera cuota', `${periodoLabel(ok.cuota.periodo)} · Pagada`],
                  ['Pago', `${money(ok.pago.monto)} (${ok.pago.metodo})`],
                  ['Comprobante', ok.comprobante.numero],
                  ['Caja del día', `+ ${money(ok.pago.monto)}`],
                ]
        }
        extra={
          !editar && ok ? (
            <Button variant="outline" icon={FileText} onClick={() => setComp(ok.comprobante.numero)}>
              Ver comprobante
            </Button>
          ) : null
        }
      />
      {comp && <ComprobanteModal numero={comp} onClose={() => setComp(null)} />}
    </>
  )
}
