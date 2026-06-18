"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Truck,
  MapPin,
  Activity,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Users,
  BarChart3,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Fuel,
  Gauge,
  ThermometerSun,
  Zap,
  Calendar,
  DollarSign,
  FileText,
  Send,
  RefreshCw,
  MapPinned,
  Navigation,
  Target,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Icon, KPI } from "@/components/mc";

// ============================================
// TYPES
// ============================================

interface Maquinaria {
  id: string;
  codigo: string;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie?: string;
  anioFabricacion?: number;
  patente?: string;
  horasMotor: number;
  estado: string;
  capacidad?: string;
  valorAdquisicion?: number;
  fechaAdquisicion?: string;
  intervaloMantenimiento?: number;
  ultimoMantenimiento?: number;
  establecimiento?: any;
  mantenimientos?: Mantenimiento[];
  alertas?: Alerta[];
  _count?: {
    mantenimientos: number;
    alertas: number;
    ordenesTaller: number;
  };
  horasFaltantesMantenimiento?: number;
  necesitaMantenimiento?: boolean;
}

interface Mantenimiento {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  horasMotor?: number;
  costo?: number;
  observaciones?: string;
  estado: string;
}

interface Alerta {
  id: string;
  tipo: string;
  categoria: string;
  prioridad: string;
  titulo: string;
  descripcion: string;
  horasMotorAlerta?: number;
  fechaAlerta?: string;
  sensorAlerta: boolean;
  estado: string;
  fechaCreacion: string;
  fechaResolucion?: string;
  resueltoPor?: string;
  observaciones?: string;
}

interface Sensor {
  id: string;
  codigoSensor: string;
  tipoSensor: string;
  ubicacion: string;
  valorActual: number;
  valorMinimo: number;
  valorMaximo: number;
  umbralAlerta: number;
  umbralCritico: number;
  unidad: string;
  estado: string;
  ultimaLectura: string;
  lecturas?: LecturaSensor[];
}

interface LecturaSensor {
  id: string;
  valor: number;
  estado: string;
  timestamp: string;
}

interface OrdenTaller {
  id: string;
  numeroOrden: string;
  tipo: string;
  categoria: string;
  prioridad: string;
  descripcionFalla: string;
  diagnostico?: string;
  trabajoRealizado?: string;
  fechaIngreso: string;
  fechaEstimada?: string;
  fechaInicio?: string;
  fechaSalida?: string;
  mecanicoAsignado?: string;
  ayudantes?: string[];
  estado: string;
  horasMotorIngreso?: number;
  costoRepuestos: number;
  costoManoObra: number;
  otrosCostos: number;
  costoTotal: number;
  observaciones?: string;
  maquinaria?: any;
  repuestos?: RepuestoUsado[];
  manoObra?: ManoObraTaller[];
  _count?: {
    repuestos: number;
    manoObra: number;
  };
}

interface RepuestoUsado {
  id: string;
  codigo: string;
  descripcion: string;
  marca?: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
  proveedor?: string;
}

interface ManoObraTaller {
  id: string;
  mecanico: string;
  especialidad?: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin?: string;
  horas: number;
  tarifaHora: number;
  total: number;
}

interface Operador {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  licenciaConducir?: string;
  categoriaLicencia?: string;
  vencimientoLicencia?: string;
  especialidades: string[];
  telefono?: string;
  email?: string;
  fechaIngreso: string;
  estado: string;
  totalEvaluaciones: number;
  scorePromedio: number;
}

interface EvaluacionOperador {
  id: string;
  operador: string;
  fecha: string;
  duracionJornada: number;
  velocidadPromedio: number;
  velocidadMaxima: number;
  frenadosBruscos: number;
  aceleracionesBruscas: number;
  scoreSeguridad: number;
  scoreEficiencia: number;
  scoreCuidado: number;
  scoreGeneral: number;
  calificacion: string;
  observaciones?: string;
  maquinaria?: any;
}

interface PosicionGPS {
  id: string;
  latitud: number;
  longitud: number;
  velocidad?: number;
  rumbo?: number;
  estadoMotor?: string;
  horasMotor?: number;
  nivelCombustible?: number;
  timestamp: string;
}

interface EficienciaMaquinaria {
  id: string;
  fecha: string;
  horasTrabajando: number;
  horasRalenti: number;
  horasApagado: number;
  horasTotales: number;
  consumoCombustible?: number;
  consumoPorHora?: number;
  distanciaRecorrida?: number;
  areaTrabajadasHa?: number;
  eficienciaScore?: number;
  consumoScore?: number;
  productividadScore?: number;
  scoreGeneral?: number;
  operador?: string;
  tarea?: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function MaquinariaPage() {
  // Estados principales
  const [maquinarias, setMaquinarias] = useState<Maquinaria[]>([]);
  const [selectedMaquinaria, setSelectedMaquinaria] = useState<Maquinaria | null>(null);
  const [ordenesTaller, setOrdenesTaller] = useState<OrdenTaller[]>([]);
  const [selectedOrden, setSelectedOrden] = useState<OrdenTaller | null>(null);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionOperador[]>([]);
  const [posicionesGPS, setPosicionesGPS] = useState<PosicionGPS[]>([]);
  const [eficiencia, setEficiencia] = useState<EficienciaMaquinaria[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [sensores, setSensores] = useState<Sensor[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialogs
  const [maquinariaDialogOpen, setMaquinariaDialogOpen] = useState(false);
  const [ordenDialogOpen, setOrdenDialogOpen] = useState(false);
  const [repuestoDialogOpen, setRepuestoDialogOpen] = useState(false);
  const [manoObraDialogOpen, setManoObraDialogOpen] = useState(false);
  const [alertaDialogOpen, setAlertaDialogOpen] = useState(false);
  const [sensorDialogOpen, setSensorDialogOpen] = useState(false);
  const [operadorDialogOpen, setOperadorDialogOpen] = useState(false);
  const [evaluacionDialogOpen, setEvaluacionDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [sortBy, setSortBy] = useState("codigo");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Formularios
  const [maquinariaForm, setMaquinariaForm] = useState({
    codigo: "",
    tipo: "Tractor",
    marca: "",
    modelo: "",
    numeroSerie: "",
    anioFabricacion: "",
    patente: "",
    horasMotor: "",
    capacidad: "",
    valorAdquisicion: "",
    fechaAdquisicion: "",
    intervaloMantenimiento: "250",
    establecimientoId: "",
  });

  const [ordenForm, setOrdenForm] = useState({
    maquinariaId: "",
    tipo: "Reparación",
    categoria: "Motor",
    prioridad: "Media",
    descripcionFalla: "",
    mecanicoAsignado: "",
    fechaEstimada: "",
  });

  const [repuestoForm, setRepuestoForm] = useState({
    codigo: "",
    descripcion: "",
    marca: "",
    cantidad: "",
    precioUnitario: "",
    proveedor: "",
  });

  const [manoObraForm, setManoObraForm] = useState({
    mecanico: "",
    especialidad: "",
    descripcion: "",
    fechaInicio: "",
    fechaFin: "",
    horas: "",
    tarifaHora: "",
  });

  const [alertaForm, setAlertaForm] = useState({
    tipo: "HorasMotor",
    categoria: "Aceite",
    prioridad: "Media",
    titulo: "",
    descripcion: "",
    horasMotorAlerta: "",
    fechaAlerta: "",
  });

  const [sensorForm, setSensorForm] = useState({
    codigoSensor: "",
    tipoSensor: "Temperatura",
    ubicacion: "Motor",
    valorActual: "",
    valorMinimo: "",
    valorMaximo: "",
    umbralAlerta: "",
    umbralCritico: "",
    unidad: "°C",
  });

  const [operadorForm, setOperadorForm] = useState({
    nombre: "",
    apellido: "",
    documento: "",
    licenciaConducir: "",
    categoriaLicencia: "",
    vencimientoLicencia: "",
    especialidades: [] as string[],
    telefono: "",
    email: "",
    fechaIngreso: "",
  });

  const [evaluacionForm, setEvaluacionForm] = useState({
    operador: "",
    maquinariaId: "",
    duracionJornada: "",
    velocidadPromedio: "",
    velocidadMaxima: "",
    frenadosBruscos: "0",
    aceleracionesBruscas: "0",
    girosBruscos: "0",
    excesosVelocidad: "0",
    tiempoTrabajando: "",
    tiempoRalenti: "",
    consumoCombustible: "",
    usoAdecuado: true,
    mantenimientoDiario: true,
    reporteProblemas: true,
    observaciones: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  // ============================================
  // useEffect - Cargar datos
  // ============================================

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado, filterTipo]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [maqRes, ordRes, opRes, dashRes] = await Promise.all([
        fetch("/api/maquinaria"),
        fetch("/api/maquinaria/ordenes-taller"),
        fetch("/api/maquinaria/operadores"),
        fetch("/api/maquinaria/dashboard"),
      ]);

      if (maqRes.ok) {
        const data = await maqRes.json();
        setMaquinarias(data);
      }

      if (ordRes.ok) {
        const data = await ordRes.json();
        setOrdenesTaller(data.ordenes || []);
      }

      if (opRes.ok) {
        const data = await opRes.json();
        setOperadores(data.operadores || []);
      }

      if (dashRes.ok) {
        const data = await dashRes.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };
  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtrado y ordenamiento
  const filterAndSortMaquinarias = () => {
    let filtered = [...maquinarias];

    // Búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.modelo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (filterEstado !== "Todos") {
      filtered = filtered.filter((m) => m.estado === filterEstado);
    }

    // Filtro por tipo
    if (filterTipo !== "Todos") {
      filtered = filtered.filter((m) => m.tipo === filterTipo);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      if (sortBy === "codigo") return a.codigo.localeCompare(b.codigo);
      if (sortBy === "horasMotor") return b.horasMotor - a.horasMotor;
      if (sortBy === "estado") return a.estado.localeCompare(b.estado);
      return 0;
    });

    return filtered;
  };

  const paginatedMaquinarias = () => {
    const filtered = filterAndSortMaquinarias();
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filtered.slice(start, end);
  };

  const totalPages = Math.ceil(filterAndSortMaquinarias().length / itemsPerPage);

  // ============================================
  // HANDLERS - MAQUINARIA
  // ============================================

  const handleCreateMaquinaria = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch("/api/maquinaria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(maquinariaForm),
      });

      if (res.ok) {
        await fetchData();
        setMaquinariaDialogOpen(false);
        resetMaquinariaForm();
      } else {
        const error = await res.json();
        alert(error.error || "Error al crear maquinaria");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear maquinaria");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditMaquinaria = (maquinaria: Maquinaria) => {
    setIsEditing(true);
    setSelectedMaquinaria(maquinaria);
    setMaquinariaForm({
      codigo: maquinaria.codigo,
      tipo: maquinaria.tipo,
      marca: maquinaria.marca,
      modelo: maquinaria.modelo,
      numeroSerie: maquinaria.numeroSerie || "",
      anioFabricacion: maquinaria.anioFabricacion?.toString() || "",
      patente: maquinaria.patente || "",
      horasMotor: maquinaria.horasMotor.toString(),
      capacidad: maquinaria.capacidad || "",
      valorAdquisicion: maquinaria.valorAdquisicion?.toString() || "",
      fechaAdquisicion: maquinaria.fechaAdquisicion || "",
      intervaloMantenimiento: maquinaria.intervaloMantenimiento?.toString() || "250",
      establecimientoId: maquinaria.establecimiento?.id || "",
    });
    setMaquinariaDialogOpen(true);
  };

  const handleUpdateMaquinaria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaquinaria) return;

    setActionLoading(true);

    try {
      const res = await fetch(`/api/maquinaria/${selectedMaquinaria.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(maquinariaForm),
      });

      if (res.ok) {
        await fetchData();
        setMaquinariaDialogOpen(false);
        resetMaquinariaForm();
        setIsEditing(false);
        setSelectedMaquinaria(null);
      } else {
        const error = await res.json();
        alert(error.error || "Error al actualizar maquinaria");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar maquinaria");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMaquinaria = async () => {
    if (!selectedMaquinaria) return;

    setActionLoading(true);

    try {
      const res = await fetch(`/api/maquinaria/${selectedMaquinaria.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchData();
        setDeleteDialogOpen(false);
        setSelectedMaquinaria(null);
      } else {
        const error = await res.json();
        alert(error.error || "Error al eliminar maquinaria");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar maquinaria");
    } finally {
      setActionLoading(false);
    }
  };

  const resetMaquinariaForm = () => {
    setMaquinariaForm({
      codigo: "",
      tipo: "Tractor",
      marca: "",
      modelo: "",
      numeroSerie: "",
      anioFabricacion: "",
      patente: "",
      horasMotor: "",
      capacidad: "",
      valorAdquisicion: "",
      fechaAdquisicion: "",
      intervaloMantenimiento: "250",
      establecimientoId: "",
    });
  };

  // ============================================
  // HANDLERS - ÓRDENES DE TALLER
  // ============================================

  const handleCreateOrden = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch("/api/maquinaria/ordenes-taller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ordenForm),
      });

      if (res.ok) {
        await fetchData();
        setOrdenDialogOpen(false);
        resetOrdenForm();
      } else {
        const error = await res.json();
        alert(error.error || "Error al crear orden");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear orden");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateOrden = async (estado: string) => {
    if (!selectedOrden) return;

    setActionLoading(true);

    try {
      const res = await fetch(`/api/maquinaria/ordenes-taller/${selectedOrden.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });

      if (res.ok) {
        await fetchData();
        setSelectedOrden(null);
      } else {
        const error = await res.json();
        alert(error.error || "Error al actualizar orden");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar orden");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddRepuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrden) return;

    setActionLoading(true);

    try {
      const res = await fetch(`/api/maquinaria/ordenes-taller/${selectedOrden.id}/repuestos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(repuestoForm),
      });

      if (res.ok) {
        await fetchData();
        setRepuestoDialogOpen(false);
        resetRepuestoForm();
      } else {
        const error = await res.json();
        alert(error.error || "Error al agregar repuesto");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al agregar repuesto");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddManoObra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrden) return;

    setActionLoading(true);

    try {
      const res = await fetch(`/api/maquinaria/ordenes-taller/${selectedOrden.id}/mano-obra`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manoObraForm),
      });

      if (res.ok) {
        await fetchData();
        setManoObraDialogOpen(false);
        resetManoObraForm();
      } else {
        const error = await res.json();
        alert(error.error || "Error al agregar mano de obra");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al agregar mano de obra");
    } finally {
      setActionLoading(false);
    }
  };

  const resetOrdenForm = () => {
    setOrdenForm({
      maquinariaId: "",
      tipo: "Reparación",
      categoria: "Motor",
      prioridad: "Media",
      descripcionFalla: "",
      mecanicoAsignado: "",
      fechaEstimada: "",
    });
  };

  const resetRepuestoForm = () => {
    setRepuestoForm({
      codigo: "",
      descripcion: "",
      marca: "",
      cantidad: "",
      precioUnitario: "",
      proveedor: "",
    });
  };

  const resetManoObraForm = () => {
    setManoObraForm({
      mecanico: "",
      especialidad: "",
      descripcion: "",
      fechaInicio: "",
      fechaFin: "",
      horas: "",
      tarifaHora: "",
    });
  };

  // ============================================
  // HANDLERS - ALERTAS
  // ============================================

  const handleCreateAlerta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaquinaria) return;

    setActionLoading(true);

    try {
      const res = await fetch(`/api/maquinaria/${selectedMaquinaria.id}/alertas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertaForm),
      });

      if (res.ok) {
        await fetchData();
        setAlertaDialogOpen(false);
        resetAlertaForm();
      } else {
        const error = await res.json();
        alert(error.error || "Error al crear alerta");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear alerta");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolverAlerta = async (alertaId: string) => {
    if (!selectedMaquinaria) return;

    setActionLoading(true);

    try {
      const res = await fetch(
        `/api/maquinaria/${selectedMaquinaria.id}/alertas/${alertaId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            estado: "Atendida",
            resueltoPor: "Usuario",
          }),
        }
      );

      if (res.ok) {
        await fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Error al resolver alerta");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al resolver alerta");
    } finally {
      setActionLoading(false);
    }
  };

  const resetAlertaForm = () => {
    setAlertaForm({
      tipo: "HorasMotor",
      categoria: "Aceite",
      prioridad: "Media",
      titulo: "",
      descripcion: "",
      horasMotorAlerta: "",
      fechaAlerta: "",
    });
  };

  // ============================================
  // HANDLERS - SENSORES
  // ============================================

  const handleCreateSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaquinaria) return;

    setActionLoading(true);

    try {
      const res = await fetch(`/api/maquinaria/${selectedMaquinaria.id}/sensores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sensorForm),
      });

      if (res.ok) {
        await fetchData();
        setSensorDialogOpen(false);
        resetSensorForm();
      } else {
        const error = await res.json();
        alert(error.error || "Error al registrar sensor");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar sensor");
    } finally {
      setActionLoading(false);
    }
  };

  const resetSensorForm = () => {
    setSensorForm({
      codigoSensor: "",
      tipoSensor: "Temperatura",
      ubicacion: "Motor",
      valorActual: "",
      valorMinimo: "",
      valorMaximo: "",
      umbralAlerta: "",
      umbralCritico: "",
      unidad: "°C",
    });
  };

  // ============================================
  // HANDLERS - OPERADORES
  // ============================================

  const handleCreateOperador = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch("/api/maquinaria/operadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(operadorForm),
      });

      if (res.ok) {
        await fetchData();
        setOperadorDialogOpen(false);
        resetOperadorForm();
      } else {
        const error = await res.json();
        alert(error.error || "Error al crear operador");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear operador");
    } finally {
      setActionLoading(false);
    }
  };

  const resetOperadorForm = () => {
    setOperadorForm({
      nombre: "",
      apellido: "",
      documento: "",
      licenciaConducir: "",
      categoriaLicencia: "",
      vencimientoLicencia: "",
      especialidades: [],
      telefono: "",
      email: "",
      fechaIngreso: "",
    });
  };

  // ============================================
  // HANDLERS - EVALUACIONES
  // ============================================

  const handleCreateEvaluacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch("/api/maquinaria/operadores/evaluaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evaluacionForm),
      });

      if (res.ok) {
        await fetchData();
        setEvaluacionDialogOpen(false);
        resetEvaluacionForm();
      } else {
        const error = await res.json();
        alert(error.error || "Error al crear evaluación");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear evaluación");
    } finally {
      setActionLoading(false);
    }
  };

  const resetEvaluacionForm = () => {
    setEvaluacionForm({
      operador: "",
      maquinariaId: "",
      duracionJornada: "",
      velocidadPromedio: "",
      velocidadMaxima: "",
      frenadosBruscos: "0",
      aceleracionesBruscas: "0",
      girosBruscos: "0",
      excesosVelocidad: "0",
      tiempoTrabajando: "",
      tiempoRalenti: "",
      consumoCombustible: "",
      usoAdecuado: true,
      mantenimientoDiario: true,
      reporteProblemas: true,
      observaciones: "",
    });
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold inline-flex items-center gap-2"><Icon name="truck" size={28} /> Gestión de Maquinaria</h1>
          <p className="text-gray-600">
            Sistema completo de gestión, mantenimiento y monitoreo
          </p>
        </div>
        <Button onClick={() => setMaquinariaDialogOpen(true)} className="bg-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Maquinaria
        </Button>
      </div>

      {/* KPIs Dashboard */}
      {dashboard && (
        <div className="grid g-cols-4">
          <KPI label="Total Maquinarias" value={String(dashboard.kpis.totalMaquinarias)} delta={`${dashboard.kpis.porcentajeOperativo.toFixed(0)}% operativas`} trend="up" icon="wrench" accent />
          <KPI label="Alertas Activas" value={String(dashboard.alertas.total)} delta={`${dashboard.alertas.criticas} críticas`} trend="warn" icon="alert" warn />
          <KPI label="Órdenes Abiertas" value={String(dashboard.ordenesTaller.abiertas)} delta={`${dashboard.ordenesTaller.completadasMes} completadas este mes`} trend="up" icon="box" />
          <KPI label="Eficiencia Promedio" value={`${dashboard.eficiencia.promedio}%`} delta={`${dashboard.eficiencia.totalRegistros} registros`} trend="up" icon="activity" />
        </div>
      )}
      {/* TABS PRINCIPALES */}
      <Tabs defaultValue="flota" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="flota">
            <Truck className="h-4 w-4 mr-2" />
            Flota
          </TabsTrigger>
          <TabsTrigger value="gps">
            <MapPin className="h-4 w-4 mr-2" />
            GPS
          </TabsTrigger>
          <TabsTrigger value="eficiencia">
            <Activity className="h-4 w-4 mr-2" />
            Eficiencia
          </TabsTrigger>
          <TabsTrigger value="mantenimiento">
            <Wrench className="h-4 w-4 mr-2" />
            Mantenimiento
          </TabsTrigger>
          <TabsTrigger value="predictivo">
            <Zap className="h-4 w-4 mr-2" />
            Predictivo
          </TabsTrigger>
          <TabsTrigger value="taller">
            <FileText className="h-4 w-4 mr-2" />
            Taller
          </TabsTrigger>
          <TabsTrigger value="operadores">
            <Users className="h-4 w-4 mr-2" />
            Operadores
          </TabsTrigger>
          <TabsTrigger value="reportes">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* TAB 1: FLOTA (Inventario de Maquinaria) */}
        {/* ============================================ */}
        <TabsContent value="flota" className="space-y-4">
          {/* Barra de búsqueda y filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar maquinaria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos los estados</SelectItem>
                    <SelectItem value="Operativo">Operativo</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Averiado">Averiado</SelectItem>
                    <SelectItem value="Fuera de Servicio">Fuera de Servicio</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos los tipos</SelectItem>
                    <SelectItem value="Tractor">Tractor</SelectItem>
                    <SelectItem value="Cosechadora">Cosechadora</SelectItem>
                    <SelectItem value="Pulverizadora">Pulverizadora</SelectItem>
                    <SelectItem value="Sembradora">Sembradora</SelectItem>
                    <SelectItem value="Tolva">Tolva</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="codigo">Ordenar por código</SelectItem>
                    <SelectItem value="horasMotor">Ordenar por horas</SelectItem>
                    <SelectItem value="estado">Ordenar por estado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(searchTerm || filterEstado !== "Todos" || filterTipo !== "Todos") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterEstado("Todos");
                    setFilterTipo("Todos");
                  }}
                >
                  Limpiar Filtros
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Lista de Maquinaria */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedMaquinarias().map((maquinaria) => (
              <Card key={maquinaria.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{maquinaria.codigo}</CardTitle>
                      <CardDescription>
                        {maquinaria.marca} {maquinaria.modelo}
                      </CardDescription>
                    </div>
                    <Badge
                      className={
                        maquinaria.estado === "Operativo"
                          ? "bg-green-500"
                          : maquinaria.estado === "Mantenimiento"
                          ? "bg-yellow-500"
                          : maquinaria.estado === "Averiado"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }
                    >
                      {maquinaria.estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium">{maquinaria.tipo}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Horas Motor:</span>
                    <span className="font-medium">{maquinaria.horasMotor.toFixed(1)} hs</span>
                  </div>

                  {maquinaria.patente && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Patente:</span>
                      <span className="font-medium">{maquinaria.patente}</span>
                    </div>
                  )}

                  {maquinaria.capacidad && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Capacidad:</span>
                      <span className="font-medium">{maquinaria.capacidad}</span>
                    </div>
                  )}

                  {/* Próximo Mantenimiento */}
                  {maquinaria.horasFaltantesMantenimiento !== undefined && (
                    <div
                      className={`p-2 rounded text-sm ${
                        maquinaria.necesitaMantenimiento
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : maquinaria.horasFaltantesMantenimiento <= 50
                          ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                          : "bg-green-50 text-green-700 border border-green-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="inline-flex items-center gap-1">
                          {maquinaria.necesitaMantenimiento
                            ? <><Icon name="alert" size={14} /> Mantenimiento vencido</>
                            : `${maquinaria.horasFaltantesMantenimiento.toFixed(
                                0
                              )} hs para mantenimiento`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Alertas */}
                  {maquinaria._count && maquinaria._count.alertas > 0 && (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{maquinaria._count.alertas} alertas activas</span>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedMaquinaria(maquinaria);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditMaquinaria(maquinaria)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMaquinaria(maquinaria);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}

          {paginatedMaquinarias().length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No se encontraron maquinarias</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 2: GPS EN TIEMPO REAL */}
        {/* ============================================ */}
        <TabsContent value="gps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Ubicación GPS en Tiempo Real
              </CardTitle>
              <CardDescription>
                Monitoreo de posición y estado de la flota
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selector de Maquinaria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Seleccionar Maquinaria</Label>
                  <Select
                    value={selectedMaquinaria?.id || ""}
                    onValueChange={(value) => {
                      const maq = maquinarias.find((m) => m.id === value);
                      setSelectedMaquinaria(maq || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una maquinaria" />
                    </SelectTrigger>
                    <SelectContent>
                      {maquinarias.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.codigo} - {m.tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedMaquinaria ? (
                <div className="space-y-4">
                  {/* Mapa Placeholder */}
                  <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <MapPinned className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium">Mapa GPS</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Integración con Google Maps / Leaflet
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        (Requiere implementación de librería de mapas)
                      </p>
                    </div>
                  </div>

                  {/* Info de Última Posición */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Estado Motor</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              selectedMaquinaria.estado === "Operativo"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          />
                          <span className="font-medium">
                            {selectedMaquinaria.estado === "Operativo"
                              ? "Encendido"
                              : "Apagado"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Velocidad</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-blue-600" />
                          <span className="text-lg font-bold">0 km/h</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Combustible</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Fuel className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-bold">---%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Última Actualización</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-600" />
                          <span className="text-sm">--</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Historial de Posiciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        No hay datos de GPS disponibles. Configure el sistema de telemetría para
                        comenzar a recibir datos en tiempo real.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Navigation className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Selecciona una maquinaria para ver su ubicación GPS</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 3: EFICIENCIA DE USO */}
        {/* ============================================ */}
        <TabsContent value="eficiencia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Análisis de Eficiencia
              </CardTitle>
              <CardDescription>
                Tiempo trabajando vs. ralentí y consumo de combustible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selector de Maquinaria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Seleccionar Maquinaria</Label>
                  <Select
                    value={selectedMaquinaria?.id || ""}
                    onValueChange={(value) => {
                      const maq = maquinarias.find((m) => m.id === value);
                      setSelectedMaquinaria(maq || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una maquinaria" />
                    </SelectTrigger>
                    <SelectContent>
                      {maquinarias.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.codigo} - {m.tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedMaquinaria ? (
                <div className="space-y-4">
                  {/* KPIs de Eficiencia */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-blue-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Tiempo Trabajando</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-700">0 hs</div>
                        <p className="text-xs text-gray-600">Últimos 7 días</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-yellow-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Tiempo Ralentí</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-700">0 hs</div>
                        <p className="text-xs text-gray-600">0% del total</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-700">0%</div>
                        <p className="text-xs text-gray-600">Score general</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Consumo Promedio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-700">0 L/h</div>
                        <p className="text-xs text-gray-600">Últimos registros</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráfico de Eficiencia */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tendencia de Eficiencia (7 días)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                        <div className="text-center">
                          <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-600">No hay datos de eficiencia disponibles</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Configure el sistema de telemetría para registrar datos automáticamente
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    Selecciona una maquinaria para ver su análisis de eficiencia
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* ============================================ */}
        {/* TAB 4: MANTENIMIENTO PREVENTIVO */}
        {/* ============================================ */}
        <TabsContent value="mantenimiento" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Mantenimiento Preventivo</h2>
              <p className="text-gray-600">Alertas por horas de motor y fechas programadas</p>
            </div>
            <Button
              onClick={() => {
                if (selectedMaquinaria) {
                  setAlertaDialogOpen(true);
                } else {
                  alert("Selecciona una maquinaria primero");
                }
              }}
              className="bg-orange-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Alerta
            </Button>
          </div>

          {/* Selector de Maquinaria */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Seleccionar Maquinaria</Label>
                  <Select
                    value={selectedMaquinaria?.id || ""}
                    onValueChange={(value) => {
                      const maq = maquinarias.find((m) => m.id === value);
                      setSelectedMaquinaria(maq || null);
                      if (maq) {
                        // Cargar alertas de esta maquinaria
                        fetch(`/api/maquinaria/${maq.id}/alertas`)
                          .then((res) => res.json())
                          .then((data) => setAlertas(data.alertas || []));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una maquinaria" />
                    </SelectTrigger>
                    <SelectContent>
                      {maquinarias.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.codigo} - {m.tipo} ({m._count?.alertas || 0} alertas)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedMaquinaria ? (
            <div className="space-y-4">
              {/* Info de Mantenimiento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Horas Actuales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedMaquinaria.horasMotor.toFixed(1)} hs
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Intervalo Mantenimiento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedMaquinaria.intervaloMantenimiento || 250} hs
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={
                    selectedMaquinaria.necesitaMantenimiento
                      ? "bg-red-50 border-red-200"
                      : "bg-green-50 border-green-200"
                  }
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Próximo Mantenimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        selectedMaquinaria.necesitaMantenimiento
                          ? "text-red-700"
                          : "text-green-700"
                      }`}
                    >
                      {selectedMaquinaria.necesitaMantenimiento
                        ? "¡VENCIDO!"
                        : `${selectedMaquinaria.horasFaltantesMantenimiento?.toFixed(0) || 0} hs`}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Alertas */}
              <Card>
                <CardHeader>
                  <CardTitle>Alertas Activas ({alertas.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {alertas.length > 0 ? (
                    <div className="space-y-3">
                      {alertas.map((alerta) => (
                        <Card
                          key={alerta.id}
                          className={`${
                            alerta.prioridad === "Crítica"
                              ? "border-red-500 bg-red-50"
                              : alerta.prioridad === "Alta"
                              ? "border-orange-500 bg-orange-50"
                              : alerta.prioridad === "Media"
                              ? "border-yellow-500 bg-yellow-50"
                              : "border-blue-500 bg-blue-50"
                          }`}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    className={
                                      alerta.prioridad === "Crítica"
                                        ? "bg-red-600"
                                        : alerta.prioridad === "Alta"
                                        ? "bg-orange-600"
                                        : alerta.prioridad === "Media"
                                        ? "bg-yellow-600"
                                        : "bg-blue-600"
                                    }
                                  >
                                    {alerta.prioridad}
                                  </Badge>
                                  <Badge variant="outline">{alerta.categoria}</Badge>
                                  {alerta.sensorAlerta && (
                                    <Badge className="bg-purple-600">
                                      <Zap className="h-3 w-3 mr-1" />
                                      Sensor
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="font-semibold mb-1">{alerta.titulo}</h4>
                                <p className="text-sm text-gray-700 mb-2">
                                  {alerta.descripcion}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                  <span>Tipo: {alerta.tipo}</span>
                                  {alerta.horasMotorAlerta && (
                                    <span>Alerta: {alerta.horasMotorAlerta} hs</span>
                                  )}
                                  <span>Creada: {formatDate(alerta.fechaCreacion)}</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleResolverAlerta(alerta.id)}
                                disabled={actionLoading}
                                className="bg-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Resolver
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      <p className="text-gray-600">No hay alertas activas</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Todas las alertas han sido atendidas
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Selecciona una maquinaria para ver sus alertas de mantenimiento
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 5: MANTENIMIENTO PREDICTIVO */}
        {/* ============================================ */}
        <TabsContent value="predictivo" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Mantenimiento Predictivo</h2>
              <p className="text-gray-600">Sensores IoT que detectan fallas antes de que ocurran</p>
            </div>
            <Button
              onClick={() => {
                if (selectedMaquinaria) {
                  setSensorDialogOpen(true);
                } else {
                  alert("Selecciona una maquinaria primero");
                }
              }}
              className="bg-purple-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Lectura
            </Button>
          </div>

          {/* Selector de Maquinaria */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Seleccionar Maquinaria</Label>
                  <Select
                    value={selectedMaquinaria?.id || ""}
                    onValueChange={(value) => {
                      const maq = maquinarias.find((m) => m.id === value);
                      setSelectedMaquinaria(maq || null);
                      if (maq) {
                        // Cargar sensores de esta maquinaria
                        fetch(`/api/maquinaria/${maq.id}/sensores`)
                          .then((res) => res.json())
                          .then((data) => setSensores(data.sensores || []));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una maquinaria" />
                    </SelectTrigger>
                    <SelectContent>
                      {maquinarias.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.codigo} - {m.tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedMaquinaria ? (
            <div className="space-y-4">
              {/* Resumen de Sensores */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Sensores Normales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-700">
                      {sensores.filter((s) => s.estado === "Normal").length}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">En Alerta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-700">
                      {sensores.filter((s) => s.estado === "Alerta").length}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Estado Crítico</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-700">
                      {sensores.filter((s) => s.estado === "Crítico").length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Sensores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{sensores.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Sensores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sensores.length > 0 ? (
                  sensores.map((sensor) => (
                    <Card
                      key={sensor.id}
                      className={`${
                        sensor.estado === "Crítico"
                          ? "border-red-500 bg-red-50"
                          : sensor.estado === "Alerta"
                          ? "border-yellow-500 bg-yellow-50"
                          : "border-green-500 bg-green-50"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{sensor.codigoSensor}</CardTitle>
                            <CardDescription>
                              {sensor.tipoSensor} - {sensor.ubicacion}
                            </CardDescription>
                          </div>
                          <Badge
                            className={
                              sensor.estado === "Crítico"
                                ? "bg-red-600"
                                : sensor.estado === "Alerta"
                                ? "bg-yellow-600"
                                : "bg-green-600"
                            }
                          >
                            {sensor.estado}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Valor Actual:</span>
                          <span className="text-2xl font-bold">
                            {sensor.valorActual.toFixed(1)} {sensor.unidad}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Rango Normal:</span>
                            <span>
                              {sensor.valorMinimo} - {sensor.valorMaximo} {sensor.unidad}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Umbral Alerta:</span>
                            <span className="text-yellow-600">
                              {sensor.umbralAlerta} {sensor.unidad}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Umbral Crítico:</span>
                            <span className="text-red-600">
                              {sensor.umbralCritico} {sensor.unidad}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t text-xs text-gray-600">
                          Última lectura: {formatDateTime(sensor.ultimaLectura)}
                        </div>

                        {/* Mini gráfico de últimas lecturas */}
                        {sensor.lecturas && sensor.lecturas.length > 0 && (
                          <div className="h-20">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={sensor.lecturas.slice(0, 10).reverse()}>
                                <Line
                                  type="monotone"
                                  dataKey="valor"
                                  stroke={
                                    sensor.estado === "Crítico"
                                      ? "#c93434"
                                      : sensor.estado === "Alerta"
                                      ? "#c08a22"
                                      : "#5e7733"
                                  }
                                  strokeWidth={2}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="col-span-2">
                    <CardContent className="text-center py-12">
                      <ThermometerSun className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">No hay sensores configurados</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Registra lecturas para comenzar el monitoreo predictivo
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Zap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Selecciona una maquinaria para ver sus sensores predictivos
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 6: ÓRDENES DE TALLER */}
        {/* ============================================ */}
        <TabsContent value="taller" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Órdenes de Taller</h2>
              <p className="text-gray-600">Gestión digital de reparaciones mecánicas</p>
            </div>
            <Button onClick={() => setOrdenDialogOpen(true)} className="bg-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </Button>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ingresadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ordenesTaller.filter((o) => o.estado === "Ingresada").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {ordenesTaller.filter((o) => o.estado === "En Proceso").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Esperando Repuestos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {ordenesTaller.filter((o) => o.estado === "Esperando Repuestos").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {ordenesTaller.filter((o) => o.estado === "Completada").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${ordenesTaller.reduce((acc, o) => acc + o.costoTotal, 0).toFixed(0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kanban de Órdenes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Columna: Ingresadas */}
            <Card>
              <CardHeader className="pb-3 bg-gray-50">
                <CardTitle className="text-sm inline-flex items-center gap-1"><Icon name="download" size={14} /> Ingresadas</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {ordenesTaller
                  .filter((o) => o.estado === "Ingresada")
                  .map((orden) => (
                    <Card
                      key={orden.id}
                      className="cursor-pointer hover:shadow-md"
                      onClick={() => setSelectedOrden(orden)}
                    >
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">{orden.numeroOrden}</span>
                            <Badge
                              className={
                                orden.prioridad === "Urgente"
                                  ? "bg-red-600"
                                  : orden.prioridad === "Alta"
                                  ? "bg-orange-600"
                                  : "bg-blue-600"
                              }
                            >
                              {orden.prioridad}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            {orden.maquinaria?.codigo} - {orden.categoria}
                          </p>
                          <p className="text-xs line-clamp-2">{orden.descripcionFalla}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {ordenesTaller.filter((o) => o.estado === "Ingresada").length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay órdenes ingresadas
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Columna: En Proceso */}
            <Card>
              <CardHeader className="pb-3 bg-blue-50">
                <CardTitle className="text-sm inline-flex items-center gap-1"><Icon name="wrench" size={14} /> En Proceso</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {ordenesTaller
                  .filter((o) => o.estado === "En Proceso")
                  .map((orden) => (
                    <Card
                      key={orden.id}
                      className="cursor-pointer hover:shadow-md border-blue-200"
                      onClick={() => setSelectedOrden(orden)}
                    >
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">{orden.numeroOrden}</span>
                            <Badge
                              className={
                                orden.prioridad === "Urgente"
                                  ? "bg-red-600"
                                  : orden.prioridad === "Alta"
                                  ? "bg-orange-600"
                                  : "bg-blue-600"
                              }
                            >
                              {orden.prioridad}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            {orden.maquinaria?.codigo} - {orden.categoria}
                          </p>
                          {orden.mecanicoAsignado && (
                            <p className="text-xs text-blue-600 inline-flex items-center gap-1"><Icon name="users" size={12} /> {orden.mecanicoAsignado}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {ordenesTaller.filter((o) => o.estado === "En Proceso").length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No hay órdenes en proceso</p>
                )}
              </CardContent>
            </Card>

            {/* Columna: Esperando Repuestos */}
            <Card>
              <CardHeader className="pb-3 bg-orange-50">
                <CardTitle className="text-sm">⏳ Esperando Repuestos</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {ordenesTaller
                  .filter((o) => o.estado === "Esperando Repuestos")
                  .map((orden) => (
                    <Card
                      key={orden.id}
                      className="cursor-pointer hover:shadow-md border-orange-200"
                      onClick={() => setSelectedOrden(orden)}
                    >
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">{orden.numeroOrden}</span>
                            <Badge
                              className={
                                orden.prioridad === "Urgente"
                                  ? "bg-red-600"
                                  : orden.prioridad === "Alta"
                                  ? "bg-orange-600"
                                  : "bg-blue-600"
                              }
                            >
                              {orden.prioridad}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            {orden.maquinaria?.codigo} - {orden.categoria}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {ordenesTaller.filter((o) => o.estado === "Esperando Repuestos").length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay órdenes esperando repuestos
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Columna: Completadas */}
            <Card>
              <CardHeader className="pb-3 bg-green-50">
                <CardTitle className="text-sm inline-flex items-center gap-1"><Icon name="check" size={14} /> Completadas</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {ordenesTaller
                  .filter((o) => o.estado === "Completada")
                  .slice(0, 5)
                  .map((orden) => (
                    <Card
                      key={orden.id}
                      className="cursor-pointer hover:shadow-md border-green-200"
                      onClick={() => setSelectedOrden(orden)}
                    >
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">{orden.numeroOrden}</span>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <p className="text-xs text-gray-600">
                            {orden.maquinaria?.codigo} - {orden.categoria}
                          </p>
                          <p className="text-xs text-green-600 font-medium">
                            ${orden.costoTotal.toFixed(0)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {ordenesTaller.filter((o) => o.estado === "Completada").length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay órdenes completadas
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* ============================================ */}
        {/* TAB 7: EVALUACIÓN DE OPERADORES */}
        {/* ============================================ */}
        <TabsContent value="operadores" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Evaluación de Operadores</h2>
              <p className="text-gray-600">Monitoreo de manejo y seguridad</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setOperadorDialogOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Operador
              </Button>
              <Button onClick={() => setEvaluacionDialogOpen(true)} className="bg-green-600">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Evaluación
              </Button>
            </div>
          </div>

          {/* Ranking de Operadores */}
          <Card>
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2"><Icon name="target" size={18} /> Ranking de Operadores</CardTitle>
              <CardDescription>Ordenados por score promedio</CardDescription>
            </CardHeader>
            <CardContent>
              {operadores.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {operadores
                    .sort((a, b) => b.scorePromedio - a.scorePromedio)
                    .map((operador, index) => (
                      <Card
                        key={operador.id}
                        className={`${
                          index === 0
                            ? "border-yellow-400 bg-yellow-50"
                            : index === 1
                            ? "border-gray-400 bg-gray-50"
                            : index === 2
                            ? "border-orange-400 bg-orange-50"
                            : ""
                        }`}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                {index === 0 && <span className="text-2xl text-yellow-500"><Icon name="target" size={22} /></span>}
                                {index === 1 && <span className="text-2xl text-gray-400"><Icon name="target" size={22} /></span>}
                                {index === 2 && <span className="text-2xl text-orange-400"><Icon name="target" size={22} /></span>}
                                <h3 className="font-bold">
                                  {operador.nombre} {operador.apellido}
                                </h3>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                Doc: {operador.documento}
                              </p>
                            </div>
                            <Badge
                              className={
                                operador.estado === "Activo"
                                  ? "bg-green-500"
                                  : operador.estado === "Licencia"
                                  ? "bg-yellow-500"
                                  : "bg-gray-500"
                              }
                            >
                              {operador.estado}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Score Promedio:</span>
                              <span
                                className={`text-2xl font-bold ${
                                  operador.scorePromedio >= 90
                                    ? "text-green-600"
                                    : operador.scorePromedio >= 75
                                    ? "text-blue-600"
                                    : operador.scorePromedio >= 60
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }`}
                              >
                                {operador.scorePromedio.toFixed(1)}
                              </span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  operador.scorePromedio >= 90
                                    ? "bg-green-600"
                                    : operador.scorePromedio >= 75
                                    ? "bg-blue-600"
                                    : operador.scorePromedio >= 60
                                    ? "bg-yellow-600"
                                    : "bg-red-600"
                                }`}
                                style={{ width: `${operador.scorePromedio}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Evaluaciones:</span>
                              <span className="font-medium">{operador.totalEvaluaciones}</span>
                            </div>

                            {operador.especialidades.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {operador.especialidades.map((esp, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {esp}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {operador.licenciaConducir && (
                              <div className="pt-2 border-t text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Licencia:</span>
                                  <span>
                                    {operador.categoriaLicencia || "N/A"} -{" "}
                                    {operador.licenciaConducir}
                                  </span>
                                </div>
                                {operador.vencimientoLicencia && (
                                  <div className="flex justify-between mt-1">
                                    <span className="text-gray-600">Vencimiento:</span>
                                    <span>{formatDate(operador.vencimientoLicencia)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No hay operadores registrados</p>
                  <Button onClick={() => setOperadorDialogOpen(true)} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primer Operador
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Últimas Evaluaciones */}
          {evaluaciones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Últimas Evaluaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {evaluaciones.slice(0, 10).map((evaluacion) => (
                    <Card key={evaluacion.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{evaluacion.operador}</h4>
                              <Badge
                                className={
                                  evaluacion.calificacion === "Excelente"
                                    ? "bg-green-600"
                                    : evaluacion.calificacion === "Muy Buena"
                                    ? "bg-blue-600"
                                    : evaluacion.calificacion === "Buena"
                                    ? "bg-yellow-600"
                                    : "bg-red-600"
                                }
                              >
                                {evaluacion.calificacion}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {evaluacion.maquinaria?.codigo} - {formatDate(evaluacion.fecha)}
                            </p>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div>
                                <p className="text-gray-600">Seguridad</p>
                                <p className="font-bold text-blue-600">
                                  {evaluacion.scoreSeguridad.toFixed(0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Eficiencia</p>
                                <p className="font-bold text-green-600">
                                  {evaluacion.scoreEficiencia.toFixed(0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Cuidado</p>
                                <p className="font-bold text-purple-600">
                                  {evaluacion.scoreCuidado.toFixed(0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">General</p>
                                <p className="font-bold">{evaluacion.scoreGeneral.toFixed(0)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 8: DASHBOARD GENERAL */}
        {/* ============================================ */}
        <TabsContent value="reportes" className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Dashboard General</h2>
            <p className="text-gray-600">Resumen completo del módulo de maquinaria</p>
          </div>

          {dashboard && (
            <>
              {/* Gráfico: Distribución por Tipo */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Maquinaria por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {dashboard.distribucionTipos && dashboard.distribucionTipos.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashboard.distribucionTipos}
                            dataKey="cantidad"
                            nameKey="tipo"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {dashboard.distribucionTipos.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  [
                                    "#2c6bb8",
                                    "#5e7733",
                                    "#d9a538",
                                    "#c93434",
                                    "#64748b",
                                  ][index % 5]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No hay datos disponibles</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top 5 Maquinarias por Horas */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Maquinarias por Horas Motor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboard.topMaquinarias && dashboard.topMaquinarias.length > 0 ? (
                      dashboard.topMaquinarias.map((maq: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                            <div>
                              <p className="font-semibold">{maq.codigo}</p>
                              <p className="text-sm text-gray-600">
                                {maq.marca} {maq.modelo}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">
                              {maq.horasMotor.toFixed(0)}
                            </p>
                            <p className="text-sm text-gray-600">horas</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Resumen de Alertas Críticas */}
              {dashboard.alertas && dashboard.alertas.ultimas && dashboard.alertas.ultimas.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      Alertas Críticas Activas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboard.alertas.ultimas
                        .filter((a: any) => a.prioridad === "Crítica")
                        .slice(0, 5)
                        .map((alerta: any) => (
                          <div
                            key={alerta.id}
                            className="flex items-center justify-between p-3 bg-white rounded border border-red-200"
                          >
                            <div>
                              <p className="font-semibold text-red-900">{alerta.titulo}</p>
                              <p className="text-sm text-gray-600">
                                {alerta.maquinaria.codigo} - {alerta.categoria}
                              </p>
                            </div>
                            <Badge className="bg-red-600">Crítica</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Exportar Reportes */}
              <Card>
                <CardHeader>
                  <CardTitle>Exportar Reportes</CardTitle>
                  <CardDescription>Descarga información detallada</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Reporte de Flota
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Reporte de Mantenimiento
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Reporte de Costos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================================ */}
      {/* DIALOGS */}
      {/* ============================================ */}

      {/* Dialog: Nueva/Editar Maquinaria */}
      <Dialog open={maquinariaDialogOpen} onOpenChange={setMaquinariaDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={isEditing ? handleUpdateMaquinaria : handleCreateMaquinaria}>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Maquinaria" : "Nueva Maquinaria"}
              </DialogTitle>
              <DialogDescription>
                Registra o actualiza información de la maquinaria
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    placeholder="MAQ-001"
                    value={maquinariaForm.codigo}
                    onChange={(e) =>
                      setMaquinariaForm({ ...maquinariaForm, codigo: e.target.value })
                    }
                    required
                    disabled={isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={maquinariaForm.tipo}
                    onValueChange={(value) =>
                      setMaquinariaForm({ ...maquinariaForm, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tractor">Tractor</SelectItem>
                      <SelectItem value="Cosechadora">Cosechadora</SelectItem>
                      <SelectItem value="Pulverizadora">Pulverizadora</SelectItem>
                      <SelectItem value="Sembradora">Sembradora</SelectItem>
                      <SelectItem value="Tolva">Tolva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marca *</Label>
                  <Input
                    placeholder="John Deere"
                    value={maquinariaForm.marca}
                    onChange={(e) =>
                      setMaquinariaForm({ ...maquinariaForm, marca: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Modelo *</Label>
                  <Input
                    placeholder="6175R"
                    value={maquinariaForm.modelo}
                    onChange={(e) =>
                      setMaquinariaForm({ ...maquinariaForm, modelo: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Serie</Label>
                  <Input
                    placeholder="1234567890"
                    value={maquinariaForm.numeroSerie}
                    onChange={(e) =>
                      setMaquinariaForm({ ...maquinariaForm, numeroSerie: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Patente</Label>
                  <Input
                    placeholder="ABC123"
                    value={maquinariaForm.patente}
                    onChange={(e) =>
                      setMaquinariaForm({ ...maquinariaForm, patente: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Año Fabricación</Label>
                  <Input
                    type="number"
                    placeholder="2020"
                    value={maquinariaForm.anioFabricacion}
                    onChange={(e) =>
                      setMaquinariaForm({ ...maquinariaForm, anioFabricacion: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Horas Motor</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={maquinariaForm.horasMotor}
                    onChange={(e) =>
                      setMaquinariaForm({ ...maquinariaForm, horasMotor: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Capacidad</Label>
                  <Input
                    placeholder="180 HP"
                    value={maquinariaForm.capacidad}
                    onChange={(e) =>
                      setMaquinariaForm({ ...maquinariaForm, capacidad: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Adquisición (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="100000"
                    value={maquinariaForm.valorAdquisicion}
                    onChange={(e) =>
                      setMaquinariaForm({ ...maquinariaForm, valorAdquisicion: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha Adquisición</Label>
                  <Input
                    type="date"
                    value={maquinariaForm.fechaAdquisicion}
                    onChange={(e) =>
                      setMaquinariaForm({ ...maquinariaForm, fechaAdquisicion: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Intervalo Mantenimiento (horas)</Label>
                <Input
                  type="number"
                  step="1"
                  placeholder="250"
                  value={maquinariaForm.intervaloMantenimiento}
                  onChange={(e) =>
                    setMaquinariaForm({
                      ...maquinariaForm,
                      intervaloMantenimiento: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-gray-500">
                  Sistema creará alertas automáticas cada X horas
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMaquinariaDialogOpen(false);
                  setIsEditing(false);
                  setSelectedMaquinaria(null);
                  resetMaquinariaForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600" disabled={actionLoading}>
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {isEditing ? "Actualizar" : "Crear"} Maquinaria
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Dialog: Nueva Orden de Taller */}
      <Dialog open={ordenDialogOpen} onOpenChange={setOrdenDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateOrden}>
            <DialogHeader>
              <DialogTitle>Nueva Orden de Taller</DialogTitle>
              <DialogDescription>
                Registra una reparación o mantenimiento en el taller
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Maquinaria *</Label>
                <Select
                  value={ordenForm.maquinariaId}
                  onValueChange={(value) =>
                    setOrdenForm({ ...ordenForm, maquinariaId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una maquinaria" />
                  </SelectTrigger>
                  <SelectContent>
                    {maquinarias.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.codigo} - {m.tipo} - {m.marca} {m.modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={ordenForm.tipo}
                    onValueChange={(value) => setOrdenForm({ ...ordenForm, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reparación">Reparación</SelectItem>
                      <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="Inspección">Inspección</SelectItem>
                      <SelectItem value="Modificación">Modificación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select
                    value={ordenForm.categoria}
                    onValueChange={(value) => setOrdenForm({ ...ordenForm, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Motor">Motor</SelectItem>
                      <SelectItem value="Transmisión">Transmisión</SelectItem>
                      <SelectItem value="Hidráulico">Hidráulico</SelectItem>
                      <SelectItem value="Eléctrico">Eléctrico</SelectItem>
                      <SelectItem value="Chapa">Chapa y Pintura</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prioridad *</Label>
                <Select
                  value={ordenForm.prioridad}
                  onValueChange={(value) => setOrdenForm({ ...ordenForm, prioridad: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descripción de la Falla *</Label>
                <Textarea
                  placeholder="Describe el problema detectado..."
                  value={ordenForm.descripcionFalla}
                  onChange={(e) =>
                    setOrdenForm({ ...ordenForm, descripcionFalla: e.target.value })
                  }
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mecánico Asignado</Label>
                  <Input
                    placeholder="Nombre del mecánico"
                    value={ordenForm.mecanicoAsignado}
                    onChange={(e) =>
                      setOrdenForm({ ...ordenForm, mecanicoAsignado: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha Estimada</Label>
                  <Input
                    type="date"
                    value={ordenForm.fechaEstimada}
                    onChange={(e) =>
                      setOrdenForm({ ...ordenForm, fechaEstimada: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOrdenDialogOpen(false);
                  resetOrdenForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600" disabled={actionLoading}>
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Crear Orden
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Agregar Repuesto */}
      <Dialog open={repuestoDialogOpen} onOpenChange={setRepuestoDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddRepuesto}>
            <DialogHeader>
              <DialogTitle>Agregar Repuesto</DialogTitle>
              <DialogDescription>
                Orden: {selectedOrden?.numeroOrden}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    placeholder="REP-001"
                    value={repuestoForm.codigo}
                    onChange={(e) =>
                      setRepuestoForm({ ...repuestoForm, codigo: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input
                    placeholder="Original"
                    value={repuestoForm.marca}
                    onChange={(e) =>
                      setRepuestoForm({ ...repuestoForm, marca: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción *</Label>
                <Input
                  placeholder="Filtro de aceite"
                  value={repuestoForm.descripcion}
                  onChange={(e) =>
                    setRepuestoForm({ ...repuestoForm, descripcion: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad *</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={repuestoForm.cantidad}
                    onChange={(e) =>
                      setRepuestoForm({ ...repuestoForm, cantidad: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Precio Unitario (USD) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="50.00"
                    value={repuestoForm.precioUnitario}
                    onChange={(e) =>
                      setRepuestoForm({ ...repuestoForm, precioUnitario: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Proveedor</Label>
                <Input
                  placeholder="Casa de repuestos"
                  value={repuestoForm.proveedor}
                  onChange={(e) =>
                    setRepuestoForm({ ...repuestoForm, proveedor: e.target.value })
                  }
                />
              </div>

              {repuestoForm.cantidad && repuestoForm.precioUnitario && (
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Total:</p>
                  <p className="text-2xl font-bold text-blue-700">
                    $
                    {(
                      parseFloat(repuestoForm.cantidad) *
                      parseFloat(repuestoForm.precioUnitario)
                    ).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRepuestoDialogOpen(false);
                  resetRepuestoForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600" disabled={actionLoading}>
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Agregar Repuesto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Agregar Mano de Obra */}
      <Dialog open={manoObraDialogOpen} onOpenChange={setManoObraDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddManoObra}>
            <DialogHeader>
              <DialogTitle>Agregar Mano de Obra</DialogTitle>
              <DialogDescription>
                Orden: {selectedOrden?.numeroOrden}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mecánico *</Label>
                  <Input
                    placeholder="Nombre del mecánico"
                    value={manoObraForm.mecanico}
                    onChange={(e) =>
                      setManoObraForm({ ...manoObraForm, mecanico: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Especialidad</Label>
                  <Select
                    value={manoObraForm.especialidad}
                    onValueChange={(value) =>
                      setManoObraForm({ ...manoObraForm, especialidad: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mecánica General">Mecánica General</SelectItem>
                      <SelectItem value="Motor">Motor</SelectItem>
                      <SelectItem value="Hidráulica">Hidráulica</SelectItem>
                      <SelectItem value="Eléctrica">Eléctrica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción del Trabajo *</Label>
                <Textarea
                  placeholder="Describe el trabajo realizado..."
                  value={manoObraForm.descripcion}
                  onChange={(e) =>
                    setManoObraForm({ ...manoObraForm, descripcion: e.target.value })
                  }
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Inicio *</Label>
                  <Input
                    type="datetime-local"
                    value={manoObraForm.fechaInicio}
                    onChange={(e) =>
                      setManoObraForm({ ...manoObraForm, fechaInicio: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha Fin</Label>
                  <Input
                    type="datetime-local"
                    value={manoObraForm.fechaFin}
                    onChange={(e) =>
                      setManoObraForm({ ...manoObraForm, fechaFin: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horas Trabajadas *</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="8"
                    value={manoObraForm.horas}
                    onChange={(e) =>
                      setManoObraForm({ ...manoObraForm, horas: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tarifa por Hora (USD) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="25.00"
                    value={manoObraForm.tarifaHora}
                    onChange={(e) =>
                      setManoObraForm({ ...manoObraForm, tarifaHora: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {manoObraForm.horas && manoObraForm.tarifaHora && (
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Total Mano de Obra:</p>
                  <p className="text-2xl font-bold text-green-700">
                    $
                    {(
                      parseFloat(manoObraForm.horas) * parseFloat(manoObraForm.tarifaHora)
                    ).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setManoObraDialogOpen(false);
                  resetManoObraForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600" disabled={actionLoading}>
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Agregar Mano de Obra
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nueva Alerta */}
      <Dialog open={alertaDialogOpen} onOpenChange={setAlertaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateAlerta}>
            <DialogHeader>
              <DialogTitle>Nueva Alerta de Mantenimiento</DialogTitle>
              <DialogDescription>
                Maquinaria: {selectedMaquinaria?.codigo}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={alertaForm.tipo}
                    onValueChange={(value) => setAlertaForm({ ...alertaForm, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HorasMotor">Por Horas Motor</SelectItem>
                      <SelectItem value="FechaVencimiento">Por Fecha</SelectItem>
                      <SelectItem value="Predictivo">Predictivo (Sensor)</SelectItem>
                      <SelectItem value="Manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select
                    value={alertaForm.categoria}
                    onValueChange={(value) =>
                      setAlertaForm({ ...alertaForm, categoria: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aceite">Cambio de Aceite</SelectItem>
                      <SelectItem value="Filtros">Filtros</SelectItem>
                      <SelectItem value="Correas">Correas</SelectItem>
                      <SelectItem value="Neumáticos">Neumáticos</SelectItem>
                      <SelectItem value="Hidráulico">Sistema Hidráulico</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prioridad *</Label>
                <Select
                  value={alertaForm.prioridad}
                  onValueChange={(value) => setAlertaForm({ ...alertaForm, prioridad: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Crítica">Crítica</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  placeholder="Ej: Cambio de aceite programado"
                  value={alertaForm.titulo}
                  onChange={(e) => setAlertaForm({ ...alertaForm, titulo: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción *</Label>
                <Textarea
                  placeholder="Describe la alerta..."
                  value={alertaForm.descripcion}
                  onChange={(e) =>
                    setAlertaForm({ ...alertaForm, descripcion: e.target.value })
                  }
                  rows={3}
                  required
                />
              </div>

              {alertaForm.tipo === "HorasMotor" && (
                <div className="space-y-2">
                  <Label>Horas Motor para Alerta</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ej: 500"
                    value={alertaForm.horasMotorAlerta}
                    onChange={(e) =>
                      setAlertaForm({ ...alertaForm, horasMotorAlerta: e.target.value })
                    }
                  />
                  {selectedMaquinaria && (
                    <p className="text-xs text-gray-500">
                      Horas actuales: {selectedMaquinaria.horasMotor.toFixed(1)}
                    </p>
                  )}
                </div>
              )}

              {alertaForm.tipo === "FechaVencimiento" && (
                <div className="space-y-2">
                  <Label>Fecha de Alerta</Label>
                  <Input
                    type="date"
                    value={alertaForm.fechaAlerta}
                    onChange={(e) =>
                      setAlertaForm({ ...alertaForm, fechaAlerta: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAlertaDialogOpen(false);
                  resetAlertaForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-600" disabled={actionLoading}>
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Crear Alerta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Sensor */}
      <Dialog open={sensorDialogOpen} onOpenChange={setSensorDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateSensor}>
            <DialogHeader>
              <DialogTitle>Registrar Lectura de Sensor</DialogTitle>
              <DialogDescription>
                Maquinaria: {selectedMaquinaria?.codigo}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código Sensor *</Label>
                  <Input
                    placeholder="TEMP-MOT-01"
                    value={sensorForm.codigoSensor}
                    onChange={(e) =>
                      setSensorForm({ ...sensorForm, codigoSensor: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Sensor *</Label>
                  <Select
                    value={sensorForm.tipoSensor}
                    onValueChange={(value) =>
                      setSensorForm({ ...sensorForm, tipoSensor: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Temperatura">Temperatura</SelectItem>
                      <SelectItem value="Vibración">Vibración</SelectItem>
                      <SelectItem value="Presión">Presión</SelectItem>
                      <SelectItem value="Aceite">Calidad de Aceite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ubicación *</Label>
                <Select
                  value={sensorForm.ubicacion}
                  onValueChange={(value) =>
                    setSensorForm({ ...sensorForm, ubicacion: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Motor">Motor</SelectItem>
                    <SelectItem value="Transmisión">Transmisión</SelectItem>
                    <SelectItem value="Hidráulico">Sistema Hidráulico</SelectItem>
                    <SelectItem value="Frenos">Frenos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Valor Actual *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="85"
                    value={sensorForm.valorActual}
                    onChange={(e) =>
                      setSensorForm({ ...sensorForm, valorActual: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor Mínimo</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={sensorForm.valorMinimo}
                    onChange={(e) =>
                      setSensorForm({ ...sensorForm, valorMinimo: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor Máximo</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="100"
                    value={sensorForm.valorMaximo}
                    onChange={(e) =>
                      setSensorForm({ ...sensorForm, valorMaximo: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Umbral Alerta *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="90"
                    value={sensorForm.umbralAlerta}
                    onChange={(e) =>
                      setSensorForm({ ...sensorForm, umbralAlerta: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Umbral Crítico *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="95"
                    value={sensorForm.umbralCritico}
                    onChange={(e) =>
                      setSensorForm({ ...sensorForm, umbralCritico: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unidad *</Label>
                  <Select
                    value={sensorForm.unidad}
                    onValueChange={(value) => setSensorForm({ ...sensorForm, unidad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="°C">°C (Temperatura)</SelectItem>
                      <SelectItem value="Hz">Hz (Vibración)</SelectItem>
                      <SelectItem value="PSI">PSI (Presión)</SelectItem>
                      <SelectItem value="ppm">ppm (Partículas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sensorForm.valorActual && sensorForm.umbralCritico && (
                <div
                  className={`p-3 rounded ${
                    parseFloat(sensorForm.valorActual) >= parseFloat(sensorForm.umbralCritico)
                      ? "bg-red-50 border border-red-200"
                      : parseFloat(sensorForm.valorActual) >= parseFloat(sensorForm.umbralAlerta)
                      ? "bg-yellow-50 border border-yellow-200"
                      : "bg-green-50 border border-green-200"
                  }`}
                >
                  <p className="text-sm font-medium inline-flex items-center gap-1">
                    Estado:{" "}
                    {parseFloat(sensorForm.valorActual) >= parseFloat(sensorForm.umbralCritico)
                      ? <span className="inline-flex items-center gap-1 text-red-600"><Icon name="alert" size={14} /> CRÍTICO</span>
                      : parseFloat(sensorForm.valorActual) >= parseFloat(sensorForm.umbralAlerta)
                      ? <span className="inline-flex items-center gap-1 text-yellow-600"><Icon name="alert" size={14} /> ALERTA</span>
                      : <span className="inline-flex items-center gap-1 text-green-600"><Icon name="check" size={14} /> NORMAL</span>}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSensorDialogOpen(false);
                  resetSensorForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-purple-600" disabled={actionLoading}>
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Registrar Lectura
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Dialog: Nuevo Operador */}
      <Dialog open={operadorDialogOpen} onOpenChange={setOperadorDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateOperador}>
            <DialogHeader>
              <DialogTitle>Nuevo Operador</DialogTitle>
              <DialogDescription>
                Registra un operador de maquinaria
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Juan"
                    value={operadorForm.nombre}
                    onChange={(e) =>
                      setOperadorForm({ ...operadorForm, nombre: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Apellido *</Label>
                  <Input
                    placeholder="Pérez"
                    value={operadorForm.apellido}
                    onChange={(e) =>
                      setOperadorForm({ ...operadorForm, apellido: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Documento *</Label>
                  <Input
                    placeholder="12345678"
                    value={operadorForm.documento}
                    onChange={(e) =>
                      setOperadorForm({ ...operadorForm, documento: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Ingreso *</Label>
                  <Input
                    type="date"
                    value={operadorForm.fechaIngreso}
                    onChange={(e) =>
                      setOperadorForm({ ...operadorForm, fechaIngreso: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    placeholder="+598 99 123 456"
                    value={operadorForm.telefono}
                    onChange={(e) =>
                      setOperadorForm({ ...operadorForm, telefono: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="operador@email.com"
                    value={operadorForm.email}
                    onChange={(e) =>
                      setOperadorForm({ ...operadorForm, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Licencia de Conducir</Label>
                  <Input
                    placeholder="123456"
                    value={operadorForm.licenciaConducir}
                    onChange={(e) =>
                      setOperadorForm({ ...operadorForm, licenciaConducir: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={operadorForm.categoriaLicencia}
                    onValueChange={(value) =>
                      setOperadorForm({ ...operadorForm, categoriaLicencia: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="G">G (Maquinaria)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Vencimiento Licencia</Label>
                  <Input
                    type="date"
                    value={operadorForm.vencimientoLicencia}
                    onChange={(e) =>
                      setOperadorForm({
                        ...operadorForm,
                        vencimientoLicencia: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Especialidades</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["Tractor", "Cosechadora", "Pulverizadora", "Sembradora", "Tolva"].map(
                    (esp) => (
                      <label key={esp} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={operadorForm.especialidades.includes(esp)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setOperadorForm({
                                ...operadorForm,
                                especialidades: [...operadorForm.especialidades, esp],
                              });
                            } else {
                              setOperadorForm({
                                ...operadorForm,
                                especialidades: operadorForm.especialidades.filter(
                                  (s) => s !== esp
                                ),
                              });
                            }
                          }}
                        />
                        <span className="text-sm">{esp}</span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOperadorDialogOpen(false);
                  resetOperadorForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600" disabled={actionLoading}>
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Crear Operador
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nueva Evaluación */}
      <Dialog open={evaluacionDialogOpen} onOpenChange={setEvaluacionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateEvaluacion}>
            <DialogHeader>
              <DialogTitle>Nueva Evaluación de Operador</DialogTitle>
              <DialogDescription>
                Registra el desempeño del operador durante la jornada
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Operador *</Label>
                  <Select
                    value={evaluacionForm.operador}
                    onValueChange={(value) =>
                      setEvaluacionForm({ ...evaluacionForm, operador: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operadores.map((op) => (
                        <SelectItem
                          key={op.id}
                          value={`${op.nombre} ${op.apellido}`}
                        >
                          {op.nombre} {op.apellido} (Score: {op.scorePromedio.toFixed(1)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Maquinaria *</Label>
                  <Select
                    value={evaluacionForm.maquinariaId}
                    onValueChange={(value) =>
                      setEvaluacionForm({ ...evaluacionForm, maquinariaId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona maquinaria" />
                    </SelectTrigger>
                    <SelectContent>
                      {maquinarias.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.codigo} - {m.tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duración Jornada (horas) *</Label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="8"
                  value={evaluacionForm.duracionJornada}
                  onChange={(e) =>
                    setEvaluacionForm({ ...evaluacionForm, duracionJornada: e.target.value })
                  }
                  required
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 inline-flex items-center gap-2"><Icon name="chart" size={16} /> Métricas de Seguridad</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Velocidad Promedio (km/h)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="15"
                      value={evaluacionForm.velocidadPromedio}
                      onChange={(e) =>
                        setEvaluacionForm({
                          ...evaluacionForm,
                          velocidadPromedio: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Velocidad Máxima (km/h)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="25"
                      value={evaluacionForm.velocidadMaxima}
                      onChange={(e) =>
                        setEvaluacionForm({
                          ...evaluacionForm,
                          velocidadMaxima: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frenados Bruscos</Label>
                    <Input
                      type="number"
                      min="0"
                      value={evaluacionForm.frenadosBruscos}
                      onChange={(e) =>
                        setEvaluacionForm({
                          ...evaluacionForm,
                          frenadosBruscos: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Aceleraciones Bruscas</Label>
                    <Input
                      type="number"
                      min="0"
                      value={evaluacionForm.aceleracionesBruscas}
                      onChange={(e) =>
                        setEvaluacionForm({
                          ...evaluacionForm,
                          aceleracionesBruscas: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Giros Bruscos</Label>
                    <Input
                      type="number"
                      min="0"
                      value={evaluacionForm.girosBruscos}
                      onChange={(e) =>
                        setEvaluacionForm({
                          ...evaluacionForm,
                          girosBruscos: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Excesos de Velocidad</Label>
                    <Input
                      type="number"
                      min="0"
                      value={evaluacionForm.excesosVelocidad}
                      onChange={(e) =>
                        setEvaluacionForm({
                          ...evaluacionForm,
                          excesosVelocidad: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 inline-flex items-center gap-2"><Icon name="bolt" size={16} /> Métricas de Eficiencia</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tiempo Trabajando (hs)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="7"
                      value={evaluacionForm.tiempoTrabajando}
                      onChange={(e) =>
                        setEvaluacionForm({
                          ...evaluacionForm,
                          tiempoTrabajando: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tiempo Ralentí (hs)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="1"
                      value={evaluacionForm.tiempoRalenti}
                      onChange={(e) =>
                        setEvaluacionForm({
                          ...evaluacionForm,
                          tiempoRalenti: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Consumo Combustible (L)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="80"
                      value={evaluacionForm.consumoCombustible}
                      onChange={(e) =>
                        setEvaluacionForm({
                          ...evaluacionForm,
                          consumoCombustible: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 inline-flex items-center gap-2"><Icon name="wrench" size={16} /> Cuidado de Maquinaria</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={evaluacionForm.usoAdecuado}
                      onChange={(e) =>
                        setEvaluacionForm({
                          ...evaluacionForm,
                          usoAdecuado: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm">Uso adecuado de la maquinaria</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={evaluacionForm.mantenimientoDiario}
                      onChange={(e) =>
                        setEvaluacionForm({
                          ...evaluacionForm,
                          mantenimientoDiario: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm">Realizó verificación diaria</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={evaluacionForm.reporteProblemas}
                      onChange={(e) =>
                        setEvaluacionForm({
                          ...evaluacionForm,
                          reporteProblemas: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm">Reportó problemas detectados</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Observaciones adicionales..."
                  value={evaluacionForm.observaciones}
                  onChange={(e) =>
                    setEvaluacionForm({ ...evaluacionForm, observaciones: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEvaluacionDialogOpen(false);
                  resetEvaluacionForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600" disabled={actionLoading}>
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Crear Evaluación
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ver Detalles de Maquinaria */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Maquinaria</DialogTitle>
          </DialogHeader>
          {selectedMaquinaria && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Código</Label>
                  <p className="font-medium text-lg">{selectedMaquinaria.codigo}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Estado</Label>
                  <Badge
                    className={
                      selectedMaquinaria.estado === "Operativo"
                        ? "bg-green-500"
                        : selectedMaquinaria.estado === "Mantenimiento"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }
                  >
                    {selectedMaquinaria.estado}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Tipo</Label>
                  <p className="font-medium">{selectedMaquinaria.tipo}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Marca</Label>
                  <p className="font-medium">{selectedMaquinaria.marca}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Modelo</Label>
                  <p className="font-medium">{selectedMaquinaria.modelo}</p>
                </div>
              </div>

              {selectedMaquinaria.numeroSerie && (
                <div>
                  <Label className="text-sm text-gray-600">Número de Serie</Label>
                  <p className="font-medium">{selectedMaquinaria.numeroSerie}</p>
                </div>
              )}

              {selectedMaquinaria.patente && (
                <div>
                  <Label className="text-sm text-gray-600">Patente</Label>
                  <p className="font-medium">{selectedMaquinaria.patente}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Horas Motor</Label>
                  <p className="font-medium text-2xl text-blue-600">
                    {selectedMaquinaria.horasMotor.toFixed(1)} hs
                  </p>
                </div>
                {selectedMaquinaria.capacidad && (
                  <div>
                    <Label className="text-sm text-gray-600">Capacidad</Label>
                    <p className="font-medium">{selectedMaquinaria.capacidad}</p>
                  </div>
                )}
              </div>

              {selectedMaquinaria.valorAdquisicion && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Valor Adquisición</Label>
                    <p className="font-medium">
                      ${selectedMaquinaria.valorAdquisicion.toFixed(2)}
                    </p>
                  </div>
                  {selectedMaquinaria.fechaAdquisicion && (
                    <div>
                      <Label className="text-sm text-gray-600">Fecha Adquisición</Label>
                      <p className="font-medium">
                        {formatDate(selectedMaquinaria.fechaAdquisicion)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedMaquinaria._count && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedMaquinaria._count.mantenimientos}
                    </p>
                    <p className="text-sm text-gray-600">Mantenimientos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {selectedMaquinaria._count.alertas}
                    </p>
                    <p className="text-sm text-gray-600">Alertas Activas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedMaquinaria._count.ordenesTaller}
                    </p>
                    <p className="text-sm text-gray-600">Órdenes de Taller</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. ¿Estás seguro de eliminar esta maquinaria?
            </DialogDescription>
          </DialogHeader>
          {selectedMaquinaria && (
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <p className="font-bold">{selectedMaquinaria.codigo}</p>
              <p className="text-sm text-gray-600">
                {selectedMaquinaria.tipo} - {selectedMaquinaria.marca}{" "}
                {selectedMaquinaria.modelo}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedMaquinaria(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteMaquinaria}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalle de Orden de Taller */}
      {selectedOrden && (
        <Dialog
          open={!!selectedOrden}
          onOpenChange={(open) => !open && setSelectedOrden(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Orden de Taller: {selectedOrden.numeroOrden}</span>
                <Badge
                  className={
                    selectedOrden.prioridad === "Urgente"
                      ? "bg-red-600"
                      : selectedOrden.prioridad === "Alta"
                      ? "bg-orange-600"
                      : "bg-blue-600"
                  }
                >
                  {selectedOrden.prioridad}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                {selectedOrden.maquinaria?.codigo} - {selectedOrden.categoria}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Estado y Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Estado</Label>
                  <Badge
                    className={
                      selectedOrden.estado === "Completada"
                        ? "bg-green-600"
                        : selectedOrden.estado === "En Proceso"
                        ? "bg-blue-600"
                        : "bg-gray-600"
                    }
                  >
                    {selectedOrden.estado}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Fecha Ingreso</Label>
                  <p className="font-medium">{formatDate(selectedOrden.fechaIngreso)}</p>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <Label className="text-sm text-gray-600">Descripción de la Falla</Label>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {selectedOrden.descripcionFalla}
                </p>
              </div>

              {/* Costos */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600">Repuestos</p>
                    <p className="text-xl font-bold text-blue-600">
                      ${selectedOrden.costoRepuestos.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600">Mano de Obra</p>
                    <p className="text-xl font-bold text-green-600">
                      ${selectedOrden.costoManoObra.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600">Otros Costos</p>
                    <p className="text-xl font-bold text-orange-600">
                      ${selectedOrden.otrosCostos.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-purple-700">
                      ${selectedOrden.costoTotal.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    setRepuestoDialogOpen(true);
                  }}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Repuesto
                </Button>
                <Button
                  onClick={() => {
                    setManoObraDialogOpen(true);
                  }}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Mano de Obra
                </Button>
                {selectedOrden.estado !== "Completada" && (
                  <Button
                    onClick={() => handleUpdateOrden("Completada")}
                    className="bg-green-600 ml-auto"
                    disabled={actionLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar Completada
                  </Button>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedOrden(null)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}