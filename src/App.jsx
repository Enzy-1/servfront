import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { ThemeProvider } from './ThemeContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import DeviceForm from './pages/DeviceForm'
import DeviceDetail from './pages/DeviceDetail'
import Clients from './pages/Clients'
import Users from './pages/Users'

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
            <Route
              element={
                <Protected>
                  <Layout />
                </Protected>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/equipos" element={<Devices />} />
              <Route path="/equipos/nuevo" element={<DeviceForm />} />
              <Route path="/equipos/:id" element={<DeviceDetail />} />
              <Route path="/clientes" element={<Clients />} />
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
