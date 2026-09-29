import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { STATUS_LABELS, formatMoney } from '../status'

export default function Dashboard() {
  const { isAdmin } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/dashboard')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <div className="alert">{error}</div>
  if (!data) return <p className="muted">Cargando dashboard…</p>

  const cards = [
    { label: 'Celulares en taller', value: data.total },
    { label: 'En proceso', value: data.active },
    { label: 'Listos para entregar', value: data.ready },
    { label: 'Clientes', value: data.clients },
    { label: 'En reparación', value: data.inRepair },
    { label: 'Esperando piezas', value: data.waitingParts },
    { label: 'Entregados del mes', value: data.deliveredThisMonth },
    { label: 'Ingresos del mes', value: formatMoney(data.revenue) },
  ]

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Resumen de todos los celulares en servicio técnico.</p>
        </div>
        <Link className="btn" to="/equipos/nuevo">
          Registrar celular
        </Link>
      </header>

      <section className="cards">
        {cards.map((card) => (
          <article key={card.label} className="stat-card">
            <p>{card.label}</p>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="panel">
        <h2>Proceso actual</h2>
        <div className="status-grid">
          {Object.entries(data.byStatus).map(([key, count]) => (
            <Link key={key} to={`/equipos?status=${key}`} className="status-chip">
              <span>{STATUS_LABELS[key]}</span>
              <b>{count}</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Últimos ingresos</h2>
          <Link to="/equipos">Ver todos</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Equipo</th>
              <th>Cliente</th>
              <th>Falla</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  Aún no hay celulares registrados.
                </td>
              </tr>
            ) : (
              data.recent.map((item) => (
                <tr key={item._id}>
                  <td>
                    <Link to={`/equipos/${item._id}`}>{item.ticket}</Link>
                  </td>
                  <td>
                    {item.brand} {item.model}
                  </td>
                  <td>{item.client?.name}</td>
                  <td>{item.issue}</td>
                  <td>
                    <span className={`badge ${item.status}`}>{STATUS_LABELS[item.status]}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
