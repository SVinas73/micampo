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
import { Leaf, Cloud, Award, Plus, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type EmisionCarbono = {
  id: string;
  fuente: string;
  actividad: string;
  cantidad: number;
  unidad: string;
  factorEmision: number;
  emisionTotal: number;
  fecha: string;
  lote: {
    nombre: string;
  } | null;
};

type PracticaSostenible = {
  id: string;
  tipo: string;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string | null;
  beneficio: string | null;
  lote: {
    nombre: string;
  } | null;
};

type Certificacion = {
  id: string;
  nombre: string;
  entidadEmisora: string;
  numeroRegistro: string | null;
  fechaEmision: string;
  fechaVencimiento: string | null;
  estado: string;
  documentoUrl: string | null;
};

type Lote = {
  id: string;
  nombre: string;
  hectareas: number;
};

const FUENTES_EMISION = [
  "Combustible Diesel",
  "Combustible Nafta",
  "Fertilizantes Nitrogenados",
  "Fertilizantes Fosforados",
  "Ganadería (Fermentación Entérica)",
  "Electricidad",
  "Otro",
];

const TIPOS_PRACTICA = [
  "Siembra Directa",
  "Rotación de Cultivos",
  "Cultivos de Cobertura",
  "Agroforestería",
  "Manejo de Pastoreo",
  "Compostaje",
  "Agricultura de Precisión",
  "Otro",
];

const TIPOS_CERTIFICACION = [
  "Orgánico",
  "Rainforest Alliance",
  "Fair Trade",
  "Global GAP",
  "ISO 14001",
  "Carbono Neutro",
  "Otra",
];

// Factores de emisión simplificados (kg CO2eq por unidad)
const FACTORES_EMISION: { [key: string]: { factor: number; unidad: string } } = {
  "Combustible Diesel": { factor: 2.68, unidad: "litros" },
  "Combustible Nafta": { factor: 2.31, unidad: "litros" },
  "Fertilizantes Nitrogenados": { factor: 5.5, unidad: "kg" },
  "Fertilizantes Fosforados": { factor: 1.2, unidad: "kg" },
  "Ganadería (Fermentación Entérica)": { factor: 70, unidad: "cabezas/año" },
  "Electricidad": { factor: 0.5, unidad: "kWh" },
};

export default function SostenibilidadPage() {
  const [emisiones, setEmisiones] = useState<EmisionCarbono[]>([]);
  const [practicas, setPracticas] = useState<PracticaSostenible[]>([]);
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [emisionDialogOpen, setEmisionDialogOpen] = useState(false);
  const [practicaDialogOpen, setPracticaDialogOpen] = useState(false);
  const [certificacionDialogOpen, setCertificacionDialogOpen] = useState(false);

  // Forms
  const [emisionForm, setEmisionForm] = useState({
    fuente: "",
    actividad: "",
    cantidad: "",
    unidad: "",
    factorEmision: "",
    fecha: new Date().toISOString().split("T")[0],
    loteId: "",
  });

  const [practicaForm, setPracticaForm] = useState({
    tipo: "",
    nombre: "",
    descripcion: "",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
    beneficio: "",
    loteId: "",
  });

  const [certificacionForm, setCertificacionForm] = useState({
    nombre: "",
    entidadEmisora: "",
    numeroRegistro: "",
    fechaEmision: new Date().toISOString().split("T")[0],
    fechaVencimiento: "",
    documentoUrl: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchEmisiones(),
      fetchPracticas(),
      fetchCertificaciones(),
      fetchLotes(),
    ]);
    setLoading(false);
  };

  const fetchEmisiones = async () => {
    try {
      const response = await fetch("/api/emisiones-carbono");
      if (response.ok) {
        const data = await response.json();
        setEmisiones(data);
      }
    } catch (error) {
      console.error("Error al cargar emisiones:", error);
    }
  };

  const fetchPracticas = async () => {
    try {
      const response = await fetch("/api/practicas-sostenibles");
      if (response.ok) {
        const data = await response.json();
        setPracticas(data);
      }
    } catch (error) {
      console.error("Error al cargar prácticas:", error);
    }
  };

  const fetchCertificaciones = async () => {
    try {
      const response = await fetch("/api/certificaciones");
      if (response.ok) {
        const data = await response.json();
        setCertificaciones(data);
      }
    } catch (error) {
      console.error("Error al cargar certificaciones:", error);
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
      console.error("Error al cargar lotes:", error);
    }
  };

  const handleCreateEmision = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/emisiones-carbono", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emisionForm),
      });

      if (response.ok) {
        setEmisionDialogOpen(false);
        setEmisionForm({
          fuente: "",
          actividad: "",
          cantidad: "",
          unidad: "",
          factorEmision: "",
          fecha: new Date().toISOString().split("T")[0],
          loteId: "",
        });
        fetchEmisiones();
      }
    } catch (error) {
      console.error("Error al crear emisión:", error);
    }
  };

  const handleCreatePractica = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/practicas-sostenibles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(practicaForm),
      });

      if (response.ok) {
        setPracticaDialogOpen(false);
        setPracticaForm({
          tipo: "",
          nombre: "",
          descripcion: "",
          fechaInicio: new Date().toISOString().split("T")[0],
          fechaFin: "",
          beneficio: "",
          loteId: "",
        });
        fetchPracticas();
      }
    } catch (error) {
      console.error("Error al crear práctica:", error);
    }
  };

  const handleCreateCertificacion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/certificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(certificacionForm),
      });

      if (response.ok) {
        setCertificacionDialogOpen(false);
        setCertificacionForm({
          nombre: "",
          entidadEmisora: "",
          numeroRegistro: "",
          fechaEmision: new Date().toISOString().split("T")[0],
          fechaVencimiento: "",
          documentoUrl: "",
        });
        fetchCertificaciones();
      }
    } catch (error) {
      console.error("Error al crear certificación:", error);
    }
  };

  const handleDeleteEmision = async (id: string) => {
    if (!confirm("¿Eliminar esta emisión?")) return;
    try {
      const response = await fetch(`/api/emisiones-carbono/${id}`, { method: "DELETE" });
      if (response.ok) fetchEmisiones();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleFuenteChange = (fuente: string) => {
    const factorInfo = FACTORES_EMISION[fuente];
    if (factorInfo) {
      setEmisionForm({
        ...emisionForm,
        fuente,
        unidad: factorInfo.unidad,
        factorEmision: factorInfo.factor.toString(),
      });
    } else {
      setEmisionForm({ ...emisionForm, fuente, unidad: "", factorEmision: "" });
    }
  };

  const totalEmisiones = emisiones.reduce((sum, e) => sum + e.emisionTotal, 0);
  const practicasActivas = practicas.filter((p) => !p.fechaFin);
  const certificacionesVigentes = certificaciones.filter((c) => c.estado === "Vigente");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sostenibilidad</h1>
        <p className="text-gray-600 mt-2">
          Medición, Reporte y Verificación (MRV) de huella de carbono
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Huella de Carbono
            </CardTitle>
            <Cloud className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(totalEmisiones / 1000).toFixed(2)} ton
            </div>
            <p className="text-xs text-gray-500 mt-1">CO2 equivalente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Prácticas Sostenibles
            </CardTitle>
            <Leaf className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{practicasActivas.length}</div>
            <p className="text-xs text-gray-500 mt-1">Activas actualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Certificaciones
            </CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{certificacionesVigentes.length}</div>
            <p className="text-xs text-gray-500 mt-1">Vigentes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="emisiones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="emisiones">
            <Cloud className="h-4 w-4 mr-2" />
            Emisiones
          </TabsTrigger>
          <TabsTrigger value="practicas">
            <Leaf className="h-4 w-4 mr-2" />
            Prácticas
          </TabsTrigger>
          <TabsTrigger value="certificaciones">
            <Award className="h-4 w-4 mr-2" />
            Certificaciones
          </TabsTrigger>
        </TabsList>

        {/* TAB EMISIONES */}
        <TabsContent value="emisiones">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Emisiones de Carbono</CardTitle>
                <CardDescription>Registro de emisiones de gases de efecto invernadero</CardDescription>
              </div>
              <Dialog open={emisionDialogOpen} onOpenChange={setEmisionDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Emisión
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateEmision}>
                    <DialogHeader>
                      <DialogTitle>Registrar Emisión</DialogTitle>
                      <DialogDescription>
                        Registrá una fuente de emisión de GEI
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Fuente de Emisión *</Label>
                        <Select
                          value={emisionForm.fuente}
                          onValueChange={handleFuenteChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná fuente" />
                          </SelectTrigger>
                          <SelectContent>
                            {FUENTES_EMISION.map((f) => (
                              <SelectItem key={f} value={f}>{f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Actividad *</Label>
                        <Input
                          placeholder="Ej: Labranza lote 1"
                          value={emisionForm.actividad}
                          onChange={(e) => setEmisionForm({ ...emisionForm, actividad: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cantidad *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="100"
                            value={emisionForm.cantidad}
                            onChange={(e) => setEmisionForm({ ...emisionForm, cantidad: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unidad</Label>
                          <Input
                            value={emisionForm.unidad}
                            onChange={(e) => setEmisionForm({ ...emisionForm, unidad: e.target.value })}
                            placeholder="litros, kg, etc"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Factor de Emisión (kg CO2eq/unidad)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={emisionForm.factorEmision}
                          onChange={(e) => setEmisionForm({ ...emisionForm, factorEmision: e.target.value })}
                          required
                        />
                      </div>
                      {emisionForm.cantidad && emisionForm.factorEmision && (
                        <div className="p-3 bg-orange-50 rounded border border-orange-200">
                          <p className="text-sm text-orange-800">
                            <strong>Emisión Total:</strong>{" "}
                            {(parseFloat(emisionForm.cantidad) * parseFloat(emisionForm.factorEmision)).toFixed(2)} kg CO2eq
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Fecha *</Label>
                        <Input
                          type="date"
                          value={emisionForm.fecha}
                          onChange={(e) => setEmisionForm({ ...emisionForm, fecha: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Lote (opcional)</Label>
                        <Select
                          value={emisionForm.loteId}
                          onValueChange={(value) => setEmisionForm({ ...emisionForm, loteId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná lote" />
                          </SelectTrigger>
                          <SelectContent>
                            {lotes.map((l) => (
                              <SelectItem key={l.id} value={l.id}>
                                {l.nombre} ({l.hectareas} ha)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setEmisionDialogOpen(false)}>
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
              ) : emisiones.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay emisiones registradas</p>
                  <Button onClick={() => setEmisionDialogOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar primera emisión
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Fuente</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actividad</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Cantidad</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Emisión</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Lote</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emisiones.map((emision) => (
                        <tr key={emision.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{formatDate(emision.fecha)}</td>
                          <td className="py-3 px-4 text-sm">{emision.fuente}</td>
                          <td className="py-3 px-4 text-sm">{emision.actividad}</td>
                          <td className="py-3 px-4 text-sm text-right">
                            {emision.cantidad.toLocaleString()} {emision.unidad}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-medium text-orange-600">
                            {emision.emisionTotal.toFixed(2)} kg CO2eq
                          </td>
                          <td className="py-3 px-4 text-sm">{emision.lote?.nombre || "-"}</td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteEmision(emision.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-orange-50">
                        <td colSpan={4} className="py-3 px-4 text-sm text-right">TOTAL:</td>
                        <td className="py-3 px-4 text-sm text-right text-orange-600">
                          {totalEmisiones.toFixed(2)} kg CO2eq ({(totalEmisiones / 1000).toFixed(2)} ton)
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB PRÁCTICAS */}
        <TabsContent value="practicas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Prácticas Sostenibles</CardTitle>
                <CardDescription>Registro de prácticas ambientales implementadas</CardDescription>
              </div>
              <Dialog open={practicaDialogOpen} onOpenChange={setPracticaDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Práctica
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreatePractica}>
                    <DialogHeader>
                      <DialogTitle>Registrar Práctica Sostenible</DialogTitle>
                      <DialogDescription>
                        Registrá una práctica ambiental implementada
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Tipo *</Label>
                        <Select
                          value={practicaForm.tipo}
                          onValueChange={(value) => setPracticaForm({ ...practicaForm, tipo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_PRACTICA.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nombre *</Label>
                        <Input
                          placeholder="Ej: Rotación Soja-Maíz"
                          value={practicaForm.nombre}
                          onChange={(e) => setPracticaForm({ ...practicaForm, nombre: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción *</Label>
                        <Textarea
                          placeholder="Descripción detallada de la práctica"
                          value={practicaForm.descripcion}
                          onChange={(e) => setPracticaForm({ ...practicaForm, descripcion: e.target.value })}
                          required
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Fecha Inicio *</Label>
                          <Input
                            type="date"
                            value={practicaForm.fechaInicio}
                            onChange={(e) => setPracticaForm({ ...practicaForm, fechaInicio: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fecha Fin (opcional)</Label>
                          <Input
                            type="date"
                            value={practicaForm.fechaFin}
                            onChange={(e) => setPracticaForm({ ...practicaForm, fechaFin: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Beneficio Estimado (opcional)</Label>
                        <Input
                          placeholder="Ej: Reducción 20% emisiones"
                          value={practicaForm.beneficio}
                          onChange={(e) => setPracticaForm({ ...practicaForm, beneficio: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Lote (opcional)</Label>
                        <Select
                          value={practicaForm.loteId}
                          onValueChange={(value) => setPracticaForm({ ...practicaForm, loteId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná lote" />
                          </SelectTrigger>
                          <SelectContent>
                            {lotes.map((l) => (
                              <SelectItem key={l.id} value={l.id}>
                                {l.nombre} ({l.hectareas} ha)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setPracticaDialogOpen(false)}>
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
              ) : practicas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay prácticas registradas</p>
                  <Button onClick={() => setPracticaDialogOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar primera práctica
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {practicas.map((practica) => (
                    <Card key={practica.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{practica.nombre}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {practica.tipo}
                              </span>
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            !practica.fechaFin ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {!practica.fechaFin ? "Activa" : "Finalizada"}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-700">{practica.descripcion}</p>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-gray-500">Inicio:</span>
                            <span className="font-medium">{formatDate(practica.fechaInicio)}</span>
                          </div>
                          {practica.fechaFin && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Fin:</span>
                              <span className="font-medium">{formatDate(practica.fechaFin)}</span>
                            </div>
                          )}
                          {practica.beneficio && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-green-700">
                                <strong>Beneficio:</strong> {practica.beneficio}
                              </p>
                            </div>
                          )}
                          {practica.lote && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Lote:</span>
                              <span className="font-medium">{practica.lote.nombre}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB CERTIFICACIONES */}
        <TabsContent value="certificaciones">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Certificaciones</CardTitle>
                <CardDescription>Certificaciones ambientales y de sostenibilidad</CardDescription>
              </div>
              <Dialog open={certificacionDialogOpen} onOpenChange={setCertificacionDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Certificación
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateCertificacion}>
                    <DialogHeader>
                      <DialogTitle>Registrar Certificación</DialogTitle>
                      <DialogDescription>
                        Registrá una certificación ambiental obtenida
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Tipo de Certificación *</Label>
                        <Select
                          value={certificacionForm.nombre}
                          onValueChange={(value) => setCertificacionForm({ ...certificacionForm, nombre: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_CERTIFICACION.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Entidad Emisora *</Label>
                        <Input
                          placeholder="Ej: SENASA, Rainforest Alliance"
                          value={certificacionForm.entidadEmisora}
                          onChange={(e) => setCertificacionForm({ ...certificacionForm, entidadEmisora: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Número de Registro (opcional)</Label>
                        <Input
                          placeholder="Ej: ORG-2024-001"
                          value={certificacionForm.numeroRegistro}
                          onChange={(e) => setCertificacionForm({ ...certificacionForm, numeroRegistro: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Fecha Emisión *</Label>
                          <Input
                            type="date"
                            value={certificacionForm.fechaEmision}
                            onChange={(e) => setCertificacionForm({ ...certificacionForm, fechaEmision: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fecha Vencimiento</Label>
                          <Input
                            type="date"
                            value={certificacionForm.fechaVencimiento}
                            onChange={(e) => setCertificacionForm({ ...certificacionForm, fechaVencimiento: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>URL Documento (opcional)</Label>
                        <Input
                          type="url"
                          placeholder="https://..."
                          value={certificacionForm.documentoUrl}
                          onChange={(e) => setCertificacionForm({ ...certificacionForm, documentoUrl: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCertificacionDialogOpen(false)}>
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
              ) : certificaciones.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay certificaciones registradas</p>
                  <Button onClick={() => setCertificacionDialogOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar primera certificación
                    </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {certificaciones.map((cert) => (
                    <Card key={cert.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center">
                              <Award className="h-5 w-5 mr-2 text-blue-600" />
                              {cert.nombre}
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">{cert.entidadEmisora}</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cert.estado === "Vigente" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {cert.estado}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {cert.numeroRegistro && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Registro:</span>
                              <span className="font-medium">{cert.numeroRegistro}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Emisión:</span>
                            <span className="font-medium">{formatDate(cert.fechaEmision)}</span>
                          </div>
                          {cert.fechaVencimiento && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Vencimiento:</span>
                              <span className="font-medium">{formatDate(cert.fechaVencimiento)}</span>
                            </div>
                          )}
                          {cert.documentoUrl && (
                            <div className="pt-2 border-t">
                              
                                href={cert.documentoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              <a>
                                Ver certificado
                              </a>
                            </div>
                          )}
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