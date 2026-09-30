import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { STATUS_LABELS, formatDate } from '../status'

export default function DeviceTracking() {
  const { token } = useParams()
  const [device, setDevice] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api(`/devices/tracking/${encodeURIComponent(token)}`)
      .then((data) => {
        if (active) setDevice(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [token])

  return (
    <main className="public-approval">
      <section className="panel public-approval-panel">
        <p className="ticket">SEGUIMIENTO DE SERVICIO</p>
        <h1>Estado de tu equipo</h1>
        {error ? <div className="alert" role="alert">{error}</div> : null}
        {!device && !error ? <p className="muted">Cargando seguimiento…</p> : null}
        {device ? (
          <>
            <p className="muted">Ticket {device.ticket}</p>
            <h2>{device.brand} {device.model}</h2>
            <p><span className={`badge ${device.status}`}>{STATUS_LABELS[device.status]}</span></p>
            <p className="muted">Última actualización: {formatDate(device.updatedAt)}</p>
            <h3>Avance</h3>
            <ol className="timeline">
              {[...device.history].reverse().map((item, index) => (
                <li key={`${item.at}-${index}`}>
                  <strong>{STATUS_LABELS[item.status]}</strong>
                  <span>{formatDate(item.at)}</span>
                </li>
              ))}
            </ol>
          </>
        ) : null}
      </section>
    </main>
  )
}