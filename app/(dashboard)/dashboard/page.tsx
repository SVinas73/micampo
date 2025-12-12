"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Droplets,
  AlertTriangle,
  Activity,
  TrendingUp,
  DollarSign,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  Edit,
  RefreshCw,
  Sprout,
  Package,
  FileText,
  Truck,
  Calendar,
  Wrench,
  Users,
  Stethoscope,
  CheckSquare,
  PawPrint,
  Baby,
  Camera,
  Syringe,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

// ============================================
// TYPES
// ============================================

interface DashboardData {
  metricas: {
    litrosDiariosPromedio: number;
    alertasActivas: number;
    tratamientosActivos: number;
    produccionMesActual: number;
    balanceMesActual: number;
  };
  pronostico: Array<{
    fecha: string;
    dia: string;
    tempMax: number;
    tempMin: number;
    probabilidadLluvia: number;
    viento: number;
    direccionViento: string;
    condicion: string;
  }>;
  graficoFinanciero: {
    balancePromedio: number;
    porcentajeIngresos: number;
    porcentajeGastos: number;
    datos: Array<{
      mes: string;
      ingresos: number;
      gastos: number;
    }>;
  };
  tareasProgramadas: Array<{
    fecha: string;
    titulo: string;
    tipo: string;
  }>;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para diálogos
  const [lluviaDialogOpen, setLluviaDialogOpen] = useState(false);
  const [siembraDialogOpen, setSiembraDialogOpen] = useState(false);
  const [gastoDialogOpen, setGastoDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [imagenDialogOpen, setImagenDialogOpen] = useState(false);
  const [partoDialogOpen, setPartoDialogOpen] = useState(false);
  const [animalDialogOpen, setAnimalDialogOpen] = useState(false);
  const [movimientoDialogOpen, setMovimientoDialogOpen] = useState(false);
  const [produccionDialogOpen, setProduccionDialogOpen] = useState(false);

  // Estados para formularios
  const [lluviaForm, setLluviaForm] = useState({ fecha: "", milimetros: "" });
  const [siembraForm, setSiembraForm] = useState({ lote: "", cultivo: "", fecha: "" });
  const [gastoForm, setGastoForm] = useState({ concepto: "", monto: "", fecha: "" });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/inicio");
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error("Error al cargar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleRegistrarLluvia = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar llamada a API
    console.log("Registrar lluvia:", lluviaForm);
    setLluviaDialogOpen(false);
    setLluviaForm({ fecha: "", milimetros: "" });
  };

  const handleRegistrarSiembra = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Registrar siembra:", siembraForm);
    setSiembraDialogOpen(false);
    setSiembraForm({ lote: "", cultivo: "", fecha: "" });
  };

  const handleCargarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Cargar gasto:", gastoForm);
    setGastoDialogOpen(false);
    setGastoForm({ concepto: "", monto: "", fecha: "" });
  };

  // ============================================
  // HELPERS
  // ============================================

  const formatNumber = (num: number) => {
    return num.toLocaleString("es-ES");
  };

  const getClimaIcon = (condicion: string) => {
    switch (condicion) {
      case "lluvia":
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      case "nublado":
        return <Cloud className="h-8 w-8 text-gray-500" />;
      default:
        return <Sun className="h-8 w-8 text-yellow-500" />;
    }
  };

  const getTareaIcon = (tipo: string) => {
    if (tipo === "urgente") {
      return "🔥";
    }
    return "🌱";
  };

  // ============================================
  // RENDER LOADING
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Error al cargar el dashboard</p>
      </div>
    );
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inicio</h1>
          <p className="text-gray-600 mt-1">
            Este es tu centro de comando para gestionar tu campo
          </p>
        </div>
        <Button variant="outline" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      {/* ============================================ */}
      {/* MÉTRICAS PRINCIPALES - 5 CARDS */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Litros Diarios Promedio */}
        <Card className="bg-white border hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Litros Diarios Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {data.metricas.litrosDiariosPromedio.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">lts</p>
          </CardContent>
        </Card>

        {/* Card 2: Alertas Activas */}
        <Card className="bg-white border hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Alertas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                data.metricas.alertasActivas > 0 ? "text-red-600" : "text-gray-900"
              }`}
            >
              {data.metricas.alertasActivas}
            </div>
            <p className="text-xs text-gray-500 mt-1">críticas</p>
          </CardContent>
        </Card>

        {/* Card 3: Tratamientos Activos */}
        <Card className="bg-white border hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Tratamientos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {data.metricas.tratamientosActivos}
            </div>
            <p className="text-xs text-gray-500 mt-1">últimos 30 días</p>
          </CardContent>
        </Card>

        {/* Card 4: Producción Mes Actual */}
        <Card className="bg-white border hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Producción mes Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatNumber(data.metricas.produccionMesActual)}
            </div>
            <p className="text-xs text-gray-500 mt-1">lts</p>
          </CardContent>
        </Card>

        {/* Card 5: Balance Mes Actual */}
        <Card className="bg-white border hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Balance mes Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                data.metricas.balanceMesActual >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              U$S {formatNumber(Math.abs(data.metricas.balanceMesActual))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data.metricas.balanceMesActual >= 0 ? "positivo" : "negativo"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* PRONÓSTICO METEOROLÓGICO - 7 DÍAS */}
      {/* ============================================ */}
      <Card className="bg-white border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            Pronóstico Meteorológico (7 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {data.pronostico.map((dia, index) => {
              const tareaDelDia = data.tareasProgramadas.find((t) => {
                const fechaTarea = new Date(t.fecha).toDateString();
                const fechaDia = new Date(dia.fecha).toDateString();
                return fechaTarea === fechaDia;
              });

              return (
                <Card
                  key={index}
                  className="bg-gradient-to-br from-blue-50 to-white border border-blue-100"
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900">{dia.dia}</p>
                    </div>
                    <div className="flex justify-center">{getClimaIcon(dia.condicion)}</div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          {dia.tempMax}° / {dia.tempMin}°
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <Droplets className="h-3 w-3 text-cyan-600" />
                      <span className="font-semibold">{dia.probabilidadLluvia}%</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <Wind className="h-3 w-3 text-gray-600" />
                      <span className="font-semibold">
                        {dia.viento} km/h &gt; {dia.direccionViento}
                      </span>
                    </div>
                    {tareaDelDia && (
                      <div
                        className={`mt-2 p-2 rounded text-xs font-medium text-center ${
                          tareaDelDia.tipo === "urgente"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {getTareaIcon(tareaDelDia.tipo)} {tareaDelDia.titulo}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* LAYOUT 2 COLUMNAS: GRÁFICO + ACCIONES */}
      {/* ============================================ */}
      <div className="grid grid-cols-7 lg:grid-cols-6 gap-3">
        {/* COLUMNA IZQUIERDA - GRÁFICO FINANCIERO */}
        <div className="lg:col-span-3">
          <Card className="bg-white border">
            <CardHeader>
              <CardTitle className="text-2xl">
                ${Math.floor(data.graficoFinanciero.balancePromedio / 1000)}k Balance Mensual
                Promedio
              </CardTitle>
              <CardDescription>
                Ingreso {data.graficoFinanciero.porcentajeIngresos > 0 ? "+" : ""}
                {data.graficoFinanciero.porcentajeIngresos}% Gastos{" "}
                {data.graficoFinanciero.porcentajeGastos > 0 ? "+" : ""}
                {data.graficoFinanciero.porcentajeGastos}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.graficoFinanciero.datos}>
                    <defs>
                      <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={2.0} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={2.0} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: "20px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ingresos"
                      stackId="1"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#colorIngresos)"
                      name="Ingresos"
                    />
                    <Area
                      type="monotone"
                      dataKey="gastos"
                      stackId="2"
                      stroke="#ef4444"
                      strokeWidth={3}
                      fill="url(#colorGastos)"
                      name="Gastos"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============================================ */}
        {/* COLUMNA DERECHA - ACCIONES RÁPIDAS */}
        {/* ============================================ */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-white border">
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {/* FILA 1 - BOTONES VERDES */}
                <Link href="/dashboard/agronomia?tab=labores" className="w-full">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-2 text-sm justify-start">
                    <CheckSquare className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">Nueva Tarea</span>
                  </Button>
                </Link>
                <Button
                  onClick={() => alert("Funcionalidad de editar botones próximamente")}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-2 text-sm justify-start"
                >
                  <Edit className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">Editar Botones</span>
                </Button>

                {/* FILA 2 */}
                <Button
                  onClick={() => setLluviaDialogOpen(true)}
                  variant="outline"
                  className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-3 px-2 text-sm justify-start"
                >
                  <CloudRain className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">Registrar Lluvia</span>
                </Button>
                <Button
                  onClick={() => setSiembraDialogOpen(true)}
                  variant="outline"
                  className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-3 px-2 text-sm justify-start"
                >
                  <Sprout className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">Registrar Siembra/Cosecha</span>
                </Button>

                {/* FILA 3 */}
                <Button
                  onClick={() => setGastoDialogOpen(true)}
                  variant="outline"
                  className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-3 px-2 text-sm justify-start"
                >
                  <DollarSign className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">Cargar Gasto</span>
                </Button>
                <Button
                  onClick={() => setStockDialogOpen(true)}
                  variant="outline"
                  className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-3 px-2 text-sm justify-start"
                >
                  <Package className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">Entrada Stock/Insumos</span>
                </Button>

                {/* FILA 4 */}
                <Button
                  onClick={() => setImagenDialogOpen(true)}
                  variant="outline"
                  className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-3 px-2 text-sm justify-start"
                >
                  <Camera className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">Cargar Imagen de Lote</span>
                </Button>
                <Button
                  onClick={() => setPartoDialogOpen(true)}
                  variant="outline"
                  className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-3 px-2 text-sm justify-start"
                >
                  <Baby className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">Registrar Parto</span>
                </Button>

                {/* FILA 5 */}
                <Button
                  onClick={() => setAnimalDialogOpen(true)}
                  variant="outline"
                  className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-3 px-2 text-sm justify-start"
                >
                  <PawPrint className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">Cargar Animal</span>
                </Button>
                <Button
                  onClick={() => setMovimientoDialogOpen(true)}
                  variant="outline"
                  className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-3 px-2 text-sm justify-start"
                >
                  <TrendingUp className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">Movimiento de Ganado</span>
                </Button>

                {/* FILA 6 */}
                <Button
                  onClick={() => setProduccionDialogOpen(true)}
                  variant="outline"
                  className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-3 px-2 text-sm justify-start"
                >
                  <Droplets className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">Registrar Produc. Lechera</span>
                </Button>
                <Link href="/dashboard/maquinaria" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-3 px-2 text-sm justify-start"
                  >
                    <Wrench className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">Registrar Mantenimiento</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================ */}
      {/* DIALOGS */}
      {/* ============================================ */}

      {/* Dialog: Registrar Lluvia */}
      <Dialog open={lluviaDialogOpen} onOpenChange={setLluviaDialogOpen}>
        <DialogContent>
          <form onSubmit={handleRegistrarLluvia}>
            <DialogHeader>
              <DialogTitle>Registrar Lluvia</DialogTitle>
              <DialogDescription>Registrá la precipitación caída</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={lluviaForm.fecha}
                  onChange={(e) => setLluviaForm({ ...lluviaForm, fecha: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Milímetros</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="10.5"
                  value={lluviaForm.milimetros}
                  onChange={(e) => setLluviaForm({ ...lluviaForm, milimetros: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLluviaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Siembra */}
      <Dialog open={siembraDialogOpen} onOpenChange={setSiembraDialogOpen}>
        <DialogContent>
          <form onSubmit={handleRegistrarSiembra}>
            <DialogHeader>
              <DialogTitle>Registrar Siembra/Cosecha</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Lote</Label>
                <Input
                  placeholder="Lote 1"
                  value={siembraForm.lote}
                  onChange={(e) => setSiembraForm({ ...siembraForm, lote: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Cultivo</Label>
                <Input
                  placeholder="Soja, Maíz, Trigo..."
                  value={siembraForm.cultivo}
                  onChange={(e) => setSiembraForm({ ...siembraForm, cultivo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={siembraForm.fecha}
                  onChange={(e) => setSiembraForm({ ...siembraForm, fecha: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSiembraDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Cargar Gasto */}
      <Dialog open={gastoDialogOpen} onOpenChange={setGastoDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCargarGasto}>
            <DialogHeader>
              <DialogTitle>Cargar Gasto</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Concepto</Label>
                <Input
                  placeholder="Fertilizante, Combustible..."
                  value={gastoForm.concepto}
                  onChange={(e) => setGastoForm({ ...gastoForm, concepto: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Monto (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={gastoForm.monto}
                  onChange={(e) => setGastoForm({ ...gastoForm, monto: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={gastoForm.fecha}
                  onChange={(e) => setGastoForm({ ...gastoForm, fecha: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGastoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogs placeholder para otros botones */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrada de Stock/Insumos</DialogTitle>
            <DialogDescription>Funcionalidad próximamente</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={imagenDialogOpen} onOpenChange={setImagenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargar Imagen de Lote</DialogTitle>
            <DialogDescription>Funcionalidad próximamente</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={partoDialogOpen} onOpenChange={setPartoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Parto</DialogTitle>
            <DialogDescription>Funcionalidad próximamente</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={animalDialogOpen} onOpenChange={setAnimalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargar Animal</DialogTitle>
            <DialogDescription>Funcionalidad próximamente</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={movimientoDialogOpen} onOpenChange={setMovimientoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimiento de Ganado</DialogTitle>
            <DialogDescription>Funcionalidad próximamente</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={produccionDialogOpen} onOpenChange={setProduccionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Producción Lechera</DialogTitle>
            <DialogDescription>Funcionalidad próximamente</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}