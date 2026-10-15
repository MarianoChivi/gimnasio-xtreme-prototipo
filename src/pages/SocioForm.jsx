import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useStore } from '../store'
import { valorVigente } from '../logic'
import { fmtDate, money, todayISO } from '../utils'
import { Button, ErrorBox, Field, InfoBox, Input, PageHeader, Section, SuccessModal } from '../components/ui'

export default function SocioForm() {
  const { dni } = useParams()
  const { state, api, estadoSocio } = useStore()
  const nav = useNavigate()
  const socio = dni ? state.socios.find((s) => s.dni === dni) : null
  const editar = !!dni
  const [form, setForm] = useState(() =>
    socio ? { ...socio } : { dni: '', nombre: '', apellido: '', telefono: '', email: '', fechaIngreso: todayISO() },
  )
  const [error, setError] = useState('')
  const [ok, setOk] = useState(null)

  if (editar && !socio) return <Navigate to="/socios" replace />
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    try {
      const s = editar ? api.modificarSocio(dni, form) : api.registrarSocio(form)
      setError('')
      setOk(s)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <PageHeader
        title={editar ? 'Modificar Socio' : 'Registrar Socio'}
        subtitle={editar ? `${socio.nombre} ${socio.apellido} · DNI ${socio.dni}` : 'Completá los datos personales del nuevo socio.'}
        actions={
          <Button variant="ghost" icon={ArrowLeft} onClick={() => nav(-1)}>
            Volver
          </Button>
        }
      />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Datos Personales">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="DNI *" hint={editar ? 'El DNI identifica al socio y no se puede modificar.' : 'Sin puntos, 7 u 8 dígitos.'}>
                <Input value={form.dni} onChange={set('dni')} disabled={editar} inputMode="numeric" maxLength={8} placeholder="Ej. 40123456" autoFocus={!editar} />
              </Field>
              <Field label="Fecha de ingreso">
                <Input type="date" value={form.fechaIngreso} onChange={set('fechaIngreso')} disabled={editar} />
              </Field>
              <Field label="Nombre *">
                <Input value={form.nombre} onChange={set('nombre')} placeholder="Ej. Lucía" />
              </Field>
              <Field label="Apellido *">
                <Input value={form.apellido} onChange={set('apellido')} placeholder="Ej. Morales" />
              </Field>
            </div>
          </Section>
          <Section title="Datos de Contacto">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teléfono *">
                <Input value={form.telefono} onChange={set('telefono')} placeholder="Ej. 387 512-3344" />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={set('email')} placeholder="Ej. nombre@mail.com" />
              </Field>
            </div>
          </Section>
          <ErrorBox>{error}</ErrorBox>
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" size="lg" className="min-w-[140px]" onClick={() => nav(-1)}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" icon={Save} className="min-w-[160px]">
              {editar ? 'Guardar cambios' : 'Registrar Socio'}
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {editar ? (
            <InfoBox>
              Estado actual: <b>{estadoSocio.get(socio.dni)}</b>. Para dar de baja o reactivar al socio usá las acciones de su ficha.
            </InfoBox>
          ) : (
            <InfoBox>
              Al registrar al socio se genera su primera cuota con el valor vigente de <b>{money(valorVigente(state))}</b>. Las siguientes vencen el día 10 de cada mes.
            </InfoBox>
          )}
        </div>
      </form>
      <SuccessModal
        open={!!ok}
        onClose={() => nav(editar ? `/socios/${dni}` : '/socios')}
        title={editar ? 'Socio modificado' : 'Socio registrado correctamente'}
        rows={ok ? [['Socio', `${ok.nombre} ${ok.apellido}`], ['DNI', ok.dni], ['Teléfono', ok.telefono], ['Fecha de ingreso', fmtDate(ok.fechaIngreso)]] : []}
        extra={
          !editar && ok ? (
            <Button variant="outline" onClick={() => nav(`/pagos?dni=${ok.dni}`)}>
              Cobrar primera cuota
            </Button>
          ) : null
        }
      />
    </>
  )
}
