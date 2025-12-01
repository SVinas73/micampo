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
  Bug,
  Droplets,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
  MapPin,
  DollarSign,
  Sparkles,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type AlertaPlaga = {
  id: string;
  plaga: string;
  tipo: string;
  severidad: string;
  confianza: number;
  fechaDeteccion: string;
  estado: string;
  recomendacion: string;
  productos: string;
  lote?: { nombre: string };
};

type PlanRiego = {
  id: string;
  nombre: string;
  cultivo: string;
  etcDiaria: number;
  frecuenciaRiego: number;
  laminaRiego: number;
  estado: string;
  modoIA: boolean;
  lote?: { nombre: string; hectareas: number };
  eventosRiego: any[];
};

function PlagasRiegoPage() {
  const [alertasPlagas, setAlertasPlagas] = useState<AlertaPlaga[]>([]);
  const [planesRiego, setPlanesRiego] = useState<PlanRiego[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [plagaDialogOpen, setPlagaDialogOpen] = useState(false);
  const [riegoDialogOpen, setRiegoDialogOpen] = useState(false);
  const [analisisIADialogOpen, setAnalisisIADialogOpen] = useState(false);

  const [plagaForm, setPlagaForm] = useState({
    loteId: "",
    plaga: "",
    tipo: "Insecto",
    severidad: "Media",
    metodoDeteccion: "Manual",
    areaAfectada: "",
  });

  const [riegoForm, setRiegoForm] = useState({
    loteId: "",
    nombre: "",
    cultivo: "",
    etapaFenologica: "Vegetativo",
    tipoSuelo: "",
    etcDiaria: "",
    frecuenciaRiego: "",
    laminaRiego: "",
    fechaInicio: new Date().toISOString().split("T")[0],
    costoMM: "",
    eficienciaRiego: "85",
    modoIA: false,
  });

  const [analisisForm, setAnalisisForm] = useState({
    loteId: "",
    cultivo: "",
    etapaFenologica: "Vegetativo",
  });

  const [resultadoAnalisis, setResultadoAnalisis] = useState<any>(null);
  const [analizando, setAnalizando] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plagasRes, riegoRes, lotesRes] = await Promise.all([
        fetch("/api/alertas-plagas"),
        fetch("/api/planes-riego"),
        fetch("/api/lotes"),
      ]);

      if (plagasRes.ok) {
        const data = await plagasRes.json();
        setAlertasPlagas(data);
      }

      if (riegoRes.ok) {
        const data = await riegoRes.json();
        setPlanesRiego(data);
      }

      if (lotesRes.ok) {
        const data = await lotesRes.json();
        setLotes(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaga = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/alertas-plagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plagaForm),
      });

      if (response.ok) {
        setPlagaDialogOpen(false);
        setPlagaForm({
          loteId: "",
          plaga: "",
          tipo: "Insecto",
          severidad: "Media",
          metodoDeteccion: "Manual",
          areaAfectada: "",
        });
        fetchData();
        alert("Alerta de plaga creada con recomendaciones IA");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear alerta");
    }
  };

  const analizarRiegoIA = async () => {
    if (!analisisForm.loteId || !analisisForm.cultivo) {
      alert("Completá lote y cultivo");
      return;
    }

    try {
      setAnalizando(true);
      const response = await fetch("/api/riego-ia/analizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analisisForm),
      });

      if (response.ok) {
        const data = await response.json();
        setResultadoAnalisis(data);
        
        // Pre-llenar formulario con recomendaciones IA
        setRiegoForm({
          ...riegoForm,
          loteId: analisisForm.loteId,
          cultivo: analisisForm.cultivo,
          etapaFenologica: analisisForm.etapaFenologica,
          etcDiaria: data.etcDiaria.toString(),
          frecuenciaRiego: data.frecuenciaRiego.toString(),
          laminaRiego: data.laminaRiego.toString(),
          modoIA: true,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al analizar");
    } finally {
      setAnalizando(false);
    }
  };

  const handleCreateRiego = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/planes-riego", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(riegoForm),
      });

      if (response.ok) {
        setRiegoDialogOpen(false);
        setAnalisisIADialogOpen(false);
        setRiegoForm({
          loteId: "",
          nombre: "",
          cultivo: "",
          etapaFenologica: "Vegetativo",
          tipoSuelo: "",
          etcDiaria: "",
          frecuenciaRiego: "",
          laminaRiego: "",
          fechaInicio: new Date().toISOString().split("T")[0],
          costoMM: "",
          eficienciaRiego: "85",
          modoIA: false,
        });
        setResultadoAnalisis(null);
        fetchData();
        alert("Plan de riego creado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear plan");
    }
  };

  const cambiarEstadoPlan = async (id: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/planes-riego/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const cambiarEstadoAlerta = async (id: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/alertas-plagas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: nuevoEstado,
          fechaResolucion: nuevoEstado === "Resuelta" ? new Date().toISOString() : null,
        }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarPlaga = async (id: string) => {
    if (!confirm("¿Eliminar esta alerta?")) return;
    try {
      const response = await fetch(`/api/alertas-plagas/${id}`, {
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
      const response = await fetch(`/api/planes-riego/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const alertasActivas = alertasPlagas.filter((a) => a.estado === "Activa").length;
  const alertasCriticas = alertasPlagas.filter(
    (a) => a.severidad === "Crítica" && a.estado === "Activa"
  ).length;
  const planesActivos = planesRiego.filter((p) => p.estado === "Activo").length;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plagas y Riego Inteligente</h1>
          <p className="text-gray-600 mt-2">
            Monitoreo de plagas con IA y gestión optimizada del riego
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Alertas Activas
            </CardTitle>
            <Bug className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertasActivas}</div>
            <p className="text-xs text-gray-500 mt-1">
              {alertasCriticas} críticas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Planes de Riego
            </CardTitle>
            <Droplets className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planesActivos}</div>
            <p className="text-xs text-gray-500 mt-1">Activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Confianza IA
            </CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alertasPlagas.length > 0
                ? (
                    alertasPlagas.reduce((sum, a) => sum + a.confianza, 0) /
                    alertasPlagas.length
                  ).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-gray-500 mt-1">Promedio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Agua Planificada
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {planesRiego
                .filter((p) => p.estado === "Activo")
                .reduce((sum, p) => sum + p.laminaRiego, 0)
                .toFixed(1)}{" "}
              mm
            </div>
            <p className="text-xs text-gray-500 mt-1">Por ciclo</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plagas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plagas">
            <Bug className="h-4 w-4 mr-2" />
            Alertas de Plagas
          </TabsTrigger>
          <TabsTrigger value="riego">
            <Droplets className="h-4 w-4 mr-2" />
            Planes de Riego
          </TabsTrigger>
        </TabsList>

        {/* TAB: ALERTAS DE PLAGAS */}
        <TabsContent value="plagas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Alertas de Plagas y Enfermedades</h2>
            <Button
              onClick={() => setPlagaDialogOpen(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Reportar Plaga
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alertas Activas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : alertasPlagas.length === 0 ? (
                <div className="text-center py-8">
                  <Bug className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay alertas de plagas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertasPlagas.map((alerta) => (
                    <div
                      key={alerta.id}
                      className={`p-4 border rounded-lg ${
                        alerta.estado === "Activa" ? "border-red-200 bg-red-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-lg">{alerta.plaga}</p>
                            <Badge className={getSeveridadColor(alerta.severidad)}>
                              {alerta.severidad}
                            </Badge>
                            <Badge variant="outline">{alerta.tipo}</Badge>
                            <Badge variant="outline">IA: {alerta.confianza.toFixed(0)}%</Badge>
                          </div>
                          {alerta.lote && (
                            <p className="text-sm text-gray-600 mb-2">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {alerta.lote.nombre}
                            </p>
                          )}
                          <div className="bg-white p-3 rounded border">
                            <p className="text-sm font-medium mb-1">Recomendación IA:</p>
                            <p className="text-sm text-gray-700">{alerta.recomendacion}</p>
                            {alerta.productos && JSON.parse(alerta.productos).length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-600">
                                  Productos sugeridos:
                                </p>
                                <div className="flex gap-2 mt-1">
                                  {JSON.parse(alerta.productos).map((prod: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {prod}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Detectada: {formatDate(alerta.fechaDeteccion)}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {alerta.estado === "Activa" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cambiarEstadoAlerta(alerta.id, "Resuelta")}
                              className="text-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolver
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarPlaga(alerta.id)}
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

        {/* TAB: PLANES DE RIEGO */}
        <TabsContent value="riego" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestión Inteligente del Riego</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setAnalisisIADialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Análisis IA
              </Button>
              <Button
                onClick={() => setRiegoDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Plan
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Planes de Riego</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : planesRiego.length === 0 ? (
                <div className="text-center py-8">
                  <Droplets className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay planes de riego</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {planesRiego.map((plan) => (
                    <div
                      key={plan.id}
                      className={`p-4 border rounded-lg ${
                        plan.estado === "Activo" ? "border-blue-200 bg-blue-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-lg">{plan.nombre}</p>
                            <Badge
                              className={
                                plan.estado === "Activo"
                                  ? "bg-green-500"
                                  : plan.estado === "Pausado"
                                  ? "bg-yellow-500"
                                  : "bg-gray-500"
                              }
                            >
                              {plan.estado}
                            </Badge>
                            {plan.modoIA && (
                              <Badge className="bg-purple-500">
                                <Sparkles className="h-3 w-3 mr-1" />
                                IA
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {plan.cultivo}
                            {plan.lote && ` • ${plan.lote.nombre} (${plan.lote.hectareas} ha)`}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {plan.estado === "Activo" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cambiarEstadoPlan(plan.id, "Pausado")}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          {plan.estado === "Pausado" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cambiarEstadoPlan(plan.id, "Activo")}
                              className="text-green-600"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarPlan(plan.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-white p-3 rounded border">
                        <div>
                          <p className="text-gray-500">ETC Diaria</p>
                          <p className="font-medium">{plan.etcDiaria} mm/día</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Frecuencia</p>
                          <p className="font-medium">Cada {plan.frecuenciaRiego} días</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Lámina</p>
                          <p className="font-medium text-blue-600">{plan.laminaRiego} mm</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Eventos</p>
                          <p className="font-medium">{plan.eventosRiego.length} registrados</p>
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

      {/* Dialog: Reportar Plaga */}
      <Dialog open={plagaDialogOpen} onOpenChange={setPlagaDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreatePlaga}>
            <DialogHeader>
              <DialogTitle>Reportar Plaga o Enfermedad</DialogTitle>
              <DialogDescription>
                El sistema generará recomendaciones con IA
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Lote *</Label>
                <Select
                  value={plagaForm.loteId}
                  onValueChange={(value) => setPlagaForm({ ...plagaForm, loteId: value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={plagaForm.tipo}
                    onValueChange={(value) => setPlagaForm({ ...plagaForm, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Insecto">Insecto</SelectItem>
                      <SelectItem value="Hongo">Hongo</SelectItem>
                      <SelectItem value="Bacteria">Bacteria</SelectItem>
                      <SelectItem value="Virus">Virus</SelectItem>
                      <SelectItem value="Maleza">Maleza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Severidad *</Label>
                  <Select
                    value={plagaForm.severidad}
                    onValueChange={(value) => setPlagaForm({ ...plagaForm, severidad: value })}
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
                <Label>Nombre de la Plaga/Enfermedad *</Label>
                <Input
                  placeholder="Ej: Roya de la soja"
                  value={plagaForm.plaga}
                  onChange={(e) => setPlagaForm({ ...plagaForm, plaga: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Método de Detección</Label>
                  <Select
                    value={plagaForm.metodoDeteccion}
                    onValueChange={(value) =>
                      setPlagaForm({ ...plagaForm, metodoDeteccion: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="IA-Imagen">IA-Imagen</SelectItem>
                      <SelectItem value="IA-Datos">IA-Datos</SelectItem>
                      <SelectItem value="Sensor">Sensor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Área Afectada (ha)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="5.2"
                    value={plagaForm.areaAfectada}
                    onChange={(e) =>
                      setPlagaForm({ ...plagaForm, areaAfectada: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPlagaDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                <Sparkles className="h-4 w-4 mr-2" />
                Generar Recomendación IA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Dialog: Análisis IA de Riego */}
      <Dialog open={analisisIADialogOpen} onOpenChange={setAnalisisIADialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Análisis IA de Requerimientos Hídricos
            </DialogTitle>
            <DialogDescription>
              El sistema calculará las necesidades de riego óptimas para tu cultivo
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Lote *</Label>
              <Select
                value={analisisForm.loteId}
                onValueChange={(value) => setAnalisisForm({ ...analisisForm, loteId: value })}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cultivo *</Label>
                <Select
                  value={analisisForm.cultivo}
                  onValueChange={(value) => setAnalisisForm({ ...analisisForm, cultivo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Soja">Soja</SelectItem>
                    <SelectItem value="Maíz">Maíz</SelectItem>
                    <SelectItem value="Trigo">Trigo</SelectItem>
                    <SelectItem value="Girasol">Girasol</SelectItem>
                    <SelectItem value="Alfalfa">Alfalfa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Etapa Fenológica *</Label>
                <Select
                  value={analisisForm.etapaFenologica}
                  onValueChange={(value) =>
                    setAnalisisForm({ ...analisisForm, etapaFenologica: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Germinación">Germinación</SelectItem>
                    <SelectItem value="Vegetativo">Vegetativo</SelectItem>
                    <SelectItem value="Floración">Floración</SelectItem>
                    <SelectItem value="Fructificación">Fructificación</SelectItem>
                    <SelectItem value="Maduración">Maduración</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="button"
              onClick={analizarRiegoIA}
              disabled={analizando}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {analizando ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analizando con IA...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analizar con IA
                </>
              )}
            </Button>

            {resultadoAnalisis && (
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Recomendaciones del Sistema IA
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Confianza: {resultadoAnalisis.confianza.toFixed(0)}%
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600 mb-1">ETC Diaria</p>
                      <p className="text-xl font-bold text-blue-600">
                        {resultadoAnalisis.etcDiaria} mm
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600 mb-1">Frecuencia</p>
                      <p className="text-xl font-bold text-green-600">
                        {resultadoAnalisis.frecuenciaRiego} días
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600 mb-1">Lámina por Riego</p>
                      <p className="text-xl font-bold text-purple-600">
                        {resultadoAnalisis.laminaRiego} mm
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600 mb-1">Volumen Total</p>
                      <p className="text-lg font-bold text-blue-600">
                        {resultadoAnalisis.volumenTotal} m³
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600 mb-1">Tiempo de Riego</p>
                      <p className="text-lg font-bold text-green-600">
                        {resultadoAnalisis.tiempoRiego} h
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-600 mb-1">Costo Estimado</p>
                      <p className="text-lg font-bold text-orange-600">
                        ${resultadoAnalisis.costoEstimado}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded border">
                    <p className="font-medium mb-2">Recomendaciones:</p>
                    <ul className="space-y-1 text-sm">
                      {resultadoAnalisis.recomendaciones.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-purple-600 mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {resultadoAnalisis && (
              <form onSubmit={handleCreateRiego} className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Crear Plan de Riego</h3>

                <div className="space-y-2">
                  <Label>Nombre del Plan *</Label>
                  <Input
                    placeholder="Ej: Riego Soja Lote Norte - Floración"
                    value={riegoForm.nombre}
                    onChange={(e) => setRiegoForm({ ...riegoForm, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>ETC Diaria (mm) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={riegoForm.etcDiaria}
                      onChange={(e) => setRiegoForm({ ...riegoForm, etcDiaria: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frecuencia (días) *</Label>
                    <Input
                      type="number"
                      value={riegoForm.frecuenciaRiego}
                      onChange={(e) =>
                        setRiegoForm({ ...riegoForm, frecuenciaRiego: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lámina (mm) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={riegoForm.laminaRiego}
                      onChange={(e) =>
                        setRiegoForm({ ...riegoForm, laminaRiego: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha Inicio *</Label>
                    <Input
                      type="date"
                      value={riegoForm.fechaInicio}
                      onChange={(e) => setRiegoForm({ ...riegoForm, fechaInicio: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Suelo</Label>
                    <Select
                      value={riegoForm.tipoSuelo}
                      onValueChange={(value) => setRiegoForm({ ...riegoForm, tipoSuelo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arcilloso">Arcilloso</SelectItem>
                        <SelectItem value="Limoso">Limoso</SelectItem>
                        <SelectItem value="Arenoso">Arenoso</SelectItem>
                        <SelectItem value="Franco">Franco</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Costo por mm (USD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.50"
                      value={riegoForm.costoMM}
                      onChange={(e) => setRiegoForm({ ...riegoForm, costoMM: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Eficiencia Riego (%)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={riegoForm.eficienciaRiego}
                      onChange={(e) =>
                        setRiegoForm({ ...riegoForm, eficienciaRiego: e.target.value })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAnalisisIADialogOpen(false);
                      setResultadoAnalisis(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Droplets className="h-4 w-4 mr-2" />
                    Crear Plan de Riego
                  </Button>
                </DialogFooter>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Crear Plan de Riego Manual */}
      <Dialog open={riegoDialogOpen} onOpenChange={setRiegoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateRiego}>
            <DialogHeader>
              <DialogTitle>Crear Plan de Riego Manual</DialogTitle>
              <DialogDescription>
                Ingresá los parámetros de riego manualmente
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre del Plan *</Label>
                <Input
                  placeholder="Ej: Riego Maíz Lote Sur"
                  value={riegoForm.nombre}
                  onChange={(e) => setRiegoForm({ ...riegoForm, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Lote *</Label>
                <Select
                  value={riegoForm.loteId}
                  onValueChange={(value) => setRiegoForm({ ...riegoForm, loteId: value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cultivo *</Label>
                  <Input
                    placeholder="Ej: Soja"
                    value={riegoForm.cultivo}
                    onChange={(e) => setRiegoForm({ ...riegoForm, cultivo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Etapa Fenológica</Label>
                  <Select
                    value={riegoForm.etapaFenologica}
                    onValueChange={(value) =>
                      setRiegoForm({ ...riegoForm, etapaFenologica: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Germinación">Germinación</SelectItem>
                      <SelectItem value="Vegetativo">Vegetativo</SelectItem>
                      <SelectItem value="Floración">Floración</SelectItem>
                      <SelectItem value="Fructificación">Fructificación</SelectItem>
                      <SelectItem value="Maduración">Maduración</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>ETC Diaria (mm) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="5.5"
                    value={riegoForm.etcDiaria}
                    onChange={(e) => setRiegoForm({ ...riegoForm, etcDiaria: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frecuencia (días) *</Label>
                  <Input
                    type="number"
                    placeholder="7"
                    value={riegoForm.frecuenciaRiego}
                    onChange={(e) =>
                      setRiegoForm({ ...riegoForm, frecuenciaRiego: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lámina (mm) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="38.5"
                    value={riegoForm.laminaRiego}
                    onChange={(e) => setRiegoForm({ ...riegoForm, laminaRiego: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Inicio *</Label>
                  <Input
                    type="date"
                    value={riegoForm.fechaInicio}
                    onChange={(e) => setRiegoForm({ ...riegoForm, fechaInicio: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Suelo</Label>
                  <Select
                    value={riegoForm.tipoSuelo}
                    onValueChange={(value) => setRiegoForm({ ...riegoForm, tipoSuelo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arcilloso">Arcilloso</SelectItem>
                      <SelectItem value="Limoso">Limoso</SelectItem>
                      <SelectItem value="Arenoso">Arenoso</SelectItem>
                      <SelectItem value="Franco">Franco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Costo por mm (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.50"
                    value={riegoForm.costoMM}
                    onChange={(e) => setRiegoForm({ ...riegoForm, costoMM: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Eficiencia Riego (%)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={riegoForm.eficienciaRiego}
                    onChange={(e) =>
                      setRiegoForm({ ...riegoForm, eficienciaRiego: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRiegoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Crear Plan
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
              <p className="font-medium text-purple-900">IA Aplicada a la Agricultura</p>
              <p className="text-sm text-purple-700 mt-1">
                El sistema utiliza inteligencia artificial para analizar tus cultivos y generar
                recomendaciones personalizadas de tratamiento de plagas y optimización del riego.
                Los modelos consideran etapa fenológica, condiciones climáticas y mejores prácticas
                agronómicas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}              

export default PlagasRiegoPage;