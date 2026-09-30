import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ClipboardList, ClipboardPlus, ContactRound, Download, History, LayoutDashboard, LogOut, PackageOpen, PanelLeftClose, PanelLeftOpen, Smartphone, UsersRound } from 'lucide-react'
import { useAuth } from '../AuthContext'
import { useTheme } from '../ThemeContext'
import BrandLogo from './BrandLogo'

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuCollapsed, setMenuCollapsed] = useState(false)

  const primaryLinks = [
    { to: '/', label: 'Inicio', end: true, Icon: LayoutDashboard },
    { to: '/equipos', label: 'Equipos', end: false, Icon: Smartphone },
    { to: '/estados', label: 'Estado de equipos', end: true, Icon: ClipboardList },
    { to: '/equipos/nuevo', label: 'Nuevo ingreso', end: true, Icon: ClipboardPlus },
    { to: '/repuestos', label: 'Repuestos', end: true, Icon: PackageOpen },
  ]

  const secondaryLinks = [
    { to: '/clientes', label: 'Clientes', end: false, Icon: ContactRound },
    ...(isAdmin ? [
      { to: '/usuarios', label: 'Usuarios', end: false, Icon: UsersRound },
      { to: '/auditoria', label: 'Auditoría', end: false, Icon: History },
      { to: '/reportes', label: 'Reportes', end: false, Icon: Download },
    ] : []),
  ]

  function onLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className={`app-shell${menuCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className={`sidebar${menuCollapsed ? ' is-collapsed' : ''}`}>
        <div className="brand">
          <BrandLogo className="brand-logo" />
          <button
            type="button"
            className="ghost sidebar-toggle"
            onClick={() => setMenuCollapsed((collapsed) => !collapsed)}
            aria-expanded={!menuCollapsed}
            aria-controls="primary-navigation"
            aria-label={menuCollapsed ? 'Expandir menú' : 'Contraer menú'}
            title={menuCollapsed ? 'Expandir menú' : 'Contraer menú'}
          >
            {menuCollapsed
              ? <PanelLeftOpen size={19} strokeWidth={1.8} aria-hidden="true" />
              : <PanelLeftClose size={19} strokeWidth={1.8} aria-hidden="true" />}
          </button>
        </div>
        <nav className="nav-menu" id="primary-navigation" aria-label="Navegación principal">
          <div className="nav-group">
            <span className="nav-label">Principal</span>
            {primaryLinks.map(({ Icon, ...link }) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/equipos' && location.pathname === '/equipos/nuevo' ? true : link.end}
                title={link.label}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <Icon className="nav-icon" size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="nav-group">
            <span className="nav-label">Gestión</span>
            {secondaryLinks.map(({ Icon, ...link }) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                title={link.label}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <Icon className="nav-icon" size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <span className="sidebar-avatar" aria-hidden="true">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
            <span className="sidebar-user-copy">
              <strong>{user?.name}</strong>
              <span>{isAdmin ? 'Administrador' : 'Técnico'}</span>
            </span>
          </div>
          <button type="button" className="ghost logout-button" onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
            <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>Salir</span>
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
      <button
        type="button"
        className="ghost theme-float"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      >
        <span className="theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
      </button>
    </div>
  )
}
