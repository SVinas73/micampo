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
import { Truck, Wrench, Clock, Plus, Trash2 } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

type Maquina = {
  id: string;
  nombre: string;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  horasActuales: number;
  estado: string;
  mantenimientos: any[];
  _count: {
    mantenimientos: number;
    registrosHoras: number;
  };
};

type Mantenimiento = {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  costo: number | null;
  horasActuales: number | null;
  maquina: {
    nombre: string;
  };
};

const TIPOS_MAQUINA = [
  "Tractor",
  "Cosechadora",
  "Sembradora",
  "Pulverizadora",
  "Rastra",
  "Arado",
  "Fertilizadora",
  "Otro",
];

const TIPOS_MANTENIMIENTO = ["Preventivo", "Correctivo"];

export default function MaquinariaPage() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [maquinaDialogOpen, setMaquinaDialogOpen] = useState(false);
  const [mantenimientoDialogOpen, setMantenimientoDialogOpen] = useState(false);

  // Forms
  const [maquinaForm, setMaquinaForm] = useState({
    nombre: "",
    tipo: "",
    marca: "",
    modelo: "",
    anio: "",
    horasActuales: "",
  });

  const [mantenimientoForm, setMantenimientoForm] = useState({
    tipo: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    costo: "",
    horasActuales: "",
    maquinaId: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchMaquinas(), fetchMantenimientos()]);
    setLoading(false);
  };

  const fetchMaquinas = async () => {
    try {
      const response = await fetch("/api/maquinas");
      if (response.ok) {
        const data = await response.json();
        setMaquinas(data);
      }
    } catch (error) {
      console.error("Error al cargar maquinas:", error);
    }
  };

  const fetchMantenimientos = async () => {
    try {
      const response = await fetch("/api/mantenimientos");
      if (response.ok) {
        const data = await response.json();
        setMantenimientos(data);
      }
    } catch (error) {
      console.error("Error al cargar mantenimientos:", error);
    }
  };

  const handleCreateMaquina = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/maquinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(maquinaForm),
      });

      if (response.ok) {
        setMaquinaDialogOpen(false);
        setMaquinaForm({
          nombre: "",
          tipo: "",
          marca: "",
          modelo: "",
          anio: "",
          horasActuales: "",
        });
        fetchMaquinas();
      }
    } catch (error) {
      console.error("Error al crear maquina:", error);
    }
  };

  const handleCreateMantenimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/mantenimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mantenimientoForm),
      });

      if (response.ok) {
        setMantenimientoDialogOpen(false);
        setMantenimientoForm({
          tipo: "",
          descripcion: "",
          fecha: new Date().toISOString().split("T")[0],
          costo: "",
          horasActuales: "",
          maquinaId: "",
        });
        fetchMantenimientos();
        fetchMaquinas(); // Para actualizar las horas
      }
    } catch (error) {
      console.error("Error al crear mantenimiento:", error);
    }
  };

  const handleDeleteMaquina = async (id: string) => {
    if (!confirm("¿Eliminar esta máquina?")) return;
    try {
      const response = await fetch(`/api/maquinas/${id}`, { method: "DELETE" });
      if (response.ok) fetchMaquinas();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const maquinasOperativas = maquinas.filter((m) => m.estado === "Operativa");
  const totalHoras = maquinas.reduce((sum, m) => sum + m.horasActuales, 0);
  const costoTotal = mantenimientos.reduce((sum, m) => sum + (m.costo || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Maquinaria</h1>
        <p className="text-gray-600 mt-2">
          Gestioná tu flota, mantenimientos y horas de uso
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Máquinas
            </CardTitle>
            <Truck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maquinasOperativas.length}</div>
            <p className="text-xs text-gray-500 mt-1">Operativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Horas Totales
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoras.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Horas acumuladas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Costo Mantenimientos
            </CardTitle>
            <Wrench className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(costoTotal)}</div>
            <p className="text-xs text-gray-500 mt-1">{mantenimientos.length} registros</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="maquinas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="maquinas">
            <Truck className="h-4 w-4 mr-2" />
            Máquinas
          </TabsTrigger>
          <TabsTrigger value="mantenimientos">
            <Wrench className="h-4 w-4 mr-2" />
            Mantenimientos
          </TabsTrigger>
        </TabsList>

        {/* TAB MAQUINAS */}
        <TabsContent value="maquinas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Máquinas</CardTitle>
                <CardDescription>Gestión de la flota</CardDescription>
              </div>
              <Dialog open={maquinaDialogOpen} onOpenChange={setMaquinaDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Máquina
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateMaquina}>
                    <DialogHeader>
                      <DialogTitle>Registrar Máquina</DialogTitle>
                      <DialogDescription>
                        Agregá una nueva máquina a la flota
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Nombre *</Label>
                        <Input
                          placeholder="Tractor John Deere"
                          value={maquinaForm.nombre}
                          onChange={(e) => setMaquinaForm({ ...maquinaForm, nombre: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo *</Label>
                        <Select
                          value={maquinaForm.tipo}
                          onValueChange={(value) => setMaquinaForm({ ...maquinaForm, tipo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_MAQUINA.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Marca</Label>
                          <Input
                            placeholder="John Deere"
                            value={maquinaForm.marca}
                            onChange={(e) => setMaquinaForm({ ...maquinaForm, marca: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Modelo</Label>
                          <Input
                            placeholder="6125R"
                            value={maquinaForm.modelo}
                            onChange={(e) => setMaquinaForm({ ...maquinaForm, modelo: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Año</Label>
                          <Input
                            type="number"
                            placeholder="2020"
                            value={maquinaForm.anio}
                            onChange={(e) => setMaquinaForm({ ...maquinaForm, anio: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Horas Actuales</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="1500"
                            value={maquinaForm.horasActuales}
                            onChange={(e) => setMaquinaForm({ ...maquinaForm, horasActuales: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setMaquinaDialogOpen(false)}>
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
              ) : maquinas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay máquinas registradas</p>
                  <Button onClick={() => setMaquinaDialogOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar primera máquina
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {maquinas.map((maquina) => (
                    <Card key={maquina.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{maquina.nombre}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              {maquina.tipo} {maquina.marca && `- ${maquina.marca}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMaquina(maquina.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {maquina.modelo && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Modelo:</span>
                              <span className="font-medium">{maquina.modelo}</span>
                            </div>
                          )}
                          {maquina.anio && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Año:</span>
                              <span className="font-medium">{maquina.anio}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Horas:</span>
                            <span className="font-medium text-blue-600">
                              {maquina.horasActuales.toLocaleString()} hs
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Mantenimientos:</span>
                            <span className="font-medium">{maquina._count.mantenimientos}</span>
                          </div>
                          <div className="pt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              maquina.estado === "Operativa"
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }`}>
                              {maquina.estado}
                            </span>
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

        {/* TAB MANTENIMIENTOS */}
        <TabsContent value="mantenimientos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mantenimientos</CardTitle>
                <CardDescription>Registro de mantenimientos preventivos y correctivos</CardDescription>
              </div>
              <Dialog open={mantenimientoDialogOpen} onOpenChange={setMantenimientoDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={maquinas.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Mantenimiento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateMantenimiento}>
                    <DialogHeader>
                      <DialogTitle>Registrar Mantenimiento</DialogTitle>
                      <DialogDescription>
                        Registrá un mantenimiento preventivo o correctivo
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Máquina *</Label>
                        <Select
                          value={mantenimientoForm.maquinaId}
                          onValueChange={(value) => {
                            const maquina = maquinas.find(m => m.id === value);
                            setMantenimientoForm({ 
                              ...mantenimientoForm, 
                              maquinaId: value,
                              horasActuales: maquina?.horasActuales.toString() || ""
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná máquina" />
                          </SelectTrigger>
                          <SelectContent>
                            {maquinas.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.nombre} ({m.horasActuales} hs)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo *</Label>
                        <Select
                          value={mantenimientoForm.tipo}
                          onValueChange={(value) => setMantenimientoForm({ ...mantenimientoForm, tipo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_MANTENIMIENTO.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción *</Label>
                        <Textarea
                          placeholder="Cambio de aceite y filtros"
                          value={mantenimientoForm.descripcion}
                          onChange={(e) => setMantenimientoForm({ ...mantenimientoForm, descripcion: e.target.value })}
                          required
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha *</Label>
                        <Input
                          type="date"
                          value={mantenimientoForm.fecha}
                          onChange={(e) => setMantenimientoForm({ ...mantenimientoForm, fecha: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Costo (USD)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="500"
                            value={mantenimientoForm.costo}
                            onChange={(e) => setMantenimientoForm({ ...mantenimientoForm, costo: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Horas Actuales</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="1500"
                            value={mantenimientoForm.horasActuales}
                            onChange={(e) => setMantenimientoForm({ ...mantenimientoForm, horasActuales: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setMantenimientoDialogOpen(false)}>
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
              ) : mantenimientos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay mantenimientos registrados</p>
                  {maquinas.length === 0 ? (
                    <p className="text-sm text-gray-400">Primero registrá una máquina</p>
                  ) : (
                    <Button onClick={() => setMantenimientoDialogOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar primer mantenimiento
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Máquina</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Descripción</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Horas</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mantenimientos.map((mantenimiento) => (
                        <tr key={mantenimiento.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{formatDate(mantenimiento.fecha)}</td>
                          <td className="py-3 px-4 text-sm font-medium">{mantenimiento.maquina.nombre}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              mantenimiento.tipo === "Preventivo"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-orange-100 text-orange-800"
                            }`}>
                              {mantenimiento.tipo}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">{mantenimiento.descripcion}</td>
                          <td className="py-3 px-4 text-sm text-right">
                            {mantenimiento.horasActuales ? `${mantenimiento.horasActuales.toLocaleString()} hs` : "-"}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-medium">
                            {mantenimiento.costo ? formatCurrency(mantenimiento.costo) : "-"}
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