
  import { Injectable } from '@angular/core'
  import * as jsPDF from 'jspdf'
  import html2canvas from 'html2canvas'
  
  @Injectable({
    providedIn: 'root'
  })
  export class PdfExportService {
async exportToPdf(htmlElement: HTMLElement, fileName: string) {
  const originalOverflow = htmlElement.style.overflow
  const originalHeight = htmlElement.style.height
  htmlElement.style.overflow = 'visible'
  htmlElement.style.height = 'auto'

  try {
    const chartImageDatas = await this.captureChartImages(htmlElement)
    const elementToExport = htmlElement.cloneNode(true) as HTMLElement
    document.body.appendChild(elementToExport)
    
    try {
      this.removeUnwantedElements(elementToExport)
      this.replaceTextareasWithDivs(elementToExport)
      await this.replaceChartsWithImages(elementToExport, chartImageDatas)
      
      const contentHeight = elementToExport.scrollHeight
      const contentWidth = elementToExport.scrollWidth
      
      const canvas = await html2canvas(elementToExport, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: contentWidth,
        height: contentHeight,
        scrollX: 0,
        scrollY: 0
      })

      const pdf = new jsPDF.jsPDF({
        orientation: contentWidth > contentHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgProps = pdf.getImageProperties(canvas.toDataURL('image/png'))
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      pdf.addImage(canvas, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
      pdf.save(fileName)
    } finally {
      document.body.removeChild(elementToExport)
    }
  } finally {
    htmlElement.style.overflow = originalOverflow
    htmlElement.style.height = originalHeight
  }
}
  
    private async captureChartImages(htmlElement: HTMLElement): Promise<Map<string, {url: string, width: number, height: number}>> {
      const chartImageMap = new Map<string, {url: string, width: number, height: number}>()
      const chartCanvases = htmlElement.querySelectorAll('canvas.charts')
      
      for (const canvas of Array.from(chartCanvases)) {
        const htmlCanvas = canvas as HTMLCanvasElement
        await new Promise(resolve => setTimeout(resolve, 300)) 
        
        const scale = 2 
        const tempCanvas = document.createElement('canvas')
        const width = htmlCanvas.offsetWidth
        const height = htmlCanvas.offsetHeight
        
        tempCanvas.width = width * scale
        tempCanvas.height = height * scale
        
        const ctx = tempCanvas.getContext('2d')
        if (ctx) {
          ctx.scale(scale, scale)
          ctx.drawImage(htmlCanvas, 0, 0, width, height)
          
          const dataUrl = tempCanvas.toDataURL('image/png')
          chartImageMap.set(htmlCanvas.id, {
            url: dataUrl,
            width: width,
            height: height
          })
        }
      }
      
      return chartImageMap
    }
  
    private async replaceChartsWithImages(element: HTMLElement, 
                                       chartImageDatas: Map<string, {url: string, width: number, height: number}>) {
      const chartCanvases = element.querySelectorAll('canvas.charts')
      
      chartCanvases.forEach((canvas: HTMLCanvasElement) => {
        const imageData = chartImageDatas.get(canvas.id)
        if (imageData) {
          const img = document.createElement('img')
          img.src = imageData.url
          
          img.style.width = `${imageData.width}px`
          img.style.height = `${imageData.height}px`
          img.style.position = 'absolute'
          img.style.top = '0'
          img.style.left = '0'
          
          const container = document.createElement('div')
          container.style.width = `${imageData.width}px`
          container.style.height = `${imageData.height}px`
          container.style.position = 'relative'
          container.style.overflow = 'hidden'
          container.appendChild(img)
          
          canvas.parentNode?.insertBefore(container, canvas)
          canvas.remove()
        }
      })
    }



  private removeUnwantedElements(element: HTMLElement) {
    const unwantedSelectors = ['.resize-handle', '.change-handle']
    unwantedSelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector)
      elements.forEach(el => el.remove())
    })
  }

  private replaceTextareasWithDivs(element: HTMLElement) {
    const textareas = element.querySelectorAll('textarea.text')
    
    textareas.forEach((textarea: HTMLTextAreaElement) => {
      const div = document.createElement('div')
      div.className = 'text-pdf-preview'
      
      this.copyStyles(textarea, div)
      
      div.style.whiteSpace = 'pre-wrap'
      div.textContent = textarea.value
      
      textarea.parentNode!.replaceChild(div, textarea)
    })
  }

  private copyStyles(source: HTMLElement, target: HTMLElement) {
   const stylesToCopy = [
      'width', 'height', 'top', 'left', 'position', 'color',
      'fontFamily', 'fontSize', 'fontWeight', 'textAlign',
      'padding', 'margin', 'border', 'backgroundColor',
      'lineHeight', 'letterSpacing', 'textDecoration'
    ]
    
    const computedStyle = window.getComputedStyle(source)
    stylesToCopy.forEach(property => {
      target.style[property as any] = computedStyle.getPropertyValue(property)
    })
    
    target.style.overflow = 'hidden'
    target.style.boxSizing = 'border-box'
  }
}