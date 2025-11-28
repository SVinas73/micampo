"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Arrendamiento = {
  id: string;
  arrendatario: string;
  tipoContrato: string;
  moneda: string;
  montoFijo: number | null;
  quintales: number | null;
  porcentaje: number | null;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  observaciones: string | null;
  lote: {
    nombre: string;
    hectareas: number;
  };
};

type Lote = {
  id: string;
  nombre: string;
  hectareas: number;
};

const TIPOS_CONTRATO = [
  { value: "PagoFijo", label: "Pago Fijo (USD/UYU)" },
  { value: "QuintalesFijos", label: "Quintales Fijos" },
  { value: "PorcentajeProduccion", label: "% de Producción" },
];

const MONEDAS = ["USD", "UYU", "EUR", "ARS", "BRL"];

export default function ArrendamientosPage() {
  const [arrendamientos, setArrendamientos] = useState<Arrendamiento[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    loteId: "",
    arrendatario: "",
    tipoContrato: "",
    moneda: "USD",
    montoFijo: "",
    quintales: "",
    porcentaje: "",
    fechaInicio: "",
    fechaFin: "",
    observaciones: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchArrendamientos(), fetchLotes()]);
    setLoading(false);
  };

  const fetchArrendamientos = async () => {
    try {
      const response = await fetch("/api/arrendamientos");
      if (response.ok) {
        const data = await response.json();
        setArrendamientos(data);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/arrendamientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setDialogOpen(false);
        setForm({
          loteId: "",
          arrendatario: "",
          tipoContrato: "",
          moneda: "USD",
          montoFijo: "",
          quintales: "",
          porcentaje: "",
          fechaInicio: "",
          fechaFin: "",
          observaciones: "",
        });
        fetchArrendamientos();
      } else {
        const error = await response.json();
        alert(error.error || "Error al crear arrendamiento");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear arrendamiento");
    }
  };

  const handleToggleActivo = async (id: string, activo: boolean) => {
    try {
      const response = await fetch(`/api/arrendamientos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !activo }),
      });

      if (response.ok) {
        fetchArrendamientos();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este arrendamiento?")) return;
    try {
      const response = await fetch(`/api/arrendamientos/${id}`, { method: "DELETE" });
      if (response.ok) fetchArrendamientos();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const arrendamientosActivos = arrendamientos.filter((a) => a.activo);
  const totalHectareasArrendadas = arrendamientosActivos.reduce(
    (sum, a) => sum + a.lote.hectareas,
    0
  );

  const calcularCostoEstimado = (arr: Arrendamiento) => {
    if (arr.tipoContrato === "PagoFijo" && arr.montoFijo) {
      return `${arr.moneda} ${arr.montoFijo.toLocaleString()}`;
    } else if (arr.tipoContrato === "QuintalesFijos" && arr.quintales) {
      return `${arr.quintales} qq`;
    } else if (arr.tipoContrato === "PorcentajeProduccion" && arr.porcentaje) {
      return `${arr.porcentaje}%`;
    }
    return "-";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Arrendamientos</h1>
        <p className="text-gray-600 mt-2">
          Control de contratos de alquiler de tierra
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Contratos Activos
            </CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{arrendamientosActivos.length}</div>
            <p className="text-xs text-gray-500 mt-1">Vigentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Hectáreas Arrendadas
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHectareasArrendadas.toFixed(1)} ha</div>
            <p className="text-xs text-gray-500 mt-1">En contratos activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Contratos
            </CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{arrendamientos.length}</div>
            <p className="text-xs text-gray-500 mt-1">Histórico completo</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Contratos de Arrendamiento</CardTitle>
            <CardDescription>Gestión de alquileres de lotes</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700" disabled={lotes.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Registrar Arrendamiento</DialogTitle>
                  <DialogDescription>
                    Creá un contrato de alquiler de tierra
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Lote *</Label>
                      <Select
                        value={form.loteId}
                        onValueChange={(value) => setForm({ ...form, loteId: value })}
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
                      <Label>Arrendatario *</Label>
                      <Input
                        placeholder="Nombre del dueño"
                        value={form.arrendatario}
                        onChange={(e) => setForm({ ...form, arrendatario: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Contrato *</Label>
                    <Select
                      value={form.tipoContrato}
                      onValueChange={(value) =>
                        setForm({
                          ...form,
                          tipoContrato: value,
                          montoFijo: "",
                          quintales: "",
                          porcentaje: "",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccioná tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_CONTRATO.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {form.tipoContrato === "PagoFijo" && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded">
                      <div className="space-y-2">
                        <Label>Moneda *</Label>
                        <Select
                          value={form.moneda}
                          onValueChange={(value) => setForm({ ...form, moneda: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONEDAS.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Monto Anual *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="10000"
                          value={form.montoFijo}
                          onChange={(e) => setForm({ ...form, montoFijo: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {form.tipoContrato === "QuintalesFijos" && (
                    <div className="p-4 bg-green-50 rounded">
                      <div className="space-y-2">
                        <Label>Quintales por Hectárea *</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="15"
                          value={form.quintales}
                          onChange={(e) => setForm({ ...form, quintales: e.target.value })}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Se calculará automáticamente por la superficie del lote
                        </p>
                      </div>
                    </div>
                  )}

                  {form.tipoContrato === "PorcentajeProduccion" && (
                    <div className="p-4 bg-purple-50 rounded">
                      <div className="space-y-2">
                        <Label>Porcentaje de Producción *</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="25"
                          value={form.porcentaje}
                          onChange={(e) => setForm({ ...form, porcentaje: e.target.value })}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          % de la cosecha que va al arrendatario
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha Inicio *</Label>
                      <Input
                        type="date"
                        value={form.fechaInicio}
                        onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Fin *</Label>
                      <Input
                        type="date"
                        value={form.fechaFin}
                        onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observaciones</Label>
                    <Textarea
                      placeholder="Notas adicionales"
                      value={form.observaciones}
                      onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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
          ) : arrendamientos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No hay contratos registrados</p>
              {lotes.length === 0 ? (
                <p className="text-sm text-gray-400">Primero creá lotes en Agronomía</p>
              ) : (
                <Button onClick={() => setDialogOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar primer contrato
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {arrendamientos.map((arr) => (
                <Card key={arr.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{arr.lote.nombre}</CardTitle>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              arr.activo
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {arr.activo ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Arrendatario: {arr.arrendatario} • {arr.lote.hectareas} ha
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActivo(arr.id, arr.activo)}
                          className={
                            arr.activo ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"
                          }
                        >
                          {arr.activo ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(arr.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tipo de Contrato</p>
                        <p className="text-sm mt-1">
                          {TIPOS_CONTRATO.find((t) => t.value === arr.tipoContrato)?.label}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Costo</p>
                        <p className="text-sm mt-1 font-medium">{calcularCostoEstimado(arr)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Vigencia</p>
                        <p className="text-sm mt-1">
                          {formatDate(arr.fechaInicio)} - {formatDate(arr.fechaFin)}
                        </p>
                      </div>
                      {arr.observaciones && (
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-600">Observaciones</p>
                          <p className="text-sm mt-1">{arr.observaciones}</p>
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