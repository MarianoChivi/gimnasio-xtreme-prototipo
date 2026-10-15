import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Ban, Check, CreditCard, FileText, History, Plus, Search, Tag, Pencil } from 'lucide-react'
import { useStore } from '../store'
import { cajaAbierta, cuotasAdeudadas, estadoCuota, nombreSocio, valorVigente } from '../logic'
import { addDays, fmtDate, fmtDateTime, initials, money, normalize, periodoLabel, toISODate } from '../utils'
import ComprobanteModal from '../components/Comprobante'
import {
  Avatar, Badge, Button, Confirm, cx, Empty, ErrorBox, Field, IconButton, InfoBox, Input, Modal, PageHeader, SearchInput, Section, Segmented, SuccessModal, Table, Tabs, useToast,
} from '../components/ui'

function RegistrarPago() {
  const { state, api, estadoSocio, hoy } = useStore()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const dni = params.get('dni')
  const [q, setQ] = useState('')
  const [buscado, setBuscado] = useState(false)
  const [sel, setSel] = useState(null)
  const [metodo, setMetodo] = useState('Efectivo')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(null)
  const [comp, setComp] = useState(null)

  const socio = dni && state.socios.find((s) => s.dni === dni)
  const cuotas = socio ? cuotasAdeudadas(state, dni) : []
  const seleccion = sel ?? cuotas.filter((c) => c.vencimiento < hoy || cuotas.indexOf(c) === 0).map((c) => c.id)
  const total = cuotas.filter((c) => seleccion.includes(c.id)).reduce((a, c) => a + c.valor, 0)
  const caja = cajaAbierta(state)

  const resultados = q.trim()
    ? state.socios.filter((s) => !s.baja && (s.dni.includes(q.trim()) || normalize(`${s.nombre} ${s.apellido}`).includes(normalize(q.trim()))))
    : []

  const elegir = (d) => {
    setParams({ dni: d })
    setSel(null)
    setError('')
  }
  const cancelar = () => {
    setParams({})
    setSel(null)
    setError('')
  }
  const toggle = (id) => setSel(seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id])

  const registrar = () => {
    try {
      const r = api.registrarPago(dni, seleccion, metodo)
      setOk(r)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }

  if (!socio) {
    return (
      <div className="space-y-6">
        {!caja && (
          <InfoBox tone="warn">
            La caja está cerrada. <Link to="/caja" className="font-semibold underline">Abrí la caja</Link> para poder registrar pagos.
          </InfoBox>
        )}
        <Section title="Buscar Socio" subtitle="Ingresá el DNI o el nombre del socio que va a pagar.">
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault()
              setBuscado(true)
            }}
          >
            <SearchInput value={q} onChange={(v) => { setQ(v); setBuscado(true) }} placeholder="DNI o nombre del socio..." className="flex-1" />
            <Button type="submit" icon={Search}>
              Buscar
            </Button>
          </form>
        </Section>
        {buscado && q.trim() && (
          <Table
            rows={resultados}
            rowKey={(s) => s.dni}
            empty="No se encontró ningún socio activo con ese DNI o nombre."
            footer={`Mostrando ${resultados.length} socio${resultados.length === 1 ? '' : 's'} encontrado${resultados.length === 1 ? '' : 's'}`}
            columns={[
              { header: 'DNI', key: 'dni' },
              { header: 'Nombre', key: 'nombre' },
              { header: 'Apellido', key: 'apellido' },
              { header: 'Estado', render: (s) => <Badge>{estadoSocio.get(s.dni)}</Badge> },
              { header: 'Acción', align: 'right', render: (s) => <Button size="sm" variant="outline" onClick={() => elegir(s.dni)}>Ver cuotas</Button> },
            ]}
          />
        )}
        {!q.trim() && (
          <Section title="Socios con cuotas vencidas" accent={false} subtitle="Accesos directos para cobrar">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {state.socios
                .filter((s) => estadoSocio.get(s.dni) === 'Vencido')
                .map((s) => (
                  <button key={s.dni} onClick={() => elegir(s.dni)} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 text-left transition hover:border-brand-400 hover:bg-brand-50/50">
                    <Avatar text={initials(s.nombre, s.apellido)} className="bg-warn-50 text-warn-600" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-700">
                        {s.nombre} {s.apellido}
                      </p>
                      <p className="text-xs text-ink-400">DNI {s.dni} · {cuotasAdeudadas(state, s.dni).length} adeudadas</p>
                    </div>
                  </button>
                ))}
            </div>
          </Section>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
        <Avatar text={initials(socio.nombre, socio.apellido)} className="h-11 w-11 text-sm" />
        <div className="flex-1">
          <p className="font-semibold text-ink-800">
            {socio.nombre} {socio.apellido}
          </p>
          <p className="text-xs text-ink-400">DNI {socio.dni}</p>
        </div>
        <Badge>{estadoSocio.get(dni)}</Badge>
        <Button variant="ghost" size="sm" onClick={cancelar}>
          Cambiar socio
        </Button>
      </div>

      {cuotas.length === 0 ? (
        <Empty icon={Check} title="El socio está al día">
          No tiene cuotas pendientes de pago.
        </Empty>
      ) : (
        <>
          <Section title={`Cuotas adeudadas de ${socio.nombre} ${socio.apellido}`} subtitle="Seleccioná las cuotas que el socio decide abonar.">
            <Table
              rows={cuotas}
              onRowClick={(c) => toggle(c.id)}
              columns={[
                {
                  header: 'Sel.',
                  className: 'w-12',
                  render: (c) => (
                    <span className={cx('flex h-5 w-5 items-center justify-center rounded-md border-2 transition', seleccion.includes(c.id) ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-200 bg-white')}>
                      {seleccion.includes(c.id) && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                  ),
                },
                { header: 'Período', render: (c) => periodoLabel(c.periodo) },
                { header: 'Vencimiento', render: (c) => fmtDate(c.vencimiento) },
                { header: 'Estado', render: (c) => <Badge>{estadoCuota(c, hoy)}</Badge> },
                { header: 'Valor', align: 'right', render: (c) => money(c.valor) },
              ]}
            />
          </Section>
          <Section title="Datos del Pago">
            <div className="grid items-end gap-5 sm:grid-cols-2">
              <Field label="Método de pago">
                <Segmented options={['Efectivo', 'Transferencia']} value={metodo} onChange={setMetodo} />
              </Field>
              <div className="rounded-xl bg-brand-50 px-5 py-3 sm:text-right">
                <p className="text-xs font-medium text-brand-700">Monto total ({seleccion.length} cuota{seleccion.length === 1 ? '' : 's'})</p>
                <p className="text-2xl font-extrabold text-brand-700">{money(total)}</p>
              </div>
            </div>
          </Section>
          {!caja && (
            <InfoBox tone="warn">
              La caja está cerrada. <Link to="/caja" className="font-semibold underline">Abrí la caja</Link> para poder registrar el pago.
            </InfoBox>
          )}
          <ErrorBox>{error}</ErrorBox>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" size="lg" className="min-w-[140px]" onClick={cancelar}>
              Cancelar
            </Button>
            <Button size="lg" icon={CreditCard} className="min-w-[170px]" onClick={registrar} disabled={!seleccion.length}>
              Registrar Pago
            </Button>
          </div>
        </>
      )}

      <SuccessModal
        open={!!ok}
        onClose={() => {
          setOk(null)
          cancelar()
          setQ('')
        }}
        title="Pago registrado correctamente"
        rows={
          ok
            ? [
                ['Socio', nombreSocio(state, ok.pago.socioDni)],
                ['Cuotas', ok.pago.cuotaIds.map((id) => periodoLabel(id.slice(-7))).join(', ')],
                ['Método', ok.pago.metodo],
                ['Monto', money(ok.pago.monto)],
                ['Comprobante', ok.comprobante.numero],
                ['Estado del socio', <Badge key="e">{ok.estadoSocio}</Badge>],
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

function Historial() {
  const { state, api, usuario } = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [comp, setComp] = useState(null)
  const [anular, setAnular] = useState(null)
  const rows = state.pagos
    .filter((p) => !q || p.socioDni.includes(q) || normalize(nombreSocio(state, p.socioDni)).includes(normalize(q)) || p.comprobante.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 80)
  return (
    <>
      <SearchInput value={q} onChange={setQ} placeholder="Buscar por socio, DNI o comprobante..." className="mb-4 max-w-md" />
      <Table
        rows={rows}
        footer={`Mostrando los últimos ${rows.length} pagos`}
        columns={[
          { header: 'Fecha', render: (p) => fmtDateTime(p.fecha) },
          { header: 'Socio', render: (p) => <Link className="font-medium hover:text-brand-600" to={`/socios/${p.socioDni}`}>{nombreSocio(state, p.socioDni)}</Link> },
          { header: 'Cuotas', render: (p) => p.cuotaIds.map((id) => periodoLabel(id.slice(-7))).join(', '), className: 'hidden lg:table-cell' },
          { header: 'Método', key: 'metodo', className: 'hidden md:table-cell' },
          { header: 'Monto', align: 'right', render: (p) => money(p.monto) },
          { header: 'Estado', render: (p) => <Badge>{p.estado}</Badge> },
          {
            header: '',
            align: 'right',
            render: (p) => (
              <div className="flex justify-end gap-1">
                <IconButton icon={FileText} title="Ver comprobante" onClick={() => setComp(p.comprobante)} />
                {p.estado === 'Registrado' && usuario.rol === 'Propietario' && <IconButton icon={Ban} title="Anular pago" variant="danger" onClick={() => setAnular(p)} />}
              </div>
            ),
          },
        ]}
      />
      <Confirm
        open={!!anular}
        onClose={() => setAnular(null)}
        title="Anular Pago"
        confirmText="Anular pago"
        onConfirm={() => {
          try {
            api.anularPago(anular.id)
            toast(`Pago ${anular.comprobante} anulado. Las cuotas vuelven a quedar pendientes.`)
          } catch (e) {
            toast(e.message, 'error')
          }
          setAnular(null)
        }}
      >
        {anular && (
          <>
            ¿Confirmás la anulación del pago de <b>{nombreSocio(state, anular.socioDni)}</b> por <b>{money(anular.monto)}</b>? Las cuotas vuelven a quedar impagas y se actualiza el estado del socio.
          </>
        )}
      </Confirm>
      {comp && <ComprobanteModal numero={comp} onClose={() => setComp(null)} />}
    </>
  )
}

function ValorCuota() {
  const { state, api, usuario, hoy } = useStore()
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ valor: '', fechaDesde: '' })
  const [error, setError] = useState('')
  const valores = [...state.valoresCuota].sort((a, b) => b.fechaDesde.localeCompare(a.fechaDesde))
  const vigente = valorVigente(state)
  const futuro = valores.find((v) => v.fechaDesde > hoy)
  const pt = usuario.rol === 'Propietario'

  const guardar = () => {
    try {
      if (modal === 'nuevo') api.registrarValorCuota(form.valor, form.fechaDesde)
      else api.modificarValorCuota(modal.id, form.valor)
      toast('Valor de cuota guardado.')
      setModal(null)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4">
        <div className="rounded-xl bg-gradient-to-br from-ink-700 to-ink-800 p-6 text-white shadow-card">
          <p className="text-sm text-white/60">Valor vigente de la cuota</p>
          <p className="mt-1 text-4xl font-extrabold">{money(vigente)}</p>
          <p className="mt-2 text-xs text-white/50">Se aplica a las cuotas que vencen desde {fmtDate(valores.find((v) => v.fechaDesde <= hoy)?.fechaDesde)}</p>
        </div>
        {futuro && (
          <InfoBox>
            Próximo valor: <b>{money(futuro.valor)}</b> desde el {fmtDate(futuro.fechaDesde)}.
          </InfoBox>
        )}
        {pt && !futuro && (
          <Button
            icon={Plus}
            className="w-full"
            onClick={() => {
              setForm({ valor: '', fechaDesde: toISODate(addDays(new Date(hoy.slice(0, 8) + '01T12:00'), 32)).slice(0, 8) + '01' })
              setError('')
              setModal('nuevo')
            }}
          >
            Registrar nuevo valor
          </Button>
        )}
      </div>
      <div className="lg:col-span-2">
        <Table
          rows={valores}
          columns={[
            { header: 'Valor', render: (v) => <b>{money(v.valor)}</b> },
            { header: 'Vigente desde', render: (v) => fmtDate(v.fechaDesde) },
            { header: 'Registrado', render: (v) => fmtDate(v.fechaRegistro), className: 'hidden sm:table-cell' },
            { header: 'Situación', render: (v) => (v.fechaDesde > hoy ? <Badge>Pendiente</Badge> : v.valor === vigente && v === valores.find((x) => x.fechaDesde <= hoy) ? <Badge>Activo</Badge> : <Badge>Finalizada</Badge>) },
            {
              header: '',
              align: 'right',
              render: (v) =>
                pt && v.fechaDesde > hoy ? (
                  <IconButton
                    icon={Pencil}
                    title="Modificar valor"
                    onClick={() => {
                      setForm({ valor: v.valor, fechaDesde: v.fechaDesde })
                      setError('')
                      setModal(v)
                    }}
                  />
                ) : null,
            },
          ]}
        />
        <p className="mt-2 text-xs text-ink-400">Solo se puede modificar un valor que todavía no se aplicó.</p>
      </div>
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'nuevo' ? 'Registrar Valor de Cuota' : 'Modificar Valor de Cuota'}
        icon={Tag}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button onClick={guardar}>Guardar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Valor de la cuota ($)">
            <Input type="number" min="1" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} autoFocus />
          </Field>
          <Field label="Vigente desde" hint="Se aplica a las cuotas que venzan desde esta fecha.">
            <Input type="date" value={form.fechaDesde} disabled={modal !== 'nuevo'} onChange={(e) => setForm({ ...form, fechaDesde: e.target.value })} />
          </Field>
          <ErrorBox>{error}</ErrorBox>
        </div>
      </Modal>
    </div>
  )
}

export default function Pagos() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'registrar'
  return (
    <>
      <PageHeader title="Cuotas y Pagos" subtitle="Registrá pagos de cuotas, consultá el historial y administrá el valor de la cuota." />
      <Tabs
        value={tab}
        onChange={(v) => setParams(v === 'registrar' ? {} : { tab: v })}
        tabs={[
          { value: 'registrar', label: 'Registrar Pago', icon: CreditCard },
          { value: 'historial', label: 'Historial de Pagos', icon: History },
          { value: 'valor', label: 'Valor de Cuota', icon: Tag },
        ]}
      />
      {tab === 'registrar' && <RegistrarPago />}
      {tab === 'historial' && <Historial />}
      {tab === 'valor' && <ValorCuota />}
    </>
  )
}
