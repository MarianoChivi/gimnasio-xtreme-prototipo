import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Banknote, Clock, Dumbbell, FileText, Mail, Pencil, Phone, Plus, Trash2, Users } from 'lucide-react'
import { useStore } from '../store'
import { addMonthKey, fmtDate, initials, monthKey, money, periodoLabel } from '../utils'
import ComprobanteModal from '../components/Comprobante'
import { Avatar, Badge, Button, Card, Confirm, Empty, ErrorBox, Field, IconButton, Input, Modal, PageHeader, Segmented, Select, SuccessModal, Table, useToast } from '../components/ui'

const vacio = { dni: '', nombre: '', apellido: '', telefono: '', email: '', disponibilidadHoraria: '' }

export default function Entrenadores() {
  const { state, api, usuario, hoy } = useStore()
  const toast = useToast()
  const pt = usuario.rol === 'Propietario'
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(vacio)
  const [baja, setBaja] = useState(null)
  const [ver, setVer] = useState(null)
  const [pago, setPago] = useState(null)
  const [pf, setPf] = useState({ periodo: '', monto: '', metodo: 'Transferencia', fecha: '' })
  const [ok, setOk] = useState(null)
  const [comp, setComp] = useState(null)
  const [error, setError] = useState('')
  const activos = state.entrenadores.filter((e) => e.estado === 'Activo')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const asignados = (id) => state.asignaciones.filter((a) => a.entrenadorId === id && a.estado === 'Activa')

  const abrir = (e) => {
    setForm(e ? { ...e } : vacio)
    setError('')
    setModal(e ?? 'nuevo')
  }
  const guardar = () => {
    try {
      if (modal === 'nuevo') api.registrarEntrenador(form)
      else api.modificarEntrenador(modal.id, form)
      toast(modal === 'nuevo' ? 'Entrenador registrado correctamente.' : 'Entrenador modificado.')
      setModal(null)
    } catch (e) {
      setError(e.message)
    }
  }
  const pagar = () => {
    try {
      setOk(api.pagarEntrenador(pago.id, pf.periodo, pf.monto, pf.metodo, pf.fecha))
      setPago(null)
    } catch (e) {
      setError(e.message)
    }
  }
  const mes = monthKey(hoy)
  const periodos = [addMonthKey(mes, -2), addMonthKey(mes, -1), mes]

  return (
    <>
      <PageHeader
        title="Entrenadores"
        subtitle="Disponibilidad horaria, socios asignados y pagos por servicios."
        actions={
          pt && (
            <Button icon={Plus} onClick={() => abrir(null)}>
              Registrar Entrenador
            </Button>
          )
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {activos.map((e) => {
          const socios = asignados(e.id)
          const ultimo = state.pagosEntrenador.filter((p) => p.entrenadorId === e.id).sort((a, b) => b.periodo.localeCompare(a.periodo))[0]
          return (
            <Card key={e.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <Avatar text={initials(e.nombre, e.apellido)} className="h-12 w-12 rounded-xl text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-800">
                    {e.nombre} {e.apellido}
                  </p>
                  <p className="text-xs text-ink-400">DNI {e.dni}</p>
                </div>
                {pt && (
                  <div className="flex">
                    <IconButton icon={Pencil} title="Modificar" onClick={() => abrir(e)} />
                    <IconButton icon={Trash2} title="Dar de baja" onClick={() => setBaja(e)} />
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-ink-500">
                <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-brand-500" />{e.disponibilidadHoraria}</p>
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-ink-300" />{e.telefono}</p>
                {e.email && <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 text-ink-300" />{e.email}</p>}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
                <button onClick={() => setVer(e)} className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
                  <Users className="h-4 w-4" /> {socios.length} socio{socios.length === 1 ? '' : 's'} asignado{socios.length === 1 ? '' : 's'}
                </button>
                {pt && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Banknote}
                    onClick={() => {
                      setPf({ periodo: mes, monto: '', metodo: 'Transferencia', fecha: hoy })
                      setError('')
                      setPago(e)
                    }}
                  >
                    Pagar
                  </Button>
                )}
              </div>
              {ultimo && <p className="mt-2 text-[11px] text-ink-400">Último pago: {periodoLabel(ultimo.periodo)} · {money(ultimo.monto)}</p>}
            </Card>
          )
        })}
      </div>
      {activos.length === 0 && <Empty icon={Dumbbell} title="No hay entrenadores activos" />}

      <Modal open={!!ver} onClose={() => setVer(null)} title={ver ? `Socios asignados a ${ver.nombre} ${ver.apellido}` : ''} icon={Users} size="lg">
        {ver && (
          <Table
            dense
            rows={asignados(ver.id)}
            empty="No tiene socios asignados."
            columns={[
              { header: 'Socio', render: (a) => { const s = state.socios.find((x) => x.dni === a.socioDni); return <Link to={`/socios/${a.socioDni}`} className="font-medium hover:text-brand-600">{s?.nombre} {s?.apellido}</Link> } },
              { header: 'DNI', key: 'socioDni' },
              { header: 'Desde', render: (a) => fmtDate(a.fechaInicio) },
              { header: 'Estado', render: (a) => <Badge>{a.estado}</Badge> },
            ]}
          />
        )}
      </Modal>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'nuevo' ? 'Registrar Entrenador' : 'Modificar Entrenador'}
        icon={Dumbbell}
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
          <Field label="DNI *">
            <Input value={form.dni} onChange={set('dni')} disabled={modal !== 'nuevo'} maxLength={8} autoFocus />
          </Field>
          <Field label="Teléfono *">
            <Input value={form.telefono} onChange={set('telefono')} />
          </Field>
          <Field label="Nombre *">
            <Input value={form.nombre} onChange={set('nombre')} />
          </Field>
          <Field label="Apellido *">
            <Input value={form.apellido} onChange={set('apellido')} />
          </Field>
          <Field label="Email" className="sm:col-span-2">
            <Input type="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Disponibilidad horaria *" className="sm:col-span-2" hint="Ej. Lun a Vie 07:00 a 13:00">
            <Input value={form.disponibilidadHoraria} onChange={set('disponibilidadHoraria')} />
          </Field>
          <div className="sm:col-span-2">
            <ErrorBox>{error}</ErrorBox>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!pago}
        onClose={() => setPago(null)}
        title="Registrar Pago a Entrenador"
        icon={Banknote}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPago(null)}>
              Cancelar
            </Button>
            <Button onClick={pagar}>Registrar pago</Button>
          </>
        }
      >
        {pago && (
          <div className="space-y-4">
            <p className="rounded-lg bg-ink-50 px-4 py-3 text-sm font-semibold text-ink-700">
              {pago.nombre} {pago.apellido} · {asignados(pago.id).length} socios asignados
            </p>
            <Field label="Período de servicios">
              <Select value={pf.periodo} onChange={(e) => setPf({ ...pf, periodo: e.target.value })}>
                {periodos.map((p) => (
                  <option key={p} value={p}>
                    {periodoLabel(p)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Monto ($)">
              <Input type="number" min="1" value={pf.monto} onChange={(e) => setPf({ ...pf, monto: e.target.value })} autoFocus />
            </Field>
            <Field label="Fecha del pago">
              <Input type="date" max={hoy} value={pf.fecha} onChange={(e) => setPf({ ...pf, fecha: e.target.value })} />
            </Field>
            <Field label="Método de pago">
              <Segmented options={['Efectivo', 'Transferencia']} value={pf.metodo} onChange={(m) => setPf({ ...pf, metodo: m })} />
            </Field>
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
      </Modal>

      <SuccessModal
        open={!!ok}
        onClose={() => setOk(null)}
        title="Pago a entrenador registrado"
        rows={ok ? [['Período', periodoLabel(ok.pago.periodo)], ['Fecha', fmtDate(ok.pago.fecha)], ['Monto', money(ok.pago.monto)], ['Método', ok.pago.metodo], ['Comprobante', ok.comprobante.numero]] : []}
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
        title="Baja de Entrenador"
        confirmText="Dar de baja"
        onConfirm={() => {
          api.bajaEntrenador(baja.id)
          toast(`${baja.nombre} ${baja.apellido} fue dado de baja.`)
          setBaja(null)
        }}
      >
        {baja && (
          <>
            ¿Confirmás la baja de <b>{baja.nombre} {baja.apellido}</b>? Se finalizarán sus {asignados(baja.id).length} asignaciones activas.
          </>
        )}
      </Confirm>
    </>
  )
}
