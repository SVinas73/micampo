"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Plus, Trash2, Package } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Labor = {
  id: string;
  tipo: string;
  fecha: string;
  superficieTrabajada: number;
  descripcion: string;
  observaciones: string | null;
  operarios: string | null;
  horasTrabajadas: number | null;
  lote: {
    nombre: string;
    hectareas: number;
  };
  maquina: {
    nombre: string;
  } | null;
  aplicacionesProductos: AplicacionProducto[];
};

type AplicacionProducto = {
  id: string;
  tipoProducto: string;
  nombreProducto: string;
  principioActivo: string | null;
  dosis: number;
  unidadDosis: string;
  metodoAplicacion: string | null;
};

type Lote = {
  id: string;
  nombre: string;
  hectareas: number;
};

type Maquina = {
  id: string;
  nombre: string;
  tipo: string;
};

const TIPOS_LABOR = [
  "Siembra",
  "Cosecha",
  "Pulverización",
  "Fertilización",
  "Labranza",
  "Riego",
  "Otra",
];

const TIPOS_PRODUCTO = [
  "Herbicida",
  "Insecticida",
  "Fungicida",
  "Fertilizante",
  "Otro",
];

const UNIDADES_DOSIS = ["L/ha", "kg/ha", "cc/ha", "gr/ha"];

const METODOS_APLICACION = ["Terrestre", "Aéreo", "Manual"];

export default function CuadernoCampoPage() {
  const [labores, setLabores] = useState<Labor[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);

  const [laborDialogOpen, setLaborDialogOpen] = useState(false);

  const [laborForm, setLaborForm] = useState({
    tipo: "",
    fecha: new Date().toISOString().split("T")[0],
    loteId: "",
    superficieTrabajada: "",
    descripcion: "",
    observaciones: "",
    operarios: "",
    horasTrabajadas: "",
    maquinaId: "",
  });

  const [productos, setProductos] = useState<any[]>([]);
  const [productoForm, setProductoForm] = useState({
    tipoProducto: "",
    nombreProducto: "",
    principioActivo: "",
    dosis: "",
    unidadDosis: "",
    metodoAplicacion: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchLabores(), fetchLotes(), fetchMaquinas()]);
    setLoading(false);
  };

  const fetchLabores = async () => {
    try {
      const response = await fetch("/api/labores");
      if (response.ok) {
        const data = await response.json();
        setLabores(data);
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

  const fetchMaquinas = async () => {
    try {
      const response = await fetch("/api/maquinas");
      if (response.ok) {
        const data = await response.json();
        setMaquinas(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleAgregarProducto = () => {
    if (!productoForm.tipoProducto || !productoForm.nombreProducto || !productoForm.dosis || !productoForm.unidadDosis) {
      alert("Completá todos los campos del producto");
      return;
    }

    setProductos([...productos, { ...productoForm }]);
    setProductoForm({
      tipoProducto: "",
      nombreProducto: "",
      principioActivo: "",
      dosis: "",
      unidadDosis: "",
      metodoAplicacion: "",
    });
  };

  const handleEliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const handleCreateLabor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/labores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...laborForm,
          productos: productos.length > 0 ? productos : null,
        }),
      });

      if (response.ok) {
        setLaborDialogOpen(false);
        setLaborForm({
          tipo: "",
          fecha: new Date().toISOString().split("T")[0],
          loteId: "",
          superficieTrabajada: "",
          descripcion: "",
          observaciones: "",
          operarios: "",
          horasTrabajadas: "",
          maquinaId: "",
        });
        setProductos([]);
        fetchLabores();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteLabor = async (id: string) => {
    if (!confirm("¿Eliminar esta labor?")) return;
    try {
      const response = await fetch(`/api/labores/${id}`, { method: "DELETE" });
      if (response.ok) fetchLabores();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const totalSuperficie = labores.reduce((sum, l) => sum + l.superficieTrabajada, 0);
  const totalHoras = labores.reduce((sum, l) => sum + (l.horasTrabajadas || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cuaderno de Campo Digital</h1>
        <p className="text-gray-600 mt-2">
          Registro de labores agrícolas y trazabilidad
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Labores
            </CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labores.length}</div>
            <p className="text-xs text-gray-500 mt-1">Registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Superficie Trabajada
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuperficie.toFixed(1)} ha</div>
            <p className="text-xs text-gray-500 mt-1">Acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Horas Trabajadas
            </CardTitle>
            <BookOpen className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoras.toFixed(1)} hs</div>
            <p className="text-xs text-gray-500 mt-1">Personal y maquinaria</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Labores Registradas</CardTitle>
            <CardDescription>Historial completo de actividades del campo</CardDescription>
          </div>
          <Dialog open={laborDialogOpen} onOpenChange={setLaborDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Labor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleCreateLabor}>
                <DialogHeader>
                  <DialogTitle>Registrar Labor</DialogTitle>
                  <DialogDescription>
                    Registrá una nueva actividad en el campo
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Labor *</Label>
                      <Select
                        value={laborForm.tipo}
                        onValueChange={(value) => setLaborForm({ ...laborForm, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccioná tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_LABOR.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha *</Label>
                      <Input
                        type="date"
                        value={laborForm.fecha}
                        onChange={(e) => setLaborForm({ ...laborForm, fecha: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Lote *</Label>
                      <Select
                        value={laborForm.loteId}
                        onValueChange={(value) => setLaborForm({ ...laborForm, loteId: value })}
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
                      <Label>Superficie Trabajada (ha) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="100"
                        value={laborForm.superficieTrabajada}
                        onChange={(e) => setLaborForm({ ...laborForm, superficieTrabajada: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción *</Label>
                    <Textarea
                      placeholder="Descripción detallada de la labor realizada"
                      value={laborForm.descripcion}
                      onChange={(e) => setLaborForm({ ...laborForm, descripcion: e.target.value })}
                      required
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Observaciones</Label>
                    <Textarea
                      placeholder="Observaciones adicionales"
                      value={laborForm.observaciones}
                      onChange={(e) => setLaborForm({ ...laborForm, observaciones: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Operarios</Label>
                      <Input
                        placeholder="Ej: Juan Pérez, María García"
                        value={laborForm.operarios}
                        onChange={(e) => setLaborForm({ ...laborForm, operarios: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horas Trabajadas</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="8"
                        value={laborForm.horasTrabajadas}
                        onChange={(e) => setLaborForm({ ...laborForm, horasTrabajadas: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Maquinaria Utilizada</Label>
                    <Select
                      value={laborForm.maquinaId}
                      onValueChange={(value) => setLaborForm({ ...laborForm, maquinaId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccioná maquinaria" />
                      </SelectTrigger>
                      <SelectContent>
                        {maquinas.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.nombre} - {m.tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-4 flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      Productos Aplicados (opcional)
                    </h3>

                    {productos.length > 0 && (
                      <div className="mb-4 space-y-2">
                        {productos.map((p, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="text-sm">
                              <span className="font-medium">{p.nombreProducto}</span>
                              {" - "}
                              <span className="text-gray-600">{p.tipoProducto}</span>
                              {" - "}
                              <span className="font-medium">{p.dosis} {p.unidadDosis}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEliminarProducto(index)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo Producto</Label>
                        <Select
                          value={productoForm.tipoProducto}
                          onValueChange={(value) => setProductoForm({ ...productoForm, tipoProducto: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_PRODUCTO.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nombre Producto</Label>
                        <Input
                          placeholder="Ej: Roundup"
                          value={productoForm.nombreProducto}
                          onChange={(e) => setProductoForm({ ...productoForm, nombreProducto: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>Dosis</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="2.5"
                          value={productoForm.dosis}
                          onChange={(e) => setProductoForm({ ...productoForm, dosis: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unidad</Label>
                        <Select
                          value={productoForm.unidadDosis}
                          onValueChange={(value) => setProductoForm({ ...productoForm, unidadDosis: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIDADES_DOSIS.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Método</Label>
                        <Select
                          value={productoForm.metodoAplicacion}
                          onValueChange={(value) => setProductoForm({ ...productoForm, metodoAplicacion: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Método" />
                          </SelectTrigger>
                          <SelectContent>
                            {METODOS_APLICACION.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={handleAgregarProducto}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Producto
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setLaborDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Guardar Labor
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : labores.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No hay labores registradas</p>
              <Button onClick={() => setLaborDialogOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Registrar primera labor
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {labores.map((labor) => (
                <Card key={labor.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{labor.tipo}</CardTitle>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {labor.lote.nombre}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(labor.fecha)} • {labor.superficieTrabajada} ha trabajadas
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLabor(labor.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div>
                        <strong>Descripción:</strong> {labor.descripcion}
                      </div>
                      {labor.observaciones && (
                        <div>
                          <strong>Observaciones:</strong> {labor.observaciones}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        {labor.operarios && (
                          <div>
                            <strong>Operarios:</strong> {labor.operarios}
                          </div>
                        )}
                        {labor.horasTrabajadas && (
                          <div>
                            <strong>Horas:</strong> {labor.horasTrabajadas} hs
                          </div>
                        )}
                        {labor.maquina && (
                          <div>
                            <strong>Maquinaria:</strong> {labor.maquina.nombre}
                          </div>
                        )}
                      </div>
                      {labor.aplicacionesProductos.length > 0 && (
                        <div className="pt-2 border-t">
                          <strong className="block mb-2">Productos Aplicados:</strong>
                          <div className="space-y-1">
                            {labor.aplicacionesProductos.map((prod) => (
                              <div key={prod.id} className="bg-blue-50 p-2 rounded text-sm">
                                <strong>{prod.nombreProducto}</strong>
                                {" - "}
                                <span className="text-blue-700">{prod.tipoProducto}</span>
                                {" - "}
                                <span className="font-medium">{prod.dosis} {prod.unidadDosis}</span>
                                {prod.metodoAplicacion && ` (${prod.metodoAplicacion})`}
                              </div>
                            ))}
                          </div>
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
    </div>
  );
}