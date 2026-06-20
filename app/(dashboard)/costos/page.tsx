"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPI } from "@/components/mc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Calculator } from "lucide-react";
import { formatDate } from "@/lib/utils";

type CostoLote = {
  id: string;
  concepto: string;
  descripcion: string;
  monto: number;
  fecha: string;
  lote: {
    nombre: string;
  };
};

type CostoAnimal = {
  id: string;
  concepto: string;
  descripcion: string;
  monto: number;
  fecha: string;
  animal: {
    caravana: string;
  };
};

type MargenBruto = {
  id: string;
  tipo: string;
  referenciaNombre: string;
  periodo: string;
  ingresos: number;
  costos: number;
  margen: number;
  margenPorcentaje: number;
};

type Lote = {
  id: string;
  nombre: string;
  hectareas: number;
};

type Animal = {
  id: string;
  caravana: string;
  tipo: string;
};

const CONCEPTOS_LOTE = ["Semilla", "Fertilizante", "Fitosanitario", "Labor", "Maquinaria", "Riego", "Otros"];
const CONCEPTOS_ANIMAL = ["Alimentación", "Sanidad", "Reproducción", "Compra", "Otros"];

export default function CostosPage() {
  const [costosLote, setCostosLote] = useState<CostoLote[]>([]);
  const [costosAnimal, setCostosAnimal] = useState<CostoAnimal[]>([]);
  const [margenes, setMargenes] = useState<MargenBruto[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  const [costoLoteDialogOpen, setCostoLoteDialogOpen] = useState(false);
  const [costoAnimalDialogOpen, setCostoAnimalDialogOpen] = useState(false);
  const [margenDialogOpen, setMargenDialogOpen] = useState(false);

  const [costoLoteForm, setCostoLoteForm] = useState({
    loteId: "",
    concepto: "",
    descripcion: "",
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
  });

  const [costoAnimalForm, setCostoAnimalForm] = useState({
    animalId: "",
    concepto: "",
    descripcion: "",
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
  });

  const [margenForm, setMargenForm] = useState({
    tipo: "",
    referenciaId: "",
    periodo: new Date().toISOString().slice(0, 7), // YYYY-MM
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchCostosLote(),
      fetchCostosAnimal(),
      fetchMargenes(),
      fetchLotes(),
      fetchAnimales(),
    ]);
    setLoading(false);
  };

  const fetchCostosLote = async () => {
    try {
      const response = await fetch("/api/costos-lote");
      if (response.ok) {
        const data = await response.json();
        setCostosLote(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchCostosAnimal = async () => {
    try {
      const response = await fetch("/api/costos-animal");
      if (response.ok) {
        const data = await response.json();
        setCostosAnimal(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchMargenes = async () => {
    try {
      const response = await fetch("/api/margenes-brutos");
      if (response.ok) {
        const data = await response.json();
        setMargenes(data);
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

  const fetchAnimales = async () => {
    try {
      const response = await fetch("/api/animales");
      if (response.ok) {
        const data = await response.json();
        setAnimales(data.filter((a: Animal) => a));
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCreateCostoLote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/costos-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(costoLoteForm),
      });

      if (response.ok) {
        setCostoLoteDialogOpen(false);
        setCostoLoteForm({
          loteId: "",
          concepto: "",
          descripcion: "",
          monto: "",
          fecha: new Date().toISOString().split("T")[0],
        });
        fetchCostosLote();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCreateCostoAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/costos-animal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(costoAnimalForm),
      });

      if (response.ok) {
        setCostoAnimalDialogOpen(false);
        setCostoAnimalForm({
          animalId: "",
          concepto: "",
          descripcion: "",
          monto: "",
          fecha: new Date().toISOString().split("T")[0],
        });
        fetchCostosAnimal();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCalcularMargen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const referenciaNombre = margenForm.tipo === "Lote"
        ? lotes.find(l => l.id === margenForm.referenciaId)?.nombre || ""
        : animales.find(a => a.id === margenForm.referenciaId)?.caravana || "";

      const response = await fetch("/api/margenes-brutos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...margenForm,
          referenciaNombre,
        }),
      });

      if (response.ok) {
        setMargenDialogOpen(false);
        setMargenForm({
          tipo: "",
          referenciaId: "",
          periodo: new Date().toISOString().slice(0, 7),
        });
        fetchMargenes();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteCostoLote = async (id: string) => {
    if (!confirm("¿Eliminar este costo?")) return;
    try {
      const response = await fetch(`/api/costos-lote/${id}`, { method: "DELETE" });
      if (response.ok) fetchCostosLote();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteCostoAnimal = async (id: string) => {
    if (!confirm("¿Eliminar este costo?")) return;
    try {
      const response = await fetch(`/api/costos-animal/${id}`, { method: "DELETE" });
      if (response.ok) fetchCostosAnimal();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const totalCostosLote = costosLote.reduce((sum, c) => sum + c.monto, 0);
  const totalCostosAnimal = costosAnimal.reduce((sum, c) => sum + c.monto, 0);
  const totalCostos = totalCostosLote + totalCostosAnimal;
  const margenPromedio = margenes.length > 0
    ? margenes.reduce((sum, m) => sum + m.margenPorcentaje, 0) / margenes.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Motor de Costos en Tiempo Real</h1>
        <p className="text-gray-600 mt-2">
          Control de costos por lote y animal con cálculo de márgenes
        </p>
      </div>

      <div className="grid g-cols-4">
        <KPI label="Costos totales" value={`$${totalCostos.toLocaleString("es-AR")}`} delta="Lotes + Animales" trend="down" icon="dollar" accent />
        <KPI label="Costos agrícolas" value={`$${totalCostosLote.toLocaleString("es-AR")}`} delta={`${costosLote.length} registros`} trend="down" icon="leaf" />
        <KPI label="Costos ganaderos" value={`$${totalCostosAnimal.toLocaleString("es-AR")}`} delta={`${costosAnimal.length} registros`} trend="down" icon="cow" />
        <KPI label="Margen promedio" value={`${margenPromedio.toFixed(1)}%`} delta={`${margenes.length} cálculos`} trend={margenPromedio >= 0 ? "up" : "down"} icon="activity" />
      </div>

      <Tabs defaultValue="lotes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lotes">Costos Agrícolas</TabsTrigger>
          <TabsTrigger value="animales">Costos Ganaderos</TabsTrigger>
          <TabsTrigger value="margenes">Márgenes Brutos</TabsTrigger>
        </TabsList>

        {/* TAB COSTOS LOTES */}
        <TabsContent value="lotes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Costos por Lote</CardTitle>
                <CardDescription>Registro de costos agrícolas</CardDescription>
              </div>
              <Dialog open={costoLoteDialogOpen} onOpenChange={setCostoLoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={lotes.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Costo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateCostoLote}>
                    <DialogHeader>
                      <DialogTitle>Registrar Costo de Lote</DialogTitle>
                      <DialogDescription>
                        Asigná un costo directo al lote
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Lote *</Label>
                        <Select
                          value={costoLoteForm.loteId}
                          onValueChange={(value) => setCostoLoteForm({ ...costoLoteForm, loteId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná lote" />
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
                      <div className="space-y-2">
                        <Label>Concepto *</Label>
                        <Select
                          value={costoLoteForm.concepto}
                          onValueChange={(value) => setCostoLoteForm({ ...costoLoteForm, concepto: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de costo" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONCEPTOS_LOTE.map((concepto) => (
                              <SelectItem key={concepto} value={concepto}>
                                {concepto}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción *</Label>
                        <Textarea
                          placeholder="Ej: Glifosato 20L"
                          value={costoLoteForm.descripcion}
                          onChange={(e) => setCostoLoteForm({ ...costoLoteForm, descripcion: e.target.value })}
                          required
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Monto (USD) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="1500"
                            value={costoLoteForm.monto}
                            onChange={(e) => setCostoLoteForm({ ...costoLoteForm, monto: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fecha *</Label>
                          <Input
                            type="date"
                            value={costoLoteForm.fecha}
                            onChange={(e) => setCostoLoteForm({ ...costoLoteForm, fecha: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCostoLoteDialogOpen(false)}>
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
              ) : costosLote.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay costos registrados</p>
                  {lotes.length === 0 ? (
                    <p className="text-sm text-gray-400">Primero creá lotes en Agronomía</p>
                  ) : (
                    <Button onClick={() => setCostoLoteDialogOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar primer costo
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {costosLote.map((costo) => (
                    <Card key={costo.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                                {costo.concepto}
                              </span>
                              <p className="font-medium">{costo.lote.nombre}</p>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{costo.descripcion}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(costo.fecha)}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-xl font-bold text-red-600">
                              ${costo.monto.toLocaleString()}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCostoLote(costo.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB COSTOS ANIMALES */}
        <TabsContent value="animales">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Costos por Animal</CardTitle>
                <CardDescription>Registro de costos ganaderos</CardDescription>
              </div>
              <Dialog open={costoAnimalDialogOpen} onOpenChange={setCostoAnimalDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={animales.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Costo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateCostoAnimal}>
                    <DialogHeader>
                      <DialogTitle>Registrar Costo de Animal</DialogTitle>
                      <DialogDescription>
                        Asigná un costo directo al animal
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Animal *</Label>
                        <Select
                          value={costoAnimalForm.animalId}
                          onValueChange={(value) => setCostoAnimalForm({ ...costoAnimalForm, animalId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná animal" />
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
                      <div className="space-y-2">
                        <Label>Concepto *</Label>
                        <Select
                          value={costoAnimalForm.concepto}
                          onValueChange={(value) => setCostoAnimalForm({ ...costoAnimalForm, concepto: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de costo" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONCEPTOS_ANIMAL.map((concepto) => (
                              <SelectItem key={concepto} value={concepto}>
                                {concepto}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción *</Label>
                        <Textarea
                          placeholder="Ej: Vacuna Triple"
                          value={costoAnimalForm.descripcion}
                          onChange={(e) => setCostoAnimalForm({ ...costoAnimalForm, descripcion: e.target.value })}
                          required
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Monto (USD) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="50"
                            value={costoAnimalForm.monto}
                            onChange={(e) => setCostoAnimalForm({ ...costoAnimalForm, monto: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fecha *</Label>
                          <Input
                            type="date"
                            value={costoAnimalForm.fecha}
                            onChange={(e) => setCostoAnimalForm({ ...costoAnimalForm, fecha: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCostoAnimalDialogOpen(false)}>
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
              ) : costosAnimal.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay costos registrados</p>
                  {animales.length === 0 ? (
                    <p className="text-sm text-gray-400">Primero creá animales en Ganadería</p>
                  ) : (
                    <Button onClick={() => setCostoAnimalDialogOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar primer costo
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {costosAnimal.map((costo) => (
                    <Card key={costo.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800`}>
                                {costo.concepto}
                              </span>
                              <p className="font-medium">{costo.animal.caravana}</p>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{costo.descripcion}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(costo.fecha)}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-xl font-bold text-red-600">
                              ${costo.monto.toLocaleString()}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCostoAnimal(costo.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB MÁRGENES */}
        <TabsContent value="margenes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Márgenes Brutos</CardTitle>
                <CardDescription>Cálculo automático de rentabilidad</CardDescription>
              </div>
              <Dialog open={margenDialogOpen} onOpenChange={setMargenDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calcular Margen
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCalcularMargen}>
                    <DialogHeader>
                      <DialogTitle>Calcular Margen Bruto</DialogTitle>
                      <DialogDescription>
                        El sistema calculará automáticamente ingresos - costos
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Tipo *</Label>
                        <Select
                          value={margenForm.tipo}
                          onValueChange={(value) => setMargenForm({ ...margenForm, tipo: value, referenciaId: "" })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Lote o Animal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Lote">Lote (Agrícola)</SelectItem>
                            <SelectItem value="Animal">Animal (Ganadero)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {margenForm.tipo === "Lote" && (
                        <div className="space-y-2">
                          <Label>Lote *</Label>
                          <Select
                            value={margenForm.referenciaId}
                            onValueChange={(value) => setMargenForm({ ...margenForm, referenciaId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccioná lote" />
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
                      )}
                      {margenForm.tipo === "Animal" && (
                        <div className="space-y-2">
                          <Label>Animal *</Label>
                          <Select
                            value={margenForm.referenciaId}
                            onValueChange={(value) => setMargenForm({ ...margenForm, referenciaId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccioná animal" />
                            </SelectTrigger>
                            <SelectContent>
                              {animales.map((animal) => (
                                <SelectItem key={animal.id} value={animal.id}>
                                  {animal.caravana}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Período *</Label>
                        <Input
                          type="month"
                          value={margenForm.periodo}
                          onChange={(e) => setMargenForm({ ...margenForm, periodo: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setMargenDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Calcular
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : margenes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay márgenes calculados</p>
                  <Button onClick={() => setMargenDialogOpen(true)} variant="outline">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calcular primer margen
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {margenes.map((margen) => (
                    <Card key={margen.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                margen.tipo === "Lote" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                              }`}>
                                {margen.tipo}
                              </span>
                              <p className="font-medium">{margen.referenciaNombre}</p>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Período: {margen.periodo}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${margen.margen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {margen.margenPorcentaje.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">Margen</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-xs text-green-600">Ingresos</p>
                            <p className="text-lg font-bold text-green-700">
                              ${margen.ingresos.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-red-50 p-3 rounded">
                            <p className="text-xs text-red-600">Costos</p>
                            <p className="text-lg font-bold text-red-700">
                              ${margen.costos.toLocaleString()}
                            </p>
                          </div>
                          <div className={`p-3 rounded ${margen.margen >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                            <p className={`text-xs ${margen.margen >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                              Margen
                            </p>
                            <p className={`text-lg font-bold ${margen.margen >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                              ${margen.margen.toLocaleString()}
                            </p>
                          </div>
                        </div>
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