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
import { Cloud, AlertTriangle, CloudRain, Wind, Droplets, Plus, Trash2, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

type AlertaClimatica = {
  id: string;
  tipo: string;
  severidad: string;
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string | null;
  temperatura: number | null;
  precipitacion: number | null;
  viento: number | null;
  humedad: number | null;
  ubicacion: string;
  recomendacion: string | null;
  leida: boolean;
};

type ClimaActual = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
  };
};

const TIPOS_ALERTA = ["Helada", "Lluvia", "Viento", "Temperatura", "Sequía", "Tormenta"];
const SEVERIDADES = ["Baja", "Media", "Alta", "Extrema"];

export default function ClimaPage() {
  const [alertas, setAlertas] = useState<AlertaClimatica[]>([]);
  const [clima, setClima] = useState<ClimaActual | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingClima, setLoadingClima] = useState(false);

  const [alertaDialogOpen, setAlertaDialogOpen] = useState(false);

  const [alertaForm, setAlertaForm] = useState({
    tipo: "",
    severidad: "",
    titulo: "",
    descripcion: "",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
    temperatura: "",
    precipitacion: "",
    viento: "",
    humedad: "",
    ubicacion: "Montevideo, Uruguay",
    latitud: "-34.6037",
    longitud: "-58.3816",
    recomendacion: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchAlertas(), fetchClima()]);
    setLoading(false);
  };

  const fetchAlertas = async () => {
    try {
      const response = await fetch("/api/alertas-climaticas");
      if (response.ok) {
        const data = await response.json();
        setAlertas(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchClima = async () => {
    setLoadingClima(true);
    try {
      const response = await fetch("/api/clima");
      if (response.ok) {
        const data = await response.json();
        setClima(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoadingClima(false);
    }
  };

  const handleCreateAlerta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/alertas-climaticas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertaForm),
      });

      if (response.ok) {
        setAlertaDialogOpen(false);
        setAlertaForm({
          tipo: "",
          severidad: "",
          titulo: "",
          descripcion: "",
          fechaInicio: new Date().toISOString().split("T")[0],
          fechaFin: "",
          temperatura: "",
          precipitacion: "",
          viento: "",
          humedad: "",
          ubicacion: "Montevideo, Uruguay",
          latitud: "-34.6037",
          longitud: "-58.3816",
          recomendacion: "",
        });
        fetchAlertas();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleMarcarLeida = async (id: string) => {
    try {
      const response = await fetch(`/api/alertas-climaticas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leida: true }),
      });

      if (response.ok) {
        fetchAlertas();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteAlerta = async (id: string) => {
    if (!confirm("¿Eliminar esta alerta?")) return;
    try {
      const response = await fetch(`/api/alertas-climaticas/${id}`, { method: "DELETE" });
      if (response.ok) fetchAlertas();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const alertasNoLeidas = alertas.filter(a => !a.leida);
  const alertasActivas = alertas.filter(a => {
    const hoy = new Date();
    const inicio = new Date(a.fechaInicio);
    const fin = a.fechaFin ? new Date(a.fechaFin) : new Date(inicio.getTime() + 7 * 24 * 60 * 60 * 1000);
    return hoy >= inicio && hoy <= fin;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clima y Alertas</h1>
        <p className="text-gray-600 mt-2">
          Pronóstico meteorológico y alertas climáticas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Temperatura
            </CardTitle>
            <Cloud className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {loadingClima ? (
              <div className="text-xl">--°C</div>
            ) : (
              <div className="text-2xl font-bold">
                {clima?.current.temperature_2m.toFixed(1)}°C
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Precipitación
            </CardTitle>
            <CloudRain className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loadingClima ? (
              <div className="text-xl">-- mm</div>
            ) : (
              <div className="text-2xl font-bold">
                {clima?.current.precipitation.toFixed(1)} mm
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Viento
            </CardTitle>
            <Wind className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loadingClima ? (
              <div className="text-xl">-- km/h</div>
            ) : (
              <div className="text-2xl font-bold">
                {clima?.current.wind_speed_10m.toFixed(0)} km/h
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Velocidad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Alertas Activas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertasNoLeidas.length}</div>
            <p className="text-xs text-gray-500 mt-1">Sin leer</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pronostico" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pronostico">
            <Cloud className="h-4 w-4 mr-2" />
            Pronóstico
          </TabsTrigger>
          <TabsTrigger value="alertas">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alertas ({alertasNoLeidas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pronostico">
          <Card>
            <CardHeader>
              <CardTitle>Pronóstico 7 Días</CardTitle>
              <CardDescription>Montevideo, Uruguay</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingClima ? (
                <div className="text-center py-8">Cargando pronóstico...</div>
              ) : clima ? (
                <div className="space-y-3">
                  {clima.daily.time.map((fecha, index) => (
                    <div key={fecha} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{new Date(fecha).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                        <p className="text-sm text-gray-500">
                          Prob. lluvia: {clima.daily.precipitation_probability_max[index]}%
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <CloudRain className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">{clima.daily.precipitation_sum[index]} mm</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Máx</p>
                          <p className="text-lg font-bold text-orange-600">
                            {clima.daily.temperature_2m_max[index].toFixed(0)}°
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Mín</p>
                          <p className="text-lg font-bold text-blue-600">
                            {clima.daily.temperature_2m_min[index].toFixed(0)}°
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No se pudo cargar el pronóstico</p>
                  <Button onClick={fetchClima} variant="outline" className="mt-4">
                    Reintentar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Alertas Climáticas</CardTitle>
                <CardDescription>Alertas y recomendaciones</CardDescription>
              </div>
              <Dialog open={alertaDialogOpen} onOpenChange={setAlertaDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Alerta
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <form onSubmit={handleCreateAlerta}>
                    <DialogHeader>
                      <DialogTitle>Crear Alerta Climática</DialogTitle>
                      <DialogDescription>
                        Registrá una alerta meteorológica manual
                      </DialogDescription>
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
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIPOS_ALERTA.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
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
                              <SelectValue placeholder="Severidad" />
                            </SelectTrigger>
                            <SelectContent>
                              {SEVERIDADES.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Título *</Label>
                        <Input
                          placeholder="Ej: Alerta de helada"
                          value={alertaForm.titulo}
                          onChange={(e) => setAlertaForm({ ...alertaForm, titulo: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción *</Label>
                        <Textarea
                          placeholder="Descripción detallada"
                          value={alertaForm.descripcion}
                          onChange={(e) => setAlertaForm({ ...alertaForm, descripcion: e.target.value })}
                          required
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Fecha Inicio *</Label>
                          <Input
                            type="date"
                            value={alertaForm.fechaInicio}
                            onChange={(e) => setAlertaForm({ ...alertaForm, fechaInicio: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fecha Fin</Label>
                          <Input
                            type="date"
                            value={alertaForm.fechaFin}
                            onChange={(e) => setAlertaForm({ ...alertaForm, fechaFin: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Recomendación</Label>
                        <Textarea
                          placeholder="Acciones recomendadas"
                          value={alertaForm.recomendacion}
                          onChange={(e) => setAlertaForm({ ...alertaForm, recomendacion: e.target.value })}
                          rows={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setAlertaDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Crear Alerta
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : alertas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay alertas registradas</p>
                  <Button onClick={() => setAlertaDialogOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primera alerta
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertas.map((alerta) => (
                    <Card key={alerta.id} className={alerta.leida ? "bg-gray-50" : "border-l-4 border-l-orange-500"}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{alerta.titulo}</CardTitle>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                alerta.severidad === "Extrema" ? "bg-red-100 text-red-800" :
                                alerta.severidad === "Alta" ? "bg-orange-100 text-orange-800" :
                                alerta.severidad === "Media" ? "bg-yellow-100 text-yellow-800" :
                                "bg-blue-100 text-blue-800"
                              }`}>
                                {alerta.severidad}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {alerta.tipo}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(alerta.fechaInicio)} {alerta.fechaFin && `- ${formatDate(alerta.fechaFin)}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {!alerta.leida && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMarcarLeida(alerta.id)}
                                title="Marcar como leída"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAlerta(alerta.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">{alerta.descripcion}</p>
                        {alerta.recomendacion && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                            <p className="text-sm font-medium text-blue-900">Recomendación:</p>
                            <p className="text-sm text-blue-800 mt-1">{alerta.recomendacion}</p>
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
      </Tabs>
    </div>
  );
}