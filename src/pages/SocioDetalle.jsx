import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CreditCard, Dumbbell, FileText, Mail, Pencil, Phone, RotateCcw, UserMinus } from 'lucide-react'
import { useStore } from '../store'
import { asignacionActiva, cuotasDe, estadoCuota } from '../logic'
import { fmtDate, fmtDateTime, initials, money, periodoLabel } from '../utils'
import ComprobanteModal from '../components/Comprobante'
import { Badge, Button, Card, Confirm, ErrorBox, Field, IconButton, InfoBox, Input, Modal, PageHeader, Section, Select, Table, useToast } from '../components/ui'

export default function SocioDetalle() {
  const { dni } = useParams()
  const { state, api, estadoSocio, hoy, usuario } = useStore()
  const pt = usuario.rol === 'Propietario'
  const nav = useNavigate()
  const toast = useToast()
  const [confirm, setConfirm] = useState(null)
  const [comp, setComp] = useState(null)
  const [asignar, setAsignar] = useState(false)
  const [entrenadorId, setEntrenadorId] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [error, setError] = useState('')
  const s = state.socios.find((x) => x.dni === dni)
  if (!s) return <Navigate to="/socios" replace />

  const estado = estadoSocio.get(dni)
  const cuotas = cuotasDe(state, dni).reverse()
  const deuda = cuotas.filter((c) => !c.pagoId)
  const pagos = state.pagos.filter((p) => p.socioDni === dni).sort((a, b) => b.fecha.localeCompare(a.fecha))
  const asig = asignacionActiva(state, dni)
  const entrenador = asig && state.entrenadores.find((e) => e.id === asig.entrenadorId)

  const accion = () => {
    try {
      if (confirm === 'baja') {
        api.bajaSocio(dni)
        toast('El socio fue dado de baja.')
      } else {
        api.reactivarSocio(dni)
        toast('El socio fue reactivado.')
      }
    } catch (e) {
      toast(e.message, 'error')
    }
    setConfirm(null)
  }

  const guardarAsignacion = () => {
    try {
      api.asignarEntrenador(dni, Number(entrenadorId), fechaInicio)
      toast('Entrenador asignado correctamente.')
      setAsignar(false)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Ficha del Socio"
        actions={
          <Button variant="ghost" icon={ArrowLeft} onClick={() => nav('/socios')}>
            Listado de Socios
          </Button>
        }
      />
      <Card className="mb-6 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-ink-700 via-ink-600 to-brand-600" />
        <div className="flex flex-wrap items-end gap-4 px-6 pb-5">
          <span className="-mt-10 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-brand-500 text-2xl font-extrabold text-white shadow-lg">
            {initials(s.nombre, s.apellido)}
          </span>
          <div className="min-w-0 flex-1 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-ink-800">
                {s.nombre} {s.apellido}
              </h2>
              <Badge>{estado}</Badge>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-400">
              <span>DNI {s.dni}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{s.telefono}</span>
              {s.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{s.email}</span>}
              <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Ingreso {fmtDate(s.fechaIngreso)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {s.baja ? (
              pt && (
                <Button icon={RotateCcw} onClick={() => setConfirm('reactivar')}>
                  Reactivar Socio
                </Button>
              )
            ) : (
              <>
                <Button icon={CreditCard} onClick={() => nav(`/pagos?dni=${dni}`)} disabled={!deuda.length}>
                  Registrar Pago
                </Button>
                <Button variant="outline" icon={Pencil} onClick={() => nav(`/socios/${dni}/editar`)}>
                  Modificar
                </Button>
                {pt && (
                  <Button variant="danger-outline" icon={UserMinus} onClick={() => setConfirm('baja')}>
                    Dar de baja
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Cuotas" subtitle={deuda.length ? `${deuda.length} cuota${deuda.length > 1 ? 's' : ''} sin pagar · ${money(deuda.reduce((a, c) => a + c.valor, 0))}` : 'Sin cuotas adeudadas'}>
            <Table
              dense
              rows={cuotas}
              columns={[
                { header: 'Período', render: (c) => periodoLabel(c.periodo) },
                { header: 'Vencimiento', render: (c) => fmtDate(c.vencimiento) },
                { header: 'Valor', align: 'right', render: (c) => money(c.valor) },
                { header: 'Estado', render: (c) => <Badge>{estadoCuota(c, hoy)}</Badge> },
              ]}
            />
          </Section>
          <Section title="Historial de Pagos">
            <Table
              dense
              rows={pagos}
              empty="El socio todavía no registra pagos."
              columns={[
                { header: 'Fecha', render: (p) => fmtDateTime(p.fecha) },
                { header: 'Cuotas', render: (p) => p.cuotaIds.map((id) => periodoLabel(id.slice(-7))).join(', '), className: 'hidden sm:table-cell' },
                { header: 'Método', key: 'metodo', className: 'hidden md:table-cell' },
                { header: 'Monto', align: 'right', render: (p) => money(p.monto) },
                { header: 'Estado', render: (p) => <Badge>{p.estado}</Badge> },
                { header: '', align: 'right', render: (p) => <IconButton icon={FileText} title="Ver comprobante" onClick={() => setComp(p.comprobante)} /> },
              ]}
            />
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Entrenador asignado">
            {entrenador ? (
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Dumbbell className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-ink-800">
                    {entrenador.nombre} {entrenador.apellido}
                  </p>
                  <p className="text-xs text-ink-400">Desde {fmtDate(asig.fechaInicio)} · {entrenador.disponibilidadHoraria}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink-400">Sin entrenador asignado.</p>
            )}
            {!s.baja && pt && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={() => {
                  setEntrenadorId('')
                  setFechaInicio(hoy)
                  setError('')
                  setAsignar(true)
                }}
              >
                {entrenador ? 'Cambiar entrenador' : 'Asignar entrenador'}
              </Button>
            )}
          </Section>
          <Section title="Resumen" accent={false}>
            <dl className="space-y-2.5 text-sm">
              {[
                ['Cuotas pagadas', cuotas.filter((c) => c.pagoId).length],
                ['Cuotas adeudadas', deuda.length],
                ['Total abonado', money(pagos.filter((p) => p.estado !== 'Anulado').reduce((a, p) => a + p.monto, 0))],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-ink-400">{k}</dt>
                  <dd className="font-semibold text-ink-700">{v}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>
      </div>

      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={accion}
        title={confirm === 'baja' ? 'Dar de baja al socio' : 'Reactivar socio'}
        tone={confirm === 'baja' ? 'danger' : 'brand'}
        icon={confirm === 'baja' ? UserMinus : RotateCcw}
        confirmText={confirm === 'baja' ? 'Confirmar baja' : 'Reactivar'}
      >
        {confirm === 'baja' ? (
          <>
            ¿Confirmás la baja de <b>{s.nombre} {s.apellido}</b>? Dejará de generar cuotas{asig ? ' y se finalizará su asignación de entrenador' : ''}. Las cuotas adeudadas se conservan.
          </>
        ) : (
          <>
            ¿Confirmás la reactivación de <b>{s.nombre} {s.apellido}</b>? Desde hoy se vuelven a generar sus cuotas mensuales.
          </>
        )}
      </Confirm>

      <Modal
        open={asignar}
        onClose={() => setAsignar(false)}
        title="Asignar Entrenador a Socio"
        icon={Dumbbell}
        footer={
          <>
            <Button variant="outline" onClick={() => setAsignar(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarAsignacion} disabled={!entrenadorId || estado !== 'Al día'}>
              Confirmar asignación
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {estado !== 'Al día' && <InfoBox tone="warn">El socio no está Al día. Solo se puede asignar entrenador a socios sin cuotas vencidas.</InfoBox>}
          <Field label="Entrenador">
            <Select value={entrenadorId} onChange={(e) => setEntrenadorId(e.target.value)}>
              <option value="">Seleccioná un entrenador...</option>
              {state.entrenadores
                .filter((e) => e.estado === 'Activo')
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} {e.apellido} · {e.disponibilidadHoraria}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Fecha de inicio">
            <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </Field>
          {entrenador && <p className="text-xs text-ink-400">La asignación actual con {entrenador.nombre} {entrenador.apellido} pasará a estado Finalizada con fecha de fin igual a la fecha de inicio de la nueva.</p>}
          <ErrorBox>{error}</ErrorBox>
        </div>
      </Modal>

      {comp && <ComprobanteModal numero={comp} onClose={() => setComp(null)} />}
    </>
  )
}
