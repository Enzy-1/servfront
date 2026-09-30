import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { formatMoney } from '../status'

const APPROVAL_LABELS = {
  pending: 'Pendiente de respuesta',
  approved: 'Presupuesto aprobado',
  rejected: 'Presupuesto rechazado',
}

export default function EstimateApproval() {
  const { token } = useParams()
  const [estimate, setEstimate] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    api(`/devices/approval/${encodeURIComponent(token)}`)
      .then((data) => {
        if (active) setEstimate(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [token])

  async function respond(decision) {
    setSaving(true)
    setError('')
    try {
      const result = await api(`/devices/approval/${encodeURIComponent(token)}`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      })
      setEstimate((current) => ({ ...current, approvalStatus: result.approvalStatus }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="public-approval">
      <section className="panel public-approval-panel">
        <p className="ticket">SERVICIO TÉCNICO</p>
        <h1>Autorización de reparación</h1>
        {error ? <div className="alert" role="alert">{error}</div> : null}
        {!estimate && !error ? <p className="muted">Cargando presupuesto…</p> : null}
        {estimate ? (
          <>
            <p className="muted">Ticket {estimate.ticket}</p>
            <h2>{estimate.brand} {estimate.model}</h2>
            <dl className="details">
              <div>
                <dt>Diagnóstico</dt>
                <dd>{estimate.issue}</dd>
              </div>
              <div>
                <dt>Presupuesto estimado</dt>
                <dd>{formatMoney(estimate.estimatedCost)}</dd>
              </div>
              <div>
                <dt>Respuesta</dt>
                <dd>{APPROVAL_LABELS[estimate.approvalStatus] || 'Solicitud no disponible'}</dd>
              </div>
            </dl>
            {estimate.approvalStatus === 'pending' ? (
              <div className="public-approval-actions">
                <button type="button" disabled={saving} onClick={() => respond('approved')}>
                  {saving ? 'Enviando…' : 'Aprobar presupuesto'}
                </button>
                <button type="button" className="ghost" disabled={saving} onClick={() => respond('rejected')}>
                  Rechazar
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  )
}