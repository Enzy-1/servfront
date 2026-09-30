import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { AuthProvider } from './AuthProvider'
import { ThemeProvider } from './ThemeProvider'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import DeviceStatuses from './pages/DeviceStatuses'
import DeviceForm from './pages/DeviceForm'
import DeviceDetail from './pages/DeviceDetail'
import EstimateApproval from './pages/EstimateApproval'
import DeviceTracking from './pages/DeviceTracking'
import Clients from './pages/Clients'
import Users from './pages/Users'
import Parts from './pages/Parts'
import Audit from './pages/Audit'
import Reports from './pages/Reports'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="muted center-msg">Cargando sesión…</p>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminOnly({ children }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/aprobar/:token" element={<EstimateApproval />} />
            <Route path="/seguimiento/:token" element={<DeviceTracking />} />
            <Route
              element={
                <Protected>
                  <Layout />
                </Protected>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/equipos" element={<Devices />} />
              <Route path="/estados" element={<DeviceStatuses />} />
              <Route path="/equipos/nuevo" element={<DeviceForm />} />
              <Route path="/equipos/:id" element={<DeviceDetail />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/repuestos" element={<Parts />} />
              <Route path="/auditoria" element={<AdminOnly><Audit /></AdminOnly>} />
              <Route path="/reportes" element={<AdminOnly><Reports /></AdminOnly>} />
              <Route
                path="/usuarios"
                element={
                  <AdminOnly>
                    <Users />
                  </AdminOnly>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
