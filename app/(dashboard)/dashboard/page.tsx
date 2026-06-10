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
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Edit,
  RefreshCw,
  Sprout,
  Package,
  DollarSign,
  Wrench,
  CheckSquare,
  PawPrint,
  Baby,
  Camera,
  TrendingUp,
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
  const [lluviaForm, setLluviaForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    milimetros: "",
    loteId: "",
  });

  const [siembraForm, setSiembraForm] = useState({
    loteId: "",
    cultivo: "",
    variedad: "",
    hectareas: "",
    fecha: new Date().toISOString().split("T")[0],
  });

  const [gastoForm, setGastoForm] = useState({
    categoria: "",
    descripcion: "",
    monto: "",
    metodoPago: "",
    fecha: new Date().toISOString().split("T")[0],
  });

  const [stockForm, setStockForm] = useState({
    codigo: "", // ← AGREGADO
    producto: "",
    categoria: "",
    cantidad: "",
    unidad: "kg",
    proveedor: "",
    precioUnitario: "",
  });

  const [imagenForm, setImagenForm] = useState({
    loteId: "",
    tipo: "Observación",
    titulo: "",
    descripcion: "",
    archivo: null as File | null,
  });

  const [partoForm, setPartoForm] = useState({
    animalId: "",
    fecha: new Date().toISOString().split("T")[0],
    numCrias: "1",
    condicionParto: "Normal",
    observaciones: "",
  });

  const [animalForm, setAnimalForm] = useState({
    caravana: "",
    tipo: "Vacuno",
    raza: "",
    sexo: "Hembra",
    fechaNacimiento: "",
    pesoNacimiento: "",
    madre: "",
    padre: "",
  });

  const [movimientoForm, setMovimientoForm] = useState({
    animalId: "",
    tipoMovimiento: "Traslado",
    origenNombre: "",
    destinoNombre: "",
    motivo: "",
    fecha: new Date().toISOString().split("T")[0],
  });

  const [produccionForm, setProduccionForm] = useState({
    animalId: "",
    fecha: new Date().toISOString().split("T")[0],
    litrosManana: "",
    litrosTarde: "",
    observaciones: "",
  });

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
  // HANDLERS CORREGIDOS
  // ============================================

  const handleRegistrarLluvia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/registro-pluviometrico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: new Date(lluviaForm.fecha),
          milimetros: parseFloat(lluviaForm.milimetros),
          loteId: lluviaForm.loteId || null,
          metodo: "Manual",
        }),
      });

      if (response.ok) {
        alert("✅ Lluvia registrada exitosamente");
        setLluviaDialogOpen(false);
        setLluviaForm({
          fecha: new Date().toISOString().split("T")[0],
          milimetros: "",
          loteId: "",
        });
        fetchDashboardData();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || "No se pudo registrar"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al registrar lluvia");
    }
  };

  // ✅ CORREGIDO: Solo registra siembras (cosecha requiere siembraId)
  const handleRegistrarSiembra = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/siembras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loteId: siembraForm.loteId,
          cultivo: siembraForm.cultivo,
          variedad: siembraForm.variedad || null,
          hectareas: parseFloat(siembraForm.hectareas),
          fechaSiembra: new Date(siembraForm.fecha),
        }),
      });

      if (response.ok) {
        alert("✅ Siembra registrada exitosamente");
        setSiembraDialogOpen(false);
        setSiembraForm({
          loteId: "",
          cultivo: "",
          variedad: "",
          hectareas: "",
          fecha: new Date().toISOString().split("T")[0],
        });
        fetchDashboardData();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || "No se pudo registrar"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al registrar siembra");
    }
  };

  const handleCargarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/transacciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "gasto",
          categoria: gastoForm.categoria,
          descripcion: gastoForm.descripcion,
          monto: parseFloat(gastoForm.monto),
          metodoPago: gastoForm.metodoPago || null,
          fecha: new Date(gastoForm.fecha),
        }),
      });

      if (response.ok) {
        alert("✅ Gasto registrado exitosamente");
        setGastoDialogOpen(false);
        setGastoForm({
          categoria: "",
          descripcion: "",
          monto: "",
          metodoPago: "",
          fecha: new Date().toISOString().split("T")[0],
        });
        fetchDashboardData();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || "No se pudo registrar"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al registrar gasto");
    }
  };

  // ✅ CORREGIDO: Incluye campo código
  const handleEntradaStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/stock-insumos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: stockForm.codigo, // ← AGREGADO
          nombre: stockForm.producto,
          categoria: stockForm.categoria,
          stockActual: parseFloat(stockForm.cantidad),
          unidadMedida: stockForm.unidad,
          precioUnitario: stockForm.precioUnitario
            ? parseFloat(stockForm.precioUnitario)
            : null,
        }),
      });

      if (response.ok) {
        alert("✅ Stock registrado exitosamente");
        setStockDialogOpen(false);
        setStockForm({
          codigo: "", // ← RESET
          producto: "",
          categoria: "",
          cantidad: "",
          unidad: "kg",
          proveedor: "",
          precioUnitario: "",
        });
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || "No se pudo registrar"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al registrar stock");
    }
  };

  const handleCargarImagen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/marcadores-geo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loteId: imagenForm.loteId,
          tipo: imagenForm.tipo,
          titulo: imagenForm.titulo,
          descripcion: imagenForm.descripcion || null,
          // La ruta exige coordenadas; se registra sin geolocalizar
          latitud: "0",
          longitud: "0",
          imagenes: imagenForm.archivo ? imagenForm.archivo.name : null,
        }),
      });

      if (response.ok) {
        alert("✅ Imagen cargada exitosamente");
        setImagenDialogOpen(false);
        setImagenForm({
          loteId: "",
          tipo: "Observación",
          titulo: "",
          descripcion: "",
          archivo: null,
        });
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || "No se pudo registrar"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al cargar imagen");
    }
  };

  const handleRegistrarParto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/eventos-reproductivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "Parto",
          animalId: partoForm.animalId,
          fecha: new Date(partoForm.fecha),
          numCrias: parseInt(partoForm.numCrias),
          condicionParto: partoForm.condicionParto,
          observaciones: partoForm.observaciones || null,
        }),
      });

      if (response.ok) {
        alert("✅ Parto registrado exitosamente");
        setPartoDialogOpen(false);
        setPartoForm({
          animalId: "",
          fecha: new Date().toISOString().split("T")[0],
          numCrias: "1",
          condicionParto: "Normal",
          observaciones: "",
        });
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || "No se pudo registrar"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al registrar parto");
    }
  };

  const handleCargarAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/animales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caravana: animalForm.caravana,
          tipo: animalForm.tipo,
          raza: animalForm.raza || null,
          sexo: animalForm.sexo,
          fechaNacimiento: animalForm.fechaNacimiento
            ? new Date(animalForm.fechaNacimiento)
            : null,
          pesoNacimiento: animalForm.pesoNacimiento
            ? parseFloat(animalForm.pesoNacimiento)
            : null,
          madre: animalForm.madre || null,
          padre: animalForm.padre || null,
          estado: "Activo",
        }),
      });

      if (response.ok) {
        alert("✅ Animal registrado exitosamente");
        setAnimalDialogOpen(false);
        setAnimalForm({
          caravana: "",
          tipo: "Vacuno",
          raza: "",
          sexo: "Hembra",
          fechaNacimiento: "",
          pesoNacimiento: "",
          madre: "",
          padre: "",
        });
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || "No se pudo registrar"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al registrar animal");
    }
  };

  const handleMovimientoGanado = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/movimientos-animales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId: movimientoForm.animalId,
          tipoMovimiento: movimientoForm.tipoMovimiento,
          fecha: new Date(movimientoForm.fecha),
          origenNombre: movimientoForm.origenNombre,
          destinoNombre: movimientoForm.destinoNombre,
          motivo: movimientoForm.motivo,
        }),
      });

      if (response.ok) {
        alert("✅ Movimiento registrado exitosamente");
        setMovimientoDialogOpen(false);
        setMovimientoForm({
          animalId: "",
          tipoMovimiento: "Traslado",
          origenNombre: "",
          destinoNombre: "",
          motivo: "",
          fecha: new Date().toISOString().split("T")[0],
        });
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || "No se pudo registrar"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al registrar movimiento");
    }
  };

  const handleProduccionLechera = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const litrosManana = parseFloat(produccionForm.litrosManana) || 0;
      const litrosTarde = parseFloat(produccionForm.litrosTarde) || 0;
      const litrosTotales = litrosManana + litrosTarde;

      const response = await fetch("/api/produccion-lechera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId: produccionForm.animalId,
          fecha: new Date(produccionForm.fecha),
          litrosManana,
          litrosTarde,
          litrosTotales,
          observaciones: produccionForm.observaciones || null,
        }),
      });

      if (response.ok) {
        alert("✅ Producción lechera registrada exitosamente");
        setProduccionDialogOpen(false);
        setProduccionForm({
          animalId: "",
          fecha: new Date().toISOString().split("T")[0],
          litrosManana: "",
          litrosTarde: "",
          observaciones: "",
        });
        fetchDashboardData();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || "No se pudo registrar"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al registrar producción");
    }
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
      {/* HEADER */}
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

      {/* MÉTRICAS PRINCIPALES - 5 CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

        <Card className="bg-white border hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Alertas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.metricas.alertasActivas > 0 ? "text-red-600" : "text-gray-900"
              }`}
            >
              {data.metricas.alertasActivas}
            </div>
            <p className="text-xs text-gray-500 mt-1">críticas</p>
          </CardContent>
        </Card>

        <Card className="bg-white border hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Tratamientos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {data.metricas.tratamientosActivos}
            </div>
            <p className="text-xs text-gray-500 mt-1">últimos 30 días</p>
          </CardContent>
        </Card>

        <Card className="bg-white border hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Producción mes Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(data.metricas.produccionMesActual)}
            </div>
            <p className="text-xs text-gray-500 mt-1">lts</p>
          </CardContent>
        </Card>

        <Card className="bg-white border hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Balance mes Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
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

      {/* PRONÓSTICO METEOROLÓGICO */}
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

      {/* LAYOUT 2 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* GRÁFICO FINANCIERO */}
        <Card className="bg-white border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">
              ${Math.floor(data.graficoFinanciero.balancePromedio / 1000)}k Balance Mensual
              Promedio
            </CardTitle>
            <CardDescription className="text-xs">
              Ingreso {data.graficoFinanciero.porcentajeIngresos > 0 ? "+" : ""}
              {data.graficoFinanciero.porcentajeIngresos}% Gastos{" "}
              {data.graficoFinanciero.porcentajeGastos > 0 ? "+" : ""}
              {data.graficoFinanciero.porcentajeGastos}%
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.graficoFinanciero.datos}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
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
                    stroke="#059669"
                    strokeWidth={3}
                    fill="url(#colorIngresos)"
                    name="Ingresos"
                  />
                  <Area
                    type="monotone"
                    dataKey="gastos"
                    stackId="2"
                    stroke="#dc2626"
                    strokeWidth={3}
                    fill="url(#colorGastos)"
                    name="Gastos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ACCIONES RÁPIDAS */}
        <Card className="bg-white border p-1">
          
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {/* FILA 1 */}
              <Link href="/dashboard/agronomia?tab=labores" className="w-full">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-5 px-2 text-xs justify-center">
                  <CheckSquare className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">Nueva Tarea</span>
                </Button>
              </Link>
              <Button
                onClick={() => alert("Funcionalidad de editar botones próximamente")}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-5 px-2 text-xs justify-center"
              >
                <Edit className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Editar Botones</span>
              </Button>

              {/* FILA 2 */}
              <Button
                onClick={() => setLluviaDialogOpen(true)}
                variant="outline"
                className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-5 px-2 text-xs justify-center"
              >
                <CloudRain className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Registrar Lluvia</span>
              </Button>
              <Button
                onClick={() => setSiembraDialogOpen(true)}
                variant="outline"
                className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-5 px-2 text-xs justify-center"
              >
                <Sprout className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Registrar Siembra/Cosecha</span>
              </Button>

              {/* FILA 3 */}
              <Button
                onClick={() => setGastoDialogOpen(true)}
                variant="outline"
                className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-5 px-2 text-xs justify-center"
              >
                <DollarSign className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Cargar Gasto</span>
              </Button>
              <Button
                onClick={() => setStockDialogOpen(true)}
                variant="outline"
                className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-5 px-2 text-xs justify-center"
              >
                <Package className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Entrada Stock/Insumos</span>
              </Button>

              {/* FILA 4 */}
              <Button
                onClick={() => setImagenDialogOpen(true)}
                variant="outline"
                className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-5 px-2 text-xs justify-center"
              >
                <Camera className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Cargar Imagen de Lote</span>
              </Button>
              <Button
                onClick={() => setPartoDialogOpen(true)}
                variant="outline"
                className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-5 px-2 text-xs justify-center"
              >
                <Baby className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Registrar Parto</span>
              </Button>

              {/* FILA 5 */}
              <Button
                onClick={() => setAnimalDialogOpen(true)}
                variant="outline"
                className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-5 px-2 text-xs justify-center"
              >
                <PawPrint className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Cargar Animal</span>
              </Button>
              <Button
                onClick={() => setMovimientoDialogOpen(true)}
                variant="outline"
                className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-5 px-2 text-xs justify-center"
              >
                <TrendingUp className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Movimiento de Ganado</span>
              </Button>

              {/* FILA 6 */}
              <Button
                onClick={() => setProduccionDialogOpen(true)}
                variant="outline"
                className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-5 px-2 text-xs justify-center"
              >
                <Droplets className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Registrar Produc. Lechera</span>
              </Button>
              <Link href="/dashboard/maquinaria" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-5 px-2 text-xs justify-center"
                >
                  <Wrench className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">Registrar Mantenimiento</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={lluviaForm.fecha}
                  onChange={(e) => setLluviaForm({ ...lluviaForm, fecha: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Milímetros *</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="10.5"
                  value={lluviaForm.milimetros}
                  onChange={(e) => setLluviaForm({ ...lluviaForm, milimetros: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Lote (opcional)</Label>
                <Input
                  placeholder="ID del lote"
                  value={lluviaForm.loteId}
                  onChange={(e) => setLluviaForm({ ...lluviaForm, loteId: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLluviaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Siembra (CORREGIDO - solo siembra) */}
      <Dialog open={siembraDialogOpen} onOpenChange={setSiembraDialogOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleRegistrarSiembra}>
            <DialogHeader>
              <DialogTitle>Registrar Siembra</DialogTitle>
              <DialogDescription>
                Para registrar cosecha, ir al módulo de Agronomía
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Lote ID *</Label>
                <Input
                  placeholder="ID del lote"
                  value={siembraForm.loteId}
                  onChange={(e) => setSiembraForm({ ...siembraForm, loteId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Cultivo *</Label>
                <Input
                  placeholder="Soja, Maíz, Trigo..."
                  value={siembraForm.cultivo}
                  onChange={(e) => setSiembraForm({ ...siembraForm, cultivo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Variedad</Label>
                <Input
                  placeholder="Variedad del cultivo"
                  value={siembraForm.variedad}
                  onChange={(e) => setSiembraForm({ ...siembraForm, variedad: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hectáreas *</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="50"
                  value={siembraForm.hectareas}
                  onChange={(e) => setSiembraForm({ ...siembraForm, hectareas: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Siembra *</Label>
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
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
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
                <Label>Categoría *</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={gastoForm.categoria}
                  onChange={(e) => setGastoForm({ ...gastoForm, categoria: e.target.value })}
                  required
                >
                  <option value="">Seleccionar</option>
                  <option value="Insumos">Insumos</option>
                  <option value="Combustible">Combustible</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Personal">Personal</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Descripción *</Label>
                <Input
                  placeholder="Fertilizante, Gasoil..."
                  value={gastoForm.descripcion}
                  onChange={(e) => setGastoForm({ ...gastoForm, descripcion: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Monto (USD) *</Label>
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
                <Label>Método de Pago</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={gastoForm.metodoPago}
                  onChange={(e) => setGastoForm({ ...gastoForm, metodoPago: e.target.value })}
                >
                  <option value="">Seleccionar</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Fecha *</Label>
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
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Entrada Stock (CORREGIDO - con campo código) */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <form onSubmit={handleEntradaStock}>
            <DialogHeader>
              <DialogTitle>Entrada de Stock/Insumos</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  placeholder="SKU o código único"
                  value={stockForm.codigo}
                  onChange={(e) => setStockForm({ ...stockForm, codigo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Producto *</Label>
                <Input
                  placeholder="Nombre del producto"
                  value={stockForm.producto}
                  onChange={(e) => setStockForm({ ...stockForm, producto: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={stockForm.categoria}
                  onChange={(e) => setStockForm({ ...stockForm, categoria: e.target.value })}
                  required
                >
                  <option value="">Seleccionar</option>
                  <option value="Semilla">Semilla</option>
                  <option value="Fertilizante">Fertilizante</option>
                  <option value="Fitosanitario">Fitosanitario</option>
                  <option value="Repuesto">Repuesto</option>
                  <option value="Combustible">Combustible</option>
                  <option value="Alimento">Alimento Animal</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={stockForm.cantidad}
                    onChange={(e) => setStockForm({ ...stockForm, cantidad: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidad *</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={stockForm.unidad}
                    onChange={(e) => setStockForm({ ...stockForm, unidad: e.target.value })}
                  >
                    <option value="kg">kg</option>
                    <option value="L">Litros</option>
                    <option value="ton">Toneladas</option>
                    <option value="unidades">Unidades</option>
                    <option value="bolsas">Bolsas</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Proveedor</Label>
                <Input
                  placeholder="Nombre del proveedor"
                  value={stockForm.proveedor}
                  onChange={(e) => setStockForm({ ...stockForm, proveedor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Unitario (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="10.50"
                  value={stockForm.precioUnitario}
                  onChange={(e) => setStockForm({ ...stockForm, precioUnitario: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStockDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Cargar Imagen (CORREGIDO - con FormData) */}
      <Dialog open={imagenDialogOpen} onOpenChange={setImagenDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCargarImagen}>
            <DialogHeader>
              <DialogTitle>Cargar Imagen de Lote</DialogTitle>
              <DialogDescription>Subí una foto del lote para referencia</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Lote ID *</Label>
                <Input
                  placeholder="ID del lote"
                  value={imagenForm.loteId}
                  onChange={(e) => setImagenForm({ ...imagenForm, loteId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={imagenForm.tipo}
                  onChange={(e) => setImagenForm({ ...imagenForm, tipo: e.target.value })}
                >
                  <option value="Observación">Observación</option>
                  <option value="Problema">Problema</option>
                  <option value="Foto">Foto</option>
                  <option value="Muestra">Muestra</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  placeholder="Descripción breve"
                  value={imagenForm.titulo}
                  onChange={(e) => setImagenForm({ ...imagenForm, titulo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Detalles adicionales..."
                  value={imagenForm.descripcion}
                  onChange={(e) => setImagenForm({ ...imagenForm, descripcion: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Imagen *</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setImagenForm({ ...imagenForm, archivo: e.target.files?.[0] || null })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setImagenDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Subir Imagen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Parto */}
      <Dialog open={partoDialogOpen} onOpenChange={setPartoDialogOpen}>
        <DialogContent>
          <form onSubmit={handleRegistrarParto}>
            <DialogHeader>
              <DialogTitle>Registrar Parto</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Animal ID (Madre) *</Label>
                <Input
                  placeholder="ID del animal"
                  value={partoForm.animalId}
                  onChange={(e) => setPartoForm({ ...partoForm, animalId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={partoForm.fecha}
                  onChange={(e) => setPartoForm({ ...partoForm, fecha: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Número de Crías *</Label>
                <Input
                  type="number"
                  min="1"
                  value={partoForm.numCrias}
                  onChange={(e) => setPartoForm({ ...partoForm, numCrias: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Condición del Parto *</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={partoForm.condicionParto}
                  onChange={(e) => setPartoForm({ ...partoForm, condicionParto: e.target.value })}
                >
                  <option value="Normal">Normal</option>
                  <option value="Asistido">Asistido</option>
                  <option value="Cesárea">Cesárea</option>
                  <option value="Complicado">Complicado</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Detalles adicionales..."
                  value={partoForm.observaciones}
                  onChange={(e) => setPartoForm({ ...partoForm, observaciones: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPartoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Cargar Animal */}
      <Dialog open={animalDialogOpen} onOpenChange={setAnimalDialogOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleCargarAnimal}>
            <DialogHeader>
              <DialogTitle>Cargar Nuevo Animal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Caravana *</Label>
                <Input
                  placeholder="Número de caravana"
                  value={animalForm.caravana}
                  onChange={(e) => setAnimalForm({ ...animalForm, caravana: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={animalForm.tipo}
                    onChange={(e) => setAnimalForm({ ...animalForm, tipo: e.target.value })}
                  >
                    <option value="Vacuno">Vacuno</option>
                    <option value="Ovino">Ovino</option>
                    <option value="Equino">Equino</option>
                    <option value="Porcino">Porcino</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Sexo *</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={animalForm.sexo}
                    onChange={(e) => setAnimalForm({ ...animalForm, sexo: e.target.value })}
                  >
                    <option value="Hembra">Hembra</option>
                    <option value="Macho">Macho</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Raza</Label>
                <Input
                  placeholder="Holando, Angus..."
                  value={animalForm.raza}
                  onChange={(e) => setAnimalForm({ ...animalForm, raza: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Nacimiento</Label>
                  <Input
                    type="date"
                    value={animalForm.fechaNacimiento}
                    onChange={(e) =>
                      setAnimalForm({ ...animalForm, fechaNacimiento: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Peso Nac. (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="35"
                    value={animalForm.pesoNacimiento}
                    onChange={(e) =>
                      setAnimalForm({ ...animalForm, pesoNacimiento: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Madre (Caravana)</Label>
                  <Input
                    placeholder="Caravana madre"
                    value={animalForm.madre}
                    onChange={(e) => setAnimalForm({ ...animalForm, madre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Padre (Caravana)</Label>
                  <Input
                    placeholder="Caravana padre"
                    value={animalForm.padre}
                    onChange={(e) => setAnimalForm({ ...animalForm, padre: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAnimalDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Movimiento de Ganado */}
      <Dialog open={movimientoDialogOpen} onOpenChange={setMovimientoDialogOpen}>
        <DialogContent>
          <form onSubmit={handleMovimientoGanado}>
            <DialogHeader>
              <DialogTitle>Movimiento de Ganado</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Animal ID *</Label>
                <Input
                  placeholder="ID del animal"
                  value={movimientoForm.animalId}
                  onChange={(e) => setMovimientoForm({ ...movimientoForm, animalId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Movimiento *</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={movimientoForm.tipoMovimiento}
                  onChange={(e) =>
                    setMovimientoForm({ ...movimientoForm, tipoMovimiento: e.target.value })
                  }
                >
                  <option value="Traslado">Traslado</option>
                  <option value="Venta">Venta</option>
                  <option value="Ingreso">Ingreso</option>
                  <option value="Egreso">Egreso</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Origen *</Label>
                <Input
                  placeholder="Lote 1, Corral 2..."
                  value={movimientoForm.origenNombre}
                  onChange={(e) =>
                    setMovimientoForm({ ...movimientoForm, origenNombre: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Destino *</Label>
                <Input
                  placeholder="Lote 3, Feria..."
                  value={movimientoForm.destinoNombre}
                  onChange={(e) =>
                    setMovimientoForm({ ...movimientoForm, destinoNombre: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Motivo *</Label>
                <Input
                  placeholder="Rotación, Venta, Cuarentena..."
                  value={movimientoForm.motivo}
                  onChange={(e) => setMovimientoForm({ ...movimientoForm, motivo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={movimientoForm.fecha}
                  onChange={(e) => setMovimientoForm({ ...movimientoForm, fecha: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMovimientoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Producción Lechera */}
      <Dialog open={produccionDialogOpen} onOpenChange={setProduccionDialogOpen}>
        <DialogContent>
          <form onSubmit={handleProduccionLechera}>
            <DialogHeader>
              <DialogTitle>Registrar Producción Lechera</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Animal ID *</Label>
                <Input
                  placeholder="ID del animal"
                  value={produccionForm.animalId}
                  onChange={(e) => setProduccionForm({ ...produccionForm, animalId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={produccionForm.fecha}
                  onChange={(e) => setProduccionForm({ ...produccionForm, fecha: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Litros Mañana</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="10.5"
                    value={produccionForm.litrosManana}
                    onChange={(e) =>
                      setProduccionForm({ ...produccionForm, litrosManana: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Litros Tarde</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="9.8"
                    value={produccionForm.litrosTarde}
                    onChange={(e) =>
                      setProduccionForm({ ...produccionForm, litrosTarde: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Total:</Label>
                <p className="text-lg font-bold">
                  {(
                    (parseFloat(produccionForm.litrosManana) || 0) +
                    (parseFloat(produccionForm.litrosTarde) || 0)
                  ).toFixed(1)}{" "}
                  litros
                </p>
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Calidad, estado del animal..."
                  value={produccionForm.observaciones}
                  onChange={(e) =>
                    setProduccionForm({ ...produccionForm, observaciones: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setProduccionDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}