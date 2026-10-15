import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3, Building2, ChevronDown, CreditCard, Dumbbell, LayoutDashboard, LogOut, Menu, Package, RotateCcw, ShoppingCart, Truck, UserCog, Users, Wallet, X,
} from 'lucide-react'
import { useStore } from '../store'
import { cajaAbierta } from '../logic'
import { fechaLarga, fmtTime } from '../utils'
import { Avatar, Confirm, cx, useToast } from './ui'

export const NAV = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/socios', label: 'Socios', icon: Users },
  { to: '/pagos', label: 'Cuotas y Pagos', icon: CreditCard },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { to: '/inventario', label: 'Inventario', icon: Package },
  { to: '/compras', label: 'Compras', icon: Truck, soloPropietario: true },
  { to: '/proveedores', label: 'Proveedores', icon: Building2, soloPropietario: true },
  { to: '/entrenadores', label: 'Entrenadores', icon: Dumbbell },
  { to: '/caja', label: 'Caja', icon: Wallet },
  { to: '/usuarios', label: 'Usuarios', icon: UserCog, soloPropietario: true },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
]

export function Brand({ dark = true }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 shadow-lg shadow-brand-500/30">
        <Dumbbell className="h-5 w-5 text-white" />
      </span>
      <div className="leading-tight">
        <p className={cx('text-[15px] font-extrabold tracking-wide', dark ? 'text-white' : 'text-ink-800')}>GIMNASIO XTREME</p>
        <p className={cx('text-[11px]', dark ? 'text-white/50' : 'text-ink-400')}>Sistema de Gestión</p>
      </div>
    </div>
  )
}

function Sidebar({ onNavigate }) {
  const { usuario } = useStore()
  const items = NAV.filter((n) => !n.soloPropietario || usuario?.rol === 'Propietario')
  return (
    <nav className="flex h-full flex-col bg-ink-800">
      <div className="flex h-16 items-center border-b border-white/5 bg-ink-900/40 px-5">
        <Brand />
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-ink-200 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <n.icon className="h-[18px] w-[18px] opacity-90" />
            {n.label}
          </NavLink>
        ))}
      </div>
      <div className="border-t border-white/5 px-5 py-4 text-[11px] leading-relaxed text-white/40">Prototipo funcional · Seminario de Sistemas UNSa 2026</div>
    </nav>
  )
}

function UserMenu() {
  const { usuario, api } = useStore()
  const nav = useNavigate()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [reset, setReset] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const ini = usuario?.nombre?.split(' ').map((p) => p[0]).join('').slice(0, 2)
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2 transition hover:bg-ink-50">
        <Avatar text={ini} />
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-sm font-semibold text-ink-700">{usuario?.nombre}</p>
          <p className="text-[11px] text-ink-400">{usuario?.rol}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-ink-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-xl animate-pop">
          <div className="border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-semibold">{usuario?.nombre}</p>
            <p className="text-xs text-ink-400">
              {usuario?.rol} · @{usuario?.usuario}
            </p>
          </div>
          <button
            onClick={() => {
              setOpen(false)
              setReset(true)
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink-600 hover:bg-ink-50"
          >
            <RotateCcw className="h-4 w-4" /> Restaurar datos de ejemplo
          </button>
          <button
            onClick={() => {
              api.cerrarSesion()
              nav('/login')
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger-500 hover:bg-danger-50"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      )}
      <Confirm
        open={reset}
        onClose={() => setReset(false)}
        title="Restaurar datos de ejemplo"
        tone="warn"
        confirmText="Restaurar"
        onConfirm={() => {
          api.reset()
          setReset(false)
          toast('Se restauraron los datos de ejemplo.')
        }}
      >
        Se descartan todos los cambios hechos en el prototipo y se vuelven a cargar los datos iniciales.
      </Confirm>
    </div>
  )
}

export default function Layout() {
  const { state } = useStore()
  const [mobile, setMobile] = useState(false)
  const loc = useLocation()
  const caja = cajaAbierta(state)
  useEffect(() => {
    setMobile(false)
    window.scrollTo(0, 0)
  }, [loc.pathname])

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 w-64">
          <Sidebar />
        </div>
      </aside>
      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/60 animate-fade" onClick={() => setMobile(false)} />
          <div className="absolute inset-y-0 left-0 w-72 animate-pop">
            <Sidebar onNavigate={() => setMobile(false)} />
            <button onClick={() => setMobile(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-white/70 hover:bg-white/10" aria-label="Cerrar menú">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-100 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 lg:hidden" onClick={() => setMobile(true)} aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-extrabold tracking-wide text-ink-800 lg:hidden">GIMNASIO XTREME</p>
          <p className="hidden text-sm text-ink-400 lg:block">{fechaLarga()}</p>
          <div className="flex-1" />
          <NavLink
            to="/caja"
            className={cx(
              'hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset sm:flex',
              caja ? 'bg-brand-50 text-brand-700 ring-brand-500/20' : 'bg-warn-50 text-warn-600 ring-warn-500/30',
            )}
          >
            <span className={cx('h-2 w-2 rounded-full', caja ? 'animate-pulse bg-brand-500' : 'bg-warn-500')} />
            {caja ? `${caja.numero} abierta desde ${fmtTime(caja.apertura)}` : 'Caja cerrada'}
          </NavLink>
          <UserMenu />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
