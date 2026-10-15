import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './store'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Socios from './pages/Socios'
import SocioForm from './pages/SocioForm'
import SocioDetalle from './pages/SocioDetalle'
import Pagos from './pages/Pagos'
import Ventas from './pages/Ventas'
import Inventario from './pages/Inventario'
import Compras from './pages/Compras'
import Recepcion from './pages/Recepcion'
import Proveedores from './pages/Proveedores'
import Entrenadores from './pages/Entrenadores'
import Caja from './pages/Caja'
import Usuarios from './pages/Usuarios'
import Reportes from './pages/Reportes'

function Privado({ children, soloPropietario }) {
  const { usuario } = useStore()
  const loc = useLocation()
  if (!usuario) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (soloPropietario && usuario.rol !== 'Propietario') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Privado>
            <Layout />
          </Privado>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="socios" element={<Socios />} />
        <Route path="socios/nuevo" element={<SocioForm />} />
        <Route path="socios/:dni" element={<SocioDetalle />} />
        <Route path="socios/:dni/editar" element={<SocioForm />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="compras" element={<Privado soloPropietario><Compras /></Privado>} />
        <Route path="compras/:id/recepcion" element={<Privado soloPropietario><Recepcion /></Privado>} />
        <Route path="proveedores" element={<Privado soloPropietario><Proveedores /></Privado>} />
        <Route path="entrenadores" element={<Entrenadores />} />
        <Route path="caja" element={<Caja />} />
        <Route path="usuarios" element={<Privado soloPropietario><Usuarios /></Privado>} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
