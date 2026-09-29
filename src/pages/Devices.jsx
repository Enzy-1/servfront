import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { STATUS_LABELS, STATUS_ORDER, formatDate } from '../status'

export default function Devices() {
  const { isAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [q, setQ] = useState(params.get('q') || '')
  const status = params.get('status') || ''
  const [error, setError] = useState('')

  const query = useMemo(() => {
    const p = new URLSearchParams()
    if (status) p.set('status', status)
    if (params.get('q')) p.set('q', params.get('q'))
    const s = p.toString()
    return s ? `?${s}` : ''
  }, [status, params])

  useEffect(() => {
    api(`/devices${query}`)
      .then(setItems)
      .catch((err) => setError(err.message))
  }, [query])

  function applySearch(e) {
    e.preventDefault()
    const next = new URLSearchParams(params)
    if (q) next.set('q', q)
    else next.delete('q')
    setParams(next)
  }

  function setStatus(value) {
    const next = new URLSearchParams(params)
    if (value) next.set('status', value)
    else next.delete('status')
    setParams(next)
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>{isAdmin ? 'Celulares' : 'Equipos en reparación'}</h1>
          <p className="muted">
            {isAdmin
              ? 'Todos los equipos en el servicio técnico.'
              : 'Consulta de celulares que están en el taller.'}
          </p>
        </div>
        <Link className="btn" to="/equipos/nuevo">
          Nuevo ingreso
        </Link>
      </header>

      <form className="toolbar" onSubmit={applySearch}>
        <input
          placeholder="Buscar ticket, marca, modelo, IMEI…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{isAdmin ? 'Todos los procesos' : 'Todos en taller'}</option>
          {(isAdmin ? STATUS_ORDER : STATUS_ORDER.filter((k) => k !== 'entregado' && k !== 'cancelado')).map(
            (key) => (
              <option key={key} value={key}>
                {STATUS_LABELS[key]}
              </option>
            )
          )}
        </select>
        <button type="submit">Buscar</button>
      </form>

      {error ? <div className="alert">{error}</div> : null}

      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Celular</th>
              <th>Cliente</th>
              <th>Proceso</th>
              <th>Técnico</th>
              <th>Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  No hay resultados.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id}>
                  <td>
                    <Link to={`/equipos/${item._id}`}>{item.ticket}</Link>
                  </td>
                  <td>
                    {item.brand} {item.model}
                  </td>
                  <td>{item.client?.name}</td>
                  <td>
                    <span className={`badge ${item.status}`}>{STATUS_LABELS[item.status]}</span>
                  </td>
                  <td>{item.technician || '—'}</td>
                  <td>{formatDate(item.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
