import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CreditCard, Eye, EyeOff, LogIn, Package, ShieldCheck, Users } from 'lucide-react'
import { useStore } from '../store'
import { Brand } from '../components/Layout'
import { Button, ErrorBox, Field, Input } from '../components/ui'

const DEMO = [
  { usuario: 'admin', contrasena: 'admin123', rol: 'Propietario' },
  { usuario: 'recepcion', contrasena: 'recep123', rol: 'Recepcionista' },
]

export default function Login() {
  const { usuario, api } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const [form, setForm] = useState({ usuario: '', contrasena: '' })
  const [ver, setVer] = useState(false)
  const [error, setError] = useState('')

  if (usuario) return <Navigate to="/" replace />

  const submit = (e) => {
    e.preventDefault()
    try {
      api.iniciarSesion(form.usuario.trim(), form.contrasena)
      nav(loc.state?.from ?? '/', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-ink-800 p-12 lg:flex lg:flex-col">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <Brand />
        <div className="relative my-auto max-w-md">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Gimnasio Xtreme · Salta</p>
          <h1 className="text-4xl font-extrabold leading-tight text-white">
            Toda la gestión del gimnasio, <span className="text-brand-400">en un solo lugar.</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-200">Socios, cuotas, caja, ventas, stock y proveedores. Sin cuadernos, sin planillas sueltas.</p>
          <div className="mt-10 grid gap-4">
            {[
              [Users, 'Socios y estado de cuotas al instante'],
              [CreditCard, 'Pagos con comprobante en PDF'],
              [Package, 'Stock con alertas de mínimo'],
            ].map(([Icon, t]) => (
              <div key={t} className="flex items-center gap-3 text-sm text-ink-100">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                  <Icon className="h-4 w-4 text-brand-400" />
                </span>
                {t}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/40">Prototipo funcional · Seminario de Sistemas · FCEx UNSa 2026</p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 rounded-xl bg-ink-800 p-4 lg:hidden">
            <Brand />
          </div>
          <h2 className="text-2xl font-bold text-ink-800">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-ink-400">Ingresá con tu usuario para acceder al sistema.</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Usuario">
              <Input autoFocus value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} placeholder="Ingrese su usuario" autoComplete="username" />
            </Field>
            <Field label="Contraseña">
              <div className="relative">
                <Input type={ver ? 'text' : 'password'} value={form.contrasena} onChange={(e) => setForm({ ...form, contrasena: e.target.value })} placeholder="••••••••" autoComplete="current-password" className="pr-10" />
                <button type="button" onClick={() => setVer((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-600" aria-label="Mostrar contraseña">
                  {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <ErrorBox>{error}</ErrorBox>
            <Button type="submit" size="lg" icon={LogIn} className="w-full">
              Ingresar
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-dashed border-ink-200 bg-white p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-ink-500">
              <ShieldCheck className="h-4 w-4 text-brand-500" /> Usuarios de demostración
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO.map((u) => (
                <button
                  key={u.usuario}
                  type="button"
                  onClick={() => {
                    setForm({ usuario: u.usuario, contrasena: u.contrasena })
                    setError('')
                  }}
                  className="rounded-lg border border-ink-100 px-3 py-2 text-left transition hover:border-brand-400 hover:bg-brand-50"
                >
                  <p className="text-xs font-semibold text-ink-700">{u.rol}</p>
                  <p className="font-mono text-[11px] text-ink-400">
                    {u.usuario} / {u.contrasena}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
