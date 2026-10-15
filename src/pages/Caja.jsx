import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, LockOpen, Wallet } from 'lucide-react'
import { useStore } from '../store'
import { cajaAbierta, movimientosCaja, nombreSocio } from '../logic'
import { fmtDate, fmtDateTime, fmtTime, money } from '../utils'
import { Badge, Button, Card, Confirm, ErrorBox, Field, Input, PageHeader, Section, SuccessModal, Table } from '../components/ui'

function Historial() {
  const { state } = useStore()
  const rows = state.cajas.filter((c) => c.estado === 'Cerrada').sort((a, b) => b.id - a.id)
  return (
    <Section title="Cajas anteriores" accent={false}>
      <Table
        dense
        rows={rows}
        empty="Todavía no hay cajas cerradas."
        columns={[
          { header: 'Caja', className: 'whitespace-nowrap', render: (c) => <span className="font-mono text-xs font-semibold">{c.numero}</span> },
          { header: 'Fecha', render: (c) => fmtDate(c.apertura) },
          { header: 'Horario', className: 'hidden 2xl:table-cell whitespace-nowrap', render: (c) => `${fmtTime(c.apertura)} a ${fmtTime(c.cierre)}` },
          { header: 'Pagos', align: 'right', className: 'hidden xl:table-cell whitespace-nowrap', render: (c) => `${c.cantPagos} · ${money(c.totalPagos)}` },
          { header: 'Ventas', align: 'right', className: 'hidden xl:table-cell whitespace-nowrap', render: (c) => `${c.cantVentas} · ${money(c.totalVentas)}` },
          { header: 'Total del día', align: 'right', render: (c) => <b>{money(c.total)}</b> },
          { header: 'Estado', render: (c) => <Badge>{c.estado}</Badge> },
        ]}
      />
    </Section>
  )
}

export default function Caja() {
  const { state, api } = useStore()
  const nav = useNavigate()
  const caja = cajaAbierta(state)
  const [monto, setMonto] = useState('10000')
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [ok, setOk] = useState(null)

  const abrir = (e) => {
    e.preventDefault()
    try {
      setOk({ tipo: 'apertura', caja: api.abrirCaja(monto) })
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }
  const cerrar = () => {
    try {
      setOk({ tipo: 'cierre', caja: api.cerrarCaja() })
    } catch (err) {
      setError(err.message)
    }
    setConfirm(false)
  }

  if (!caja) {
    return (
      <>
        <PageHeader title="Apertura de Caja" subtitle="Abrí la caja del día para empezar a registrar pagos y ventas." />
        <div className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={abrir}>
            <Card className="overflow-hidden">
              <div className="flex flex-col items-center bg-gradient-to-br from-ink-700 to-ink-800 px-6 py-8 text-center text-white">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                  <Lock className="h-7 w-7 text-brand-300" />
                </span>
                <p className="mt-3 text-lg font-bold">La caja está cerrada</p>
                <p className="text-sm text-white/60">Ingresá el monto inicial en efectivo</p>
              </div>
              <div className="space-y-4 p-6">
                <Field label="Monto inicial ($)">
                  <Input type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} autoFocus />
                </Field>
                <ErrorBox>{error}</ErrorBox>
                <Button type="submit" size="lg" icon={LockOpen} className="w-full">
                  Abrir Caja
                </Button>
              </div>
            </Card>
          </form>
          <div className="lg:col-span-2">
            <Historial />
          </div>
        </div>
        <SuccessModal
          open={!!ok}
          onClose={() => setOk(null)}
          title={ok?.tipo === 'cierre' ? 'Caja cerrada correctamente' : 'Caja abierta correctamente'}
          rows={
            ok?.tipo === 'cierre'
              ? [['Caja', ok.caja.numero], ['Pagos de cuotas', `${ok.caja.cantPagos} · ${money(ok.caja.totalPagos)}`], ['Ventas', `${ok.caja.cantVentas} · ${money(ok.caja.totalVentas)}`], ['Total del día', money(ok.caja.total)], ['Cierre', fmtDateTime(ok.caja.cierre)]]
              : ok
                ? [['Caja', ok.caja.numero], ['Apertura', fmtDateTime(ok.caja.apertura)], ['Monto inicial', money(ok.caja.montoInicial)]]
                : []
          }
        />
      </>
    )
  }

  const m = movimientosCaja(state, caja.id)
  const efectivo = m.pagos.filter((p) => p.metodo === 'Efectivo').reduce((a, p) => a + p.monto, 0) + m.ventas.filter((v) => v.metodo === 'Efectivo').reduce((a, v) => a + v.total, 0)
  const detalle = [
    ...m.pagos.map((p) => ({ id: 'p' + p.id, hora: p.fecha, concepto: `Cuota · ${nombreSocio(state, p.socioDni)}`, metodo: p.metodo, monto: p.monto })),
    ...m.ventas.map((v) => ({ id: 'v' + v.id, hora: v.fecha, concepto: `Venta ${v.numero}`, metodo: v.metodo, monto: v.total })),
  ].sort((a, b) => b.hora.localeCompare(a.hora))

  return (
    <>
      <PageHeader title="Registrar Cierre de Caja" subtitle="Revisá los movimientos del día y cerrá la caja." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Caja Abierta" actions={<Badge>Abierta</Badge>}>
            <p className="text-sm text-ink-600">
              Caja <b>{caja.numero}</b> · Apertura: {fmtDateTime(caja.apertura)} · Monto inicial: {money(caja.montoInicial)}
            </p>
          </Section>
          <Section title="Movimientos del Día">
            <Table
              rows={[
                { id: 1, concepto: 'Pagos de cuotas', cantidad: m.pagos.length, subtotal: m.totalPagos },
                { id: 2, concepto: 'Ventas de productos', cantidad: m.ventas.length, subtotal: m.totalVentas },
              ]}
              columns={[
                { header: 'Concepto', key: 'concepto' },
                { header: 'Cantidad', align: 'center', key: 'cantidad' },
                { header: 'Subtotal', align: 'right', render: (r) => money(r.subtotal) },
              ]}
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 px-5 py-4">
              <span className="text-sm text-brand-800">Sin contar los anulados ni el monto inicial</span>
              <span className="text-xl font-extrabold text-brand-700">Total del día: {money(m.total)}</span>
            </div>
          </Section>
          <Section title="Detalle de movimientos" accent={false}>
            <Table
              dense
              rows={detalle}
              empty="Todavía no hay movimientos en esta caja."
              columns={[
                { header: 'Hora', render: (r) => fmtTime(r.hora) },
                { header: 'Concepto', key: 'concepto' },
                { header: 'Método', key: 'metodo', className: 'hidden sm:table-cell' },
                { header: 'Monto', align: 'right', render: (r) => money(r.monto) },
              ]}
            />
          </Section>
        </div>
        <div className="space-y-4">
          <Card className="p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink-500">
              <Wallet className="h-4 w-4" /> Arqueo sugerido
            </p>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-ink-400">Monto inicial</dt><dd>{money(caja.montoInicial)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-400">Cobros en efectivo</dt><dd>{money(efectivo)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-400">Cobros por transferencia</dt><dd>{money(m.total - efectivo)}</dd></div>
              <div className="flex justify-between border-t border-ink-100 pt-2.5 font-semibold"><dt>Efectivo esperado en caja</dt><dd className="text-brand-600">{money(caja.montoInicial + efectivo)}</dd></div>
            </dl>
          </Card>
          <ErrorBox>{error}</ErrorBox>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg" onClick={() => nav('/')}>
              Cancelar
            </Button>
            <Button size="lg" icon={Lock} onClick={() => setConfirm(true)}>
              Cerrar Caja
            </Button>
          </div>
        </div>
      </div>
      <Confirm open={confirm} onClose={() => setConfirm(false)} onConfirm={cerrar} title="Cerrar Caja" tone="brand" icon={Lock} confirmText="Confirmar cierre">
        Se cerrará la caja <b>{caja.numero}</b> con un total del día de <b>{money(m.total)}</b>. Después no se podrán registrar más cobros hasta abrir una nueva caja.
      </Confirm>
    </>
  )
}
