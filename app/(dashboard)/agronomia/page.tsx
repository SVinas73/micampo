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
    <div className="min-h-screen bg-gray-50 p-6 space-y-6 max-w-[1920px] mx-auto">
      {/* HEADER - Exacto al Figma */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Agronomía</h1>
          <p className="text-sm text-gray-600 mt-1">Campo Digital</p>
        </div>
        <div className="flex gap-3">
          {/* Botones para DETECCIÓN DE ENFERMEDADES */}
          {activeTab === "deteccion" && (
            <>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 shadow-sm">
                Cargar Imagen de Lote
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 shadow-sm">
                Reportar Plaga
              </Button>
            </>
          )}

          {/* Botones para PLANIFICADOR - Sub-tab PLANES */}
          {activeTab === "planificador" && activeSubTab === "planes" && (
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 shadow-sm">
              Nuevo Plan
            </Button>
          )}

          {/* Botones para PLANIFICADOR - Sub-tab ANÁLISIS */}
          {activeTab === "planificador" && activeSubTab === "analisis" && (
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 shadow-sm">
              Nuevo Análisis
            </Button>
          )}

          {/* Botones para CULTIVOS */}
          {activeTab === "cultivos" && (
            <>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 shadow-sm">
                Nueva Siembra
              </Button>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 shadow-sm">
                Nueva Cosecha
              </Button>
            </>
          )}
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
                    <div className={`text-xl font-bold ${mockDataDeteccion.metricas.alertasActivas > 0 ? "text-red-600" : "text-gray-900"}`}>
                      {mockDataDeteccion.metricas.alertasActivas}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">críticas</p>
                  </CardContent>
                </Card>

                {/* Card 2: Confianza IA - Con borde verde y sparkle */}
                
                <Card className="relative bg-gradient-to-r from-yellow-400 via-green-400 to-green-500 p-[2px] rounded-lg hover:shadow-md transition-shadow">
                  <div className="bg-white rounded-lg h-full flex flex-col">
                    <Sparkles className="h-4 w-4 text-yellow-500 absolute top-6 right-3" />
                    <CardHeader className="pb-8.5">
                      <CardTitle className="text-sm font-medium text-gray-700 mt-6">
                        Confianza IA
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {mockDataDeteccion.metricas.confianzaIA}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">precisión</p>
                    </CardContent>
                  </div>
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
                  <Card className="shadow-lg relative bg-gradient-to-r from-yellow-400 via-green-400 to-green-500 p-[3px] rounded-lg max-w-full">
                    <div className="bg-white rounded-lg p-6">
                      <Sparkles className="h-5 w-5 text-yellow-600 absolute top-6 right-6 z-10" />
                      <CardHeader className="pb-3 pt-0">
                        <CardTitle className="text-lg font-normal text-gray-800">Alertas Activas</CardTitle>
                      </CardHeader>
                      <CardContent className="overflow-x-auto pb-3 pt-0">
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
                    </div>
                  </Card>
                </div>

                {/* Columna Derecha: Estrategia y Probabilidades */}
                <div className="space-y-3 flex flex-col h-full">
                  {/* Estrategia de Control Sugerida */}
                  <Card className="shadow-lg relative bg-gradient-to-r from-yellow-400 via-green-400 to-green-500 p-[3px] rounded-lg">
                    <div className="bg-white rounded-lg p-6">
                      <Sparkles className="h-4 w-4 text-yellow-500 absolute top-6 right-6 z-10" />
                      <CardHeader className="pb-3 pt-0">
                        <CardTitle className="text-base font-normal text-gray-800">
                          Estrategia de Control Sugerida
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-shrink-0">
                              <img 
                                src="/pote.jpg" 
                                alt="Fungicida"
                                className="h-24 w-24 object-contain"
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
                    </div>
                  </Card>

                  {/* Probabilidades */}
                  <Card className="shadow-lg relative bg-gradient-to-r from-yellow-400 via-green-400 to-green-500 p-[3px] rounded-lg flex-1">
                    <div className="bg-white rounded-lg p-6 h-full flex flex-col">
                      <Sparkles className="h-4 w-4 text-yellow-500 absolute top-6 right-6 z-10" />
                      <CardHeader className="pb-3 pt-0">
                        <CardTitle className="text-base font-normal text-gray-800">Probabilidades</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 overflow-y-auto max-h-full pt-0 flex-1">
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
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>
            {/* ============================================ */}
            {/* TAB: ANÁLISIS IA */}
            {/* ============================================ */}
            <TabsContent value="analisis" className="space-y-4">
              {/* Métricas Superiores - MISMO ESTILO QUE INFORMACIÓN */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Card 1: Alertas Activas */}
                <Card className="bg-white border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Alertas Activas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-xl font-bold ${mockDataDeteccion.metricas.alertasActivas > 0 ? "text-red-600" : "text-gray-900"}`}>
                      {mockDataDeteccion.metricas.alertasActivas}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">críticas</p>
                  </CardContent>
                </Card>

                {/* Card 2: Confianza IA - Con borde verde y sparkle */}
                <Card className="relative bg-gradient-to-r from-yellow-400 via-green-400 to-green-500 p-[2px] rounded-lg hover:shadow-md transition-shadow">
                  <div className="bg-white rounded-lg h-full flex flex-col">
                    <Sparkles className="h-4 w-4 text-yellow-500 absolute top-6 right-3" />
                    <CardHeader className="pb-8.5">
                      <CardTitle className="text-sm font-medium text-gray-700 mt-6">
                        Confianza IA
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {mockDataDeteccion.metricas.confianzaIA}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">precisión</p>
                    </CardContent>
                  </div>
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

              {/* Grid 2 columnas: Imagen + Resultados */}
              <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4 items-start">
                
                {/* ========== CARD IZQUIERDA: DETECCIÓN ========== */}
                <Card className="shadow-lg relative bg-gradient-to-r from-yellow-400 via-green-400 to-green-500 p-[3px] rounded-lg">
                  <div className="bg-white rounded-lg h-full">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between px-4 pt-4">
                      <CardTitle className="text-lg font-normal text-gray-800">Detección</CardTitle>
                      <Button 
                        size="sm" 
                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-4 mr-2"
                        onClick={() => document.getElementById('file-upload-ia')?.click()}
                      >
                        Cargar Imagen
                      </Button>
                      <input
                        id="file-upload-ia"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log('Imagen cargada:', file.name);
                          }
                        }}
                      />
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3 px-4 pb-3">
                      {/* Imagen de detección CON ÍCONO DE CÁMARA - SIN EMOJI NI CUADRADOS */}
                      <div 
                        className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden group cursor-pointer"
                        onClick={() => document.getElementById('file-upload-ia')?.click()}
                      >
                        {/* Overlay con ícono de cámara */}
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                          <div className="opacity-30 group-hover:opacity-60 transition-opacity">
                            <Camera className="h-16 w-16 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Botones de acciones */}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          Cajas
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          Mapa Calor
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          Alto Contraste
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>

                {/* ========== CARD DERECHA: RESULTADOS + RECOMENDACIÓN ========== */}
                <div className="space-y-4 flex flex-col">
                  
                  {/* CARD: Resultados del Análisis - MÁS GRANDE HACIA ABAJO */}
                  <Card className="shadow-lg relative bg-gradient-to-r from-yellow-400 via-green-400 to-green-500 p-[3px] rounded-lg" style={{ flex: '5' }}>
                    <div className="bg-white rounded-lg p-6 h-full">
                      <Sparkles className="h-5 w-5 text-yellow-500 absolute top-6 right-6 z-10" />
                      <CardHeader className="pb-4 pt-0">
                        <CardTitle className="text-lg font-normal text-gray-800">Resultados del Análisis:</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {/* Grid 2 columnas: Círculo + Detalles CON LÍNEA DIVISORIA */}
                        <div className="grid grid-cols-[260px_1px_1fr] gap-6 items-center">
                          
                          {/* Círculo de confianza - MÁS GRANDE */}
                          <div className="flex flex-col items-center justify-center">
                            <div className="relative w-[240px] h-[240px]">
                              {/* Círculo SVG */}
                              <svg className="w-full h-full transform -rotate-90">
                                <circle
                                  cx="120"
                                  cy="120"
                                  r="95"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="16"
                                />
                                <circle
                                  cx="120"
                                  cy="120"
                                  r="95"
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="16"
                                  strokeDasharray={`${(96 / 100) * 597} 597`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-6xl font-bold text-gray-900">96%</p>
                                <p className="text-base text-gray-600 mt-2">Confianza Global</p>
                              </div>
                            </div>
                          </div>

                          {/* LÍNEA DIVISORIA VERTICAL */}
                          <div className="h-full w-px bg-gray-300"></div>

                          {/* Detalles del análisis - CORRIDO A LA DERECHA */}
                          <div className="flex flex-col justify-center space-y-3 pl-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2">Roya Común (Puccinia sorghi)</h3>
                              <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-xs font-bold px-2 py-1 flex items-center gap-1 w-fit">
                                <span className="inline-block w-2 h-2 rounded-full bg-orange-500"></span>
                                Severidad Media
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="inline-block w-2 h-2 bg-orange-500"></span>
                                <span className="text-sm text-gray-700">Lesión A (Foco Principal) - 98%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="inline-block w-2 h-2 bg-orange-500"></span>
                                <span className="text-sm text-gray-700">Lesión B (Esporulación) - 92%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="inline-block w-2 h-2 bg-orange-500"></span>
                                <span className="text-sm text-gray-700">Lesión C (Inicial) - 85%</span>
                              </div>
                            </div>

                            <Button variant="link" className="text-gray-500 text-sm p-0 h-auto font-normal justify-start">
                              Ver 5 detecciones más...
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>

                  {/* CARD: Recomendación - MÁS PEQUEÑA */}
                  <Card className="shadow-lg relative bg-gradient-to-r from-yellow-400 via-green-400 to-green-500 p-[3px] rounded-lg" style={{ flex: '6' }}>
                    <div className="bg-white rounded-lg px-6 pt-3 pb-2 h-full">
                      <Sparkles className="h-5 w-5 text-yellow-500 absolute top-4 right-6 z-10" />
                      <CardHeader className="pb-0 pt-0 px-0">
                        <CardTitle className="text-lg font-normal text-gray-800">Recomendación</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-0 px-0">
                        {/* Estrategia de control */}
                        <div className="bg-white border border-gray-200 rounded-lg p-2 mb-2">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-shrink-0">
                              <img 
                                src="/pote.jpg" 
                                alt="Fungicida"
                                className="h-20 w-20 object-contain"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-700 mb-2">Estrategia de Control Sugerida</p>
                              <h4 className="font-bold text-sm text-gray-900 mb-1">
                                Fungicida (Triazol + Estrob.)
                              </h4>
                              <p className="text-xs text-gray-600">Tratamiento Prioritario para Roya</p>
                            </div>
                          </div>

                          {/* Grid 3 columnas: Info */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                              <div className="bg-white p-2 rounded border border-gray-200 flex flex-col items-center gap-1">
                                <Droplets className="h-4 w-4 text-blue-500" />
                                <p className="text-sm font-bold text-gray-900">400 cc/Ha</p>
                              </div>
                              <p className="text-[10px] text-gray-600 mt-1">Dosis</p>
                            </div>
                            
                            <div className="text-center">
                              <div className="bg-white p-2 rounded border border-gray-200 flex flex-col items-center gap-1">
                                <CloudSun className="h-4 w-4 text-orange-500" />
                                <p className="text-sm font-bold text-gray-900">Próx. 4hs</p>
                              </div>
                              <p className="text-[10px] text-gray-600 mt-1">Ventana Óptima</p>
                            </div>
                            
                            <div className="text-center">
                              <div className="bg-white p-2 rounded border border-gray-200 flex flex-col items-center gap-1">
                                <Banknote className="h-4 w-4 text-green-600" />
                                <p className="text-sm font-bold text-gray-900">$28/Ha</p>
                              </div>
                              <p className="text-[10px] text-gray-600 mt-1">Costo Estimado</p>
                            </div>
                          </div>
                        </div>

                        {/* Análisis IA */}
                        <div className="bg-gray-100 p-2 rounded border border-gray-300">
                          <p className="text-xs text-gray-700 leading-relaxed">
                            <span className="font-bold">Análisis IA:</span> Efectiva contra la roya en etapas de campo. La combinación Triazol + Estrobilurina (Triaz + Estrob.) combina protección curativa, preventiva y antisporulante.
                          </p>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </div>
              </div>
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
        <TabsContent value="planificador" className="space-y-4 mt-6">
          {/* Métricas Superiores - MISMO ESTILO QUE DETECCIÓN */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Planes Generados */}
            <Card className="bg-white border hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Planes Generados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">3</div>
                <p className="text-xs text-gray-500 mt-1">activos</p>
              </CardContent>
            </Card>

            {/* Card 2: Planes Aprobados */}
            <Card className="bg-white border hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Planes Aprobados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">2</div>
                <p className="text-xs text-gray-500 mt-1">confirmados</p>
              </CardContent>
            </Card>

            {/* Card 3: Superficie Planificada */}
            <Card className="bg-white border hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Superficie Planificada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">850 Ha</div>
                <p className="text-xs text-gray-500 mt-1">total</p>
              </CardContent>
            </Card>

            {/* Card 4: Inversión Estimada */}
            <Card className="bg-white border hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Inversión Estimada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <p className="text-xs text-gray-500 mt-1">USD</p>
              </CardContent>
            </Card>

            {/* Card 5: Próxima Siembra */}
            <Card className="bg-white border hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Próxima Siembra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">3/12/25</div>
                <p className="text-xs text-gray-500 mt-1">fecha</p>
              </CardContent>
            </Card>
          </div>

          {/* SUB-TABS: MISMO ESTILO QUE DETECCIÓN */}
          <Tabs value={activeSubTab} onValueChange={handleSubTabChange} className="space-y-4">
            <TabsList>
              <TabsTrigger value="planes">
                <Calendar className="h-4 w-4 mr-2" />
                Planes de Siembra
              </TabsTrigger>
              <TabsTrigger value="analisis">
                <Activity className="h-4 w-4 mr-2" />
                Análisis de Suelo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="planes" className="space-y-6">
              {/* Card: Planes Activos - HORIZONTAL */}
              <Card className="shadow-lg relative bg-gradient-to-r from-yellow-400 via-green-400 to-green-500 p-[3px] rounded-lg">
                <div className="bg-white rounded-lg p-6">
                  <Sparkles className="h-5 w-5 text-yellow-500 absolute top-4 right-4 z-10" />
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-normal text-gray-800">Planes Activos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Grid HORIZONTAL de 3 columnas */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Plan 1: Maíz Tardío */}
                      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 space-y-3">
                        {/* Header: Título + Monto en la MISMA LÍNEA */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🌽</span>
                            <h3 className="font-bold text-sm text-gray-900">Maíz Tardío - Lotes Norte</h3>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-[10px] font-bold px-2 py-0.5">
                            💵$45,500 USD (Est.)
                          </Badge>
                        </div>

                        {/* Info del plan */}
                        <div className="space-y-1 text-[11px] text-gray-800">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-gray-600" />
                            <span className="font-semibold">Lotes: 4, 5, 6 (320 Has)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-gray-600" />
                            <span className="font-semibold">Fecha Meta: 20-25 Oct</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Sprout className="h-3 w-3 text-gray-600" />
                            <span className="font-semibold">Insumo: Híbrido DK-7210</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Activity className="h-3 w-3 text-gray-600" />
                            <span className="font-semibold">Densidad: 70k pl/Ha</span>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center mb-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                            <span className="text-[9px] font-semibold text-gray-800">Borrador</span>
                          </div>
                          <div className="flex-1 h-0.5 bg-yellow-500 mx-1" />
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center mb-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                            <span className="text-[9px] font-semibold text-gray-800">Insumos</span>
                          </div>
                          <div className="flex-1 h-0.5 bg-gray-300 mx-1" />
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center mb-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                            <span className="text-[9px] font-semibold text-gray-800">Asignación</span>
                          </div>
                          <div className="flex-1 h-0.5 bg-gray-300 mx-1" />
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center mb-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                            <span className="text-[9px] font-semibold text-gray-800">Listo</span>
                          </div>
                        </div>

                        {/* Botones */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" className="h-8 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 px-2">
                            Generar Orden de Trabajo
                          </Button>
                        </div>
                      </div>

                      {/* Plan 2: Soja Primera */}
                      <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🌱</span>
                            <h3 className="font-bold text-sm text-gray-900">Soja Primera - Lotes Sur</h3>
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px] font-bold px-2 py-0.5">
                            💵$62,000 USD (Est.)
                          </Badge>
                        </div>

                        <div className="space-y-1 text-[11px] text-gray-800">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-gray-600" />
                            <span className="font-semibold">Lotes: 8, 12, 15 (450 Has)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-gray-600" />
                            <span className="font-semibold">Fecha Meta: 05-10 Nov</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Sprout className="h-3 w-3 text-gray-600" />
                            <span className="font-semibold">Insumo: Semilla S7 5x1</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Activity className="h-3 w-3 text-gray-600" />
                            <span className="font-semibold">Densidad: 280k pl/Ha</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center mb-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                            <span className="text-[9px] font-semibold text-gray-800">Borrador</span>
                          </div>
                          <div className="flex-1 h-0.5 bg-green-500 mx-1" />
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center mb-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                            <span className="text-[9px] font-semibold text-gray-800">Insumos</span>
                          </div>
                          <div className="flex-1 h-0.5 bg-green-500 mx-1" />
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center mb-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                            <span className="text-[9px] font-semibold text-gray-800">Asignación</span>
                          </div>
                          <div className="flex-1 h-0.5 bg-gray-300 mx-1" />
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center mb-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                            <span className="text-[9px] font-semibold text-gray-800">Listo</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" className="h-8 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 px-2">
                            Generar Orden de Trabajo
                          </Button>
                        </div>
                      </div>

                      {/* Plan 3: Girasol */}
                      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🌻</span>
                            <h3 className="font-bold text-sm text-gray-900">Girasol - Lotes Oeste</h3>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-[10px] font-bold px-2 py-0.5">
                            💵$55,000 USD (Est.)
                          </Badge>
                        </div>

                        <div className="space-y-1 text-[11px] text-gray-800">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-gray-600" />
                            <span className="font-semibold">Lotes: 1, 3, 7 (280 Has)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-gray-600" />
                            <span className="font-semibold">Fecha Meta: 15-20 Nov</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Sprout className="h-3 w-3 text-gray-600" />
                            <span className="font-semibold">Insumo: Semilla P245</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Activity className="h-3 w-3 text-gray-600" />
                            <span className="font-semibold">Densidad: 60k pl/Ha</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center mb-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                            <span className="text-[9px] font-semibold text-gray-800">Borrador</span>
                          </div>
                          <div className="flex-1 h-0.5 bg-gray-300 mx-1" />
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center mb-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                            <span className="text-[9px] font-semibold text-gray-800">Insumos</span>
                          </div>
                          <div className="flex-1 h-0.5 bg-gray-300 mx-1" />
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center mb-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                            <span className="text-[9px] font-semibold text-gray-800">Asignación</span>
                          </div>
                          <div className="flex-1 h-0.5 bg-gray-300 mx-1" />
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center mb-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                            <span className="text-[9px] font-semibold text-gray-800">Listo</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" className="h-8 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 px-2">
                            Generar Orden de Trabajo
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>

              {/* Card: Planes Recomendados por IA */}
              <Card className="shadow-lg relative bg-gradient-to-r from-yellow-400 via-green-400 to-green-500 p-[3px] rounded-lg">
                <div className="bg-white rounded-lg p-6">
                  <Sparkles className="h-5 w-5 text-yellow-500 absolute top-4 right-4 z-10" />
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-normal text-gray-800">Planes Recomendados por IA</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  {/* ========== SUGERENCIA 1 ========== */}
                  <div className="bg-white border-2 border-purple-200 rounded-lg p-3 space-y-3">
                    {/* Fila superior: Sparkles + Título + Badge */}
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                      <h4 className="font-bold text-s text-gray-900 flex-1 leading-tight">
                        Sugerencia: Rotación a Maíz Tardío
                      </h4>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px] font-bold px-1.5 py-0.5 whitespace-nowrap">
                        Confianza IA: 92% (Alta)
                      </Badge>
                    </div>

                    {/* LÍNEA DIVISORIA HORIZONTAL (entre título y contenido) */}
                    <div className="border-t border-gray-300"></div>

                    {/* Grid 2 columnas */}
                    <div className="grid grid-cols-2 gap-2 text-[12px] relative">
                      {/* LÍNEA DIVISORIA VERTICAL (entre columnas) */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 -translate-x-1/2"></div>

                      {/* Columna Izquierda */}
                      <div className="space-y-2 pr-2">
                        <div>
                          <p className="font-bold text-gray-900 mb-0.5">📍 Lotes Afectados:</p>
                          <p className="text-gray-700 leading-tight">Lotes 3, 7 | Superficie: 45.3 ha</p>
                        </div>
                        
                        <div>
                          <p className="font-bold text-gray-900 mb-0.5">💰 Proyección Económica:</p>
                          <div className="space-y-0.5 text-gray-700">
                            <div className="flex items-start gap-0.5">
                              <span className="text-green-600">✓</span>
                              <span>+$8K estimado</span>
                            </div>
                            <div className="flex items-start gap-0.5">
                              <span className="text-green-600">✓</span>
                              <span>Riesgo mercado considerado</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Columna Derecha */}
                      <div className="space-y-2 pl-2">
                        <div>
                          <p className="font-bold text-gray-900 mb-0.5">🧠 El Razonamiento:</p>
                          <div className="space-y-0.5 text-gray-700">
                            <div className="flex items-start gap-0.5">
                              <span className="text-yellow-600">⚠</span>
                              <span>Detectado: Compactación severa</span>
                            </div>
                            <div className="flex items-start gap-0.5">
                              <span className="text-green-600">✓</span>
                              <span>Beneficio: Mejora estructura suelo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] text-red-600 hover:bg-red-50 font-semibold">
                        ✕ Descartar
                      </Button>
                      <Button size="sm" className="flex-1 h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 font-semibold">
                        ✓ Convertir en Plan
                      </Button>
                    </div>
                  </div>

                  {/* ========== SUGERENCIA 2 ========== */}
                  <div className="bg-white border-2 border-purple-200 rounded-lg p-3 space-y-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                      <h4 className="font-bold text-s text-gray-900 flex-1 leading-tight">
                        Sugerencia: Cultivo de Cobertura
                      </h4>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px] font-bold px-1.5 py-0.5 whitespace-nowrap">
                        Confianza IA: 87% (Alta)
                      </Badge>
                    </div>

                    <div className="border-t border-gray-300"></div>

                    <div className="grid grid-cols-2 gap-2 text-[12px] relative">
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 -translate-x-1/2"></div>

                      <div className="space-y-2 pr-2">
                        <div>
                          <p className="font-bold text-gray-900 mb-0.5">📍 Lotes Afectados:</p>
                          <p className="text-gray-700 leading-tight">Lotes 2, 8 (Previo Soja 2da)</p>
                        </div>
                        
                        <div>
                          <p className="font-bold text-gray-900 mb-0.5">💰 Proyección Económica:</p>
                          <div className="space-y-0.5 text-gray-700">
                            <div className="flex items-start gap-0.5">
                              <span className="text-green-600">✓</span>
                              <span>Ahorro: $30/Ha herbicidas</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pl-2">
                        <div>
                          <p className="font-bold text-gray-900 mb-0.5">🧠 El Razonamiento:</p>
                          <div className="space-y-0.5 text-gray-700">
                            <div className="flex items-start gap-0.5">
                              <span className="text-yellow-600">⚠</span>
                              <span>Detectado: Riesgo erosión</span>
                            </div>
                            <div className="flex items-start gap-0.5">
                              <span className="text-green-600">✓</span>
                              <span>Beneficio: Protección suelo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] text-red-600 hover:bg-red-50 font-semibold">
                        ✕ Descartar
                      </Button>
                      <Button size="sm" className="flex-1 h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 font-semibold">
                        ✓ Convertir en Plan
                      </Button>
                    </div>
                  </div>

                  {/* ========== SUGERENCIA 3 ========== */}
                  <div className="bg-white border-2 border-purple-200 rounded-lg p-3 space-y-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                      <h4 className="font-bold text-s text-gray-900 flex-1 leading-tight">
                        Sugerencia: Nitrógeno Variable
                      </h4>
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-[10px] font-bold px-1.5 py-0.5 whitespace-nowrap">
                        Confianza IA: 65% (Media)
                      </Badge>
                    </div>

                    <div className="border-t border-gray-300"></div>

                    <div className="grid grid-cols-2 gap-2 text-[12px] relative">
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 -translate-x-1/2"></div>

                      <div className="space-y-2 pr-2">
                        <div>
                          <p className="font-bold text-gray-900 mb-0.5">📍 Lotes Afectados:</p>
                          <p className="text-gray-700 leading-tight">Lotes 2, 5, 9 | 85 ha</p>
                        </div>
                        
                        <div>
                          <p className="font-bold text-gray-900 mb-0.5">💰 Proyección Económica:</p>
                          <div className="space-y-0.5 text-gray-700">
                            <div className="flex items-start gap-0.5">
                              <span className="text-green-600">✓</span>
                              <span>+5% rinde estimado</span>
                            </div>
                            <div className="flex items-start gap-0.5">
                              <span className="text-red-600">✗</span>
                              <span>Inversión VRT: $150/ha</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="font-bold text-gray-900 mb-0.5">🌱 Impacto Ambiental:</p>
                          <div className="space-y-0.5 text-gray-700">
                            <div className="flex items-start gap-0.5">
                              <span className="text-green-600">✓</span>
                              <span>Reduce sobre-aplicación</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pl-2">
                        <div>
                          <p className="font-bold text-gray-900 mb-0.5">🧠 El Razonamiento:</p>
                          <div className="space-y-0.5 text-gray-700">
                            <div className="flex items-start gap-0.5">
                              <span className="text-yellow-600">⚠</span>
                              <span>Detectado: Variabilidad N en suelo</span>
                            </div>
                            <div className="flex items-start gap-0.5">
                              <span className="text-green-600">✓</span>
                              <span>Beneficio: Eficiencia insumos</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] text-red-600 hover:bg-red-50 font-semibold">
                        ✕ Descartar
                      </Button>
                      <Button size="sm" className="flex-1 h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 font-semibold">
                        ✓ Convertir en Plan
                      </Button>
                    </div>
                  </div>

                </CardContent>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="analisis" className="space-y-6">
              {/* ==================== CARD GRANDE: ANÁLISIS DEL SUELO ==================== */}
              <Card className="shadow-lg relative bg-gradient-to-r from-yellow-400 via-green-400 to-green-500 p-[3px] rounded-lg">
                <div className="bg-white rounded-lg p-6">
                  <Sparkles className="h-5 w-5 text-yellow-500 absolute top-6 right-6 z-10" />
                  <CardHeader className="pb-4 pt-0">
                    <CardTitle className="text-lg font-normal text-gray-800">Análisis del Suelo</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 overflow-x-auto">
                    {/* Grid 2x2 para mostrar 4 lotes */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-[1200px]">
                      {/* LOTE 1: Lote 4 - El Bajo */}
                      <div className="bg-white rounded-lg p-3 shadow-[0_2px_0_0_rgba(0,0,0,0.1)]">
                        {/* Encabezados */}
                        <div className="grid grid-cols-[100px_1px_140px_1px_100px_1px_130px] gap-3 items-center mb-2 pb-2 bg-gray-50 -mx-3 -mt-3 px-3 pt-3 rounded-t-lg shadow-[0_2px_0_0_rgba(0,0,0,0.1)]">
                          <p className="text-[10px] font-bold text-gray-800">Identity</p>
                          <div></div>
                          <p className="text-[10px] font-bold text-gray-800">Macro Nutrients</p>
                          <div></div>
                          <p className="text-[10px] font-bold text-gray-800">Soil Health</p>
                          <div></div>
                          <p className="text-[10px] font-bold text-gray-800">Actions</p>
                        </div>

                        {/* Contenido */}
                        <div className="grid grid-cols-[100px_1px_140px_1px_100px_1px_80px] gap-3 items-start">
                          {/* Identity */}
                          <div className="flex items-start gap-1">
                            <span className="text-xl">🌽</span>
                            <div>
                              <p className="font-bold text-xs text-gray-900 leading-tight">Lote 4 - El Bajo</p>
                              <p className="text-[9px] text-gray-600">Maíz Tardío • Hace 2 sem</p>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-full w-px bg-gray-300"></div>

                          {/* Macro Nutrients */}
                          <div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium text-gray-700 w-2">N</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" style={{ width: "60%" }}></div>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-800 w-8 text-right">60%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium text-gray-700 w-2">P</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 rounded-full" style={{ width: "20%" }}></div>
                                </div>
                                <span className="text-[10px] font-semibold text-red-600 w-8 text-right flex items-center justify-end gap-0.5">
                                  20%
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium text-gray-700 w-2">K</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-full" style={{ width: "90%" }}></div>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-800 w-8 text-right">90%</span>
                              </div>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-full w-px bg-gray-300"></div>

                          {/* Soil Health */}
                          <div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-700">pH</span>
                                <Badge className="bg-green-100 text-green-700 border-green-300 text-[9px] font-bold px-1.5 py-0">
                                  6.2 🟢
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-700">MO</span>
                                <span className="text-[10px] font-semibold text-gray-900">2.8% 🍂</span>
                              </div>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-full w-px bg-gray-300"></div>

                          {/* Actions */}
                          <div>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0 bg-transparent">
                                <Map className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0 bg-transparent">
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button size="sm" className="h-6 text-[9px] bg-emerald-600 hover:bg-emerald-700 px-3 w-[100px]">
                                <Edit className="h-2.5 w-2.5 mr-0.5" />
                                Receta
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* LOTE 2: Lote 12 - Norte */}
                      <div className="bg-white rounded-lg p-3 shadow-[0_2px_0_0_rgba(0,0,0,0.1)]">
                        {/* Encabezados */}
                        <div className="grid grid-cols-[100px_1px_140px_1px_100px_1px_130px] gap-3 items-center mb-2 pb-2 bg-gray-50 -mx-3 -mt-3 px-3 pt-3 rounded-t-lg shadow-[0_2px_0_0_rgba(0,0,0,0.1)]">
                          <p className="text-[10px] font-bold text-gray-800">Identity</p>
                          <div></div>
                          <p className="text-[10px] font-bold text-gray-800">Macro Nutrients</p>
                          <div></div>
                          <p className="text-[10px] font-bold text-gray-800">Soil Health</p>
                          <div></div>
                          <p className="text-[10px] font-bold text-gray-800">Actions</p>
                        </div>

                        {/* Contenido */}
                        <div className="grid grid-cols-[100px_1px_140px_1px_100px_1px_80px] gap-3 items-start">
                          {/* Identity */}
                          <div className="flex items-start gap-1">
                            <span className="text-xl">🌾</span>
                            <div>
                              <p className="font-bold text-xs text-gray-900 leading-tight">Lote 12 - Norte</p>
                              <p className="text-[9px] text-gray-600">Trigo • Hace 3 días</p>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-full w-px bg-gray-300"></div>

                          {/* Macro Nutrients */}
                          <div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium text-gray-700 w-2">N</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-full" style={{ width: "95%" }}></div>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-800 w-8 text-right">95%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium text-gray-700 w-2">P</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" style={{ width: "15%" }}></div>
                                </div>
                                <span className="text-[10px] font-semibold text-yellow-700 w-8 text-right flex items-center justify-end gap-0.5">
                                  15%
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium text-gray-700 w-2">K</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" style={{ width: "60%" }}></div>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-800 w-8 text-right">60%</span>
                              </div>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-full w-px bg-gray-300"></div>

                          {/* Soil Health */}
                          <div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-700">pH</span>
                                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-[9px] font-bold px-1.5 py-0">
                                  5.2 🟡
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-700">MO</span>
                                <span className="text-[10px] font-semibold text-gray-900">1.9% 🍂</span>
                              </div>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-full w-px bg-gray-300"></div>

                          {/* Actions */}
                          <div>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0 bg-transparent">
                                <Map className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0 bg-transparent">
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button size="sm" className="h-6 text-[9px] bg-emerald-600 hover:bg-emerald-700 px-3 w-[100px]">
                                <Edit className="h-2.5 w-2.5 mr-0.5" />
                                Receta
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* LOTE 3: Lote 7 - La Loma */}
                      <div className="bg-white rounded-lg p-3 shadow-[0_2px_0_0_rgba(0,0,0,0.1)]">
                        {/* Encabezados */}
                        <div className="grid grid-cols-[100px_1px_140px_1px_100px_1px_130px] gap-3 items-center mb-2 pb-2 bg-gray-50 -mx-3 -mt-3 px-3 pt-3 rounded-t-lg shadow-[0_2px_0_0_rgba(0,0,0,0.1)]">
                          <p className="text-[10px] font-bold text-gray-800">Identity</p>
                          <div></div>
                          <p className="text-[10px] font-bold text-gray-800">Macro Nutrients</p>
                          <div></div>
                          <p className="text-[10px] font-bold text-gray-800">Soil Health</p>
                          <div></div>
                          <p className="text-[10px] font-bold text-gray-800">Actions</p>
                        </div>

                        {/* Contenido */}
                        <div className="grid grid-cols-[100px_1px_140px_1px_100px_1px_80px] gap-3 items-start">
                          {/* Identity */}
                          <div className="flex items-start gap-1">
                            <span className="text-xl">🌿</span>
                            <div>
                              <p className="font-bold text-xs text-gray-900 leading-tight">Lote 7 - La Loma</p>
                              <p className="text-[9px] text-gray-600">Soja • Hace 1 mes</p>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-full w-px bg-gray-300"></div>

                          {/* Macro Nutrients */}
                          <div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium text-gray-700 w-2">N</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 rounded-full" style={{ width: "30%" }}></div>
                                </div>
                                <span className="text-[10px] font-semibold text-red-600 w-8 text-right flex items-center justify-end gap-0.5">
                                  30%
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium text-gray-700 w-2">P</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-full" style={{ width: "85%" }}></div>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-800 w-8 text-right">85%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium text-gray-700 w-2">K</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" style={{ width: "55%" }}></div>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-800 w-8 text-right">55%</span>
                              </div>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-full w-px bg-gray-300"></div>

                          {/* Soil Health */}
                          <div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-700">pH</span>
                                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-[9px] font-bold px-1.5 py-0">
                                  5.8 🟡
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-700">MO</span>
                                <span className="text-[10px] font-semibold text-gray-900">3.2% 🍂</span>
                              </div>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-full w-px bg-gray-300"></div>

                          {/* Actions */}
                          <div>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0 bg-transparent">
                                <Map className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0 bg-transparent">
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button size="sm" className="h-6 text-[9px] bg-emerald-600 hover:bg-emerald-700 px-3 w-[100px]">
                                <Edit className="h-2.5 w-2.5 mr-0.5" />
                                Receta
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* LOTE 4: Lote 4 - El Bajo (v2) */}
                      <div className="bg-white rounded-lg p-3 shadow-[0_2px_0_0_rgba(0,0,0,0.1)]">
                        {/* Encabezados */}
                        <div className="grid grid-cols-[100px_1px_140px_1px_100px_1px_130px] gap-3 items-center mb-2 pb-2 bg-gray-50 -mx-3 -mt-3 px-3 pt-3 rounded-t-lg shadow-[0_2px_0_0_rgba(0,0,0,0.1)]">
                          <p className="text-[10px] font-bold text-gray-800">Identity</p>
                          <div></div>
                          <p className="text-[10px] font-bold text-gray-800">Macro Nutrients</p>
                          <div></div>
                          <p className="text-[10px] font-bold text-gray-800">Soil Health</p>
                          <div></div>
                          <p className="text-[10px] font-bold text-gray-800">Actions</p>
                        </div>

                        {/* Contenido */}
                        <div className="grid grid-cols-[100px_1px_140px_1px_100px_1px_80px] gap-3 items-start">
                          {/* Identity */}
                          <div className="flex items-start gap-1">
                            <span className="text-xl">🌽</span>
                            <div>
                              <p className="font-bold text-xs text-gray-900 leading-tight">Lote 4 - El Bajo</p>
                              <p className="text-[9px] text-gray-600">Maíz • Hace 3 sem</p>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-full w-px bg-gray-300"></div>

                          {/* Macro Nutrients */}
                          <div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium text-gray-700 w-2">N</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" style={{ width: "60%" }}></div>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-800 w-8 text-right">60%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium text-gray-700 w-2">P</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" style={{ width: "20%" }}></div>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-800 w-8 text-right">20%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium text-gray-700 w-2">K</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" style={{ width: "60%" }}></div>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-800 w-8 text-right">60%</span>
                              </div>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-full w-px bg-gray-300"></div>

                          {/* Soil Health */}
                          <div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-700">pH</span>
                                <Badge className="bg-green-100 text-green-700 border-green-300 text-[9px] font-bold px-1.5 py-0">
                                  6.2 🟢
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-700">MO</span>
                                <span className="text-[10px] font-semibold text-gray-900">1.6% 🍂</span>
                              </div>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-full w-px bg-gray-300"></div>

                          {/* Actions */}
                          <div>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0 bg-transparent">
                                <Map className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0 bg-transparent">
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button size="sm" className="h-6 text-[9px] bg-emerald-600 hover:bg-emerald-700 px-3 w-[100px]">
                                <Edit className="h-2.5 w-2.5 mr-0.5" />
                                Receta
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>

              {/* Grid 2 columnas: Laboratorio (2/3) + Evolución (1/3) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* ==================== CARD: ÚLTIMOS RESULTADOS DE LABORATORIO ==================== */}
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-800">
                    Últimos Resultados de Laboratorio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead>Prof. (cm)</TableHead>
                          <TableHead>P (ppm)</TableHead>
                          <TableHead>N (kg/ha)</TableHead>
                          <TableHead>pH</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">PDF</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">15/10/2024</TableCell>
                          <TableCell>Lote Norte</TableCell>
                          <TableCell>0-20</TableCell>
                          <TableCell className="text-red-600 font-semibold">
                            <div className="flex items-center gap-1">
                              8 ppm
                              <AlertTriangle className="h-3 w-3" />
                            </div>
                          </TableCell>
                          <TableCell>47</TableCell>
                          <TableCell className="text-red-600 font-semibold">
                            <div className="flex items-center gap-1">
                              5.5
                              <AlertTriangle className="h-3 w-3" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px] font-bold">
                              Crítico
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell className="font-medium">14/10/2024</TableCell>
                          <TableCell>Lote Sur</TableCell>
                          <TableCell>0-20</TableCell>
                          <TableCell>18 ppm</TableCell>
                          <TableCell>60</TableCell>
                          <TableCell>6.2</TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-[10px] font-bold">
                              Alerta
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell className="font-medium">12/10/2024</TableCell>
                          <TableCell>Lote Este</TableCell>
                          <TableCell>0-20</TableCell>
                          <TableCell>25 ppm</TableCell>
                          <TableCell>75</TableCell>
                          <TableCell>6.8</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px] font-bold">
                              Óptimo
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell className="font-medium">10/10/2024</TableCell>
                          <TableCell>Lote Oeste</TableCell>
                          <TableCell>20-40</TableCell>
                          <TableCell className="text-red-600 font-semibold">
                            <div className="flex items-center gap-1">
                              12 ppm
                              <AlertTriangle className="h-3 w-3" />
                            </div>
                          </TableCell>
                          <TableCell>50</TableCell>
                          <TableCell>6.0</TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-[10px] font-bold">
                              Alerta
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* ==================== CARD: EVOLUCIÓN HISTÓRICA ==================== */}
              <Card className="border shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-800">Evolución Histórica:</CardTitle>
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
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { año: "2020", nitrogeno: 24, optimo: 18 },
                          { año: "2021", nitrogeno: 22, optimo: 18 },
                          { año: "2022", nitrogeno: 20, optimo: 18 },
                          { año: "2023", nitrogeno: 19, optimo: 18 },
                          { año: "2024", nitrogeno: 17, optimo: 18 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="año" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" domain={[0, 40]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="nitrogeno"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          name="Nitrógeno"
                          dot={{ fill: "#3b82f6", r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="optimo"
                          stroke="#10b981"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Umbral Crítico (15 ppm)"
                          dot={{ fill: "#10b981", r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              </div>
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

        {/* TAB: CULTIVOS */}
        {/* TAB: CULTIVOS */}
        <TabsContent value="cultivos" className="space-y-4 mt-6">
          {/* Métricas Superiores - MISMO ESTILO QUE DETECCIÓN/PLANIFICADOR */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Superficie Sembrada */}
            <Card className="bg-white border hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Superficie Sembrada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">235 Ha</div>
                <p className="text-xs text-gray-500 mt-1">total</p>
              </CardContent>
            </Card>

            {/* Card 2: Cosecha Total */}
            <Card className="bg-white border hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Cosecha Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">2.300 Tn</div>
                <p className="text-xs text-gray-500 mt-1">estimado</p>
              </CardContent>
            </Card>

            {/* Card 3: Próxima Cosecha */}
            <Card className="bg-white border hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Próxima Cosecha
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">Lote 5</div>
                <p className="text-xs text-gray-500 mt-1">fecha estimada</p>
              </CardContent>
            </Card>

            {/* Card 4: Lotes Listos */}
            <Card className="bg-white border hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Lotes Listos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">3</div>
                <p className="text-xs text-gray-500 mt-1">para cosechar</p>
              </CardContent>
            </Card>

            {/* Card 5: Lotes Vacíos */}
            <Card className="bg-white border hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Lotes Vacíos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">5</div>
                <p className="text-xs text-gray-500 mt-1">sin cultivo</p>
              </CardContent>
            </Card>
          </div>

          {/* Grid 2 columnas: Estados de Cultivos + Resumen */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_380px] gap-4">
            
            
            {/* CARD IZQUIERDA: Estados de los Cultivos - MÁS ANCHO */}
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg font-normal text-gray-800">Estados de los Cultivos</CardTitle>
                <Button variant="outline" size="sm" className="h-8">
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtrar
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                
                {/* LOTE 4 - Maíz - MÁS ANGOSTO Y MÁS LARGO */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]">
                  {/* Encabezado con fondo verde oscuro */}
                  <div className="bg-blue-700 text-white px-6 py-1 flex items-center justify-between">

                    <div className="flex items-center gap-2">
                      <span className="text-xl">🌽</span>
                      <h3 className="font-medium text-sm">LOTE 4 (Maíz)</h3>
                      
                    </div>
                    <p className="text-xs font-normal">120 Has | Activo</p>
                  </div>

                  {/* Contenido blanco - PADDING REDUCIDO */}
                  <div className="px-6 py-1.5">
                    {/* Grid 3 columnas CON LÍNEAS DIVISORIAS */}
                    <div className="grid grid-cols-[1fr_1px_1fr_1px_1fr] gap-4 text-xs items-start">
                      {/* Siembra */}
                      <div>
                        <p className="font-semibold text-gray-800 mb-1.5 flex items-center gap-1">
                          <span className="text-base">🌱</span>
                          SIEMBRA (15/Oct)
                        </p>
                        <div className="space-y-0.5 text-gray-800">
                          <p>Fecha: 15/Oct/2024</p>
                          <p>Semilla: Maíz AX-882</p>
                          <p>Densidad: 70k pl/ha (Largo 98%)</p>
                          <p>Inversión: $14.4k</p>
                        </div>
                      </div>

                      {/* Divisor */}
                      <div className="h-full w-px bg-gray-300"></div>

                      {/* Proceso */}
                      <div>
                        <p className="font-semibold text-gray-800 mb-1.5 flex items-center gap-1">
                          <span className="text-base">🚜</span>
                          PROCESO (V6)
                        </p>
                        <div className="space-y-1 text-gray-800">
                          {/* Progress bar con indicador */}
                          <div className="relative mb-1.5">
                            <Progress value={75} className="h-2 [&>div]:bg-green-500" />
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-green-700 rounded-full border-2 border-white" 
                              style={{ left: '75%', marginLeft: '-4px' }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                            <p>V6 - Vegetativo</p>
                            <p className="flex items-center gap-1">
                              <span className="text-green-600">✓</span>
                              Ult: Fertilización (5d)
                            </p>
                            <p>140mm | 450 GDD</p>
                            <p className="flex items-center gap-1">
                              <span>🔔</span>
                              Prox: Monitoreo (Mañana)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Divisor */}
                      <div className="h-full w-px bg-gray-300"></div>

                      {/* Cosecha */}
                      <div>
                        <p className="font-semibold text-gray-800 mb-1.5 flex items-center gap-1">
                          <span className="text-base">🌾</span>
                          COSECHA (Est.)
                        </p>
                        <div className="space-y-0.5 text-gray-800">
                          <p className="flex items-center gap-1">
                            Estado: <span>⏳</span> Pendiente (90 días)
                          </p>
                          <p>Fecha Est.: 15/Mar</p>
                          <p>Rinde (IA): 8.5 Tn/ha +</p>
                          <p>Destino: Silo Bolsa #4</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LOTE 5 - Soja - MÁS ANGOSTO Y MÁS LARGO */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]">
                  {/* Encabezado con fondo azul */}
                  <div className="bg-green-700 text-white px-6 py-1 flex items-center justify-between">

                    <div className="flex items-center gap-2">
                      <span className="text-xl">🌱</span>
                      <h3 className="font-medium text-sm">LOTE 5 (Soja)</h3>
                    </div>
                    <p className="text-xs font-normal">85 Has | Activo</p>
                  </div>

                  {/* Contenido blanco - PADDING REDUCIDO */}
                  <div className="px-6 py-2.5">
                    {/* Grid 3 columnas CON LÍNEAS DIVISORIAS */}
                    <div className="grid grid-cols-[1fr_1px_1fr_1px_1fr] gap-4 text-xs items-start">
                      {/* Siembra */}
                      <div>
                        <p className="font-semibold text-gray-800 mb-1.5 flex items-center gap-1">
                          <span className="text-base">🌱</span>
                          SIEMBRA (01/Nov)
                        </p>
                        <div className="space-y-0.5 text-gray-800">
                          <p>Fecha: 01/Nov/2024</p>
                          <p>Semilla: Soja DM-S50</p>
                          <p>Densidad: 38k pl/ha (Largo 95%)</p>
                          <p>Inversión: $8.2k</p>
                        </div>
                      </div>

                      {/* Divisor */}
                      <div className="h-full w-px bg-gray-300"></div>

                      {/* Proceso */}
                      <div>
                        <p className="font-semibold text-gray-800 mb-1.5 flex items-center gap-1">
                          <span className="text-base">🚜</span>
                          PROCESO (V3)
                        </p>
                        <div className="space-y-1 text-gray-800">
                          {/* Progress bar con indicador */}
                          <div className="relative mb-1.5">
                            <Progress value={40} className="h-2 [&>div]:bg-blue-500" />
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-700 rounded-full border-2 border-white" 
                              style={{ left: '40%', marginLeft: '-4px' }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                            <p>V3 - Vegetativo</p>
                            <p className="flex items-center gap-1">
                              <span className="text-green-600">✓</span>
                              Ult: Aplicación Herbicida (2d)
                            </p>
                            <p>80mm | 250 GDD</p>
                            <p className="flex items-center gap-1">
                              <span>🔔</span>
                              Prox: Riego (Pasado Mañana)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Divisor */}
                      <div className="h-full w-px bg-gray-300"></div>

                      {/* Cosecha */}
                      <div>
                        <p className="font-semibold text-gray-800 mb-1.5 flex items-center gap-1">
                          <span className="text-base">🌾</span>
                          COSECHA (Est.)
                        </p>
                        <div className="space-y-0.5 text-gray-800">
                          <p className="flex items-center gap-1">
                            Estado: <span>⏳</span> Pendiente (120 días)
                          </p>
                          <p>Fecha Est.: 20/Mar</p>
                          <p>Rinde (IA): 3.2 Tn/ha +</p>
                          <p>Destino: Puerto</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* CARD DERECHA: Resumen */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-normal text-gray-800">Resumen:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Gráfico de torta */}
                <div className="flex items-center justify-center h-64 relative">
                  {/* SVG Donut Chart */}
                  <svg className="w-56 h-56 transform -rotate-90">
                    {/* Círculo de fondo */}
                    <circle
                      cx="112"
                      cy="112"
                      r="90"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="40"
                    />
                    
                    {/* Maíz - Verde (51% = 120 Ha) - Empieza en 0 */}
                    <circle
                      cx="112"
                      cy="112"
                      r="90"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="40"
                      strokeDasharray={`${(0.51) * 565.5} 565.5`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                    
                    {/* Soja - Azul (36% = 85 Ha) - Empieza después del verde */}
                    <circle
                      cx="112"
                      cy="112"
                      r="90"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="40"
                      strokeDasharray={`${(0.36) * 565.5} 565.5`}
                      strokeDashoffset={`${-(0.51) * 565.5}`}
                      strokeLinecap="round"
                    />
                    
                    {/* Sorgo - Naranja (13% = 30 Ha) - Empieza después del azul */}
                    <circle
                      cx="112"
                      cy="112"
                      r="90"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="40"
                      strokeDasharray={`${(0.13) * 565.5} 565.5`}
                      strokeDashoffset={`${-(0.51 + 0.36) * 565.5}`}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Texto central */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-5xl font-bold text-gray-900">235</p>
                    <p className="text-sm text-gray-600 mt-1">Ha Totales</p>
                  </div>
                </div>

                {/* Leyenda */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-700">Maíz</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">120 Ha (51%)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-gray-700">Soja</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">85 Ha (36%)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                      <span className="text-sm text-gray-700">Sorgo</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">30 Ha (13%)</span>
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>
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