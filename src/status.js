export const STATUS_LABELS = {
  recibido: 'Recibido',
  diagnostico: 'Diagnóstico',
  esperando_piezas: 'Esperando piezas',
  en_reparacion: 'En reparación',
  listo: 'Listo para entregar',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const STATUS_ORDER = Object.keys(STATUS_LABELS)

export function formatMoney(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
