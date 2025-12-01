"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

type ImagenSatelital = {
  id: string;
  fecha: string;
  fuente: string;
  tipoIndice: string;
  ndviPromedio: number | null;
  ndviMin: number | null;
  ndviMax: number | null;
  areaVerde: number | null;
  areaProblema: number | null;
  nubosidad: number | null;
};

type AnalizadorNDVIProps = {
  imagen: ImagenSatelital;
};

export default function AnalizadorNDVI({ imagen }: AnalizadorNDVIProps) {
  const getNDVIColor = (ndvi: number) => {
    if (ndvi >= 0.7) return "text-green-700";
    if (ndvi >= 0.5) return "text-green-500";
    if (ndvi >= 0.3) return "text-yellow-600";
    return "text-red-600";
  };

  const getNDVIStatus = (ndvi: number) => {
    if (ndvi >= 0.7) return { label: "Excelente", color: "bg-green-500" };
    if (ndvi >= 0.5) return { label: "Bueno", color: "bg-green-400" };
    if (ndvi >= 0.3) return { label: "Regular", color: "bg-yellow-500" };
    return { label: "Bajo", color: "bg-red-500" };
  };

  const getRecomendacion = (ndvi: number) => {
    if (ndvi >= 0.7)
      return "Cultivo en excelente estado. Mantener prácticas actuales.";
    if (ndvi >= 0.5)
      return "Cultivo saludable. Monitorear evolución.";
    if (ndvi >= 0.3)
      return "Cultivo con estrés moderado. Revisar riego y nutrición.";
    return "Cultivo con estrés severo. Requiere intervención inmediata.";
  };

  if (!imagen.ndviPromedio) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500 text-center">
            No hay datos de análisis NDVI disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  const status = getNDVIStatus(imagen.ndviPromedio);

  return (
    <div className="space-y-4">
      {/* Resumen Principal */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Análisis NDVI</CardTitle>
            <Badge className={`${status.color} text-white`}>{status.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Promedio</p>
              <p className={`text-3xl font-bold ${getNDVIColor(imagen.ndviPromedio)}`}>
                {imagen.ndviPromedio.toFixed(3)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Mínimo</p>
              <p className={`text-2xl font-bold ${getNDVIColor(imagen.ndviMin || 0)}`}>
                {imagen.ndviMin?.toFixed(3) || "-"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Máximo</p>
              <p className={`text-2xl font-bold ${getNDVIColor(imagen.ndviMax || 0)}`}>
                {imagen.ndviMax?.toFixed(3) || "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribución de Áreas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribución de Salud</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Área Saludable</span>
              </div>
              <span className="text-sm font-bold text-green-700">
                {imagen.areaVerde?.toFixed(1)}%
              </span>
            </div>
            <Progress value={imagen.areaVerde || 0} className="h-2 bg-gray-200">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${imagen.areaVerde}%` }}
              />
            </Progress>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Área con Problemas</span>
              </div>
              <span className="text-sm font-bold text-orange-700">
                {imagen.areaProblema?.toFixed(1)}%
              </span>
            </div>
            <Progress value={imagen.areaProblema || 0} className="h-2 bg-gray-200">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${imagen.areaProblema}%` }}
              />
            </Progress>
          </div>
        </CardContent>
      </Card>

      {/* Recomendación */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-1">Recomendación</p>
              <p className="text-sm text-blue-700">
                {getRecomendacion(imagen.ndviPromedio)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadatos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información Técnica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Fuente</p>
              <p className="font-medium">{imagen.fuente}</p>
            </div>
            <div>
              <p className="text-gray-600">Índice</p>
              <p className="font-medium">{imagen.tipoIndice}</p>
            </div>
            <div>
              <p className="text-gray-600">Fecha</p>
              <p className="font-medium">
                {new Date(imagen.fecha).toLocaleDateString("es")}
              </p>
            </div>
            {imagen.nubosidad !== null && (
              <div>
                <p className="text-gray-600">Nubosidad</p>
                <p className="font-medium">{imagen.nubosidad.toFixed(1)}%</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Escala NDVI */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Escala NDVI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-sm">-1.0 a 0.2: Sin vegetación</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm">0.2 a 0.5: Vegetación enferma/estresada</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-400 rounded"></div>
              <span className="text-sm">0.5 a 0.7: Vegetación moderadamente saludable</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-700 rounded"></div>
              <span className="text-sm">0.7 a 1.0: Vegetación muy saludable</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}