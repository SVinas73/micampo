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
  Activity,
  Beef,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Heart,
  Pill,
  Apple,
  BarChart3,
  Calendar,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

type DiagnosticoSalud = {
  id: string;
  fecha: string;
  animal: { caravana: string; tipo: string };
  motivoConsulta: string;
  diagnostico: string;
  riesgo: string;
  recomendacionIA: string;
};

type PlanNutricional = {
  id: string;
  nombre: string;
  categoriaAnimal: string;
  energiaDiaria: number;
  proteinaDiaria: number;
  estado: string;
  generadoPorIA: boolean;
  costoTotal: number | null;
  animal?: { caravana: string };
  tipo: string;
};

type AlertaSanitaria = {
  id: string;
  tipo: string;
  severidad: string;
  titulo: string;
  descripcion: string;
  estado: string;
  numeroAfectados: number;
  accionRequerida: string;
  createdAt: string;
};

type AnalisisReproductivo = {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  totalHembras: number;
  tasaServicio: number;
  tasaPreniez: number;
  tasaNatalidad: number;
  intervaloPartos: number | null;
  recomendacionIA: string;
};

function GanaderiaAvanzadaPage() {
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoSalud[]>([]);
  const [planesNutricionales, setPlanesNutricionales] = useState<PlanNutricional[]>([]);
  const [alertasSanitarias, setAlertasSanitarias] = useState<AlertaSanitaria[]>([]);
  const [analisisReproductivos, setAnalisisReproductivos] = useState<AnalisisReproductivo[]>([]);
  const [animales, setAnimales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [diagnosticoDialogOpen, setDiagnosticoDialogOpen] = useState(false);
  const [nutricionDialogOpen, setNutricionDialogOpen] = useState(false);
  const [analisisNutricionDialogOpen, setAnalisisNutricionDialogOpen] = useState(false);
  const [analisisReproductivoDialogOpen, setAnalisisReproductivoDialogOpen] = useState(false);
  const [alertaDialogOpen, setAlertaDialogOpen] = useState(false);

  const [diagnosticoForm, setDiagnosticoForm] = useState({
    animalId: "",
    veterinario: "",
    motivoConsulta: "Chequeo rutinario",
    temperatura: "",
    frecuenciaCardiaca: "",
    condicionCorporal: "",
    diagnostico: "",
    tratamiento: "",
    proximaRevision: "",
    costoConsulta: "",
  });

  const [nutricionForm, setNutricionForm] = useState({
    animalId: "",
    nombre: "",
    tipo: "Individual",
    categoriaAnimal: "Novillo",
    pesoActual: "",
    pesoObjetivo: "",
    gananciaEsperada: "",
    produccionLeche: "",
    energiaDiaria: "",
    proteinaDiaria: "",
    fibraDiaria: "",
    composicionDieta: [],
    costoTotal: "",
    fechaInicio: new Date().toISOString().split("T")[0],
  });

  const [analisisNutricionForm, setAnalisisNutricionForm] = useState({
    categoriaAnimal: "Novillo",
    pesoActual: "",
    pesoObjetivo: "",
    gananciaEsperada: "",
    produccionLeche: "",
    etapaProductiva: "Crecimiento",
  });

  const [analisisReproductivoForm, setAnalisisReproductivoForm] = useState({
    fechaInicio: new Date(new Date().setMonth(new Date().getMonth() - 12))
      .toISOString()
      .split("T")[0],
    fechaFin: new Date().toISOString().split("T")[0],
  });

  const [alertaForm, setAlertaForm] = useState({
    tipo: "Vacunación",
    severidad: "Media",
    titulo: "",
    descripcion: "",
    animalId: "",
    categoria: "",
    numeroAfectados: "1",
    accionRequerida: "",
    fechaLimite: "",
  });

  const [resultadoNutricion, setResultadoNutricion] = useState<any>(null);
  const [analizandoNutricion, setAnalizandoNutricion] = useState(false);
  const [generandoAnalisisRepro, setGenerandoAnalisisRepro] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [diagRes, nutRes, alertRes, analRes, animRes] = await Promise.all([
        fetch("/api/diagnosticos-salud"),
        fetch("/api/planes-nutricionales"),
        fetch("/api/alertas-sanitarias"),
        fetch("/api/analisis-reproductivo"),
        fetch("/api/animales"),
      ]);

      if (diagRes.ok) {
        const data = await diagRes.json();
        setDiagnosticos(data);
      }

      if (nutRes.ok) {
        const data = await nutRes.json();
        setPlanesNutricionales(data);
      }

      if (alertRes.ok) {
        const data = await alertRes.json();
        setAlertasSanitarias(data);
      }

      if (analRes.ok) {
        const data = await analRes.json();
        setAnalisisReproductivos(data);
      }

      if (animRes.ok) {
        const data = await animRes.json();
        setAnimales(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiagnostico = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/diagnosticos-salud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(diagnosticoForm),
      });

      if (response.ok) {
        setDiagnosticoDialogOpen(false);
        setDiagnosticoForm({
          animalId: "",
          veterinario: "",
          motivoConsulta: "Chequeo rutinario",
          temperatura: "",
          frecuenciaCardiaca: "",
          condicionCorporal: "",
          diagnostico: "",
          tratamiento: "",
          proximaRevision: "",
          costoConsulta: "",
        });
        fetchData();
        alert("Diagnóstico guardado con análisis IA");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar diagnóstico");
    }
  };

  const analizarNutricionIA = async () => {
    if (!analisisNutricionForm.categoriaAnimal || !analisisNutricionForm.pesoActual) {
      alert("Completá categoría y peso actual");
      return;
    }

    try {
      setAnalizandoNutricion(true);
      const response = await fetch("/api/nutricion-ia/analizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analisisNutricionForm),
      });

      if (response.ok) {
        const data = await response.json();
        setResultadoNutricion(data);

        setNutricionForm({
          ...nutricionForm,
          categoriaAnimal: analisisNutricionForm.categoriaAnimal,
          pesoActual: analisisNutricionForm.pesoActual,
          pesoObjetivo: analisisNutricionForm.pesoObjetivo,
          gananciaEsperada: analisisNutricionForm.gananciaEsperada,
          produccionLeche: analisisNutricionForm.produccionLeche,
          energiaDiaria: data.energiaDiaria.toString(),
          proteinaDiaria: data.proteinaDiaria.toString(),
          fibraDiaria: data.fibraDiaria.toString(),
          composicionDieta: data.dietaSugerida,
          costoTotal: data.costoTotal.toString(),
        });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al analizar");
    } finally {
      setAnalizandoNutricion(false);
    }
  };

  const handleCreatePlanNutricional = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/planes-nutricionales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nutricionForm,
          generadoPorIA: !!resultadoNutricion,
          analisisIA: resultadoNutricion,
        }),
      });

      if (response.ok) {
        setNutricionDialogOpen(false);
        setAnalisisNutricionDialogOpen(false);
        setNutricionForm({
          animalId: "",
          nombre: "",
          tipo: "Individual",
          categoriaAnimal: "Novillo",
          pesoActual: "",
          pesoObjetivo: "",
          gananciaEsperada: "",
          produccionLeche: "",
          energiaDiaria: "",
          proteinaDiaria: "",
          fibraDiaria: "",
          composicionDieta: [],
          costoTotal: "",
          fechaInicio: new Date().toISOString().split("T")[0],
        });
        setResultadoNutricion(null);
        fetchData();
        alert("Plan nutricional creado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear plan");
    }
  };

  const generarAnalisisReproductivo = async () => {
    try {
      setGenerandoAnalisisRepro(true);
      const response = await fetch("/api/analisis-reproductivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analisisReproductivoForm),
      });

      if (response.ok) {
        setAnalisisReproductivoDialogOpen(false);
        fetchData();
        alert("Análisis reproductivo generado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar análisis");
    } finally {
      setGenerandoAnalisisRepro(false);
    }
  };

  const handleCreateAlerta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/alertas-sanitarias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertaForm),
      });

      if (response.ok) {
        setAlertaDialogOpen(false);
        setAlertaForm({
          tipo: "Vacunación",
          severidad: "Media",
          titulo: "",
          descripcion: "",
          animalId: "",
          categoria: "",
          numeroAfectados: "1",
          accionRequerida: "",
          fechaLimite: "",
        });
        fetchData();
        alert("Alerta sanitaria creada");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear alerta");
    }
  };

  const cambiarEstadoAlerta = async (id: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/alertas-sanitarias/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: nuevoEstado,
          fechaResolucion: nuevoEstado === "Completada" ? new Date().toISOString() : null,
        }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarDiagnostico = async (id: string) => {
    if (!confirm("¿Eliminar este diagnóstico?")) return;
    try {
      const response = await fetch(`/api/diagnosticos-salud/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarPlan = async (id: string) => {
    if (!confirm("¿Eliminar este plan?")) return;
    try {
      const response = await fetch(`/api/planes-nutricionales/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarAlerta = async (id: string) => {
    if (!confirm("¿Eliminar esta alerta?")) return;
    try {
      const response = await fetch(`/api/alertas-sanitarias/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const alertasPendientes = alertasSanitarias.filter((a) => a.estado === "Pendiente").length;
  const alertasCriticas = alertasSanitarias.filter(
    (a) => a.severidad === "Crítica" && a.estado === "Pendiente"
  ).length;
  const planesActivos = planesNutricionales.filter((p) => p.estado === "Activo").length;

  const getRiesgoColor = (riesgo: string) => {
    switch (riesgo) {
      case "Crítico":
        return "bg-red-500";
      case "Alto":
        return "bg-orange-500";
      case "Medio":
        return "bg-yellow-500";
      case "Bajo":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case "Crítica":
        return "bg-red-500";
      case "Alta":
        return "bg-orange-500";
      case "Media":
        return "bg-yellow-500";
      case "Baja":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const datosRiesgoSalud = [
    {
      name: "Bajo",
      value: diagnosticos.filter((d) => d.riesgo === "Bajo").length,
      color: "#768f44",
    },
    {
      name: "Medio",
      value: diagnosticos.filter((d) => d.riesgo === "Medio").length,
      color: "#d9a538",
    },
    {
      name: "Alto",
      value: diagnosticos.filter((d) => d.riesgo === "Alto").length,
      color: "#d9a538",
    },
    {
      name: "Crítico",
      value: diagnosticos.filter((d) => d.riesgo === "Crítico").length,
      color: "#c93434",
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ganadería Avanzada</h1>
          <p className="text-gray-600 mt-2">
            Gestión inteligente de salud, nutrición y reproducción
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Diagnósticos
            </CardTitle>
            <Heart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diagnosticos.length}</div>
            <p className="text-xs text-gray-500 mt-1">Últimos 90 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Alertas Sanitarias
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertasPendientes}</div>
            <p className="text-xs text-gray-500 mt-1">{alertasCriticas} críticas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Planes Nutricionales
            </CardTitle>
            <Apple className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planesActivos}</div>
            <p className="text-xs text-gray-500 mt-1">Activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Costo Nutrición
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {planesNutricionales
                .filter((p) => p.estado === "Activo")
                .reduce((sum, p) => sum + (p.costoTotal || 0), 0)
                .toFixed(0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">USD/día</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="salud" className="space-y-4">
        <TabsList>
          <TabsTrigger value="salud">
            <Heart className="h-4 w-4 mr-2" />
            Salud y Diagnósticos
          </TabsTrigger>
          <TabsTrigger value="nutricion">
            <Apple className="h-4 w-4 mr-2" />
            Nutrición Inteligente
          </TabsTrigger>
          <TabsTrigger value="reproduccion">
            <Activity className="h-4 w-4 mr-2" />
            Análisis Reproductivo
          </TabsTrigger>
          <TabsTrigger value="alertas">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alertas Sanitarias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="salud" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Diagnósticos de Salud</h2>
            <Button
              onClick={() => setDiagnosticoDialogOpen(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Diagnóstico
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Riesgos</CardTitle>
              </CardHeader>
              <CardContent>
                {datosRiesgoSalud.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={datosRiesgoSalud}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#768f44"
                        dataKey="value"
                        label
                      >
                        {datosRiesgoSalud.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
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

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Diagnósticos Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Cargando...</div>
                ) : diagnosticos.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No hay diagnósticos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {diagnosticos.map((diag) => (
                      <div
                        key={diag.id}
                        className="p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{diag.animal.caravana}</Badge>
                              <Badge className={getRiesgoColor(diag.riesgo)}>
                                {diag.riesgo}
                              </Badge>
                              <Badge variant="outline">{diag.motivoConsulta}</Badge>
                            </div>
                            <p className="font-medium mb-1">{diag.diagnostico}</p>
                            <div className="bg-blue-50 p-3 rounded border border-blue-200 mt-2">
                              <p className="text-sm font-medium text-blue-900 mb-1">
                                Recomendación IA:
                              </p>
                              <p className="text-sm text-blue-700">{diag.recomendacionIA}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDate(diag.fecha)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarDiagnostico(diag.id)}
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

        <TabsContent value="nutricion" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestión Nutricional</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setAnalisisNutricionDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Análisis IA
              </Button>
              <Button
                onClick={() => setNutricionDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Plan
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Planes Nutricionales</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : planesNutricionales.length === 0 ? (
                <div className="text-center py-8">
                  <Apple className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay planes nutricionales</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {planesNutricionales.map((plan) => (
                    <div
                      key={plan.id}
                      className={`p-4 border rounded-lg ${
                        plan.estado === "Activo"
                          ? "border-green-200 bg-green-50"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-lg">{plan.nombre}</p>
                            <Badge
                              className={
                                plan.estado === "Activo" ? "bg-green-500" : "bg-gray-500"
                              }
                            >
                              {plan.estado}
                            </Badge>
                            {plan.generadoPorIA && (
                              <Badge className="bg-purple-500">
                                <Sparkles className="h-3 w-3 mr-1" />
                                IA
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {plan.categoriaAnimal}
                            {plan.animal && ` • Caravana: ${plan.animal.caravana}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarPlan(plan.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-white p-3 rounded border">
                        <div>
                          <p className="text-gray-500">Energía Diaria</p>
                          <p className="font-medium">{plan.energiaDiaria} Mcal</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Proteína Diaria</p>
                          <p className="font-medium">{plan.proteinaDiaria} kg</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tipo</p>
                          <p className="font-medium">{plan.tipo}</p>
                        </div>
                        {plan.costoTotal && (
                          <div>
                            <p className="text-gray-500">Costo Diario</p>
                            <p className="font-medium text-green-600">
                              ${plan.costoTotal.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reproduccion" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Análisis Reproductivo</h2>
            <Button
              onClick={() => setAnalisisReproductivoDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Generar Análisis
            </Button>
          </div>

          {analisisReproductivos.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Activity className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    No hay análisis reproductivos generados
                  </p>
                  <Button
                    onClick={() => setAnalisisReproductivoDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"            
                  >
                    Generar Primer Análisis
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {analisisReproductivos.map((analisis) => (
                <Card key={analisis.id}>
                  <CardHeader>
                    <CardTitle>
                      Análisis del {formatDate(analisis.fechaInicio)} al{" "}
                      {formatDate(analisis.fechaFin)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded">
                        <p className="text-sm text-gray-600 mb-1">Total Hembras</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {analisis.totalHembras}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded">
                        <p className="text-sm text-gray-600 mb-1">Tasa Servicio</p>
                        <p className="text-2xl font-bold text-green-700">
                          {analisis.tasaServicio.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded">
                        <p className="text-sm text-gray-600 mb-1">Tasa Preñez</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {analisis.tasaPreniez.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded">
                        <p className="text-sm text-gray-600 mb-1">Tasa Natalidad</p>
                        <p className="text-2xl font-bold text-orange-700">
                          {analisis.tasaNatalidad.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {analisis.intervaloPartos && (
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-600 mb-1">
                          Intervalo Entre Partos (Promedio)
                        </p>
                        <p className="text-xl font-bold">
                          {analisis.intervaloPartos.toFixed(0)} días
                        </p>
                      </div>
                    )}

                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded border border-purple-200">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-purple-900 mb-2">
                            Recomendaciones IA:
                          </p>
                          <p className="text-sm text-purple-700">
                            {analisis.recomendacionIA}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB: ALERTAS SANITARIAS */}
        <TabsContent value="alertas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Alertas Sanitarias</h2>
            <Button
              onClick={() => setAlertaDialogOpen(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Alerta
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alertas Activas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : alertasSanitarias.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay alertas sanitarias</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertasSanitarias.map((alerta) => (
                    <div
                      key={alerta.id}
                      className={`p-4 border rounded-lg ${
                        alerta.estado === "Pendiente"
                          ? "border-orange-200 bg-orange-50"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-lg">{alerta.titulo}</p>
                            <Badge className={getSeveridadColor(alerta.severidad)}>
                              {alerta.severidad}
                            </Badge>
                            <Badge variant="outline">{alerta.tipo}</Badge>
                            {alerta.numeroAfectados > 1 && (
                              <Badge variant="outline">
                                {alerta.numeroAfectados} animales
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{alerta.descripcion}</p>
                          <div className="bg-white p-3 rounded border">
                            <p className="text-sm font-medium mb-1">Acción Requerida:</p>
                            <p className="text-sm text-gray-700">{alerta.accionRequerida}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Creada: {formatDate(alerta.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {alerta.estado === "Pendiente" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cambiarEstadoAlerta(alerta.id, "Completada")}
                              className="text-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Completar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarAlerta(alerta.id)}
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
      </Tabs>

      {/* Dialog: Nuevo Diagnóstico */}
      <Dialog open={diagnosticoDialogOpen} onOpenChange={setDiagnosticoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateDiagnostico}>
            <DialogHeader>
              <DialogTitle>Nuevo Diagnóstico de Salud</DialogTitle>
              <DialogDescription>
                El sistema generará análisis de riesgo con IA
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Animal *</Label>
                <Select
                  value={diagnosticoForm.animalId}
                  onValueChange={(value) =>
                    setDiagnosticoForm({ ...diagnosticoForm, animalId: value })
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Veterinario</Label>
                  <Input
                    placeholder="Nombre del veterinario"
                    value={diagnosticoForm.veterinario}
                    onChange={(e) =>
                      setDiagnosticoForm({ ...diagnosticoForm, veterinario: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Motivo Consulta *</Label>
                  <Select
                    value={diagnosticoForm.motivoConsulta}
                    onValueChange={(value) =>
                      setDiagnosticoForm({ ...diagnosticoForm, motivoConsulta: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chequeo rutinario">Chequeo rutinario</SelectItem>
                      <SelectItem value="Enfermedad">Enfermedad</SelectItem>
                      <SelectItem value="Emergencia">Emergencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Temperatura (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="38.5"
                    value={diagnosticoForm.temperatura}
                    onChange={(e) =>
                      setDiagnosticoForm({ ...diagnosticoForm, temperatura: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frec. Cardíaca</Label>
                  <Input
                    type="number"
                    placeholder="70"
                    value={diagnosticoForm.frecuenciaCardiaca}
                    onChange={(e) =>
                      setDiagnosticoForm({
                        ...diagnosticoForm,
                        frecuenciaCardiaca: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cond. Corporal (1-5)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    max="5"
                    placeholder="3.5"
                    value={diagnosticoForm.condicionCorporal}
                    onChange={(e) =>
                      setDiagnosticoForm({
                        ...diagnosticoForm,
                        condicionCorporal: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Diagnóstico *</Label>
                <Input
                  placeholder="Ej: Mastitis subclínica"
                  value={diagnosticoForm.diagnostico}
                  onChange={(e) =>
                    setDiagnosticoForm({ ...diagnosticoForm, diagnostico: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tratamiento *</Label>
                <Textarea
                  placeholder="Descripción del tratamiento..."
                  value={diagnosticoForm.tratamiento}
                  onChange={(e) =>
                    setDiagnosticoForm({ ...diagnosticoForm, tratamiento: e.target.value })
                  }
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Próxima Revisión</Label>
                  <Input
                    type="date"
                    value={diagnosticoForm.proximaRevision}
                    onChange={(e) =>
                      setDiagnosticoForm({
                        ...diagnosticoForm,
                        proximaRevision: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Costo Consulta (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="50.00"
                    value={diagnosticoForm.costoConsulta}
                    onChange={(e) =>
                      setDiagnosticoForm({ ...diagnosticoForm, costoConsulta: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDiagnosticoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                <Sparkles className="h-4 w-4 mr-2" />
                Guardar con Análisis IA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>  
      {/* Dialog: Análisis Nutricional IA */}
      <Dialog
        open={analisisNutricionDialogOpen}
        onOpenChange={setAnalisisNutricionDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Análisis Nutricional con IA
            </DialogTitle>
            <DialogDescription>
              El sistema calculará los requerimientos nutricionales óptimos
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría Animal *</Label>
                <Select
                  value={analisisNutricionForm.categoriaAnimal}
                  onValueChange={(value) =>
                    setAnalisisNutricionForm({ ...analisisNutricionForm, categoriaAnimal: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vaca lechera">Vaca lechera</SelectItem>
                    <SelectItem value="Ternero">Ternero</SelectItem>
                    <SelectItem value="Novillo">Novillo</SelectItem>
                    <SelectItem value="Vaquillona">Vaquillona</SelectItem>
                    <SelectItem value="Toro">Toro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Etapa Productiva</Label>
                <Select
                  value={analisisNutricionForm.etapaProductiva}
                  onValueChange={(value) =>
                    setAnalisisNutricionForm({
                      ...analisisNutricionForm,
                      etapaProductiva: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Crecimiento">Crecimiento</SelectItem>
                    <SelectItem value="Engorde">Engorde</SelectItem>
                    <SelectItem value="Lactancia">Lactancia</SelectItem>
                    <SelectItem value="Gestación">Gestación</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Peso Actual (kg) *</Label>
                <Input
                  type="number"
                  step="1"
                  placeholder="450"
                  value={analisisNutricionForm.pesoActual}
                  onChange={(e) =>
                    setAnalisisNutricionForm({
                      ...analisisNutricionForm,
                      pesoActual: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Peso Objetivo (kg)</Label>
                <Input
                  type="number"
                  step="1"
                  placeholder="500"
                  value={analisisNutricionForm.pesoObjetivo}
                  onChange={(e) =>
                    setAnalisisNutricionForm({
                      ...analisisNutricionForm,
                      pesoObjetivo: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ganancia Esperada (kg/día)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.8"
                  value={analisisNutricionForm.gananciaEsperada}
                  onChange={(e) =>
                    setAnalisisNutricionForm({
                      ...analisisNutricionForm,
                      gananciaEsperada: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {analisisNutricionForm.categoriaAnimal === "Vaca lechera" && (
              <div className="space-y-2">
                <Label>Producción de Leche (L/día)</Label>
                <Input
                  type="number"
                  step="1"
                  placeholder="25"
                  value={analisisNutricionForm.produccionLeche}
                  onChange={(e) =>
                    setAnalisisNutricionForm({
                      ...analisisNutricionForm,
                      produccionLeche: e.target.value,
                    })
                  }
                />
              </div>
            )}

            <Button
              type="button"
              onClick={analizarNutricionIA}
              disabled={analizandoNutricion}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {analizandoNutricion ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analizando con IA...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analizar Requerimientos
                </>
              )}
            </Button>

            {resultadoNutricion && (
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Resultado del Análisis IA
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Confianza: {resultadoNutricion.confianza.toFixed(0)}%
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600 mb-1">Energía Diaria</p>
                      <p className="text-xl font-bold text-blue-600">
                        {resultadoNutricion.energiaDiaria} Mcal
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600 mb-1">Proteína Diaria</p>
                      <p className="text-xl font-bold text-green-600">
                        {resultadoNutricion.proteinaDiaria} kg
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600 mb-1">Fibra Diaria</p>
                      <p className="text-xl font-bold text-purple-600">
                        {resultadoNutricion.fibraDiaria} kg
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded border">
                    <p className="font-medium mb-3">Dieta Sugerida:</p>
                    <div className="space-y-2">
                      {resultadoNutricion.dietaSugerida.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{item.alimento}</p>
                            <p className="text-xs text-gray-500">{item.aporte}</p>
                          </div>
                          <Badge variant="outline">
                            {item.cantidad} {item.unidad}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded border">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Costo Total Diario:</p>
                      <p className="text-xl font-bold text-green-600">
                        ${resultadoNutricion.costoTotal}
                      </p>
                    </div>
                    {resultadoNutricion.eficienciaAlimenticia && (
                      <p className="text-sm text-gray-600">
                        Eficiencia alimenticia estimada: {resultadoNutricion.eficienciaAlimenticia}
                      </p>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded border">
                    <p className="font-medium mb-2">Recomendaciones:</p>
                    <ul className="space-y-1 text-sm">
                      {resultadoNutricion.recomendaciones.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-purple-600 mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {resultadoNutricion.alertas && resultadoNutricion.alertas.length > 0 && (
                    <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                      <p className="font-medium mb-2 text-yellow-900">Alertas:</p>
                      <ul className="space-y-1 text-sm text-yellow-800">
                        {resultadoNutricion.alertas.map((alerta: string, idx: number) => (
                          <li key={idx}>{alerta}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {resultadoNutricion && (
              <form onSubmit={handleCreatePlanNutricional} className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Crear Plan Nutricional</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del Plan *</Label>
                    <Input
                      placeholder="Ej: Engorde Novillo - Lote 5"
                      value={nutricionForm.nombre}
                      onChange={(e) =>
                        setNutricionForm({ ...nutricionForm, nombre: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Animal (opcional)</Label>
                    <Select
                      value={nutricionForm.animalId}
                      onValueChange={(value) =>
                        setNutricionForm({ ...nutricionForm, animalId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Para grupo/rodeo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Para grupo/rodeo</SelectItem>
                        {animales.map((animal) => (
                          <SelectItem key={animal.id} value={animal.id}>
                            {animal.caravana} - {animal.tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fecha Inicio *</Label>
                  <Input
                    type="date"
                    value={nutricionForm.fechaInicio}
                    onChange={(e) =>
                      setNutricionForm({ ...nutricionForm, fechaInicio: e.target.value })
                    }
                    required
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAnalisisNutricionDialogOpen(false);
                      setResultadoNutricion(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    <Apple className="h-4 w-4 mr-2" />
                    Crear Plan Nutricional
                  </Button>
                </DialogFooter>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Plan Nutricional Manual */}
      <Dialog open={nutricionDialogOpen} onOpenChange={setNutricionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreatePlanNutricional}>
            <DialogHeader>
              <DialogTitle>Crear Plan Nutricional Manual</DialogTitle>
              <DialogDescription>Ingresá los parámetros manualmente</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre del Plan *</Label>
                <Input
                  placeholder="Ej: Plan Vaca Lechera Alta Producción"
                  value={nutricionForm.nombre}
                  onChange={(e) => setNutricionForm({ ...nutricionForm, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={nutricionForm.tipo}
                    onValueChange={(value) =>
                      setNutricionForm({ ...nutricionForm, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Grupo">Grupo</SelectItem>
                      <SelectItem value="Rodeo">Rodeo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoría Animal *</Label>
                  <Select
                    value={nutricionForm.categoriaAnimal}
                    onValueChange={(value) =>
                      setNutricionForm({ ...nutricionForm, categoriaAnimal: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vaca lechera">Vaca lechera</SelectItem>
                      <SelectItem value="Ternero">Ternero</SelectItem>
                      <SelectItem value="Novillo">Novillo</SelectItem>
                      <SelectItem value="Vaquillona">Vaquillona</SelectItem>
                      <SelectItem value="Toro">Toro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Energía Diaria (Mcal) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="15.5"
                    value={nutricionForm.energiaDiaria}
                    onChange={(e) =>
                      setNutricionForm({ ...nutricionForm, energiaDiaria: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Proteína Diaria (kg) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="1.8"
                    value={nutricionForm.proteinaDiaria}
                    onChange={(e) =>
                      setNutricionForm({ ...nutricionForm, proteinaDiaria: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fibra Diaria (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="6.5"
                    value={nutricionForm.fibraDiaria}
                    onChange={(e) =>
                      setNutricionForm({ ...nutricionForm, fibraDiaria: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Inicio *</Label>
                  <Input
                    type="date"
                    value={nutricionForm.fechaInicio}
                    onChange={(e) =>
                      setNutricionForm({ ...nutricionForm, fechaInicio: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Costo Total Diario (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="3.50"
                    value={nutricionForm.costoTotal}
                    onChange={(e) =>
                      setNutricionForm({ ...nutricionForm, costoTotal: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Animal (opcional)</Label>
                <Select
                  value={nutricionForm.animalId}
                  onValueChange={(value) =>
                    setNutricionForm({ ...nutricionForm, animalId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Para grupo/rodeo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Para grupo/rodeo</SelectItem>
                    {animales.map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.caravana} - {animal.tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNutricionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Crear Plan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Análisis Reproductivo */}
      <Dialog
        open={analisisReproductivoDialogOpen}
        onOpenChange={setAnalisisReproductivoDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Análisis Reproductivo</DialogTitle>
            <DialogDescription>
              El sistema analizará los datos del período seleccionado
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Inicio *</Label>
                <Input
                  type="date"
                  value={analisisReproductivoForm.fechaInicio}
                  onChange={(e) =>
                    setAnalisisReproductivoForm({
                      ...analisisReproductivoForm,
                      fechaInicio: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin *</Label>
                <Input
                  type="date"
                  value={analisisReproductivoForm.fechaFin}
                  onChange={(e) =>
                    setAnalisisReproductivoForm({
                      ...analisisReproductivoForm,
                      fechaFin: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAnalisisReproductivoDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={generarAnalisisReproductivo}
              disabled={generandoAnalisisRepro}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {generandoAnalisisRepro ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar Análisis IA
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nueva Alerta Sanitaria */}
      <Dialog open={alertaDialogOpen} onOpenChange={setAlertaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateAlerta}>
            <DialogHeader>
              <DialogTitle>Nueva Alerta Sanitaria</DialogTitle>
              <DialogDescription>Crear recordatorio o alerta preventiva</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={alertaForm.tipo}
                    onValueChange={(value) => setAlertaForm({ ...alertaForm, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vacunación">Vacunación</SelectItem>
                      <SelectItem value="Enfermedad">Enfermedad</SelectItem>
                      <SelectItem value="Tratamiento">Tratamiento</SelectItem>
                      <SelectItem value="Emergencia">Emergencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Severidad *</Label>
                  <Select
                    value={alertaForm.severidad}
                    onValueChange={(value) => setAlertaForm({ ...alertaForm, severidad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baja">Baja</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Crítica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  placeholder="Ej: Vacunación aftosa - Lote completo"
                  value={alertaForm.titulo}
                  onChange={(e) => setAlertaForm({ ...alertaForm, titulo: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción *</Label>
                <Textarea
                  placeholder="Descripción detallada..."
                  value={alertaForm.descripcion}
                  onChange={(e) => setAlertaForm({ ...alertaForm, descripcion: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Animal Individual (opcional)</Label>
                  <Select
                    value={alertaForm.animalId}
                    onValueChange={(value) => setAlertaForm({ ...alertaForm, animalId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Para grupo/categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Para grupo/categoría</SelectItem>
                      {animales.map((animal) => (
                        <SelectItem key={animal.id} value={animal.id}>
                          {animal.caravana} - {animal.tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>N° Animales Afectados</Label>
                  <Input
                    type="number"
                    min="1"
                    value={alertaForm.numeroAfectados}
                    onChange={(e) =>
                      setAlertaForm({ ...alertaForm, numeroAfectados: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Acción Requerida *</Label>
                <Textarea
                  placeholder="Qué se debe hacer..."
                  value={alertaForm.accionRequerida}
                  onChange={(e) =>
                    setAlertaForm({ ...alertaForm, accionRequerida: e.target.value })
                  }
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha Límite</Label>
                <Input
                  type="date"
                  value={alertaForm.fechaLimite}
                  onChange={(e) => setAlertaForm({ ...alertaForm, fechaLimite: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAlertaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                Crear Alerta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-purple-900">IA Aplicada a la Ganadería</p>
              <p className="text-sm text-purple-700 mt-1">
                El sistema utiliza inteligencia artificial para analizar la salud de tu ganado,
                optimizar planes nutricionales y evaluar eficiencia reproductiva. Los algoritmos
                consideran peso, producción, etapa productiva y mejores prácticas ganaderas para
                generar recomendaciones personalizadas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default GanaderiaAvanzadaPage;