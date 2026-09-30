import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { STATUS_LABELS, STATUS_ORDER, formatDate } from '../status'

const ACTIVE_STATUSES = new Set(['recibido', 'diagnostico', 'esperando_piezas', 'en_reparacion'])

export default function DeviceStatuses() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api('/devices/status')
      .then((data) => {
        if (active) setItems(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [])

  const counts = useMemo(() => {
    const byStatus = Object.fromEntries(STATUS_ORDER.map((key) => [key, 0]))
    items.forEach((item) => {
      if (byStatus[item.status] !== undefined) byStatus[item.status] += 1
    })
    return {
      inService: STATUS_ORDER.reduce((total, key) => total + (ACTIVE_STATUSES.has(key) ? byStatus[key] : 0), 0),
      ready: byStatus.listo,
      delivered: byStatus.entregado,
      cancelled: byStatus.cancelado,
      byStatus,
    }
  }, [items])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return items.filter((item) => {
      if (status && item.status !== status) return false
      if (!normalizedQuery) return true
      return [item.ticket, item.brand, item.model, item.technician, item.client?.name]
        .some((value) => value?.toLocaleLowerCase().includes(normalizedQuery))
    })
  }, [items, query, status])

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Estado de equipos</h1>
          <p className="muted">Consulta el avance de los equipos, incluidos los entregados y cancelados.</p>
        </div>
      </header>

      <section className="cards" aria-label="Resumen por estado">
        <article className="stat-card">
          <p>En servicio técnico</p>
          <strong>{counts.inService}</strong>
        </article>
        <article className="stat-card">
          <p>Listos para entregar</p>
          <strong>{counts.ready}</strong>
        </article>
        <article className="stat-card">
          <p>Entregados</p>
          <strong>{counts.delivered}</strong>
        </article>
        <article className="stat-card">
          <p>Cancelados</p>
          <strong>{counts.cancelled}</strong>
        </article>
      </section>

      <div className="toolbar">
        <input
          type="search"
          aria-label="Buscar equipo"
          placeholder="Buscar ticket, equipo, técnico o cliente"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select aria-label="Filtrar por estado" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Todos los estados</option>
          {STATUS_ORDER.map((key) => (
            <option key={key} value={key}>{STATUS_LABELS[key]}</option>
          ))}
        </select>
      </div>

      {error ? <div className="alert" role="alert">{error}</div> : null}

      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Equipo</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Técnico</th>
              <th>Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length ? filteredItems.map((item) => (
              <tr key={item._id}>
                <td>
                  {isAdmin || ACTIVE_STATUSES.has(item.status)
                    ? <Link to={`/equipos/${item._id}`}>{item.ticket}</Link>
                    : item.ticket}
                </td>
                <td>{item.brand} {item.model}</td>
                <td>{item.client?.name || '—'}</td>
                <td><span className={`badge ${item.status}`}>{STATUS_LABELS[item.status]}</span></td>
                <td>{item.assignedTo?.name || item.technician || '—'}</td>
                <td>{formatDate(item.createdAt)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="muted">No hay equipos para este filtro.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}