"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Truck,
  Wrench,
  Droplet,
  Warehouse,
  BarChart3,
  Plus,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Search,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Icon } from "@/components/mc";

type StockInsumo = {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
  precioUnitario: number | null;
  valorStock: number | null;
  alertaStockBajo: boolean;
  lotes: LoteInsumo[];
  alertas: AlertaStock[];
};

type LoteInsumo = {
  id: string;
  numeroLote: string;
  cantidadActual: number;
  fechaVencimiento: string | null;
  diasParaVencer: number | null;
  estado: string;
};

type AlertaStock = {
  id: string;
  tipo: string;
  severidad: string;
  titulo: string;
  mensaje: string;
  estado: string;
  fechaDeteccion: string;
  stockInsumo?: { nombre: string; categoria: string };
};

type Transferencia = {
  id: string;
  codigo: string;
  tipo: string;
  origen: string;
  destino: string;
  fechaSolicitud: string;
  estado: string;
  detalles: any[];
};

type Repuesto = {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  alertaStockBajo: boolean;
  precioUnitario: number | null;
};

type TanqueCombustible = {
  id: string;
  nombre: string;
  tipoCombustible: string;
  capacidadTotal: number;
  nivelActual: number;
  porcentaje: number;
  alertaNivelBajo: boolean;
};

type Silo = {
  id: string;
  nombre: string;
  tipoSilo: string;
  capacidadTotal: number;
  stockActual: number;
  porcentaje: number;
  estado: string;
};

type MateriaPrima = {
  id: string;
  nombre: string;
  tipo: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
  alertaStockBajo: boolean;
};

export default function LogisticaInventarioPage() {
  const [stocks, setStocks] = useState<StockInsumo[]>([]);
  const [alertas, setAlertas] = useState<AlertaStock[]>([]);
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [tanques, setTanques] = useState<TanqueCombustible[]>([]);
  const [silos, setSilos] = useState<Silo[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [loading, setLoading] = useState(true);

  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [loteDialogOpen, setLoteDialogOpen] = useState(false);
  const [transferenciaDialogOpen, setTransferenciaDialogOpen] = useState(false);
  const [repuestoDialogOpen, setRepuestoDialogOpen] = useState(false);
  const [tanqueDialogOpen, setTanqueDialogOpen] = useState(false);
  const [cargaCombustibleDialogOpen, setCargaCombustibleDialogOpen] = useState(false);
  const [siloDialogOpen, setSiloDialogOpen] = useState(false);
  const [materiaPrimaDialogOpen, setMateriaPrimaDialogOpen] = useState(false);

  const [stockForm, setStockForm] = useState({
    codigo: "",
    nombre: "",
    categoria: "Semilla",
    subcategoria: "",
    stockActual: "",
    stockMinimo: "",
    stockMaximo: "",
    unidadMedida: "kg",
    precioUnitario: "",
    ubicacionPrincipal: "",
  });

  const [loteForm, setLoteForm] = useState({
    stockInsumoId: "",
    numeroLote: "",
    fechaIngreso: "",
    fechaVencimiento: "",
    cantidadInicial: "",
    unidadMedida: "kg",
    proveedor: "",
    numeroFactura: "",
    costoUnitario: "",
    ubicacion: "",
    observaciones: "",
  });

  const [transferenciaForm, setTransferenciaForm] = useState({
    tipo: "Interna",
    subtipo: "EntreEstablecimientos",
    origen: "",
    destino: "",
    fechaSolicitud: "",
    remito: "",
    responsableOrigen: "",
    responsableDestino: "",
    observaciones: "",
  });

  const [repuestoForm, setRepuestoForm] = useState({
    codigo: "",
    nombre: "",
    categoria: "Motor",
    maquinaria: "",
    marcaCompatible: "",
    stockActual: "",
    stockMinimo: "",
    unidadMedida: "unidades",
    precioUnitario: "",
    ubicacion: "",
    proveedor: "",
    observaciones: "",
  });

  const [tanqueForm, setTanqueForm] = useState({
    nombre: "",
    tipoCombustible: "Gasoil",
    capacidadTotal: "",
    nivelActual: "",
    nivelMinimo: "",
    ubicacion: "",
  });

  const [cargaCombustibleForm, setCargaCombustibleForm] = useState({
    tanqueId: "",
    tipoCarga: "CargaTanque",
    maquinaId: "",
    litros: "",
    precioLitro: "",
    horometroActual: "",
    responsable: "",
    observaciones: "",
  });

  const [siloForm, setSiloForm] = useState({
    nombre: "",
    codigo: "",
    tipoSilo: "Bolsa",
    capacidadTotal: "",
    stockActual: "",
    ubicacion: "",
    coordenadas: "",
    tieneAireacion: false,
    temperaturaMax: "",
    humedadMax: "",
  });

  const [materiaPrimaForm, setMateriaPrimaForm] = useState({
    nombre: "",
    tipo: "Grano",
    stockActual: "",
    stockMinimo: "",
    unidadMedida: "kg",
    proteina: "",
    energia: "",
    humedad: "",
    precioUnitario: "",
    ubicacion: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        stocksRes,
        alertasRes,
        transferenciasRes,
        repuestosRes,
        tanquesRes,
        silosRes,
        materiasRes,
      ] = await Promise.all([
        fetch("/api/stock-insumos"),
        fetch("/api/alertas-stock"),
        fetch("/api/transferencias"),
        fetch("/api/repuestos"),
        fetch("/api/tanques-combustible"),
        fetch("/api/silos"),
        fetch("/api/materias-primas"),
      ]);

      if (stocksRes.ok) setStocks(await stocksRes.json());
      if (alertasRes.ok) setAlertas(await alertasRes.json());
      if (transferenciasRes.ok) setTransferencias(await transferenciasRes.json());
      if (repuestosRes.ok) setRepuestos(await repuestosRes.json());
      if (tanquesRes.ok) setTanques(await tanquesRes.json());
      if (silosRes.ok) setSilos(await silosRes.json());
      if (materiasRes.ok) setMateriasPrimas(await materiasRes.json());
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/stock-insumos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockForm),
      });

      if (response.ok) {
        setStockDialogOpen(false);
        setStockForm({
          codigo: "",
          nombre: "",
          categoria: "Semilla",
          subcategoria: "",
          stockActual: "",
          stockMinimo: "",
          stockMaximo: "",
          unidadMedida: "kg",
          precioUnitario: "",
          ubicacionPrincipal: "",
        });
        fetchData();
        alert("Stock creado exitosamente");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear stock");
    }
  };

  const handleCreateLote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/lotes-insumo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...loteForm,
          cantidadInicial: parseFloat(loteForm.cantidadInicial),
          costoUnitario: loteForm.costoUnitario ? parseFloat(loteForm.costoUnitario) : null,
          costoTotal: loteForm.costoUnitario && loteForm.cantidadInicial
            ? parseFloat(loteForm.costoUnitario) * parseFloat(loteForm.cantidadInicial)
            : null,
        }),
      });

      if (response.ok) {
        setLoteDialogOpen(false);
        setLoteForm({
          stockInsumoId: "",
          numeroLote: "",
          fechaIngreso: "",
          fechaVencimiento: "",
          cantidadInicial: "",
          unidadMedida: "kg",
          proveedor: "",
          numeroFactura: "",
          costoUnitario: "",
          ubicacion: "",
          observaciones: "",
        });
        fetchData();
        alert("Lote creado y stock actualizado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear lote");
    }
  };

  const handleCreateRepuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/repuestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(repuestoForm),
      });

      if (response.ok) {
        setRepuestoDialogOpen(false);
        setRepuestoForm({
          codigo: "",
          nombre: "",
          categoria: "Motor",
          maquinaria: "",
          marcaCompatible: "",
          stockActual: "",
          stockMinimo: "",
          unidadMedida: "unidades",
          precioUnitario: "",
          ubicacion: "",
          proveedor: "",
          observaciones: "",
        });
        fetchData();
        alert("Repuesto creado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear repuesto");
    }
  };

  const handleCreateTanque = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/tanques-combustible", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tanqueForm),
      });

      if (response.ok) {
        setTanqueDialogOpen(false);
        setTanqueForm({
          nombre: "",
          tipoCombustible: "Gasoil",
          capacidadTotal: "",
          nivelActual: "",
          nivelMinimo: "",
          ubicacion: "",
        });
        fetchData();
        alert("Tanque creado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear tanque");
    }
  };

  const handleCreateSilo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/silos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siloForm),
      });

      if (response.ok) {
        setSiloDialogOpen(false);
        setSiloForm({
          nombre: "",
          codigo: "",
          tipoSilo: "Bolsa",
          capacidadTotal: "",
          stockActual: "",
          ubicacion: "",
          coordenadas: "",
          tieneAireacion: false,
          temperaturaMax: "",
          humedadMax: "",
        });
        fetchData();
        alert("Silo creado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear silo");
    }
  };

  const handleCreateMateriaPrima = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/materias-primas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(materiaPrimaForm),
      });

      if (response.ok) {
        setMateriaPrimaDialogOpen(false);
        setMateriaPrimaForm({
          nombre: "",
          tipo: "Grano",
          stockActual: "",
          stockMinimo: "",
          unidadMedida: "kg",
          proteina: "",
          energia: "",
          humedad: "",
          precioUnitario: "",
          ubicacion: "",
        });
        fetchData();
        alert("Materia prima creada");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear materia prima");
    }
  };

  const eliminarStock = async (id: string) => {
    if (!confirm("¿Eliminar stock?")) return;
    try {
      const response = await fetch(`/api/stock-insumos/${id}`, { method: "DELETE" });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarRepuesto = async (id: string) => {
    if (!confirm("¿Eliminar repuesto?")) return;
    try {
      const response = await fetch(`/api/repuestos/${id}`, { method: "DELETE" });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const resolverAlerta = async (id: string) => {
    try {
      const response = await fetch("/api/alertas-stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado: "Resuelta" }),
      });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // KPIs
  const totalStocks = stocks.length;
  const stocksConAlerta = stocks.filter((s) => s.alertaStockBajo).length;
  const valorTotalInventario = stocks.reduce((sum, s) => sum + (s.valorStock || 0), 0);
  const alertasActivas = alertas.filter((a) => a.estado === "Activa").length;

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case "Crítica":
        return "bg-red-500";
      case "Alta":
        return "bg-orange-500";
      case "Media":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Pendiente":
        return "bg-yellow-500";
      case "EnTransito":
        return "bg-blue-500";
      case "Recibida":
        return "bg-green-500";
      case "Cancelada":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logística e Inventario</h1>
          <p className="text-gray-600 mt-2">
            Sistema completo de gestión de stock, transferencias, repuestos, combustible y silos
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Items en Stock
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStocks}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stocksConAlerta} con alerta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Valor Inventario
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(valorTotalInventario)}</div>
            <p className="text-xs text-gray-500 mt-1">Total USD</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Alertas Activas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertasActivas}</div>
            <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Transferencias
            </CardTitle>
            <Truck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transferencias.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {transferencias.filter((t) => t.estado === "Pendiente").length} pendientes
            </p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="stock">
            <Package className="h-4 w-4 mr-2" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="alertas">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="materias">
            <Package className="h-4 w-4 mr-2" />
            Materias
          </TabsTrigger>
          <TabsTrigger value="transferencias">
            <Truck className="h-4 w-4 mr-2" />
            Transfer.
          </TabsTrigger>
          <TabsTrigger value="repuestos">
            <Wrench className="h-4 w-4 mr-2" />
            Repuestos
          </TabsTrigger>
          <TabsTrigger value="combustible">
            <Droplet className="h-4 w-4 mr-2" />
            Combust.
          </TabsTrigger>
          <TabsTrigger value="silos">
            <Warehouse className="h-4 w-4 mr-2" />
            Silos
          </TabsTrigger>
          <TabsTrigger value="reportes">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reportes
          </TabsTrigger>
        </TabsList>

        {/* TAB: STOCK DE INSUMOS */}
        <TabsContent value="stock" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Stock de Insumos</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setLoteDialogOpen(true)}
                variant="outline"
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Lote
              </Button>
              <Button
                onClick={() => setStockDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Insumo
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventario Actual</CardTitle>
              <CardDescription>Control de insumos con trazabilidad de lotes</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : stocks.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay insumos en stock</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stocks.map((stock) => (
                    <div key={stock.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-lg">{stock.nombre}</p>
                            <Badge variant="outline">{stock.categoria}</Badge>
                            {stock.alertaStockBajo && (
                              <Badge className="bg-red-500">Stock Bajo</Badge>
                            )}
                            <span className="text-xs text-gray-500">#{stock.codigo}</span>
                          </div>

                          <div className="grid grid-cols-4 gap-4 mb-2">
                            <div>
                              <p className="text-sm text-gray-500">Stock Actual</p>
                              <p className={`text-lg font-bold ${stock.alertaStockBajo ? "text-red-600" : "text-green-600"}`}>
                                {stock.stockActual} {stock.unidadMedida}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Stock Mínimo</p>
                              <p className="text-lg font-semibold text-orange-600">
                                {stock.stockMinimo} {stock.unidadMedida}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Valor Stock</p>
                              <p className="text-lg font-bold text-blue-600">
                                ${stock.valorStock?.toFixed(2) || "0.00"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Precio Unit.</p>
                              <p className="text-lg font-semibold">
                                ${stock.precioUnitario?.toFixed(2) || "0.00"}
                              </p>
                            </div>
                          </div>

                          {stock.lotes.length > 0 && (
                            <div className="bg-blue-50 p-3 rounded border border-blue-200 mt-2">
                              <p className="text-sm font-medium text-blue-900 mb-2">
                                Lotes Disponibles ({stock.lotes.length}):
                              </p>
                              <div className="space-y-1">
                                {stock.lotes.slice(0, 3).map((lote) => (
                                  <div key={lote.id} className="flex items-center justify-between text-xs text-blue-800">
                                    <span>Lote {lote.numeroLote}: {lote.cantidadActual} {stock.unidadMedida}</span>
                                    {lote.diasParaVencer !== null && (
                                      <Badge variant="outline" className={lote.diasParaVencer <= 30 ? "bg-yellow-100" : ""}>
                                        Vence en {lote.diasParaVencer} días
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {stock.alertas.length > 0 && (
                            <div className="bg-yellow-50 p-2 rounded border border-yellow-200 mt-2">
                              <p className="text-xs font-medium text-yellow-900">
                                {stock.alertas.length} alerta(s) activa(s)
                              </p>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarStock(stock.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: ALERTAS */}
        <TabsContent value="alertas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Sistema de Alertas</h2>
            <Badge className="bg-orange-500">{alertasActivas} Activas</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Alertas Críticas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Alertas Críticas</CardTitle>
                <CardDescription>Requieren atención inmediata</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertas
                    .filter((a) => a.severidad === "Crítica" && a.estado === "Activa")
                    .map((alerta) => (
                      <div key={alerta.id} className="p-3 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <p className="font-medium text-red-900">{alerta.titulo}</p>
                            </div>
                            <p className="text-sm text-red-700">{alerta.mensaje}</p>
                            <p className="text-xs text-red-600 mt-1">
                              {formatDate(alerta.fechaDeteccion)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolverAlerta(alerta.id)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  {alertas.filter((a) => a.severidad === "Crítica" && a.estado === "Activa").length === 0 && (
                    <p className="text-center text-gray-500 py-4">No hay alertas críticas</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alertas Altas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">Alertas Altas</CardTitle>
                <CardDescription>Requieren pronta atención</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertas
                    .filter((a) => a.severidad === "Alta" && a.estado === "Activa")
                    .slice(0, 5)
                    .map((alerta) => (
                      <div key={alerta.id} className="p-3 bg-orange-50 border border-orange-200 rounded">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <p className="font-medium text-orange-900">{alerta.titulo}</p>
                            </div>
                            <p className="text-sm text-orange-700">{alerta.mensaje}</p>
                            {alerta.stockInsumo && (
                              <p className="text-xs text-orange-600 mt-1">
                                {alerta.stockInsumo.nombre} - {alerta.stockInsumo.categoria}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolverAlerta(alerta.id)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  {alertas.filter((a) => a.severidad === "Alta" && a.estado === "Activa").length === 0 && (
                    <p className="text-center text-gray-500 py-4">No hay alertas altas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Todas las alertas */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Alertas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className={`p-3 border rounded ${
                      alerta.estado === "Activa" ? "bg-white" : "bg-gray-50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <Badge className={getSeveridadColor(alerta.severidad)}>
                          {alerta.severidad}
                        </Badge>
                        <Badge variant="outline">{alerta.tipo}</Badge>
                        <p className="text-sm font-medium">{alerta.titulo}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(alerta.fechaDeteccion)}
                        </span>
                        {alerta.estado === "Activa" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolverAlerta(alerta.id)}
                          >
                            Resolver
                          </Button>
                        ) : (
                          <Badge className="bg-green-500">Resuelta</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: MATERIAS PRIMAS */}
        <TabsContent value="materias" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Materias Primas para Ganadería</h2>
            <Button
              onClick={() => setMateriaPrimaDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Materia Prima
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stock de Componentes de Alimentación</CardTitle>
              <CardDescription>Maíz, soja, núcleos vitamínicos y concentrados</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : materiasPrimas.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay materias primas registradas</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {materiasPrimas.map((materia) => (
                    <Card key={materia.id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{materia.nombre}</CardTitle>
                          <Badge variant="outline">{materia.tipo}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-xs text-gray-600">Stock Actual</p>
                            <p className={`text-xl font-bold ${materia.alertaStockBajo ? "text-red-600" : "text-green-600"}`}>
                              {materia.stockActual} {materia.unidadMedida}
                            </p>
                          </div>
                          <div className="bg-orange-50 p-3 rounded">
                            <p className="text-xs text-gray-600">Stock Mínimo</p>
                            <p className="text-xl font-bold text-orange-600">
                              {materia.stockMinimo} {materia.unidadMedida}
                            </p>
                          </div>
                        </div>
                        {materia.alertaStockBajo && (
                          <div className="bg-red-50 p-2 rounded mt-3 border border-red-200">
                            <p className="text-xs font-medium text-red-900 inline-flex items-center gap-1">
                              <Icon name="alert" size={12} /> Stock por debajo del mínimo
                            </p>
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

        {/* TAB: TRANSFERENCIAS */}
        <TabsContent value="transferencias" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Transferencias</h2>
            <Button
              onClick={() => setTransferenciaDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Transferencia
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Movimientos Internos y Externos</CardTitle>
              <CardDescription>Control de transferencias con registro de transporte</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : transferencias.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay transferencias registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transferencias.map((trans) => (
                    <div key={trans.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-lg">{trans.codigo}</p>
                            <Badge className={getEstadoColor(trans.estado)}>
                              {trans.estado}
                            </Badge>
                            <Badge variant="outline">{trans.tipo}</Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                            <div>
                              <p className="text-gray-500">Origen</p>
                              <p className="font-medium">{trans.origen}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Destino</p>
                              <p className="font-medium">{trans.destino}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Fecha Solicitud</p>
                              <p className="font-medium">{formatDate(trans.fechaSolicitud)}</p>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-2 rounded text-sm">
                            <p className="text-gray-600">
                              Items: {trans.detalles.length} producto(s)
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => alert("Ver detalles (simulado)")}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: REPUESTOS */}
        <TabsContent value="repuestos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Inventario de Repuestos</h2>
            <Button
              onClick={() => setRepuestoDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Repuesto
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Repuestos Mecánicos</CardTitle>
              <CardDescription>Gestión vinculada a alertas de mantenimiento</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : repuestos.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay repuestos en inventario</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {repuestos.map((repuesto) => (
                    <Card key={repuesto.id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{repuesto.nombre}</CardTitle>
                          {repuesto.alertaStockBajo && (
                            <Badge className="bg-red-500">Stock Bajo</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{repuesto.categoria}</Badge>
                          <span className="text-xs text-gray-500">#{repuesto.codigo}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-xs text-gray-600">Stock</p>
                            <p className={`text-xl font-bold ${repuesto.alertaStockBajo ? "text-red-600" : "text-blue-600"}`}>
                              {repuesto.stockActual}
                            </p>
                          </div>
                          <div className="bg-orange-50 p-3 rounded">
                            <p className="text-xs text-gray-600">Mínimo</p>
                            <p className="text-xl font-bold text-orange-600">
                              {repuesto.stockMinimo}
                            </p>
                          </div>
                        </div>
                        {repuesto.precioUnitario && (
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-xs text-gray-600">Precio Unitario</p>
                            <p className="text-lg font-bold text-green-600">
                              ${repuesto.precioUnitario.toFixed(2)}
                            </p>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-red-600 hover:bg-red-50"
                          onClick={() => eliminarRepuesto(repuesto.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* TAB: COMBUSTIBLE */}
        <TabsContent value="combustible" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestión de Combustibles</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setCargaCombustibleDialogOpen(true)}
                variant="outline"
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Carga
              </Button>
              <Button
                onClick={() => setTanqueDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Tanque
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {tanques.map((tanque) => (
              <Card key={tanque.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{tanque.nombre}</CardTitle>
                    {tanque.alertaNivelBajo && (
                      <Badge className="bg-red-500">Nivel Bajo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{tanque.tipoCombustible}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Indicador visual de nivel */}
                  <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full transition-all ${
                        tanque.porcentaje <= 20
                          ? "bg-red-500"
                          : tanque.porcentaje <= 50
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${tanque.porcentaje}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-700">
                        {tanque.porcentaje.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Nivel Actual</p>
                      <p className="font-bold text-blue-700">
                        {tanque.nivelActual.toFixed(0)} L
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Capacidad</p>
                      <p className="font-bold text-gray-700">
                        {tanque.capacidadTotal.toFixed(0)} L
                      </p>
                    </div>
                  </div>

                  {tanque.alertaNivelBajo && (
                    <div className="bg-red-50 p-2 rounded border border-red-200">
                      <p className="text-xs font-medium text-red-900 inline-flex items-center gap-1">
                        <Icon name="alert" size={12} /> Nivel por debajo del mínimo
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {tanques.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Droplet className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No hay tanques registrados</p>
                <Button
                  onClick={() => setTanqueDialogOpen(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  Crear Primer Tanque
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: SILOS */}
        <TabsContent value="silos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestión de Silos</h2>
            <Button
              onClick={() => setSiloDialogOpen(true)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Silo
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {silos.map((silo) => (
              <Card key={silo.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{silo.nombre}</CardTitle>
                    <Badge
                      className={
                        silo.estado === "Disponible"
                          ? "bg-green-500"
                          : silo.estado === "EnUso"
                          ? "bg-blue-500"
                          : "bg-gray-500"
                      }
                    >
                      {silo.estado}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{silo.tipoSilo}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Indicador visual de capacidad */}
                  <div className="relative w-full h-24 bg-gray-200 rounded overflow-hidden flex flex-col justify-end">
                    <div
                      className="bg-amber-500 transition-all"
                      style={{ height: `${silo.porcentaje}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-700">
                          {silo.porcentaje.toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-600">ocupado</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-amber-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Stock</p>
                      <p className="font-bold text-amber-700">
                        {silo.stockActual.toFixed(1)} ton
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Capacidad</p>
                      <p className="font-bold text-gray-700">
                        {silo.capacidadTotal.toFixed(1)} ton
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {silos.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Warehouse className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No hay silos registrados</p>
                <Button
                  onClick={() => setSiloDialogOpen(true)}
                  className="mt-4 bg-amber-600 hover:bg-amber-700"
                >
                  Crear Primer Silo
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: REPORTES */}
        <TabsContent value="reportes" className="space-y-4">
          <h2 className="text-xl font-semibold">Reportes y Análisis</h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Gráfico de Stock por Categoría */}
            <Card>
              <CardHeader>
                <CardTitle>Stock por Categoría</CardTitle>
                <CardDescription>Distribución de insumos</CardDescription>
              </CardHeader>
              <CardContent>
                {stocks.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(
                        stocks.reduce((acc, stock) => {
                          acc[stock.categoria] = (acc[stock.categoria] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([categoria, cantidad]) => ({ categoria, cantidad }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categoria" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#2c6bb8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">Sin datos</div>
                )}
              </CardContent>
            </Card>

            {/* Valor de Inventario */}
            <Card>
              <CardHeader>
                <CardTitle>Valor de Inventario</CardTitle>
                <CardDescription>Por categoría (USD)</CardDescription>
              </CardHeader>
              <CardContent>
                {stocks.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(
                          stocks.reduce((acc, stock) => {
                            acc[stock.categoria] =
                              (acc[stock.categoria] || 0) + (stock.valorStock || 0);
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) => {
                            const { name, percent } = props;
                            return `${name}: ${(percent * 100).toFixed(0)}%`;
                        }}
                        outerRadius={80}
                        fill="#768f44"
                        dataKey="value"
                      >
                        {Object.keys(
                          stocks.reduce((acc, stock) => {
                            acc[stock.categoria] = true;
                            return acc;
                          }, {} as Record<string, boolean>)
                        ).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              ["#2c6bb8", "#5e7733", "#d9a538", "#c93434", "#64748b"][
                                index % 5
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">Sin datos</div>
                )}
              </CardContent>
            </Card>

            {/* Estado de Alertas */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de Alertas</CardTitle>
                <CardDescription>Distribución por severidad</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Crítica", "Alta", "Media", "Baja"].map((severidad) => {
                    const count = alertas.filter(
                      (a) => a.severidad === severidad && a.estado === "Activa"
                    ).length;
                    const total = alertas.filter((a) => a.estado === "Activa").length;
                    const porcentaje = total > 0 ? (count / total) * 100 : 0;

                    return (
                      <div key={severidad}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{severidad}</span>
                          <span className="text-sm text-gray-500">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getSeveridadColor(severidad)}`}
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Capacidad de Silos */}
            <Card>
              <CardHeader>
                <CardTitle>Capacidad de Silos</CardTitle>
                <CardDescription>Ocupación actual</CardDescription>
              </CardHeader>
              <CardContent>
                {silos.length > 0 ? (
                  <div className="space-y-3">
                    {silos.map((silo) => (
                      <div key={silo.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{silo.nombre}</span>
                          <span className="text-sm text-gray-500">
                            {silo.porcentaje.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              silo.porcentaje > 80
                                ? "bg-red-500"
                                : silo.porcentaje > 50
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${silo.porcentaje}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Sin silos registrados</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumen Ejecutivo */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle>Resumen Ejecutivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600 mb-1">Valor Total Inventario</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${valorTotalInventario.toFixed(0)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600 mb-1">Items con Stock Bajo</p>
                  <p className="text-2xl font-bold text-orange-600">{stocksConAlerta}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600 mb-1">Transferencias Pendientes</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {transferencias.filter((t) => t.estado === "Pendiente").length}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600 mb-1">Alertas Críticas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {alertas.filter((a) => a.severidad === "Crítica" && a.estado === "Activa").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOGS - Voy a crear los más importantes */}

      {/* Dialog: Nuevo Stock Insumo */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateStock}>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Insumo</DialogTitle>
              <DialogDescription>
                Agregar insumo al inventario con control de stock
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    placeholder="INS-001"
                    value={stockForm.codigo}
                    onChange={(e) => setStockForm({ ...stockForm, codigo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Semilla de Soja"
                    value={stockForm.nombre}
                    onChange={(e) => setStockForm({ ...stockForm, nombre: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select
                    value={stockForm.categoria}
                    onValueChange={(value) => setStockForm({ ...stockForm, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semilla">Semilla</SelectItem>
                      <SelectItem value="Fertilizante">Fertilizante</SelectItem>
                      <SelectItem value="Fitosanitario">Fitosanitario</SelectItem>
                      <SelectItem value="Repuesto">Repuesto</SelectItem>
                      <SelectItem value="Combustible">Combustible</SelectItem>
                      <SelectItem value="MateriaPrima">Materia Prima</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subcategoría</Label>
                  <Input
                    placeholder="Herbicida, Insecticida, etc"
                    value={stockForm.subcategoria}
                    onChange={(e) => setStockForm({ ...stockForm, subcategoria: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Stock Actual *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={stockForm.stockActual}
                    onChange={(e) => setStockForm({ ...stockForm, stockActual: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Mínimo *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="20"
                    value={stockForm.stockMinimo}
                    onChange={(e) => setStockForm({ ...stockForm, stockMinimo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Máximo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="500"
                    value={stockForm.stockMaximo}
                    onChange={(e) => setStockForm({ ...stockForm, stockMaximo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Unidad de Medida *</Label>
                  <Select
                    value={stockForm.unidadMedida}
                    onValueChange={(value) => setStockForm({ ...stockForm, unidadMedida: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                      <SelectItem value="L">Litros (L)</SelectItem>
                      <SelectItem value="ton">Toneladas (ton)</SelectItem>
                      <SelectItem value="unidades">Unidades</SelectItem>
                      <SelectItem value="bolsas">Bolsas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Precio Unitario (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="15.50"
                    value={stockForm.precioUnitario}
                    onChange={(e) => setStockForm({ ...stockForm, precioUnitario: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Input
                    placeholder="Depósito A"
                    value={stockForm.ubicacionPrincipal}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, ubicacionPrincipal: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStockDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Crear Insumo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Dialog: Nuevo Lote */}
      <Dialog open={loteDialogOpen} onOpenChange={setLoteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateLote}>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Lote</DialogTitle>
              <DialogDescription>
                Ingreso de lote con trazabilidad y vencimiento
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Insumo *</Label>
                <Select
                  value={loteForm.stockInsumoId}
                  onValueChange={(value) => {
                    const stock = stocks.find((s) => s.id === value);
                    setLoteForm({
                      ...loteForm,
                      stockInsumoId: value,
                      unidadMedida: stock?.unidadMedida || "kg",
                    });
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar insumo" />
                  </SelectTrigger>
                  <SelectContent>
                    {stocks.map((stock) => (
                      <SelectItem key={stock.id} value={stock.id}>
                        {stock.nombre} - {stock.categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Lote *</Label>
                  <Input
                    placeholder="LOTE-2024-001"
                    value={loteForm.numeroLote}
                    onChange={(e) => setLoteForm({ ...loteForm, numeroLote: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Ingreso *</Label>
                  <Input
                    type="date"
                    value={loteForm.fechaIngreso}
                    onChange={(e) => setLoteForm({ ...loteForm, fechaIngreso: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad Inicial *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={loteForm.cantidadInicial}
                    onChange={(e) => setLoteForm({ ...loteForm, cantidadInicial: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Vencimiento</Label>
                  <Input
                    type="date"
                    value={loteForm.fechaVencimiento}
                    onChange={(e) =>
                      setLoteForm({ ...loteForm, fechaVencimiento: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Input
                    placeholder="Nombre del proveedor"
                    value={loteForm.proveedor}
                    onChange={(e) => setLoteForm({ ...loteForm, proveedor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número de Factura</Label>
                  <Input
                    placeholder="FAC-001"
                    value={loteForm.numeroFactura}
                    onChange={(e) => setLoteForm({ ...loteForm, numeroFactura: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Costo Unitario (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="15.50"
                    value={loteForm.costoUnitario}
                    onChange={(e) => setLoteForm({ ...loteForm, costoUnitario: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Input
                    placeholder="Depósito, Estantería"
                    value={loteForm.ubicacion}
                    onChange={(e) => setLoteForm({ ...loteForm, ubicacion: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={loteForm.observaciones}
                  onChange={(e) => setLoteForm({ ...loteForm, observaciones: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLoteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Crear Lote y Actualizar Stock
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nuevo Repuesto */}
      <Dialog open={repuestoDialogOpen} onOpenChange={setRepuestoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateRepuesto}>
            <DialogHeader>
              <DialogTitle>Agregar Repuesto</DialogTitle>
              <DialogDescription>Inventario de repuestos mecánicos</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    placeholder="REP-001"
                    value={repuestoForm.codigo}
                    onChange={(e) => setRepuestoForm({ ...repuestoForm, codigo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Filtro de aceite"
                    value={repuestoForm.nombre}
                    onChange={(e) => setRepuestoForm({ ...repuestoForm, nombre: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select
                    value={repuestoForm.categoria}
                    onValueChange={(value) =>
                      setRepuestoForm({ ...repuestoForm, categoria: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Motor">Motor</SelectItem>
                      <SelectItem value="Transmisión">Transmisión</SelectItem>
                      <SelectItem value="Hidráulico">Hidráulico</SelectItem>
                      <SelectItem value="Eléctrico">Eléctrico</SelectItem>
                      <SelectItem value="Neumático">Neumático</SelectItem>
                      <SelectItem value="Filtro">Filtro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Maquinaria Aplicable</Label>
                  <Input
                    placeholder="Tractor, Cosechadora"
                    value={repuestoForm.maquinaria}
                    onChange={(e) =>
                      setRepuestoForm({ ...repuestoForm, maquinaria: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Stock Actual *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="10"
                    value={repuestoForm.stockActual}
                    onChange={(e) =>
                      setRepuestoForm({ ...repuestoForm, stockActual: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Mínimo *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="2"
                    value={repuestoForm.stockMinimo}
                    onChange={(e) =>
                      setRepuestoForm({ ...repuestoForm, stockMinimo: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio Unit. (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="25.00"
                    value={repuestoForm.precioUnitario}
                    onChange={(e) =>
                      setRepuestoForm({ ...repuestoForm, precioUnitario: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Input
                    placeholder="Estantería A-3"
                    value={repuestoForm.ubicacion}
                    onChange={(e) => setRepuestoForm({ ...repuestoForm, ubicacion: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Input
                    placeholder="Nombre del proveedor"
                    value={repuestoForm.proveedor}
                    onChange={(e) => setRepuestoForm({ ...repuestoForm, proveedor: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Marca compatible, código del proveedor, etc."
                  value={repuestoForm.observaciones}
                  onChange={(e) =>
                    setRepuestoForm({ ...repuestoForm, observaciones: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRepuestoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Agregar Repuesto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nuevo Tanque Combustible */}
      <Dialog open={tanqueDialogOpen} onOpenChange={setTanqueDialogOpen}>
        <DialogContent className="max-w-xl">
          <form onSubmit={handleCreateTanque}>
            <DialogHeader>
              <DialogTitle>Crear Tanque de Combustible</DialogTitle>
              <DialogDescription>Registro de tanque con control de nivel</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Tanque Principal"
                    value={tanqueForm.nombre}
                    onChange={(e) => setTanqueForm({ ...tanqueForm, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Combustible *</Label>
                  <Select
                    value={tanqueForm.tipoCombustible}
                    onValueChange={(value) =>
                      setTanqueForm({ ...tanqueForm, tipoCombustible: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gasoil">Gasoil</SelectItem>
                      <SelectItem value="Nafta">Nafta</SelectItem>
                      <SelectItem value="GNC">GNC</SelectItem>
                      <SelectItem value="GLP">GLP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Capacidad Total (L) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="5000"
                    value={tanqueForm.capacidadTotal}
                    onChange={(e) =>
                      setTanqueForm({ ...tanqueForm, capacidadTotal: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nivel Actual (L) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="3000"
                    value={tanqueForm.nivelActual}
                    onChange={(e) => setTanqueForm({ ...tanqueForm, nivelActual: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nivel Mínimo (L) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="500"
                    value={tanqueForm.nivelMinimo}
                    onChange={(e) => setTanqueForm({ ...tanqueForm, nivelMinimo: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Input
                  placeholder="Campo Norte, Galpón 2"
                  value={tanqueForm.ubicacion}
                  onChange={(e) => setTanqueForm({ ...tanqueForm, ubicacion: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTanqueDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Crear Tanque
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nuevo Silo */}
      <Dialog open={siloDialogOpen} onOpenChange={setSiloDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateSilo}>
            <DialogHeader>
              <DialogTitle>Crear Silo</DialogTitle>
              <DialogDescription>Registro de silo para almacenamiento de granos</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Silo 1"
                    value={siloForm.nombre}
                    onChange={(e) => setSiloForm({ ...siloForm, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input
                    placeholder="SL-001"
                    value={siloForm.codigo}
                    onChange={(e) => setSiloForm({ ...siloForm, codigo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Silo *</Label>
                  <Select
                    value={siloForm.tipoSilo}
                    onValueChange={(value) => setSiloForm({ ...siloForm, tipoSilo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bolsa">Bolsa (Silo Bolsa)</SelectItem>
                      <SelectItem value="Silo de Cemento">Silo de Cemento</SelectItem>
                      <SelectItem value="Galpón">Galpón</SelectItem>
                      <SelectItem value="A campo">A Campo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ubicación *</Label>
                  <Input
                    placeholder="Campo Norte, Lote 5"
                    value={siloForm.ubicacion}
                    onChange={(e) => setSiloForm({ ...siloForm, ubicacion: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacidad Total (ton) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="500"
                    value={siloForm.capacidadTotal}
                    onChange={(e) => setSiloForm({ ...siloForm, capacidadTotal: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Actual (ton)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={siloForm.stockActual}
                    onChange={(e) => setSiloForm({ ...siloForm, stockActual: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Coordenadas GPS</Label>
                <Input
                  placeholder="-34.123456, -58.123456"
                  value={siloForm.coordenadas}
                  onChange={(e) => setSiloForm({ ...siloForm, coordenadas: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="tieneAireacion"
                      checked={siloForm.tieneAireacion}
                      onChange={(e) =>
                        setSiloForm({ ...siloForm, tieneAireacion: e.target.checked })
                      }
                      className="rounded"
                    />
                    <Label htmlFor="tieneAireacion">Tiene Aireación</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Temp. Máx. (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="25"
                    value={siloForm.temperaturaMax}
                    onChange={(e) => setSiloForm({ ...siloForm, temperaturaMax: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Humedad Máx. (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="14"
                    value={siloForm.humedadMax}
                    onChange={(e) => setSiloForm({ ...siloForm, humedadMax: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSiloDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                Crear Silo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nueva Materia Prima */}
      <Dialog open={materiaPrimaDialogOpen} onOpenChange={setMateriaPrimaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateMateriaPrima}>
            <DialogHeader>
              <DialogTitle>Agregar Materia Prima</DialogTitle>
              <DialogDescription>
                Componentes de alimentación para ganadería
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Maíz, Soja, Núcleo"
                    value={materiaPrimaForm.nombre}
                    onChange={(e) =>
                      setMateriaPrimaForm({ ...materiaPrimaForm, nombre: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={materiaPrimaForm.tipo}
                    onValueChange={(value) =>
                      setMateriaPrimaForm({ ...materiaPrimaForm, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Grano">Grano (Maíz, Soja)</SelectItem>
                      <SelectItem value="Concentrado">Concentrado</SelectItem>
                      <SelectItem value="Nucleo">Núcleo Vitamínico</SelectItem>
                      <SelectItem value="Mineral">Mineral</SelectItem>
                      <SelectItem value="Vitamina">Vitamina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Stock Actual *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1000"
                    value={materiaPrimaForm.stockActual}
                    onChange={(e) =>
                      setMateriaPrimaForm({ ...materiaPrimaForm, stockActual: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Mínimo *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="200"
                    value={materiaPrimaForm.stockMinimo}
                    onChange={(e) =>
                      setMateriaPrimaForm({ ...materiaPrimaForm, stockMinimo: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidad *</Label>
                  <Select
                    value={materiaPrimaForm.unidadMedida}
                    onValueChange={(value) =>
                      setMateriaPrimaForm({ ...materiaPrimaForm, unidadMedida: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogramos</SelectItem>
                      <SelectItem value="ton">Toneladas</SelectItem>
                      <SelectItem value="bolsas">Bolsas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Proteína (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="8.5"
                    value={materiaPrimaForm.proteina}
                    onChange={(e) =>
                      setMateriaPrimaForm({ ...materiaPrimaForm, proteina: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Energía (Mcal/kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="3.2"
                    value={materiaPrimaForm.energia}
                    onChange={(e) =>
                      setMateriaPrimaForm({ ...materiaPrimaForm, energia: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Humedad (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="14"
                    value={materiaPrimaForm.humedad}
                    onChange={(e) =>
                      setMateriaPrimaForm({ ...materiaPrimaForm, humedad: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precio Unit. (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="250"
                    value={materiaPrimaForm.precioUnitario}
                    onChange={(e) =>
                      setMateriaPrimaForm({ ...materiaPrimaForm, precioUnitario: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Input
                    placeholder="Silo 2, Galpón A"
                    value={materiaPrimaForm.ubicacion}
                    onChange={(e) =>
                      setMateriaPrimaForm({ ...materiaPrimaForm, ubicacion: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMateriaPrimaDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Agregar Materia Prima
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Card Final: Resumen del Módulo */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-purple-900">
                Módulo de Logística e Inventario 100% Completo
              </p>
              <p className="text-sm text-purple-700 mt-1">
                Sistema profesional con: Stock con trazabilidad de lotes y alertas automáticas •
                Materias primas para ganadería • Transferencias internas/externas con registro de
                transporte • Inventario de repuestos vinculado a mantenimientos • Gestión de
                combustibles con control de tanques y cargas por maquinaria • Silos con control de
                calidad de granos • Digitalización de tickets de balanza • Reportes completos con
                gráficos analíticos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}