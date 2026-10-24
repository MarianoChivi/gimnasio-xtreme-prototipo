// Reglas de negocio del prototipo. Cada acción recibe una copia del estado (d)
// y la modifica. Si algo no es válido, lanza un Error con el mensaje para el usuario.
import { addMonthKey, code, monthKey, nowISO, periodoLabel, todayISO, money, normalize } from './utils'

const fail = (msg) => {
  throw new Error(msg)
}

export const next = (d, key) => {
  d.seq[key] = (d.seq[key] ?? 0) + 1
  return d.seq[key]
}

// ---------- Consultas ----------

export const estadoCuota = (c, hoy = todayISO()) => (c.pagoId ? 'Pagada' : c.vencimiento < hoy ? 'Vencida' : 'Pendiente')

export const estadoSocio = (s, cuotas, hoy = todayISO()) => {
  if (s.baja) return 'Baja'
  const vencida = cuotas.some((c) => c.socioDni === s.dni && !c.pagoId && c.vencimiento < hoy)
  return vencida ? 'Vencido' : 'Al día'
}

export const cuotasDe = (d, dni) =>
  d.cuotas.filter((c) => c.socioDni === dni).sort((a, b) => a.periodo.localeCompare(b.periodo))

export const cuotasAdeudadas = (d, dni) => cuotasDe(d, dni).filter((c) => !c.pagoId)

export const valorVigente = (d, fecha = todayISO()) => {
  const vs = d.valoresCuota.filter((v) => v.fechaDesde <= fecha).sort((a, b) => b.fechaDesde.localeCompare(a.fechaDesde))
  return vs[0]?.valor ?? 0
}

export const cajaAbierta = (d) => d.cajas.find((c) => c.estado === 'Abierta')

export const movimientosCaja = (d, cajaId) => {
  const pagos = d.pagos.filter((p) => p.cajaId === cajaId && p.estado !== 'Anulado')
  const ventas = d.ventas.filter((v) => v.cajaId === cajaId && v.estado !== 'Anulada')
  const totalPagos = pagos.reduce((a, p) => a + p.monto, 0)
  const totalVentas = ventas.reduce((a, v) => a + v.total, 0)
  return { pagos, ventas, totalPagos, totalVentas, total: totalPagos + totalVentas }
}

export const stockBajo = (d) => d.productos.filter((p) => p.estado === 'Activo' && p.stock < p.stockMinimo)

export const deudaProveedor = (d, proveedorId) =>
  d.compras
    .filter((c) => c.proveedorId === proveedorId && c.estado !== 'Pendiente' && !c.pago)
    .reduce((a, c) => a + c.total, 0)

export const asignacionActiva = (d, dni) => d.asignaciones.find((a) => a.socioDni === dni && a.estado === 'Activa')

export const nombreSocio = (d, dni) => {
  const s = d.socios.find((x) => x.dni === dni)
  return s ? `${s.nombre} ${s.apellido}` : dni
}

export const usuarioActual = (d) => d.usuarios.find((u) => u.id === d.sesion)

// ---------- Cuotas ----------

// Genera las cuotas mensuales que falten hasta el mes actual (vencimiento el día 10).
export function generarCuotas(d, hoy = todayISO()) {
  const actual = monthKey(hoy)
  const existentes = new Set(d.cuotas.map((c) => c.id))
  for (const s of d.socios) {
    const desde = s.cuotasDesde
    let hasta = actual
    if (s.baja) hasta = monthKey(s.fechaBaja)
    for (let k = monthKey(desde); k <= hasta; k = addMonthKey(k, 1)) {
      const id = `${s.dni}-${k}`
      if (existentes.has(id)) continue
      let venc = `${k}-10`
      if (k === monthKey(desde) && desde > venc) venc = desde
      d.cuotas.push({ id, socioDni: s.dni, periodo: k, vencimiento: venc, valor: valorVigente(d, venc), pagoId: null })
      existentes.add(id)
    }
  }
  return d
}

function crearComprobante(d, { tipo, refId, monto, destinatario, lineas, metodo, fecha }) {
  const numero = code('COMP', next(d, 'comprobante'))
  const c = { numero, fecha: fecha ?? nowISO(), tipo, refId, monto, destinatario, lineas, metodo, usuario: usuarioActual(d)?.nombre ?? '' }
  d.comprobantes.push(c)
  return c
}

const requiereCaja = (d) => {
  const caja = cajaAbierta(d)
  if (!caja) fail('No hay una caja abierta. Abrí la caja del día antes de registrar cobros.')
  return caja
}

// ---------- Sesión (CU27, CU28) ----------

export function iniciarSesion(d, usuario, contrasena) {
  const u = d.usuarios.find((x) => normalize(x.usuario) === normalize(usuario))
  if (!usuario || !contrasena) fail('Ingresá usuario y contraseña.')
  if (!u || u.contrasena !== contrasena) fail('Usuario o contraseña incorrectos.')
  if (u.estado !== 'Activo') fail('El usuario está dado de baja.')
  d.sesion = u.id
  return u
}

export function cerrarSesion(d) {
  d.sesion = null
}

// ---------- Socios (CU01 a CU04) ----------

function validarSocio(ds) {
  if (!/^\d{7,8}$/.test(ds.dni ?? '')) fail('El DNI debe tener 7 u 8 dígitos, sin puntos.')
  if (!ds.nombre?.trim() || !ds.apellido?.trim()) fail('Nombre y apellido son obligatorios.')
  if (!/^[\d\s+()-]{6,}$/.test(ds.telefono ?? '')) fail('Ingresá un teléfono válido.')
  if (ds.email && !/^\S+@\S+\.\S+$/.test(ds.email)) fail('El email no tiene un formato válido.')
}

// CU01: el alta incluye el cobro de la primera cuota. Si algo falla, no se registra nada.
export function registrarSocio(d, ds, metodo) {
  requiereCaja(d)
  if (!valorVigente(d)) fail('No hay un valor de cuota vigente registrado.')
  validarSocio(ds)
  if (d.socios.some((s) => s.dni === ds.dni)) fail('Ya existe un socio registrado con ese DNI.')
  if (!metodo) fail('Seleccioná el método de pago de la primera cuota.')
  const hoy = todayISO()
  const s = {
    dni: ds.dni,
    nombre: ds.nombre.trim(),
    apellido: ds.apellido.trim(),
    telefono: ds.telefono.trim(),
    email: ds.email?.trim() ?? '',
    fechaIngreso: hoy,
    cuotasDesde: hoy,
    baja: false,
    fechaBaja: null,
  }
  d.socios.push(s)
  generarCuotas(d)
  const cuota = d.cuotas.find((c) => c.socioDni === s.dni && c.periodo === monthKey(hoy))
  const r = registrarPago(d, s.dni, [cuota.id], metodo)
  return { socio: s, cuota, ...r }
}

export function modificarSocio(d, dni, ds) {
  const s = d.socios.find((x) => x.dni === dni) ?? fail('Socio no encontrado.')
  validarSocio({ ...ds, dni })
  Object.assign(s, { nombre: ds.nombre.trim(), apellido: ds.apellido.trim(), telefono: ds.telefono.trim(), email: ds.email?.trim() ?? '' })
  return s
}

export function bajaSocio(d, dni) {
  const s = d.socios.find((x) => x.dni === dni) ?? fail('Socio no encontrado.')
  if (s.baja) fail('El socio ya está dado de baja.')
  s.baja = true
  s.fechaBaja = todayISO()
  const a = asignacionActiva(d, dni)
  if (a) Object.assign(a, { estado: 'Finalizada', fechaFin: todayISO() })
  return s
}

export function reactivarSocio(d, dni) {
  const s = d.socios.find((x) => x.dni === dni) ?? fail('Socio no encontrado.')
  if (!s.baja) fail('El socio no está dado de baja.')
  s.baja = false
  s.fechaBaja = null
  s.cuotasDesde = todayISO()
  generarCuotas(d)
  return s
}

// ---------- Cuotas y pagos (CU05 a CU08) ----------

// CU06: solo es modificable el último valor registrado, mientras no se haya aplicado a ninguna cuota.
export const valorModificable = (d) => {
  const ultimo = [...d.valoresCuota].sort((a, b) => b.id - a.id)[0]
  if (!ultimo) return null
  const aplicado = d.cuotas.some((c) => c.vencimiento >= ultimo.fechaDesde)
  return aplicado ? null : ultimo
}

function validarValorCuota(valor, fechaDesde) {
  if (!(valor > 0)) fail('El valor debe ser un número positivo.')
  if (!fechaDesde || fechaDesde < todayISO()) fail('No se admite una vigencia retroactiva: la fecha no puede ser anterior a hoy.')
}

export function registrarValorCuota(d, valor, fechaDesde) {
  valor = Number(valor)
  validarValorCuota(valor, fechaDesde)
  if (valorModificable(d)) fail('Ya hay un valor registrado que todavía no se aplicó. Modificalo en lugar de crear otro.')
  const v = { id: next(d, 'valorCuota'), valor, fechaDesde, fechaRegistro: todayISO() }
  d.valoresCuota.push(v)
  return v
}

export function modificarValorCuota(d, id, valor, fechaDesde) {
  const v = d.valoresCuota.find((x) => x.id === id) ?? fail('Valor no encontrado.')
  if (valorModificable(d)?.id !== id) fail('El último valor registrado ya fue aplicado a cuotas y no puede modificarse.')
  valor = Number(valor)
  validarValorCuota(valor, fechaDesde)
  Object.assign(v, { valor, fechaDesde })
  return v
}

export function registrarPago(d, dni, cuotaIds, metodo) {
  const caja = requiereCaja(d)
  const s = d.socios.find((x) => x.dni === dni) ?? fail('Socio no encontrado.')
  if (!cuotaIds.length) fail('Seleccioná al menos una cuota.')
  if (!metodo) fail('Seleccioná el método de pago.')
  const cuotas = cuotaIds.map((id) => d.cuotas.find((c) => c.id === id))
  if (cuotas.some((c) => !c || c.pagoId)) fail('Alguna de las cuotas seleccionadas ya fue pagada.')
  const id = next(d, 'pago')
  const monto = cuotas.reduce((a, c) => a + c.valor, 0)
  const comp = crearComprobante(d, {
    tipo: 'Pago de cuota',
    refId: id,
    monto,
    metodo,
    destinatario: `${s.nombre} ${s.apellido} · DNI ${s.dni}`,
    lineas: cuotas.map((c) => ({ concepto: `Cuota ${periodoLabel(c.periodo)}`, cantidad: 1, importe: c.valor })),
  })
  const pago = { id, fecha: nowISO(), socioDni: dni, cuotaIds, monto, metodo, estado: 'Registrado', cajaId: caja.id, usuarioId: d.sesion, comprobante: comp.numero }
  d.pagos.push(pago)
  cuotas.forEach((c) => (c.pagoId = id))
  return { pago, comprobante: comp, estadoSocio: estadoSocio(s, d.cuotas) }
}

// CU08 y CU15: solo se anula lo registrado en una caja que sigue abierta.
export const cajaDe = (d, cajaId) => d.cajas.find((c) => c.id === cajaId)

const anularComprobante = (d, numero) => {
  const c = d.comprobantes.find((x) => x.numero === numero)
  if (c) c.anulado = true
}

export function anularPago(d, id) {
  const p = d.pagos.find((x) => x.id === id) ?? fail('Pago no encontrado.')
  if (p.estado === 'Anulado') fail('El pago ya está anulado.')
  if (cajaDe(d, p.cajaId)?.estado !== 'Abierta') fail('No se puede anular un pago registrado en una caja cerrada.')
  p.estado = 'Anulado'
  d.cuotas.forEach((c) => {
    if (c.pagoId === id) c.pagoId = null
  })
  anularComprobante(d, p.comprobante)
  return p
}

// ---------- Caja (CU09, CU10) ----------

export function abrirCaja(d, montoInicial) {
  if (cajaAbierta(d)) fail('Ya hay una caja abierta.')
  montoInicial = Number(montoInicial)
  if (!(montoInicial >= 0)) fail('Ingresá un monto inicial válido.')
  const n = next(d, 'caja')
  const c = { id: n, numero: code('CAJ', n), apertura: nowISO(), montoInicial, estado: 'Abierta', cierre: null, usuarioId: d.sesion }
  d.cajas.push(c)
  return c
}

export function cerrarCaja(d) {
  const c = cajaAbierta(d) ?? fail('No hay una caja abierta.')
  const m = movimientosCaja(d, c.id)
  Object.assign(c, {
    estado: 'Cerrada',
    cierre: nowISO(),
    cantPagos: m.pagos.length,
    totalPagos: m.totalPagos,
    cantVentas: m.ventas.length,
    totalVentas: m.totalVentas,
    total: m.total,
  })
  return c
}

// ---------- Productos (CU11 a CU13, CU16) ----------

function validarProducto(d, dp, id) {
  if (!dp.nombre?.trim()) fail('El nombre es obligatorio.')
  if (!dp.categoria) fail('Seleccioná una categoría.')
  if (!(Number(dp.precioVenta) > 0)) fail('El precio de venta debe ser mayor a cero.')
  if (!(Number(dp.stockMinimo) >= 0)) fail('El stock mínimo no puede ser negativo.')
  if (d.productos.some((p) => p.id !== id && p.estado === 'Activo' && normalize(p.nombre) === normalize(dp.nombre)))
    fail('Ya existe un producto con ese nombre.')
}

export function registrarProducto(d, dp) {
  validarProducto(d, dp)
  if (!(Number(dp.stock) >= 0)) fail('El stock inicial no puede ser negativo.')
  const p = {
    id: next(d, 'producto'),
    nombre: dp.nombre.trim(),
    categoria: dp.categoria,
    descripcion: dp.descripcion?.trim() ?? '',
    precioVenta: Number(dp.precioVenta),
    stock: Number(dp.stock),
    stockMinimo: Number(dp.stockMinimo),
    estado: 'Activo',
  }
  d.productos.push(p)
  return p
}

export function modificarProducto(d, id, dp) {
  const p = d.productos.find((x) => x.id === id) ?? fail('Producto no encontrado.')
  validarProducto(d, dp, id)
  Object.assign(p, { nombre: dp.nombre.trim(), categoria: dp.categoria, descripcion: dp.descripcion?.trim() ?? '', precioVenta: Number(dp.precioVenta), stockMinimo: Number(dp.stockMinimo) })
  return p
}

export function bajaProducto(d, id) {
  const p = d.productos.find((x) => x.id === id) ?? fail('Producto no encontrado.')
  p.estado = 'Baja'
  return p
}

export function ajustarStock(d, id, tipo, cantidad) {
  const p = d.productos.find((x) => x.id === id) ?? fail('Producto no encontrado.')
  cantidad = Number(cantidad)
  if (!Number.isInteger(cantidad) || cantidad <= 0) fail('La cantidad debe ser un entero mayor a cero.')
  if (tipo === 'Decremento' && cantidad > p.stock) fail(`No se puede descontar más que el stock actual (${p.stock}).`)
  p.stock += tipo === 'Incremento' ? cantidad : -cantidad
  d.ajustes.push({ id: next(d, 'ajuste'), productoId: id, tipo, cantidad, fecha: nowISO(), usuarioId: d.sesion })
  return p
}

// ---------- Ventas (CU14, CU15) ----------

// CU14: la venta es de mostrador y no se asocia a ningún cliente.
export function registrarVenta(d, items, metodo) {
  const caja = requiereCaja(d)
  if (!items.length) fail('Agregá al menos un producto.')
  if (!metodo) fail('Seleccioná el método de pago.')
  const destinatario = 'Venta de mostrador'
  const lineas = items.map((it) => {
    const p = d.productos.find((x) => x.id === it.productoId)
    if (!p || p.estado !== 'Activo') fail('Hay un producto que ya no está disponible.')
    if (it.cantidad > p.stock) fail(`Stock insuficiente de ${p.nombre} (disponible: ${p.stock}).`)
    return { p, cantidad: it.cantidad }
  })
  const n = next(d, 'venta')
  const total = lineas.reduce((a, l) => a + l.cantidad * l.p.precioVenta, 0)
  const comp = crearComprobante(d, {
    tipo: 'Venta',
    refId: n,
    monto: total,
    metodo,
    destinatario,
    lineas: lineas.map((l) => ({ concepto: l.p.nombre, cantidad: l.cantidad, importe: l.cantidad * l.p.precioVenta })),
  })
  lineas.forEach((l) => (l.p.stock -= l.cantidad))
  const v = {
    id: n,
    numero: code('VEN', n),
    fecha: nowISO(),
    items: lineas.map((l) => ({ productoId: l.p.id, nombre: l.p.nombre, cantidad: l.cantidad, precio: l.p.precioVenta })),
    total,
    metodo,
    estado: 'Confirmada',
    cajaId: caja.id,
    usuarioId: d.sesion,
    comprobante: comp.numero,
  }
  d.ventas.push(v)
  return { venta: v, comprobante: comp }
}

export function anularVenta(d, id) {
  const v = d.ventas.find((x) => x.id === id) ?? fail('Venta no encontrada.')
  if (v.estado === 'Anulada') fail('La venta ya está anulada.')
  if (cajaDe(d, v.cajaId)?.estado !== 'Abierta') fail('No se puede anular una venta registrada en una caja cerrada.')
  v.estado = 'Anulada'
  v.items.forEach((it) => {
    const p = d.productos.find((x) => x.id === it.productoId)
    if (p) p.stock += it.cantidad
  })
  anularComprobante(d, v.comprobante)
  return v
}

// ---------- Proveedores y compras (CU17 a CU21) ----------

function validarProveedor(d, dp, id) {
  if (!dp.nombre?.trim()) fail('La razón social es obligatoria.')
  if (!/^\d{2}-\d{8}-\d$/.test(dp.cuit ?? '')) fail('El CUIT debe tener el formato 30-12345678-9.')
  if (!/^[\d\s+()-]{6,}$/.test(dp.telefono ?? '')) fail('Ingresá un teléfono válido.')
  if (dp.email && !/^\S+@\S+\.\S+$/.test(dp.email)) fail('El email no tiene un formato válido.')
  if (d.proveedores.some((p) => p.id !== id && p.cuit === dp.cuit)) fail('Ya existe un proveedor con ese CUIT.')
}

export function registrarProveedor(d, dp) {
  validarProveedor(d, dp)
  const p = { id: next(d, 'proveedor'), nombre: dp.nombre.trim(), cuit: dp.cuit, telefono: dp.telefono.trim(), email: dp.email?.trim() ?? '', estado: 'Activo' }
  d.proveedores.push(p)
  return p
}

export function modificarProveedor(d, id, dp) {
  const p = d.proveedores.find((x) => x.id === id) ?? fail('Proveedor no encontrado.')
  validarProveedor(d, { ...dp, cuit: p.cuit }, id)
  Object.assign(p, { nombre: dp.nombre.trim(), telefono: dp.telefono.trim(), email: dp.email?.trim() ?? '' })
  return p
}

export function bajaProveedor(d, id) {
  const p = d.proveedores.find((x) => x.id === id) ?? fail('Proveedor no encontrado.')
  p.estado = 'Baja'
  return p
}

export function registrarCompra(d, proveedorId, items) {
  const prov = d.proveedores.find((p) => p.id === proveedorId && p.estado === 'Activo') ?? fail('Seleccioná un proveedor.')
  if (!items.length) fail('Agregá al menos un producto.')
  if (items.some((i) => !(i.cantidad > 0))) fail('Las cantidades deben ser mayores a cero.')
  const n = next(d, 'compra')
  const c = {
    id: n,
    numero: code('CMP', n),
    fecha: nowISO(),
    proveedorId: prov.id,
    detalles: items.map((i) => ({ productoId: i.productoId, cantSolicitada: i.cantidad, cantRecibida: null, precioUnit: null })),
    estado: 'Pendiente',
    fechaRecepcion: null,
    total: 0,
    pago: null,
    usuarioId: d.sesion,
  }
  d.compras.push(c)
  return c
}

export function registrarRecepcion(d, compraId, recibido) {
  const c = d.compras.find((x) => x.id === compraId) ?? fail('Compra no encontrada.')
  if (c.estado !== 'Pendiente') fail('La compra ya fue recibida.')
  recibido.forEach((r) => {
    if (!(Number.isInteger(r.cantRecibida) && r.cantRecibida >= 0)) fail('Las cantidades recibidas deben ser enteros no negativos.')
    if (!(r.precioUnit > 0)) fail('Ingresá el precio unitario de cada producto.')
  })
  let diferencia = false
  c.detalles.forEach((det, i) => {
    det.cantRecibida = recibido[i].cantRecibida
    det.precioUnit = recibido[i].precioUnit
    if (det.cantRecibida !== det.cantSolicitada) diferencia = true
    const p = d.productos.find((x) => x.id === det.productoId)
    if (p) p.stock += det.cantRecibida
  })
  c.total = c.detalles.reduce((a, det) => a + det.cantRecibida * det.precioUnit, 0)
  c.estado = diferencia ? 'Recibida con observaciones' : 'Recibida'
  c.observaciones = diferencia
    ? c.detalles
        .filter((det) => det.cantRecibida !== det.cantSolicitada)
        .map((det) => `${d.productos.find((p) => p.id === det.productoId)?.nombre}: solicitadas ${det.cantSolicitada}, recibidas ${det.cantRecibida}`)
        .join(' · ')
    : ''
  c.fechaRecepcion = nowISO()
  return c
}

export function pagarProveedor(d, compraId, metodo) {
  const c = d.compras.find((x) => x.id === compraId) ?? fail('Compra no encontrada.')
  if (c.estado === 'Pendiente') fail('La compra todavía no fue recibida.')
  if (c.pago) fail('La compra ya fue pagada.')
  if (!metodo) fail('Seleccioná el método de pago.')
  const prov = d.proveedores.find((p) => p.id === c.proveedorId)
  const comp = crearComprobante(d, {
    tipo: 'Pago a proveedor',
    refId: c.id,
    monto: c.total,
    metodo,
    destinatario: `${prov?.nombre} · CUIT ${prov?.cuit}`,
    lineas: [{ concepto: `Compra ${c.numero}`, cantidad: 1, importe: c.total }],
  })
  c.pago = { fecha: nowISO(), metodo, monto: c.total, comprobante: comp.numero }
  return { compra: c, comprobante: comp }
}

// ---------- Entrenadores (CU22 a CU26) ----------

function validarEntrenador(d, de, id) {
  if (!/^\d{7,8}$/.test(de.dni ?? '')) fail('El DNI debe tener 7 u 8 dígitos, sin puntos.')
  if (!de.nombre?.trim() || !de.apellido?.trim()) fail('Nombre y apellido son obligatorios.')
  if (!/^[\d\s+()-]{6,}$/.test(de.telefono ?? '')) fail('Ingresá un teléfono válido.')
  if (de.email && !/^\S+@\S+\.\S+$/.test(de.email)) fail('El email no tiene un formato válido.')
  if (!de.disponibilidadHoraria?.trim()) fail('Indicá la disponibilidad horaria.')
  if (d.entrenadores.some((e) => e.id !== id && e.dni === de.dni)) fail('Ya existe un entrenador con ese DNI.')
}

export function registrarEntrenador(d, de) {
  validarEntrenador(d, de)
  const e = { id: next(d, 'entrenador'), dni: de.dni, nombre: de.nombre.trim(), apellido: de.apellido.trim(), telefono: de.telefono.trim(), email: de.email?.trim() ?? '', disponibilidadHoraria: de.disponibilidadHoraria.trim(), estado: 'Activo' }
  d.entrenadores.push(e)
  return e
}

export function modificarEntrenador(d, id, de) {
  const e = d.entrenadores.find((x) => x.id === id) ?? fail('Entrenador no encontrado.')
  validarEntrenador(d, { ...de, dni: e.dni }, id)
  Object.assign(e, { nombre: de.nombre.trim(), apellido: de.apellido.trim(), telefono: de.telefono.trim(), email: de.email?.trim() ?? '', disponibilidadHoraria: de.disponibilidadHoraria.trim() })
  return e
}

export function bajaEntrenador(d, id) {
  const e = d.entrenadores.find((x) => x.id === id) ?? fail('Entrenador no encontrado.')
  e.estado = 'Baja'
  d.asignaciones.forEach((a) => {
    if (a.entrenadorId === id && a.estado === 'Activa') Object.assign(a, { estado: 'Finalizada', fechaFin: todayISO() })
  })
  return e
}

export function asignarEntrenador(d, dni, entrenadorId, fechaInicio) {
  const s = d.socios.find((x) => x.dni === dni) ?? fail('Socio no encontrado.')
  if (estadoSocio(s, d.cuotas) !== 'Al día') fail('El socio no está al día con sus cuotas y no puede contratar el servicio de entrenamiento personalizado hasta regularizar su situación.')
  const e = d.entrenadores.find((x) => x.id === entrenadorId && x.estado === 'Activo') ?? fail('Seleccioná un entrenador.')
  if (!fechaInicio) fail('Indicá la fecha de inicio de la asignación.')
  const prev = asignacionActiva(d, dni)
  if (prev?.entrenadorId === e.id) fail('El socio ya tiene asignado a ese entrenador.')
  if (prev && fechaInicio < prev.fechaInicio) fail(`La fecha de inicio no puede ser anterior al inicio de la asignación actual (${prev.fechaInicio.split('-').reverse().join('/')}).`)
  if (prev) Object.assign(prev, { estado: 'Finalizada', fechaFin: fechaInicio })
  const a = { id: next(d, 'asignacion'), socioDni: dni, entrenadorId: e.id, fechaInicio, fechaFin: null, estado: 'Activa' }
  d.asignaciones.push(a)
  return a
}

export function pagarEntrenador(d, entrenadorId, periodo, monto, metodo, fecha) {
  const e = d.entrenadores.find((x) => x.id === entrenadorId) ?? fail('Entrenador no encontrado.')
  monto = Number(monto)
  if (!periodo) fail('Seleccioná el período.')
  if (!(monto > 0)) fail('El monto debe ser mayor a cero.')
  if (!metodo) fail('Seleccioná el método de pago.')
  if (!fecha || fecha > todayISO()) fail('Ingresá una fecha de pago válida (no puede ser posterior a hoy).')
  if (d.pagosEntrenador.some((p) => p.entrenadorId === entrenadorId && p.periodo === periodo)) fail(`Ya se registró el pago de ${periodoLabel(periodo)} a este entrenador.`)
  const id = next(d, 'pagoEntrenador')
  const comp = crearComprobante(d, {
    tipo: 'Pago a entrenador',
    refId: id,
    monto,
    metodo,
    destinatario: `${e.nombre} ${e.apellido} · DNI ${e.dni}`,
    lineas: [{ concepto: `Servicios de ${periodoLabel(periodo)}`, cantidad: 1, importe: monto }],
  })
  const p = { id, entrenadorId, periodo, monto, metodo, fecha, comprobante: comp.numero }
  d.pagosEntrenador.push(p)
  return { pago: p, comprobante: comp }
}

// ---------- Usuarios (CU29 a CU31) ----------

function validarUsuario(d, du, id, nueva) {
  if (!/^[a-zA-Z0-9._]{4,}$/.test(du.usuario ?? '')) fail('El nombre de usuario debe tener al menos 4 caracteres (letras, números, punto o guion bajo).')
  if (!du.nombre?.trim()) fail('El nombre es obligatorio.')
  if (!['Propietario', 'Recepcionista'].includes(du.rol)) fail('Seleccioná un rol.')
  if (nueva && (du.contrasena ?? '').length < 6) fail('La contraseña debe tener al menos 6 caracteres.')
  if (d.usuarios.some((u) => u.id !== id && normalize(u.usuario) === normalize(du.usuario))) fail('Ese nombre de usuario ya existe.')
}

export function registrarUsuario(d, du) {
  validarUsuario(d, du, undefined, true)
  const u = { id: next(d, 'usuario'), usuario: du.usuario, nombre: du.nombre.trim(), rol: du.rol, contrasena: du.contrasena, estado: 'Activo' }
  d.usuarios.push(u)
  return u
}

export function modificarUsuario(d, id, du) {
  const u = d.usuarios.find((x) => x.id === id) ?? fail('Usuario no encontrado.')
  validarUsuario(d, du, id, !!du.contrasena)
  if (u.id === d.sesion && du.rol !== u.rol) fail('No podés cambiar tu propio rol.')
  Object.assign(u, { usuario: du.usuario, nombre: du.nombre.trim(), rol: du.rol })
  if (du.contrasena) u.contrasena = du.contrasena
  return u
}

export function bajaUsuario(d, id) {
  const u = d.usuarios.find((x) => x.id === id) ?? fail('Usuario no encontrado.')
  if (u.id === d.sesion) fail('No podés dar de baja tu propio usuario.')
  u.estado = 'Baja'
  return u
}

export const fmtMoney = money
