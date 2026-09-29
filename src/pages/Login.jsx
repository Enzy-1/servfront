import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useTheme } from '../ThemeContext'

export default function Login() {
  const { user, login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="login-page">
      <button
        type="button"
        className="ghost theme-float"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      >
        <span className="theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
      </button>
      <div className="login-layout">
        <section className="login-brand-panel" aria-label="Digital Solutions">
          <img src="/logo-blanco.png" alt="Digital Solutions" className="login-logo" />
          <div className="login-brand-copy">
            <span className="login-overline">SISTEMA INTERNO</span>
            <h2>Servicio técnico</h2>
            <div className="login-brand-rule" aria-hidden="true" />
          </div>
        </section>

        <section className="login-form-side">
          <form className="login-card" onSubmit={onSubmit}>
            <div className="login-form-heading">
              <span className="login-overline">PORTAL DE ACCESO</span>
              <h1>Iniciar sesión</h1>
              <p className="muted">Ingresa con las credenciales de tu cuenta.</p>
            </div>
            {error ? <div className="alert" role="alert">{error}</div> : null}
            <label>
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={254}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
              />
            </label>
            <label>
              Contraseña
              <span className="login-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  maxLength={256}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </span>
            </label>
            <button className="login-submit" type="submit" disabled={sending}>
              {sending ? 'Verificando…' : 'Entrar'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
