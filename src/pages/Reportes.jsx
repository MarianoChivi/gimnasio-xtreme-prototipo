import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, BarChart3, PackageX } from 'lucide-react'
import { useStore } from '../store'
import { stockBajo } from '../logic'
import { addDays, fmtDate, money, toISODate } from '../utils'
import { Badge, Button, Card, ErrorBox, Field, Input, PageHeader, Table, Tabs } from '../components/ui'

function Kpi({ label, value, tone = 'text-ink-800' }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-ink-400">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tone}`}>{value}</p>
    </Card>
  )
}

function CuotasVencidas() {
  const { state, estadoSocio, hoy } = useStore()
  const rows = state.socios
    .filter((s) => estadoSocio.get(s.dni) === 'Vencido')
    .map((s) => {
      const vencidas = state.cuotas.filter((c) => c.socioDni === s.dni && !c.pagoId && c.vencimiento < hoy).sort((a, b) => a.vencimiento.localeCompare(b.vencimiento))
      return { ...s, vencidas, deuda: vencidas.reduce((a, c) => a + c.valor, 0), desde: vencidas[0]?.vencimiento }
    })
    .sort((a, b) => b.vencidas.length - a.vencidas.length)
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Socios con cuotas vencidas" value={rows.length} tone="text-warn-600" />
        <Kpi label="Cuotas vencidas" value={rows.reduce((a, r) => a + r.vencidas.length, 0)} />
        <Kpi label="Monto adeudado" value={money(rows.reduce((a, r) => a + r.deuda, 0))} />
      </div>
      <Table
        rows={rows}
        rowKey={(r) => r.dni}
        empty="No hay socios con cuotas vencidas."
        footer={`Generado el ${fmtDate(hoy)}`}
        columns={[
          { header: 'Socio', render: (r) => <Link className="font-medium hover:text-brand-600" to={`/socios/${r.dni}`}>{r.apellido}, {r.nombre}</Link> },
          { header: 'DNI', key: 'dni' },
          { header: 'Teléfono', key: 'telefono', className: 'hidden md:table-cell' },
          { header: 'Vencida desde', render: (r) => fmtDate(r.desde) },
          { header: 'Cuotas', align: 'center', render: (r) => r.vencidas.length },
          { header: 'Deuda', align: 'right', render: (r) => <b>{money(r.deuda)}</b> },
          { header: '', align: 'right', render: (r) => <Link to={`/pagos?dni=${r.dni}`}><Button size="sm" variant="outline">Cobrar</Button></Link> },
        ]}
      />
    </div>
  )
}

function Recaudacion() {
  const { state, hoy } = useStore()
  const [desde, setDesde] = useState(toISODate(addDays(new Date(), -13)))
  const [hasta, setHasta] = useState(hoy)
  const invalido = desde > hasta
  const dias = []
  if (!invalido) {
    for (let f = desde; f <= hasta; f = toISODate(addDays(new Date(f + 'T12:00'), 1))) {
      const pagos = state.pagos.filter((p) => p.fecha.startsWith(f) && p.estado !== 'Anulado')
      const ventas = state.ventas.filter((v) => v.fecha.startsWith(f) && v.estado !== 'Anulada')
      const tp = pagos.reduce((a, p) => a + p.monto, 0)
      const tv = ventas.reduce((a, v) => a + v.total, 0)
      if (pagos.length || ventas.length) dias.push({ f, cp: pagos.length, tp, cv: ventas.length, tv, total: tp + tv })
      if (dias.length > 400) break
    }
  }
  const tot = dias.reduce((a, d) => ({ tp: a.tp + d.tp, tv: a.tv + d.tv }), { tp: 0, tv: 0 })
  const max = Math.max(...dias.map((d) => d.total), 1)
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-4 p-4">
        <Field label="Desde">
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </Field>
        <Field label="Hasta">
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </Field>
        <p className="pb-2.5 text-xs text-ink-400">No se cuentan los pagos ni las ventas anulados.</p>
      </Card>
      {invalido ? (
        <ErrorBox>El rango de fechas no es válido: la fecha desde es posterior a la fecha hasta.</ErrorBox>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label="Cuotas cobradas" value={money(tot.tp)} />
            <Kpi label="Ventas de productos" value={money(tot.tv)} />
            <Kpi label="Recaudación total" value={money(tot.tp + tot.tv)} tone="text-brand-600" />
          </div>
          {dias.length > 0 && (
            <Card className="p-5">
              <div className="flex h-44 items-end gap-1">
                {dias.map((d) => (
                  <div key={d.f} className="group relative flex h-full flex-1 flex-col justify-end" title={`${fmtDate(d.f)}: ${money(d.total)}`}>
                    <div className="w-full rounded-t bg-brand-300" style={{ height: `${(d.tv / max) * 100}%` }} />
                    <div className="w-full bg-brand-500" style={{ height: `${(d.tp / max) * 100}%` }} />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-ink-400">
                <span>{fmtDate(dias[0].f)}</span>
                <span>{fmtDate(dias[dias.length - 1].f)}</span>
              </div>
            </Card>
          )}
          <Table
            dense
            rows={[...dias].reverse()}
            rowKey={(d) => d.f}
            empty="No hay movimientos en el período seleccionado."
            columns={[
              { header: 'Fecha', render: (d) => fmtDate(d.f) },
              { header: 'Pagos', align: 'center', key: 'cp' },
              { header: 'Cuotas', align: 'right', render: (d) => money(d.tp) },
              { header: 'Ventas', align: 'center', key: 'cv', className: 'hidden sm:table-cell' },
              { header: 'Productos', align: 'right', render: (d) => money(d.tv) },
              { header: 'Total', align: 'right', render: (d) => <b>{money(d.total)}</b> },
            ]}
          />
        </>
      )}
    </div>
  )
}

function StockBajo() {
  const { state, usuario } = useStore()
  const rows = stockBajo(state).sort((a, b) => a.stock / a.stockMinimo - b.stock / b.stockMinimo)
  return (
    <div className="space-y-4">
      <Table
        rows={rows}
        empty="No hay productos por debajo del stock mínimo."
        footer={`${rows.length} producto${rows.length === 1 ? '' : 's'} por debajo del stock mínimo`}
        columns={[
          { header: 'Producto', render: (p) => <span className="font-medium">{p.nombre}</span> },
          { header: 'Categoría', key: 'categoria' },
          { header: 'Stock', align: 'center', render: (p) => <b className="text-warn-600">{p.stock}</b> },
          { header: 'Mínimo', align: 'center', key: 'stockMinimo' },
          { header: 'Faltante', align: 'center', render: (p) => p.stockMinimo - p.stock },
          { header: 'Estado', render: (p) => <Badge>{p.stock === 0 ? 'Sin stock' : 'Stock bajo'}</Badge> },
        ]}
      />
      {usuario.rol === 'Propietario' && rows.length > 0 && (
        <div className="flex justify-end">
          <Link to="/compras">
            <Button>Registrar compra</Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default function Reportes() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'vencidas'
  return (
    <>
      <PageHeader title="Reportes" subtitle="Información para el seguimiento del gimnasio." />
      <Tabs
        value={tab}
        onChange={(v) => setParams(v === 'vencidas' ? {} : { tab: v })}
        tabs={[
          { value: 'vencidas', label: 'Socios con cuotas vencidas', icon: AlertTriangle },
          { value: 'recaudacion', label: 'Recaudación por período', icon: BarChart3 },
          { value: 'stock', label: 'Productos con stock bajo', icon: PackageX },
        ]}
      />
      {tab === 'vencidas' && <CuotasVencidas />}
      {tab === 'recaudacion' && <Recaudacion />}
      {tab === 'stock' && <StockBajo />}
    </>
  )
}
