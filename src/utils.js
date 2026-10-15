export const pad = (n, l = 4) => String(n).padStart(l, '0')

export const money = (n) => '$ ' + Math.round(Number(n) || 0).toLocaleString('es-AR')

export const toISODate = (d) => {
  const z = new Date(d)
  return `${z.getFullYear()}-${pad(z.getMonth() + 1, 2)}-${pad(z.getDate(), 2)}`
}

export const todayISO = () => toISODate(new Date())

export const nowISO = () => {
  const z = new Date()
  return `${toISODate(z)}T${pad(z.getHours(), 2)}:${pad(z.getMinutes(), 2)}`
}

export const addDays = (d, n) => {
  const z = new Date(d)
  z.setDate(z.getDate() + n)
  return z
}

export const fmtDate = (iso) => {
  if (!iso) return '-'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export const fmtDateTime = (iso) => (iso ? `${fmtDate(iso)} ${iso.slice(11, 16)}` : '-')
export const fmtTime = (iso) => (iso ? iso.slice(11, 16) : '-')

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export const monthKey = (iso) => iso.slice(0, 7)
export const addMonthKey = (key, n) => {
  const [y, m] = key.split('-').map(Number)
  const t = y * 12 + (m - 1) + n
  return `${Math.floor(t / 12)}-${pad((t % 12) + 1, 2)}`
}
export const periodoLabel = (key) => {
  const [y, m] = key.split('-').map(Number)
  return `${MESES[m - 1]} ${y}`
}

export const fechaLarga = (d = new Date()) => {
  const z = new Date(d)
  return `${DIAS[z.getDay()]} ${fmtDate(toISODate(z))}`
}

export const code = (prefix, n) => `${prefix}-${pad(n)}`

export const normalize = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

export const initials = (nombre = '', apellido = '') => `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase()

export function rng(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
