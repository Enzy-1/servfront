import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, X } from 'lucide-react'
import { upload } from '@vercel/blob/client'
import { api, API, getStoredUser, getToken } from '../api'

const empty = {
  clientId: '',
  brand: '',
  model: '',
  imei: '',
  color: '',
  issue: '',
  technician: '',
  assignedTo: '',
  estimatedCost: '',
  notes: '',
  estimatedReady: '',
}

function formatEstimatedCost(value) {
  return value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const MAX_DEVICE_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const USE_BLOB_UPLOADS = import.meta.env.PROD || import.meta.env.VITE_UPLOAD_MODE === 'blob'

export default function DeviceForm() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [clientQuery, setClientQuery] = useState('')
  const [form, setForm] = useState(empty)
  const [imageItems, setImageItems] = useState([])
  const imageUrls = useRef(new Set())
  const [imageError, setImageError] = useState('')
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', document: '' })
  const [showClientModal, setShowClientModal] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api('/clients').then(setClients).catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    api('/users/technicians').then(setTechnicians).catch((err) => setError(err.message))
  }, [])

  const imageFiles = imageItems.map(({ file }) => file)
  const imagePreviews = imageItems

  useEffect(() => () => {
    imageUrls.current.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function onImagesChange(event) {
    const input = event.currentTarget
    const selected = Array.from(input.files || [])
    input.value = ''
    if (!selected.length) return

    if (imageFiles.length + selected.length > MAX_DEVICE_IMAGES) {
      setImageError('Puedes adjuntar un máximo de 5 imágenes.')
      return
    }
    if (selected.some((file) => !IMAGE_TYPES.has(file.type))) {
      setImageError('Usa imágenes JPG, PNG o WebP.')
      return
    }
    if (selected.some((file) => file.size > MAX_IMAGE_SIZE)) {
      setImageError('Cada imagen debe pesar 5 MB o menos.')
      return
    }

    const items = selected.map((file) => {
      const url = URL.createObjectURL(file)
      imageUrls.current.add(url)
      return { file, url }
    })
    setImageItems((current) => [...current, ...items])
    setImageError('')
  }

  function removeImage(index) {
    const removed = imageItems[index]
    if (removed) {
      URL.revokeObjectURL(removed.url)
      imageUrls.current.delete(removed.url)
    }
    setImageItems((current) => current.filter((_, imageIndex) => imageIndex !== index))
    setImageError('')
  }

  const filteredClients = clients.filter((client) =>
    [client.name, client.phone, client.document, client.email]
      .some((value) => value?.toLowerCase().includes(clientQuery.trim().toLowerCase()))
  )
  const selectedClient = clients.find((client) => client._id === form.clientId)

  async function addClient(e) {
    e.preventDefault()
    setError('')
    try {
      const client = await api('/clients', {
        method: 'POST',
        body: JSON.stringify(newClient),
      })
      setClients((prev) => [client, ...prev])
      setForm((prev) => ({ ...prev, clientId: client._id }))
      setShowClientModal(false)
      setNewClient({ name: '', phone: '', email: '', document: '' })
    } catch (err) {
      setError(err.message)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        technician: technicians.find((technician) => technician.id === form.assignedTo)?.name || '',
        estimatedCost: Number(form.estimatedCost.replace(/\./g, '')) || 0,
      }
      let created

      if (USE_BLOB_UPLOADS) {
        const user = getStoredUser()
        if (!user?.id) throw new Error('No se pudo identificar al usuario de la sesión')

        const uploadedImages = []
        try {
          for (const file of imageFiles) {
            const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '_') || 'imagen'
            const blob = await upload(
              `device-images/${user.id}/${crypto.randomUUID()}-${safeName}`,
              file,
              {
                access: 'private',
                handleUploadUrl: `${API}/devices/uploads`,
                headers: { Authorization: `Bearer ${getToken()}` },
              },
            )
            uploadedImages.push({ filename: blob.pathname, contentType: file.type, size: file.size })
          }

          created = await api('/devices', {
            method: 'POST',
            body: JSON.stringify({ ...payload, images: uploadedImages }),
          })
        } catch (err) {
          if (uploadedImages.length) {
            await api('/devices/uploads/delete', {
              method: 'POST',
              body: JSON.stringify({ images: uploadedImages.map((image) => image.filename) }),
            }).catch(() => {})
          }
          throw err
        }
      } else {
        const body = new FormData()
        Object.entries(payload).forEach(([key, value]) => body.append(key, String(value)))
        imageFiles.forEach((file) => body.append('images', file))
        created = await api('/devices', { method: 'POST', body })
      }

      navigate(`/equipos/${created._id}`, { state: { reviewReceipt: true } })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <header className="page-head intake-page-head">
        <div>
          <span className="intake-eyebrow">ORDEN DE SERVICIO</span>
          <h1>Ingreso de equipo</h1>
          <p className="muted">Registra el equipo y el motivo de revisión.</p>
        </div>
      </header>

      {error ? <div className="alert">{error}</div> : null}

      <form className="intake-form" onSubmit={onSubmit}>
        <section className="intake-section">
          <div className="intake-section-heading">
            <span className="intake-section-number">01</span>
            <div>
              <h2>Datos del cliente</h2>
              <p className="muted">Vincula esta orden con una persona.</p>
            </div>
          </div>
          <div className="intake-client-controls">
            <label>
              Buscar cliente
              <input
                type="search"
                placeholder="Nombre, teléfono, cédula o correo"
                value={clientQuery}
                onChange={(e) => setClientQuery(e.target.value)}
              />
            </label>
            <label>
              Cliente seleccionado
              <select
                required
                value={form.clientId}
                onChange={(e) => setField('clientId', e.target.value)}
              >
                <option value="">{filteredClients.length ? 'Selecciona un cliente' : 'No se encontraron clientes'}</option>
                {filteredClients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name} — {client.phone}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="ghost intake-new-client" onClick={() => setShowClientModal(true)}>
              + Nuevo cliente
            </button>
          </div>
          {selectedClient ? (
            <div className="intake-selected-client">
              <span className="intake-client-mark" aria-hidden="true">
                {selectedClient.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <strong>{selectedClient.name}</strong>
                <span>{selectedClient.phone}{selectedClient.document ? ` · C.I. ${selectedClient.document}` : ''}</span>
              </div>
            </div>
          ) : null}
        </section>

        <section className="intake-section">
          <div className="intake-section-heading">
            <span className="intake-section-number">02</span>
            <div>
              <h2>Identificación del equipo</h2>
              <p className="muted">Datos para reconocer el dispositivo.</p>
            </div>
          </div>
          <div className="intake-fields">
            <label>
              Marca
              <input value={form.brand} onChange={(e) => setField('brand', e.target.value)} required />
            </label>
            <label>
              Modelo
              <input value={form.model} onChange={(e) => setField('model', e.target.value)} required />
            </label>
            <label>
              IMEI
              <input value={form.imei} onChange={(e) => setField('imei', e.target.value)} />
            </label>
            <label>
              Color
              <input value={form.color} onChange={(e) => setField('color', e.target.value)} />
            </label>
            <div className="intake-image-upload intake-wide">
              <div className="intake-image-upload-heading">
                <strong>Imágenes del equipo</strong>
                <span>{imageFiles.length}/{MAX_DEVICE_IMAGES}</span>
              </div>
              <label className="intake-image-picker">
                <ImagePlus size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>{imageFiles.length >= MAX_DEVICE_IMAGES ? 'Límite alcanzado' : 'Seleccionar imágenes'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={imageFiles.length >= MAX_DEVICE_IMAGES}
                  onChange={onImagesChange}
                />
              </label>
              <p className="intake-image-note muted">JPG, PNG o WebP · máximo 5 MB por imagen</p>
              {imageError ? <p className="intake-image-error" role="alert">{imageError}</p> : null}
              {imagePreviews.length ? (
                <div className="intake-image-grid">
                  {imagePreviews.map(({ file, url }, index) => (
                    <div className="intake-image-preview" key={`${file.name}-${file.lastModified}-${index}`}>
                      <img src={url} alt={`Vista previa de ${file.name}`} />
                      <div className="intake-image-preview-info">
                        <span title={file.name}>{file.name}</span>
                        <button
                          type="button"
                          className="ghost intake-image-remove"
                          aria-label={`Quitar ${file.name}`}
                          title="Quitar imagen"
                          onClick={() => removeImage(index)}
                        >
                          <X size={15} strokeWidth={2} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="intake-section">
          <div className="intake-section-heading">
            <span className="intake-section-number">03</span>
            <div>
              <h2>Revisión técnica</h2>
              <p className="muted">Describe la falla y organiza el trabajo.</p>
            </div>
          </div>
          <div className="intake-fields">
            <label className="intake-wide">
              Falla / motivo de ingreso
              <textarea
                rows={3}
                value={form.issue}
                onChange={(e) => setField('issue', e.target.value)}
                required
              />
            </label>
            <label>
              Técnico asignado
              <select value={form.assignedTo} onChange={(e) => setField('assignedTo', e.target.value)}>
                <option value="">Sin asignar</option>
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>{technician.name}</option>
                ))}
              </select>
            </label>
            <label className="intake-cost-label">
              Costo estimado
              <span className="intake-currency-field">
                <span className="intake-currency-prefix" aria-hidden="true">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.estimatedCost}
                  onChange={(e) => setField('estimatedCost', formatEstimatedCost(e.target.value))}
                />
              </span>
            </label>
          </div>
        </section>

        <section className="intake-section">
          <div className="intake-section-heading">
            <span className="intake-section-number">04</span>
            <div>
              <h2>Entrega y notas</h2>
              <p className="muted">Añade una fecha tentativa y detalles internos.</p>
            </div>
          </div>
          <div className="intake-fields">
            <label>
              Fecha estimada de entrega
              <input
                type="date"
                value={form.estimatedReady}
                onChange={(e) => setField('estimatedReady', e.target.value)}
              />
            </label>
            <label className="intake-wide">
              Notas internas
              <textarea rows={2} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
            </label>
          </div>
        </section>

        <div className="intake-submit-row">
          <span className="muted">Los campos obligatorios están marcados en el formulario.</span>
          <button type="submit" disabled={saving}>
            {saving ? 'Guardando ingreso…' : 'Registrar ingreso'}
          </button>
        </div>
      </form>

      {showClientModal ? (
        <div className="modal-backdrop" onClick={() => setShowClientModal(false)}>
          <div
            className="modal-card client-create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-client-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head client-create-head">
              <div>
                <span className="intake-eyebrow">AGENDA DE CLIENTES</span>
                <h2 id="new-client-title">Nuevo cliente</h2>
                <p className="muted">Completa los datos de contacto para vincularlo al ingreso.</p>
              </div>
              <button
                type="button"
                className="ghost client-modal-close"
                onClick={() => setShowClientModal(false)}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <form className="form-grid modal-form client-create-form" onSubmit={addClient}>
              <label className="client-modal-full">
                Nombre
                <input
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Nombre y apellido"
                  autoFocus
                  required
                />
              </label>
              <label>
                Teléfono
                <input
                  type="tel"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="Número de contacto"
                  required
                />
              </label>
              <label>
                Cédula
                <input
                  value={newClient.document}
                  onChange={(e) => setNewClient({ ...newClient, document: e.target.value })}
                  placeholder="Número de identificación"
                />
              </label>
              <label className="client-modal-full">
                Correo <span className="muted">(opcional)</span>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="nombre@correo.com"
                />
              </label>

              <div className="full row modal-actions client-create-actions">
                <button type="button" className="ghost" onClick={() => setShowClientModal(false)}>
                  Cancelar
                </button>
                <button type="submit">Guardar y seleccionar</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
