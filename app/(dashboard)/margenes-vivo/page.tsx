"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Target, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Lote = {
  id: string;
  nombre: string;
  hectareas: number;
  cultivo: string | null;
};

type Animal = {
  id: string;
  caravana: string;
  tipo: string;
};

type MargenLote = {
  loteId: string;
  nombre: string;
  hectareas: number;
  ingresos: number;
  costos: number;
  margen: number;
  margenPorcentaje: number;
  margenPorHa: number;
};

type MargenAnimal = {
  animalId: string;
  caravana: string;
  tipo: string;
  ingresos: number;
  costos: number;
  margen: number;
  margenPorcentaje: number;
};

export default function MargenesVivoPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [margenesLotes, setMargenesLotes] = useState<MargenLote[]>([]);
  const [margenesAnimales, setMargenesAnimales] = useState<MargenAnimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState<"lotes" | "animales">("lotes");

  useEffect(() => {
    fetchAll();
    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      calcularMargenesEnVivo();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchLotes(), fetchAnimales()]);
    await calcularMargenesEnVivo();
    setLoading(false);
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

  const fetchAnimales = async () => {
    try {
      const response = await fetch("/api/animales");
      if (response.ok) {
        const data = await response.json();
        setAnimales(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const calcularMargenesEnVivo = async () => {
    // Calcular márgenes de lotes
    const margenesLotesTemp: MargenLote[] = [];
    
    for (const lote of lotes) {
      try {
        // Obtener cosechas (ingresos)
        const cosechasRes = await fetch(`/api/cosechas?loteId=${lote.id}`);
        const cosechas = cosechasRes.ok ? await cosechasRes.json() : [];
        
        const ingresos = cosechas.reduce((sum: number, c: any) => {
          return sum + ((c.precioVenta || 0) * c.rendimiento);
        }, 0);

        // Obtener costos
        const costosRes = await fetch(`/api/costos-lote?loteId=${lote.id}`);
        const costos = costosRes.ok ? await costosRes.json() : [];
        
        const totalCostos = costos.reduce((sum: number, c: any) => sum + c.monto, 0);

        const margen = ingresos - totalCostos;
        const margenPorcentaje = ingresos > 0 ? (margen / ingresos) * 100 : 0;
        const margenPorHa = lote.hectareas > 0 ? margen / lote.hectareas : 0;

        margenesLotesTemp.push({
          loteId: lote.id,
          nombre: lote.nombre,
          hectareas: lote.hectareas,
          ingresos,
          costos: totalCostos,
          margen,
          margenPorcentaje,
          margenPorHa,
        });
      } catch (error) {
        console.error(`Error calculando margen para lote ${lote.nombre}:`, error);
      }
    }

    setMargenesLotes(margenesLotesTemp);

    // Calcular márgenes de animales
    const margenesAnimalesTemp: MargenAnimal[] = [];
    
    for (const animal of animales) {
      try {
        // Obtener movimientos de venta (ingresos)
        const movimientosRes = await fetch(`/api/movimientos?animalId=${animal.id}`);
        const movimientos = movimientosRes.ok ? await movimientosRes.json() : [];
        
        const ingresos = movimientos
          .filter((m: any) => m.tipo === "Venta")
          .reduce((sum: number, m: any) => sum + (m.monto || 0), 0);

        // Obtener costos
        const costosRes = await fetch(`/api/costos-animal?animalId=${animal.id}`);
        const costos = costosRes.ok ? await costosRes.json() : [];
        
        const totalCostos = costos.reduce((sum: number, c: any) => sum + c.monto, 0);

        const margen = ingresos - totalCostos;
        const margenPorcentaje = ingresos > 0 ? (margen / ingresos) * 100 : 0;

        margenesAnimalesTemp.push({
          animalId: animal.id,
          caravana: animal.caravana,
          tipo: animal.tipo,
          ingresos,
          costos: totalCostos,
          margen,
          margenPorcentaje,
        });
      } catch (error) {
        console.error(`Error calculando margen para animal ${animal.caravana}:`, error);
      }
    }

    setMargenesAnimales(margenesAnimalesTemp);
  };

  const totalIngresosLotes = margenesLotes.reduce((sum, m) => sum + m.ingresos, 0);
  const totalCostosLotes = margenesLotes.reduce((sum, m) => sum + m.costos, 0);
  const totalMargenLotes = totalIngresosLotes - totalCostosLotes;
  const margenPorcentajeLotes = totalIngresosLotes > 0 ? (totalMargenLotes / totalIngresosLotes) * 100 : 0;

  const totalIngresosAnimales = margenesAnimales.reduce((sum, m) => sum + m.ingresos, 0);
  const totalCostosAnimales = margenesAnimales.reduce((sum, m) => sum + m.costos, 0);
  const totalMargenAnimales = totalIngresosAnimales - totalCostosAnimales;
  const margenPorcentajeAnimales = totalIngresosAnimales > 0 ? (totalMargenAnimales / totalIngresosAnimales) * 100 : 0;

  const margenGlobalPorcentaje = (totalIngresosLotes + totalIngresosAnimales) > 0
    ? ((totalMargenLotes + totalMargenAnimales) / (totalIngresosLotes + totalIngresosAnimales)) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Márgenes Brutos en Vivo</h1>
          <p className="text-gray-600 mt-2">
            Rentabilidad actualizada en tiempo real
          </p>
        </div>
        <Button
          onClick={calcularMargenesEnVivo}
          className="bg-green-600 hover:bg-green-700"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Margen Global
            </CardTitle>
            {margenGlobalPorcentaje >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${margenGlobalPorcentaje >= 0 ? "text-green-600" : "text-red-600"}`}>
              {margenGlobalPorcentaje.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ${(totalMargenLotes + totalMargenAnimales).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Margen Agrícola
            </CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${margenPorcentajeLotes >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {margenPorcentajeLotes.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ${totalMargenLotes.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Margen Ganadero
            </CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${margenPorcentajeAnimales >= 0 ? "text-purple-600" : "text-red-600"}`}>
              {margenPorcentajeAnimales.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ${totalMargenAnimales.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(totalIngresosLotes + totalIngresosAnimales).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Costos: ${(totalCostosLotes + totalCostosAnimales).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <Select value={vistaActual} onValueChange={(value: any) => setVistaActual(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lotes">Márgenes por Lote</SelectItem>
            <SelectItem value="animales">Márgenes por Animal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {vistaActual === "lotes" && (
        <Card>
          <CardHeader>
            <CardTitle>Rentabilidad por Lote</CardTitle>
            <CardDescription>
              Márgenes brutos calculados en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Calculando márgenes...</div>
            ) : margenesLotes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay datos suficientes para calcular márgenes</p>
                <p className="text-sm text-gray-400 mt-2">
                  Necesitás registrar cosechas y costos en los lotes
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {margenesLotes
                  .sort((a, b) => b.margenPorcentaje - a.margenPorcentaje)
                  .map((margen) => (
                    <Card key={margen.loteId}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-lg">{margen.nombre}</p>
                              <span className="text-sm text-gray-500">
                                ({margen.hectareas} ha)
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Margen por ha: ${margen.margenPorHa.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-3xl font-bold ${margen.margenPorcentaje >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {margen.margenPorcentaje.toFixed(1)}%
                            </p>
                            <p className={`text-sm ${margen.margen >= 0 ? "text-green-600" : "text-red-600"}`}>
                              ${margen.margen.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-xs text-green-600 font-medium">Ingresos</p>
                            <p className="text-lg font-bold text-green-700">
                              ${margen.ingresos.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-red-50 p-3 rounded">
                            <p className="text-xs text-red-600 font-medium">Costos</p>
                            <p className="text-lg font-bold text-red-700">
                              ${margen.costos.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${margen.margenPorcentaje >= 0 ? "bg-green-600" : "bg-red-600"}`}
                              style={{
                                width: `${Math.min(Math.abs(margen.margenPorcentaje), 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {vistaActual === "animales" && (
        <Card>
          <CardHeader>
            <CardTitle>Rentabilidad por Animal</CardTitle>
            <CardDescription>
              Márgenes brutos calculados en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Calculando márgenes...</div>
            ) : margenesAnimales.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay datos suficientes para calcular márgenes</p>
                <p className="text-sm text-gray-400 mt-2">
                  Necesitás registrar ventas y costos en los animales
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {margenesAnimales
                  .sort((a, b) => b.margenPorcentaje - a.margenPorcentaje)
                  .map((margen) => (
                    <Card key={margen.animalId}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-lg">
                                Caravana {margen.caravana}
                              </p>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {margen.tipo}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-3xl font-bold ${margen.margenPorcentaje >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {margen.margenPorcentaje.toFixed(1)}%
                            </p>
                            <p className={`text-sm ${margen.margen >= 0 ? "text-green-600" : "text-red-600"}`}>
                              ${margen.margen.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-xs text-green-600 font-medium">Ingresos</p>
                            <p className="text-lg font-bold text-green-700">
                              ${margen.ingresos.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-red-50 p-3 rounded">
                            <p className="text-xs text-red-600 font-medium">Costos</p>
                            <p className="text-lg font-bold text-red-700">
                              ${margen.costos.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${margen.margenPorcentaje >= 0 ? "bg-green-600" : "bg-red-600"}`}
                              style={{
                                width: `${Math.min(Math.abs(margen.margenPorcentaje), 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Actualización Automática</p>
              <p className="text-sm text-blue-700 mt-1">
                Los márgenes se actualizan automáticamente cada 30 segundos y cada vez que se registra
                una nueva cosecha, venta o costo. Hacé clic en "Actualizar" para forzar el cálculo inmediato.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}