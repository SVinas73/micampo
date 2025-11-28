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

type Producto = {
  id: string;
  nombre: string;
  tipo: string;
  unidad: string;
  ubicaciones: {
    id: string;
    ubicacion: string;
    cantidad: number;
  }[];
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
  const [productosInventario, setProductosInventario] = useState<Producto[]>([]);
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
    productos: [] as Array<{
      tipoProducto: string;
      nombreProducto: string;
      principioActivo: string;
      dosis: string;
      unidadDosis: string;
      metodoAplicacion: string;
      productoId: string;
      ubicacionId: string;
    }>,
  });

  useEffect(() => {
    fetchAll();
    fetchProductosInventario();
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

  const fetchProductosInventario = async () => {
    try {
      const response = await fetch("/api/productos");
      if (response.ok) {
        const data = await response.json();
        setProductosInventario(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCreateLabor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/labores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(laborForm),
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
          productos: [],
        });
        fetchLabores();
        fetchProductosInventario(); // Refrescar inventario después del descuento automático
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
          Registro de labores agrícolas y trazabilidad con descuento automático de stock
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleCreateLabor}>
                <DialogHeader>
                  <DialogTitle>Registrar Labor</DialogTitle>
                  <DialogDescription>
                    Registrá una nueva actividad en el campo con descuento automático de stock
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

                  {/* SECCIÓN DE PRODUCTOS CON REGISTRO ATÓMICO */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        <Label className="text-base font-semibold">Productos Aplicados (Opcional)</Label>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLaborForm({
                            ...laborForm,
                            productos: [
                              ...laborForm.productos,
                              {
                                tipoProducto: "",
                                nombreProducto: "",
                                principioActivo: "",
                                dosis: "",
                                unidadDosis: "",
                                metodoAplicacion: "",
                                productoId: "",
                                ubicacionId: "",
                              },
                            ],
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Producto
                      </Button>
                    </div>

                    {laborForm.productos.map((prod, index) => (
                      <Card key={index} className="p-3 bg-gray-50 mb-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Tipo</Label>
                            <Select
                              value={prod.tipoProducto}
                              onValueChange={(value) => {
                                const newProds = [...laborForm.productos];
                                newProds[index].tipoProducto = value;
                                setLaborForm({ ...laborForm, productos: newProds });
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Herbicida">Herbicida</SelectItem>
                                <SelectItem value="Insecticida">Insecticida</SelectItem>
                                <SelectItem value="Fungicida">Fungicida</SelectItem>
                                <SelectItem value="Fertilizante">Fertilizante</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Producto del Inventario</Label>
                            <Select
                              value={prod.productoId}
                              onValueChange={(value) => {
                                const newProds = [...laborForm.productos];
                                const productoSeleccionado = productosInventario.find(p => p.id === value);
                                if (productoSeleccionado) {
                                  newProds[index].productoId = value;
                                  newProds[index].nombreProducto = productoSeleccionado.nombre;
                                  // Seleccionar primera ubicación disponible
                                  if (productoSeleccionado.ubicaciones.length > 0) {
                                    newProds[index].ubicacionId = productoSeleccionado.ubicaciones[0].id;
                                  }
                                }
                                setLaborForm({ ...laborForm, productos: newProds });
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {productosInventario.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.nombre} ({p.ubicaciones.reduce((sum, u) => sum + u.cantidad, 0)} {p.unidad})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Ubicación Stock</Label>
                            <Select
                              value={prod.ubicacionId}
                              onValueChange={(value) => {
                                const newProds = [...laborForm.productos];
                                newProds[index].ubicacionId = value;
                                setLaborForm({ ...laborForm, productos: newProds });
                              }}
                              disabled={!prod.productoId}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Ubicación" />
                              </SelectTrigger>
                              <SelectContent>
                                {productosInventario
                                  .find(p => p.id === prod.productoId)
                                  ?.ubicaciones.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                      {u.ubicacion} ({u.cantidad} disponible)
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Nombre Comercial</Label>
                            <Input
                              className="h-8"
                              placeholder="Ej: Glifosato 48%"
                              value={prod.nombreProducto}
                              onChange={(e) => {
                                const newProds = [...laborForm.productos];
                                newProds[index].nombreProducto = e.target.value;
                                setLaborForm({ ...laborForm, productos: newProds });
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Principio Activo</Label>
                            <Input
                              className="h-8"
                              placeholder="Ej: Glifosato"
                              value={prod.principioActivo}
                              onChange={(e) => {
                                const newProds = [...laborForm.productos];
                                newProds[index].principioActivo = e.target.value;
                                setLaborForm({ ...laborForm, productos: newProds });
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Dosis por Ha</Label>
                            <Input
                              className="h-8"
                              type="number"
                              step="0.01"
                              placeholder="2.5"
                              value={prod.dosis}
                              onChange={(e) => {
                                const newProds = [...laborForm.productos];
                                newProds[index].dosis = e.target.value;
                                setLaborForm({ ...laborForm, productos: newProds });
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Unidad</Label>
                            <Select
                              value={prod.unidadDosis}
                              onValueChange={(value) => {
                                const newProds = [...laborForm.productos];
                                newProds[index].unidadDosis = value;
                                setLaborForm({ ...laborForm, productos: newProds });
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Unidad" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="L/ha">L/ha</SelectItem>
                                <SelectItem value="kg/ha">kg/ha</SelectItem>
                                <SelectItem value="cc/ha">cc/ha</SelectItem>
                                <SelectItem value="gr/ha">gr/ha</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Método</Label>
                            <Select
                              value={prod.metodoAplicacion}
                              onValueChange={(value) => {
                                const newProds = [...laborForm.productos];
                                newProds[index].metodoAplicacion = value;
                                setLaborForm({ ...laborForm, productos: newProds });
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Método" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Terrestre">Terrestre</SelectItem>
                                <SelectItem value="Aéreo">Aéreo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => {
                                const newProds = laborForm.productos.filter((_, i) => i !== index);
                                setLaborForm({ ...laborForm, productos: newProds });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Cálculo automático de cantidad total */}
                        {prod.dosis && laborForm.superficieTrabajada && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <strong>Cantidad total requerida:</strong>{" "}
                            {(parseFloat(prod.dosis) * parseFloat(laborForm.superficieTrabajada)).toFixed(2)}{" "}
                            {prod.unidadDosis?.replace("/ha", "")}
                            {prod.ubicacionId && productosInventario.find(p => p.id === prod.productoId)?.ubicaciones.find(u => u.id === prod.ubicacionId) && (
                              <span className="ml-2">
                                | Stock disponible: {productosInventario.find(p => p.id === prod.productoId)?.ubicaciones.find(u => u.id === prod.ubicacionId)?.cantidad || 0}
                              </span>
                            )}
                          </div>
                        )}
                      </Card>
                    ))}

                    {laborForm.productos.length > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800">
                          <strong>⚡ Registro Atómico:</strong> Al guardar la labor, el stock de los productos seleccionados
                          se descontará automáticamente del inventario. No necesitás hacer el descuento manual.
                        </p>
                      </div>
                    )}
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
                          <div className="flex items-center gap-2 mb-2">
                            <strong>Productos Aplicados:</strong>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              ⚡ Stock descontado automáticamente ({labor.aplicacionesProductos.length} productos)
                            </span>
                          </div>
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