import { useEffect, useState } from 'react'
import { api } from '../api'

const empty = { name: '', email: '', password: '', role: 'tecnico' }

export default function Users() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [saving, setSaving] = useState(false)

  function load() {
    api('/users')
      .then(setUsers)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setOk('')
    setSaving(true)
    try {
      await api('/users', { method: 'POST', body: JSON.stringify(form) })
      setForm(empty)
      setOk('Usuario creado. Ya puede iniciar sesión.')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    if (!confirm('¿Eliminar este usuario?')) return
    setError('')
    try {
      await api(`/users/${id}`, { method: 'DELETE' })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Usuarios</h1>
          <p className="muted">El administrador da de alta cuentas para consultar el taller.</p>
        </div>
      </header>

      {error ? <div className="alert">{error}</div> : null}
      {ok ? <div className="alert success">{ok}</div> : null}

      <div className="split">
        <form className="panel form-grid" onSubmit={onSubmit}>
          <h2 className="full">Nuevo usuario</h2>
          <label>
            Nombre
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Correo
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              required
            />
          </label>
          <label>
            Rol
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="tecnico">Consulta (dashboard, clientes y equipos)</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <div className="full">
            <button type="submit" disabled={saving}>
              {saving ? 'Creando…' : 'Crear usuario'}
            </button>
          </div>
        </form>

        <section className="panel">
          <h2>Cuentas</h2>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id || u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role === 'admin' ? 'Administrador' : 'Consulta'}</td>
                  <td>
                    <button type="button" className="danger" onClick={() => remove(u._id || u.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
