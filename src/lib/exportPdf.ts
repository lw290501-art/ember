import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/** Renders a DOM node to a multi-page A4 PDF and triggers a download. */
export async function exportElementToPdf(el: HTMLElement, filename: string) {
  // Pin the render window to the element's own size instead of trusting the
  // browser's ambient window.innerWidth/innerHeight — those can be 0 (e.g. an
  // unfocused/backgrounded tab), which makes html2canvas silently fail to
  // find the cloned element.
  const rect = el.getBoundingClientRect()
  const canvas = await html2canvas(el, {
    useCORS: true,
    scale: 2,
    backgroundColor: '#fdf6f2',
    windowWidth: Math.max(document.documentElement.scrollWidth, Math.ceil(rect.right)),
    windowHeight: Math.max(document.documentElement.scrollHeight, Math.ceil(rect.bottom)),
  })

  const imgData = canvas.toDataURL('image/jpeg', 0.92)
  const pdf = new jsPDF('p', 'pt', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pdfWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
  heightLeft -= pdfHeight

  while (heightLeft > 0) {
    position -= pdfHeight
    pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight
  }

  pdf.save(filename)
}
