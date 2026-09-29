import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, FileText, Share2, X } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { createDeviceReceiptPdf } from '../deviceReceipt'
import { STATUS_LABELS, STATUS_ORDER, formatDate, formatMoney } from '../status'

export default function DeviceDetail() {
  const { isAdmin } = useAuth()
  const location = useLocation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [device, setDevice] = useState(null)
  const [imageUrls, setImageUrls] = useState([])
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)
  const [showReceiptReview, setShowReceiptReview] = useState(Boolean(location.state?.reviewReceipt))
  const [receiptLoading, setReceiptLoading] = useState(false)
  const [receiptReviewed, setReceiptReviewed] = useState(false)
  const [receiptError, setReceiptError] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [status, setStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [finalCost, setFinalCost] = useState('')
  const [error, setError] = useState('')
  const receiptGenerationRequested = useRef(false)
  const receiptUrlRef = useRef('')

  function receiptErrorMessage(err) {
    receiptGenerationRequested.current = false
    setReceiptError(err.message || 'No se pudo generar el comprobante PDF')
  }

  const generateReceipt = useCallback(async (receiptDevice) => {
    if (!receiptDevice) return
    setReceiptLoading(true)
    setReceiptError('')
    setShareMessage('')
    setReceiptReviewed(false)
    try {
      const photos = await Promise.all((receiptDevice.images || []).map(async (image) => ({
        blob: await api(`/devices/${id}/images?filename=${encodeURIComponent(image.filename)}`, { responseType: 'blob' }),
        contentType: image.contentType,
      })))
      const blob = await createDeviceReceiptPdf(receiptDevice, photos)
      const file = new File([blob], `${receiptDevice.ticket}-comprobante.pdf`, { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      if (receiptUrlRef.current) URL.revokeObjectURL(receiptUrlRef.current)
      receiptUrlRef.current = url
      setReceiptFile(file)
      setReceiptUrl(url)
    } catch (err) {
      receiptErrorMessage(err)
    } finally {
      setReceiptLoading(false)
    }
  }, [id])

  useEffect(() => {
    let cancelled = false
    api(`/devices/${id}`)
      .then((data) => {
        if (cancelled) return
        setDevice(data)
        setStatus(data.status)
        setFinalCost(data.finalCost || '')
        if (!data.images?.length) setImageUrls([])
        if (location.state?.reviewReceipt && !receiptGenerationRequested.current) {
          setShowReceiptReview(true)
          receiptGenerationRequested.current = true
          generateReceipt(data)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [generateReceipt, id, location.state?.reviewReceipt])

  useEffect(() => () => {
    if (receiptUrlRef.current) URL.revokeObjectURL(receiptUrlRef.current)
  }, [])

  function openReceiptReview() {
    setShowReceiptReview(true)
    if (!receiptUrl && !receiptLoading && device) {
      receiptGenerationRequested.current = true
      generateReceipt(device)
    }
  }

  function closeReceiptReview() {
    setShowReceiptReview(false)
    setReceiptReviewed(false)
  }

  function downloadReceipt() {
    if (!receiptUrl || !receiptFile) return
    const link = document.createElement('a')
    link.href = receiptUrl
    link.download = receiptFile.name
    link.click()
  }

  async function shareReceipt() {
    if (!receiptFile || !receiptReviewed) return
    setShareMessage('')
    const message = `Comprobante de ingreso ${device.ticket} - ${device.brand} ${device.model}`

    try {
      if (navigator.share && navigator.canShare?.({ files: [receiptFile] })) {
        await navigator.share({
          files: [receiptFile],
          title: `Comprobante ${device.ticket}`,
          text: message,
        })
        return
      }

      const phoneDigits = String(device.client?.phone || '').replace(/\D/g, '')
      const whatsappPhone = phoneDigits.length === 10 ? `57${phoneDigits}` : phoneDigits
      const recipient = whatsappPhone ? `${whatsappPhone}?` : '?'
      const whatsappUrl = `https://wa.me/${recipient}text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
      downloadReceipt()
      setShareMessage('Adjunta el PDF descargado en WhatsApp para completar el envío.')
    } catch (err) {
      if (err.name !== 'AbortError') setShareMessage(err.message || 'No se pudo abrir la opción para compartir.')
    }
  }

  useEffect(() => {
    if (!device?.images?.length) return undefined

    let cancelled = false
    const objectUrls = []

    Promise.all(device.images.map(async (image) => {
      const blob = await api(`/devices/${id}/images?filename=${encodeURIComponent(image.filename)}`, { responseType: 'blob' })
      const url = URL.createObjectURL(blob)
      objectUrls.push(url)
      return url
    }))
      .then((urls) => {
        if (!cancelled) setImageUrls(urls)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [device?.images, id])

  async function updateStatus(e) {
    e.preventDefault()
    setError('')
    try {
      const updated = await api(`/devices/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, statusNote, finalCost }),
      })
      setDevice(updated)
      setStatusNote('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove() {
    if (!confirm('¿Eliminar este registro?')) return
    await api(`/devices/${id}`, { method: 'DELETE' })
    navigate('/equipos')
  }

  if (error && !device) return <div className="alert">{error}</div>
  if (!device) return <p className="muted">Cargando…</p>

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="ticket">{device.ticket}</p>
          <h1>
            {device.brand} {device.model}
          </h1>
          <p className="muted">{device.color || 'Sin color'} · IMEI {device.imei || '—'}</p>
        </div>
        <div className="device-detail-actions">
          <button type="button" className="ghost receipt-open-button" onClick={openReceiptReview}>
            <FileText size={17} strokeWidth={1.8} aria-hidden="true" />
            {receiptUrl ? 'Ver comprobante PDF' : 'Generar comprobante PDF'}
          </button>
          <span className={`badge ${device.status}`}>{STATUS_LABELS[device.status]}</span>
        </div>
      </header>

      {error ? <div className="alert">{error}</div> : null}

      {showReceiptReview ? (
        <section className="receipt-review">
          <div className="receipt-review-heading">
            <div>
              <span className="intake-eyebrow">COMPROBANTE {device.ticket}</span>
              <h2>Revisa los datos y las fotos</h2>
              <p className="muted">Confirma la información antes de compartir el PDF con el cliente.</p>
            </div>
            <button type="button" className="ghost receipt-close-button" aria-label="Cerrar vista previa" title="Cerrar vista previa" onClick={closeReceiptReview}>
              <X size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
          {receiptLoading ? <p className="muted receipt-loading">Generando comprobante…</p> : null}
          {receiptError ? (
            <div className="alert receipt-alert">
              <span>{receiptError}</span>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  receiptGenerationRequested.current = true
                  generateReceipt()
                }}
              >
                Reintentar
              </button>
            </div>
          ) : null}
          {receiptUrl ? (
            <>
              <iframe className="receipt-preview" src={receiptUrl} title={`Vista previa del comprobante ${device.ticket}`} />
              <div className="receipt-review-actions">
                <label className="receipt-confirm">
                  <input type="checkbox" checked={receiptReviewed} onChange={(event) => setReceiptReviewed(event.target.checked)} />
                  <span>Confirmo que revisé los datos y las fotos.</span>
                </label>
                <div className="receipt-buttons">
                  <button type="button" className="ghost" onClick={downloadReceipt}>
                    <Download size={17} strokeWidth={1.8} aria-hidden="true" />
                    Descargar PDF
                  </button>
                  <button type="button" disabled={!receiptReviewed} onClick={shareReceipt}>
                    <Share2 size={17} strokeWidth={1.8} aria-hidden="true" />
                    Compartir por WhatsApp
                  </button>
                </div>
                {shareMessage ? <p className="receipt-share-message" role="status">{shareMessage}</p> : null}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {imageUrls.length ? (
        <section className="panel device-photo-panel">
          <div className="device-photo-heading">
            <h2>Imágenes del equipo</h2>
            <span className="muted">{imageUrls.length}</span>
          </div>
          <div className="device-photo-grid">
            {imageUrls.map((url, index) => (
              <a className="device-photo-link" href={url} target="_blank" rel="noreferrer" key={url}>
                <img src={url} alt={`Imagen ${index + 1} de ${device.brand} ${device.model}`} />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <div className="split">
        <section className="panel">
          <h2>Detalle del servicio</h2>
          <dl className="details">
            <div>
              <dt>Cliente</dt>
              <dd>
                <Link to="/clientes">{device.client?.name}</Link>
                <br />
                <span className="muted">{device.client?.phone}</span>
              </dd>
            </div>
            <div>
              <dt>Falla</dt>
              <dd>{device.issue}</dd>
            </div>
            <div>
              <dt>Accesorios</dt>
              <dd>{device.accessories || '—'}</dd>
            </div>
            <div>
              <dt>Técnico</dt>
              <dd>{device.technician || 'Sin asignar'}</dd>
            </div>
            <div>
              <dt>Costo estimado</dt>
              <dd>{formatMoney(device.estimatedCost)}</dd>
            </div>
            <div>
              <dt>Costo final</dt>
              <dd>{formatMoney(device.finalCost)}</dd>
            </div>
            <div>
              <dt>Entrega estimada</dt>
              <dd>{device.estimatedReady ? formatDate(device.estimatedReady) : '—'}</dd>
            </div>
            <div>
              <dt>Ingreso</dt>
              <dd>{formatDate(device.createdAt)}</dd>
            </div>
          </dl>
          {device.notes ? <p className="notes">{device.notes}</p> : null}
          {isAdmin ? (
            <button type="button" className="danger" onClick={remove}>
              Eliminar registro
            </button>
          ) : null}
        </section>

        {isAdmin ? (
          <section className="panel">
            <h2>Actualizar proceso</h2>
            <form className="stack" onSubmit={updateStatus}>
              <label>
                Estado
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_ORDER.map((key) => (
                    <option key={key} value={key}>
                      {STATUS_LABELS[key]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Costo final
                <input
                  type="number"
                  min="0"
                  value={finalCost}
                  onChange={(e) => setFinalCost(e.target.value)}
                />
              </label>
              <label>
                Nota del cambio
                <textarea rows={3} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
              </label>
              <button type="submit">Guardar proceso</button>
            </form>

            <h3>Historial</h3>
            <ol className="timeline">
              {[...(device.history || [])].reverse().map((h, i) => (
                <li key={`${h.at}-${i}`}>
                  <strong>{STATUS_LABELS[h.status]}</strong>
                  <span>{formatDate(h.at)} · {h.by || 'Sistema'}</span>
                  {h.note ? <p>{h.note}</p> : null}
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <section className="panel">
            <h2>Historial</h2>
            <ol className="timeline">
              {[...(device.history || [])].reverse().map((h, i) => (
                <li key={`${h.at}-${i}`}>
                  <strong>{STATUS_LABELS[h.status]}</strong>
                  <span>{formatDate(h.at)} · {h.by || 'Sistema'}</span>
                  {h.note ? <p>{h.note}</p> : null}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  )
}
