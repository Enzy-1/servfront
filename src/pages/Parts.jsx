import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { formatMoney } from '../status'

const EMPTY_PART = { name: '', sku: '', stock: '0', minimumStock: '0', unitCost: '0' }

export default function Parts() {
  const { isAdmin } = useAuth()
  const [parts, setParts] = useState([])
  const [draft, setDraft] = useState(EMPTY_PART)
  const [updates, setUpdates] = useState({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadParts() {
    setParts(await api('/parts'))
  }

  useEffect(() => {
    let active = true
    api('/parts')
      .then((data) => {
        if (active) setParts(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [])

  async function createPart(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await api('/parts', { method: 'POST', body: JSON.stringify(draft) })
      setDraft(EMPTY_PART)
      setMessage('Repuesto agregado al inventario.')
      await loadParts()
    } catch (err) {
      setError(err.message)
    }
  }

  async function updatePart(part) {
    setError('')
    setMessage('')
    try {
      await api(`/parts/${part._id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...part, ...(updates[part._id] || {}) }),
      })
      setMessage(`Inventario actualizado: ${part.name}.`)
      setUpdates((current) => ({ ...current, [part._id]: undefined }))
      await loadParts()
    } catch (err) {
      setError(err.message)
    }
  }

  async function removePart(part) {
    if (!confirm(`¿Eliminar ${part.name} del inventario?`)) return
    setError('')
    try {
      await api(`/parts/${part._id}`, { method: 'DELETE' })
      await loadParts()
    } catch (err) {
      setError(err.message)
    }
  }

  function updateField(id, key, value) {
    setUpdates((current) => ({
      ...current,
      [id]: { ...current[id], [key]: value },
    }))
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Repuestos</h1>
          <p className="muted">Existencias disponibles para las reparaciones.</p>
        </div>
      </header>

      {error ? <div className="alert" role="alert">{error}</div> : null}
      {message ? <div className="alert success" role="status">{message}</div> : null}

      {isAdmin ? (
        <form className="panel form-grid parts-form" onSubmit={createPart}>
          <h2 className="full">Agregar repuesto</h2>
          <label>Nombre<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label>
          <label>Código<input value={draft.sku} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} required /></label>
          <label>Existencias<input type="number" min="0" step="1" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: event.target.value })} required /></label>
          <label>Stock mínimo<input type="number" min="0" step="1" value={draft.minimumStock} onChange={(event) => setDraft({ ...draft, minimumStock: event.target.value })} required /></label>
          <label>Costo unitario<input type="number" min="0" step="100" value={draft.unitCost} onChange={(event) => setDraft({ ...draft, unitCost: event.target.value })} required /></label>
          <div className="full"><button type="submit">Agregar al inventario</button></div>
        </form>
      ) : null}

      <section className="panel parts-table-panel">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Repuesto</th>
              <th>Existencias</th>
              <th>Mínimo</th>
              <th>Costo unitario</th>
              {isAdmin ? <th>Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {parts.length ? parts.map((part) => (
              <tr key={part._id}>
                <td>{part.sku}</td>
                <td>{part.name}</td>
                <td>
                  {isAdmin ? (
                    <input aria-label={`Existencias de ${part.name}`} type="number" min="0" step="1" value={updates[part._id]?.stock ?? part.stock} onChange={(event) => updateField(part._id, 'stock', event.target.value)} />
                  ) : part.stock}
                  {part.stock <= part.minimumStock ? <span className="stock-warning"> · Bajo</span> : null}
                </td>
                <td>
                  {isAdmin ? (
                    <input aria-label={`Mínimo de ${part.name}`} type="number" min="0" step="1" value={updates[part._id]?.minimumStock ?? part.minimumStock} onChange={(event) => updateField(part._id, 'minimumStock', event.target.value)} />
                  ) : part.minimumStock}
                </td>
                <td>{formatMoney(part.unitCost)}</td>
                {isAdmin ? (
                  <td className="parts-actions">
                    <button type="button" className="ghost" onClick={() => updatePart(part)}>Guardar stock</button>
                    <button type="button" className="danger" onClick={() => removePart(part)}>Eliminar</button>
                  </td>
                ) : null}
              </tr>
            )) : (
              <tr><td colSpan={isAdmin ? 6 : 5} className="muted">No hay repuestos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}