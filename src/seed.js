// Datos de ejemplo del prototipo. Las fechas se calculan a partir del día de hoy
// para que la demostración siempre tenga cuotas vencidas, caja abierta y movimientos.
import { addDays, code, monthKey, addMonthKey, pad, periodoLabel, rng, toISODate } from './utils'
import { generarCuotas, next } from './logic'

const SOCIOS = [
  // dni, nombre, apellido, telefono, meses de antigüedad, cuotas impagas, ¿baja hace n meses?
  ['35111222', 'Juan', 'Pérez', '387 512-3344', 10, 0],
  ['38999111', 'María', 'González', '387 498-1120', 8, 0],
  ['41222333', 'Lucas', 'Díaz', '387 455-7788', 7, 2],
  ['33456789', 'Ana', 'Torres', '387 433-9012', 9, 1, 2],
  ['40123456', 'Martina', 'López', '387 521-6644', 6, 0],
  ['37888999', 'Facundo', 'Romero', '387 467-2210', 12, 1],
  ['42555666', 'Valentina', 'Sosa', '387 590-3381', 4, 0],
  ['36777123', 'Diego', 'Fernández', '387 412-7703', 11, 0],
  ['39654321', 'Camila', 'Ruiz', '387 476-1590', 5, 3],
  ['43210987', 'Tomás', 'Álvarez', '387 503-4412', 3, 0],
  ['34567890', 'Florencia', 'Gutiérrez', '387 488-9021', 10, 0],
  ['41987654', 'Nicolás', 'Martínez', '387 459-6632', 6, 1],
  ['38123987', 'Agustina', 'Herrera', '387 527-1184', 2, 0],
  ['40888777', 'Matías', 'Castro', '387 440-3375', 9, 0],
  ['37345678', 'Lucía', 'Morales', '387 495-8856', 7, 0],
  ['42111000', 'Santiago', 'Ibáñez', '387 563-2047', 1, 0],
]

const PRODUCTOS = [
  ['Proteína Whey 1kg', 'Suplementos', 'Proteína de suero sabor vainilla', 18000, 3, 10],
  ['Creatina 300g', 'Suplementos', 'Creatina monohidrato micronizada', 9000, 2, 8],
  ['Guantes de entrenamiento', 'Accesorios', 'Talles S, M y L', 7500, 4, 6],
  ['Bebida isotónica 500ml', 'Bebidas', 'Sabor naranja', 1500, 48, 20],
  ['Agua mineral 500ml', 'Bebidas', 'Sin gas', 900, 60, 24],
  ['Barra proteica', 'Suplementos', 'Chocolate y maní, 46g', 2200, 35, 15],
  ['Shaker 600ml', 'Accesorios', 'Con compartimento para polvo', 5000, 12, 5],
  ['Toalla de microfibra', 'Accesorios', 'Secado rápido, 40x80 cm', 6500, 9, 4],
  ['Remera dry-fit Xtreme', 'Indumentaria', 'Con logo del gimnasio', 12000, 15, 6],
  ['Pre entreno 300g', 'Suplementos', 'Sabor frutos rojos', 15000, 7, 4],
]

const PROVEEDORES = [
  ['Suplementos SA', '30-71234567-8', '387 431-2200', 'ventas@suplementossa.com.ar'],
  ['Distribuidora Norte', '30-70987654-3', '387 422-8890', 'pedidos@distnorte.com.ar'],
  ['Deportes Salta SRL', '33-71555444-9', '387 415-6612', 'contacto@deportessalta.com.ar'],
]

const ENTRENADORES = [
  ['28444555', 'Pablo', 'Vera', '387 501-1122', 'pablo.vera@mail.com', 'Lun a Vie 07:00 a 13:00'],
  ['31222888', 'Romina', 'Paz', '387 466-3390', 'romina.paz@mail.com', 'Lun a Vie 15:00 a 21:00'],
  ['29666777', 'Germán', 'Ortiz', '387 452-7781', 'german.ortiz@mail.com', 'Mar, Jue y Sáb 09:00 a 14:00'],
  ['33999000', 'Julieta', 'Navarro', '387 517-4409', 'julieta.navarro@mail.com', 'Lun, Mié y Vie 17:00 a 22:00'],
]

export function buildSeed() {
  const hoy = new Date()
  const t = toISODate(hoy)
  const r = rng(2026)
  const hora = (h0 = 8, h1 = 21) => `${pad(h0 + Math.floor(r() * (h1 - h0)), 2)}:${pad(Math.floor(r() * 60), 2)}`
  const metodo = () => (r() < 0.62 ? 'Efectivo' : 'Transferencia')

  const d = {
    version: 1,
    sesion: null,
    seq: {},
    usuarios: [],
    socios: [],
    cuotas: [],
    valoresCuota: [],
    pagos: [],
    cajas: [],
    productos: [],
    ajustes: [],
    ventas: [],
    proveedores: [],
    compras: [],
    entrenadores: [],
    asignaciones: [],
    pagosEntrenador: [],
    comprobantes: [],
  }

  d.usuarios.push(
    { id: next(d, 'usuario'), usuario: 'admin', contrasena: 'admin123', nombre: 'Carlos Gómez', rol: 'Propietario', estado: 'Activo' },
    { id: next(d, 'usuario'), usuario: 'recepcion', contrasena: 'recep123', nombre: 'Sofía Rivas', rol: 'Recepcionista', estado: 'Activo' },
  )

  const mes = monthKey(t)
  d.valoresCuota.push(
    { id: next(d, 'valorCuota'), valor: 13000, fechaDesde: `${addMonthKey(mes, -14)}-01`, fechaRegistro: `${addMonthKey(mes, -15)}-20` },
    { id: next(d, 'valorCuota'), valor: 15000, fechaDesde: `${addMonthKey(mes, -4)}-01`, fechaRegistro: `${addMonthKey(mes, -5)}-22` },
  )

  for (const [dni, nombre, apellido, telefono, meses, , bajaHace] of SOCIOS) {
    const ingreso = `${addMonthKey(mes, -meses)}-${pad(3 + Math.floor(r() * 7), 2)}`
    const s = {
      dni,
      nombre,
      apellido,
      telefono,
      email: `${nombre}.${apellido}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '@mail.com',
      fechaIngreso: ingreso,
      cuotasDesde: ingreso,
      baja: !!bajaHace,
      fechaBaja: bajaHace ? `${addMonthKey(mes, -bajaHace)}-15` : null,
    }
    d.socios.push(s)
  }
  generarCuotas(d, t)

  // Pagos de cuotas: todas pagadas salvo las últimas "impagas" de cada socio.
  const pagosHoy = new Set(['38999111', '40123456', '43210987', '34567890'])
  const pagosAyer = new Set(['36777123', '37345678'])
  const comprobante = (fecha, tipo, refId, monto, metodoPago, destinatario, lineas) => {
    const c = { numero: code('COMP', next(d, 'comprobante')), fecha, tipo, refId, monto, metodo: metodoPago, destinatario, lineas, usuario: 'Sofía Rivas' }
    d.comprobantes.push(c)
    return c
  }
  const pagosPendientes = []
  for (const [dni, , , , , impagas] of SOCIOS) {
    const s = d.socios.find((x) => x.dni === dni)
    const cs = d.cuotas.filter((c) => c.socioDni === dni).sort((a, b) => a.periodo.localeCompare(b.periodo))
    const pagar = cs.slice(0, cs.length - impagas)
    pagar.forEach((c, i) => {
      let fecha = toISODate(addDays(new Date(c.vencimiento + 'T12:00'), -Math.floor(r() * 8)))
      const ultima = i === pagar.length - 1 && c.periodo === mes
      if (ultima && pagosHoy.has(dni)) fecha = t
      else if (ultima && pagosAyer.has(dni)) fecha = toISODate(addDays(hoy, -1))
      if (fecha > t) fecha = t
      if (fecha < s.fechaIngreso) fecha = s.fechaIngreso
      pagosPendientes.push({ s, c, fecha: `${fecha}T${hora()}` })
    })
  }
  // Ventas de los últimos 30 días
  const ventasPendientes = []
  const activos = d.socios.filter((s) => !s.baja)
  for (let i = 30; i >= 0; i--) {
    const fecha = toISODate(addDays(hoy, -i))
    if (new Date(fecha + 'T12:00').getDay() === 0) continue
    const n = i === 0 ? 5 : 1 + Math.floor(r() * 3)
    for (let k = 0; k < n; k++) ventasPendientes.push(`${fecha}T${i === 0 ? hora(8, Math.max(9, hoy.getHours())) : hora()}`)
  }

  // Ningún movimiento de hoy puede quedar en una hora futura.
  const ahora = `${t}T${pad(hoy.getHours(), 2)}:${pad(hoy.getMinutes(), 2)}`
  const tope = (f) => (f > ahora ? `${t}T${pad(Math.max(8, hoy.getHours() - 1 - Math.floor(r() * 3)), 2)}:${pad(Math.floor(r() * 60), 2)}` : f)
  pagosPendientes.forEach((p) => (p.fecha = tope(p.fecha)))
  const movimientos = [
    ...pagosPendientes.map((p) => ({ tipo: 'pago', fecha: p.fecha, p })),
    ...ventasPendientes.map((fecha) => ({ tipo: 'venta', fecha: tope(fecha) })),
  ].sort((a, b) => a.fecha.localeCompare(b.fecha))

  d.productos = PRODUCTOS.map(([nombre, categoria, descripcion, precioVenta, stock, stockMinimo]) => ({
    id: next(d, 'producto'), nombre, categoria, descripcion, precioVenta, stock, stockMinimo, estado: 'Activo',
  }))
  const vendibles = d.productos.filter((p) => !['Proteína Whey 1kg', 'Creatina 300g', 'Guantes de entrenamiento'].includes(p.nombre))

  for (const m of movimientos) {
    if (m.tipo === 'pago') {
      const { s, c, fecha } = m.p
      const id = next(d, 'pago')
      const mp = metodo()
      const comp = comprobante(fecha, 'Pago de cuota', id, c.valor, mp, `${s.nombre} ${s.apellido} · DNI ${s.dni}`, [{ concepto: `Cuota ${periodoLabel(c.periodo)}`, cantidad: 1, importe: c.valor }])
      d.pagos.push({ id, fecha, socioDni: s.dni, cuotaIds: [c.id], monto: c.valor, metodo: mp, estado: 'Registrado', cajaId: null, usuarioId: 2, comprobante: comp.numero })
      c.pagoId = id
    } else {
      const items = []
      const cant = 1 + Math.floor(r() * 2)
      for (let k = 0; k < cant; k++) {
        const p = vendibles[Math.floor(r() * vendibles.length)]
        if (items.some((x) => x.productoId === p.id)) continue
        items.push({ productoId: p.id, nombre: p.nombre, cantidad: 1 + Math.floor(r() * 2), precio: p.precioVenta })
      }
      const n = next(d, 'venta')
      const total = items.reduce((a, it) => a + it.cantidad * it.precio, 0)
      const socio = r() < 0.6 ? activos[Math.floor(r() * activos.length)] : null
      const cliente = socio ? { tipo: 'socio', dni: socio.dni } : { tipo: 'externo' }
      const mp = metodo()
      const comp = comprobante(m.fecha, 'Venta', n, total, mp, socio ? `${socio.nombre} ${socio.apellido} · DNI ${socio.dni}` : 'Cliente externo', items.map((it) => ({ concepto: it.nombre, cantidad: it.cantidad, importe: it.cantidad * it.precio })))
      d.ventas.push({ id: n, numero: code('VEN', n), fecha: m.fecha, cliente, items, total, metodo: mp, estado: 'Confirmada', cajaId: null, usuarioId: 2, comprobante: comp.numero })
    }
  }
  // Una venta anulada de ejemplo
  const anulada = d.ventas[d.ventas.length - 12]
  if (anulada) anulada.estado = 'Anulada'

  // Cajas: una por día hábil de las últimas dos semanas, más la caja abierta de hoy.
  d.seq.caja = 0
  for (let i = 14; i >= 0; i--) {
    const fecha = toISODate(addDays(hoy, -i))
    if (new Date(fecha + 'T12:00').getDay() === 0) continue
    const n = next(d, 'caja')
    const caja = { id: n, numero: code('CAJ', n), apertura: `${fecha}T08:00`, montoInicial: 10000, estado: i === 0 ? 'Abierta' : 'Cerrada', cierre: null, usuarioId: 2 }
    d.pagos.filter((p) => p.fecha.startsWith(fecha)).forEach((p) => (p.cajaId = n))
    d.ventas.filter((v) => v.fecha.startsWith(fecha)).forEach((v) => (v.cajaId = n))
    if (i > 0) {
      const pagos = d.pagos.filter((p) => p.cajaId === n && p.estado !== 'Anulado')
      const ventas = d.ventas.filter((v) => v.cajaId === n && v.estado !== 'Anulada')
      const totalPagos = pagos.reduce((a, p) => a + p.monto, 0)
      const totalVentas = ventas.reduce((a, v) => a + v.total, 0)
      Object.assign(caja, { cierre: `${fecha}T21:30`, cantPagos: pagos.length, totalPagos, cantVentas: ventas.length, totalVentas, total: totalPagos + totalVentas })
    }
    d.cajas.push(caja)
  }

  // Proveedores y compras
  d.proveedores = PROVEEDORES.map(([nombre, cuit, telefono, email]) => ({ id: next(d, 'proveedor'), nombre, cuit, telefono, email, estado: 'Activo' }))
  const prod = (nombre) => d.productos.find((p) => p.nombre === nombre).id
  const compra = (diasAtras, proveedorId, detalles, estado, pagada) => {
    const n = next(d, 'compra')
    const fecha = `${toISODate(addDays(hoy, -diasAtras))}T10:30`
    const recibida = estado !== 'Pendiente'
    const dets = detalles.map(([nombre, sol, rec, precio]) => ({ productoId: prod(nombre), cantSolicitada: sol, cantRecibida: recibida ? rec : null, precioUnit: recibida ? precio : null }))
    const total = recibida ? dets.reduce((a, x) => a + x.cantRecibida * x.precioUnit, 0) : 0
    const c = { id: n, numero: code('CMP', n), fecha, proveedorId, detalles: dets, estado, fechaRecepcion: recibida ? `${toISODate(addDays(hoy, -diasAtras + 3))}T11:00` : null, total, pago: null, usuarioId: 1, observaciones: '' }
    if (estado === 'Recibida con observaciones') c.observaciones = 'Diferencias entre lo solicitado y lo recibido'
    if (pagada) {
      const comp = comprobante(`${toISODate(addDays(hoy, -diasAtras + 5))}T12:00`, 'Pago a proveedor', n, total, 'Transferencia', `${d.proveedores.find((p) => p.id === proveedorId).nombre}`, [{ concepto: `Compra ${c.numero}`, cantidad: 1, importe: total }])
      c.pago = { fecha: comp.fecha, metodo: 'Transferencia', monto: total, comprobante: comp.numero }
    }
    d.compras.push(c)
  }
  compra(40, 1, [['Proteína Whey 1kg', 15, 15, 11500], ['Barra proteica', 40, 40, 1300]], 'Recibida', true)
  compra(32, 2, [['Bebida isotónica 500ml', 48, 48, 850], ['Agua mineral 500ml', 72, 72, 450]], 'Recibida', true)
  compra(21, 3, [['Remera dry-fit Xtreme', 20, 18, 6800], ['Toalla de microfibra', 10, 10, 3500]], 'Recibida con observaciones', false)
  compra(12, 2, [['Shaker 600ml', 12, 12, 2600]], 'Recibida', false)
  compra(4, 1, [['Proteína Whey 1kg', 20, 0, 0], ['Creatina 300g', 15, 0, 0]], 'Pendiente', false)
  compra(2, 3, [['Guantes de entrenamiento', 12, 0, 0]], 'Pendiente', false)

  // Entrenadores, asignaciones y pagos
  d.entrenadores = ENTRENADORES.map(([dni, nombre, apellido, telefono, email, disponibilidadHoraria]) => ({ id: next(d, 'entrenador'), dni, nombre, apellido, telefono, email, disponibilidadHoraria, estado: 'Activo' }))
  const asig = [['35111222', 1, 60], ['38999111', 2, 45], ['40123456', 2, 30], ['36777123', 1, 90], ['34567890', 3, 20], ['42555666', 4, 15]]
  asig.forEach(([dni, entrenadorId, dias]) => d.asignaciones.push({ id: next(d, 'asignacion'), socioDni: dni, entrenadorId, fechaInicio: toISODate(addDays(hoy, -dias)), fechaFin: null, estado: 'Activa' }))
  const anterior = addMonthKey(mes, -1)
  d.entrenadores.slice(0, 3).forEach((e, i) => {
    const id = next(d, 'pagoEntrenador')
    const monto = [180000, 165000, 120000][i]
    const fecha = `${anterior}-28T18:00`
    const comp = comprobante(fecha, 'Pago a entrenador', id, monto, 'Transferencia', `${e.nombre} ${e.apellido} · DNI ${e.dni}`, [{ concepto: `Servicios de ${periodoLabel(anterior)}`, cantidad: 1, importe: monto }])
    d.pagosEntrenador.push({ id, entrenadorId: e.id, periodo: anterior, monto, metodo: 'Transferencia', fecha, comprobante: comp.numero })
  })

  return d
}
