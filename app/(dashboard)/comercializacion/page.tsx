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
import { TrendingUp, FileText, Package, Plus, Trash2 } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

type Contrato = {
  id: string;
  tipo: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  montoTotal: number;
  comprador: string | null;
  fechaContrato: string;
  fechaEntrega: string | null;
  estado: string;
  observaciones: string | null;
  entregas: Entrega[];
  _count: {
    entregas: number;
  };
};

type Entrega = {
  id: string;
  fecha: string;
  cantidad: number;
};

type PrecioReferencia = {
  id: string;
  producto: string;
  precio: number;
  fecha: string;
  fuente: string | null;
};

const PRODUCTOS = ["Soja", "Maíz", "Trigo", "Girasol", "Sorgo", "Cebada"];
const TIPOS_CONTRATO = ["Compra", "Venta"];

export default function ComercializacionPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [precios, setPrecios] = useState<PrecioReferencia[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [contratoDialogOpen, setContratoDialogOpen] = useState(false);
  const [entregaDialogOpen, setEntregaDialogOpen] = useState(false);
  const [precioDialogOpen, setPrecioDialogOpen] = useState(false);

  // Forms
  const [contratoForm, setContratoForm] = useState({
    tipo: "",
    producto: "",
    cantidad: "",
    precioUnitario: "",
    comprador: "",
    fechaContrato: new Date().toISOString().split("T")[0],
    fechaEntrega: "",
    observaciones: "",
  });

  const [entregaForm, setEntregaForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    cantidad: "",
    contratoId: "",
  });

  const [precioForm, setPrecioForm] = useState({
    producto: "",
    precio: "",
    fecha: new Date().toISOString().split("T")[0],
    fuente: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchContratos(), fetchPrecios()]);
    setLoading(false);
  };

  const fetchContratos = async () => {
    try {
      const response = await fetch("/api/contratos");
      if (response.ok) {
        const data = await response.json();
        setContratos(data);
      }
    } catch (error) {
      console.error("Error al cargar contratos:", error);
    }
  };

  const fetchPrecios = async () => {
    try {
      const response = await fetch("/api/precios-referencia");
      if (response.ok) {
        const data = await response.json();
        setPrecios(data);
      }
    } catch (error) {
      console.error("Error al cargar precios:", error);
    }
  };

  const handleCreateContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contratoForm),
      });

      if (response.ok) {
        setContratoDialogOpen(false);
        setContratoForm({
          tipo: "",
          producto: "",
          cantidad: "",
          precioUnitario: "",
          comprador: "",
          fechaContrato: new Date().toISOString().split("T")[0],
          fechaEntrega: "",
          observaciones: "",
        });
        fetchContratos();
      }
    } catch (error) {
      console.error("Error al crear contrato:", error);
    }
  };

  const handleCreateEntrega = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/entregas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entregaForm),
      });

      if (response.ok) {
        setEntregaDialogOpen(false);
        setEntregaForm({
          fecha: new Date().toISOString().split("T")[0],
          cantidad: "",
          contratoId: "",
        });
        fetchContratos();
      }
    } catch (error) {
      console.error("Error al crear entrega:", error);
    }
  };

  const handleCreatePrecio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/precios-referencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(precioForm),
      });

      if (response.ok) {
        setPrecioDialogOpen(false);
        setPrecioForm({
          producto: "",
          precio: "",
          fecha: new Date().toISOString().split("T")[0],
          fuente: "",
        });
        fetchPrecios();
      }
    } catch (error) {
      console.error("Error al crear precio:", error);
    }
  };

  const handleDeleteContrato = async (id: string) => {
    if (!confirm("¿Eliminar este contrato?")) return;
    try {
      const response = await fetch(`/api/contratos/${id}`, { method: "DELETE" });
      if (response.ok) fetchContratos();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const contratosPendientes = contratos.filter((c) => c.estado === "Pendiente");
  const totalCompras = contratos
    .filter((c) => c.tipo === "Compra")
    .reduce((sum, c) => sum + c.montoTotal, 0);
  const totalVentas = contratos
    .filter((c) => c.tipo === "Venta")
    .reduce((sum, c) => sum + c.montoTotal, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Comercialización</h1>
        <p className="text-gray-600 mt-2">
          Gestioná contratos, entregas y precios de referencia
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Contratos Activos
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contratosPendientes.length}</div>
            <p className="text-xs text-gray-500 mt-1">Pendientes de entrega</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Ventas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalVentas)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Contratos de venta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Compras
            </CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalCompras)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Contratos de compra</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contratos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contratos">
            <FileText className="h-4 w-4 mr-2" />
            Contratos
          </TabsTrigger>
          <TabsTrigger value="entregas">
            <Package className="h-4 w-4 mr-2" />
            Entregas
          </TabsTrigger>
          <TabsTrigger value="precios">
            <TrendingUp className="h-4 w-4 mr-2" />
            Precios
          </TabsTrigger>
        </TabsList>

        {/* TAB CONTRATOS */}
        <TabsContent value="contratos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contratos</CardTitle>
                <CardDescription>Gestión de contratos de compra y venta</CardDescription>
              </div>
              <Dialog open={contratoDialogOpen} onOpenChange={setContratoDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Contrato
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <form onSubmit={handleCreateContrato}>
                    <DialogHeader>
                      <DialogTitle>Crear Contrato</DialogTitle>
                      <DialogDescription>
                        Registrá un nuevo contrato de compra o venta
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Tipo *</Label>
                        <Select
                          value={contratoForm.tipo}
                          onValueChange={(value) => setContratoForm({ ...contratoForm, tipo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_CONTRATO.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Producto *</Label>
                        <Select
                          value={contratoForm.producto}
                          onValueChange={(value) => setContratoForm({ ...contratoForm, producto: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCTOS.map((p) => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Cantidad (ton) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="100"
                          value={contratoForm.cantidad}
                          onChange={(e) => setContratoForm({ ...contratoForm, cantidad: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Precio Unitario (USD/ton) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="350"
                          value={contratoForm.precioUnitario}
                          onChange={(e) => setContratoForm({ ...contratoForm, precioUnitario: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Comprador/Vendedor</Label>
                        <Input
                          placeholder="Nombre empresa"
                          value={contratoForm.comprador}
                          onChange={(e) => setContratoForm({ ...contratoForm, comprador: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha Contrato *</Label>
                        <Input
                          type="date"
                          value={contratoForm.fechaContrato}
                          onChange={(e) => setContratoForm({ ...contratoForm, fechaContrato: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha Entrega (opcional)</Label>
                        <Input
                          type="date"
                          value={contratoForm.fechaEntrega}
                          onChange={(e) => setContratoForm({ ...contratoForm, fechaEntrega: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Monto Total</Label>
                        <Input
                          value={
                            contratoForm.cantidad && contratoForm.precioUnitario
                              ? formatCurrency(parseFloat(contratoForm.cantidad) * parseFloat(contratoForm.precioUnitario))
                              : "$0.00"
                          }
                          disabled
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Observaciones</Label>
                        <Textarea
                          placeholder="Información adicional del contrato"
                          value={contratoForm.observaciones}
                          onChange={(e) => setContratoForm({ ...contratoForm, observaciones: e.target.value })}
                          rows={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setContratoDialogOpen(false)}>
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
              ) : contratos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay contratos registrados</p>
                  <Button onClick={() => setContratoDialogOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer contrato
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Producto</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Cantidad</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Precio</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contratos.map((contrato) => {
                        const totalEntregado = contrato.entregas.reduce((sum, e) => sum + e.cantidad, 0);
                        const porcentaje = (totalEntregado / contrato.cantidad) * 100;

                        return (
                          <tr key={contrato.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm">{formatDate(contrato.fechaContrato)}</td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                contrato.tipo === "Venta" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                              }`}>
                                {contrato.tipo}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm font-medium">{contrato.producto}</td>
                            <td className="py-3 px-4 text-sm text-right">
                              {contrato.cantidad.toLocaleString()} ton
                            </td>
                            <td className="py-3 px-4 text-sm text-right">
                              ${contrato.precioUnitario.toLocaleString()}/ton
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-medium">
                              {formatCurrency(contrato.montoTotal)}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                contrato.estado === "Entregado"
                                  ? "bg-green-100 text-green-800"
                                  : contrato.estado === "Pendiente"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {contrato.estado}
                                {contrato.estado === "Pendiente" && totalEntregado > 0 && (
                                  <span className="ml-1">({porcentaje.toFixed(0)}%)</span>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteContrato(contrato.id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB ENTREGAS */}
        <TabsContent value="entregas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Entregas</CardTitle>
                <CardDescription>Registro de entregas de contratos</CardDescription>
              </div>
              <Dialog open={entregaDialogOpen} onOpenChange={setEntregaDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={contratosPendientes.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Entrega
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateEntrega}>
                    <DialogHeader>
                      <DialogTitle>Registrar Entrega</DialogTitle>
                      <DialogDescription>
                        Registrá una entrega parcial o total de un contrato
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Contrato *</Label>
                        <Select
                          value={entregaForm.contratoId}
                          onValueChange={(value) => setEntregaForm({ ...entregaForm, contratoId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná contrato" />
                          </SelectTrigger>
                          <SelectContent>
                            {contratosPendientes.map((c) => {
                              const totalEntregado = c.entregas.reduce((sum, e) => sum + e.cantidad, 0);
                              const pendiente = c.cantidad - totalEntregado;
                              return (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.producto} - {c.comprador || "Sin nombre"} ({pendiente.toFixed(2)} ton pendientes)
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha *</Label>
                        <Input
                          type="date"
                          value={entregaForm.fecha}
                          onChange={(e) => setEntregaForm({ ...entregaForm, fecha: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cantidad (ton) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="50"
                          value={entregaForm.cantidad}
                          onChange={(e) => setEntregaForm({ ...entregaForm, cantidad: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setEntregaDialogOpen(false)}>
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
              ) : contratos.filter(c => c.entregas.length > 0).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay entregas registradas</p>
                  {contratosPendientes.length === 0 ? (
                    <p className="text-sm text-gray-400">Primero creá un contrato</p>
                  ) : (
                    <Button onClick={() => setEntregaDialogOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar primera entrega
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {contratos.filter(c => c.entregas.length > 0).map((contrato) => (
                    <div key={contrato.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">
                            {contrato.producto} - {contrato.comprador || "Sin nombre"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Contrato: {contrato.cantidad.toLocaleString()} ton
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          contrato.estado === "Entregado" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {contrato.estado}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Fecha</th>
                              <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Cantidad</th>
                            </tr>
                          </thead>
                          <tbody>
                            {contrato.entregas.map((entrega) => (
                              <tr key={entrega.id} className="border-b">
                                <td className="py-2 px-3 text-sm">{formatDate(entrega.fecha)}</td>
                                <td className="py-2 px-3 text-sm text-right font-medium text-green-600">
                                  {entrega.cantidad.toLocaleString()} ton
                                </td>
                              </tr>
                            ))}
                            <tr className="font-medium">
                              <td className="py-2 px-3 text-sm">Total Entregado</td>
                              <td className="py-2 px-3 text-sm text-right">
                                {contrato.entregas.reduce((sum, e) => sum + e.cantidad, 0).toLocaleString()} ton
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB PRECIOS */}
        <TabsContent value="precios">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Precios de Referencia</CardTitle>
                <CardDescription>Registro de precios para análisis</CardDescription>
              </div>
              <Dialog open={precioDialogOpen} onOpenChange={setPrecioDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Precio
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreatePrecio}>
                    <DialogHeader>
                      <DialogTitle>Registrar Precio</DialogTitle>
                      <DialogDescription>
                        Agregá un precio de referencia del mercado
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Producto *</Label>
                        <Select
                          value={precioForm.producto}
                          onValueChange={(value) => setPrecioForm({ ...precioForm, producto: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCTOS.map((p) => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Precio (USD/ton) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="350"
                          value={precioForm.precio}
                          onChange={(e) => setPrecioForm({ ...precioForm, precio: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha *</Label>
                        <Input
                          type="date"
                          value={precioForm.fecha}
                          onChange={(e) => setPrecioForm({ ...precioForm, fecha: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fuente (opcional)</Label>
                        <Input
                          placeholder="Ej: Bolsa de Rosario"
                          value={precioForm.fuente}
                          onChange={(e) => setPrecioForm({ ...precioForm, fuente: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setPrecioDialogOpen(false)}>
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
              ) : precios.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay precios registrados</p>
                  <Button onClick={() => setPrecioDialogOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar primer precio
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Producto</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Precio</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Fuente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {precios.map((precio) => (
                        <tr key={precio.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{formatDate(precio.fecha)}</td>
                          <td className="py-3 px-4 text-sm font-medium">{precio.producto}</td>
                          <td className="py-3 px-4 text-sm text-right font-medium text-green-600">
                            ${precio.precio.toLocaleString()}/ton
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{precio.fuente || "-"}</td>
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