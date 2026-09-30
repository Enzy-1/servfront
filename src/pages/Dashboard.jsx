import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { STATUS_LABELS, STATUS_ORDER, formatMoney } from '../status'

const DashboardCharts = lazy(() => import('../components/DashboardCharts'))

function percentage(value, total) {
  return total ? Math.round((value / total) * 100) : 0
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/dashboard')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <div className="alert">{error}</div>
  if (!data) return <p className="muted">Cargando dashboard…</p>

  const inProgress = ['recibido', 'diagnostico', 'esperando_piezas', 'en_reparacion']
    .reduce((total, status) => total + (data.byStatus[status] || 0), 0)
  const statusData = STATUS_ORDER.map((status) => ({
    status,
    name: STATUS_LABELS[status],
    count: data.byStatus[status] || 0,
    percent: percentage(data.byStatus[status] || 0, data.total),
  }))
  const cards = [
    { label: 'Equipos registrados', value: data.total, detail: 'Total histórico' },
    { label: 'En proceso', value: inProgress, detail: `${percentage(inProgress, data.total)}% del total` },
    { label: 'Listos para entregar', value: data.ready, detail: `${percentage(data.ready, data.total)}% del total` },
    { label: 'Entregados este mes', value: data.deliveredThisMonth, detail: 'Según historial de entrega' },
    { label: 'Clientes', value: data.clients, detail: 'Clientes registrados' },
    { label: 'Ingresos del mes', value: formatMoney(data.revenue), detail: 'Equipos entregados' },
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
            <small>{card.detail}</small>
          </article>
        ))}
      </section>

      <Suspense fallback={<section className="panel dashboard-chart-loading">Cargando gráficas…</section>}>
        <DashboardCharts data={data} statusData={statusData} />
      </Suspense>

      <section className="panel dashboard-process-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Proceso actual</h2>
            <p className="muted">Conteo y participación por estado</p>
          </div>
        </div>
        <div className="status-grid">
          {statusData.map(({ status, name, count, percent }) => (
            <Link key={status} to={`/equipos?status=${status}`} className="status-chip">
              <span>{name}</span>
              <span className="dashboard-status-value"><b>{count}</b><small>{percent}%</small></span>
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
