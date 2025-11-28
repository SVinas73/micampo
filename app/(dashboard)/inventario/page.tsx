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
import { Package, ArrowRightLeft, Warehouse, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Producto = {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  stockMinimo: number;
  ubicaciones: UbicacionProducto[];
  _count: {
    transferencias: number;
  };
};

type UbicacionProducto = {
  id: string;
  ubicacion: string;
  cantidad: number;
  lote: {
    nombre: string;
  } | null;
};

type Transferencia = {
  id: string;
  origenUbicacion: string;
  destinoUbicacion: string;
  cantidad: number;
  fecha: string;
  motivo: string | null;
  responsable: string | null;
  producto: {
    nombre: string;
    unidad: string;
  };
};

const CATEGORIAS_PRODUCTO = [
  "Semilla",
  "Fertilizante",
  "Fitosanitario",
  "Repuesto",
  "Combustible",
  "Otro",
];

const UNIDADES = ["kg", "L", "unidades", "bolsas", "ton"];

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(true);

  const [productoDialogOpen, setProductoDialogOpen] = useState(false);
  const [transferenciaDialogOpen, setTransferenciaDialogOpen] = useState(false);

  const [productoForm, setProductoForm] = useState({
    nombre: "",
    categoria: "",
    unidad: "",
    stockMinimo: "",
    ubicacionInicial: "",
    cantidadInicial: "",
  });

  const [transferenciaForm, setTransferenciaForm] = useState({
    productoId: "",
    origenUbicacion: "",
    destinoUbicacion: "",
    cantidad: "",
    fecha: new Date().toISOString().split("T")[0],
    motivo: "",
    responsable: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchProductos(), fetchTransferencias()]);
    setLoading(false);
  };

  const fetchProductos = async () => {
    try {
      const response = await fetch("/api/productos");
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchTransferencias = async () => {
    try {
      const response = await fetch("/api/transferencias-productos");
      if (response.ok) {
        const data = await response.json();
        setTransferencias(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCreateProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productoForm),
      });

      if (response.ok) {
        setProductoDialogOpen(false);
        setProductoForm({
          nombre: "",
          categoria: "",
          unidad: "",
          stockMinimo: "",
          ubicacionInicial: "",
          cantidadInicial: "",
        });
        fetchProductos();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCreateTransferencia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/transferencias-productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferenciaForm),
      });

      if (response.ok) {
        setTransferenciaDialogOpen(false);
        setTransferenciaForm({
          productoId: "",
          origenUbicacion: "",
          destinoUbicacion: "",
          cantidad: "",
          fecha: new Date().toISOString().split("T")[0],
          motivo: "",
          responsable: "",
        });
        fetchTransferencias();
        fetchProductos();
      } else {
        const error = await response.json();
        alert(error.error || "Error al crear transferencia");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const productoSeleccionado = productos.find(p => p.id === transferenciaForm.productoId);
  const ubicacionesDisponibles = productoSeleccionado?.ubicaciones.map(u => u.ubicacion) || [];

  const totalProductos = productos.length;
  const totalUbicaciones = productos.reduce((sum, p) => sum + p.ubicaciones.length, 0);
  const productosStockBajo = productos.filter(p => {
    const stockTotal = p.ubicaciones.reduce((sum, u) => sum + u.cantidad, 0);
    return stockTotal < p.stockMinimo;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
        <p className="text-gray-600 mt-2">
          Gestión de stock y transferencias entre depósitos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Productos
            </CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProductos}</div>
            <p className="text-xs text-gray-500 mt-1">En inventario</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Stock Bajo
            </CardTitle>
            <Warehouse className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{productosStockBajo}</div>
            <p className="text-xs text-gray-500 mt-1">Productos con stock bajo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Transferencias
            </CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transferencias.length}</div>
            <p className="text-xs text-gray-500 mt-1">Movimientos registrados</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="productos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="productos">
            <Package className="h-4 w-4 mr-2" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="transferencias">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transferencias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="productos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Productos</CardTitle>
                <CardDescription>Inventario de insumos y productos</CardDescription>
              </div>
              <Dialog open={productoDialogOpen} onOpenChange={setProductoDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Producto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateProducto}>
                    <DialogHeader>
                      <DialogTitle>Registrar Producto</DialogTitle>
                      <DialogDescription>
                        Agregá un nuevo producto al inventario
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Nombre *</Label>
                        <Input
                          placeholder="Ej: Urea"
                          value={productoForm.nombre}
                          onChange={(e) => setProductoForm({ ...productoForm, nombre: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Categoría *</Label>
                          <Select
                            value={productoForm.categoria}
                            onValueChange={(value) => setProductoForm({ ...productoForm, categoria: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIAS_PRODUCTO.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Unidad *</Label>
                          <Select
                            value={productoForm.unidad}
                            onValueChange={(value) => setProductoForm({ ...productoForm, unidad: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Unidad" />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIDADES.map((u) => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Stock Mínimo</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="100"
                          value={productoForm.stockMinimo}
                          onChange={(e) => setProductoForm({ ...productoForm, stockMinimo: e.target.value })}
                        />
                      </div>
                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-4">Stock Inicial (opcional)</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Ubicación</Label>
                            <Input
                              placeholder="Ej: Depósito Central"
                              value={productoForm.ubicacionInicial}
                              onChange={(e) => setProductoForm({ ...productoForm, ubicacionInicial: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Cantidad</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="500"
                              value={productoForm.cantidadInicial}
                              onChange={(e) => setProductoForm({ ...productoForm, cantidadInicial: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setProductoDialogOpen(false)}>
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
              ) : productos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay productos registrados</p>
                  <Button onClick={() => setProductoDialogOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar primer producto
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {productos.map((producto) => {
                    const stockTotal = producto.ubicaciones.reduce((sum, u) => sum + u.cantidad, 0);
                    const stockBajo = stockTotal < producto.stockMinimo;

                    return (
                      <Card key={producto.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{producto.nombre}</CardTitle>
                              <p className="text-sm text-gray-500 mt-1">
                                {producto.categoria} • {producto.unidad}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${stockBajo ? 'text-orange-600' : 'text-green-600'}`}>
                                {stockTotal.toLocaleString()}
                              </div>
                              <p className="text-xs text-gray-500">{producto.unidad}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {producto.ubicaciones.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-600">Ubicaciones:</p>
                              {producto.ubicaciones.map((ub) => (
                                <div key={ub.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                  <span>{ub.ubicacion}</span>
                                  <span className="font-medium">{ub.cantidad.toLocaleString()} {producto.unidad}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">Sin stock registrado</p>
                          )}
                          {stockBajo && (
                            <div className="mt-3 p-2 bg-orange-50 text-orange-800 text-xs rounded">
                              ⚠️ Stock bajo (mínimo: {producto.stockMinimo} {producto.unidad})
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transferencias">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transferencias</CardTitle>
                <CardDescription>Movimientos entre ubicaciones</CardDescription>
              </div>
              <Dialog open={transferenciaDialogOpen} onOpenChange={setTransferenciaDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={productos.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Transferencia
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateTransferencia}>
                    <DialogHeader>
                      <DialogTitle>Registrar Transferencia</DialogTitle>
                      <DialogDescription>
                        Transferir producto entre ubicaciones
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Producto *</Label>
                        <Select
                          value={transferenciaForm.productoId}
                          onValueChange={(value) => setTransferenciaForm({ 
                            ...transferenciaForm, 
                            productoId: value,
                            origenUbicacion: "",
                            destinoUbicacion: ""
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {productos.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.nombre} ({p.categoria})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Origen *</Label>
                          <Select
                            value={transferenciaForm.origenUbicacion}
                            onValueChange={(value) => setTransferenciaForm({ ...transferenciaForm, origenUbicacion: value })}
                            disabled={!transferenciaForm.productoId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ubicación" />
                            </SelectTrigger>
                            <SelectContent>
                              {ubicacionesDisponibles.map((u) => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Destino *</Label>
                          <Input
                            placeholder="Nueva ubicación"
                            value={transferenciaForm.destinoUbicacion}
                            onChange={(e) => setTransferenciaForm({ ...transferenciaForm, destinoUbicacion: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cantidad *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="100"
                            value={transferenciaForm.cantidad}
                            onChange={(e) => setTransferenciaForm({ ...transferenciaForm, cantidad: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fecha *</Label>
                          <Input
                            type="date"
                            value={transferenciaForm.fecha}
                            onChange={(e) => setTransferenciaForm({ ...transferenciaForm, fecha: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Motivo</Label>
                        <Input
                          placeholder="Ej: Reabastecimiento lote 1"
                          value={transferenciaForm.motivo}
                          onChange={(e) => setTransferenciaForm({ ...transferenciaForm, motivo: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Responsable</Label>
                        <Input
                          placeholder="Nombre del responsable"
                          value={transferenciaForm.responsable}
                          onChange={(e) => setTransferenciaForm({ ...transferenciaForm, responsable: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setTransferenciaDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Transferir
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : transferencias.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay transferencias registradas</p>
                  {productos.length === 0 ? (
                    <p className="text-sm text-gray-400">Primero registrá productos</p>
                  ) : (
                    <Button onClick={() => setTransferenciaDialogOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar primera transferencia
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Producto</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Origen</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Destino</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Cantidad</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transferencias.map((transferencia) => (
                        <tr key={transferencia.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{formatDate(transferencia.fecha)}</td>
                          <td className="py-3 px-4 text-sm font-medium">{transferencia.producto.nombre}</td>
                          <td className="py-3 px-4 text-sm">{transferencia.origenUbicacion}</td>
                          <td className="py-3 px-4 text-sm">{transferencia.destinoUbicacion}</td>
                          <td className="py-3 px-4 text-sm text-right font-medium text-blue-600">
                            {transferencia.cantidad.toLocaleString()} {transferencia.producto.unidad}
                          </td>
                          <td className="py-3 px-4 text-sm">{transferencia.motivo || "-"}</td>
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