import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMoney } from '../status'

const STATUS_COLORS = {
  recibido: '#32a9b8',
  diagnostico: '#c39b40',
  esperando_piezas: '#df8145',
  en_reparacion: '#29946f',
  listo: '#71a64a',
  entregado: '#4777a8',
  cancelado: '#bf5662',
}

export default function DashboardCharts({ data, statusData }) {
  const statusWithData = statusData.filter((status) => status.count > 0)

  return (
    <section className="dashboard-charts">
      <article className="panel dashboard-chart-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Distribución de equipos</h2>
            <p className="muted">Porcentaje del total registrado</p>
          </div>
          <Link to="/estados">Ver estados</Link>
        </div>
        {statusWithData.length ? (
          <div className="dashboard-status-chart">
            <div className="dashboard-donut-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusWithData}
                    dataKey="count"
                    nameKey="name"
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={2}
                    stroke="none"
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, payload }) => {
                      if (payload.percent < 6) return null
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.52
                      const angle = (-midAngle * Math.PI) / 180
                      const x = cx + radius * Math.cos(angle)
                      const y = cy + radius * Math.sin(angle)
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#fff"
                          fontSize={11}
                          fontWeight={700}
                          textAnchor="middle"
                          dominantBaseline="central"
                          paintOrder="stroke"
                          stroke="rgba(0, 0, 0, 0.35)"
                          strokeWidth={2}
                        >
                          {payload.percent}%
                        </text>
                      )
                    }}
                  >
                    {statusWithData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, _name, item) => [`${value} (${item.payload.percent}%)`, 'Equipos']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="dashboard-donut-total">
                <strong>{data.total}</strong>
                <span>equipos</span>
              </div>
            </div>
            <div className="dashboard-status-legend">
              {statusData.map((entry) => (
                <Link to={`/equipos?status=${entry.status}`} key={entry.status} className="dashboard-legend-row">
                  <span className="dashboard-legend-dot" style={{ backgroundColor: STATUS_COLORS[entry.status] }} />
                  <span>{entry.name}</span>
                  <strong>{entry.count}</strong>
                  <small>{entry.percent}%</small>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="dashboard-chart-empty">Aún no hay equipos registrados.</div>
        )}
      </article>

      <article className="panel dashboard-chart-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Actividad mensual</h2>
            <p className="muted">Ingresos nuevos y equipos entregados · últimos 6 meses</p>
          </div>
        </div>
        <div className="dashboard-bar-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthly} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="created" name="Ingresos" fill="#299eae" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="delivered" name="Entregados" fill="#74a84c" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dashboard-revenue-strip">
          <span>Recaudo registrado este mes</span>
          <strong>{formatMoney(data.revenue)}</strong>
        </div>
      </article>
    </section>
  )
}