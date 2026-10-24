import { Ban } from 'lucide-react'
import { fmtDate } from '../utils'
import { Badge, Button, InfoBox, Modal } from './ui'

// CU08 y CU15: muestra la operación con el estado de la caja en la que se registró.
// Si esa caja ya está cerrada, informa que no se puede anular (fallo 4c).
export default function AnularModal({ open, onClose, onConfirm, title, caja, rows = [], children }) {
  const abierta = caja?.estado === 'Abierta'
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon={Ban}
      tone="danger"
      size="sm"
      footer={
        abierta ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={onConfirm}>
              Confirmar anulación
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Aceptar</Button>
        )
      }
    >
      <div className="space-y-4 text-sm">
        <dl className="divide-y divide-ink-100 rounded-xl border border-ink-100">
          {[...rows, ['Caja', caja ? <span key="c" className="flex items-center justify-end gap-2">{caja.numero} · {fmtDate(caja.apertura)} <Badge>{caja.estado}</Badge></span> : <Badge key="c">Cerrada</Badge>]].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt className="text-ink-400">{k}</dt>
              <dd className="text-right font-medium text-ink-800">{v}</dd>
            </div>
          ))}
        </dl>
        {abierta ? <p className="text-ink-600">{children}</p> : <InfoBox tone="warn">No se puede anular una operación registrada en una caja cerrada.</InfoBox>}
      </div>
    </Modal>
  )
}
