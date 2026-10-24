import { createPortal } from 'react-dom'
import { Download, Dumbbell, FileText } from 'lucide-react'
import { useStore } from '../store'
import { fmtDateTime, money } from '../utils'
import { Button, Modal } from './ui'

function Documento({ c }) {
  return (
    <div className="mx-auto max-w-xl bg-white text-ink-800">
      <div className="flex items-center justify-between rounded-t-xl bg-ink-700 px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500">
            <Dumbbell className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-extrabold tracking-wide">GIMNASIO XTREME</p>
            <p className="text-xs text-white/70">Salta Capital · Documento no válido como factura</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wider text-white/60">Comprobante</p>
          <p className="font-mono text-base font-bold">{c.numero}</p>
        </div>
      </div>
      <div className="relative space-y-5 rounded-b-xl border border-t-0 border-ink-100 px-6 py-5">
        {c.anulado && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 rounded-xl border-4 border-danger-500/70 px-6 py-2 text-4xl font-extrabold tracking-[0.3em] text-danger-500/70">ANULADO</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-400">Tipo</p>
            <p className="font-semibold">{c.tipo}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-ink-400">Fecha de emisión</p>
            <p className="font-semibold">{fmtDateTime(c.fecha)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-400">{c.tipo === 'Pago a proveedor' || c.tipo === 'Pago a entrenador' ? 'Beneficiario' : c.tipo === 'Venta' ? 'Operación' : 'Socio'}</p>
            <p className="font-semibold">{c.destinatario}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-ink-400">Método de pago</p>
            <p className="font-semibold">{c.metodo}</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-brand-500 text-left text-[11px] uppercase tracking-wide text-brand-700">
              <th className="py-2">Concepto</th>
              <th className="py-2 text-center">Cant.</th>
              <th className="py-2 text-right">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {c.lineas.map((l, i) => (
              <tr key={i}>
                <td className="py-2">{l.concepto}</td>
                <td className="py-2 text-center">{l.cantidad}</td>
                <td className="py-2 text-right tabular-nums">{money(l.importe)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3">
          <span className="text-sm font-semibold text-brand-800">Total</span>
          <span className="text-xl font-extrabold text-brand-700">{money(c.monto)}</span>
        </div>
        <p className="text-center text-[11px] text-ink-400">Registrado por {c.usuario || 'el sistema'} · Prototipo funcional con datos de ejemplo</p>
      </div>
    </div>
  )
}

export default function ComprobanteModal({ numero, onClose }) {
  const { state } = useStore()
  const c = state.comprobantes.find((x) => x.numero === numero)
  if (!c) return null
  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`Comprobante ${c.numero}${c.anulado ? ' (anulado)' : ''}`}
        icon={FileText}
        size="lg"
        footer={
          <>
            <Button variant="outline" icon={Download} onClick={() => window.print()}>
              Descargar PDF
            </Button>
            <Button onClick={onClose}>Aceptar</Button>
          </>
        }
      >
        <Documento c={c} />
      </Modal>
      {createPortal(
        <div id="print-root">
          <Documento c={c} />
        </div>,
        document.body,
      )}
    </>
  )
}
