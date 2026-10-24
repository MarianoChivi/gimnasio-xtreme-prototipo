import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CreditCard, PackageX, ShoppingCart, TrendingUp, UserPlus, Users, Wallet } from 'lucide-react'
import { useStore } from '../store'
import { cajaAbierta, movimientosCaja, nombreSocio, stockBajo } from '../logic'
import { addDays, DIAS, fechaLarga, fmtTime, money, toISODate } from '../utils'
import { Badge, Button, Card, cx, Section } from '../components/ui'

function Stat({ value, label, icon: Icon, tone, to }) {
  const tones = {
    brand: ['bg-brand-500', 'bg-brand-50 text-brand-600'],
    warn: ['bg-warn-500', 'bg-warn-50 text-warn-600'],
    danger: ['bg-danger-500', 'bg-danger-50 text-danger-500'],
    ink: ['bg-ink-600', 'bg-ink-100 text-ink-600'],
  }[tone]
  return (
    <Link to={to} className="group">
      <Card accent={tones[0]} className="h-full p-5 pl-6 transition group-hover:-translate-y-0.5 group-hover:shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-ink-800">{value}</p>
            <p className="mt-1 text-sm text-ink-400">{label}</p>
          </div>
          <span className={cx('flex h-10 w-10 items-center justify-center rounded-xl', tones[1])}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </Card>
    </Link>
  )
}

export default function Dashboard() {
  const { state, usuario, estadoSocio, hoy } = useStore()
  const nav = useNavigate()
  const caja = cajaAbierta(state)
  const mov = caja ? movimientosCaja(state, caja.id) : null
  const registrados = state.socios.length
  const vencidos = state.socios.filter((s) => estadoSocio.get(s.dni) === 'Vencido')
  const cuotasVencidas = state.cuotas.filter((c) => !c.pagoId && c.vencimiento < hoy && !state.socios.find((s) => s.dni === c.socioDni)?.baja).length
  const bajo = stockBajo(state)

  const dias = Array.from({ length: 7 }, (_, i) => {
    const f = toISODate(addDays(new Date(), i - 6))
    const pagos = state.pagos.filter((p) => p.fecha.startsWith(f) && p.estado !== 'Anulado').reduce((a, p) => a + p.monto, 0)
    const ventas = state.ventas.filter((v) => v.fecha.startsWith(f) && v.estado !== 'Anulada').reduce((a, v) => a + v.total, 0)
    return { f, pagos, ventas, total: pagos + ventas }
  })
  const max = Math.max(...dias.map((d) => d.total), 1)
  const semana = dias.reduce((a, d) => a + d.total, 0)

  const ultimos = [
    ...state.pagos.map((p) => ({ tipo: 'Pago', fecha: p.fecha, detalle: nombreSocio(state, p.socioDni), monto: p.monto, estado: p.estado })),
    ...state.ventas.map((v) => ({ tipo: 'Venta', fecha: v.fecha, detalle: v.items.map((i) => i.nombre).join(', '), monto: v.total, estado: v.estado })),
  ]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-800">Bienvenido, {usuario.nombre.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-ink-400">Panel principal · {fechaLarga()}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat value={registrados} label="Socios registrados" icon={Users} tone="brand" to="/socios" />
        <Stat value={cuotasVencidas} label={`Cuotas vencidas (${vencidos.length} socios)`} icon={AlertTriangle} tone="warn" to="/reportes" />
        <Stat value={money(mov?.total ?? 0)} label="Recaudación del día" icon={Wallet} tone="brand" to="/caja" />
        <Stat value={bajo.length} label="Productos con stock bajo" icon={PackageX} tone="danger" to="/inventario" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Accesos rápidos">
          <div className="grid gap-2.5">
            <Button size="lg" icon={UserPlus} onClick={() => nav('/socios/nuevo')}>
              Registrar Socio
            </Button>
            <Button size="lg" variant="outline" icon={CreditCard} onClick={() => nav('/pagos')}>
              Registrar Pago de Cuota
            </Button>
            <Button size="lg" variant="outline" icon={ShoppingCart} onClick={() => nav('/ventas')}>
              Registrar Venta
            </Button>
          </div>
        </Section>

        <Section title="Estado de la Caja" actions={caja ? <Badge>Abierta</Badge> : <Badge>Cerrada</Badge>}>
          {caja ? (
            <div className="space-y-3 text-sm">
              <p className="text-ink-500">
                Caja <b className="text-ink-700">{caja.numero}</b> · Abierta desde {fmtTime(caja.apertura)}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-ink-50 p-3">
                  <p className="text-xs text-ink-400">Pagos del día ({mov.pagos.length})</p>
                  <p className="mt-0.5 font-bold text-ink-800">{money(mov.totalPagos)}</p>
                </div>
                <div className="rounded-lg bg-ink-50 p-3">
                  <p className="text-xs text-ink-400">Ventas del día ({mov.ventas.length})</p>
                  <p className="mt-0.5 font-bold text-ink-800">{money(mov.totalVentas)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-ink-100 pt-3">
                <span className="font-semibold text-ink-600">Total acumulado</span>
                <span className="text-lg font-extrabold text-brand-600">{money(mov.total)}</span>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => nav('/caja')}>
                Ir a Cierre de Caja
              </Button>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-ink-500">
              <p>No hay una caja abierta. Para registrar pagos y ventas, primero hay que abrir la caja del día.</p>
              <Button size="sm" className="w-full" onClick={() => nav('/caja')}>
                Abrir caja
              </Button>
            </div>
          )}
        </Section>

        <Section title="Recaudación de la semana" subtitle={`${money(semana)} en los últimos 7 días`}>
          <div className="flex h-40 items-end gap-2">
            {dias.map((d) => (
              <div key={d.f} className="group relative flex flex-1 flex-col items-center gap-1.5">
                <div className="pointer-events-none absolute -top-9 z-10 hidden whitespace-nowrap rounded-md bg-ink-800 px-2 py-1 text-[11px] font-semibold text-white group-hover:block">{money(d.total)}</div>
                <div className="flex w-full flex-col justify-end overflow-hidden rounded-md bg-ink-50" style={{ height: 128 }}>
                  <div className="w-full bg-brand-300" style={{ height: `${(d.ventas / max) * 100}%` }} />
                  <div className={cx('w-full', d.f === hoy ? 'bg-brand-600' : 'bg-brand-500')} style={{ height: `${(d.pagos / max) * 100}%` }} />
                </div>
                <span className={cx('text-[11px]', d.f === hoy ? 'font-bold text-brand-600' : 'text-ink-400')}>{DIAS[new Date(d.f + 'T12:00').getDay()].slice(0, 3)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-[11px] text-ink-400">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-brand-500" />Cuotas</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-brand-300" />Ventas</span>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Socios con cuotas vencidas"
          accent={false}
          actions={
            <Link to="/reportes" className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
              Ver reporte <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <ul className="divide-y divide-ink-100">
            {vencidos.slice(0, 5).map((s) => {
              const deuda = state.cuotas.filter((c) => c.socioDni === s.dni && !c.pagoId)
              return (
                <li key={s.dni} className="flex items-center justify-between gap-3 py-2.5">
                  <Link to={`/socios/${s.dni}`} className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-700 hover:text-brand-600">
                      {s.nombre} {s.apellido}
                    </p>
                    <p className="text-xs text-ink-400">
                      DNI {s.dni} · {deuda.length} cuota{deuda.length > 1 ? 's' : ''} adeudada{deuda.length > 1 ? 's' : ''}
                    </p>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => nav(`/pagos?dni=${s.dni}`)}>
                    Cobrar {money(deuda.reduce((a, c) => a + c.valor, 0))}
                  </Button>
                </li>
              )
            })}
            {vencidos.length === 0 && <li className="py-6 text-center text-sm text-ink-400">No hay socios con cuotas vencidas.</li>}
          </ul>
        </Section>

        <Section title="Últimos movimientos" accent={false} actions={<TrendingUp className="h-4 w-4 text-ink-300" />}>
          <ul className="divide-y divide-ink-100">
            {ultimos.map((m, i) => (
              <li key={i} className="flex items-center gap-3 py-2.5">
                <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', m.tipo === 'Pago' ? 'bg-brand-50 text-brand-600' : 'bg-sky-50 text-sky-600')}>
                  {m.tipo === 'Pago' ? <CreditCard className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-700">{m.detalle}</p>
                  <p className="text-xs text-ink-400">
                    {m.tipo === 'Pago' ? 'Pago de cuota' : 'Venta'} · {m.fecha.slice(0, 10) === hoy ? `hoy ${fmtTime(m.fecha)}` : m.fecha.slice(0, 10).split('-').reverse().join('/')}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cx('text-sm font-semibold tabular-nums', m.estado.startsWith('Anulad') ? 'text-ink-300 line-through' : 'text-ink-800')}>{money(m.monto)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  )
}
