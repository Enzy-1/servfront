import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { STATUS_LABELS } from '../status'

const empty = { name: '', phone: '', email: '', document: '' }

export default function Clients() {
  const { isAdmin } = useAuth()
  const [clients, setClients] = useState([])
  const [filters, setFilters] = useState({ name: '', phone: '', document: '', email: '' })
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  function load() {
    api('/clients')
      .then(setClients)
      .catch((err) => setError(err.message))
  }

  const filteredClients = clients.filter((client) =>
    Object.entries(filters).every(([key, value]) => {
      const query = value.trim().toLowerCase()
      return !query || String(client[key] || '').toLowerCase().includes(query)
    })
  )

  useEffect(() => {
    load('')
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await api(`/clients/${editing}`, { method: 'PUT', body: JSON.stringify(form) })
      } else {
        await api('/clients', { method: 'POST', body: JSON.stringify(form) })
      }
      setForm(empty)
      setEditing(null)
      setShowModal(false)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function view(id) {
    const data = await api(`/clients/${id}`)
    setSelected(data)
  }

  async function remove(id) {
    if (!confirm('¿Eliminar este cliente?')) return
    try {
      await api(`/clients/${id}`, { method: 'DELETE' })
      if (selected?.client?._id === id) setSelected(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  function startEdit(client) {
    setEditing(client._id)
    setForm({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
      document: client.document || '',
    })
    setShowModal(true)
  }

  function openNewClientModal() {
    setEditing(null)
    setForm(empty)
    setShowModal(true)
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Clientes</h1>
          <p className="muted">Agenda de dueños de los equipos en taller.</p>
        </div>
        <button type="button" className="btn" onClick={openNewClientModal}>
          Nuevo cliente
        </button>
      </header>

      {error ? <div className="alert">{error}</div> : null}

      <section className="panel client-directory-panel">
        <div className="client-directory-head">
          <div>
            <h2>Directorio de clientes</h2>
            <p className="muted">Consulta datos de contacto y equipos registrados.</p>
          </div>
          <span className="client-count">
            {filteredClients.length} de {clients.length} clientes
          </span>
        </div>

        <div className="client-filters">
          <label>
            Nombre
            <input
              type="search"
              placeholder="Buscar nombre"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </label>
          <label>
            Teléfono
            <input
              type="search"
              placeholder="Buscar teléfono"
              value={filters.phone}
              onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
            />
          </label>
          <label>
            Cédula
            <input
              type="search"
              placeholder="Buscar cédula"
              value={filters.document}
              onChange={(e) => setFilters({ ...filters, document: e.target.value })}
            />
          </label>
          <label>
            Correo
            <input
              type="search"
              placeholder="Buscar correo"
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            />
          </label>
        </div>

        <div className="client-table-wrap">
          <table className="client-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cédula</th>
                <th>Teléfono</th>
                <th>Correo</th>
                {isAdmin ? <th aria-label="Acciones" /> : null}
              </tr>
            </thead>
            <tbody>
              {filteredClients.length ? (
                filteredClients.map((client) => (
                  <tr key={client._id}>
                    <td>
                      <button type="button" className="client-name-button" onClick={() => view(client._id)}>
                        {client.name}
                      </button>
                    </td>
                    <td>{client.document || <span className="muted">Sin cédula</span>}</td>
                    <td>{client.phone}</td>
                    <td>{client.email || <span className="muted">Sin correo</span>}</td>
                    {isAdmin ? (
                      <td>
                        <div className="client-actions">
                          <button type="button" className="ghost" onClick={() => startEdit(client)}>
                            Editar
                          </button>
                          <button type="button" className="danger" onClick={() => remove(client._id)}>
                            Borrar
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="client-empty" colSpan={isAdmin ? 5 : 4}>
                    No hay clientes que coincidan con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <section className="panel client-detail">
          <div className="client-directory-head">
            <div>
              <h2>{selected.client.name}</h2>
              <p className="muted">
                {selected.client.document || 'Sin cédula'} · {selected.client.phone} · {selected.client.email || 'Sin correo'}
              </p>
            </div>
            <button type="button" className="ghost" onClick={() => setSelected(null)}>
              Cerrar detalle
            </button>
          </div>
          <h3>Equipos registrados</h3>
          {selected.devices.length === 0 ? (
            <p className="muted">Sin equipos registrados.</p>
          ) : (
            <ul className="plain">
              {selected.devices.map((device) => (
                <li key={device._id}>
                  {device.ticket} — {device.brand} {device.model}{' '}
                  <span className={`badge ${device.status}`}>{STATUS_LABELS[device.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {showModal ? (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editing ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button type="button" className="ghost" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form className="form-grid modal-form" onSubmit={onSubmit}>
              <label>
                Nombre
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label>
                Teléfono
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </label>
              <label>
                Correo
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label>
                Documento
                <input
                  value={form.document}
                  onChange={(e) => setForm({ ...form, document: e.target.value })}
                />
              </label>

              <div className="full row modal-actions">
                <button type="button" className="ghost" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit">{editing ? 'Guardar cambios' : 'Crear cliente'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
