"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  TrendingUp, 
  Sprout, 
  Plus, 
  Trash2, 
  CheckCircle,
  Sparkles,
  RefreshCw,
  TestTube,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type PlanSiembra = {
  id: string;
  cultivo: string;
  variedad: string | null;
  fechaSiembraRecomendada: string;
  fechaCosechaEstimada: string;
  hectareas: number;
  rendimientoEstimado: number | null;
  costoEstimado: number | null;
  ingresoEstimado: number | null;
  margenEstimado: number | null;
  confianza: number | null;
  analisisIA: string | null;
  estado: string;
  observaciones: string | null;
  lote: {
    nombre: string;
    hectareas: number;
  };
};

type AnalisisSuelo = {
  id: string;
  fechaAnalisis: string;
  pH: number | null;
  materiaOrganica: number | null;
  nitrogeno: number | null;
  fosforo: number | null;
  potasio: number | null;
  observaciones: string | null;
  recomendaciones: string | null;
  lote: {
    nombre: string;
  };
};

type Lote = {
  id: string;
  nombre: string;
  hectareas: number;
};

export default function PlanificacionSiembrasPage() {
  const [planes, setPlanes] = useState<PlanSiembra[]>([]);
  const [analisis, setAnalisis] = useState<AnalisisSuelo[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);

  const [analisisDialogOpen, setAnalisisDialogOpen] = useState(false);
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState<PlanSiembra | null>(null);

  const [loteSeleccionado, setLoteSeleccionado] = useState("");

  const [analisisForm, setAnalisisForm] = useState({
    loteId: "",
    fechaAnalisis: new Date().toISOString().split("T")[0],
    pH: "",
    materiaOrganica: "",
    nitrogeno: "",
    fosforo: "",
    potasio: "",
    observaciones: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchPlanes(), fetchAnalisis(), fetchLotes()]);
    setLoading(false);
  };

  const fetchPlanes = async () => {
    try {
      const response = await fetch("/api/planes-siembra");
      if (response.ok) {
        const data = await response.json();
        setPlanes(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchAnalisis = async () => {
    try {
      const response = await fetch("/api/analisis-suelo");
      if (response.ok) {
        const data = await response.json();
        setAnalisis(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchLotes = async () => {
    try {
      const response = await fetch("/api/lotes");
      if (response.ok) {
        const data = await response.json();
        setLotes(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const generarPlanes = async () => {
    if (!loteSeleccionado) {
      alert("Seleccioná un lote primero");
      return;
    }

    if (!confirm("¿Generar plan de siembra con IA? Esto puede tomar unos segundos.")) {
      return;
    }

    try {
      setGenerando(true);
      const response = await fetch("/api/planes-siembra/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loteId: loteSeleccionado }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.mensaje);
        fetchPlanes();
      } else {
        const error = await response.json();
        alert(error.error || "Error al generar planes");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar planes");
    } finally {
      setGenerando(false);
    }
  };

  const handleCreateAnalisis = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/analisis-suelo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analisisForm),
      });

      if (response.ok) {
        setAnalisisDialogOpen(false);
        setAnalisisForm({
          loteId: "",
          fechaAnalisis: new Date().toISOString().split("T")[0],
          pH: "",
          materiaOrganica: "",
          nitrogeno: "",
          fosforo: "",
          potasio: "",
          observaciones: "",
        });
        fetchAnalisis();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const cambiarEstadoPlan = async (id: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/planes-siembra/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (response.ok) {
        fetchPlanes();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarPlan = async (id: string) => {
    if (!confirm("¿Eliminar este plan?")) return;
    try {
      const response = await fetch(`/api/planes-siembra/${id}`, { method: "DELETE" });
      if (response.ok) fetchPlanes();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarAnalisis = async (id: string) => {
    if (!confirm("¿Eliminar este análisis?")) return;
    try {
      const response = await fetch(`/api/analisis-suelo/${id}`, { method: "DELETE" });
      if (response.ok) fetchAnalisis();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const planesPlanificados = planes.filter(p => p.estado === "Planificado").length;
  const planesAprobados = planes.filter(p => p.estado === "Aprobado").length;
  const margenPromedioEstimado = planes.length > 0
    ? planes.reduce((sum, p) => sum + (p.margenEstimado || 0), 0) / planes.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planificación de Siembras Inteligente</h1>
          <p className="text-gray-600 mt-2">
            Análisis predictivo y recomendaciones con IA
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Planes Generados
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planes.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total histórico</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Planificados
            </CardTitle>
            <Sprout className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{planesPlanificados}</div>
            <p className="text-xs text-gray-500 mt-1">Pendientes de aprobación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Aprobados
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{planesAprobados}</div>
            <p className="text-xs text-gray-500 mt-1">Listos para ejecutar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Margen Estimado Promedio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${margenPromedioEstimado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${margenPromedioEstimado.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Por lote</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="planes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="planes">Planes de Siembra</TabsTrigger>
          <TabsTrigger value="analisis">Análisis de Suelo</TabsTrigger>
        </TabsList>

        {/* TAB PLANES */}
        <TabsContent value="planes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Planes de Siembra Inteligentes</CardTitle>
                <CardDescription>Recomendaciones generadas por IA</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={loteSeleccionado} onValueChange={setLoteSeleccionado}>
                  <SelectTrigger className="w-[200px]">
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
                <Button
                  onClick={generarPlanes}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={generando || !loteSeleccionado}
                >
                  {generando ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generar Plan IA
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : planes.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 mx-auto text-purple-400" />
                  <p className="text-gray-500 mt-4 mb-4">No hay planes generados</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Seleccioná un lote y generá tu primer plan con IA
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {planes.map((plan) => {
                    const analisisData = plan.analisisIA ? JSON.parse(plan.analisisIA) : null;
                    
                    return (
                      <Card key={plan.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-lg">{plan.cultivo}</CardTitle>
                                {plan.variedad && (
                                  <Badge variant="outline">{plan.variedad}</Badge>
                                )}
                                <Badge
                                  className={
                                    plan.estado === "Planificado"
                                      ? "bg-orange-100 text-orange-800"
                                      : plan.estado === "Aprobado"
                                      ? "bg-green-100 text-green-800"
                                      : plan.estado === "Sembrado"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {plan.estado}
                                </Badge>
                                {plan.confianza && (
                                  <Badge variant="secondary">
                                    Confianza: {plan.confianza}%
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {plan.lote.nombre} • {plan.hectareas} ha
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPlanSeleccionado(plan);
                                  setDetalleDialogOpen(true);
                                }}
                              >
                                Ver Detalle
                              </Button>
                              {plan.estado === "Planificado" && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => cambiarEstadoPlan(plan.id, "Aprobado")}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Aprobar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => eliminarPlan(plan.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Siembra</p>
                              <p className="text-sm font-medium">
                                {formatDate(plan.fechaSiembraRecomendada)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Cosecha</p>
                              <p className="text-sm font-medium">
                                {formatDate(plan.fechaCosechaEstimada)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Rendimiento</p>
                              <p className="text-sm font-medium">
                                {plan.rendimientoEstimado?.toLocaleString() || "-"} kg/ha
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Costo Total</p>
                              <p className="text-sm font-medium text-red-600">
                                ${plan.costoEstimado?.toLocaleString() || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Margen Estimado</p>
                              <p className={`text-sm font-medium ${(plan.margenEstimado || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${plan.margenEstimado?.toLocaleString() || "-"}
                              </p>
                            </div>
                          </div>
                          {analisisData?.justificacion && (
                            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <p className="text-sm text-purple-900">
                                <strong className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4" />
                                  Justificación IA:
                                </strong>
                                <span className="text-purple-800 mt-1 block">
                                  {analisisData.justificacion}
                                </span>
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB ANÁLISIS */}
        <TabsContent value="analisis">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Análisis de Suelo</CardTitle>
                <CardDescription>Historial de análisis químicos del suelo</CardDescription>
              </div>
              <Dialog open={analisisDialogOpen} onOpenChange={setAnalisisDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={lotes.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Análisis
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateAnalisis}>
                    <DialogHeader>
                      <DialogTitle>Registrar Análisis de Suelo</DialogTitle>
                      <DialogDescription>
                        Ingresá los resultados del laboratorio
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Lote *</Label>
                          <Select
                            value={analisisForm.loteId}
                            onValueChange={(value) => setAnalisisForm({ ...analisisForm, loteId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
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
                          <Label>Fecha *</Label>
                          <Input
                            type="date"
                            value={analisisForm.fechaAnalisis}
                            onChange={(e) => setAnalisisForm({ ...analisisForm, fechaAnalisis: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>pH</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="6.5"
                            value={analisisForm.pH}
                            onChange={(e) => setAnalisisForm({ ...analisisForm, pH: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Materia Orgánica (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="3.5"
                            value={analisisForm.materiaOrganica}
                            onChange={(e) => setAnalisisForm({ ...analisisForm, materiaOrganica: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>N (ppm)</Label>
                          <Input
                            type="number"
                            step="1"
                            placeholder="25"
                            value={analisisForm.nitrogeno}
                            onChange={(e) => setAnalisisForm({ ...analisisForm, nitrogeno: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>P (ppm)</Label>
                          <Input
                            type="number"
                            step="1"
                            placeholder="15"
                            value={analisisForm.fosforo}
                            onChange={(e) => setAnalisisForm({ ...analisisForm, fosforo: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>K (ppm)</Label>
                          <Input
                            type="number"
                            step="1"
                            placeholder="120"
                            value={analisisForm.potasio}
                            onChange={(e) => setAnalisisForm({ ...analisisForm, potasio: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Observaciones</Label>
                        <Textarea
                          placeholder="Notas adicionales"
                          value={analisisForm.observaciones}
                          onChange={(e) => setAnalisisForm({ ...analisisForm, observaciones: e.target.value })}
                          rows={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setAnalisisDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Guardar
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : analisis.length === 0 ? (
                <div className="text-center py-8">
                  <TestTube className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-4 mb-4">No hay análisis registrados</p>
                  {lotes.length === 0 ? (
                    <p className="text-sm text-gray-400">Primero creá lotes en Agronomía</p>
                  ) : (
                    <Button onClick={() => setAnalisisDialogOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar primer análisis
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {analisis.map((a) => (
                    <Card key={a.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{a.lote.nombre}</CardTitle>
                            <p className="text-sm text-gray-500">{formatDate(a.fechaAnalisis)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarAnalisis(a.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500">pH</p>
                            <p className="text-sm font-medium">{a.pH || "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">M.O. (%)</p>
                            <p className="text-sm font-medium">{a.materiaOrganica || "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">N (ppm)</p>
                            <p className="text-sm font-medium">{a.nitrogeno || "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">P (ppm)</p>
                            <p className="text-sm font-medium">{a.fosforo || "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">K (ppm)</p>
                            <p className="text-sm font-medium">{a.potasio || "-"}</p>
                          </div>
                        </div>
                        {a.recomendaciones && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Recomendaciones:
                            </p>
                            <p className="text-sm text-blue-800 mt-1">{a.recomendaciones}</p>
                          </div>
                        )}
                        {a.observaciones && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Obs:</strong> {a.observaciones}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Detalle del Plan */}
      <Dialog open={detalleDialogOpen} onOpenChange={setDetalleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Plan de Siembra</DialogTitle>
            <DialogDescription>
              Análisis completo generado por IA
            </DialogDescription>
          </DialogHeader>
          {planSeleccionado && (() => {
            const analisisData = planSeleccionado.analisisIA ? JSON.parse(planSeleccionado.analisisIA) : null;
            
            return (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{planSeleccionado.cultivo}</h3>
                  <p className="text-sm text-gray-600">
                    {planSeleccionado.lote.nombre} • {planSeleccionado.hectareas} ha
                  </p>
                </div>

                {analisisData?.justificacion && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-900 mb-2">📊 Justificación:</p>
                    <p className="text-sm text-purple-800">{analisisData.justificacion}</p>
                  </div>
                )}

                {analisisData?.beneficiosRotacion && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-900 mb-2">🌱 Beneficios de Rotación:</p>
                    <p className="text-sm text-green-800">{analisisData.beneficiosRotacion}</p>
                  </div>
                )}

                {analisisData?.riesgos && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="font-medium text-orange-900 mb-2">⚠️ Riesgos:</p>
                    <p className="text-sm text-orange-800">{analisisData.riesgos}</p>
                  </div>
                )}

                {analisisData?.recomendacionesManejo && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900 mb-2">💡 Recomendaciones de Manejo:</p>
                    <p className="text-sm text-blue-800">{analisisData.recomendacionesManejo}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Costo por Ha</p>
                    <p className="text-lg font-bold text-red-600">
                      ${analisisData?.costoEstimadoPorHa?.toLocaleString() || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ingreso por Ha</p>
                    <p className="text-lg font-bold text-green-600">
                      ${analisisData?.ingresoEstimadoPorHa?.toLocaleString() || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Margen por Ha</p>
                    <p className="text-lg font-bold text-blue-600">
                      ${analisisData?.margenEstimadoPorHa?.toLocaleString() || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Margen Total</p>
                    <p className="text-lg font-bold text-purple-600">
                      ${planSeleccionado.margenEstimado?.toLocaleString() || "-"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button onClick={() => setDetalleDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-purple-900">¿Cómo funciona la planificación inteligente?</p>
              <p className="text-sm text-purple-700 mt-1">
                El sistema analiza tu historial de siembras, cosechas, análisis de suelo y datos climáticos
                para recomendar el mejor cultivo, fechas óptimas de siembra/cosecha, y estimar costos, ingresos
                y márgenes. Usa IA para considerar rotación de cultivos y salud del suelo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}