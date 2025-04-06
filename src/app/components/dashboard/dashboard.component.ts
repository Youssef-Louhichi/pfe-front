import { Component, ElementRef, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core'
import { ConnexionsService } from 'src/app/services/connexions.service'
import { UsersService } from 'src/app/services/users.service'
import { Chart, registerables } from 'chart.js'
import { Graph } from 'src/app/models/graph'
import { Rapport } from 'src/app/models/rapport'
import { RapportService } from 'src/app/services/rapport.service'
import { User } from 'src/app/models/user'
import { Connexion } from 'src/app/models/connexion'
import { MatDialog, MatDialogRef } from '@angular/material/dialog'
import { TitlePopupComponent } from '../title-popup/title-popup.component'
import { SharedToggleSidebarService } from 'src/app/services/shared-toggle-sidebar.service'
import { PdfExportService } from 'src/app/services/pdf-export.service'
Chart.register(...registerables)

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  constructor(private el: ElementRef, private rapportService: RapportService,
    private dialog: MatDialog, private toggleService: SharedToggleSidebarService,
    private pdfExportService: PdfExportService) { }

  isCollapsed = true
  rapport: Rapport
  rapportGraphs: Graph[] = []
  rapportHistory: any[] = []
  redoStack: any[] = []
  draggingGraph: any = null
  resizingGraph: any = null
  offsetX = 0
  offsetY = 0
  private dragStartPosition = { x: 0, y: 0 }
  private readonly DRAG_THRESHOLD = 5
  selectedX = ''
  selectedY = ''
  selectedGraph: any
  selectedColors: string[] = []
  selectedChartType = ""
  tools: string

  @ViewChild('page') pageRef: ElementRef
  @ViewChildren('text') textAreas: QueryList<ElementRef<HTMLTextAreaElement>>

  ngOnInit(): void {
    setTimeout(() => {
      this.toggleService.setCollapsed(true)
    })

    this.toggleService.collapsed$.subscribe(c => {
      this.isCollapsed = c
    })

    const storedData = localStorage.getItem('rapport')
    if (storedData) {
      const myObject = JSON.parse(storedData)
      this.rapport = myObject
      this.rapportGraphs = this.rapport.graphs
      this.rapportGraphs.forEach(graph => {
        if (graph.format == "chart")
          setTimeout(() => this.createChart(graph), 0)
      })
    }
    this.rapport.user = new User(null, null, Number(localStorage.getItem("userId")), [], null)
    this.rapport.cnxrapport = new Connexion(Number(localStorage.getItem("idConnection")), null, null, null, null, null, null, null, [], [])
  }

  saveState() {
    this.rapportHistory.push(JSON.parse(JSON.stringify(this.rapportGraphs)))
    this.redoStack = []
  }

  undo() {
    if (this.rapportHistory.length > 0) {
      this.redoStack.push(JSON.parse(JSON.stringify(this.rapportGraphs)))
      this.rapportGraphs = this.rapportHistory.pop()!
      this.rapportGraphs.forEach(graph => {
        if (graph.format == "chart")
          setTimeout(() => this.createChart(graph), 0)
      })
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      this.rapportHistory.push(JSON.parse(JSON.stringify(this.rapportGraphs)))
      this.rapportGraphs = this.redoStack.pop()!
      this.rapportGraphs.forEach(graph => {
        if (graph.format == "chart")
          setTimeout(() => this.createChart(graph), 0)
      })
    }
  }

  onDataAdded(newItem: Graph) {
    this.saveState()
    this.rapportGraphs.push(newItem)
  }

  startDrag(event: MouseEvent, graph: Graph, page: HTMLElement): void {
    this.dragStartPosition = { x: event.clientX, y: event.clientY }
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('mouseup', this.handleMouseUp)
    this.draggingGraph = graph
    this.offsetX = event.clientX - graph.leftpos
    this.offsetY = event.clientY - graph.toppos
  }

  private handleMouseMove = (event: MouseEvent): void => {
    const dx = Math.abs(event.clientX - this.dragStartPosition.x)
    const dy = Math.abs(event.clientY - this.dragStartPosition.y)
    if (dx > this.DRAG_THRESHOLD || dy > this.DRAG_THRESHOLD) {
      document.removeEventListener('mouseup', this.handleMouseUp)
      document.addEventListener('mousemove', this.dragGraph)
      document.addEventListener('mouseup', this.stopDrag)
      document.removeEventListener('mousemove', this.handleMouseMove)
      this.saveState()
      this.dragGraph(event)
    }
  }

  private handleMouseUp = (): void => {
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
    this.draggingGraph = null
  }

  dragGraph = (event: MouseEvent): void => {
    if (this.draggingGraph) {
      const workspaceBounds = this.pageRef.nativeElement.getBoundingClientRect()
      const newLeft = Math.max(0, Math.min(event.clientX - this.offsetX, workspaceBounds.width - this.draggingGraph.width))
      const newTop = Math.max(0, Math.min(event.clientY - this.offsetY, workspaceBounds.height - this.draggingGraph.height))
      this.draggingGraph.leftpos = newLeft
      this.draggingGraph.toppos = newTop
    }
  }

  stopDrag = (): void => {
    this.draggingGraph = null
    document.removeEventListener('mousemove', this.dragGraph)
    document.removeEventListener('mouseup', this.stopDrag)
  }

  startResize(event: MouseEvent, graph: Graph): void {
    this.saveState()
    this.resizingGraph = {
      ref: graph,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: graph.width,
      startHeight: graph.height
    }
    document.addEventListener('mousemove', this.resizeGraph)
    document.addEventListener('mouseup', this.stopResize)
    event.stopPropagation()
    event.preventDefault()
  }

  resizeGraph = (event: MouseEvent): void => {
    if (this.resizingGraph) {
      event.preventDefault()
      const { ref, startX, startY, startWidth, startHeight } = this.resizingGraph
      const workspaceBounds = this.pageRef.nativeElement.getBoundingClientRect()
      let newWidth = startWidth + (event.clientX - startX)
      let newHeight = startHeight + (event.clientY - startY)
      newWidth = Math.min(newWidth, workspaceBounds.width - ref.leftpos)
      newHeight = Math.min(newHeight, workspaceBounds.height - ref.toppos)
      ref.width = Math.max(10, newWidth)
      ref.height = Math.max(10, newHeight)
    }
  }

  stopResize = (): void => {
    this.resizingGraph = null
    document.removeEventListener('mousemove', this.resizeGraph)
    document.removeEventListener('mouseup', this.stopResize)
  }

  changeFormat(graph: Graph) {
    this.saveState()
    if (graph.format == "text")
      return
    graph.format = graph.format === 'table' ? 'chart' : 'table'
    if (graph.format === 'chart') {
      setTimeout(() => this.createChart(graph), 0)
    }
  }

  charts: { [key: string]: Chart } = {}

  createChart(graph: Graph): void {
    const canvas = this.el.nativeElement.querySelector(`#chartCanvas-${graph.id}`)
    if (canvas && graph.headers.length == 2) {
      if (!graph.columnX || !graph.columnY) {
        graph.columnX = graph.headers[0]
        graph.columnY = graph.headers[1]
      }
      let tabX = graph.data.map(row => row[graph.columnX])
      let tabY = graph.data.map(row => row[graph.columnY])
      if (!graph.chartType)
        graph.chartType = "bar"
      if (!graph.colors) {
        graph.colors = tabY.map(() => '#004B91')
      }
      if (this.charts[graph.id]) {
        this.charts[graph.id].destroy()
      }
      this.charts[graph.id] = new Chart(`chartCanvas-${graph.id}`, {
        type: graph.chartType,
        data: {
          labels: tabX,
          datasets: [
            {
              label: 'Dataset',
              data: tabY,
              backgroundColor: graph.colors,
              borderWidth: 1
            }
          ]
        },
        options: {
          maintainAspectRatio: false,
          animation: {
            duration: 0
          },
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      })
    }
  }

  selectGraph(graph: any) {
    this.selectedGraph = graph
    if (graph.format == "chart") {
      this.selectedX = graph.columnX
      this.selectedY = graph.columnY
      this.changeToolBar("data")
      if (!this.selectedGraph.colors) {
        this.selectedGraph.colors = this.selectedGraph.data.map(() => '#004B91')
      }
      this.selectedColors = [...this.selectedGraph.colors]
      this.selectedChartType = graph.chartType
    }
    else {
      if (graph.format == "text") {
        this.changeToolBar("text")
      }
      else {
        this.changeToolBar("table")
      }
    }
  }

  switchAxes() {
    this.saveState()
    let aux = this.selectedGraph.columnX
    this.selectedGraph.columnX = this.selectedGraph.columnY
    this.selectedGraph.columnY = aux
    this.selectedX = this.selectedGraph.columnX
    this.selectedY = this.selectedGraph.columnY
    this.createChart(this.selectedGraph)
  }

  updateChartColors() {
    this.saveState()
    this.selectedGraph.colors = [...this.selectedColors]
    this.updateChart()
  }

  updateChart() {
    this.saveState()
    if (this.charts[this.selectedGraph.id]) {
      this.selectedGraph.colors = this.selectedColors
      this.selectedGraph.chartType = this.selectedChartType
      this.createChart(this.selectedGraph)
    }
  }

  async save() {
    for (let graph of this.rapportGraphs) {
      graph.id = null
    }
    this.rapport.graphs = this.rapportGraphs
    await this.checkAndOpenDialog()
    if (this.rapport.titre === null) return
    this.rapportService.createRapport(this.rapport).subscribe((data) => {
      localStorage.setItem('rapport', JSON.stringify(data))
      this.rapport = data
    })
  }

  async checkAndOpenDialog(): Promise<void> {
    if (this.rapport.titre && this.rapport.titre.trim() !== '') {
      return
    }
    return new Promise((resolve) => {
      const dialogRef = this.dialog.open(TitlePopupComponent, {
        width: '400px',
        data: { currentTitle: this.rapport.titre },
      })
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.rapport.titre = result
        }
        resolve()
      })
    })
  }

  addText() {
    this.saveState()
    if (this.rapportGraphs) {
      let t = new Graph(
        Date.now(),
        null,
        [{ text: "" }],
        "text",
        100,
        250,
        100,
        100,
        null,
        null,
        ["#000"],
        null,
        null
      )
      this.rapportGraphs.push(t)
      this.selectedGraph = t
      setTimeout(() => this.focusOnSelectedTextArea(), 0)
    }
  }

  focusOnSelectedTextArea() {
    if (!this.selectedGraph) return;
    const target = this.textAreas.find(
      (el) => el.nativeElement.getAttribute('data-id') == this.selectedGraph?.id.toString()
    );
    if (target) {
      target.nativeElement.focus();
    }
  }

  changingText(graph: Graph, text: string) {
    this.saveState()

    if (text == "") {
      this.selectedGraph = graph
      this.deleteGraph()
      this.selectedGraph = null
      return
    }
    if (graph.data[0].text === text)
      return
    graph.data = [{ text: text }]
  }

  updateText(police: string, color: string) {
    this.saveState()
    if (color)
      this.selectedGraph.colors = [color.toString()]
  }

  changeToolBar(ch: string) {
    this.tools = ch
  }

  deleteGraph() {
    console.log(1)
    this.saveState()
    this.rapportGraphs = this.rapportGraphs.filter(graph => graph !== this.selectedGraph)
  }


  exportToPdf() {
    this.save()
    this.pdfExportService.exportToPdf(this.pageRef.nativeElement,this.rapport.titre);
  }
}