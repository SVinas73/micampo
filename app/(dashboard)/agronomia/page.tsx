"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Sprout, Package, Plus, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Lote = {
  id: string;
  nombre: string;
  hectareas: number;
  cultivo: string | null;
};

type Siembra = {
  id: string;
  cultivo: string;
  variedad: string | null;
  fechaSiembra: string;
  hectareas: number;
  loteId: string;
  lote: {
    nombre: string;
  };
};

type Cosecha = {
  id: string;
  fechaCosecha: string;
  rendimiento: number;
  calidad: string | null;
  precioVenta: number | null;
  lote: {
    nombre: string;
  };
  siembra: {
    cultivo: string;
    variedad: string | null;
  };
};

const CULTIVOS = ["Soja", "Maíz", "Trigo", "Girasol", "Sorgo", "Cebada", "Avena", "Otro"];

export default function AgronomiaPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [siembras, setSiembras] = useState<Siembra[]>([]);
  const [cosechas, setCosechas] = useState<Cosecha[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [loteDialogOpen, setLoteDialogOpen] = useState(false);
  const [siembraDialogOpen, setSiembraDialogOpen] = useState(false);
  const [cosechaDialogOpen, setCosechaDialogOpen] = useState(false);

  // Forms
  const [loteForm, setLoteForm] = useState({
    nombre: "",
    hectareas: "",
    cultivo: "",
  });

  const [siembraForm, setSiembraForm] = useState({
    cultivo: "",
    variedad: "",
    fechaSiembra: new Date().toISOString().split("T")[0],
    hectareas: "",
    loteId: "",
  });

  const [cosechaForm, setCosechaForm] = useState({
    fechaCosecha: new Date().toISOString().split("T")[0],
    rendimiento: "",
    calidad: "",
    precioVenta: "",
    siembraId: "",
    loteId: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchLotes(), fetchSiembras(), fetchCosechas()]);
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
      console.error("Error al cargar lotes:", error);
    }
  };

  const fetchSiembras = async () => {
    try {
      const response = await fetch("/api/siembras");
      if (response.ok) {
        const data = await response.json();
        setSiembras(data);
      }
    } catch (error) {
      console.error("Error al cargar siembras:", error);
    }
  };

  const fetchCosechas = async () => {
    try {
      const response = await fetch("/api/cosechas");
      if (response.ok) {
        const data = await response.json();
        setCosechas(data);
      }
    } catch (error) {
      console.error("Error al cargar cosechas:", error);
    }
  };

  const handleCreateLote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/lotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loteForm),
      });

      if (response.ok) {
        setLoteDialogOpen(false);
        setLoteForm({ nombre: "", hectareas: "", cultivo: "" });
        fetchLotes();
      }
    } catch (error) {
      console.error("Error al crear lote:", error);
    }
  };

  const handleCreateSiembra = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/siembras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siembraForm),
      });

      if (response.ok) {
        setSiembraDialogOpen(false);
        setSiembraForm({
          cultivo: "",
          variedad: "",
          fechaSiembra: new Date().toISOString().split("T")[0],
          hectareas: "",
          loteId: "",
        });
        fetchSiembras();
      }
    } catch (error) {
      console.error("Error al crear siembra:", error);
    }
  };

  const handleCreateCosecha = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/cosechas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cosechaForm),
      });

      if (response.ok) {
        setCosechaDialogOpen(false);
        setCosechaForm({
          fechaCosecha: new Date().toISOString().split("T")[0],
          rendimiento: "",
          calidad: "",
          precioVenta: "",
          siembraId: "",
          loteId: "",
        });
        fetchCosechas();
      }
    } catch (error) {
      console.error("Error al crear cosecha:", error);
    }
  };

  const handleDeleteLote = async (id: string) => {
    if (!confirm("¿Eliminar este lote?")) return;
    try {
      const response = await fetch(`/api/lotes/${id}`, { method: "DELETE" });
      if (response.ok) fetchLotes();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteSiembra = async (id: string) => {
    if (!confirm("¿Eliminar esta siembra?")) return;
    try {
      const response = await fetch(`/api/siembras/${id}`, { method: "DELETE" });
      if (response.ok) fetchSiembras();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteCosecha = async (id: string) => {
    if (!confirm("¿Eliminar esta cosecha?")) return;
    try {
      const response = await fetch(`/api/cosechas/${id}`, { method: "DELETE" });
      if (response.ok) fetchCosechas();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agronomía</h1>
        <p className="text-gray-600 mt-2">
          Gestioná tus lotes, siembras y cosechas
        </p>
      </div>

      <Tabs defaultValue="lotes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lotes">
            <MapPin className="h-4 w-4 mr-2" />
            Lotes
          </TabsTrigger>
          <TabsTrigger value="siembras">
            <Sprout className="h-4 w-4 mr-2" />
            Siembras
          </TabsTrigger>
          <TabsTrigger value="cosechas">
            <Package className="h-4 w-4 mr-2" />
            Cosechas
          </TabsTrigger>
        </TabsList>

        {/* TAB LOTES */}
        <TabsContent value="lotes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lotes</CardTitle>
                <CardDescription>Gestión de parcelas y campos</CardDescription>
              </div>
              <Dialog open={loteDialogOpen} onOpenChange={setLoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Lote
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateLote}>
                    <DialogHeader>
                      <DialogTitle>Crear Lote</DialogTitle>
                      <DialogDescription>
                        Registrá un nuevo lote o parcela
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input
                          placeholder="Lote 1"
                          value={loteForm.nombre}
                          onChange={(e) => setLoteForm({ ...loteForm, nombre: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hectáreas</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="100"
                          value={loteForm.hectareas}
                          onChange={(e) => setLoteForm({ ...loteForm, hectareas: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cultivo Actual (opcional)</Label>
                        <Select
                          value={loteForm.cultivo}
                          onValueChange={(value) => setLoteForm({ ...loteForm, cultivo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná cultivo" />
                          </SelectTrigger>
                          <SelectContent>
                            {CULTIVOS.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setLoteDialogOpen(false)}>
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
              ) : lotes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay lotes registrados</p>
                  <Button onClick={() => setLoteDialogOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer lote
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {lotes.map((lote) => (
                    <Card key={lote.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{lote.nombre}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              {lote.hectareas} ha
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLote(lote.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {lote.cultivo && (
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {lote.cultivo}
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

        {/* TAB SIEMBRAS */}
        <TabsContent value="siembras">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Siembras</CardTitle>
                <CardDescription>Registro de siembras y cultivos</CardDescription>
              </div>
              <Dialog open={siembraDialogOpen} onOpenChange={setSiembraDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={lotes.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Siembra
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateSiembra}>
                    <DialogHeader>
                      <DialogTitle>Registrar Siembra</DialogTitle>
                      <DialogDescription>
                        Registrá una nueva siembra en tu lote
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Lote</Label>
                        <Select
                          value={siembraForm.loteId}
                          onValueChange={(value) => setSiembraForm({ ...siembraForm, loteId: value })}
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
                      <div className="space-y-2">
                        <Label>Cultivo</Label>
                        <Select
                          value={siembraForm.cultivo}
                          onValueChange={(value) => setSiembraForm({ ...siembraForm, cultivo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná cultivo" />
                          </SelectTrigger>
                          <SelectContent>
                            {CULTIVOS.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Variedad (opcional)</Label>
                        <Input
                          placeholder="DM 4670"
                          value={siembraForm.variedad}
                          onChange={(e) => setSiembraForm({ ...siembraForm, variedad: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hectáreas</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="100"
                          value={siembraForm.hectareas}
                          onChange={(e) => setSiembraForm({ ...siembraForm, hectareas: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha de Siembra</Label>
                        <Input
                          type="date"
                          value={siembraForm.fechaSiembra}
                          onChange={(e) => setSiembraForm({ ...siembraForm, fechaSiembra: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setSiembraDialogOpen(false)}>
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
              ) : siembras.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay siembras registradas</p>
                  {lotes.length === 0 ? (
                    <p className="text-sm text-gray-400">Primero creá un lote</p>
                  ) : (
                    <Button onClick={() => setSiembraDialogOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar primera siembra
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Lote</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Cultivo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Variedad</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Hectáreas</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siembras.map((siembra) => (
                        <tr key={siembra.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{formatDate(siembra.fechaSiembra)}</td>
                          <td className="py-3 px-4 text-sm">{siembra.lote.nombre}</td>
                          <td className="py-3 px-4 text-sm">{siembra.cultivo}</td>
                          <td className="py-3 px-4 text-sm">{siembra.variedad || "-"}</td>
                          <td className="py-3 px-4 text-sm text-right">{siembra.hectareas} ha</td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSiembra(siembra.id)}
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

        {/* TAB COSECHAS */}
        <TabsContent value="cosechas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cosechas</CardTitle>
                <CardDescription>Registro de cosechas y rendimientos</CardDescription>
              </div>
              <Dialog open={cosechaDialogOpen} onOpenChange={setCosechaDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={siembras.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Cosecha
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateCosecha}>
                    <DialogHeader>
                      <DialogTitle>Registrar Cosecha</DialogTitle>
                      <DialogDescription>
                        Registrá el resultado de tu cosecha
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Siembra</Label>
                        <Select
                          value={cosechaForm.siembraId}
                          onValueChange={(value) => {
                            const siembra = siembras.find(s => s.id === value);
                            setCosechaForm({ 
                              ...cosechaForm, 
                              siembraId: value,
                              loteId: siembra?.loteId || ""
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná siembra" />
                          </SelectTrigger>
                          <SelectContent>
                            {siembras.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.cultivo} - {s.lote.nombre} ({formatDate(s.fechaSiembra)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha de Cosecha</Label>
                        <Input
                          type="date"
                          value={cosechaForm.fechaCosecha}
                          onChange={(e) => setCosechaForm({ ...cosechaForm, fechaCosecha: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rendimiento (kg/ha)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="3500"
                          value={cosechaForm.rendimiento}
                          onChange={(e) => setCosechaForm({ ...cosechaForm, rendimiento: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Calidad (opcional)</Label>
                        <Input
                          placeholder="Grado 2"
                          value={cosechaForm.calidad}
                          onChange={(e) => setCosechaForm({ ...cosechaForm, calidad: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Precio de Venta USD/ton (opcional)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="250"
                          value={cosechaForm.precioVenta}
                          onChange={(e) => setCosechaForm({ ...cosechaForm, precioVenta: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCosechaDialogOpen(false)}>
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
              ) : cosechas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay cosechas registradas</p>
                  {siembras.length === 0 ? (
                    <p className="text-sm text-gray-400">Primero registrá una siembra</p>
                  ) : (
                    <Button onClick={() => setCosechaDialogOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar primera cosecha
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Lote</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Cultivo</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Rendimiento</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Calidad</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Precio</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cosechas.map((cosecha) => (
                        <tr key={cosecha.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{formatDate(cosecha.fechaCosecha)}</td>
                          <td className="py-3 px-4 text-sm">{cosecha.lote.nombre}</td>
                          <td className="py-3 px-4 text-sm">{cosecha.siembra.cultivo}</td>
                          <td className="py-3 px-4 text-sm text-right font-medium text-green-600">
                            {cosecha.rendimiento.toLocaleString()} kg/ha
                          </td>
                          <td className="py-3 px-4 text-sm">{cosecha.calidad || "-"}</td>
                          <td className="py-3 px-4 text-sm text-right">
                            {cosecha.precioVenta ? `$${cosecha.precioVenta.toLocaleString()}/ton` : "-"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCosecha(cosecha.id)}
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
      </Tabs>
    </div>
  );
}