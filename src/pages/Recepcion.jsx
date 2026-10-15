import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Inbox } from 'lucide-react'
import { useStore } from '../store'
import { fmtDate, money } from '../utils'
import { Badge, Button, cx, ErrorBox, InfoBox, Input, PageHeader, Section, SuccessModal, Table } from '../components/ui'

export default function Recepcion() {
  const { id } = useParams()
  const { state, api } = useStore()
  const nav = useNavigate()
  const compra = state.compras.find((c) => c.id === Number(id))
  const [vals, setVals] = useState(() => compra?.detalles.map((d) => ({ cantRecibida: String(d.cantSolicitada), precioUnit: '' })) ?? [])
  const [error, setError] = useState('')
  const [ok, setOk] = useState(null)

  if (!compra || (compra.estado !== 'Pendiente' && !ok)) return <Navigate to="/compras?tab=pendientes" replace />
  const prov = state.proveedores.find((p) => p.id === compra.proveedorId)
  const total = vals.reduce((a, v) => a + (Number(v.cantRecibida) || 0) * (Number(v.precioUnit) || 0), 0)
  const set = (i, k) => (e) => setVals(vals.map((v, j) => (j === i ? { ...v, [k]: e.target.value } : v)))

  const confirmar = () => {
    try {
      setOk(api.registrarRecepcion(compra.id, vals.map((v) => ({ cantRecibida: Number(v.cantRecibida), precioUnit: Number(v.precioUnit) }))))
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Registrar Recepción de Compra"
        subtitle={`${compra.numero} · ${prov?.nombre} · pedida el ${fmtDate(compra.fecha)}`}
        actions={
          <Button variant="ghost" icon={ArrowLeft} onClick={() => nav('/compras?tab=pendientes')}>
            Compras pendientes
          </Button>
        }
      />
      <div className="space-y-6">
        <Section title={`Recepción de la compra ${compra.numero} · ${prov?.nombre}`} subtitle="Ingresá la cantidad recibida y el precio unitario de cada producto.">
          <Table
            rows={compra.detalles}
            rowKey={(d) => d.productoId}
            columns={[
              { header: 'Producto', render: (d) => state.productos.find((p) => p.id === d.productoId)?.nombre },
              { header: 'Cant. solicitada', align: 'center', render: (d) => d.cantSolicitada },
              {
                header: 'Cant. recibida',
                render: (d, i) => (
                  <Input
                    type="number"
                    min="0"
                    value={vals[i].cantRecibida}
                    onChange={set(i, 'cantRecibida')}
                    className={cx('h-9 w-24', Number(vals[i].cantRecibida) !== d.cantSolicitada && 'border-warn-500 bg-warn-50/50')}
                  />
                ),
              },
              { header: 'Precio unit. ($)', render: (d, i) => <Input type="number" min="1" value={vals[i].precioUnit} onChange={set(i, 'precioUnit')} placeholder="0" className="h-9 w-32" /> },
              { header: 'Subtotal', align: 'right', render: (d, i) => money((Number(vals[i].cantRecibida) || 0) * (Number(vals[i].precioUnit) || 0)) },
            ]}
          />
          <div className="mt-4 flex justify-end">
            <p className="text-lg font-bold text-ink-800">Total: {money(total)}</p>
          </div>
        </Section>
        <InfoBox>
          Al confirmar se incrementa el stock y la compra pasa a <b>Recibida</b>, o a <b>Recibida con observaciones</b> si hay diferencias con lo solicitado.
        </InfoBox>
        <ErrorBox>{error}</ErrorBox>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" size="lg" className="min-w-[140px]" onClick={() => nav('/compras?tab=pendientes')}>
            Cancelar
          </Button>
          <Button size="lg" icon={Inbox} className="min-w-[190px]" onClick={confirmar}>
            Confirmar Recepción
          </Button>
        </div>
      </div>
      <SuccessModal
        open={!!ok}
        onClose={() => nav('/compras?tab=todas')}
        title="Recepción registrada correctamente"
        rows={ok ? [['Compra', ok.numero], ['Proveedor', prov?.nombre], ['Total', money(ok.total)], ['Estado', <Badge key="e">{ok.estado}</Badge>]] : []}
      >
        {ok?.observaciones && <p className="mb-4 rounded-lg bg-warn-50 px-3 py-2 text-sm text-warn-600">{ok.observaciones}</p>}
      </SuccessModal>
    </>
  )
}
