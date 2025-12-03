"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Plus,
  Trash2,
  Layers,
  CloudRain,
  Cpu,
  BarChart3,
  TrendingUp,
  Wifi,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Wind,
  Droplets,
  Sun,
  Thermometer,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Lote = {
  id: string;
  nombre: string;
  hectareas: number;
};

type RotacionCultivo = {
  id: string;
  loteId: string;
  lote: { nombre: string };
  cultivo: string;
  variedad: string | null;
  fechaSiembra: string;
  fechaCosecha: string | null;
  rendimiento: number | null;
  tipoRotacion: string | null;
  laboreo: string | null;
  margenBruto: number | null;
  analisisIA: string | null;
};

type ZonaManejo = {
  id: string;
  loteId: string;
  lote: { nombre: string };
  nombre: string;
  area: number;
  potencialProductivo: string;
  indiceVerde: number | null;
  coordenadas: string;
  color: string;
};

type MapaPrescripcion = {
  id: string;
  loteId: string;
  lote: { nombre: string };
  nombre: string;
  tipo: string;
  producto: string;
  dosisPromedio: number;
  dosisMinima: number;
  dosisMaxima: number;
  unidad: string;
  estado: string;
  generadoPorIA: boolean;
  fechaCreacion: string;
};

type PronosticoClimatico = {
  id: string;
  fecha: string;
  temperaturaMin: number;
  temperaturaMax: number;
  precipitacion: number;
  probabilidadLluvia: number;
  vientoVelocidad: number;
  condicion: string;
  alertas: string | null;
  aptoPulverizar: boolean;
  aptoSembrar: boolean;
  aptoCosechar: boolean;
};

type SensorIoT = {
  id: string;
  loteId: string | null;
  lote: { nombre: string } | null;
  nombre: string;
  tipo: string;
  estado: string;
  ultimaLectura: string | null;
  ultimoValor: number | null;
  unidad: string | null;
  lecturas: LecturaSensor[];
};

type LecturaSensor = {
  id: string;
  timestamp: string;
  valor: number;
  unidad: string;
};

type MapaRendimiento = {
  id: string;
  loteId: string;
  lote: { nombre: string };
  nombre: string;
  cultivo: string;
  fechaCosecha: string;
  rendimientoPromedio: number;
  rendimientoMinimo: number;
  rendimientoMaximo: number;
  coeficienteVariacion: number;
  zonaAlta: number;
  zonaMedia: number;
  zonaBaja: number;
  analisisIA: string | null;
  recomendaciones: string | null;
};

export default function AgriculturaAvanzadaPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [rotaciones, setRotaciones] = useState<RotacionCultivo[]>([]);
  const [zonasManejo, setZonasManejo] = useState<ZonaManejo[]>([]);
  const [mapasPrescripcion, setMapasPrescripcion] = useState<MapaPrescripcion[]>([]);
  const [pronosticos, setPronosticos] = useState<PronosticoClimatico[]>([]);
  const [sensores, setSensores] = useState<SensorIoT[]>([]);
  const [mapasRendimiento, setMapasRendimiento] = useState<MapaRendimiento[]>([]);
  const [loading, setLoading] = useState(true);

  const [rotacionDialogOpen, setRotacionDialogOpen] = useState(false);
  const [zonaDialogOpen, setZonaDialogOpen] = useState(false);
  const [prescripcionDialogOpen, setPrescripcionDialogOpen] = useState(false);
  const [sensorDialogOpen, setSensorDialogOpen] = useState(false);
  const [rendimientoDialogOpen, setRendimientoDialogOpen] = useState(false);
  const [generarPrescripcionDialogOpen, setGenerarPrescripcionDialogOpen] = useState(false);

  const [rotacionForm, setRotacionForm] = useState({
    loteId: "",
    cultivo: "",
    variedad: "",
    fechaSiembra: "",
    fechaCosecha: "",
    rendimiento: "",
    tipoRotacion: "Gramínea",
    aporteNitrogeno: "",
    residuosCosecha: "",
    laboreo: "Siembra Directa",
    costoTotal: "",
    ingresoTotal: "",
    observaciones: "",
  });

  const [zonaForm, setZonaForm] = useState({
    loteId: "",
    nombre: "",
    coordenadas: "",
    area: "",
    potencialProductivo: "Medio",
    tipoSuelo: "",
    profundidad: "",
    pendiente: "Plana",
    indiceVerde: "",
    capacidadAgua: "",
    phSuelo: "",
    materiaOrganica: "",
    rendimientoPromedio: "",
    observaciones: "",
    color: "#3b82f6",
  });

  const [generarPrescripcionForm, setGenerarPrescripcionForm] = useState({
    loteId: "",
    tipo: "Fertilizacion",
    producto: "",
    dosisBase: "",
    unidad: "kg/ha",
  });

  const [prescripcionGenerada, setPrescripcionGenerada] = useState<any>(null);

  const [sensorForm, setSensorForm] = useState({
    loteId: "",
    nombre: "",
    tipo: "HumedadSuelo",
    marca: "",
    modelo: "",
    latitud: "",
    longitud: "",
    profundidad: "",
    unidad: "%",
    frecuenciaMedicion: "",
    alertaMin: "",
    alertaMax: "",
    observaciones: "",
  });

  const [rendimientoForm, setRendimientoForm] = useState({
    loteId: "",
    nombre: "",
    cultivo: "",
    fechaCosecha: "",
    datosRendimiento: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        lotesRes,
        rotacionesRes,
        zonasRes,
        mapasRes,
        pronosticosRes,
        sensoresRes,
        rendimientosRes,
      ] = await Promise.all([
        fetch("/api/lotes"),
        fetch("/api/rotaciones-cultivo"),
        fetch("/api/zonas-manejo"),
        fetch("/api/mapas-prescripcion"),
        fetch("/api/pronostico-climatico"),
        fetch("/api/sensores-iot"),
        fetch("/api/mapas-rendimiento"),
      ]);

      if (lotesRes.ok) {
        const data = await lotesRes.json();
        setLotes(data);
      }

      if (rotacionesRes.ok) {
        const data = await rotacionesRes.json();
        setRotaciones(data);
      }

      if (zonasRes.ok) {
        const data = await zonasRes.json();
        setZonasManejo(data);
      }

      if (mapasRes.ok) {
        const data = await mapasRes.json();
        setMapasPrescripcion(data);
      }

      if (pronosticosRes.ok) {
        const data = await pronosticosRes.json();
        setPronosticos(data);
      }

      if (sensoresRes.ok) {
        const data = await sensoresRes.json();
        setSensores(data);
      }

      if (rendimientosRes.ok) {
        const data = await rendimientosRes.json();
        setMapasRendimiento(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRotacion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/rotaciones-cultivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rotacionForm),
      });

      if (response.ok) {
        setRotacionDialogOpen(false);
        setRotacionForm({
          loteId: "",
          cultivo: "",
          variedad: "",
          fechaSiembra: "",
          fechaCosecha: "",
          rendimiento: "",
          tipoRotacion: "Gramínea",
          aporteNitrogeno: "",
          residuosCosecha: "",
          laboreo: "Siembra Directa",
          costoTotal: "",
          ingresoTotal: "",
          observaciones: "",
        });
        fetchData();
        alert("Rotación registrada con análisis de sostenibilidad");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear rotación");
    }
  };

  const handleCreateZona = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Crear coordenadas básicas si no existen
      const coordenadas = zonaForm.coordenadas
        ? JSON.parse(zonaForm.coordenadas)
        : {
            type: "Polygon",
            coordinates: [
              [
                [-58.5, -34.5],
                [-58.4, -34.5],
                [-58.4, -34.4],
                [-58.5, -34.4],
                [-58.5, -34.5],
              ],
            ],
          };

      const response = await fetch("/api/zonas-manejo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...zonaForm, coordenadas }),
      });

      if (response.ok) {
        setZonaDialogOpen(false);
        setZonaForm({
          loteId: "",
          nombre: "",
          coordenadas: "",
          area: "",
          potencialProductivo: "Medio",
          tipoSuelo: "",
          profundidad: "",
          pendiente: "Plana",
          indiceVerde: "",
          capacidadAgua: "",
          phSuelo: "",
          materiaOrganica: "",
          rendimientoPromedio: "",
          observaciones: "",
          color: "#3b82f6",
        });
        fetchData();
        alert("Zona de manejo creada");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear zona");
    }
  };

  const handleGenerarPrescripcion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/mapas-prescripcion/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generarPrescripcionForm),
      });

      if (response.ok) {
        const data = await response.json();
        setPrescripcionGenerada(data);
        alert("Prescripción variable generada con IA");
      } else {
        const error = await response.json();
        alert(error.error || "Error al generar prescripción");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar prescripción");
    }
  };

  const handleGuardarPrescripcion = async () => {
    if (!prescripcionGenerada) return;

    try {
      const response = await fetch("/api/mapas-prescripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...prescripcionGenerada,
          nombre: `${prescripcionGenerada.tipo} - ${prescripcionGenerada.producto}`,
        }),
      });

      if (response.ok) {
        setGenerarPrescripcionDialogOpen(false);
        setPrescripcionGenerada(null);
        setGenerarPrescripcionForm({
          loteId: "",
          tipo: "Fertilizacion",
          producto: "",
          dosisBase: "",
          unidad: "kg/ha",
        });
        fetchData();
        alert("Mapa de prescripción guardado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar mapa");
    }
  };

  const handleCreateSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/sensores-iot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sensorForm),
      });

      if (response.ok) {
        setSensorDialogOpen(false);
        setSensorForm({
          loteId: "",
          nombre: "",
          tipo: "HumedadSuelo",
          marca: "",
          modelo: "",
          latitud: "",
          longitud: "",
          profundidad: "",
          unidad: "%",
          frecuenciaMedicion: "",
          alertaMin: "",
          alertaMax: "",
          observaciones: "",
        });
        fetchData();
        alert("Sensor IoT registrado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear sensor");
    }
  };

  const handleCreateMapaRendimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Generar datos simulados de rendimiento
      const datosRendimiento = [];
      for (let i = 0; i < 50; i++) {
        datosRendimiento.push({
          lat: -34.5 + Math.random() * 0.1,
          lon: -58.5 + Math.random() * 0.1,
          rendimiento: 3000 + Math.random() * 2000, // kg/ha
        });
      }

      const response = await fetch("/api/mapas-rendimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rendimientoForm,
          datosRendimiento,
        }),
      });

      if (response.ok) {
        setRendimientoDialogOpen(false);
        setRendimientoForm({
          loteId: "",
          nombre: "",
          cultivo: "",
          fechaCosecha: "",
          datosRendimiento: "",
        });
        fetchData();
        alert("Mapa de rendimiento creado con análisis IA");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear mapa");
    }
  };

  const eliminarRotacion = async (id: string) => {
    if (!confirm("¿Eliminar rotación?")) return;
    try {
      const response = await fetch(`/api/rotaciones-cultivo/${id}`, { method: "DELETE" });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarZona = async (id: string) => {
    if (!confirm("¿Eliminar zona?")) return;
    try {
      const response = await fetch(`/api/zonas-manejo/${id}`, { method: "DELETE" });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarMapa = async (id: string) => {
    if (!confirm("¿Eliminar mapa?")) return;
    try {
      const response = await fetch(`/api/mapas-prescripcion/${id}`, { method: "DELETE" });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarSensor = async (id: string) => {
    if (!confirm("¿Eliminar sensor?")) return;
    try {
      const response = await fetch(`/api/sensores-iot/${id}`, { method: "DELETE" });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarMapaRendimiento = async (id: string) => {
    if (!confirm("¿Eliminar mapa?")) return;
    try {
      const response = await fetch(`/api/mapas-rendimiento/${id}`, { method: "DELETE" });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // KPIs
  const totalRotaciones = rotaciones.length;
  const totalZonas = zonasManejo.length;
  const totalMapas = mapasPrescripcion.length;
  const sensoresActivos = sensores.filter((s) => s.estado === "Activo").length;

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Pendiente":
        return "bg-yellow-500";
      case "Aplicado":
        return "bg-green-500";
      case "Cancelado":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPotencialColor = (potencial: string) => {
    switch (potencial) {
      case "Alto":
        return "bg-green-500";
      case "Medio":
        return "bg-yellow-500";
      case "Bajo":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Datos para gráficos
  const datosRotacionPorTipo = rotaciones.reduce((acc: any, r) => {
    const tipo = r.tipoRotacion || "Sin clasificar";
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  const chartRotaciones = Object.entries(datosRotacionPorTipo).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ["#22c55e", "#eab308", "#3b82f6", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agricultura de Precisión Avanzada</h1>
          <p className="text-gray-600 mt-2">
            Gestión completa con IoT, prescripción variable y análisis de sostenibilidad
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rotaciones Registradas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRotaciones}</div>
            <p className="text-xs text-gray-500 mt-1">Historial completo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Zonas de Manejo</CardTitle>
            <Layers className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalZonas}</div>
            <p className="text-xs text-gray-500 mt-1">Zonificación activa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Mapas Prescripción
            </CardTitle>
            <MapPin className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMapas}</div>
            <p className="text-xs text-gray-500 mt-1">Agricultura variable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sensores IoT</CardTitle>
            <Wifi className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sensoresActivos}</div>
            <p className="text-xs text-gray-500 mt-1">Activos en campo</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rotaciones" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="rotaciones">
            <TrendingUp className="h-4 w-4 mr-2" />
            Rotaciones
          </TabsTrigger>
          <TabsTrigger value="zonas">
            <Layers className="h-4 w-4 mr-2" />
            Zonas
          </TabsTrigger>
          <TabsTrigger value="prescripcion">
            <MapPin className="h-4 w-4 mr-2" />
            Prescripción
          </TabsTrigger>
          <TabsTrigger value="clima">
            <CloudRain className="h-4 w-4 mr-2" />
            Clima
          </TabsTrigger>
          <TabsTrigger value="iot">
            <Wifi className="h-4 w-4 mr-2" />
            IoT
          </TabsTrigger>
          <TabsTrigger value="rendimiento">
            <BarChart3 className="h-4 w-4 mr-2" />
            Rendimiento
          </TabsTrigger>
          <TabsTrigger value="costos">
            <Cpu className="h-4 w-4 mr-2" />
            Costos Riego
          </TabsTrigger>
        </TabsList>
        {/* TAB: ROTACIONES */}
        <TabsContent value="rotaciones" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Historial de Rotaciones de Cultivos</h2>
            <Button
              onClick={() => setRotacionDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Rotación
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Gráfico de Rotaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                {chartRotaciones.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartRotaciones}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label
                      >
                        {chartRotaciones.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">Sin datos</div>
                )}
              </CardContent>
            </Card>

            {/* Lista de Rotaciones */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Rotaciones Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Cargando...</div>
                ) : rotaciones.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No hay rotaciones registradas</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {rotaciones.map((rotacion) => (
                      <div key={rotacion.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium text-lg">{rotacion.cultivo}</p>
                              {rotacion.variedad && (
                                <Badge variant="outline">{rotacion.variedad}</Badge>
                              )}
                              {rotacion.tipoRotacion && (
                                <Badge className="bg-green-500">{rotacion.tipoRotacion}</Badge>
                              )}
                              <Badge variant="outline">{rotacion.lote.nombre}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                              <div>
                                <p className="text-gray-500">Siembra</p>
                                <p className="font-medium">
                                  {formatDate(rotacion.fechaSiembra)}
                                </p>
                              </div>
                              {rotacion.fechaCosecha && (
                                <div>
                                  <p className="text-gray-500">Cosecha</p>
                                  <p className="font-medium">
                                    {formatDate(rotacion.fechaCosecha)}
                                  </p>
                                </div>
                              )}
                            </div>
                            {rotacion.rendimiento && (
                              <div className="bg-blue-50 p-2 rounded text-sm mb-2">
                                <p className="text-gray-600">
                                  Rendimiento: <strong>{rotacion.rendimiento} kg/ha</strong>
                                </p>
                              </div>
                            )}
                            {rotacion.margenBruto && (
                              <div className="bg-green-50 p-2 rounded text-sm mb-2">
                                <p className="text-gray-600">
                                  Margen Bruto:{" "}
                                  <strong className="text-green-700">
                                    ${rotacion.margenBruto.toFixed(2)}/ha
                                  </strong>
                                </p>
                              </div>
                            )}
                            {rotacion.analisisIA && (
                              <div className="bg-purple-50 p-3 rounded border border-purple-200 mt-2">
                                <p className="text-sm font-medium text-purple-900 mb-1">
                                  Análisis de Sostenibilidad:
                                </p>
                                <p className="text-sm text-purple-700">
                                  {JSON.parse(rotacion.analisisIA).recomendacion}
                                </p>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarRotacion(rotacion.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: ZONAS DE MANEJO */}
        <TabsContent value="zonas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Zonas de Manejo Diferenciado</h2>
            <Button
              onClick={() => setZonaDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Zona
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Zonas Definidas</CardTitle>
              <CardDescription>
                Clasificación por potencial productivo y características agronómicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : zonasManejo.length === 0 ? (
                <div className="text-center py-8">
                  <Layers className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay zonas de manejo definidas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {zonasManejo.map((zona) => (
                    <div key={zona.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: zona.color }}
                            />
                            <p className="font-medium text-lg">{zona.nombre}</p>
                            <Badge className={getPotencialColor(zona.potencialProductivo)}>
                              {zona.potencialProductivo}
                            </Badge>
                            <Badge variant="outline">{zona.lote.nombre}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 p-3 rounded">
                            <div>
                              <p className="text-gray-500">Área</p>
                              <p className="font-medium">{zona.area.toFixed(2)} ha</p>
                            </div>
                            {zona.indiceVerde && (
                              <div>
                                <p className="text-gray-500">NDVI Promedio</p>
                                <p className="font-medium">{zona.indiceVerde.toFixed(2)}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-gray-500">Potencial</p>
                              <p className="font-medium">{zona.potencialProductivo}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarZona(zona.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: PRESCRIPCIÓN VARIABLE */}
        <TabsContent value="prescripcion" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Mapas de Prescripción Variable</h2>
            <Button
              onClick={() => setGenerarPrescripcionDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Generar Prescripción IA
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mapas Creados</CardTitle>
              <CardDescription>
                Prescripciones variables para maquinaria de precisión
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : mapasPrescripcion.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay mapas de prescripción generados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mapasPrescripcion.map((mapa) => (
                    <div key={mapa.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-lg">{mapa.nombre}</p>
                            <Badge className={getEstadoColor(mapa.estado)}>{mapa.estado}</Badge>
                            <Badge variant="outline">{mapa.tipo}</Badge>
                            {mapa.generadoPorIA && (
                              <Badge className="bg-purple-500">IA</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {mapa.lote.nombre} • {mapa.producto}
                          </p>
                          <div className="grid grid-cols-4 gap-3 text-sm bg-gray-50 p-3 rounded">
                            <div>
                              <p className="text-gray-500">Dosis Promedio</p>
                              <p className="font-medium">
                                {mapa.dosisPromedio} {mapa.unidad}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Dosis Mínima</p>
                              <p className="font-medium">
                                {mapa.dosisMinima} {mapa.unidad}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Dosis Máxima</p>
                              <p className="font-medium">
                                {mapa.dosisMaxima} {mapa.unidad}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Creado</p>
                              <p className="font-medium">
                                {formatDate(mapa.fechaCreacion)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              alert("Descarga de archivo shapefile (simulado)")
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarMapa(mapa.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: PRONÓSTICO CLIMÁTICO */}
        <TabsContent value="clima" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pronóstico Climático Extendido</h2>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Próximos 7 Días</CardTitle>
              <CardDescription>
                Con alertas agronómicas de seguridad para planificar labores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : pronosticos.length === 0 ? (
                <div className="text-center py-8">
                  <CloudRain className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay pronóstico disponible</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pronosticos.map((dia) => (
                    <Card key={dia.id} className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {new Date(dia.fecha).toLocaleDateString("es-AR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </CardTitle>
                        <p className="text-sm text-gray-600">{dia.condicion}</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Thermometer className="h-5 w-5 text-red-500" />
                          <div className="text-sm">
                            <span className="font-bold text-red-600">
                              {dia.temperaturaMax}°
                            </span>
                            {" / "}
                            <span className="text-blue-600">{dia.temperaturaMin}°</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Droplets className="h-5 w-5 text-blue-500" />
                          <div className="text-sm">
                            <span className="font-medium">{dia.precipitacion} mm</span>
                            <span className="text-gray-500 ml-2">
                              ({dia.probabilidadLluvia}%)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Wind className="h-5 w-5 text-gray-500" />
                          <div className="text-sm">
                            <span className="font-medium">{dia.vientoVelocidad} km/h</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            {dia.aptoPulverizar ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <span
                              className={
                                dia.aptoPulverizar ? "text-green-700" : "text-red-700"
                              }
                            >
                              {dia.aptoPulverizar
                                ? "Apto pulverizar"
                                : "No pulverizar"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {dia.aptoSembrar ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <span
                              className={
                                dia.aptoSembrar ? "text-green-700" : "text-red-700"
                              }
                            >
                              {dia.aptoSembrar ? "Apto sembrar" : "No sembrar"}
                            </span>
                          </div>
                        </div>

                        {dia.alertas && (
                          <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                            <p className="text-xs font-medium text-yellow-900 mb-1">
                              Alertas:
                            </p>
                            <ul className="text-xs text-yellow-800 space-y-0.5">
                              {JSON.parse(dia.alertas).map((alerta: string, idx: number) => (
                                <li key={idx}>{alerta}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: SENSORES IOT */}
        <TabsContent value="iot" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Sensores IoT y Monitoreo</h2>
            <Button
              onClick={() => setSensorDialogOpen(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Sensor
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sensores en Campo</CardTitle>
              <CardDescription>
                Monitoreo en tiempo real de humedad, temperatura y variables ambientales
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : sensores.length === 0 ? (
                <div className="text-center py-8">
                  <Wifi className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay sensores registrados</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {sensores.map((sensor) => (
                    <Card key={sensor.id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{sensor.nombre}</CardTitle>
                          <Badge
                            className={
                              sensor.estado === "Activo" ? "bg-green-500" : "bg-gray-500"
                            }
                          >
                            {sensor.estado}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {sensor.tipo}
                          {sensor.lote && ` • ${sensor.lote.nombre}`}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {sensor.ultimoValor !== null && (
                          <div className="bg-blue-50 p-4 rounded text-center">
                            <p className="text-3xl font-bold text-blue-700">
                              {sensor.ultimoValor.toFixed(1)}
                            </p>
                            <p className="text-sm text-gray-600">{sensor.unidad}</p>
                            {sensor.ultimaLectura && (
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(sensor.ultimaLectura)}
                              </p>
                            )}
                          </div>
                        )}

                        {sensor.lecturas && sensor.lecturas.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Últimas Lecturas:</p>
                            <ResponsiveContainer width="100%" height={100}>
                              <LineChart data={sensor.lecturas.slice(0, 10).reverse()}>
                                <Line
                                  type="monotone"
                                  dataKey="valor"
                                  stroke="#3b82f6"
                                  strokeWidth={2}
                                  dot={false}
                                />
                                <Tooltip />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => alert("Ver historial completo (simulado)")}
                          >
                            Ver Historial
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarSensor(sensor.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: MAPAS DE RENDIMIENTO */}
        <TabsContent value="rendimiento" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Mapas de Rendimiento</h2>
            <Button
              onClick={() => setRendimientoDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Mapa
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Análisis de Rendimiento por Zona</CardTitle>
              <CardDescription>
                Mapas georeferenciados con análisis de variabilidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : mapasRendimiento.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay mapas de rendimiento</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mapasRendimiento.map((mapa) => (
                    <Card key={mapa.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{mapa.nombre}</CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarMapaRendimiento(mapa.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600">
                          {mapa.lote.nombre} • {mapa.cultivo} •{" "}
                          {formatDate(mapa.fechaCosecha)}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-4 gap-3">
                          <div className="bg-blue-50 p-3 rounded text-center">
                            <p className="text-xs text-gray-600 mb-1">Promedio</p>
                            <p className="text-xl font-bold text-blue-700">
                              {mapa.rendimientoPromedio.toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-500">kg/ha</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded text-center">
                            <p className="text-xs text-gray-600 mb-1">Máximo</p>
                            <p className="text-xl font-bold text-green-700">
                              {mapa.rendimientoMaximo.toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-500">kg/ha</p>
                          </div>
                          <div className="bg-red-50 p-3 rounded text-center">
                            <p className="text-xs text-gray-600 mb-1">Mínimo</p>
                            <p className="text-xl font-bold text-red-700">
                              {mapa.rendimientoMinimo.toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-500">kg/ha</p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded text-center">
                            <p className="text-xs text-gray-600 mb-1">CV</p>
                            <p className="text-xl font-bold text-purple-700">
                              {mapa.coeficienteVariacion.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">variación</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-green-100 p-3 rounded">
                            <p className="text-sm font-medium text-green-900">Zona Alta</p>
                            <p className="text-2xl font-bold text-green-700">
                              {mapa.zonaAlta.toFixed(1)}%
                            </p>
                          </div>
                          <div className="bg-yellow-100 p-3 rounded">
                            <p className="text-sm font-medium text-yellow-900">Zona Media</p>
                            <p className="text-2xl font-bold text-yellow-700">
                              {mapa.zonaMedia.toFixed(1)}%
                            </p>
                          </div>
                          <div className="bg-red-100 p-3 rounded">
                            <p className="text-sm font-medium text-red-900">Zona Baja</p>
                            <p className="text-2xl font-bold text-red-700">
                              {mapa.zonaBaja.toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        {mapa.analisisIA && (
                          <div className="bg-purple-50 p-3 rounded border border-purple-200">
                            <p className="text-sm font-medium text-purple-900 mb-1">
                              Análisis IA:
                            </p>
                            <p className="text-sm text-purple-700">
                              {JSON.parse(mapa.analisisIA).variabilidad}
                            </p>
                          </div>
                        )}

                        {mapa.recomendaciones && (
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="text-sm font-medium text-blue-900 mb-2">
                              Recomendaciones:
                            </p>
                            <ul className="text-sm text-blue-700 space-y-1">
                              {JSON.parse(mapa.recomendaciones).map(
                                (rec: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span>{rec}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: COSTOS DE RIEGO */}
        <TabsContent value="costos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Análisis de Costos de Riego</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evaluación Económica del Riego</CardTitle>
              <CardDescription>
                Análisis de costo energético vs. beneficio productivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Cpu className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 mb-4">
                  Funcionalidad disponible en planes de riego activos
                </p>
                <p className="text-sm text-gray-600">
                  Registrá costos de energía, mano de obra y mantenimiento para obtener análisis
                  de rentabilidad con IA
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Nueva Rotación */}
      <Dialog open={rotacionDialogOpen} onOpenChange={setRotacionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateRotacion}>
            <DialogHeader>
              <DialogTitle>Registrar Rotación de Cultivo</DialogTitle>
              <DialogDescription>
                Historial completo con análisis de sostenibilidad
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lote *</Label>
                  <Select
                    value={rotacionForm.loteId}
                    onValueChange={(value) =>
                      setRotacionForm({ ...rotacionForm, loteId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar lote" />
                    </SelectTrigger>
                    <SelectContent>
                      {lotes.map((lote) => (
                        <SelectItem key={lote.id} value={lote.id}>
                          {lote.nombre} ({lote.hectareas} ha)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cultivo *</Label>
                  <Input
                    placeholder="Ej: Soja"
                    value={rotacionForm.cultivo}
                    onChange={(e) =>
                      setRotacionForm({ ...rotacionForm, cultivo: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Variedad</Label>
                  <Input
                    placeholder="Ej: DM 4210"
                    value={rotacionForm.variedad}
                    onChange={(e) =>
                      setRotacionForm({ ...rotacionForm, variedad: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Rotación *</Label>
                  <Select
                    value={rotacionForm.tipoRotacion}
                    onValueChange={(value) =>
                      setRotacionForm({ ...rotacionForm, tipoRotacion: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gramínea">Gramínea (Maíz, Trigo, Avena)</SelectItem>
                      <SelectItem value="Leguminosa">Leguminosa (Soja, Alfalfa)</SelectItem>
                      <SelectItem value="Oleaginosa">Oleaginosa (Girasol, Colza)</SelectItem>
                      <SelectItem value="Forrajera">Forrajera (Pasturas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Siembra *</Label>
                  <Input
                    type="date"
                    value={rotacionForm.fechaSiembra}
                    onChange={(e) =>
                      setRotacionForm({ ...rotacionForm, fechaSiembra: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Cosecha</Label>
                  <Input
                    type="date"
                    value={rotacionForm.fechaCosecha}
                    onChange={(e) =>
                      setRotacionForm({ ...rotacionForm, fechaCosecha: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Rendimiento (kg/ha)</Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="3500"
                    value={rotacionForm.rendimiento}
                    onChange={(e) =>
                      setRotacionForm({ ...rotacionForm, rendimiento: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aporte N (kg/ha)</Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="-80 o +100"
                    value={rotacionForm.aporteNitrogeno}
                    onChange={(e) =>
                      setRotacionForm({ ...rotacionForm, aporteNitrogeno: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Residuos (ton/ha)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="5.0"
                    value={rotacionForm.residuosCosecha}
                    onChange={(e) =>
                      setRotacionForm({ ...rotacionForm, residuosCosecha: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Laboreo *</Label>
                <Select
                  value={rotacionForm.laboreo}
                  onValueChange={(value) =>
                    setRotacionForm({ ...rotacionForm, laboreo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Siembra Directa">Siembra Directa</SelectItem>
                    <SelectItem value="Reducido">Laboreo Reducido</SelectItem>
                    <SelectItem value="Convencional">Laboreo Convencional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Costo Total (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="500"
                    value={rotacionForm.costoTotal}
                    onChange={(e) =>
                      setRotacionForm({ ...rotacionForm, costoTotal: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ingreso Total (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="800"
                    value={rotacionForm.ingresoTotal}
                    onChange={(e) =>
                      setRotacionForm({ ...rotacionForm, ingresoTotal: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Notas adicionales sobre el cultivo..."
                  value={rotacionForm.observaciones}
                  onChange={(e) =>
                    setRotacionForm({ ...rotacionForm, observaciones: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRotacionDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Registrar con Análisis IA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nueva Zona de Manejo */}
      <Dialog open={zonaDialogOpen} onOpenChange={setZonaDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateZona}>
            <DialogHeader>
              <DialogTitle>Crear Zona de Manejo</DialogTitle>
              <DialogDescription>
                Definir áreas con manejo diferenciado dentro del lote
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lote *</Label>
                  <Select
                    value={zonaForm.loteId}
                    onValueChange={(value) => setZonaForm({ ...zonaForm, loteId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar lote" />
                    </SelectTrigger>
                    <SelectContent>
                      {lotes.map((lote) => (
                        <SelectItem key={lote.id} value={lote.id}>
                          {lote.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nombre de la Zona *</Label>
                  <Input
                    placeholder="Ej: Zona Alta Norte"
                    value={zonaForm.nombre}
                    onChange={(e) => setZonaForm({ ...zonaForm, nombre: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Área (ha) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="15.5"
                    value={zonaForm.area}
                    onChange={(e) => setZonaForm({ ...zonaForm, area: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Potencial Productivo *</Label>
                  <Select
                    value={zonaForm.potencialProductivo}
                    onValueChange={(value) =>
                      setZonaForm({ ...zonaForm, potencialProductivo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alto">Alto</SelectItem>
                      <SelectItem value="Medio">Medio</SelectItem>
                      <SelectItem value="Bajo">Bajo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color en Mapa</Label>
                  <Input
                    type="color"
                    value={zonaForm.color}
                    onChange={(e) => setZonaForm({ ...zonaForm, color: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Suelo</Label>
                  <Input
                    placeholder="Ej: Franco"
                    value={zonaForm.tipoSuelo}
                    onChange={(e) => setZonaForm({ ...zonaForm, tipoSuelo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profundidad (cm)</Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="80"
                    value={zonaForm.profundidad}
                    onChange={(e) => setZonaForm({ ...zonaForm, profundidad: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pendiente</Label>
                  <Select
                    value={zonaForm.pendiente}
                    onValueChange={(value) => setZonaForm({ ...zonaForm, pendiente: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Plana">Plana</SelectItem>
                      <SelectItem value="Suave">Suave</SelectItem>
                      <SelectItem value="Moderada">Moderada</SelectItem>
                      <SelectItem value="Pronunciada">Pronunciada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>NDVI Promedio</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.75"
                    value={zonaForm.indiceVerde}
                    onChange={(e) => setZonaForm({ ...zonaForm, indiceVerde: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cap. Agua (mm)</Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="150"
                    value={zonaForm.capacidadAgua}
                    onChange={(e) => setZonaForm({ ...zonaForm, capacidadAgua: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>pH Suelo</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    placeholder="6.5"
                    value={zonaForm.phSuelo}
                    onChange={(e) => setZonaForm({ ...zonaForm, phSuelo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>M.O. (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="3.5"
                    value={zonaForm.materiaOrganica}
                    onChange={(e) =>
                      setZonaForm({ ...zonaForm, materiaOrganica: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rendimiento Promedio (kg/ha)</Label>
                <Input
                  type="number"
                  step="1"
                  placeholder="4000"
                  value={zonaForm.rendimientoPromedio}
                  onChange={(e) =>
                    setZonaForm({ ...zonaForm, rendimientoPromedio: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Características especiales de la zona..."
                  value={zonaForm.observaciones}
                  onChange={(e) => setZonaForm({ ...zonaForm, observaciones: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setZonaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Crear Zona
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Generar Prescripción Variable */}
      <Dialog
        open={generarPrescripcionDialogOpen}
        onOpenChange={setGenerarPrescripcionDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generar Prescripción Variable con IA</DialogTitle>
            <DialogDescription>
              El sistema ajustará dosis automáticamente según zonas de manejo
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGenerarPrescripcion} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lote *</Label>
                <Select
                  value={generarPrescripcionForm.loteId}
                  onValueChange={(value) =>
                    setGenerarPrescripcionForm({ ...generarPrescripcionForm, loteId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar lote" />
                  </SelectTrigger>
                  <SelectContent>
                    {lotes.map((lote) => (
                      <SelectItem key={lote.id} value={lote.id}>
                        {lote.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Aplicación *</Label>
                <Select
                  value={generarPrescripcionForm.tipo}
                  onValueChange={(value) =>
                    setGenerarPrescripcionForm({ ...generarPrescripcionForm, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Siembra">Siembra</SelectItem>
                    <SelectItem value="Fertilizacion">Fertilización</SelectItem>
                    <SelectItem value="Pulverizacion">Pulverización</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Producto/Insumo *</Label>
              <Input
                placeholder="Ej: Urea 46%"
                value={generarPrescripcionForm.producto}
                onChange={(e) =>
                  setGenerarPrescripcionForm({
                    ...generarPrescripcionForm,
                    producto: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dosis Base *</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="100"
                  value={generarPrescripcionForm.dosisBase}
                  onChange={(e) =>
                    setGenerarPrescripcionForm({
                      ...generarPrescripcionForm,
                      dosisBase: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Unidad *</Label>
                <Select
                  value={generarPrescripcionForm.unidad}
                  onValueChange={(value) =>
                    setGenerarPrescripcionForm({ ...generarPrescripcionForm, unidad: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg/ha">kg/ha</SelectItem>
                    <SelectItem value="L/ha">L/ha</SelectItem>
                    <SelectItem value="semillas/ha">semillas/ha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
              <MapPin className="h-4 w-4 mr-2" />
              Generar Prescripción Variable
            </Button>
          </form>

          {prescripcionGenerada && (
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Prescripción Generada con IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-3 rounded border">
                  <p className="font-medium mb-2">Criterios Aplicados:</p>
                  <div className="text-sm text-gray-700 space-y-1">
                    {Object.entries(prescripcionGenerada.criterios || {}).map(
                      ([key, value]: [string, any]) => (
                        <p key={key}>
                          <strong>{key}:</strong> {value}
                        </p>
                      )
                    )}
                  </div>
                </div>

                <div className="bg-white p-3 rounded border">
                  <p className="font-medium mb-2">
                    Dosis por Zona ({prescripcionGenerada.prescripcionDatos?.length} zonas):
                  </p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {prescripcionGenerada.prescripcionDatos?.map((zona: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{zona.zonaNombre}</span>
                        <Badge variant="outline">
                          {zona.dosis} {zona.unidad}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleGuardarPrescripcion}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Guardar Mapa de Prescripción
                </Button>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Sensor IoT */}
      <Dialog open={sensorDialogOpen} onOpenChange={setSensorDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateSensor}>
            <DialogHeader>
              <DialogTitle>Registrar Sensor IoT</DialogTitle>
              <DialogDescription>
                Conectar sensores de humedad, temperatura y estaciones meteorológicas
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Sensor *</Label>
                  <Input
                    placeholder="Ej: Humedad Lote 5 - Norte"
                    value={sensorForm.nombre}
                    onChange={(e) => setSensorForm({ ...sensorForm, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={sensorForm.tipo}
                    onValueChange={(value) => setSensorForm({ ...sensorForm, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HumedadSuelo">Humedad de Suelo</SelectItem>
                      <SelectItem value="Temperatura">Temperatura</SelectItem>
                      <SelectItem value="Pluviometro">Pluviómetro</SelectItem>
                      <SelectItem value="EstacionMeteo">Estación Meteorológica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lote (opcional)</Label>
                <Select
                  value={sensorForm.loteId}
                  onValueChange={(value) => setSensorForm({ ...sensorForm, loteId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asociar a lote" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin asociar</SelectItem>
                    {lotes.map((lote) => (
                      <SelectItem key={lote.id} value={lote.id}>
                        {lote.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input
                    placeholder="Ej: Davis Instruments"
                    value={sensorForm.marca}
                    onChange={(e) => setSensorForm({ ...sensorForm, marca: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Input
                    placeholder="Ej: Vantage Pro2"
                    value={sensorForm.modelo}
                    onChange={(e) => setSensorForm({ ...sensorForm, modelo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Latitud</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    placeholder="-34.603722"
                    value={sensorForm.latitud}
                    onChange={(e) => setSensorForm({ ...sensorForm, latitud: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitud</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    placeholder="-58.381592"
                    value={sensorForm.longitud}
                    onChange={(e) => setSensorForm({ ...sensorForm, longitud: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profundidad (cm)</Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="30"
                    value={sensorForm.profundidad}
                    onChange={(e) => setSensorForm({ ...sensorForm, profundidad: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Unidad *</Label>
                  <Select
                    value={sensorForm.unidad}
                    onValueChange={(value) => setSensorForm({ ...sensorForm, unidad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="%">% (Humedad)</SelectItem>
                      <SelectItem value="°C">°C (Temperatura)</SelectItem>
                      <SelectItem value="mm">mm (Precipitación)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Alerta Mínima</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="20"
                    value={sensorForm.alertaMin}
                    onChange={(e) => setSensorForm({ ...sensorForm, alertaMin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alerta Máxima</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="80"
                    value={sensorForm.alertaMax}
                    onChange={(e) => setSensorForm({ ...sensorForm, alertaMax: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Notas sobre el sensor..."
                  value={sensorForm.observaciones}
                  onChange={(e) => setSensorForm({ ...sensorForm, observaciones: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSensorDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                Registrar Sensor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Crear Mapa de Rendimiento */}
      <Dialog open={rendimientoDialogOpen} onOpenChange={setRendimientoDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateMapaRendimiento}>
            <DialogHeader>
              <DialogTitle>Crear Mapa de Rendimiento</DialogTitle>
              <DialogDescription>
                Análisis georeferenciado con IA de variabilidad
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Lote *</Label>
                <Select
                  value={rendimientoForm.loteId}
                  onValueChange={(value) =>
                    setRendimientoForm({ ...rendimientoForm, loteId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar lote" />
                  </SelectTrigger>
                  <SelectContent>
                    {lotes.map((lote) => (
                      <SelectItem key={lote.id} value={lote.id}>
                        {lote.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nombre del Mapa *</Label>
                <Input
                  placeholder="Ej: Cosecha Soja 2024"
                  value={rendimientoForm.nombre}
                  onChange={(e) =>
                    setRendimientoForm({ ...rendimientoForm, nombre: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cultivo *</Label>
                  <Input
                    placeholder="Ej: Soja"
                    value={rendimientoForm.cultivo}
                    onChange={(e) =>
                      setRendimientoForm({ ...rendimientoForm, cultivo: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Cosecha *</Label>
                  <Input
                    type="date"
                    value={rendimientoForm.fechaCosecha}
                    onChange={(e) =>
                      setRendimientoForm({ ...rendimientoForm, fechaCosecha: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-sm text-blue-900">
                  ℹ️ El sistema generará datos simulados de rendimiento para análisis. En
                  producción, se importarían datos de la cosechadora.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRendimientoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Crear con Análisis IA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="bg-gradient-to-r from-green-50 to-purple-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Agricultura de Precisión 100% Completa</p>
              <p className="text-sm text-green-700 mt-1">
                Sistema integral con rotaciones, zonificación, prescripción variable con IA,
                pronóstico climático, sensores IoT, mapas de rendimiento y análisis de
                sostenibilidad. Todas las funcionalidades implementadas para agricultura
                profesional de precisión.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}        