import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, Search, X, XCircle } from 'lucide-react'

export const cx = (...c) => c.filter(Boolean).join(' ')

// ---------- Botones ----------

const VARIANTS = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/20',
  outline: 'border border-brand-500 text-brand-600 bg-white hover:bg-brand-50',
  ghost: 'text-ink-600 hover:bg-ink-100',
  subtle: 'bg-ink-100 text-ink-700 hover:bg-ink-200',
  danger: 'bg-danger-500 text-white hover:bg-danger-600',
  'danger-outline': 'border border-danger-500/40 text-danger-500 bg-white hover:bg-danger-50',
}

export function Button({ variant = 'primary', size = 'md', icon: Icon, className, children, ...props }) {
  const sizes = { sm: 'h-8 px-3 text-xs gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-6 text-sm gap-2' }
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 whitespace-nowrap',
        VARIANTS[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      {children}
    </button>
  )
}

export function IconButton({ icon: Icon, title, variant = 'ghost', className, ...props }) {
  const v = {
    ghost: 'text-ink-500 hover:bg-ink-100 hover:text-ink-700',
    danger: 'text-danger-500 border border-danger-500/30 hover:bg-danger-50',
    brand: 'text-brand-600 hover:bg-brand-50',
  }
  return (
    <button title={title} aria-label={title} className={cx('inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors', v[variant], className)} {...props}>
      <Icon className="h-4 w-4" />
    </button>
  )
}

// ---------- Contenedores ----------

export function Card({ className, children, accent }) {
  return (
    <div className={cx('relative rounded-xl border border-ink-100 bg-white shadow-card', accent && 'overflow-hidden', className)}>
      {accent && <span className={cx('absolute inset-y-0 left-0 w-1', accent)} />}
      {children}
    </div>
  )
}

export function Section({ title, subtitle, actions, children, className, accent = true }) {
  return (
    <Card accent={accent ? 'bg-brand-500' : undefined} className={className}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 sm:px-6">
          <div>
            {title && <h3 className="text-[15px] font-semibold text-brand-600">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="px-5 pb-5 pt-3 sm:px-6">{children}</div>
    </Card>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-800">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-ink-100 bg-white p-1 shadow-card">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            value === t.value ? 'bg-brand-500 text-white shadow-sm' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-700',
          )}
        >
          {t.icon && <t.icon className="h-4 w-4" />}
          {t.label}
          {t.count != null && (
            <span className={cx('rounded-full px-1.5 text-[11px] font-semibold', value === t.value ? 'bg-white/25' : 'bg-ink-100 text-ink-500')}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

// ---------- Formularios ----------

export function Field({ label, hint, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="mb-1.5 block text-xs font-medium text-ink-500">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-400">{hint}</span>}
    </label>
  )
}

const inputCls =
  'h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-800 placeholder:text-ink-300 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:bg-ink-50 disabled:text-ink-500'

export const Input = ({ className, ...p }) => <input className={cx(inputCls, className)} {...p} />
export const Textarea = ({ className, ...p }) => <textarea className={cx(inputCls, 'h-auto py-2', className)} {...p} />
export const Select = ({ className, children, ...p }) => (
  <select className={cx(inputCls, 'appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 20 20%27 fill=%27%236b7c92%27%3E%3Cpath d=%27M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z%27/%3E%3C/svg%3E")] bg-[length:18px] bg-[right_10px_center] bg-no-repeat pr-9', className)} {...p}>
    {children}
  </select>
)

export function SearchInput({ value, onChange, placeholder = 'Buscar...', className }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  )
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-ink-200 bg-ink-50 p-0.5">
      {options.map((o) => (
        <button
          type="button"
          key={o}
          onClick={() => onChange(o)}
          className={cx('rounded-md px-3 py-1.5 text-sm font-medium transition', value === o ? 'bg-white text-brand-600 shadow-sm' : 'text-ink-500 hover:text-ink-700')}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export function ErrorBox({ children }) {
  if (!children) return null
  return (
    <div className="flex items-start gap-2 rounded-lg border border-danger-500/20 bg-danger-50 px-3 py-2.5 text-sm text-danger-600">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

export function InfoBox({ children, tone = 'info' }) {
  const t = {
    info: 'border-brand-500/20 bg-brand-50 text-brand-800',
    warn: 'border-warn-500/30 bg-warn-50 text-warn-600',
  }
  return (
    <div className={cx('flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm', t[tone])}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

// ---------- Badges de estado ----------

const BADGE = {
  'Al día': 'bg-brand-50 text-brand-700 ring-brand-500/20',
  Activo: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  Activa: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  Pagada: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  Registrado: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  Confirmada: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  Recibida: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  Abierta: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  Pagado: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  Vencido: 'bg-warn-50 text-warn-600 ring-warn-500/25',
  Vencida: 'bg-warn-50 text-warn-600 ring-warn-500/25',
  'Recibida con observaciones': 'bg-warn-50 text-warn-600 ring-warn-500/25',
  'Stock bajo': 'bg-warn-50 text-warn-600 ring-warn-500/25',
  'A pagar': 'bg-warn-50 text-warn-600 ring-warn-500/25',
  Pendiente: 'bg-sky-50 text-sky-700 ring-sky-500/20',
  Baja: 'bg-ink-100 text-ink-500 ring-ink-300/40',
  Finalizada: 'bg-ink-100 text-ink-500 ring-ink-300/40',
  Cerrada: 'bg-ink-100 text-ink-500 ring-ink-300/40',
  Anulado: 'bg-danger-50 text-danger-500 ring-danger-500/20',
  Anulada: 'bg-danger-50 text-danger-500 ring-danger-500/20',
  'Sin stock': 'bg-danger-50 text-danger-500 ring-danger-500/20',
}

export function Badge({ children, className }) {
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', BADGE[children] ?? 'bg-ink-50 text-ink-600 ring-ink-200', className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  )
}

// ---------- Tabla ----------

export function Table({ columns, rows, empty = 'No hay datos para mostrar.', rowKey = (r, i) => r.id ?? i, footer, onRowClick, dense }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-100 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-50/70">
              {columns.map((c) => (
                <th key={c.key ?? c.header} className={cx('whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-700', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-ink-400">
                  {empty}
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={rowKey(r, i)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cx('transition-colors hover:bg-ink-50/60', onRowClick && 'cursor-pointer')}>
                {columns.map((c) => (
                  <td key={c.key ?? c.header} className={cx('px-4 text-ink-700', dense ? 'py-2' : 'py-3', c.align === 'right' && 'text-right tabular-nums', c.align === 'center' && 'text-center', c.className)}>
                    {c.render ? c.render(r, i) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer && <div className="border-t border-ink-100 bg-ink-50/50 px-4 py-2.5 text-xs text-ink-400">{footer}</div>}
    </div>
  )
}

// ---------- Modal ----------

export function Modal({ open, onClose, title, children, footer, size = 'md', icon: Icon, tone = 'brand' }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  const w = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' }
  const tones = { brand: 'bg-brand-50 text-brand-600', danger: 'bg-danger-50 text-danger-500', warn: 'bg-warn-50 text-warn-600' }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 no-print-backdrop">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-[2px] animate-fade" onClick={onClose} />
      <div className={cx('relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl animate-pop sm:rounded-2xl', w[size])}>
        <div className="flex items-start gap-3 border-b border-ink-100 px-6 py-4">
          {Icon && (
            <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', tones[tone])}>
              <Icon className="h-5 w-5" />
            </span>
          )}
          <h2 className="flex-1 pt-1.5 text-base font-semibold text-ink-800">{title}</h2>
          <IconButton icon={X} title="Cerrar" onClick={onClose} />
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 bg-ink-50/50 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Confirm({ open, onClose, onConfirm, title, children, confirmText = 'Confirmar', tone = 'danger', icon = AlertTriangle }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon={icon}
      tone={tone}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="text-sm text-ink-600">{children}</div>
    </Modal>
  )
}

// Pantalla final de confirmación (con "Aceptar"), como en las plantillas de pantalla.
export function SuccessModal({ open, onClose, title, rows = [], extra, children }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" icon={CheckCircle2} footer={<>{extra}<Button onClick={onClose}>Aceptar</Button></>}>
      {children}
      {rows.length > 0 && (
        <dl className="divide-y divide-ink-100 rounded-xl border border-ink-100 bg-ink-50/40 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt className="text-ink-400">{k}</dt>
              <dd className="text-right font-medium text-ink-800">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </Modal>
  )
}

export function Empty({ icon: Icon = Info, title, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-50 text-ink-400">
        <Icon className="h-6 w-6" />
      </span>
      <p className="font-semibold text-ink-700">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-ink-400">{children}</div>}
    </div>
  )
}

export function Avatar({ text, className }) {
  return <span className={cx('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700', className)}>{text}</span>
}

// ---------- Avisos (toast) ----------

const ToastCtx = createContext(() => {})

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((msg, tone = 'success') => {
    const id = Math.random()
    setItems((x) => [...x, { id, msg, tone }])
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3800)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-700 shadow-xl animate-pop">
            {t.tone === 'error' ? <XCircle className="h-5 w-5 shrink-0 text-danger-500" /> : <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-500" />}
            <span className="pt-0.5">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
