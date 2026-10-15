import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as logic from './logic'
import { buildSeed } from './seed'
import { todayISO } from './utils'

const KEY = 'gimnasio-xtreme-prototipo-v1'
const Ctx = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* sin almacenamiento disponible */
  }
  return null
}

const ACTIONS = [
  'iniciarSesion', 'cerrarSesion',
  'registrarSocio', 'modificarSocio', 'bajaSocio', 'reactivarSocio',
  'registrarValorCuota', 'modificarValorCuota', 'registrarPago', 'anularPago',
  'abrirCaja', 'cerrarCaja',
  'registrarProducto', 'modificarProducto', 'bajaProducto', 'ajustarStock',
  'registrarVenta', 'anularVenta',
  'registrarProveedor', 'modificarProveedor', 'bajaProveedor', 'registrarCompra', 'registrarRecepcion', 'pagarProveedor',
  'registrarEntrenador', 'modificarEntrenador', 'bajaEntrenador', 'asignarEntrenador', 'pagarEntrenador',
  'registrarUsuario', 'modificarUsuario', 'bajaUsuario',
]

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => logic.generarCuotas(load() ?? buildSeed()))
  const ref = useRef(state)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* sin almacenamiento disponible */
    }
  }, [state])

  const mutate = useCallback((fn) => {
    const draft = structuredClone(ref.current)
    const result = fn(draft)
    ref.current = draft
    setState(draft)
    return result
  }, [])

  const api = useMemo(() => {
    const a = {}
    for (const name of ACTIONS) a[name] = (...args) => mutate((d) => logic[name](d, ...args))
    a.reset = () => mutate(() => logic.generarCuotas({ ...buildSeed(), sesion: ref.current.sesion }))
    return a
  }, [mutate])

  const value = useMemo(() => {
    const hoy = todayISO()
    const estadoSocio = new Map(state.socios.map((s) => [s.dni, 'Al día']))
    for (const s of state.socios) if (s.baja) estadoSocio.set(s.dni, 'Baja')
    for (const c of state.cuotas) if (!c.pagoId && c.vencimiento < hoy && estadoSocio.get(c.socioDni) === 'Al día') estadoSocio.set(c.socioDni, 'Vencido')
    return { state, api, hoy, estadoSocio, usuario: logic.usuarioActual(state) }
  }, [state, api])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
