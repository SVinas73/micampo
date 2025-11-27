"use client";

import { EvolucionChart } from "./components/EvolucionChart";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

type Transaccion = {
  id: string;
  tipo: "INGRESO" | "GASTO";
  categoria: string;
  monto: number;
  descripcion: string | null;
  fecha: string;
  campo: {
    nombre: string;
  } | null;
};

const CATEGORIAS_INGRESO = [
  "Venta Granos",
  "Venta Hacienda",
  "Otros",
];

const CATEGORIAS_GASTO = [
  "Semillas",
  "Fertilizantes",
  "Fitosanitarios",
  "Combustible",
  "Mano de Obra",
  "Mantenimiento",
  "Otros",
];

export default function FinanzasPage() {
  const { data: session } = useSession();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: "GASTO" as "INGRESO" | "GASTO",
    categoria: "",
    monto: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchTransacciones();
  }, []);

  const fetchTransacciones = async () => {
    try {
      const response = await fetch("/api/transacciones");
      if (response.ok) {
        const data = await response.json();
        setTransacciones(data);
      }
    } catch (error) {
      console.error("Error al cargar transacciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/transacciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: formData.tipo,
          categoria: formData.categoria,
          monto: parseFloat(formData.monto),
          descripcion: formData.descripcion || null,
          fecha: new Date(formData.fecha).toISOString(),
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        setFormData({
          tipo: "GASTO",
          categoria: "",
          monto: "",
          descripcion: "",
          fecha: new Date().toISOString().split("T")[0],
        });
        fetchTransacciones();
      }
    } catch (error) {
      console.error("Error al crear transacción:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta transacción?")) return;

    try {
      const response = await fetch(`/api/transacciones/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTransacciones();
      }
    } catch (error) {
      console.error("Error al eliminar transacción:", error);
    }
  };

  const ingresos = transacciones
    .filter((t) => t.tipo === "INGRESO")
    .reduce((sum, t) => sum + t.monto, 0);

  const gastos = transacciones
    .filter((t) => t.tipo === "GASTO")
    .reduce((sum, t) => sum + t.monto, 0);

  const balance = ingresos - gastos;

  const categoriasDisponibles =
    formData.tipo === "INGRESO" ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finanzas</h1>
          <p className="text-gray-600 mt-2">
            Gestioná los ingresos y gastos de tu campo
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Transacción
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Nueva Transacción</DialogTitle>
                <DialogDescription>
                  Registrá un ingreso o gasto de tu campo
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: "INGRESO" | "GASTO") => {
                      setFormData({ ...formData, tipo: value, categoria: "" });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INGRESO">Ingreso</SelectItem>
                      <SelectItem value="GASTO">Gasto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoria: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccioná una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasDisponibles.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto (USD)</Label>
                  <Input
                    id="monto"
                    type="number"
                    step="0.01"
                    placeholder="1000.00"
                    value={formData.monto}
                    onChange={(e) =>
                      setFormData({ ...formData, monto: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción (opcional)</Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Ej: Venta de soja zafra 2024"
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Ingresos
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-50">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(ingresos)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {transacciones.filter((t) => t.tipo === "INGRESO").length} transacciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Gastos
            </CardTitle>
            <div className="p-2 rounded-lg bg-red-50">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(gastos)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {transacciones.filter((t) => t.tipo === "GASTO").length} transacciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Balance
            </CardTitle>
            <div className={`p-2 rounded-lg ${balance >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
              <DollarSign className={`h-4 w-4 ${balance >= 0 ? "text-blue-600" : "text-orange-600"}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-blue-600" : "text-orange-600"}`}>
              {formatCurrency(balance)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {balance >= 0 ? "Positivo" : "Negativo"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolución */}
      <EvolucionChart transacciones={transacciones} />

      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
          <CardDescription>
            Listado de todos tus ingresos y gastos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : transacciones.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No hay transacciones registradas</p>
              <Button
                onClick={() => setDialogOpen(true)}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear primera transacción
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Categoría</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Descripción</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Monto</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {transacciones.map((transaccion) => (
                    <tr key={transaccion.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{formatDate(transaccion.fecha)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaccion.tipo === "INGRESO" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {transaccion.tipo === "INGRESO" ? "Ingreso" : "Gasto"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{transaccion.categoria}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{transaccion.descripcion || "-"}</td>
                      <td className={`py-3 px-4 text-sm text-right font-medium ${
                        transaccion.tipo === "INGRESO" ? "text-green-600" : "text-red-600"
                      }`}>
                        {transaccion.tipo === "INGRESO" ? "+" : "-"}{formatCurrency(transaccion.monto)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(transaccion.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </div>
  );
}