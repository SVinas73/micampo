"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  RefreshCw,
  TrendingUp,
  Droplets,
  Heart,
  DollarSign,
  Cloud,
  Filter,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Alerta = {
  id: string;
  tipo: string;
  severidad: string;
  titulo: string;
  descripcion: string;
  recomendacion: string;
  entidad: string | null;
  entidadId: string | null;
  entidadNombre: string | null;
  fechaDeteccion: string;
  estado: string;
  metadata: string | null;
};

const SEVERIDAD_CONFIG = {
  Crítica: {
    color: "bg-red-100 text-red-800 border-red-300",
    icon: AlertTriangle,
    iconColor: "text-red-600",
  },
  Alta: {
    color: "bg-orange-100 text-orange-800 border-orange-300",
    icon: AlertTriangle,
    iconColor: "text-orange-600",
  },
  Media: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
  },
  Baja: {
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: AlertTriangle,
    iconColor: "text-blue-600",
  },
};

const TIPO_CONFIG = {
  Enfermedad: { icon: Heart, color: "text-red-600" },
  Clima: { icon: Cloud, color: "text-blue-600" },
  Nutrición: { icon: Droplets, color: "text-green-600" },
  Reproducción: { icon: TrendingUp, color: "text-purple-600" },
  Financiero: { icon: DollarSign, color: "text-orange-600" },
};

export default function AlertasPredictivasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>("Activa");
  const [filtroTipo, setFiltroTipo] = useState<string>("Todos");

  useEffect(() => {
    fetchAlertas();
  }, [filtroEstado, filtroTipo]);

  const fetchAlertas = async () => {
    try {
      setLoading(true);
      let url = "/api/alertas-predictivas";
      const params = new URLSearchParams();
      
      if (filtroEstado !== "Todas") {
        params.append("estado", filtroEstado);
      }
      
      if (filtroTipo !== "Todos") {
        params.append("tipo", filtroTipo);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAlertas(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generarAlertas = async () => {
    if (!confirm("¿Generar nuevas alertas con IA? Esto puede tomar unos segundos.")) {
      return;
    }

    try {
      setGenerando(true);
      const response = await fetch("/api/alertas-predictivas/generar", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.mensaje}`);
        fetchAlertas();
      } else {
        const error = await response.json();
        alert(error.error || "Error al generar alertas");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar alertas");
    } finally {
      setGenerando(false);
    }
  };

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/alertas-predictivas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (response.ok) {
        fetchAlertas();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarAlerta = async (id: string) => {
    if (!confirm("¿Eliminar esta alerta?")) return;
    try {
      const response = await fetch(`/api/alertas-predictivas/${id}`, {
        method: "DELETE",
      });
      if (response.ok) fetchAlertas();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const alertasActivas = alertas.filter((a) => a.estado === "Activa");
  const alertasCriticas = alertasActivas.filter((a) => a.severidad === "Crítica").length;
  const alertasAltas = alertasActivas.filter((a) => a.severidad === "Alta").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alertas Predictivas con IA</h1>
          <p className="text-gray-600 mt-2">
            Análisis inteligente de riesgos y recomendaciones
          </p>
        </div>
        <Button
          onClick={generarAlertas}
          className="bg-purple-600 hover:bg-purple-700"
          disabled={generando}
        >
          {generando ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generar Alertas IA
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Alertas Activas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertasActivas.length}</div>
            <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Críticas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertasCriticas}</div>
            <p className="text-xs text-gray-500 mt-1">Acción inmediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Altas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alertasAltas}</div>
            <p className="text-xs text-gray-500 mt-1">Urgente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Alertas
            </CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertas.length}</div>
            <p className="text-xs text-gray-500 mt-1">Historial completo</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              <SelectItem value="Activa">Activas</SelectItem>
              <SelectItem value="Resuelta">Resueltas</SelectItem>
              <SelectItem value="Ignorada">Ignoradas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos los tipos</SelectItem>
            <SelectItem value="Enfermedad">Enfermedad</SelectItem>
            <SelectItem value="Clima">Clima</SelectItem>
            <SelectItem value="Nutrición">Nutrición</SelectItem>
            <SelectItem value="Reproducción">Reproducción</SelectItem>
            <SelectItem value="Financiero">Financiero</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alertas Detectadas</CardTitle>
          <CardDescription>
            Análisis predictivo basado en IA de datos históricos y patrones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Cargando alertas...</p>
            </div>
          ) : alertas.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto text-purple-400" />
              <p className="text-gray-500 mt-4 mb-4">No hay alertas generadas</p>
              <Button onClick={generarAlertas} variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Generar primera análisis con IA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {alertas.map((alerta) => {
                const SeveridadIcon = SEVERIDAD_CONFIG[alerta.severidad as keyof typeof SEVERIDAD_CONFIG]?.icon || AlertTriangle;
                const TipoIcon = TIPO_CONFIG[alerta.tipo as keyof typeof TIPO_CONFIG]?.icon || AlertTriangle;
                const severidadConfig = SEVERIDAD_CONFIG[alerta.severidad as keyof typeof SEVERIDAD_CONFIG];
                const tipoConfig = TIPO_CONFIG[alerta.tipo as keyof typeof TIPO_CONFIG];

                return (
                  <Alert key={alerta.id} className={`border-2 ${severidadConfig?.color || ""}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <SeveridadIcon className={`h-5 w-5 ${severidadConfig?.iconColor}`} />
                          <AlertTitle className="text-lg font-semibold">
                            {alerta.titulo}
                          </AlertTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <TipoIcon className={`h-3 w-3 ${tipoConfig?.color}`} />
                              {alerta.tipo}
                            </Badge>
                            {alerta.entidadNombre && (
                              <Badge variant="secondary">
                                {alerta.entidad}: {alerta.entidadNombre}
                              </Badge>
                            )}
                            <Badge
                              className={
                                alerta.estado === "Activa"
                                  ? "bg-orange-100 text-orange-800"
                                  : alerta.estado === "Resuelta"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {alerta.estado}
                            </Badge>
                          </div>
                        </div>

                        <AlertDescription className="space-y-3">
                          <div>
                            <p className="font-medium text-sm text-gray-600">Descripción:</p>
                            <p className="text-sm mt-1">{alerta.descripcion}</p>
                          </div>

                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="font-medium text-sm text-blue-900 flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              Recomendación IA:
                            </p>
                            <p className="text-sm mt-1 text-blue-800">{alerta.recomendacion}</p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Detectada: {formatDate(alerta.fechaDeteccion)}</span>
                            {alerta.metadata && JSON.parse(alerta.metadata).confianza && (
                              <span>
                                Confianza: {JSON.parse(alerta.metadata).confianza}%
                              </span>
                            )}
                          </div>

                          {alerta.estado === "Activa" && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => cambiarEstado(alerta.id, "Resuelta")}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Marcar Resuelta
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-gray-600 border-gray-600 hover:bg-gray-50"
                                onClick={() => cambiarEstado(alerta.id, "Ignorada")}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Ignorar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => eliminarAlerta(alerta.id)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-purple-900">¿Cómo funciona?</p>
              <p className="text-sm text-purple-700 mt-1">
                El sistema analiza automáticamente tus datos históricos (cosechas, eventos sanitarios,
                registros de peso, producción lechera, costos) usando IA para detectar patrones anómalos,
                predecir riesgos potenciales y generar recomendaciones accionables. Hacé clic en "Generar
                Alertas IA" para ejecutar un nuevo análisis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}