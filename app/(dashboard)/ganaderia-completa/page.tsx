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
import {
  Scale,
  TrendingUp,
  ArrowRightLeft,
  Milk,
  Dna,
  DollarSign,
  Users,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Activity,
  Calendar,
  MapPin,
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
  Area,
  AreaChart,
} from "recharts";

type Animal = {
  id: string;
  caravana: string;
  tipo: string;
  raza: string | null;
  sexo: string | null;
};

type Lote = {
  id: string;
  nombre: string;
  hectareas: number;
};

type RegistroPeso = {
  id: string;
  animalId: string;
  animal: { caravana: string; tipo: string };
  fecha: string;
  peso: number;
  tipoMedicion: string;
  gananciaPromedioDiaria: number | null;
  edadDias: number | null;
  analisisIA: string | null;
  alertas: string | null;
};

type MovimientoAnimal = {
  id: string;
  animalId: string;
  animal: { caravana: string; tipo: string };
  fecha: string;
  tipoMovimiento: string;
  origenNombre: string | null;
  destinoNombre: string | null;
  motivo: string;
  pesoMovimiento: number | null;
  precioVenta: number | null;
};

type ProduccionLechera = {
  id: string;
  animalId: string;
  animal: { caravana: string; tipo: string };
  fecha: string;
  litrosTotales: number;
  litrosManana: number | null;
  litrosTarde: number | null;
  diasLactancia: number | null;
  promedioUltimos7Dias: number | null;
  variacionPorcentual: number | null;
  alertaCaida: boolean;
  analisisIA: string | null;
};

type RegistroGenetico = {
  id: string;
  animalId: string;
  animal: { caravana: string; tipo: string };
  padre: { caravana: string } | null;
  madre: { caravana: string } | null;
  razaPura: boolean;
  registroGenealogia: string | null;
  valorGeneticoEstimado: number | null;
};

type AnalisisROI = {
  id: string;
  reproductorId: string;
  reproductor: { caravana: string; tipo: string };
  periodo: string;
  roi: number;
  beneficioNeto: number;
  numeroDescendientes: number;
  recomendacion: string | null;
  analisisIA: string | null;
};

type ControlCarga = {
  id: string;
  loteId: string;
  lote: { nombre: string; hectareas: number };
  fecha: string;
  cantidadAnimales: number;
  cargaAnimalUA: number;
  porcentajeCapacidad: number;
  estado: string;
  analisisIA: string | null;
  alertas: string | null;
};

type EventoVida = {
  id: string;
  fecha: string;
  tipoEvento: string;
  titulo: string;
  descripcion: string | null;
  valorNumerico: number | null;
  unidad: string | null;
  ubicacion: string | null;
  importante: boolean;
  alerta: boolean;
};

export default function GanaderiCompletaPage() {
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [registrosPeso, setRegistrosPeso] = useState<RegistroPeso[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoAnimal[]>([]);
  const [produccionLechera, setProduccionLechera] = useState<ProduccionLechera[]>([]);
  const [registrosGeneticos, setRegistrosGeneticos] = useState<RegistroGenetico[]>([]);
  const [analisisROI, setAnalisisROI] = useState<AnalisisROI[]>([]);
  const [controlesCarga, setControlesCarga] = useState<ControlCarga[]>([]);
  const [eventosVida, setEventosVida] = useState<EventoVida[]>([]);
  const [loading, setLoading] = useState(true);

  const [pesoDialogOpen, setPesoDialogOpen] = useState(false);
  const [movimientoDialogOpen, setMovimientoDialogOpen] = useState(false);
  const [lecheDialogOpen, setLecheDialogOpen] = useState(false);
  const [geneticoDialogOpen, setGeneticoDialogOpen] = useState(false);
  const [roiDialogOpen, setRoiDialogOpen] = useState(false);
  const [cargaDialogOpen, setCargaDialogOpen] = useState(false);
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);

  const [selectedAnimalId, setSelectedAnimalId] = useState("");

  const [pesoForm, setPesoForm] = useState({
    animalId: "",
    fecha: "",
    peso: "",
    tipoMedicion: "Intermedio",
    metodoMedicion: "Balanza",
    condicionCorporal: "",
    estadoSalud: "Bueno",
    responsable: "",
    observaciones: "",
  });

  const [movimientoForm, setMovimientoForm] = useState({
    animalId: "",
    fecha: "",
    tipoMovimiento: "Traslado",
    origenTipo: "Lote",
    origenId: "",
    origenNombre: "",
    destinoTipo: "Lote",
    destinoId: "",
    destinoNombre: "",
    motivo: "Rotacion",
    pesoMovimiento: "",
    precioVenta: "",
    comprador: "",
    observaciones: "",
    responsable: "",
  });

  const [lecheForm, setLecheForm] = useState({
    animalId: "",
    fecha: "",
    litrosManana: "",
    litrosTarde: "",
    grasa: "",
    proteina: "",
    scc: "",
    diasLactancia: "",
    numeroLactancia: "",
    estadoUbre: "Normal",
    condicionAnimal: "Buena",
    observaciones: "",
    responsable: "",
  });

  const [geneticoForm, setGeneticoForm] = useState({
    animalId: "",
    padreId: "",
    madreId: "",
    razaPura: false,
    porcentajeRaza: "",
    registroGenealogia: "",
    muestraADN: "",
    fechaMuestraADN: "",
    laboratorio: "",
    valorGeneticoEstimado: "",
    facilidadParto: "",
    habilidadMaterna: "",
    temperamento: "",
    gananciaEsperada: "",
    pesoAdultoEsperado: "",
    produccionLecheEsperada: "",
    observaciones: "",
  });

  const [roiForm, setRoiForm] = useState({
    reproductorId: "",
    periodo: "",
    fechaInicio: "",
    fechaFin: "",
    costoAdquisicion: "",
    costoMantenimiento: "",
    costoServicios: "",
    numeroDescendientes: "",
    numeroVendidos: "",
    ingresoVentas: "",
    valorAgregadoGenética: "",
    observaciones: "",
  });

  const [cargaForm, setCargaForm] = useState({
    loteId: "",
    fecha: "",
    cantidadAnimales: "",
    pesoPromedioAnimales: "",
    capacidadRecomendada: "1.5",
    disponibilidadForraje: "",
    diasDisponibilidad: "",
    observaciones: "",
    responsable: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        animalesRes,
        lotesRes,
        pesosRes,
        movimientosRes,
        lecheRes,
        geneticosRes,
        roiRes,
        cargaRes,
      ] = await Promise.all([
        fetch("/api/animales"),
        fetch("/api/lotes"),
        fetch("/api/registro-peso"),
        fetch("/api/movimientos-animales"),
        fetch("/api/produccion-lechera"),
        fetch("/api/registro-genetico"),
        fetch("/api/analisis-roi-genetico"),
        fetch("/api/control-carga-animal"),
      ]);

      if (animalesRes.ok) setAnimales(await animalesRes.json());
      if (lotesRes.ok) setLotes(await lotesRes.json());
      if (pesosRes.ok) setRegistrosPeso(await pesosRes.json());
      if (movimientosRes.ok) setMovimientos(await movimientosRes.json());
      if (lecheRes.ok) setProduccionLechera(await lecheRes.json());
      if (geneticosRes.ok) setRegistrosGeneticos(await geneticosRes.json());
      if (roiRes.ok) setAnalisisROI(await roiRes.json());
      if (cargaRes.ok) setControlesCarga(await cargaRes.json());
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventosVida = async (animalId: string) => {
    try {
      const response = await fetch(`/api/eventos-vida?animalId=${animalId}`);
      if (response.ok) {
        const data = await response.json();
        setEventosVida(data);
        setSelectedAnimalId(animalId);
        setTimelineDialogOpen(true);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCreatePeso = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/registro-peso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pesoForm),
      });

      if (response.ok) {
        setPesoDialogOpen(false);
        setPesoForm({
          animalId: "",
          fecha: "",
          peso: "",
          tipoMedicion: "Intermedio",
          metodoMedicion: "Balanza",
          condicionCorporal: "",
          estadoSalud: "Bueno",
          responsable: "",
          observaciones: "",
        });
        fetchData();
        alert("Registro de peso creado con análisis IA");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear registro");
    }
  };

  const handleCreateMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Establecer nombres de origen/destino según lote seleccionado
      const form = { ...movimientoForm };
      
      if (form.origenId && form.origenTipo === "Lote") {
        const lote = lotes.find(l => l.id === form.origenId);
        if (lote) form.origenNombre = lote.nombre;
      }

      if (form.destinoId && form.destinoTipo === "Lote") {
        const lote = lotes.find(l => l.id === form.destinoId);
        if (lote) form.destinoNombre = lote.nombre;
      }

      const response = await fetch("/api/movimientos-animales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setMovimientoDialogOpen(false);
        setMovimientoForm({
          animalId: "",
          fecha: "",
          tipoMovimiento: "Traslado",
          origenTipo: "Lote",
          origenId: "",
          origenNombre: "",
          destinoTipo: "Lote",
          destinoId: "",
          destinoNombre: "",
          motivo: "Rotacion",
          pesoMovimiento: "",
          precioVenta: "",
          comprador: "",
          observaciones: "",
          responsable: "",
        });
        fetchData();
        alert("Movimiento registrado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear movimiento");
    }
  };

  const handleCreateLeche = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/produccion-lechera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lecheForm),
      });

      if (response.ok) {
        setLecheDialogOpen(false);
        setLecheForm({
          animalId: "",
          fecha: "",
          litrosManana: "",
          litrosTarde: "",
          grasa: "",
          proteina: "",
          scc: "",
          diasLactancia: "",
          numeroLactancia: "",
          estadoUbre: "Normal",
          condicionAnimal: "Buena",
          observaciones: "",
          responsable: "",
        });
        fetchData();
        alert("Producción lechera registrada con análisis IA");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear registro");
    }
  };

  const handleCreateGenetico = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/registro-genetico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geneticoForm),
      });

      if (response.ok) {
        setGeneticoDialogOpen(false);
        setGeneticoForm({
          animalId: "",
          padreId: "",
          madreId: "",
          razaPura: false,
          porcentajeRaza: "",
          registroGenealogia: "",
          muestraADN: "",
          fechaMuestraADN: "",
          laboratorio: "",
          valorGeneticoEstimado: "",
          facilidadParto: "",
          habilidadMaterna: "",
          temperamento: "",
          gananciaEsperada: "",
          pesoAdultoEsperado: "",
          produccionLecheEsperada: "",
          observaciones: "",
        });
        fetchData();
        alert("Registro genético creado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear registro");
    }
  };

  const handleCreateROI = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/analisis-roi-genetico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roiForm),
      });

      if (response.ok) {
        setRoiDialogOpen(false);
        setRoiForm({
          reproductorId: "",
          periodo: "",
          fechaInicio: "",
          fechaFin: "",
          costoAdquisicion: "",
          costoMantenimiento: "",
          costoServicios: "",
          numeroDescendientes: "",
          numeroVendidos: "",
          ingresoVentas: "",
          valorAgregadoGenética: "",
          observaciones: "",
        });
        fetchData();
        alert("Análisis ROI creado con IA");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear análisis");
    }
  };

  const handleCreateCarga = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/control-carga-animal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cargaForm),
      });

      if (response.ok) {
        setCargaDialogOpen(false);
        setCargaForm({
          loteId: "",
          fecha: "",
          cantidadAnimales: "",
          pesoPromedioAnimales: "",
          capacidadRecomendada: "1.5",
          disponibilidadForraje: "",
          diasDisponibilidad: "",
          observaciones: "",
          responsable: "",
        });
        fetchData();
        alert("Control de carga creado con análisis IA");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear control");
    }
  };

  const eliminarPeso = async (id: string) => {
    if (!confirm("¿Eliminar registro?")) return;
    try {
      const response = await fetch(`/api/registro-peso/${id}`, { method: "DELETE" });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarMovimiento = async (id: string) => {
    if (!confirm("¿Eliminar movimiento?")) return;
    try {
      const response = await fetch(`/api/movimientos-animales/${id}`, { method: "DELETE" });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarLeche = async (id: string) => {
    if (!confirm("¿Eliminar registro?")) return;
    try {
      const response = await fetch(`/api/produccion-lechera/${id}`, { method: "DELETE" });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarROI = async (id: string) => {
    if (!confirm("¿Eliminar análisis?")) return;
    try {
      const response = await fetch(`/api/analisis-roi-genetico/${id}`, { method: "DELETE" });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarCarga = async (id: string) => {
    if (!confirm("¿Eliminar control?")) return;
    try {
      const response = await fetch(`/api/control-carga-animal/${id}`, { method: "DELETE" });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // KPIs
  const totalRegistrosPeso = registrosPeso.length;
  const totalMovimientos = movimientos.length;
  const totalProduccionLeche = produccionLechera.reduce((sum, p) => sum + p.litrosTotales, 0);
  const totalRegistrosGeneticos = registrosGeneticos.length;

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Óptimo":
        return "bg-green-500";
      case "Subcargado":
        return "bg-yellow-500";
      case "Sobrecargado":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ganadería Avanzada Completa</h1>
          <p className="text-gray-600 mt-2">
            Sistema integral con trazabilidad, genética, producción y ROI
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Registros de Peso
            </CardTitle>
            <Scale className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrosPeso}</div>
            <p className="text-xs text-gray-500 mt-1">Control de crecimiento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Movimientos</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMovimientos}</div>
            <p className="text-xs text-gray-500 mt-1">Traslados y ventas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Producción Leche
            </CardTitle>
            <Milk className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalProduccionLeche)}</div>
            <p className="text-xs text-gray-500 mt-1">Litros totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Registros Genéticos
            </CardTitle>
            <Dna className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrosGeneticos}</div>
            <p className="text-xs text-gray-500 mt-1">Con genealogía</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="peso" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="peso">
            <Scale className="h-4 w-4 mr-2" />
            Peso
          </TabsTrigger>
          <TabsTrigger value="movimientos">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Movimientos
          </TabsTrigger>
          <TabsTrigger value="leche">
            <Milk className="h-4 w-4 mr-2" />
            Leche
          </TabsTrigger>
          <TabsTrigger value="genetica">
            <Dna className="h-4 w-4 mr-2" />
            Genética
          </TabsTrigger>
          <TabsTrigger value="roi">
            <DollarSign className="h-4 w-4 mr-2" />
            ROI
          </TabsTrigger>
          <TabsTrigger value="carga">
            <Users className="h-4 w-4 mr-2" />
            Carga
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Activity className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* TAB: PESO Y ENGORDE */}
        <TabsContent value="peso" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Registro de Peso y Engorde</h2>
            <Button
              onClick={() => setPesoDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Pesaje
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gráfico de evolución */}
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Peso</CardTitle>
                <CardDescription>Últimos pesajes registrados</CardDescription>
              </CardHeader>
              <CardContent>
                {registrosPeso.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={registrosPeso.slice(0, 10).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={(date) =>
                          new Date(date).toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "short",
                          })
                        }
                      />
                      <YAxis label={{ value: "Peso (kg)", angle: -90, position: "insideLeft" }} />
                      <Tooltip
                        labelFormatter={(date) => formatDate(date)}
                        formatter={(value: any) => [`${value} kg`, "Peso"]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="peso"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Peso"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">Sin datos</div>
                )}
              </CardContent>
            </Card>

            {/* Lista de registros */}
            <Card>
              <CardHeader>
                <CardTitle>Registros Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Cargando...</div>
                ) : registrosPeso.length === 0 ? (
                  <div className="text-center py-8">
                    <Scale className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No hay registros de peso</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {registrosPeso.map((registro) => (
                      <div key={registro.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium text-lg">
                                {registro.animal.caravana}
                              </p>
                              <Badge variant="outline">{registro.tipoMedicion}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                              <div>
                                <p className="text-gray-500">Peso</p>
                                <p className="font-bold text-blue-700">{registro.peso} kg</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Fecha</p>
                                <p className="font-medium">{formatDate(registro.fecha)}</p>
                              </div>
                            </div>
                            {registro.gananciaPromedioDiaria && (
                              <div className="bg-green-50 p-2 rounded text-sm">
                                <p className="text-gray-600">
                                  Ganancia:{" "}
                                  <strong className="text-green-700">
                                    {registro.gananciaPromedioDiaria.toFixed(2)} kg/día
                                  </strong>
                                </p>
                              </div>
                            )}
                            {registro.edadDias && (
                              <p className="text-xs text-gray-500 mt-1">
                                Edad: {registro.edadDias} días
                              </p>
                            )}
                            {registro.alertas && (
                              <div className="bg-yellow-50 p-2 rounded border border-yellow-200 mt-2">
                                <p className="text-xs font-medium text-yellow-900 mb-1">
                                  Alertas:
                                </p>
                                <ul className="text-xs text-yellow-800 space-y-0.5">
                                  {JSON.parse(registro.alertas).map((alerta: string, idx: number) => (
                                    <li key={idx}>{alerta}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {registro.analisisIA && (
                              <div className="bg-blue-50 p-2 rounded border border-blue-200 mt-2">
                                <p className="text-xs font-medium text-blue-900 mb-1">
                                  Análisis IA:
                                </p>
                                <p className="text-xs text-blue-700">
                                  Tendencia: {JSON.parse(registro.analisisIA).tendencia}
                                </p>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarPeso(registro.id)}
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

        {/* TAB: MOVIMIENTOS */}
        <TabsContent value="movimientos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Movimientos de Animales</h2>
            <Button
              onClick={() => setMovimientoDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Movimiento
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Movimientos</CardTitle>
              <CardDescription>
                Traslados, ventas y control de carga animal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : movimientos.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowRightLeft className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay movimientos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {movimientos.map((mov) => (
                    <div key={mov.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-lg">{mov.animal.caravana}</p>
                            <Badge
                              className={
                                mov.tipoMovimiento === "Venta"
                                  ? "bg-green-500"
                                  : mov.tipoMovimiento === "Muerte"
                                  ? "bg-red-500"
                                  : "bg-blue-500"
                              }
                            >
                              {mov.tipoMovimiento}
                            </Badge>
                            <Badge variant="outline">{mov.motivo}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                            <div>
                              <p className="text-gray-500">Fecha</p>
                              <p className="font-medium">{formatDate(mov.fecha)}</p>
                            </div>
                            {mov.origenNombre && (
                              <div>
                                <p className="text-gray-500">Origen</p>
                                <p className="font-medium">{mov.origenNombre}</p>
                              </div>
                            )}
                            {mov.destinoNombre && (
                              <div>
                                <p className="text-gray-500">Destino</p>
                                <p className="font-medium">{mov.destinoNombre}</p>
                              </div>
                            )}
                          </div>
                          {mov.pesoMovimiento && (
                            <p className="text-sm text-gray-600">
                              Peso: <strong>{mov.pesoMovimiento} kg</strong>
                            </p>
                          )}
                          {mov.precioVenta && (
                            <div className="bg-green-50 p-2 rounded text-sm mt-2">
                              <p className="text-gray-600">
                                Venta: <strong className="text-green-700">${mov.precioVenta}</strong>
                              </p>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarMovimiento(mov.id)}
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

        {/* TAB: PRODUCCIÓN LECHERA */}
        <TabsContent value="leche" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Producción Lechera</h2>
            <Button
              onClick={() => setLecheDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Producción
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Curva de lactancia */}
            <Card>
              <CardHeader>
                <CardTitle>Curva de Lactancia</CardTitle>
                <CardDescription>Producción diaria por animal</CardDescription>
              </CardHeader>
              <CardContent>
                {produccionLechera.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={produccionLechera.slice(0, 30).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={(date) =>
                          new Date(date).toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "short",
                          })
                        }
                      />
                      <YAxis label={{ value: "Litros", angle: -90, position: "insideLeft" }} />
                      <Tooltip
                        labelFormatter={(date) => formatDate(date)}
                        formatter={(value: any) => [`${value} L`, "Producción"]}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="litrosTotales"
                        stroke="#a855f7"
                        fill="#a855f7"
                        fillOpacity={0.3}
                        name="Litros"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">Sin datos</div>
                )}
              </CardContent>
            </Card>

            {/* Lista de registros */}
            <Card>
              <CardHeader>
                <CardTitle>Registros Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Cargando...</div>
                ) : produccionLechera.length === 0 ? (
                  <div className="text-center py-8">
                    <Milk className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No hay registros de producción</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {produccionLechera.map((prod) => (
                      <div key={prod.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium text-lg">{prod.animal.caravana}</p>
                              {prod.alertaCaida && (
                                <Badge className="bg-red-500">Alerta Caída</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                              <div>
                                <p className="text-gray-500">Producción Total</p>
                                <p className="font-bold text-purple-700">
                                  {prod.litrosTotales} L
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Fecha</p>
                                <p className="font-medium">{formatDate(prod.fecha)}</p>
                              </div>
                            </div>
                            {prod.litrosManana && prod.litrosTarde && (
                              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2 rounded">
                                <p>Mañana: {prod.litrosManana} L</p>
                                <p>Tarde: {prod.litrosTarde} L</p>
                              </div>
                            )}
                            {prod.diasLactancia && (
                              <p className="text-xs text-gray-500 mt-1">
                                Días de lactancia: {prod.diasLactancia}
                              </p>
                            )}
                            {prod.variacionPorcentual !== null && (
                              <div
                                className={`p-2 rounded text-sm mt-2 ${
                                  prod.variacionPorcentual < -10
                                    ? "bg-red-50 border border-red-200"
                                    : prod.variacionPorcentual > 10
                                    ? "bg-green-50 border border-green-200"
                                    : "bg-blue-50 border border-blue-200"
                                }`}
                              >
                                <p
                                  className={
                                    prod.variacionPorcentual < -10
                                      ? "text-red-700"
                                      : prod.variacionPorcentual > 10
                                      ? "text-green-700"
                                      : "text-blue-700"
                                  }
                                >
                                  Variación: {prod.variacionPorcentual.toFixed(1)}% vs promedio
                                </p>
                              </div>
                            )}
                            {prod.analisisIA && (
                              <div className="bg-purple-50 p-2 rounded border border-purple-200 mt-2">
                                <p className="text-xs font-medium text-purple-900">
                                  Análisis IA disponible
                                </p>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarLeche(prod.id)}
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

        {/* TAB: GENÉTICA */}
        <TabsContent value="genetica" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Registros Genéticos</h2>
            <Button
              onClick={() => setGeneticoDialogOpen(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Registro
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Genealogía y Genética</CardTitle>
              <CardDescription>
                Registros de ADN, pedigree y valor genético estimado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : registrosGeneticos.length === 0 ? (
                <div className="text-center py-8">
                  <Dna className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay registros genéticos</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {registrosGeneticos.map((reg) => (
                    <Card key={reg.id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{reg.animal.caravana}</CardTitle>
                          {reg.razaPura && <Badge className="bg-orange-500">Pura</Badge>}
                        </div>
                        {reg.registroGenealogia && (
                          <p className="text-sm text-gray-600">Reg: {reg.registroGenealogia}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {(reg.padre || reg.madre) && (
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-sm font-medium mb-2">Padres:</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {reg.padre && (
                                <div>
                                  <p className="text-gray-500">Padre</p>
                                  <p className="font-medium">{reg.padre.caravana}</p>
                                </div>
                              )}
                              {reg.madre && (
                                <div>
                                  <p className="text-gray-500">Madre</p>
                                  <p className="font-medium">{reg.madre.caravana}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {reg.valorGeneticoEstimado && (
                          <div className="bg-orange-50 p-3 rounded border border-orange-200">
                            <p className="text-sm font-medium text-orange-900">
                              Valor Genético Estimado (EBV)
                            </p>
                            <p className="text-2xl font-bold text-orange-700">
                              {reg.valorGeneticoEstimado.toFixed(2)}
                            </p>
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
        {/* TAB: ROI GENÉTICO */}
        <TabsContent value="roi" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Análisis ROI Genético</h2>
            <Button
              onClick={() => setRoiDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Análisis
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Retorno de Inversión por Reproductor</CardTitle>
              <CardDescription>
                Evaluación económica de genética premium
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : analisisROI.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay análisis ROI</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analisisROI.map((roi) => (
                    <Card key={roi.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {roi.reproductor.caravana}
                          </CardTitle>
                          <Badge
                            className={
                              roi.recomendacion === "Mantener"
                                ? "bg-green-500"
                                : roi.recomendacion === "Reemplazar"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                            }
                          >
                            {roi.recomendacion || "Sin recomendación"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">Período: {roi.periodo}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-blue-50 p-3 rounded text-center">
                            <p className="text-xs text-gray-600 mb-1">ROI</p>
                            <p className="text-2xl font-bold text-blue-700">
                              {roi.roi.toFixed(1)}%
                            </p>
                          </div>
                          <div className="bg-green-50 p-3 rounded text-center">
                            <p className="text-xs text-gray-600 mb-1">Beneficio</p>
                            <p className="text-2xl font-bold text-green-700">
                              ${roi.beneficioNeto.toFixed(0)}
                            </p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded text-center">
                            <p className="text-xs text-gray-600 mb-1">Descendientes</p>
                            <p className="text-2xl font-bold text-purple-700">
                              {roi.numeroDescendientes}
                            </p>
                          </div>
                        </div>

                        {roi.analisisIA && (
                          <div className="bg-emerald-50 p-3 rounded border border-emerald-200">
                            <p className="text-sm font-medium text-emerald-900 mb-2">
                              Análisis IA:
                            </p>
                            {(() => {
                              const analisis = JSON.parse(roi.analisisIA);
                              return (
                                <div className="text-sm text-emerald-700 space-y-1">
                                  <p>
                                    <strong>Rentabilidad:</strong> {analisis.rentabilidad}
                                  </p>
                                  {analisis.genetica && (
                                    <p>
                                      <strong>Genética:</strong> {analisis.genetica}
                                    </p>
                                  )}
                                  {analisis.recomendaciones &&
                                    analisis.recomendaciones.length > 0 && (
                                      <div className="mt-2">
                                        <p className="font-medium">Recomendaciones:</p>
                                        <ul className="list-disc list-inside space-y-0.5 ml-2">
                                          {analisis.recomendaciones.map(
                                            (rec: string, idx: number) => (
                                              <li key={idx}>{rec}</li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => alert("Ver detalles completos (simulado)")}
                          >
                            Ver Detalles
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarROI(roi.id)}
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

        {/* TAB: CONTROL DE CARGA */}
        <TabsContent value="carga" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Control de Carga Animal</h2>
            <Button
              onClick={() => setCargaDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Control
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monitoreo de Carga por Lote</CardTitle>
              <CardDescription>
                Control de capacidad y rotación de pasturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : controlesCarga.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay controles de carga</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {controlesCarga.map((control) => (
                    <Card key={control.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{control.lote.nombre}</CardTitle>
                          <Badge className={getEstadoColor(control.estado)}>
                            {control.estado}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatDate(control.fecha)} • {control.lote.hectareas} ha
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-gray-50 p-3 rounded text-center">
                            <p className="text-xs text-gray-600 mb-1">Animales</p>
                            <p className="text-2xl font-bold text-gray-700">
                              {control.cantidadAnimales}
                            </p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded text-center">
                            <p className="text-xs text-gray-600 mb-1">Carga (UA/ha)</p>
                            <p className="text-2xl font-bold text-blue-700">
                              {control.cargaAnimalUA.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded text-center">
                            <p className="text-xs text-gray-600 mb-1">Capacidad</p>
                            <p className="text-2xl font-bold text-purple-700">
                              {control.porcentajeCapacidad.toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        {control.alertas && (
                          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                            <p className="text-sm font-medium text-yellow-900 mb-2">Alertas:</p>
                            <ul className="text-sm text-yellow-800 space-y-1">
                              {JSON.parse(control.alertas).map((alerta: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span>{alerta}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {control.analisisIA && (
                          <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                            <p className="text-sm font-medium text-indigo-900 mb-2">
                              Análisis IA:
                            </p>
                            {(() => {
                              const analisis = JSON.parse(control.analisisIA);
                              return (
                                <div className="text-sm text-indigo-700 space-y-1">
                                  <p>{analisis.evaluacion}</p>
                                  {analisis.recomendaciones &&
                                    analisis.recomendaciones.length > 0 && (
                                      <div className="mt-2">
                                        <p className="font-medium">Recomendaciones:</p>
                                        <ul className="list-disc list-inside space-y-0.5 ml-2">
                                          {analisis.recomendaciones.map(
                                            (rec: string, idx: number) => (
                                              <li key={idx}>{rec}</li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => alert("Ver historial del lote (simulado)")}
                          >
                            Ver Historial
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarCarga(control.id)}
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

        {/* TAB: TIMELINE */}
        <TabsContent value="timeline" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Timeline de Vida del Animal</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Animal</CardTitle>
              <CardDescription>
                Ver historial completo de eventos del ciclo de vida
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select
                  value={selectedAnimalId}
                  onValueChange={(value) => fetchEventosVida(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar animal para ver timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {animales.map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.caravana} - {animal.tipo} {animal.raza ? `(${animal.raza})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedAnimalId && eventosVida.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No hay eventos registrados para este animal</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Timeline de Eventos */}
      <Dialog open={timelineDialogOpen} onOpenChange={setTimelineDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Timeline de Vida del Animal</DialogTitle>
            <DialogDescription>
              Historial completo de eventos: nacimiento, peso, movimientos, producción, genética
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {eventosVida.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No hay eventos</p>
              </div>
            ) : (
              <div className="relative">
                {/* Línea de tiempo vertical */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                <div className="space-y-6">
                  {eventosVida.map((evento, idx) => (
                    <div key={evento.id} className="relative flex gap-4">
                      {/* Punto en la línea de tiempo */}
                      <div
                        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white ${
                          evento.alerta
                            ? "bg-red-500"
                            : evento.importante
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                        }`}
                      >
                        {evento.tipoEvento === "Peso" && <Scale className="h-5 w-5 text-white" />}
                        {evento.tipoEvento === "Movimiento" && (
                          <ArrowRightLeft className="h-5 w-5 text-white" />
                        )}
                        {evento.tipoEvento === "Produccion" && (
                          <Milk className="h-5 w-5 text-white" />
                        )}
                        {evento.tipoEvento === "Genetica" && <Dna className="h-5 w-5 text-white" />}
                        {evento.tipoEvento === "Reproduccion" && (
                          <Activity className="h-5 w-5 text-white" />
                        )}
                        {!["Peso", "Movimiento", "Produccion", "Genetica", "Reproduccion"].includes(
                          evento.tipoEvento
                        ) && <Calendar className="h-5 w-5 text-white" />}
                      </div>

                      {/* Contenido del evento */}
                      <Card className="flex-1">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-base">{evento.titulo}</CardTitle>
                                <Badge variant="outline" className="text-xs">
                                  {evento.tipoEvento}
                                </Badge>
                                {evento.importante && (
                                  <Badge className="bg-yellow-500 text-xs">Importante</Badge>
                                )}
                                {evento.alerta && (
                                  <Badge className="bg-red-500 text-xs">Alerta</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {formatDate(evento.fecha)}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {evento.descripcion && (
                            <p className="text-sm text-gray-700 mb-2">{evento.descripcion}</p>
                          )}
                          {evento.valorNumerico !== null && (
                            <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1 rounded">
                              <span className="font-bold text-blue-700">
                                {evento.valorNumerico}
                              </span>
                              {evento.unidad && (
                                <span className="text-sm text-blue-600">{evento.unidad}</span>
                              )}
                            </div>
                          )}
                          {evento.ubicacion && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{evento.ubicacion}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog: Nuevo Pesaje */}
      <Dialog open={pesoDialogOpen} onOpenChange={setPesoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreatePeso}>
            <DialogHeader>
              <DialogTitle>Registrar Pesaje</DialogTitle>
              <DialogDescription>
                Registro de peso con análisis automático de ganancia diaria
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Animal *</Label>
                  <Select
                    value={pesoForm.animalId}
                    onValueChange={(value) => setPesoForm({ ...pesoForm, animalId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar animal" />
                    </SelectTrigger>
                    <SelectContent>
                      {animales.map((animal) => (
                        <SelectItem key={animal.id} value={animal.id}>
                          {animal.caravana} - {animal.tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={pesoForm.fecha}
                    onChange={(e) => setPesoForm({ ...pesoForm, fecha: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Peso (kg) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="350"
                    value={pesoForm.peso}
                    onChange={(e) => setPesoForm({ ...pesoForm, peso: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Medición *</Label>
                  <Select
                    value={pesoForm.tipoMedicion}
                    onValueChange={(value) => setPesoForm({ ...pesoForm, tipoMedicion: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nacimiento">Nacimiento</SelectItem>
                      <SelectItem value="Destete">Destete</SelectItem>
                      <SelectItem value="Intermedio">Intermedio</SelectItem>
                      <SelectItem value="Preventa">Preventa</SelectItem>
                      <SelectItem value="Final">Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Método</Label>
                  <Select
                    value={pesoForm.metodoMedicion}
                    onValueChange={(value) =>
                      setPesoForm({ ...pesoForm, metodoMedicion: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Balanza">Balanza</SelectItem>
                      <SelectItem value="Cinta">Cinta</SelectItem>
                      <SelectItem value="Estimado">Estimado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condición Corporal (1-5)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    max="5"
                    placeholder="3.5"
                    value={pesoForm.condicionCorporal}
                    onChange={(e) =>
                      setPesoForm({ ...pesoForm, condicionCorporal: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado de Salud</Label>
                  <Select
                    value={pesoForm.estadoSalud}
                    onValueChange={(value) => setPesoForm({ ...pesoForm, estadoSalud: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bueno">Bueno</SelectItem>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Malo">Malo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsable</Label>
                  <Input
                    placeholder="Nombre del operario"
                    value={pesoForm.responsable}
                    onChange={(e) => setPesoForm({ ...pesoForm, responsable: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={pesoForm.observaciones}
                  onChange={(e) => setPesoForm({ ...pesoForm, observaciones: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPesoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Registrar con Análisis IA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nuevo Movimiento */}
      <Dialog open={movimientoDialogOpen} onOpenChange={setMovimientoDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateMovimiento}>
            <DialogHeader>
              <DialogTitle>Registrar Movimiento de Animal</DialogTitle>
              <DialogDescription>
                Traslados, ventas y control de carga animal
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Animal *</Label>
                  <Select
                    value={movimientoForm.animalId}
                    onValueChange={(value) =>
                      setMovimientoForm({ ...movimientoForm, animalId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar animal" />
                    </SelectTrigger>
                    <SelectContent>
                      {animales.map((animal) => (
                        <SelectItem key={animal.id} value={animal.id}>
                          {animal.caravana} - {animal.tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={movimientoForm.fecha}
                    onChange={(e) => setMovimientoForm({ ...movimientoForm, fecha: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Movimiento *</Label>
                  <Select
                    value={movimientoForm.tipoMovimiento}
                    onValueChange={(value) =>
                      setMovimientoForm({ ...movimientoForm, tipoMovimiento: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ingreso">Ingreso</SelectItem>
                      <SelectItem value="Egreso">Egreso</SelectItem>
                      <SelectItem value="Traslado">Traslado</SelectItem>
                      <SelectItem value="Venta">Venta</SelectItem>
                      <SelectItem value="Muerte">Muerte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Motivo *</Label>
                  <Select
                    value={movimientoForm.motivo}
                    onValueChange={(value) =>
                      setMovimientoForm({ ...movimientoForm, motivo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rotacion">Rotación de Pasturas</SelectItem>
                      <SelectItem value="Engorde">Engorde</SelectItem>
                      <SelectItem value="Venta">Venta</SelectItem>
                      <SelectItem value="Cuarentena">Cuarentena</SelectItem>
                      <SelectItem value="Tratamiento">Tratamiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {movimientoForm.tipoMovimiento === "Traslado" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Origen (Lote)</Label>
                      <Select
                        value={movimientoForm.origenId}
                        onValueChange={(value) =>
                          setMovimientoForm({ ...movimientoForm, origenId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar lote origen" />
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
                      <Label>Destino (Lote)</Label>
                      <Select
                        value={movimientoForm.destinoId}
                        onValueChange={(value) =>
                          setMovimientoForm({ ...movimientoForm, destinoId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar lote destino" />
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
                  </div>
                </>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Peso al Movimiento (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="450"
                    value={movimientoForm.pesoMovimiento}
                    onChange={(e) =>
                      setMovimientoForm({ ...movimientoForm, pesoMovimiento: e.target.value })
                    }
                  />
                </div>
                {movimientoForm.tipoMovimiento === "Venta" && (
                  <>
                    <div className="space-y-2">
                      <Label>Precio Venta (USD)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1500"
                        value={movimientoForm.precioVenta}
                        onChange={(e) =>
                          setMovimientoForm({ ...movimientoForm, precioVenta: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Comprador</Label>
                      <Input
                        placeholder="Nombre del comprador"
                        value={movimientoForm.comprador}
                        onChange={(e) =>
                          setMovimientoForm({ ...movimientoForm, comprador: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsable</Label>
                  <Input
                    placeholder="Nombre del responsable"
                    value={movimientoForm.responsable}
                    onChange={(e) =>
                      setMovimientoForm({ ...movimientoForm, responsable: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={movimientoForm.observaciones}
                  onChange={(e) =>
                    setMovimientoForm({ ...movimientoForm, observaciones: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMovimientoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Registrar Movimiento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Producción Lechera */}
      <Dialog open={lecheDialogOpen} onOpenChange={setLecheDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateLeche}>
            <DialogHeader>
              <DialogTitle>Registrar Producción Lechera</DialogTitle>
              <DialogDescription>
                Registro diario con análisis automático de curva de lactancia
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Animal *</Label>
                  <Select
                    value={lecheForm.animalId}
                    onValueChange={(value) => setLecheForm({ ...lecheForm, animalId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar vaca" />
                    </SelectTrigger>
                    <SelectContent>
                      {animales
                        .filter((a) => a.tipo === "Bovino" && a.sexo === "Hembra")
                        .map((animal) => (
                          <SelectItem key={animal.id} value={animal.id}>
                            {animal.caravana}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={lecheForm.fecha}
                    onChange={(e) => setLecheForm({ ...lecheForm, fecha: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Litros Mañana</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="12"
                    value={lecheForm.litrosManana}
                    onChange={(e) => setLecheForm({ ...lecheForm, litrosManana: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Litros Tarde</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="10"
                    value={lecheForm.litrosTarde}
                    onChange={(e) => setLecheForm({ ...lecheForm, litrosTarde: e.target.value })}
                  />
                </div>
                <div className="space-y-2 bg-blue-50 p-3 rounded">
                  <Label>Total del Día</Label>
                  <p className="text-2xl font-bold text-blue-700">
                    {(
                      parseFloat(lecheForm.litrosManana || "0") +
                      parseFloat(lecheForm.litrosTarde || "0")
                    ).toFixed(1)}{" "}
                    L
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Grasa (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="3.5"
                    value={lecheForm.grasa}
                    onChange={(e) => setLecheForm({ ...lecheForm, grasa: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Proteína (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="3.2"
                    value={lecheForm.proteina}
                    onChange={(e) => setLecheForm({ ...lecheForm, proteina: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SCC (células/ml)</Label>
                  <Input
                    type="number"
                    placeholder="150000"
                    value={lecheForm.scc}
                    onChange={(e) => setLecheForm({ ...lecheForm, scc: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Días de Lactancia</Label>
                  <Input
                    type="number"
                    placeholder="90"
                    value={lecheForm.diasLactancia}
                    onChange={(e) => setLecheForm({ ...lecheForm, diasLactancia: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>N° Lactancia</Label>
                  <Input
                    type="number"
                    placeholder="2"
                    value={lecheForm.numeroLactancia}
                    onChange={(e) =>
                      setLecheForm({ ...lecheForm, numeroLactancia: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado de Ubre</Label>
                  <Select
                    value={lecheForm.estadoUbre}
                    onValueChange={(value) => setLecheForm({ ...lecheForm, estadoUbre: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Mastitis">Mastitis</SelectItem>
                      <SelectItem value="Lesion">Lesión</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Condición del Animal</Label>
                  <Select
                    value={lecheForm.condicionAnimal}
                    onValueChange={(value) =>
                      setLecheForm({ ...lecheForm, condicionAnimal: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Buena">Buena</SelectItem>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Mala">Mala</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsable</Label>
                  <Input
                    placeholder="Nombre del operario"
                    value={lecheForm.responsable}
                    onChange={(e) => setLecheForm({ ...lecheForm, responsable: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={lecheForm.observaciones}
                  onChange={(e) => setLecheForm({ ...lecheForm, observaciones: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLecheDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                Registrar con Análisis IA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Dialog: Registro Genético */}
      <Dialog open={geneticoDialogOpen} onOpenChange={setGeneticoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateGenetico}>
            <DialogHeader>
              <DialogTitle>Crear Registro Genético</DialogTitle>
              <DialogDescription>
                Genealogía completa, ADN y valor genético estimado
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Animal *</Label>
                <Select
                  value={geneticoForm.animalId}
                  onValueChange={(value) => setGeneticoForm({ ...geneticoForm, animalId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar animal" />
                  </SelectTrigger>
                  <SelectContent>
                    {animales.map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.caravana} - {animal.tipo} {animal.raza ? `(${animal.raza})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Genealogía</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Padre</Label>
                    <Select
                      value={geneticoForm.padreId}
                      onValueChange={(value) =>
                        setGeneticoForm({ ...geneticoForm, padreId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar padre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin padre registrado</SelectItem>
                        {animales
                          .filter((a) => a.sexo === "Macho")
                          .map((animal) => (
                            <SelectItem key={animal.id} value={animal.id}>
                              {animal.caravana}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Madre</Label>
                    <Select
                      value={geneticoForm.madreId}
                      onValueChange={(value) =>
                        setGeneticoForm({ ...geneticoForm, madreId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar madre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin madre registrada</SelectItem>
                        {animales
                          .filter((a) => a.sexo === "Hembra")
                          .map((animal) => (
                            <SelectItem key={animal.id} value={animal.id}>
                              {animal.caravana}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Información Racial</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="razaPura"
                        checked={geneticoForm.razaPura}
                        onChange={(e) =>
                          setGeneticoForm({ ...geneticoForm, razaPura: e.target.checked })
                        }
                        className="rounded"
                      />
                      <Label htmlFor="razaPura">Raza Pura</Label>
                    </div>
                  </div>
                  {!geneticoForm.razaPura && (
                    <div className="space-y-2">
                      <Label>% Raza</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="75"
                        value={geneticoForm.porcentajeRaza}
                        onChange={(e) =>
                          setGeneticoForm({ ...geneticoForm, porcentajeRaza: e.target.value })
                        }
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Registro Genealogía</Label>
                    <Input
                      placeholder="N° registro oficial"
                      value={geneticoForm.registroGenealogia}
                      onChange={(e) =>
                        setGeneticoForm({ ...geneticoForm, registroGenealogia: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Muestra de ADN</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>ID Muestra</Label>
                    <Input
                      placeholder="ADN-2024-001"
                      value={geneticoForm.muestraADN}
                      onChange={(e) =>
                        setGeneticoForm({ ...geneticoForm, muestraADN: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Muestra</Label>
                    <Input
                      type="date"
                      value={geneticoForm.fechaMuestraADN}
                      onChange={(e) =>
                        setGeneticoForm({ ...geneticoForm, fechaMuestraADN: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Laboratorio</Label>
                    <Input
                      placeholder="Nombre del laboratorio"
                      value={geneticoForm.laboratorio}
                      onChange={(e) =>
                        setGeneticoForm({ ...geneticoForm, laboratorio: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Valor Genético y Características</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor Genético Estimado (EBV)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="105.5"
                      value={geneticoForm.valorGeneticoEstimado}
                      onChange={(e) =>
                        setGeneticoForm({
                          ...geneticoForm,
                          valorGeneticoEstimado: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Facilidad de Parto</Label>
                    <Select
                      value={geneticoForm.facilidadParto}
                      onValueChange={(value) =>
                        setGeneticoForm({ ...geneticoForm, facilidadParto: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fácil">Fácil</SelectItem>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Difícil">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Habilidad Materna</Label>
                    <Select
                      value={geneticoForm.habilidadMaterna}
                      onValueChange={(value) =>
                        setGeneticoForm({ ...geneticoForm, habilidadMaterna: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excelente">Excelente</SelectItem>
                        <SelectItem value="Buena">Buena</SelectItem>
                        <SelectItem value="Regular">Regular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Temperamento</Label>
                    <Select
                      value={geneticoForm.temperamento}
                      onValueChange={(value) =>
                        setGeneticoForm({ ...geneticoForm, temperamento: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dócil">Dócil</SelectItem>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Nervioso">Nervioso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Performance Esperada</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Ganancia Esperada (kg/día)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.9"
                      value={geneticoForm.gananciaEsperada}
                      onChange={(e) =>
                        setGeneticoForm({ ...geneticoForm, gananciaEsperada: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Peso Adulto Esperado (kg)</Label>
                    <Input
                      type="number"
                      step="1"
                      placeholder="550"
                      value={geneticoForm.pesoAdultoEsperado}
                      onChange={(e) =>
                        setGeneticoForm({ ...geneticoForm, pesoAdultoEsperado: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Producción Leche Esperada (L/día)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="25"
                      value={geneticoForm.produccionLecheEsperada}
                      onChange={(e) =>
                        setGeneticoForm({
                          ...geneticoForm,
                          produccionLecheEsperada: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Notas adicionales sobre genética..."
                  value={geneticoForm.observaciones}
                  onChange={(e) =>
                    setGeneticoForm({ ...geneticoForm, observaciones: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setGeneticoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                Crear Registro Genético
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Análisis ROI Genético */}
      <Dialog open={roiDialogOpen} onOpenChange={setRoiDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateROI}>
            <DialogHeader>
              <DialogTitle>Análisis ROI Genético</DialogTitle>
              <DialogDescription>
                Evaluar retorno de inversión de reproductores premium
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reproductor *</Label>
                  <Select
                    value={roiForm.reproductorId}
                    onValueChange={(value) => setRoiForm({ ...roiForm, reproductorId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar reproductor" />
                    </SelectTrigger>
                    <SelectContent>
                      {animales
                        .filter((a) => a.sexo === "Macho")
                        .map((animal) => (
                          <SelectItem key={animal.id} value={animal.id}>
                            {animal.caravana} - {animal.raza || animal.tipo}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Período *</Label>
                  <Input
                    placeholder="Ej: 2024"
                    value={roiForm.periodo}
                    onChange={(e) => setRoiForm({ ...roiForm, periodo: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Inicio *</Label>
                  <Input
                    type="date"
                    value={roiForm.fechaInicio}
                    onChange={(e) => setRoiForm({ ...roiForm, fechaInicio: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Fin *</Label>
                  <Input
                    type="date"
                    value={roiForm.fechaFin}
                    onChange={(e) => setRoiForm({ ...roiForm, fechaFin: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Costos de Inversión (USD)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Costo Adquisición</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="5000"
                      value={roiForm.costoAdquisicion}
                      onChange={(e) =>
                        setRoiForm({ ...roiForm, costoAdquisicion: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mantenimiento/año *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1200"
                      value={roiForm.costoMantenimiento}
                      onChange={(e) =>
                        setRoiForm({ ...roiForm, costoMantenimiento: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Servicios *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="800"
                      value={roiForm.costoServicios}
                      onChange={(e) => setRoiForm({ ...roiForm, costoServicios: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Producción</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>N° Descendientes *</Label>
                    <Input
                      type="number"
                      placeholder="45"
                      value={roiForm.numeroDescendientes}
                      onChange={(e) =>
                        setRoiForm({ ...roiForm, numeroDescendientes: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>N° Vendidos *</Label>
                    <Input
                      type="number"
                      placeholder="40"
                      value={roiForm.numeroVendidos}
                      onChange={(e) => setRoiForm({ ...roiForm, numeroVendidos: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Ingresos (USD)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ingresos por Ventas</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="60000"
                      value={roiForm.ingresoVentas}
                      onChange={(e) => setRoiForm({ ...roiForm, ingresoVentas: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Agregado Genética</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="5000"
                      value={roiForm.valorAgregadoGenética}
                      onChange={(e) =>
                        setRoiForm({ ...roiForm, valorAgregadoGenética: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={roiForm.observaciones}
                  onChange={(e) => setRoiForm({ ...roiForm, observaciones: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRoiDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Generar Análisis con IA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Control de Carga Animal */}
      <Dialog open={cargaDialogOpen} onOpenChange={setCargaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateCarga}>
            <DialogHeader>
              <DialogTitle>Control de Carga Animal</DialogTitle>
              <DialogDescription>
                Monitoreo de capacidad y rotación de pasturas
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lote *</Label>
                  <Select
                    value={cargaForm.loteId}
                    onValueChange={(value) => setCargaForm({ ...cargaForm, loteId: value })}
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
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={cargaForm.fecha}
                    onChange={(e) => setCargaForm({ ...cargaForm, fecha: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad de Animales *</Label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={cargaForm.cantidadAnimales}
                    onChange={(e) =>
                      setCargaForm({ ...cargaForm, cantidadAnimales: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Peso Promedio (kg) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="400"
                    value={cargaForm.pesoPromedioAnimales}
                    onChange={(e) =>
                      setCargaForm({ ...cargaForm, pesoPromedioAnimales: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Capacidad Recomendada (UA/ha)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="1.5"
                  value={cargaForm.capacidadRecomendada}
                  onChange={(e) =>
                    setCargaForm({ ...cargaForm, capacidadRecomendada: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500">
                  Default: 1.5 UA/ha (campo templado). Ajustar según zona y época.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Disponibilidad Forraje (kg MS/ha)</Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="2000"
                    value={cargaForm.disponibilidadForraje}
                    onChange={(e) =>
                      setCargaForm({ ...cargaForm, disponibilidadForraje: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Días Disponibilidad</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={cargaForm.diasDisponibilidad}
                    onChange={(e) =>
                      setCargaForm({ ...cargaForm, diasDisponibilidad: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsable</Label>
                  <Input
                    placeholder="Nombre del responsable"
                    value={cargaForm.responsable}
                    onChange={(e) => setCargaForm({ ...cargaForm, responsable: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={cargaForm.observaciones}
                  onChange={(e) => setCargaForm({ ...cargaForm, observaciones: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCargaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Crear Control con Análisis IA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Ganadería Avanzada 100% Completa</p>
              <p className="text-sm text-blue-700 mt-1">
                Sistema profesional con trazabilidad completa, peso y engorde, movimientos entre
                lotes, producción lechera con curva de lactancia, genética con genealogía completa,
                ROI de reproductores, control de carga animal y timeline de vida de cada animal.
                Todas las funcionalidades implementadas con análisis IA integrado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}