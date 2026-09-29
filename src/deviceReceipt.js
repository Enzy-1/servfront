import { formatDate, formatMoney } from './status'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 17

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('No se pudo leer una imagen del equipo'))
    reader.readAsDataURL(blob)
  })
}

export async function createDeviceReceiptPdf(device, photos) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const contentWidth = PAGE_WIDTH - MARGIN * 2
  let y = 48

  function addPage() {
    pdf.addPage()
    y = MARGIN
  }

  function addSection(title) {
    if (y + 13 > PAGE_HEIGHT - MARGIN) addPage()
    pdf.setFillColor(231, 241, 246)
    pdf.roundedRect(MARGIN, y, contentWidth, 8, 1.5, 1.5, 'F')
    pdf.setTextColor(0, 104, 143)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text(title.toUpperCase(), MARGIN + 3, y + 5.4)
    y += 13
    pdf.setTextColor(35, 48, 58)
  }

  function addRow(label, value) {
    const text = String(value || '-').trim() || '-'
    const lines = pdf.splitTextToSize(text, contentWidth - 49)
    const rowHeight = Math.max(6, lines.length * 4.8)
    if (y + rowHeight + 3 > PAGE_HEIGHT - MARGIN) addPage()

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setTextColor(92, 106, 116)
    pdf.text(label, MARGIN + 1, y)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(35, 48, 58)
    pdf.text(lines, MARGIN + 49, y)
    y += rowHeight + 3
  }

  pdf.setFillColor(16, 29, 41)
  pdf.rect(0, 0, PAGE_WIDTH, 39, 'F')
  pdf.setFillColor(37, 216, 255)
  pdf.rect(0, 39, PAGE_WIDTH, 1.5, 'F')
  pdf.setTextColor(218, 231, 237)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('DIGITAL SOLUTIONS  /  SERVICIO TECNICO', MARGIN, 13)
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(19)
  pdf.text('Comprobante de ingreso', MARGIN, 24)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(205, 219, 227)
  pdf.text(`${device.ticket}  -  ${formatDate(device.createdAt)}`, MARGIN, 33)

  addSection('Datos del cliente')
  addRow('Nombre', device.client?.name)
  addRow('Telefono', device.client?.phone)
  addRow('Documento', device.client?.document)
  addRow('Correo', device.client?.email)

  addSection('Equipo recibido')
  addRow('Marca y modelo', `${device.brand} ${device.model}`)
  addRow('IMEI', device.imei)
  addRow('Color', device.color)
  addRow('Falla reportada', device.issue)
  addRow('Tecnico asignado', device.technician || 'Sin asignar')
  addRow('Costo estimado', formatMoney(device.estimatedCost))
  addRow('Entrega estimada', device.estimatedReady ? formatDate(device.estimatedReady) : '')

  if (photos.length) {
    addSection(`Fotos del equipo (${photos.length})`)
    const boxWidth = (contentWidth - 8) / 2
    const boxHeight = 61
    let rowY = y

    for (let index = 0; index < photos.length; index += 1) {
      if (index % 2 === 0) {
        if (rowY + boxHeight > PAGE_HEIGHT - MARGIN) {
          addPage()
          addSection('Fotos del equipo (continuacion)')
          rowY = y
        }
        y = rowY
      }

      const column = index % 2
      const x = MARGIN + column * (boxWidth + 8)
      const { blob, contentType } = photos[index]
      const dataUrl = await blobToDataUrl(blob)
      const image = pdf.getImageProperties(dataUrl)
      const imageScale = Math.min((boxWidth - 4) / image.width, (boxHeight - 4) / image.height)
      const imageWidth = image.width * imageScale
      const imageHeight = image.height * imageScale

      pdf.setDrawColor(211, 221, 227)
      pdf.roundedRect(x, rowY, boxWidth, boxHeight, 1.5, 1.5, 'S')
      pdf.addImage(
        dataUrl,
        contentType === 'image/png' ? 'PNG' : contentType === 'image/webp' ? 'WEBP' : 'JPEG',
        x + (boxWidth - imageWidth) / 2,
        rowY + (boxHeight - imageHeight) / 2,
        imageWidth,
        imageHeight,
        undefined,
        'FAST',
      )

      if (column === 1 || index === photos.length - 1) {
        rowY += boxHeight + 8
        y = rowY
      }
    }
  }

  const pageCount = pdf.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page)
    pdf.setDrawColor(220, 228, 232)
    pdf.line(MARGIN, PAGE_HEIGHT - 13, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 13)
    pdf.setTextColor(112, 125, 133)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(`Comprobante ${device.ticket}`, MARGIN, PAGE_HEIGHT - 8)
    pdf.text(`Pagina ${page} de ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, { align: 'right' })
  }

  return pdf.output('blob')
}