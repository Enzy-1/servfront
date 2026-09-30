import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { formatDate } from '../status'

const ACTION_LABELS = {
  device_created: 'Equipo ingresado',
  device_deleted: 'Equipo eliminado',
  device_updated: 'Equipo actualizado',
  estimate_requested: 'Presupuesto enviado',
  estimate_approved: 'Presupuesto aprobado',
  estimate_rejected: 'Presupuesto rechazado',
  tracking_link_created: 'Enlace de seguimiento creado',
  payment_received: 'Pago recibido',
  part_created: 'Repuesto creado',
  part_consumed: 'Repuesto utilizado',
  inventory_adjusted: 'Inventario ajustado',
  part_deleted: 'Repuesto eliminado',
  user_created: 'Usuario creado',
  user_updated: 'Usuario actualizado',
  user_activated: 'Usuario activado',
  user_deactivated: 'Usuario desactivado',
  user_deleted: 'Usuario eliminado',
}

export default function Audit() {
  const [entries, setEntries] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api('/audit')
      .then((data) => {
        if (active) setEntries(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [])

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized) return entries
    return entries.filter((entry) => [
      entry.actorName,
      entry.ticket,
      entry.action,
      ACTION_LABELS[entry.action],
      JSON.stringify(entry.details),
    ].some((value) => value?.toLocaleLowerCase().includes(normalized)))
  }, [entries, query])

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Auditoría</h1>
          <p className="muted">Actividad administrativa reciente.</p>
        </div>
      </header>

      <div className="toolbar">
        <input type="search" aria-label="Buscar en auditoría" placeholder="Buscar usuario, ticket o acción" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      {error ? <div className="alert" role="alert">{error}</div> : null}

      <section className="panel">
        <table>
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Registro</th><th>Detalle</th></tr></thead>
          <tbody>
            {filteredEntries.length ? filteredEntries.map((entry) => (
              <tr key={entry._id}>
                <td>{formatDate(entry.createdAt)}</td>
                <td>{entry.actorName}</td>
                <td>{ACTION_LABELS[entry.action] || entry.action}</td>
                <td>
                  {entry.ticket || (entry.entityType === 'user' ? 'Usuario' : entry.entityType === 'part' ? 'Repuesto' : '—')}
                  {entry.entityType === 'device' && entry.entityId ? <><br /><Link to={`/equipos/${entry.entityId}`}>Abrir equipo</Link></> : null}
                </td>
                <td><code>{JSON.stringify(entry.details || {})}</code></td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="muted">{entries.length ? 'No hay coincidencias.' : 'Aún no hay actividad registrada.'}</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}