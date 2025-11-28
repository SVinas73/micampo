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
import { Apple, Flame, DollarSign, Plus, Trash2, Sparkles } from "lucide-react";

type Alimento = {
  id: string;
  nombre: string;
  tipo: string;
  proteina: number;
  energia: number;
  fibraCruda: number | null;
  humedad: number | null;
  costoKg: number;
  disponibilidad: string;
};

type ComponenteRacion = {
  id: string;
  cantidad: number;
  porcentaje: number;
  alimento: Alimento;
};

type Racion = {
  id: string;
  nombre: string;
  animalObjetivo: string;
  pesoObjetivo: number;
  etapaProductiva: string;
  consumoDiario: number;
  proteinaTotal: number;
  energiaTotal: number;
  costoTotal: number;
  observaciones: string | null;
  recomendacionIA: string | null;
  componentes: ComponenteRacion[];
};

const TIPOS_ALIMENTO = ["Forraje", "Concentrado", "Suplemento", "Mineral"];
const ANIMALES_OBJETIVO = [
  "Vaca Lechera",
  "Ternero",
  "Ternera",
  "Novillo",
  "Vaquillona",
  "Toro",
  "Oveja",
  "Cordero",
];
const ETAPAS_PRODUCTIVAS = [
  "Crecimiento",
  "Engorde",
  "Lactancia",
  "Gestación",
  "Mantenimiento",
];

export default function NutricionPage() {
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [raciones, setRaciones] = useState<Racion[]>([]);
  const [loading, setLoading] = useState(true);

  const [alimentoDialogOpen, setAlimentoDialogOpen] = useState(false);
  const [racionDialogOpen, setRacionDialogOpen] = useState(false);

  const [alimentoForm, setAlimentoForm] = useState({
    nombre: "",
    tipo: "",
    proteina: "",
    energia: "",
    fibraCruda: "",
    humedad: "",
    costoKg: "",
  });

  const [racionForm, setRacionForm] = useState({
    nombre: "",
    animalObjetivo: "",
    pesoObjetivo: "",
    etapaProductiva: "",
    consumoDiario: "",
    observaciones: "",
  });

  const [componentesRacion, setComponentesRacion] = useState<{ alimentoId: string; cantidad: string }[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchAlimentos(), fetchRaciones()]);
    setLoading(false);
  };

  const fetchAlimentos = async () => {
    try {
      const response = await fetch("/api/alimentos");
      if (response.ok) {
        const data = await response.json();
        setAlimentos(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchRaciones = async () => {
    try {
      const response = await fetch("/api/raciones");
      if (response.ok) {
        const data = await response.json();
        setRaciones(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCreateAlimento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/alimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alimentoForm),
      });

      if (response.ok) {
        setAlimentoDialogOpen(false);
        setAlimentoForm({
          nombre: "",
          tipo: "",
          proteina: "",
          energia: "",
          fibraCruda: "",
          humedad: "",
          costoKg: "",
        });
        fetchAlimentos();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCreateRacion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/raciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...racionForm,
          componentes: componentesRacion,
        }),
      });

      if (response.ok) {
        setRacionDialogOpen(false);
        setRacionForm({
          nombre: "",
          animalObjetivo: "",
          pesoObjetivo: "",
          etapaProductiva: "",
          consumoDiario: "",
          observaciones: "",
        });
        setComponentesRacion([]);
        fetchRaciones();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteAlimento = async (id: string) => {
    if (!confirm("¿Eliminar este alimento?")) return;
    try {
      const response = await fetch(`/api/alimentos/${id}`, { method: "DELETE" });
      if (response.ok) fetchAlimentos();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteRacion = async (id: string) => {
    if (!confirm("¿Eliminar esta ración?")) return;
    try {
      const response = await fetch(`/api/raciones/${id}`, { method: "DELETE" });
      if (response.ok) fetchRaciones();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleAgregarComponente = () => {
    setComponentesRacion([...componentesRacion, { alimentoId: "", cantidad: "" }]);
  };

  const handleEliminarComponente = (index: number) => {
    setComponentesRacion(componentesRacion.filter((_, i) => i !== index));
  };

  const handleGenerarRecomendacion = () => {
    if (!racionForm.animalObjetivo || !racionForm.pesoObjetivo || !racionForm.etapaProductiva) {
      alert("Completá animal objetivo, peso y etapa productiva para generar recomendación");
      return;
    }

    // Motor IA simple basado en reglas
    const peso = parseFloat(racionForm.pesoObjetivo);
    const animal = racionForm.animalObjetivo;
    const etapa = racionForm.etapaProductiva;

    let consumoDiario = 0;
    let proteinaRecomendada = 0;
    let energiaRecomendada = 0;
    let recomendacion = "";

    // Reglas nutricionales básicas
    if (animal === "Vaca Lechera") {
      if (etapa === "Lactancia") {
        consumoDiario = peso * 0.03; // 3% del peso vivo
        proteinaRecomendada = 16; // 16% de proteína
        energiaRecomendada = 1.6; // 1.6 Mcal/kg
        recomendacion = "Vaca en lactancia requiere alta energía y proteína. Sugerencia: 60% forraje de calidad, 30% concentrado energético, 10% suplemento proteico.";
      } else if (etapa === "Gestación") {
        consumoDiario = peso * 0.025;
        proteinaRecomendada = 12;
        energiaRecomendada = 1.3;
        recomendacion = "Vaca gestante necesita nutrición balanceada. Sugerencia: 70% forraje, 20% concentrado, 10% mineral.";
      } else {
        consumoDiario = peso * 0.02;
        proteinaRecomendada = 10;
        energiaRecomendada = 1.2;
        recomendacion = "Mantenimiento básico. Sugerencia: 80% forraje, 15% concentrado, 5% mineral.";
      }
    } else if (animal === "Ternero" || animal === "Ternera") {
      if (etapa === "Crecimiento") {
        consumoDiario = peso * 0.025;
        proteinaRecomendada = 18;
        energiaRecomendada = 2.2;
        recomendacion = "Ternero en crecimiento necesita alta proteína. Sugerencia: 40% forraje tierno, 40% concentrado proteico, 15% suplemento, 5% mineral.";
      }
    } else if (animal === "Novillo") {
      if (etapa === "Engorde") {
        consumoDiario = peso * 0.028;
        proteinaRecomendada = 14;
        energiaRecomendada = 1.8;
        recomendacion = "Novillo en engorde requiere alta energía. Sugerencia: 50% forraje, 40% concentrado energético (maíz/sorgo), 10% proteico.";
      } else {
        consumoDiario = peso * 0.022;
        proteinaRecomendada = 12;
        energiaRecomendada = 1.4;
        recomendacion = "Mantenimiento de novillo. Sugerencia: 75% forraje, 20% concentrado, 5% mineral.";
      }
    } else {
      // Default genérico
      consumoDiario = peso * 0.025;
      proteinaRecomendada = 12;
      energiaRecomendada = 1.5;
      recomendacion = "Ración balanceada general. Ajustar según necesidades específicas.";
    }

    setRacionForm({
      ...racionForm,
      consumoDiario: consumoDiario.toFixed(2),
    });

    alert(
      `🤖 RECOMENDACIÓN IA:\n\n` +
      `Consumo diario: ${consumoDiario.toFixed(2)} kg MS\n` +
      `Proteína objetivo: ${proteinaRecomendada}%\n` +
      `Energía objetivo: ${energiaRecomendada} Mcal/kg\n\n` +
      `${recomendacion}`
    );
  };

  const totalAlimentos = alimentos.length;
  const totalRaciones = raciones.length;
  const costoPromedioRacion = raciones.length > 0
    ? raciones.reduce((sum, r) => sum + r.costoTotal, 0) / raciones.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nutrición Animal</h1>
        <p className="text-gray-600 mt-2">
          Motor de nutrición con recomendaciones IA
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Alimentos
            </CardTitle>
            <Apple className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlimentos}</div>
            <p className="text-xs text-gray-500 mt-1">Disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Raciones
            </CardTitle>
            <Flame className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRaciones}</div>
            <p className="text-xs text-gray-500 mt-1">Formuladas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Costo Promedio
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costoPromedioRacion.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">USD por día</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alimentos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alimentos">
            <Apple className="h-4 w-4 mr-2" />
            Alimentos
          </TabsTrigger>
          <TabsTrigger value="raciones">
            <Flame className="h-4 w-4 mr-2" />
            Raciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alimentos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Alimentos</CardTitle>
                <CardDescription>Biblioteca de alimentos disponibles</CardDescription>
              </div>
              <Dialog open={alimentoDialogOpen} onOpenChange={setAlimentoDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Alimento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateAlimento}>
                    <DialogHeader>
                      <DialogTitle>Registrar Alimento</DialogTitle>
                      <DialogDescription>
                        Agregá un alimento a la biblioteca nutricional
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Nombre *</Label>
                        <Input
                          placeholder="Ej: Alfalfa"
                          value={alimentoForm.nombre}
                          onChange={(e) => setAlimentoForm({ ...alimentoForm, nombre: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo *</Label>
                        <Select
                          value={alimentoForm.tipo}
                          onValueChange={(value) => setAlimentoForm({ ...alimentoForm, tipo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_ALIMENTO.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Proteína (%) *</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="15"
                            value={alimentoForm.proteina}
                            onChange={(e) => setAlimentoForm({ ...alimentoForm, proteina: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Energía (Mcal/kg) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="2.5"
                            value={alimentoForm.energia}
                            onChange={(e) => setAlimentoForm({ ...alimentoForm, energia: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Fibra Cruda (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="20"
                            value={alimentoForm.fibraCruda}
                            onChange={(e) => setAlimentoForm({ ...alimentoForm, fibraCruda: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Humedad (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="12"
                            value={alimentoForm.humedad}
                            onChange={(e) => setAlimentoForm({ ...alimentoForm, humedad: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Costo por kg (USD) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.50"
                          value={alimentoForm.costoKg}
                          onChange={(e) => setAlimentoForm({ ...alimentoForm, costoKg: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setAlimentoDialogOpen(false)}>
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
              ) : alimentos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay alimentos registrados</p>
                  <Button onClick={() => setAlimentoDialogOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar primer alimento
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Nombre</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Proteína</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Energía</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Costo/kg</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alimentos.map((alimento) => (
                        <tr key={alimento.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium">{alimento.nombre}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {alimento.tipo}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-right">{alimento.proteina.toFixed(1)}%</td>
                          <td className="py-3 px-4 text-sm text-right">{alimento.energia.toFixed(2)} Mcal/kg</td>
                          <td className="py-3 px-4 text-sm text-right">${alimento.costoKg.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAlimento(alimento.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raciones">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Raciones</CardTitle>
                <CardDescription>Raciones formuladas con Motor IA</CardDescription>
              </div>
              <Dialog open={racionDialogOpen} onOpenChange={setRacionDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={alimentos.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Ración
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <form onSubmit={handleCreateRacion}>
                    <DialogHeader>
                      <DialogTitle>Formular Ración</DialogTitle>
                      <DialogDescription>
                        Creá una ración con asistencia de IA
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Nombre *</Label>
                        <Input
                          placeholder="Ej: Ración Vaca Lechera Alta Producción"
                          value={racionForm.nombre}
                          onChange={(e) => setRacionForm({ ...racionForm, nombre: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Animal Objetivo *</Label>
                          <Select
                            value={racionForm.animalObjetivo}
                            onValueChange={(value) => setRacionForm({ ...racionForm, animalObjetivo: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Animal" />
                            </SelectTrigger>
                            <SelectContent>
                              {ANIMALES_OBJETIVO.map((a) => (
                                <SelectItem key={a} value={a}>{a}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Peso (kg) *</Label>
                          <Input
                            type="number"
                            step="1"
                            placeholder="500"
                            value={racionForm.pesoObjetivo}
                            onChange={(e) => setRacionForm({ ...racionForm, pesoObjetivo: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Etapa *</Label>
                          <Select
                            value={racionForm.etapaProductiva}
                            onValueChange={(value) => setRacionForm({ ...racionForm, etapaProductiva: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Etapa" />
                            </SelectTrigger>
                            <SelectContent>
                              {ETAPAS_PRODUCTIVAS.map((e) => (
                                <SelectItem key={e} value={e}>{e}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleGenerarRecomendacion}
                          className="bg-purple-600 hover:bg-purple-700 flex-1"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generar Recomendación IA
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Consumo Diario (kg MS) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="15"
                          value={racionForm.consumoDiario}
                          onChange={(e) => setRacionForm({ ...racionForm, consumoDiario: e.target.value })}
                          required
                        />
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium">Componentes de la Ración</h3>
                          <Button type="button" onClick={handleAgregarComponente} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar
                          </Button>
                        </div>

                        {componentesRacion.map((comp, index) => (
                          <div key={index} className="grid grid-cols-3 gap-4 mb-3">
                            <div className="col-span-2 space-y-2">
                              <Select
                                value={comp.alimentoId}
                                onValueChange={(value) => {
                                  const newComps = [...componentesRacion];
                                  newComps[index].alimentoId = value;
                                  setComponentesRacion(newComps);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccioná alimento" />
                                </SelectTrigger>
                                <SelectContent>
                                  {alimentos.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                      {a.nombre} ({a.tipo})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="kg"
                                value={comp.cantidad}
                                onChange={(e) => {
                                  const newComps = [...componentesRacion];
                                  newComps[index].cantidad = e.target.value;
                                  setComponentesRacion(newComps);
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEliminarComponente(index)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {componentesRacion.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-4">
                            No hay componentes agregados
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Observaciones</Label>
                        <Textarea
                          placeholder="Notas adicionales"
                          value={racionForm.observaciones}
                          onChange={(e) => setRacionForm({ ...racionForm, observaciones: e.target.value })}
                          rows={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setRacionDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Crear Ración
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : raciones.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay raciones formuladas</p>
                  {alimentos.length === 0 ? (
                    <p className="text-sm text-gray-400">Primero registrá alimentos</p>
                  ) : (
                    <Button onClick={() => setRacionDialogOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Formular primera ración
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {raciones.map((racion) => (
                    <Card key={racion.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{racion.nombre}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              {racion.animalObjetivo} • {racion.pesoObjetivo} kg • {racion.etapaProductiva}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRacion(racion.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500">Consumo Diario</p>
                            <p className="text-lg font-bold">{racion.consumoDiario.toFixed(2)} kg</p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-xs text-blue-600">Proteína</p>
                            <p className="text-lg font-bold text-blue-700">{racion.proteinaTotal.toFixed(1)}%</p>
                          </div>
                          <div className="bg-orange-50 p-3 rounded">
                            <p className="text-xs text-orange-600">Energía</p>
                            <p className="text-lg font-bold text-orange-700">{racion.energiaTotal.toFixed(2)} Mcal/kg</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-xs text-green-600">Costo</p>
                            <p className="text-lg font-bold text-green-700">${racion.costoTotal.toFixed(2)}/día</p>
                          </div>
                        </div>

                        {racion.componentes.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">Componentes:</p>
                            {racion.componentes.map((comp) => (
                              <div key={comp.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                <span>{comp.alimento.nombre}</span>
                                <span className="font-medium">
                                  {comp.cantidad.toFixed(2)} kg ({comp.porcentaje.toFixed(1)}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {racion.observaciones && (
                          <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                            {racion.observaciones}
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