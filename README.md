# Gimnasio Xtreme · Prototipo funcional

Prototipo funcional del sistema de gestión del Gimnasio Xtreme (Salta Capital), desarrollado en el marco del Seminario de Sistemas

**Demo:** https://gimnasio-xtreme-prototipo.vercel.app/

## Qué permite hacer

- Iniciar y cerrar sesión con dos roles: Propietario y Recepcionista.
- Registrar socios con el pago de la primera cuota, modificarlos, darlos de baja y reactivarlos.
- Registrar pagos de cuotas con comprobante en PDF, anular pagos y administrar el valor de la cuota.
- Abrir y cerrar la caja del día.
- Registrar ventas de productos, anularlas y ajustar el stock.
- Registrar compras a proveedores, su recepción y su pago.
- Gestionar entrenadores, asignarlos a socios y registrar sus pagos.
- Administrar usuarios.
- Consultar reportes de socios con cuotas vencidas, recaudación por período y productos con stock bajo.

## Tecnologías

- [React](https://react.dev/) 18
- [Vite](https://vitejs.dev/) 5
- [Tailwind CSS](https://tailwindcss.com/) 3
- [React Router](https://reactrouter.com/) 6
- [Lucide](https://lucide.dev/) (íconos)
- Publicado en [Vercel](https://vercel.com/)

El prototipo no usa servidor ni base de datos. Los datos se guardan en el almacenamiento local del navegador, a partir de un conjunto de datos de ejemplo que se carga al ingresar por primera vez. Cada visitante trabaja sobre su propia copia, que puede restaurarse desde el menú del usuario con "Restaurar datos de ejemplo".

## Ejecutarlo localmente

Requiere [Node.js](https://nodejs.org/) 18 o superior.

```bash
npm install
npm run dev
```

La aplicación queda disponible en http://localhost:5173.

## Usuarios de demostración

| Rol | Usuario | Contraseña |
|---|---|---|
| Propietario | admin | admin123 |
| Recepcionista | recepcion | recep123 |

Son credenciales de ejemplo del prototipo. Todos los datos (socios, productos, proveedores y montos) son ficticios.

## Autor

José Mariano Chivi · Seminario de Sistemas, UNSa, 2026.
