"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPI } from "@/components/mc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Landmark, FileText, CheckCircle, AlertCircle, Plus, Trash2, Upload } from "lucide-react";
import { formatDate } from "@/lib/utils";

type CuentaBancaria = {
  id: string;
  nombre: string;
  banco: string;
  numeroCuenta: string;
  tipoCuenta: string;
  moneda: string;
  saldoActual: number;
  saldoLibros: number;
  activa: boolean;
  _count: {
    extractos: number;
    conciliaciones: number;
  };
};

type ExtractoBancario = {
  id: string;
  fecha: string;
  descripcion: string;
  referencia: string | null;
  debito: number | null;
  credito: number | null;
  saldo: number;
  conciliado: boolean;
  cuenta: {
    nombre: string;
  };
  transaccion: {
    id: string;
    descripcion: string;
  } | null;
};

type Conciliacion = {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  saldoInicialBanco: number;
  saldoFinalBanco: number;
  saldoInicialLibros: number;
  saldoFinalLibros: number;
  diferencia: number;
  estado: string;
  itemsConciliados: number;
  itemsPendientes: number;
  observaciones: string | null;
  cuenta: {
    nombre: string;
  };
  diferencias: DiferenciaConciliacion[];
};

type DiferenciaConciliacion = {
  id: string;
  tipo: string;
  fecha: string;
  descripcion: string;
  montoLibros: number | null;
  montoBanco: number | null;
  diferencia: number;
  resuelto: boolean;
};

const TIPOS_CUENTA = ["Cuenta Corriente", "Caja de Ahorro"];
const MONEDAS = ["USD", "UYU", "EUR", "BRL", "ARS"];

export default function ConciliacionBancariaPage() {
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [extractos, setExtractos] = useState<ExtractoBancario[]>([]);
  const [conciliaciones, setConciliaciones] = useState<Conciliacion[]>([]);
  const [loading, setLoading] = useState(true);

  const [cuentaDialogOpen, setCuentaDialogOpen] = useState(false);
  const [extractoDialogOpen, setExtractoDialogOpen] = useState(false);
  const [conciliacionDialogOpen, setConciliacionDialogOpen] = useState(false);

  const [cuentaForm, setCuentaForm] = useState({
    nombre: "",
    banco: "",
    numeroCuenta: "",
    tipoCuenta: "",
    moneda: "USD",
    saldoActual: "",
  });

  const [conciliacionForm, setConciliacionForm] = useState({
    cuentaId: "",
    fechaInicio: new Date(new Date().setDate(1)).toISOString().split("T")[0],
    fechaFin: new Date().toISOString().split("T")[0],
  });

  const [extractosCsv, setExtractosCsv] = useState("");
  const [cuentaSeleccionadaCsv, setCuentaSeleccionadaCsv] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchCuentas(), fetchExtractos(), fetchConciliaciones()]);
    setLoading(false);
  };

  const fetchCuentas = async () => {
    try {
      const response = await fetch("/api/cuentas-bancarias");
      if (response.ok) {
        const data = await response.json();
        setCuentas(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchExtractos = async () => {
    try {
      const response = await fetch("/api/extractos-bancarios");
      if (response.ok) {
        const data = await response.json();
        setExtractos(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchConciliaciones = async () => {
    try {
      const response = await fetch("/api/conciliaciones");
      if (response.ok) {
        const data = await response.json();
        setConciliaciones(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCreateCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/cuentas-bancarias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuentaForm),
      });

      if (response.ok) {
        setCuentaDialogOpen(false);
        setCuentaForm({
          nombre: "",
          banco: "",
          numeroCuenta: "",
          tipoCuenta: "",
          moneda: "USD",
          saldoActual: "",
        });
        fetchCuentas();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleImportarExtractos = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cuentaSeleccionadaCsv || !extractosCsv) {
      alert("Seleccioná una cuenta y pegá el CSV");
      return;
    }

    try {
      // Parsear CSV simple (formato: fecha,descripcion,debito,credito,saldo)
      const lineas = extractosCsv.trim().split("\n");
      const extractos = [];

      for (let i = 1; i < lineas.length; i++) { // Saltar header
        const campos = lineas[i].split(",");
        if (campos.length >= 5) {
          extractos.push({
            fecha: campos[0].trim(),
            descripcion: campos[1].trim(),
            referencia: campos[2]?.trim() || null,
            debito: campos[3]?.trim() ? parseFloat(campos[3].trim()) : null,
            credito: campos[4]?.trim() ? parseFloat(campos[4].trim()) : null,
            saldo: parseFloat(campos[5]?.trim() || "0"),
          });
        }
      }

      const response = await fetch("/api/extractos-bancarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuentaId: cuentaSeleccionadaCsv,
          extractos,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setExtractoDialogOpen(false);
        setExtractosCsv("");
        setCuentaSeleccionadaCsv("");
        fetchExtractos();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al importar extractos");
    }
  };

  const handleCrearConciliacion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/conciliaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(conciliacionForm),
      });

      if (response.ok) {
        setConciliacionDialogOpen(false);
        setConciliacionForm({
          cuentaId: "",
          fechaInicio: new Date(new Date().setDate(1)).toISOString().split("T")[0],
          fechaFin: new Date().toISOString().split("T")[0],
        });
        fetchConciliaciones();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteCuenta = async (id: string) => {
    if (!confirm("¿Eliminar esta cuenta?")) return;
    try {
      const response = await fetch(`/api/cuentas-bancarias/${id}`, { method: "DELETE" });
      if (response.ok) fetchCuentas();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const totalCuentas = cuentas.filter(c => c.activa).length;
  const totalExtractos = extractos.length;
  const extractosNoConciliados = extractos.filter(e => !e.conciliado).length;
  const conciliacionesPendientes = conciliaciones.filter(c => c.estado !== "Conciliado").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Conciliación Bancaria</h1>
        <p className="text-gray-600 mt-2">
          Conciliación automatizada de cuentas bancarias
        </p>
      </div>

      <div className="grid g-cols-4">
        <KPI label="Cuentas activas" value={String(totalCuentas)} delta="Bancos" trend="up" icon="building" accent />
        <KPI label="Extractos" value={String(totalExtractos)} delta="Registrados" trend="up" icon="book" />
        <KPI label="Sin conciliar" value={String(extractosNoConciliados)} delta="Pendientes" trend="warn" icon="alert" warn={extractosNoConciliados > 0} />
        <KPI label="Diferencias" value={String(conciliacionesPendientes)} delta="Con diferencias" trend="warn" icon="alert" warn={conciliacionesPendientes > 0} />
      </div>

      <Tabs defaultValue="cuentas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cuentas">
            <Landmark className="h-4 w-4 mr-2" />
            Cuentas
          </TabsTrigger>
          <TabsTrigger value="extractos">
            <FileText className="h-4 w-4 mr-2" />
            Extractos
          </TabsTrigger>
          <TabsTrigger value="conciliaciones">
            <CheckCircle className="h-4 w-4 mr-2" />
            Conciliaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cuentas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cuentas Bancarias</CardTitle>
                <CardDescription>Gestión de cuentas para conciliación</CardDescription>
              </div>
              <Dialog open={cuentaDialogOpen} onOpenChange={setCuentaDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Cuenta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateCuenta}>
                    <DialogHeader>
                      <DialogTitle>Registrar Cuenta Bancaria</DialogTitle>
                      <DialogDescription>
                        Agregá una cuenta para conciliación
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Nombre de la Cuenta *</Label>
                        <Input
                          placeholder="Ej: Cuenta Principal BROU"
                          value={cuentaForm.nombre}
                          onChange={(e) => setCuentaForm({ ...cuentaForm, nombre: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Banco *</Label>
                          <Input
                            placeholder="BROU"
                            value={cuentaForm.banco}
                            onChange={(e) => setCuentaForm({ ...cuentaForm, banco: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Número de Cuenta *</Label>
                          <Input
                            placeholder="123456789"
                            value={cuentaForm.numeroCuenta}
                            onChange={(e) => setCuentaForm({ ...cuentaForm, numeroCuenta: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo de Cuenta *</Label>
                          <Select
                            value={cuentaForm.tipoCuenta}
                            onValueChange={(value) => setCuentaForm({ ...cuentaForm, tipoCuenta: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIPOS_CUENTA.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Moneda *</Label>
                          <Select
                            value={cuentaForm.moneda}
                            onValueChange={(value) => setCuentaForm({ ...cuentaForm, moneda: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Moneda" />
                            </SelectTrigger>
                            <SelectContent>
                              {MONEDAS.map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Saldo Actual</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="10000"
                          value={cuentaForm.saldoActual}
                          onChange={(e) => setCuentaForm({ ...cuentaForm, saldoActual: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCuentaDialogOpen(false)}>
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
              ) : cuentas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay cuentas registradas</p>
                  <Button onClick={() => setCuentaDialogOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar primera cuenta
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cuentas.map((cuenta) => (
                    <Card key={cuenta.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{cuenta.nombre}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              {cuenta.banco} • {cuenta.tipoCuenta} • {cuenta.numeroCuenta}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCuenta(cuenta.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-xs text-blue-600">Saldo Banco</p>
                            <p className="text-lg font-bold text-blue-700">
                              {cuenta.moneda} {cuenta.saldoActual.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-xs text-green-600">Saldo Libros</p>
                            <p className="text-lg font-bold text-green-700">
                              {cuenta.moneda} {cuenta.saldoLibros.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-600">Extractos</p>
                            <p className="text-lg font-bold">{cuenta._count.extractos}</p>
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

        <TabsContent value="extractos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Extractos Bancarios</CardTitle>
                <CardDescription>Importación de movimientos bancarios</CardDescription>
              </div>
              <Dialog open={extractoDialogOpen} onOpenChange={setExtractoDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={cuentas.length === 0}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <form onSubmit={handleImportarExtractos}>
                    <DialogHeader>
                      <DialogTitle>Importar Extracto Bancario</DialogTitle>
                      <DialogDescription>
                        Pegá el contenido CSV del extracto bancario
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Cuenta Bancaria *</Label>
                        <Select
                          value={cuentaSeleccionadaCsv}
                          onValueChange={setCuentaSeleccionadaCsv}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná cuenta" />
                          </SelectTrigger>
                          <SelectContent>
                            {cuentas.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nombre} - {c.banco}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>CSV (fecha,descripcion,referencia,debito,credito,saldo) *</Label>
                        <Textarea
                          placeholder="2024-01-15,Pago proveedor,REF123,500.00,,9500.00
2024-01-16,Cobro cliente,REF124,,1000.00,10500.00"
                          value={extractosCsv}
                          onChange={(e) => setExtractosCsv(e.target.value)}
                          rows={10}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Formato: fecha,descripción,referencia,débito,crédito,saldo (una línea por movimiento)
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setExtractoDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Importar
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : extractos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay extractos importados</p>
                  {cuentas.length === 0 ? (
                    <p className="text-sm text-gray-400">Primero creá una cuenta bancaria</p>
                  ) : (
                    <Button onClick={() => setExtractoDialogOpen(true)} variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Importar primer extracto
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Cuenta</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Descripción</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Débito</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Crédito</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Saldo</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extractos.slice(0, 50).map((extracto) => (
                        <tr key={extracto.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{formatDate(extracto.fecha)}</td>
                          <td className="py-3 px-4 text-sm">{extracto.cuenta.nombre}</td>
                          <td className="py-3 px-4 text-sm">{extracto.descripcion}</td>
                          <td className="py-3 px-4 text-sm text-right text-red-600">
                            {extracto.debito ? `$${extracto.debito.toLocaleString()}` : "-"}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-green-600">
                            {extracto.credito ? `$${extracto.credito.toLocaleString()}` : "-"}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-medium">
                            ${extracto.saldo.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {extracto.conciliado ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Conciliado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Pendiente
                              </span>
                            )}
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

        <TabsContent value="conciliaciones">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Conciliaciones</CardTitle>
                <CardDescription>Matching automático y diferencias</CardDescription>
              </div>
              <Dialog open={conciliacionDialogOpen} onOpenChange={setConciliacionDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={cuentas.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Conciliación
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCrearConciliacion}>
                    <DialogHeader>
                      <DialogTitle>Crear Conciliación</DialogTitle>
                      <DialogDescription>
                        Conciliar cuenta bancaria con libros contables
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Cuenta Bancaria *</Label>
                        <Select
                          value={conciliacionForm.cuentaId}
                          onValueChange={(value) => setConciliacionForm({ ...conciliacionForm, cuentaId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná cuenta" />
                          </SelectTrigger>
                          <SelectContent>
                            {cuentas.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nombre} - {c.banco}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Fecha Inicio *</Label>
                          <Input
                            type="date"
                            value={conciliacionForm.fechaInicio}
                            onChange={(e) => setConciliacionForm({ ...conciliacionForm, fechaInicio: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fecha Fin *</Label>
                          <Input
                            type="date"
                            value={conciliacionForm.fechaFin}
                            onChange={(e) => setConciliacionForm({ ...conciliacionForm, fechaFin: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded text-sm text-blue-800">
                        <p className="font-medium">El sistema hará matching automático entre:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Extractos bancarios importados</li>
                          <li>Transacciones registradas en Finanzas</li>
                        </ul>
                        <p className="mt-2">Se identificarán automáticamente las diferencias.</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setConciliacionDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Conciliar
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : conciliaciones.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay conciliaciones realizadas</p>
                  {cuentas.length === 0 ? (
                    <p className="text-sm text-gray-400">Primero creá una cuenta e importá extractos</p>
                  ) : (
                    <Button onClick={() => setConciliacionDialogOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Realizar primera conciliación
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {conciliaciones.map((conc) => (
                    <Card key={conc.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{conc.cuenta.nombre}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(conc.fechaInicio)} - {formatDate(conc.fechaFin)}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            conc.estado === "Conciliado" ? "bg-green-100 text-green-800" :
                            conc.estado === "Con Diferencias" ? "bg-red-100 text-red-800" :
                            "bg-orange-100 text-orange-800"
                          }`}>
                            {conc.estado}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">Saldos Banco</p>
                            <div className="flex justify-between text-sm">
                              <span>Inicial:</span>
                              <span className="font-medium">${conc.saldoInicialBanco.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Final:</span>
                              <span className="font-medium">${conc.saldoFinalBanco.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">Saldos Libros</p>
                            <div className="flex justify-between text-sm">
                              <span>Inicial:</span>
                              <span className="font-medium">${conc.saldoInicialLibros.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Final:</span>
                              <span className="font-medium">${conc.saldoFinalLibros.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-xs text-green-600">Conciliados</p>
                            <p className="text-lg font-bold text-green-700">{conc.itemsConciliados}</p>
                          </div>
                          <div className="bg-orange-50 p-3 rounded">
                            <p className="text-xs text-orange-600">Pendientes</p>
                            <p className="text-lg font-bold text-orange-700">{conc.itemsPendientes}</p>
                          </div>
                          <div className={`p-3 rounded ${Math.abs(conc.diferencia) < 0.01 ? 'bg-green-50' : 'bg-red-50'}`}>
                            <p className={`text-xs ${Math.abs(conc.diferencia) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>Diferencia</p>
                            <p className={`text-lg font-bold ${Math.abs(conc.diferencia) < 0.01 ? 'text-green-700' : 'text-red-700'}`}>
                              ${Math.abs(conc.diferencia).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {conc.diferencias.length > 0 && (
                          <div className="border-t pt-3">
                            <p className="text-sm font-medium text-gray-600 mb-2">Diferencias detectadas:</p>
                            <div className="space-y-2">
                              {conc.diferencias.slice(0, 5).map((dif) => (
                                <div key={dif.id} className="bg-red-50 p-2 rounded text-sm">
                                  <div className="flex justify-between">
                                    <span className="font-medium">{dif.tipo}</span>
                                    <span className="text-red-700">${Math.abs(dif.diferencia).toLocaleString()}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {formatDate(dif.fecha)}: {dif.descripcion}
                                  </p>
                                </div>
                              ))}
                              {conc.diferencias.length > 5 && (
                                <p className="text-xs text-gray-500 text-center">
                                  + {conc.diferencias.length - 5} diferencias más
                                </p>
                              )}
                            </div>
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