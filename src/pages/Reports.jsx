import { useState } from 'react'
import { Download } from 'lucide-react'
import { api } from '../api'

const COLUMNS = [
  ['ticket', 'Ticket'],
  ['client', 'Cliente'],
  ['brand', 'Marca'],
  ['model', 'Modelo'],
  ['status', 'Estado'],
  ['technician', 'Técnico'],
  ['createdAt', 'Fecha de ingreso'],
  ['estimatedCost', 'Costo estimado'],
  ['finalCost', 'Costo final'],
  ['paid', 'Pagado'],
  ['balance', 'Saldo pendiente'],
  ['partsCost', 'Costo de repuestos'],
  ['grossMarginBeforeOtherCosts', 'Margen antes de otros costos'],
]

function csvCell(value) {
  let text = String(value ?? '')
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export default function Reports() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function exportReport(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const rows = await api(`/reports/devices${params.size ? `?${params}` : ''}`)
      const csv = [
        COLUMNS.map(([, label]) => csvCell(label)).join(','),
        ...rows.map((row) => COLUMNS.map(([key]) => csvCell(row[key])).join(',')),
      ].join('\r\n')
      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `servtec-reporte-${from || 'inicio'}-${to || 'hoy'}.csv`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage(`Reporte descargado: ${rows.length} equipos.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Reportes</h1>
          <p className="muted">Exporta operaciones, pagos y costos por fecha de ingreso.</p>
        </div>
      </header>

      {error ? <div className="alert" role="alert">{error}</div> : null}
      {message ? <div className="alert success" role="status">{message}</div> : null}

      <form className="panel form-grid report-form" onSubmit={exportReport}>
        <label>
          Desde
          <input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} />
        </label>
        <div className="full">
          <button type="submit" disabled={loading}>
            <Download size={17} aria-hidden="true" />
            {loading ? 'Preparando reporte…' : 'Descargar CSV'}
          </button>
        </div>
      </form>
      <p className="muted report-note">El reporte incluye valores estimados de margen; no contempla mano de obra, impuestos ni otros gastos.</p>
    </div>
  )
}