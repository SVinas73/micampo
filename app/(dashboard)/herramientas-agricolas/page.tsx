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
  CloudRain,
  Calculator,
  Trash2,
  Plus,
  TrendingUp,
  Droplets,
  DollarSign,
  Calendar,
  MapPin,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type RegistroPluviometrico = {
  id: string;
  fecha: string;
  milimetros: number;
  lote?: { nombre: string };
  ubicacion: string | null;
  metodo: string;
  observaciones: string | null;
};

type CalculoDosis = {
  id: string;
  nombre: string;
  tipoProducto: string;
  nombreProducto: string;
  dosisObjetivo: number;
  superficieHa: number;
  cantidadTotal: number;
  costoTotal: number | null;
  lote?: { nombre: string };
  createdAt: string;
};

export default function HerramientasAgricolasPage() {
  const [registrosLluvia, setRegistrosLluvia] = useState<RegistroPluviometrico[]>([]);
  const [calculosDosis, setCalculosDosis] = useState<CalculoDosis[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [lluviaDialogOpen, setLluviaDialogOpen] = useState(false);
  const [dosisDialogOpen, setDosisDialogOpen] = useState(false);

  const [lluviaForm, setLluviaForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    milimetros: "",
    loteId: "sin-lote",
    ubicacion: "",
    metodo: "Manual",
    observaciones: "",
  });

  const [dosisForm, setDosisForm] = useState({
    nombre: "",
    tipoProducto: "Fertilizante",
    nombreProducto: "",
    concentracion: "",
    dosisObjetivo: "",
    superficieHa: "",
    costoUnitario: "",
    aguaPorHa: "",
    loteId: "sin-lote",
    observaciones: "",
  });

  const [resultadoCalculo, setResultadoCalculo] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lluviaRes, dosisRes, lotesRes] = await Promise.all([
        fetch("/api/registro-pluviometrico?dias=90"),
        fetch("/api/calculadora-dosis"),
        fetch("/api/lotes"),
      ]);

      if (lluviaRes.ok) {
        const data = await lluviaRes.json();
        setRegistrosLluvia(data);
      }

      if (dosisRes.ok) {
        const data = await dosisRes.json();
        setCalculosDosis(data);
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

  const handleCreateLluvia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/registro-pluviometrico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lluviaForm,
          loteId: lluviaForm.loteId === "sin-lote" ? null : lluviaForm.loteId,
        }),
      });

      if (response.ok) {
        setLluviaDialogOpen(false);
        setLluviaForm({
          fecha: new Date().toISOString().split("T")[0],
          milimetros: "",
          loteId: "sin-lote",
          ubicacion: "",
          metodo: "Manual",
          observaciones: "",
        });
        fetchData();
        alert("Registro de lluvia guardado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar registro");
    }
  };

  const calcularDosis = () => {
    const dosisObj = parseFloat(dosisForm.dosisObjetivo);
    const superficie = parseFloat(dosisForm.superficieHa);
    const costoUnit = dosisForm.costoUnitario ? parseFloat(dosisForm.costoUnitario) : null;
    const aguaPorHa = dosisForm.aguaPorHa ? parseFloat(dosisForm.aguaPorHa) : null;

    if (!dosisObj || !superficie) {
      alert("Completá dosis objetivo y superficie");
      return;
    }

    const cantidadTotal = dosisObj * superficie;
    const costoTotal = costoUnit ? cantidadTotal * costoUnit : null;
    const aguaTotal = aguaPorHa ? aguaPorHa * superficie : null;

    setResultadoCalculo({
      cantidadTotal: cantidadTotal.toFixed(2),
      costoTotal: costoTotal ? costoTotal.toFixed(2) : null,
      aguaTotal: aguaTotal ? aguaTotal.toFixed(0) : null,
    });
  };

  const handleSaveDosis = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resultadoCalculo) {
      alert("Primero calculá la dosis");
      return;
    }

    try {
      const response = await fetch("/api/calculadora-dosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dosisForm,
          loteId: dosisForm.loteId === "sin-lote" ? null : dosisForm.loteId,
        }),
      });

      if (response.ok) {
        setDosisDialogOpen(false);
        setDosisForm({
          nombre: "",
          tipoProducto: "Fertilizante",
          nombreProducto: "",
          concentracion: "",
          dosisObjetivo: "",
          superficieHa: "",
          costoUnitario: "",
          aguaPorHa: "",
          loteId: "sin-lote",
          observaciones: "",
        });
        setResultadoCalculo(null);
        fetchData();
        alert("Cálculo de dosis guardado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar cálculo");
    }
  };

  const eliminarLluvia = async (id: string) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      const response = await fetch(`/api/registro-pluviometrico/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarDosis = async (id: string) => {
    if (!confirm("¿Eliminar este cálculo?")) return;
    try {
      const response = await fetch(`/api/calculadora-dosis/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Preparar datos para gráfico de lluvias
  const datosGraficoLluvia = registrosLluvia
    .slice(0, 30)
    .reverse()
    .map((r) => ({
      fecha: new Date(r.fecha).toLocaleDateString("es", {
        day: "2-digit",
        month: "2-digit",
      }),
      mm: r.milimetros,
    }));

  const totalLluvias = registrosLluvia.reduce((sum, r) => sum + r.milimetros, 0);
  const promedioLluvia = registrosLluvia.length > 0
    ? totalLluvias / registrosLluvia.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Herramientas Agrícolas</h1>
          <p className="text-gray-600 mt-2">
            Registro pluviométrico y calculadora de dosis
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Lluvias (90d)
            </CardTitle>
            <CloudRain className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLluvias.toFixed(1)} mm</div>
            <p className="text-xs text-gray-500 mt-1">
              {registrosLluvia.length} registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Promedio por Evento
            </CardTitle>
            <Droplets className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promedioLluvia.toFixed(1)} mm</div>
            <p className="text-xs text-gray-500 mt-1">Por registro</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Cálculos de Dosis
            </CardTitle>
            <Calculator className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculosDosis.length}</div>
            <p className="text-xs text-gray-500 mt-1">Guardados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Costo Total Insumos
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${calculosDosis
                .reduce((sum, c) => sum + (c.costoTotal || 0), 0)
                .toFixed(0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">USD calculados</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pluviometrico" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pluviometrico">
            <CloudRain className="h-4 w-4 mr-2" />
            Registro Pluviométrico
          </TabsTrigger>
          <TabsTrigger value="calculadora">
            <Calculator className="h-4 w-4 mr-2" />
            Calculadora de Dosis
          </TabsTrigger>
        </TabsList>

        {/* TAB: REGISTRO PLUVIOMÉTRICO */}
        <TabsContent value="pluviometrico" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Registro de Lluvias</h2>
            <Button onClick={() => setLluviaDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Lluvia
            </Button>
          </div>

          {/* Gráfico */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Lluvias (últimos 30 registros)</CardTitle>
            </CardHeader>
            <CardContent>
              {datosGraficoLluvia.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datosGraficoLluvia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis label={{ value: "mm", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="mm" fill="#3b82f6" name="Milímetros" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay datos para mostrar
                </div>
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
              ) : registrosLluvia.length === 0 ? (
                <div className="text-center py-8">
                  <CloudRain className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay registros de lluvia</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {registrosLluvia.map((registro) => (
                    <div
                      key={registro.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-medium">
                            {new Date(registro.fecha).toLocaleDateString("es", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          <Badge className="bg-blue-500">{registro.milimetros} mm</Badge>
                          <Badge variant="outline">{registro.metodo}</Badge>
                        </div>
                        {registro.lote && (
                          <p className="text-sm text-gray-600">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {registro.lote.nombre}
                          </p>
                        )}
                        {registro.ubicacion && (
                          <p className="text-sm text-gray-600">{registro.ubicacion}</p>
                        )}
                        {registro.observaciones && (
                          <p className="text-sm text-gray-500 mt-1">
                            {registro.observaciones}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => eliminarLluvia(registro.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: CALCULADORA DE DOSIS */}
        <TabsContent value="calculadora" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Calculadora de Dosis</h2>
            <Button onClick={() => setDosisDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cálculo
            </Button>
          </div>

          {/* Cálculos guardados */}
          <Card>
            <CardHeader>
              <CardTitle>Cálculos Guardados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : calculosDosis.length === 0 ? (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay cálculos guardados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {calculosDosis.map((calculo) => (
                    <div
                      key={calculo.id}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{calculo.nombre}</p>
                            <Badge variant="outline">{calculo.tipoProducto}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {calculo.nombreProducto}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarDosis(calculo.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Superficie</p>
                          <p className="font-medium">{calculo.superficieHa} ha</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Dosis</p>
                          <p className="font-medium">{calculo.dosisObjetivo} L/ha o kg/ha</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Cantidad Total</p>
                          <p className="font-medium text-blue-600">
                            {calculo.cantidadTotal.toFixed(2)} L o kg
                          </p>
                        </div>
                        {calculo.costoTotal && (
                          <div>
                            <p className="text-gray-500">Costo Total</p>
                            <p className="font-medium text-green-600">
                              ${calculo.costoTotal.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>

                      {calculo.lote && (
                        <p className="text-xs text-gray-500 mt-2">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {calculo.lote.nombre}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(calculo.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Registrar Lluvia */}
      <Dialog open={lluviaDialogOpen} onOpenChange={setLluviaDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateLluvia}>
            <DialogHeader>
              <DialogTitle>Registrar Lluvia</DialogTitle>
              <DialogDescription>
                Ingresá los datos del evento de lluvia
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={lluviaForm.fecha}
                    onChange={(e) =>
                      setLluviaForm({ ...lluviaForm, fecha: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Milímetros *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="25.5"
                    value={lluviaForm.milimetros}
                    onChange={(e) =>
                      setLluviaForm({ ...lluviaForm, milimetros: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lote (opcional)</Label>
                  <Select
                    value={lluviaForm.loteId}
                    onValueChange={(value) =>
                      setLluviaForm({ ...lluviaForm, loteId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin lote específico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sin-lote">Sin lote específico</SelectItem>
                      {lotes.map((lote) => (
                        <SelectItem key={lote.id} value={lote.id}>
                          {lote.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Método</Label>
                  <Select
                    value={lluviaForm.metodo}
                    onValueChange={(value) =>
                      setLluviaForm({ ...lluviaForm, metodo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="Automático">Automático</SelectItem>
                      <SelectItem value="Estimado">Estimado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ubicación (opcional)</Label>
                <Input
                  placeholder="Ej: Campo Norte"
                  value={lluviaForm.ubicacion}
                  onChange={(e) =>
                    setLluviaForm({ ...lluviaForm, ubicacion: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Observaciones (opcional)</Label>
                <Textarea
                  placeholder="Ej: Lluvia intensa con granizo"
                  value={lluviaForm.observaciones}
                  onChange={(e) =>
                    setLluviaForm({ ...lluviaForm, observaciones: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLluviaDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Guardar Registro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Calculadora de Dosis */}
      <Dialog open={dosisDialogOpen} onOpenChange={setDosisDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveDosis}>
            <DialogHeader>
              <DialogTitle>Calculadora de Dosis</DialogTitle>
              <DialogDescription>
                Calculá la cantidad exacta de producto necesaria
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre del Cálculo *</Label>
                <Input
                  placeholder="Ej: Glifosato Lote Norte"
                  value={dosisForm.nombre}
                  onChange={(e) =>
                    setDosisForm({ ...dosisForm, nombre: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Producto *</Label>
                  <Select
                    value={dosisForm.tipoProducto}
                    onValueChange={(value) =>
                      setDosisForm({ ...dosisForm, tipoProducto: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fertilizante">Fertilizante</SelectItem>
                      <SelectItem value="Herbicida">Herbicida</SelectItem>
                      <SelectItem value="Insecticida">Insecticida</SelectItem>
                      <SelectItem value="Fungicida">Fungicida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nombre del Producto *</Label>
                  <Input
                    placeholder="Ej: Glifosato 48%"
                    value={dosisForm.nombreProducto}
                    onChange={(e) =>
                      setDosisForm({ ...dosisForm, nombreProducto: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Concentración (opcional)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="48"
                    value={dosisForm.concentracion}
                    onChange={(e) =>
                      setDosisForm({ ...dosisForm, concentracion: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">% o g/L</p>
                </div>

                <div className="space-y-2">
                  <Label>Dosis Objetivo *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="3.5"
                    value={dosisForm.dosisObjetivo}
                    onChange={(e) =>
                      setDosisForm({ ...dosisForm, dosisObjetivo: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-gray-500">L/ha o kg/ha</p>
                </div>

                <div className="space-y-2">
                  <Label>Superficie *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="50"
                    value={dosisForm.superficieHa}
                    onChange={(e) =>
                      setDosisForm({ ...dosisForm, superficieHa: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-gray-500">Hectáreas</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Costo Unitario (opcional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="15.50"
                    value={dosisForm.costoUnitario}
                    onChange={(e) =>
                      setDosisForm({ ...dosisForm, costoUnitario: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">USD por L o kg</p>
                </div>

                <div className="space-y-2">
                  <Label>Agua por Ha (opcional)</Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="200"
                    value={dosisForm.aguaPorHa}
                    onChange={(e) =>
                      setDosisForm({ ...dosisForm, aguaPorHa: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">Litros/ha</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lote (opcional)</Label>
                <Select
                  value={dosisForm.loteId}
                  onValueChange={(value) =>
                    setDosisForm({ ...dosisForm, loteId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin lote específico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin-lote">Sin lote específico</SelectItem>
                    {lotes.map((lote) => (
                      <SelectItem key={lote.id} value={lote.id}>
                        {lote.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observaciones (opcional)</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={dosisForm.observaciones}
                  onChange={(e) =>
                    setDosisForm({ ...dosisForm, observaciones: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={calcularDosis}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular
                </Button>
              </div>

              {resultadoCalculo && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Resultado del Cálculo</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Cantidad Total</p>
                      <p className="text-2xl font-bold text-green-700">
                        {resultadoCalculo.cantidadTotal} L o kg
                      </p>
                    </div>
                    {resultadoCalculo.costoTotal && (
                      <div>
                        <p className="text-sm text-gray-600">Costo Total</p>
                        <p className="text-2xl font-bold text-green-700">
                          ${resultadoCalculo.costoTotal} USD
                        </p>
                      </div>
                    )}
                    {resultadoCalculo.aguaTotal && (
                      <div>
                        <p className="text-sm text-gray-600">Agua Total</p>
                        <p className="text-xl font-bold text-blue-700">
                          {resultadoCalculo.aguaTotal} L
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDosisDialogOpen(false);
                  setResultadoCalculo(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={!resultadoCalculo}
              >
                Guardar Cálculo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}