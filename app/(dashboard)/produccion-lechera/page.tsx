"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icon } from "@/components/mc";
import { 
  Droplets, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Award,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#5e7733", "#1a5fa0", "#475569", "#c08a22", "#d9a538"];

export default function ProduccionLecheraPage() {
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [prediccion, setPrediccion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generandoPrediccion, setGenerandoPrediccion] = useState(false);
  const [periodo, setPeriodo] = useState("30");

  useEffect(() => {
    fetchEstadisticas();
  }, [periodo]);

  const fetchEstadisticas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/produccion-lechera/estadisticas?dias=${periodo}`);
      if (response.ok) {
        const data = await response.json();
        setEstadisticas(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generarPrediccion = async () => {
    try {
      setGenerandoPrediccion(true);
      const response = await fetch("/api/produccion-lechera/prediccion", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setPrediccion(data);
      } else {
        const error = await response.json();
        alert(error.error || "Error al generar predicción");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar predicción");
    } finally {
      setGenerandoPrediccion(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div className="text-center py-12">
        <Droplets className="h-16 w-16 mx-auto text-blue-400 mb-4" />
        <p className="text-gray-600">No hay datos de producción lechera</p>
        <p className="text-sm text-gray-500 mt-2">
          Registrá producción en Ganadería → Producción Lechera
        </p>
      </div>
    );
  }

  const { resumen, serieProduccion, produccionPorTurno, topAnimales, alertas } = estadisticas;

  // Preparar datos para gráficos
  const dataTurnos = Object.entries(produccionPorTurno).map(([turno, litros]) => ({
    turno,
    litros: Math.round(litros as number),
  }));

  // Combinar datos históricos con predicción
  const dataCombinada = [...serieProduccion];
  if (prediccion?.prediccion) {
    prediccion.prediccion.forEach((p: any) => {
      dataCombinada.push({
        fecha: p.fecha,
        litros: null,
        litrosPredichos: p.litrosPredichos,
        limiteInferior: p.limiteInferior,
        limiteSuperior: p.limiteSuperior,
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Producción Lechera</h1>
          <p className="text-gray-600 mt-2">
            Monitoreo en tiempo real y análisis predictivo
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={generarPrediccion}
            className="bg-[#5e7733] hover:bg-[#4a5e29] text-white"
            disabled={generandoPrediccion || resumen.totalRegistros < 7}
          >
            {generandoPrediccion ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Predicción IA
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {alertas && alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((alerta: any, idx: number) => (
            <Alert
              key={idx}
              className={`border-2 ${
                alerta.severidad === "Crítica"
                  ? "border-red-500 bg-red-50"
                  : alerta.severidad === "Alta"
                  ? "border-orange-500 bg-orange-50"
                  : "border-yellow-500 bg-yellow-50"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alerta.tipo}</AlertTitle>
              <AlertDescription>{alerta.mensaje}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Producido
            </CardTitle>
            <Droplets className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.totalLitros.toLocaleString()}L</div>
            <p className="text-xs text-gray-500 mt-1">Últimos {periodo} días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Promedio Diario
            </CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.promedioLitros}L</div>
            <p className="text-xs text-gray-500 mt-1">Por ordeñe</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Calidad Promedio
            </CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {resumen.promedioGrasa ? `Grasa: ${resumen.promedioGrasa}%` : "-"}
            </div>
            <div className="text-sm font-bold">
              {resumen.promedioProteina ? `Proteína: ${resumen.promedioProteina}%` : "-"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {resumen.promedioSCC ? `SCC: ${Math.round(resumen.promedioSCC / 1000)}k` : "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Registros
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.totalRegistros}</div>
            <p className="text-xs text-gray-500 mt-1">Ordeñes registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Producción Diaria</CardTitle>
          <CardDescription>
            {prediccion ? "Histórico y Predicción IA" : "Serie temporal histórica"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dataCombinada}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="fecha" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('es')}
                formatter={(value: any) => [`${Math.round(value)}L`, '']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="litros" 
                stroke="#1a5fa0" 
                strokeWidth={2}
                name="Producción Real"
                dot={{ r: 4 }}
              />
              {prediccion && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="litrosPredichos" 
                    stroke="#475569" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Predicción IA"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="limiteInferior" 
                    stroke="#d5d9d2" 
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    name="Límite Inferior"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="limiteSuperior" 
                    stroke="#d5d9d2" 
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    name="Límite Superior"
                    dot={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Producción por Turno */}
        <Card>
          <CardHeader>
            <CardTitle>Producción por Turno</CardTitle>
            <CardDescription>Distribución de ordeñe</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataTurnos}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.turno}: ${((entry.litros / dataTurnos.reduce((sum, d) => sum + d.litros, 0)) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#768f44"
                  dataKey="litros"
                >
                  {dataTurnos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value}L`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Productoras */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Productoras</CardTitle>
            <CardDescription>Animales con mayor producción</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topAnimales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="caravana" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(value: any) => `${Math.round(value)}L`} />
                <Bar dataKey="litros" fill="#5e7733" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análisis de Predicción */}
      {prediccion && (
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-900">Análisis Predictivo IA</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-purple-900">Tendencia:</p>
              <Badge className={`mt-1 ${
                prediccion.tendencia === "Creciente" 
                  ? "bg-green-100 text-green-800" 
                  : prediccion.tendencia === "Decreciente"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}>
                {prediccion.tendencia === "Creciente" && <TrendingUp className="h-3 w-3 mr-1" />}
                {prediccion.tendencia === "Decreciente" && <TrendingDown className="h-3 w-3 mr-1" />}
                {prediccion.tendencia}
              </Badge>
            </div>

            {prediccion.analisis && (
              <div className="p-3 bg-white rounded-lg border border-purple-200">
                <p className="font-medium text-purple-900 text-sm inline-flex items-center gap-1"><Icon name="chart" size={14} /> Análisis:</p>
                <p className="text-sm text-purple-800 mt-1">{prediccion.analisis}</p>
              </div>
            )}

            {prediccion.factoresRiesgo && prediccion.factoresRiesgo.length > 0 && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="font-medium text-orange-900 text-sm inline-flex items-center gap-1"><Icon name="alert" size={14} /> Factores de Riesgo:</p>
                <ul className="text-sm text-orange-800 mt-1 list-disc list-inside">
                  {prediccion.factoresRiesgo.map((factor: string, idx: number) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}

            {prediccion.recomendaciones && prediccion.recomendaciones.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="font-medium text-green-900 text-sm inline-flex items-center gap-1"><Icon name="bolt" size={14} /> Recomendaciones:</p>
                <ul className="text-sm text-green-800 mt-1 list-disc list-inside">
                  {prediccion.recomendaciones.map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Droplets className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Dashboard en Tiempo Real</p>
              <p className="text-sm text-blue-700 mt-1">
                Monitoreá tu producción lechera, detectá anomalías automáticamente y recibí predicciones
                generadas por IA basadas en tu historial. Los datos se actualizan cada vez que registrás
                un nuevo ordeñe.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}