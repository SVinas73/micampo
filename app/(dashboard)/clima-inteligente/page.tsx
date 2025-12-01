"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Sunrise,
  Sunset,
  AlertTriangle,
  RefreshCw,
  MapPin,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function ClimaInteligentePage() {
  const [climaData, setClimaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ubicacion, setUbicacion] = useState({ lat: "-34.9011", lon: "-56.1645" });

  useEffect(() => {
    fetchClima();
    const interval = setInterval(fetchClima, 300000); // Actualizar cada 5 min
    return () => clearInterval(interval);
  }, [ubicacion]);

  const fetchClima = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/clima/pronostico?lat=${ubicacion.lat}&lon=${ubicacion.lon}`
      );
      if (response.ok) {
        const data = await response.json();
        setClimaData(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerUbicacionActual = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUbicacion({
            lat: position.coords.latitude.toString(),
            lon: position.coords.longitude.toString(),
          });
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
          alert("No se pudo obtener tu ubicación");
        }
      );
    } else {
      alert("Geolocalización no soportada en tu navegador");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!climaData) {
    return (
      <div className="text-center py-12">
        <Cloud className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">No se pudieron obtener datos climáticos</p>
        <p className="text-sm text-gray-500 mt-2">
          Verificá tu API Key de OpenWeather en el archivo .env
        </p>
      </div>
    );
  }

  const { actual, pronostico, alertas, ubicacion: ubi } = climaData;

  const getIconoClima = (codigo: string) => {
    if (codigo.includes("01")) return <Sun className="h-12 w-12 text-yellow-500" />;
    if (codigo.includes("02") || codigo.includes("03") || codigo.includes("04"))
      return <Cloud className="h-12 w-12 text-gray-500" />;
    if (codigo.includes("09") || codigo.includes("10"))
      return <CloudRain className="h-12 w-12 text-blue-500" />;
    return <Cloud className="h-12 w-12 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clima Inteligente</h1>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {ubi.nombre}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={obtenerUbicacionActual}>
            <MapPin className="h-4 w-4 mr-2" />
            Mi Ubicación
          </Button>
          <Button onClick={fetchClima} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Alertas Agrícolas */}
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
              <AlertDescription>
                <p className="font-medium">{alerta.mensaje}</p>
                <p className="text-sm mt-1">💡 {alerta.recomendacion}</p>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Clima Actual */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center gap-6">
              {getIconoClima(actual.icono)}
              <div>
                <div className="text-6xl font-bold">{actual.temperatura}°</div>
                <p className="text-blue-100 text-lg capitalize">{actual.descripcion}</p>
                <p className="text-blue-200 text-sm">
                  Sensación: {actual.sensacionTermica}°
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                  <Thermometer className="h-4 w-4" />
                  Min/Máx
                </div>
                <p className="text-xl font-bold">
                  {actual.tempMin}° / {actual.tempMax}°
                </p>
              </div>

              <div className="bg-white/10 p-3 rounded-lg backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                  <Droplets className="h-4 w-4" />
                  Humedad
                </div>
                <p className="text-xl font-bold">{actual.humedad}%</p>
              </div>

              <div className="bg-white/10 p-3 rounded-lg backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                  <Wind className="h-4 w-4" />
                  Viento
                </div>
                <p className="text-xl font-bold">{actual.viento} km/h</p>
              </div>

              <div className="bg-white/10 p-3 rounded-lg backdrop-blur">
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                  <Eye className="h-4 w-4" />
                  Visibilidad
                </div>
                <p className="text-xl font-bold">{actual.visibilidad} km</p>
              </div>
            </div>
          </div>

          <div className="flex gap-6 mt-6 pt-6 border-t border-blue-400">
            <div className="flex items-center gap-2">
              <Sunrise className="h-5 w-5" />
              <div>
                <p className="text-blue-200 text-xs">Amanecer</p>
                <p className="font-medium">
                  {new Date(actual.amanecer * 1000).toLocaleTimeString("es", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sunset className="h-5 w-5" />
              <div>
                <p className="text-blue-200 text-xs">Atardecer</p>
                <p className="font-medium">
                  {new Date(actual.atardecer * 1000).toLocaleTimeString("es", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pronóstico 7 Días */}
      <Card>
        <CardHeader>
          <CardTitle>Pronóstico 7 Días</CardTitle>
          <CardDescription>Planificá tus labores agrícolas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-7">
            {pronostico.map((dia: any, idx: number) => (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium text-center mb-2">
                    {new Date(dia.fecha).toLocaleDateString("es", {
                      weekday: "short",
                      day: "numeric",
                    })}
                  </p>
                  <div className="flex justify-center mb-2">
                    {getIconoClima(dia.icono)}
                  </div>
                  <p className="text-center text-xs text-gray-600 mb-2 capitalize">
                    {dia.descripcion}
                  </p>
                  <div className="text-center">
                    <p className="text-lg font-bold">
                      {Math.round(dia.tempMax)}°
                    </p>
                    <p className="text-sm text-gray-500">
                      {Math.round(dia.tempMin)}°
                    </p>
                  </div>
                  {dia.lluvia > 0 && (
                    <div className="mt-2 text-center">
                      <Badge variant="outline" className="text-xs">
                        <Droplets className="h-3 w-3 mr-1" />
                        {dia.lluvia.toFixed(1)}mm
                      </Badge>
                    </div>
                  )}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Hum:</span>
                      <span>{dia.humedad}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Viento:</span>
                      <span>{Math.round(dia.viento * 3.6)} km/h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones Agrícolas */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900">Recomendaciones para Hoy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actual.temperatura > 30 && (
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Temperatura elevada</p>
                <p className="text-sm text-gray-600">
                  Considerá aumentar riego en cultivos y asegurar agua fresca para el ganado
                </p>
              </div>
            </div>
          )}

          {actual.humedad > 80 && (
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <Droplets className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Alta humedad</p>
                <p className="text-sm text-gray-600">
                  Aumenta riesgo de enfermedades fúngicas. Monitoreá cultivos
                </p>
              </div>
            </div>
          )}

          {actual.viento < 10 && actual.temperatura < 30 && (
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <Sun className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Condiciones ideales</p>
                <p className="text-sm text-gray-600">
                  Buen momento para aplicaciones de agroquímicos y labores de campo
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Cloud className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Datos en Tiempo Real</p>
              <p className="text-sm text-blue-700 mt-1">
                Los datos climáticos se actualizan cada 5 minutos desde OpenWeather.
                Las alertas agrícolas se generan automáticamente según las condiciones
                meteorológicas y mejores prácticas agropecuarias.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}