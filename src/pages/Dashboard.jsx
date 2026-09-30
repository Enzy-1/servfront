import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { STATUS_LABELS, STATUS_ORDER, formatMoney } from '../status'

const DashboardCharts = lazy(() => import('../components/DashboardCharts'))

function percentage(value, total) {
  return total ? Math.round((value / total) * 100) : 0
}

export default function Dashboard() {
  const { isAdmin } = useAuth()
  const [data, setData] = useState(null)
  const [adminOverview, setAdminOverview] = useState(null)
  const [error, setError] = useState('')
  const [adminError, setAdminError] = useState('')

  useEffect(() => {
    api('/dashboard')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    api('/dashboard/admin-overview')
      .then(setAdminOverview)
      .catch((err) => setAdminError(err.message))
  }, [isAdmin])

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
  const adminAlerts = adminOverview ? [
    { key: 'unassigned', label: 'Sin técnico asignado', items: adminOverview.alerts.unassigned.items },
    { key: 'pendingApprovals', label: 'Presupuestos pendientes', items: adminOverview.alerts.pendingApprovals.items },
    { key: 'overdue', label: 'Fuera de fecha estimada', items: adminOverview.alerts.overdue.items },
    { key: 'ready', label: 'Listos para entregar', items: adminOverview.alerts.ready.items },
    { key: 'lowStock', label: 'Repuestos bajo mínimo', items: adminOverview.alerts.lowStock.items, parts: true },
  ] : []

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

      {isAdmin ? (
        <>
          {adminError ? <div className="alert" role="alert">{adminError}</div> : null}
          {adminOverview ? (
            <>
              <section className="panel admin-operations-panel">
                <div className="panel-head">
                  <div>
                    <h2>Requiere atención</h2>
                    <p className="muted">Alertas operativas actualizadas al cargar el dashboard.</p>
                  </div>
                  <Link to="/reportes">Ver reportes</Link>
                </div>
                <div className="admin-alert-grid">
                  {adminAlerts.map((alert) => (
                    <section className="admin-alert-group" key={alert.key}>
                      <h3>{alert.label} <span>{adminOverview.alerts[alert.key].count}</span></h3>
                      {alert.items.length ? (
                        <ul>
                          {alert.items.map((item) => (
                            <li key={item._id || item.sku}>
                              {alert.parts ? (
                                <Link to="/repuestos">{item.name} · {item.stock}/{item.minimumStock}</Link>
                              ) : (
                                <Link to={`/equipos/${item._id}`}>{item.ticket} · {item.brand} {item.model}</Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : <p className="muted">Sin pendientes.</p>}
                    </section>
                  ))}
                </div>
              </section>

              <section className="panel admin-financial-panel">
                <div className="panel-head">
                  <h2>Finanzas y carga del taller</h2>
                  <Link to="/reportes">Exportar datos</Link>
                </div>
                <div className="cards admin-financial-cards">
                  <article className="stat-card"><p>Pagos recibidos</p><strong>{formatMoney(adminOverview.financial.collected)}</strong></article>
                  <article className="stat-card"><p>Saldo pendiente</p><strong>{formatMoney(adminOverview.financial.outstanding)}</strong></article>
                  <article className="stat-card"><p>Costo de repuestos</p><strong>{formatMoney(adminOverview.financial.partsCost)}</strong></article>
                  <article className="stat-card"><p>Margen antes de otros costos</p><strong>{formatMoney(adminOverview.financial.expectedMargin)}</strong></article>
                </div>
                <p className="muted admin-financial-note">El margen no descuenta mano de obra, impuestos ni otros gastos.</p>
                <div className="admin-workload">
                  <h3>Carga por técnico</h3>
                  <table>
                    <thead><tr><th>Técnico</th><th>Equipos activos</th><th>Listos</th></tr></thead>
                    <tbody>
                      {adminOverview.workload.length ? adminOverview.workload.map((technician) => (
                        <tr key={technician.id}>
                          <td><Link to={`/equipos?q=${encodeURIComponent(technician.name)}`}>{technician.name}</Link></td>
                          <td>{technician.active}</td>
                          <td>{technician.ready}</td>
                        </tr>
                      )) : <tr><td colSpan={3} className="muted">No hay técnicos activos.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : !adminError ? <p className="muted">Cargando resumen administrativo…</p> : null}
        </>
      ) : null}

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
