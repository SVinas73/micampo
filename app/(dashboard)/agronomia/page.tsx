"use client"

import { CardDescription } from "@/components/ui/card"

import type React from "react"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import {
  AlertTriangle,
  TrendingUp,
  Sprout,
  Activity,
  Droplets,
  Bug,
  Download,
  Map,
  MapPin,
  Trash2,
  Edit,
  FileText,
  RefreshCw,
  Info,
  Sparkles,
  Calendar,
  Clock,
  Camera,
  Banknote,
  CloudSun,
  Pill,
} from "lucide-react"
import dynamic from "next/dynamic"

// Importar mapa dinámicamente
const MapaPrecision = dynamic(() => import("@/components/MapaPrecision"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  ),
})

// TYPES
interface Lote {
  id: string
  nombre: string
  hectareas: number
  cultivo: string | null
  coordenadas: string | null
  centroLatitud: number | null
  centroLongitud: number | null
  marcadoresGeo?: any[]
  imagenesSatelitales?: any[]
}

interface AlertaActiva {
  id: string
  loteNumero: string
  loteNombre: string
  cultivo: string
  imagen: string | null
  imageTitle: string
  estadoLabel: string
  estadoColor: string
  alerta: string
  alertaBadge: string
  severidad: string
  severidadPorcentaje: number
  severidadColor: string
  hectareasAfectadas: string
  tiempo: string
  riesgoPerdida: number
  riesgoDescripcion: string
  recomendacion: string
  recomendacionColor: string
}

interface AnalisisSueloData {
  cardsLotes: Array<{
    id: string
    nombre: string
    subtitulo: string
    parametros: Array<{
      nombre: string
      valor: string
      porcentaje: number
      color: string
      necesitaFertilizante: boolean
    }>
  }>
  resultadosLaboratorio: Array<{
    id: string
    fecha: string
    lote: string
    phEst: string
    fosforo: string
    nTotal: number
    ph: number
    estado: string
  }>
  evolucionHistorica: Array<{
    año: string
    nitrogeno: number
    optimo: number
  }>
}

// DATOS MOCK - DETECCIÓN (Exacto al Figma)
const mockDataDeteccion = {
  metricas: {
    alertasActivas: 5,
    confianzaIA: 96,
    vigorPromedio: 0.78,
    vigorEstado: "Alto",
    riesgoEconomico: 1250,
    monitoreoSemanal: 85,
  },
  alertasActivas: [
    {
      id: "1",
      loteNumero: "4",
      loteNombre: "Lote 4 (Maíz)",
      cultivo: "Roya Común",
      imagen: null,
      imageTitle: "Detección Satelital IVN",
      estadoLabel: "Estado: R1 (Floración)",
      estadoColor: "bg-yellow-100 text-yellow-800 border-yellow-300",
      alerta: "Detección Satelital IVN",
      alertaBadge: "bg-red-100 text-red-700 border-red-300",
      severidad: "ALTA",
      severidadPorcentaje: 35,
      severidadColor: "bg-red-500",
      hectareasAfectadas: "15 Ha afectadas, hace 2h",
      tiempo: "hace 2h",
      riesgoPerdida: 4500,
      riesgoDescripcion: "Proyección a cosecha",
      recomendacion: "Aplicar Fungicida (Triazol)",
      recomendacionColor: "bg-emerald-50 border-emerald-300 text-emerald-700",
    },
    {
      id: "2",
      loteNumero: "2",
      loteNombre: "Lote 2 (Maíz)",
      cultivo: "Oruga Cogollera",
      imagen: null,
      imageTitle: "Foto de Monitoreo (Dron)",
      estadoLabel: "Estado: VB (Vegetativo)",
      estadoColor: "bg-green-100 text-green-800 border-green-300",
      alerta: "Foto de Monitoreo (Bron)",
      alertaBadge: "bg-orange-100 text-orange-700 border-orange-300",
      severidad: "MEDIA",
      severidadPorcentaje: 15,
      severidadColor: "bg-orange-500",
      hectareasAfectadas: "8 Ha afectadas, Ayer",
      tiempo: "Ayer",
      riesgoPerdida: 1200,
      riesgoDescripcion: "Daño foliar progresivo",
      recomendacion: "Monitoreo + Insecticida",
      recomendacionColor: "bg-blue-50 border-blue-300 text-blue-700",
    },
    {
      id: "3",
      loteNumero: "7",
      loteNombre: "Lote 7 (Soja)",
      cultivo: "Mancha Marrón",
      imagen: null,
      imageTitle: "Detección Satelital IVN",
      estadoLabel: "Estado: R3 (Form. Vainas)",
      estadoColor: "bg-yellow-100 text-yellow-800 border-yellow-300",
      alerta: "Detección Satelital IVN",
      alertaBadge: "bg-yellow-100 text-yellow-700 border-yellow-300",
      severidad: "BAJA",
      severidadPorcentaje: 5,
      severidadColor: "bg-yellow-500",
      hectareasAfectadas: "20 Ha afectadas, hace 4h",
      tiempo: "hace 4h",
      riesgoPerdida: 500,
      riesgoDescripcion: "Impacto leve",
      recomendacion: "Monitoreo Intensivo",
      recomendacionColor: "bg-gray-50 border-gray-300 text-gray-700",
    },
    {
      id: "4",
      loteNumero: "1",
      loteNombre: "Lote 1 (Trigo)",
      cultivo: "Pulgón Verde",
      imagen: null,
      imageTitle: "Foto de Campo",
      estadoLabel: "Estado: Z31 (Primer Nudo)",
      estadoColor: "bg-yellow-100 text-yellow-800 border-yellow-300",
      alerta: "Foto de Campo",
      alertaBadge: "bg-red-100 text-red-700 border-red-300",
      severidad: "ALTA",
      severidadPorcentaje: 40,
      severidadColor: "bg-red-500",
      hectareasAfectadas: "30 Ha afectadas, hace 1h",
      tiempo: "hace 1h",
      riesgoPerdida: 3200,
      riesgoDescripcion: "Rápida propagación",
      recomendacion: "Aplicar Insecticida Sistémico",
      recomendacionColor: "bg-emerald-50 border-emerald-300 text-emerald-700",
    },
    {
      id: "5",
      loteNumero: "5",
      loteNombre: "Lote 5 (Girasol)",
      cultivo: "Esclerotinia",
      imagen: null,
      imageTitle: "Detección Satelital IVN",
      estadoLabel: "Estado: R5 (Llamado Grano)",
      estadoColor: "bg-yellow-100 text-yellow-800 border-yellow-300",
      alerta: "Detección Satelital IVN",
      alertaBadge: "bg-orange-100 text-orange-700 border-orange-300",
      severidad: "MEDIA",
      severidadPorcentaje: 20,
      severidadColor: "bg-orange-500",
      hectareasAfectadas: "12 Ha afectadas, Ayer",
      tiempo: "Ayer",
      riesgoPerdida: 2100,
      riesgoDescripcion: "Riesgo de vuelco",
      recomendacion: "Evaluar Daño y Cosecha Anticipada",
      recomendacionColor: "bg-blue-50 border-blue-300 text-blue-700",
    },
  ],
  estrategiaSugerida: {
    producto: "Fungicida (Triazol + Estrob.)",
    dosis: "400 cc/Ha",
    precio: "Prox. 4he",
    costo: "$28/Ha",
    analisis:
      "Análisis IA: Efectiva contra la roya en etapas de campo. La combinación Triaz + Estrobilurina (Phas) combina protección curativa, preventiva y antisporulante.",
  },
  probabilidades: [
    { titulo: "Roya Control (Posible insight)", valor: 88, checkmark: true },
    { titulo: "Tendencia: Alta (>75% vs wpr)", valor: 82, checkmark: false, icono: "📊" },
    { titulo: "Lotes Afectados: Lote 4, Lote 7", valor: 68, checkmark: false, icono: "📍" },
    { titulo: "Total del Maíz (Basophilum tarsoh)", valor: 42 },
    { titulo: "Cereopapas (Mesaba Ora)", valor: 16 },
    { titulo: "Expansión: Bajando", valor: 15, checkmark: false, icon: "📉" },
    { titulo: "Lotes Afectados: Lote 5 (Sector None)", valor: 15, checkmark: false, icon: "📍" },
  ],
}

// DATOS MOCK - RESUMEN
const mockDataResumen = {
  metricas: {
    alertasActivas: 5,
    confianzaIA: 96,
    vigorPromedio: 0.78,
    vigorEstado: "Alto",
    riesgoEconomico: 1250,
    monitoreoSemanal: 85,
  },
  alertasActivas: [
    {
      id: "1",
      loteNombre: "Lote 3 (Norte)",
      loteNumero: "3 lotes 6 Parcelas",
      estado: "CRÍTICO",
      alertaTipo: "Roya Amarilla",
      alertaDetalle: "5 ha afectadas. Hgo 70",
      accionRecomendada: "Aplicar fungicida",
    },
    {
      id: "2",
      loteNombre: "Lote 7 (Este)",
      loteNumero: "Lote 7 (18ha)",
      estado: "ATENCIÓN",
      alertaTipo: "Hongo Pudrición",
      alertaDetalle: "12 ha detectados",
      accionRecomendada: "Ver Suelo afectado",
    },
  ],
  estrategiaSugerida: {
    producto: "Fungicida (Triazol + Estrob.)",
    dosis: "1.5 L/ha",
    aplicacion: "Aplicar: Obtener valores lotes 3,4 y 7...",
    efectividad: 92,
  },
  probabilidades: [
    { titulo: "Roya Crítica (Parcela riesgo)", valor: 89 },
    { titulo: "Probabilidad: Alta (75-100 m prob.)", valor: 82 },
  ],
}

export default function AgronomiaPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null)
  const [analisisSueloData, setAnalisisSueloData] = useState<AnalisisSueloData | null>(null)
  const [vistaActual, setVistaActual] = useState<"mapa" | "lista">("mapa")
  const [tabFicha, setTabFicha] = useState("resumen")
  const [alertasActivas, setAlertasActivas] = useState<AlertaActiva[]>(mockDataDeteccion.alertasActivas)
  const [loteDialogOpen, setLoteDialogOpen] = useState(false)
  const [loteForm, setLoteForm] = useState({ nombre: "", hectareas: "", cultivo: "" })
  const [coordenadasTemporal, setCoordenadasTemporal] = useState<any>(null)
  const [hectareasTemporal, setHectareasTemporal] = useState<number>(0)
  const [mostrarInformacion, setMostrarInformacion] = useState(false)

  const activeTab = searchParams.get("tab") || "deteccion"
  const activeSubTab = searchParams.get("subtab") || "analisis"

  useEffect(() => {
    fetchLotes()
  }, [])

  useEffect(() => {
    if (activeTab === "planificador" && activeSubTab === "analisis") {
      fetchAnalisisSuelo()
    }
  }, [activeTab, activeSubTab])

  const fetchLotes = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/lotes")
      if (response.ok) {
        const data = await response.json()
        setLotes(data)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalisisSuelo = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/agronomia/analisis-suelo")
      if (response.ok) {
        const data = await response.json()
        setAnalisisSueloData(data)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: string) => {
    router.push(`/agronomia?tab=${tab}`)
  }

  const handleSubTabChange = (subtab: string) => {
    router.push(`/agronomia?tab=planificador&subtab=${subtab}`)
  }

  const handleImagenChange = (alertaId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAlertasActivas((prev) =>
          prev.map((alerta) => {
            if (alerta.id === alertaId) {
              return { ...alerta, imagen: reader.result as string, imageTitle: file.name }
            }
            return alerta
          }),
        )
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLoteCreado = (coordenadas: any, hectareas: number) => {
    setCoordenadasTemporal(coordenadas)
    setHectareasTemporal(hectareas)
    setLoteForm({ ...loteForm, hectareas: hectareas.toFixed(2) })
    setLoteDialogOpen(true)
  }

  const handleCreateLote = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let centroLat = null
      let centroLon = null

      if (coordenadasTemporal?.geometry?.coordinates?.[0]) {
        const coords = coordenadasTemporal.geometry.coordinates[0]
        const lats = coords.map((c: number[]) => c[1])
        const lons = coords.map((c: number[]) => c[0])
        centroLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length
        centroLon = lons.reduce((a: number, b: number) => a + b, 0) / lons.length
      }

      const response = await fetch("/api/lotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...loteForm,
          coordenadas: coordenadasTemporal,
          centroLatitud: centroLat,
          centroLongitud: centroLon,
        }),
      })

      if (response.ok) {
        setLoteDialogOpen(false)
        setLoteForm({ nombre: "", hectareas: "", cultivo: "" })
        setCoordenadasTemporal(null)
        fetchLotes()
        alert("Lote creado exitosamente")
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const eliminarLote = async (id: string) => {
    if (!confirm("¿Eliminar este lote?")) return
    try {
      const response = await fetch(`/api/lotes/${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchLotes()
        if (loteSeleccionado?.id === id) {
          setLoteSeleccionado(null)
        }
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "CRÍTICO":
        return "bg-red-100 text-red-700 border-red-300"
      case "ATENCIÓN":
        return "bg-orange-100 text-orange-700 border-orange-300"
      case "MEDIO":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getProgressColor = (color: string) => {
    const colors: any = {
      green: "[&>div]:bg-green-500",
      orange: "[&>div]:bg-orange-500",
      yellow: "[&>div]:bg-yellow-500",
    }
    return colors[color] || colors.green
  }

  const getBadgeStyles = (estado: string) => {
    switch (estado) {
      case "Alto":
        return "bg-red-100 text-red-700 border border-red-200"
      case "Óptimo":
        return "bg-green-100 text-green-700 border border-green-200"
      case "Apta":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const totalCampos = 2
  const totalLotes = lotes.length || 120
  const hectareasTotales = lotes.reduce((sum, l) => sum + l.hectareas, 0) || 10521
  const lotesSinAsignar = lotes.filter((l) => !l.cultivo).length || 0
  const totalMarcadores = 1

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* HEADER - Exacto al Figma */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Agronomía</h1>
          <p className="text-sm text-gray-600 mt-1">Campo Digital</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 shadow-sm">
            Cargar Imagen de Lote
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 shadow-sm">Reportar Plaga</Button>
        </div>
      </div>

      {/* TABS PRINCIPALES */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumen">
            <Activity className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="lotes">
            <MapPin className="h-4 w-4 mr-2" />
            Lotes
          </TabsTrigger>
          <TabsTrigger value="labores">
            <Calendar className="h-4 w-4 mr-2" />
            Labores
          </TabsTrigger>
          <TabsTrigger value="cultivos">
            <Sprout className="h-4 w-4 mr-2" />
            Cultivos
          </TabsTrigger>
          <TabsTrigger value="deteccion">
            <Bug className="h-4 w-4 mr-2" />
            Detección Enfermedades
          </TabsTrigger>
          <TabsTrigger value="planificador">
            <TrendingUp className="h-4 w-4 mr-2" />
            Planificador de Siembras
          </TabsTrigger>
        </TabsList>

        {/* TAB: RESUMEN */}
        <TabsContent value="resumen" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Alertas Activas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-4xl font-bold">{mockDataResumen.metricas.alertasActivas}</div>
                  <TrendingUp className="h-5 w-5 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-400 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Confianza IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{mockDataResumen.metricas.confianzaIA}%</div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Vigor Promedio (NDVI)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {mockDataResumen.metricas.vigorPromedio.toFixed(2)}{" "}
                  <span className="text-lg text-gray-600">({mockDataResumen.metricas.vigorEstado})</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Riesgo Económico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-red-600">
                  ${mockDataResumen.metricas.riesgoEconomico.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Monitoreo Semanal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{mockDataResumen.metricas.monitoreoSemanal}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-2 border-orange-300 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Alertas Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockDataResumen.alertasActivas.map((alerta) => (
                    <div key={alerta.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                      <div className="w-20 h-20 bg-green-200 rounded flex-shrink-0">
                        <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <p className="font-semibold text-sm">{alerta.loteNombre}</p>
                            <p className="text-xs text-gray-600">{alerta.loteNumero}</p>
                          </div>
                          <Badge className={`${getEstadoColor(alerta.estado)} text-xs`}>{alerta.estado}</Badge>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <Bug className="h-3 w-3 text-red-600" />
                            <span className="font-medium">{alerta.alertaTipo}</span>
                          </div>
                          <p className="text-gray-600">{alerta.alertaDetalle}</p>
                          <Button size="sm" variant="outline" className="mt-2 h-7 text-xs bg-transparent">
                            {alerta.accionRecomendada}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-2 border-emerald-400 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Sprout className="h-4 w-4 text-emerald-600" />
                    Estrategia de Control Sugerida
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold text-sm">{mockDataResumen.estrategiaSugerida.producto}</p>
                      <p className="text-xs text-gray-600">Dosis: {mockDataResumen.estrategiaSugerida.dosis}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700">{mockDataResumen.estrategiaSugerida.aplicacion}</p>
                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Efectividad esperada</span>
                      <span className="font-bold">{mockDataResumen.estrategiaSugerida.efectividad}%</span>
                    </div>
                    <Progress
                      value={mockDataResumen.estrategiaSugerida.efectividad}
                      className="h-2 [&>div]:bg-emerald-500"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Probabilidades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mockDataResumen.probabilidades.map((prob, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700">{prob.titulo}</span>
                        <span className="font-bold">{prob.valor}%</span>
                      </div>
                      <Progress value={prob.valor} className="h-1.5 [&>div]:bg-red-500" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="deteccion" className="space-y-4 mt-6">
          {/* SUB-TABS: Información y Análisis IA */}
          <Tabs defaultValue="informacion" className="space-y-4">
            <TabsList>
              <TabsTrigger value="informacion">
                <Info className="h-4 w-4 mr-2" />
                Información
              </TabsTrigger>
              <TabsTrigger value="analisis">
                <Sparkles className="h-4 w-4 mr-2" />
                Análisis IA
              </TabsTrigger>
            </TabsList>

            {/* ============================================ */}
            {/* TAB: INFORMACIÓN */}
            {/* ============================================ */}
            <TabsContent value="informacion" className="space-y-4">
              {/* Métricas Superiores - ESTILO DASHBOARD */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Card 1: Alertas Activas */}
                <Card className="bg-white border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Alertas Activas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${mockDataDeteccion.metricas.alertasActivas > 0 ? "text-red-600" : "text-gray-900"}`}>
                      {mockDataDeteccion.metricas.alertasActivas}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">críticas</p>
                  </CardContent>
                </Card>

                {/* Card 2: Confianza IA - Con borde verde y sparkle */}
                <Card className="bg-white border-2 border-emerald-400 hover:shadow-md transition-shadow relative">
                  <Sparkles className="h-4 w-4 text-yellow-500 absolute top-3 right-3" />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Confianza IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {mockDataDeteccion.metricas.confianzaIA}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">precisión</p>
                  </CardContent>
                </Card>

                {/* Card 3: Vigor Promedio */}
                <Card className="bg-white border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Vigor Promedio (NDVI)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {mockDataDeteccion.metricas.vigorPromedio.toFixed(2)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{mockDataDeteccion.metricas.vigorEstado}</p>
                  </CardContent>
                </Card>

                {/* Card 4: Riesgo Económico */}
                <Card className="bg-white border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Riesgo Económico
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      ${mockDataDeteccion.metricas.riesgoEconomico.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">USD estimado</p>
                  </CardContent>
                </Card>

                {/* Card 5: Monitoreo Semanal */}
                <Card className="bg-white border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Monitoreo Semanal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {mockDataDeteccion.metricas.monitoreoSemanal}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">cobertura</p>
                  </CardContent>
                </Card>
              </div>

              {/* Contenido Principal: 2 columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_450px] gap-4">
                {/* Columna Izquierda: Alertas Activas */}
                <div>
                  <Card className="border-2 border-orange-400 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg relative max-w-full">
                    <Sparkles className="h-5 w-5 text-yellow-600 absolute top-4 right-4" />
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-bold text-gray-900">Alertas Activas</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto pb-3">
                      <div className="space-y-2.5 min-w-max">
                        {alertasActivas.map((alerta) => (
                          <div key={alerta.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                            {/* Layout horizontal - TODO EN UNA SOLA FILA */}
                            <div className="flex items-start gap-2.5">
                              {/* Sección 1: Info del Lote */}
                              <div className="w-[200px] flex-shrink-0 flex flex-col gap-1">
                                <p className="font-semibold text-sm text-gray-900 leading-tight">{alerta.loteNombre}</p>
                                <p className="text-xs text-gray-600">{alerta.cultivo}</p>
                                <Badge
                                  className={`${alerta.estadoColor} text-[10px] w-fit px-2 py-0.5 border flex items-center gap-1`}
                                >
                                  <Pill className="h-3 w-3" />
                                  <span className="truncate">{alerta.estadoLabel}</span>
                                </Badge>
                              </div>

                              {/* Divisor */}
                              <div className="h-20 w-px bg-gray-300 flex-shrink-0" />

                              {/* Sección 2: CÁMARA CON ÍCONO VISIBLE */}
                              <div className="w-[80px] flex-shrink-0 flex items-center justify-center">
                                <label className="cursor-pointer block">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImagenChange(alerta.id, e)}
                                  />
                                  {alerta.imagen ? (
                                    <div className="relative group">
                                      <img
                                        src={alerta.imagen}
                                        alt=""
                                        className="w-[75px] h-[60px] rounded object-cover border-2 border-gray-300 hover:opacity-70 transition-opacity"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded">
                                        <Camera className="h-8 w-8 text-white" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-[75px] h-[60px] bg-white rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all flex flex-col items-center justify-center gap-1">
                                      <Camera className="h-6 w-6 text-gray-400" />
                                      <span className="text-[8px] text-gray-500">Cargar foto</span>
                                    </div>
                                  )}
                                </label>
                              </div>

                              {/* Divisor */}
                              <div className="h-20 w-px bg-gray-300 flex-shrink-0" />

                              {/* Sección 3: Severidad */}
                              <div className="w-[200px] flex-shrink-0 flex flex-col gap-1">
                                <Badge
                                  className={`${
                                    alerta.severidad === "ALTA"
                                      ? "bg-red-100 text-red-700 border-red-300"
                                      : alerta.severidad === "MEDIA"
                                        ? "bg-orange-100 text-orange-700 border-orange-300"
                                        : "bg-yellow-100 text-yellow-700 border-yellow-300"
                                  } text-xs font-bold px-2 py-0.5 w-fit rounded-full border`}
                                >
                                  {alerta.severidad} ({alerta.severidadPorcentaje}%)
                                </Badge>
                                <p className="text-xs font-medium text-gray-700">{alerta.hectareasAfectadas}</p>
                              </div>

                              {/* Divisor */}
                              <div className="h-20 w-px bg-gray-300 flex-shrink-0" />

                              {/* Sección 4: Riesgo */}
                              <div className="w-[130px] flex-shrink-0 flex flex-col gap-0.5">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Activity className="h-3.5 w-3.5 text-gray-600" />
                                  <p className="text-[10px] font-semibold text-gray-700">Riesgo Pérdida:</p>
                                </div>
                                <p className="text-base font-bold text-red-600">
                                  ${alerta.riesgoPerdida.toLocaleString()}
                                </p>
                                <p className="text-xs font-medium text-gray-700">{alerta.riesgoDescripcion}</p>
                              </div>

                              {/* Divisor */}
                              <div className="h-20 w-px bg-gray-300 flex-shrink-0" />

                              {/* Sección 5: Recomendación Y Botón - EN COLUMNA */}
                              <div className="flex-1 min-w-[180px] flex flex-col gap-2 justify-center">
                                <Badge
                                  className={`${alerta.recomendacionColor} text-xs border px-3 py-1.5 font-semibold whitespace-nowrap w-fit`}
                                >
                                  {alerta.recomendacion}
                                </Badge>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs gap-1.5 px-3 border-gray-300 hover:bg-gray-50 transition-colors bg-transparent font-medium w-fit"
                                >
                                  <Clock className="h-3.5 w-3.5" />
                                  Agregar a Labores
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Columna Derecha: Estrategia y Probabilidades */}
                <div className="space-y-3 flex flex-col h-full">
                  {/* Estrategia de Control Sugerida */}
                  <Card className="border-2 border-emerald-400 shadow-lg bg-white relative">
                    <Sparkles className="h-4 w-4 text-yellow-500 absolute top-3 right-3 z-10" />
                    <CardHeader className="pb-3 pt-4">
                      <CardTitle className="text-base font-bold text-gray-900">
                        Estrategia de Control Sugerida
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Card interno con el producto */}
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-2">Estrategia de Control Sugerida</p>
                        
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0">
                            <img 
                              src="/pote.jpg" 
                              alt="Fungicida"
                              className="h-20 w-20 object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-gray-900 mb-2">
                              {mockDataDeteccion.estrategiaSugerida.producto}
                            </p>
                            <p className="text-xs text-gray-600 mb-3">
                              Tratamiento Prioritario para Roya
                            </p>
                          </div>
                        </div>
                        {/* Grid de 3 columnas: Dosis, Precio, Costo */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <div className="bg-white p-2 rounded border border-gray-200 flex flex-col items-center gap-1">
                              <Droplets className="h-4 w-4 text-blue-500" />
                              <p className="text-sm font-bold text-gray-900">
                                {mockDataDeteccion.estrategiaSugerida.dosis}
                              </p>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1">Dosis</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="bg-white p-2 rounded border border-gray-200 flex flex-col items-center gap-1">
                              <CloudSun className="h-4 w-4 text-orange-500" />
                              <p className="text-sm font-bold text-gray-900">
                                {mockDataDeteccion.estrategiaSugerida.precio}
                              </p>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1">Venta Óptima</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="bg-white p-2 rounded border border-gray-200 flex flex-col items-center gap-1">
                              <Banknote className="h-4 w-4 text-green-600" />
                              <p className="text-sm font-bold text-gray-900">
                                {mockDataDeteccion.estrategiaSugerida.costo}
                              </p>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1">Costo Estimado</p>
                          </div>
                        </div>
                      </div>

                      {/* Análisis IA */}
                      <div className="bg-gray-100 p-2.5 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          <span className="font-bold">Análisis IA:</span> {mockDataDeteccion.estrategiaSugerida.analisis.replace('Análisis IA: ', '')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Probabilidades */}
                  <Card className="border-2 border-yellow-400 shadow-lg bg-white relative flex-1">
                    <Sparkles className="h-4 w-4 text-yellow-500 absolute top-3 right-3 z-10" />
                    <CardHeader className="pb-3 pt-4">
                      <CardTitle className="text-base font-bold text-gray-900">Probabilidades</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 overflow-y-auto max-h-full">
                      {/* Item 1 */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-gray-900">1. Roya Común (Puccinia sorghi)</span>
                          <span className="font-bold text-sm text-gray-900">88%</span>
                        </div>
                        <Progress value={88} className="h-3 [&>div]:bg-red-500 mb-1.5" />
                        <div className="flex items-center gap-3 text-xs text-gray-700">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                            <span>Tendencia: Alta (+12% vs ayer)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-red-500" />
                            <span>Lotes Afectados: Lote 4, Lote 7</span>
                          </div>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-gray-900">2. Tizón del Maíz (Exserohilum turcicum)</span>
                          <span className="font-bold text-sm text-gray-900">42%</span>
                        </div>
                        <Progress value={42} className="h-3 [&>div]:bg-yellow-500 mb-1.5" />
                        <div className="flex items-center gap-3 text-xs text-gray-700">
                          <div className="flex items-center gap-1">
                            <Activity className="h-3.5 w-3.5 text-yellow-600" />
                            <span>Tendencia: Estable</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-yellow-600" />
                            <span>Lotes Afectados: Lote 2</span>
                          </div>
                        </div>
                      </div>

                      {/* Item 3 */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-gray-900">3. Cercospora (Mancha Gris)</span>
                          <span className="font-bold text-sm text-gray-900">15%</span>
                        </div>
                        <Progress value={15} className="h-3 [&>div]:bg-blue-400 mb-1.5" />
                        <div className="flex items-center gap-3 text-xs text-gray-700">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 text-blue-500 rotate-180" />
                            <span>Tendencia: Bajando</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-blue-500" />
                            <span>Lotes Afectados: Lote 5 (Sector Norte)</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            {/* ============================================ */}
            {/* TAB: ANÁLISIS IA */}
            {/* ============================================ */}
            <TabsContent value="analisis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Análisis con Inteligencia Artificial</CardTitle>
                  <CardDescription>Predicciones y recomendaciones basadas en IA</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Contenido de Análisis IA (a desarrollar)</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* TAB: LOTES */}
        <TabsContent value="lotes" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total de Campos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{totalCampos}</div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total de Lotes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{totalLotes}</div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Hectáreas Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{hectareasTotales.toLocaleString()} Ha</div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Lotes sin Asignar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{lotesSinAsignar}</div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Marcadores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{totalMarcadores}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button
              variant={vistaActual === "mapa" ? "default" : "outline"}
              onClick={() => setVistaActual("mapa")}
              className={vistaActual === "mapa" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Vista Mapa
            </Button>
            <Button
              variant={vistaActual === "lista" ? "default" : "outline"}
              onClick={() => setVistaActual("lista")}
              className={vistaActual === "lista" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Vista Lista
            </Button>
          </div>

          {vistaActual === "mapa" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle>Modo de Visualización</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-80px)]">
                    <MapaPrecision
                      lotes={lotes}
                      onLoteCreado={handleLoteCreado}
                      onMarcadorCreado={() => {}}
                      modoEdicion={true}
                    />
                  </CardContent>
                </Card>
              </div>

              <div>
                {loteSeleccionado ? (
                  <Card className="border-2 border-emerald-400 shadow-sm">
                    <CardHeader className="pb-3 bg-emerald-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Ficha Técnica del Lote</CardTitle>
                          <CardDescription className="text-sm font-semibold text-emerald-700">
                            {loteSeleccionado.nombre}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Tabs value={tabFicha} onValueChange={setTabFicha}>
                        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                          <TabsTrigger value="resumen">Resumen</TabsTrigger>
                          <TabsTrigger value="historial">Historial</TabsTrigger>
                          <TabsTrigger value="suelo">Suelo</TabsTrigger>
                          <TabsTrigger value="labores">Labores</TabsTrigger>
                        </TabsList>

                        <TabsContent value="resumen" className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium flex items-center gap-2">
                                <Activity className="h-4 w-4 text-emerald-600" />
                                NDVI
                              </span>
                              <span className="text-sm font-bold text-emerald-600">0.75</span>
                            </div>
                            <Progress value={75} className="h-2 [&>div]:bg-emerald-500" />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                Área Ha
                              </span>
                              <span className="text-sm font-bold">{loteSeleccionado.hectareas} ha</span>
                            </div>
                            <Progress value={90} className="h-2 [&>div]:bg-blue-500" />
                          </div>

                          <div className="pt-3 border-t">
                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-orange-600" />
                              Clima Local (7 días)
                            </p>
                            <div className="text-sm font-bold">45mm</div>
                            <p className="text-xs text-gray-500">Acumulados</p>
                            <div className="flex items-end gap-1 h-16 mt-2">
                              {[5, 8, 12, 3, 0, 10, 7].map((value, idx) => (
                                <div
                                  key={idx}
                                  className="flex-1 bg-blue-400 rounded-t"
                                  style={{ height: `${(value / 12) * 100}%` }}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-3">
                            <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                              <FileText className="h-4 w-4 mr-2" />
                              Nota
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                              Nueva Tarea
                            </Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="historial">
                          <p className="text-sm text-gray-500 py-4">Historial del lote</p>
                        </TabsContent>

                        <TabsContent value="suelo">
                          <p className="text-sm text-gray-500 py-4">Análisis de suelo</p>
                        </TabsContent>

                        <TabsContent value="labores">
                          <p className="text-sm text-gray-500 py-4">Labores realizadas</p>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Map className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">Seleccioná un lote</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {vistaActual === "lista" && (
            <Card>
              <CardHeader>
                <CardTitle>Listado de Lotes</CardTitle>
              </CardHeader>
              <CardContent>
                {lotes.length === 0 ? (
                  <div className="text-center py-8">
                    <Map className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No hay lotes creados</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {lotes.map((lote) => (
                      <Card
                        key={lote.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setLoteSeleccionado(lote)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{lote.nombre}</CardTitle>
                              <p className="text-sm text-gray-600 mt-1">
                                {lote.hectareas} ha{lote.cultivo && ` • ${lote.cultivo}`}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                eliminarLote(lote.id)
                              }}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {lote.coordenadas && (
                            <Badge variant="outline" className="text-xs">
                              <Map className="h-3 w-3 mr-1" />
                              Georreferenciado
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: PLANIFICADOR */}
        <TabsContent value="planificador" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Planes Generados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">3</div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Planes Aprobados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">2</div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Superficie Planificada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">850 Ha</div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Inversión Estimada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">0</div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Próxima Siembra</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">3/12/25</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeSubTab} onValueChange={handleSubTabChange}>
            <TabsList className="bg-white">
              <TabsTrigger value="planes">Planes de Siembra</TabsTrigger>
              <TabsTrigger value="analisis">Análisis de Suelo</TabsTrigger>
            </TabsList>

            <TabsContent value="planes">
              <Card>
                <CardContent className="py-8">
                  <p className="text-gray-500 text-center">Planes de Siembra</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analisis" className="space-y-6">
              {analisisSueloData && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {analisisSueloData.cardsLotes.map((lote) => (
                      <Card key={lote.id} className="border shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{lote.nombre}</CardTitle>
                          <CardDescription className="text-sm">{lote.subtitulo}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {lote.parametros.map((param, idx) => (
                            <div key={idx}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{param.nombre}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{param.valor}</span>
                                  {param.necesitaFertilizante && (
                                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 h-7 text-xs">
                                      Fertilizar P
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <Progress value={param.porcentaje} className={`h-2 ${getProgressColor(param.color)}`} />
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle>Últimos Resultados de Laboratorio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Lote</TableHead>
                              <TableHead>PH (est)</TableHead>
                              <TableHead>Fósforo</TableHead>
                              <TableHead>N (total)</TableHead>
                              <TableHead>pH</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">PDF</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analisisSueloData.resultadosLaboratorio.map((resultado) => (
                              <TableRow key={resultado.id}>
                                <TableCell>{new Date(resultado.fecha).toLocaleDateString("es")}</TableCell>
                                <TableCell>{resultado.lote}</TableCell>
                                <TableCell>{resultado.phEst}</TableCell>
                                <TableCell>{resultado.fosforo}</TableCell>
                                <TableCell>{resultado.nTotal}</TableCell>
                                <TableCell>{resultado.ph.toFixed(1)}</TableCell>
                                <TableCell>
                                  <Badge className={getBadgeStyles(resultado.estado)}>{resultado.estado}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Evolución Histórica</CardTitle>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Tipo
                          </Button>
                          <Button variant="outline" size="sm">
                            Lote
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analisisSueloData.evolucionHistorica}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="año" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" domain={[0, 30]} />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="nitrogeno"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              name="Nitrógeno Crítico"
                              dot={{ fill: "#3b82f6", r: 4 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="optimo"
                              stroke="#10b981"
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              name="Óptimo Crítico PH (past)"
                              dot={{ fill: "#10b981", r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* OTROS TABS */}
        <TabsContent value="labores">
          <Card>
            <CardContent className="py-8">
              <p className="text-gray-500 text-center">Tab Labores</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cultivos">
          <Card>
            <CardContent className="py-8">
              <p className="text-gray-500 text-center">Tab Cultivos</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Crear Lote */}
      <Dialog open={loteDialogOpen} onOpenChange={setLoteDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateLote}>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Lote</DialogTitle>
              <DialogDescription>Área calculada: {hectareasTemporal.toFixed(2)} ha</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre del Lote *</Label>
                <Input
                  placeholder="Ej: Lote Norte"
                  value={loteForm.nombre}
                  onChange={(e) => setLoteForm({ ...loteForm, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hectáreas *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={loteForm.hectareas}
                    onChange={(e) => setLoteForm({ ...loteForm, hectareas: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cultivo Actual</Label>
                  <Input
                    placeholder="Ej: Soja"
                    value={loteForm.cultivo}
                    onChange={(e) => setLoteForm({ ...loteForm, cultivo: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLoteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Crear Lote
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}