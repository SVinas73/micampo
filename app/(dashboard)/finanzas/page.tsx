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
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
  Users,
  Briefcase,
  BarChart3,
  PieChart,
  Calculator,
  CreditCard,
  Wallet,
  Receipt,
  Plus,
  Search,
  Eye,
  Trash2,
  Filter,
  RefreshCw,
  Edit,
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Icon } from "@/components/mc";

type Comprobante = {
  id: string;
  tipo: string;
  numero: string;
  fecha: string;
  razonSocial: string;
  rut?: string;
  subtotal?: number;
  iva?: number;
  total: number;
  moneda: string;
  estado: string;
  procesadoOCR: boolean;
  confianzaOCR?: number;
  observaciones?: string;
};

type ActivoFijo = {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  valorAdquisicion: number;
  valorActual: number;
  depreciacionAcumulada: number;
  estado: string;
  fechaAdquisicion: string;
  marca?: string;
  modelo?: string;
  observaciones?: string;
};

type FacturaEmitida = {
  id: string;
  numero: string;
  fecha: string;
  clienteNombre: string;
  total: number;
  saldo: number;
  estadoCobro: string;
  moneda: string;
};

type CuentaPorPagar = {
  id: string;
  proveedor: string;
  concepto: string;
  fechaVencimiento: string;
  monto: number;
  saldo: number;
  estadoPago: string;
  moneda: string;
};

type Empleado = {
  id: string;
  legajo: string;
  nombre: string;
  apellido: string;
  cargo: string;
  area: string;
  salarioBase: number;
  estado: string;
  fechaIngreso: string;
  tipoContrato: string;
};

type TipoCambio = {
  id: string;
  fecha: string;
  monedaDestino: string;
  promedio: number;
};

type DashboardData = {
  resumenMesActual: {
    ingresos: number;
    gastos: number;
    margen: number;
    porcentajeMargen: number;
  };
  margenesPorLote: any[];
  costosPorCategoria: any[];
  alertas: {
    cuentasVencidas: number;
    montoVencido: number;
    cuentasPorCobrar: number;
    montoPorCobrar: number;
  };
};

export default function FinanzasPage() {
  // Estados principales
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [activosFijos, setActivosFijos] = useState<ActivoFijo[]>([]);
  const [facturasEmitidas, setFacturasEmitidas] = useState<FacturaEmitida[]>([]);
  const [cuentasPorPagar, setCuentasPorPagar] = useState<CuentaPorPagar[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [tiposCambio, setTiposCambio] = useState<TipoCambio[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [contratistas, setContratistas] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialogs principales
  const [comprobanteDialogOpen, setComprobanteDialogOpen] = useState(false);
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [activoDialogOpen, setActivoDialogOpen] = useState(false);
  const [facturaDialogOpen, setFacturaDialogOpen] = useState(false);
  const [cuentaDialogOpen, setCuentaDialogOpen] = useState(false);
  const [empleadoDialogOpen, setEmpleadoDialogOpen] = useState(false);
  const [tipoCambioDialogOpen, setTipoCambioDialogOpen] = useState(false);
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [rolDialogOpen, setRolDialogOpen] = useState(false);
  const [contratistaDialogOpen, setContratistaDialogOpen] = useState(false);
  const [trabajoDialogOpen, setTrabajoDialogOpen] = useState(false);

  // Dialogs adicionales
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [horasDialogOpen, setHorasDialogOpen] = useState(false);
  const [pagarSalarioDialogOpen, setPagarSalarioDialogOpen] = useState(false);
  const [asignarUsuarioDialogOpen, setAsignarUsuarioDialogOpen] = useState(false);
  const [verTrabajosDialogOpen, setVerTrabajosDialogOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [sortBy, setSortBy] = useState<"fecha" | "monto" | "nombre">("fecha");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Loading states
  const [actionLoading, setActionLoading] = useState(false);

  // Datos adicionales
  const [trabajosContratista, setTrabajosContratista] = useState<any[]>([]);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Formularios
  const [comprobanteForm, setComprobanteForm] = useState({
    tipo: "Factura",
    numero: "",
    fecha: "",
    razonSocial: "",
    rut: "",
    moneda: "USD",
    subtotal: "",
    iva: "",
    total: "",
    observaciones: "",
  });

  const [activoForm, setActivoForm] = useState({
    codigo: "",
    nombre: "",
    tipo: "Maquinaria",
    valorAdquisicion: "",
    fechaAdquisicion: "",
    vidaUtilAnios: "",
    valorResidual: "",
    marca: "",
    modelo: "",
    observaciones: "",
  });

  const [facturaForm, setFacturaForm] = useState({
    numero: "",
    fecha: "",
    fechaVencimiento: "",
    clienteNombre: "",
    clienteRut: "",
    clienteEmail: "",
    moneda: "USD",
    subtotal: "",
    iva: "",
    total: "",
    observaciones: "",
  });

  const [cuentaForm, setCuentaForm] = useState({
    proveedor: "",
    proveedorRut: "",
    concepto: "",
    fechaEmision: "",
    fechaVencimiento: "",
    monto: "",
    moneda: "USD",
    observaciones: "",
  });

  const [empleadoForm, setEmpleadoForm] = useState({
    legajo: "",
    nombre: "",
    apellido: "",
    documento: "",
    cargo: "",
    area: "Agricultura",
    fechaIngreso: "",
    tipoContrato: "Mensual",
    salarioBase: "",
    moneda: "USD",
    email: "",
    telefono: "",
  });

  const [tipoCambioForm, setTipoCambioForm] = useState({
    monedaDestino: "UYU",
    compra: "",
    venta: "",
  });

  const [pagoForm, setPagoForm] = useState({
    monto: "",
    metodoPago: "Transferencia",
    referencia: "",
    observaciones: "",
  });

  const [rolForm, setRolForm] = useState({
    nombre: "Agronomo",
    descripcion: "",
    permisos: {
      finanzas: { ver: true, editar: false },
      agricultura: { ver: true, editar: true },
      ganaderia: { ver: true, editar: true },
      logistica: { ver: true, editar: false },
    },
  });

  const [contratistaForm, setContratistaForm] = useState({
    nombre: "",
    empresa: "",
    rut: "",
    email: "",
    telefono: "",
    especialidad: "Siembra",
  });

  const [trabajoForm, setTrabajoForm] = useState({
    titulo: "",
    descripcion: "",
    tipo: "Siembra",
    loteNombre: "",
    hectareas: "",
    monto: "",
  });

  const [horasForm, setHorasForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    horasTrabajadas: "",
    tipoTarea: "Campo",
    descripcion: "",
  });

  const [pagarSalarioForm, setPagarSalarioForm] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    horasTrabajadas: "",
    horasExtra: "",
    bonificaciones: "",
    deducciones: "",
    metodoPago: "Transferencia",
    observaciones: "",
  });

  const [asignarUsuarioForm, setAsignarUsuarioForm] = useState({
    usuarioEmail: "",
    mensaje: "",
  });

  // ============================================
  // FETCH DATA
  // ============================================

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado, filterTipo, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        comprobantesRes,
        activosRes,
        facturasRes,
        cuentasRes,
        empleadosRes,
        tiposRes,
        dashboardRes,
        rolesRes,
        contratistasRes,
      ] = await Promise.all([
        fetch("/api/comprobantes"),
        fetch("/api/activos-fijos"),
        fetch("/api/facturas-emitidas"),
        fetch("/api/cuentas-por-pagar"),
        fetch("/api/empleados"),
        fetch("/api/tipos-cambio"),
        fetch("/api/margenes-brutos/dashboard"),
        fetch("/api/roles"),
        fetch("/api/contratistas"),
      ]);

      if (comprobantesRes.ok) setComprobantes(await comprobantesRes.json());
      if (activosRes.ok) setActivosFijos(await activosRes.json());
      if (facturasRes.ok) setFacturasEmitidas(await facturasRes.json());
      if (cuentasRes.ok) setCuentasPorPagar(await cuentasRes.json());
      if (empleadosRes.ok) setEmpleados(await empleadosRes.json());
      if (tiposRes.ok) setTiposCambio(await tiposRes.json());
      if (dashboardRes.ok) setDashboardData(await dashboardRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (contratistasRes.ok) setContratistas(await contratistasRes.json());
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNCIONES DE FILTRADO Y PAGINACIÓN
  // ============================================

  const filterAndSort = <T extends any>(
    items: T[],
    searchFields: (keyof T)[],
    estadoField?: keyof T,
    tipoField?: keyof T
  ): T[] => {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        searchFields.some((field) =>
          String(item[field]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (filterEstado !== "Todos" && estadoField) {
      filtered = filtered.filter((item) => item[estadoField] === filterEstado);
    }

    if (filterTipo !== "Todos" && tipoField) {
      filtered = filtered.filter((item) => item[tipoField] === filterTipo);
    }

    filtered.sort((a, b) => {
      let aVal = a[sortBy as keyof T];
      let bVal = b[sortBy as keyof T];

      if (sortBy === "fecha") {
        aVal = new Date(aVal as any).getTime() as any;
        bVal = new Date(bVal as any).getTime() as any;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const paginate = <T extends any>(items: T[]): T[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const totalPages = (items: any[]) => Math.ceil(items.length / itemsPerPage);

  // ============================================
  // HANDLERS: OCR
  // ============================================

  const handleOCRUpload = async () => {
    if (!ocrFile) return;

    try {
      setOcrLoading(true);
      const formData = new FormData();
      formData.append("file", ocrFile);

      const response = await fetch("/api/comprobantes/ocr", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setOcrResult(result.datos);

        if (result.datos) {
          setComprobanteForm({
            tipo: result.datos.tipo || "Factura",
            numero: result.datos.numero || "",
            fecha: result.datos.fecha || "",
            razonSocial: result.datos.razonSocial || "",
            rut: result.datos.rut || "",
            moneda: result.datos.moneda || "USD",
            subtotal: result.datos.subtotal?.toString() || "",
            iva: result.datos.iva?.toString() || "",
            total: result.datos.total?.toString() || "",
            observaciones: "",
          });
        }

        alert(`OCR procesado exitosamente. Confianza: ${result.confianza}%`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar OCR");
    } finally {
      setOcrLoading(false);
    }
  };

  // ============================================
  // HANDLERS: CREAR/ACTUALIZAR
  // ============================================

  const handleCreateComprobante = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const endpoint = isEditing ? `/api/comprobantes/${selectedItem.id}` : "/api/comprobantes";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...comprobanteForm,
          crearTransaccion: !isEditing,
        }),
      });

      if (response.ok) {
        setComprobanteDialogOpen(false);
        setOcrDialogOpen(false);
        setComprobanteForm({
          tipo: "Factura",
          numero: "",
          fecha: "",
          razonSocial: "",
          rut: "",
          moneda: "USD",
          subtotal: "",
          iva: "",
          total: "",
          observaciones: "",
        });
        setOcrResult(null);
        setIsEditing(false);
        setSelectedItem(null);
        fetchData();
        alert(isEditing ? "Comprobante actualizado" : "Comprobante creado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(isEditing ? "Error al actualizar" : "Error al crear comprobante");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateActivo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const endpoint = isEditing ? `/api/activos-fijos/${selectedItem.id}` : "/api/activos-fijos";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activoForm),
      });

      if (response.ok) {
        setActivoDialogOpen(false);
        setActivoForm({
          codigo: "",
          nombre: "",
          tipo: "Maquinaria",
          valorAdquisicion: "",
          fechaAdquisicion: "",
          vidaUtilAnios: "",
          valorResidual: "",
          marca: "",
          modelo: "",
          observaciones: "",
        });
        setIsEditing(false);
        setSelectedItem(null);
        fetchData();
        alert(isEditing ? "Activo actualizado" : "Activo creado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(isEditing ? "Error al actualizar" : "Error al crear activo");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const response = await fetch("/api/facturas-emitidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(facturaForm),
      });

      if (response.ok) {
        setFacturaDialogOpen(false);
        setFacturaForm({
          numero: "",
          fecha: "",
          fechaVencimiento: "",
          clienteNombre: "",
          clienteRut: "",
          clienteEmail: "",
          moneda: "USD",
          subtotal: "",
          iva: "",
          total: "",
          observaciones: "",
        });
        fetchData();
        alert("Factura creada");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear factura");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const response = await fetch("/api/cuentas-por-pagar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuentaForm),
      });

      if (response.ok) {
        setCuentaDialogOpen(false);
        setCuentaForm({
          proveedor: "",
          proveedorRut: "",
          concepto: "",
          fechaEmision: "",
          fechaVencimiento: "",
          monto: "",
          moneda: "USD",
          observaciones: "",
        });
        fetchData();
        alert("Cuenta creada");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear cuenta");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const endpoint = isEditing ? `/api/empleados/${selectedItem.id}` : "/api/empleados";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empleadoForm),
      });

      if (response.ok) {
        setEmpleadoDialogOpen(false);
        setEmpleadoForm({
          legajo: "",
          nombre: "",
          apellido: "",
          documento: "",
          cargo: "",
          area: "Agricultura",
          fechaIngreso: "",
          tipoContrato: "Mensual",
          salarioBase: "",
          moneda: "USD",
          email: "",
          telefono: "",
        });
        setIsEditing(false);
        setSelectedItem(null);
        fetchData();
        alert(isEditing ? "Empleado actualizado" : "Empleado creado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(isEditing ? "Error al actualizar" : "Error al crear empleado");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTipoCambio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const response = await fetch("/api/tipos-cambio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tipoCambioForm),
      });

      if (response.ok) {
        setTipoCambioDialogOpen(false);
        setTipoCambioForm({
          monedaDestino: "UYU",
          compra: "",
          venta: "",
        });
        fetchData();
        alert("Tipo de cambio registrado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar tipo de cambio");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRol = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const endpoint = isEditing ? `/api/roles/${selectedItem.id}` : "/api/roles";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rolForm,
          permisos: rolForm.permisos,
        }),
      });

      if (response.ok) {
        setRolDialogOpen(false);
        setRolForm({
          nombre: "Agronomo",
          descripcion: "",
          permisos: {
            finanzas: { ver: true, editar: false },
            agricultura: { ver: true, editar: true },
            ganaderia: { ver: true, editar: true },
            logistica: { ver: true, editar: false },
          },
        });
        setIsEditing(false);
        setSelectedItem(null);
        fetchData();
        alert(isEditing ? "Rol actualizado" : "Rol creado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(isEditing ? "Error al actualizar" : "Error al crear rol");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateContratista = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const endpoint = isEditing
        ? `/api/contratistas/${selectedItem.id}`
        : "/api/contratistas";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contratistaForm),
      });

      if (response.ok) {
        const nuevoContratista = await response.json();
        setContratistaDialogOpen(false);
        setContratistaForm({
          nombre: "",
          empresa: "",
          rut: "",
          email: "",
          telefono: "",
          especialidad: "Siembra",
        });
        setIsEditing(false);
        setSelectedItem(null);
        fetchData();
        if (!isEditing) {
          alert(`Contratista creado. Código de acceso: ${nuevoContratista.codigoAcceso}`);
        } else {
          alert("Contratista actualizado");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert(isEditing ? "Error al actualizar" : "Error al crear contratista");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTrabajo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/contratistas/${selectedItem.id}/trabajos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trabajoForm),
      });

      if (response.ok) {
        setTrabajoDialogOpen(false);
        setSelectedItem(null);
        setTrabajoForm({
          titulo: "",
          descripcion: "",
          tipo: "Siembra",
          loteNombre: "",
          hectareas: "",
          monto: "",
        });
        fetchData();
        alert("Trabajo asignado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al asignar trabajo");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setActionLoading(true);
      const endpoint =
        selectedItem.tipo === "factura"
          ? `/api/facturas-emitidas/${selectedItem.id}/pagos`
          : `/api/cuentas-por-pagar/${selectedItem.id}/pagos`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pagoForm,
          fecha: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setPagoDialogOpen(false);
        setSelectedItem(null);
        setPagoForm({
          monto: "",
          metodoPago: "Transferencia",
          referencia: "",
          observaciones: "",
        });
        fetchData();
        alert("Pago registrado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar pago");
    } finally {
      setActionLoading(false);
    }
  };

  const calcularDepreciacion = async () => {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    try {
      setActionLoading(true);
      const response = await fetch("/api/activos-fijos/depreciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, anio }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al calcular depreciación");
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // HANDLERS: VER DETALLES
  // ============================================

  const handleVerTrabajosContratista = async (contratistaId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/contratistas/${contratistaId}/trabajos`);
      if (response.ok) {
        const trabajos = await response.json();
        setTrabajosContratista(trabajos);
        setVerTrabajosDialogOpen(true);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar trabajos");
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // HANDLERS: EDITAR
  // ============================================

  const handleEditItem = (item: any, type: string) => {
    setSelectedItem({ ...item, type });
    setIsEditing(true);

    switch (type) {
      case "comprobante":
        setComprobanteForm({
          tipo: item.tipo,
          numero: item.numero,
          fecha: item.fecha.split("T")[0],
          razonSocial: item.razonSocial,
          rut: item.rut || "",
          moneda: item.moneda,
          subtotal: item.subtotal?.toString() || "",
          iva: item.iva?.toString() || "",
          total: item.total?.toString() || "",
          observaciones: item.observaciones || "",
        });
        setComprobanteDialogOpen(true);
        break;

      case "activo":
        setActivoForm({
          codigo: item.codigo,
          nombre: item.nombre,
          tipo: item.tipo,
          valorAdquisicion: item.valorAdquisicion?.toString() || "",
          fechaAdquisicion: item.fechaAdquisicion.split("T")[0],
          vidaUtilAnios: item.vidaUtilAnios?.toString() || "",
          valorResidual: item.valorResidual?.toString() || "",
          marca: item.marca || "",
          modelo: item.modelo || "",
          observaciones: item.observaciones || "",
        });
        setActivoDialogOpen(true);
        break;

      case "empleado":
        setEmpleadoForm({
          legajo: item.legajo,
          nombre: item.nombre,
          apellido: item.apellido,
          documento: item.documento || "",
          cargo: item.cargo,
          area: item.area,
          fechaIngreso: item.fechaIngreso.split("T")[0],
          tipoContrato: item.tipoContrato,
          salarioBase: item.salarioBase?.toString() || "",
          moneda: item.moneda || "USD",
          email: item.email || "",
          telefono: item.telefono || "",
        });
        setEmpleadoDialogOpen(true);
        break;

      case "rol":
        setRolForm({
          nombre: item.nombre,
          descripcion: item.descripcion || "",
          permisos: JSON.parse(item.permisos || "{}"),
        });
        setRolDialogOpen(true);
        break;

      case "contratista":
        setContratistaForm({
          nombre: item.nombre,
          empresa: item.empresa || "",
          rut: item.rut || "",
          email: item.email,
          telefono: item.telefono || "",
          especialidad: item.especialidad,
        });
        setContratistaDialogOpen(true);
        break;
    }
  };

  // ============================================
  // HANDLERS: ELIMINAR
  // ============================================

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      setActionLoading(true);
      const { type, id } = selectedItem;
      let endpoint = "";

      switch (type) {
        case "comprobante":
          endpoint = `/api/comprobantes/${id}`;
          break;
        case "activo":
          endpoint = `/api/activos-fijos/${id}`;
          break;
        case "empleado":
          endpoint = `/api/empleados/${id}`;
          break;
        case "rol":
          endpoint = `/api/roles/${id}`;
          break;
        case "contratista":
          endpoint = `/api/contratistas/${id}`;
          break;
        case "factura":
          endpoint = `/api/facturas-emitidas/${id}`;
          break;
        case "cuenta":
          endpoint = `/api/cuentas-por-pagar/${id}`;
          break;
      }

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeleteDialogOpen(false);
        setSelectedItem(null);
        fetchData();
        alert("Eliminado correctamente");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar");
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // HANDLERS: EMPLEADOS (Horas y Salarios)
  // ============================================

  const handleRegistrarHoras = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/empleados/${selectedItem.id}/horas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(horasForm),
      });

      if (response.ok) {
        setHorasDialogOpen(false);
        setHorasForm({
          fecha: new Date().toISOString().split("T")[0],
          horasTrabajadas: "",
          tipoTarea: "Campo",
          descripcion: "",
        });
        alert("Horas registradas");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar horas");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePagarSalario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/empleados/${selectedItem.id}/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pagarSalarioForm),
      });

      if (response.ok) {
        setPagarSalarioDialogOpen(false);
        setPagarSalarioForm({
          mes: new Date().getMonth() + 1,
          anio: new Date().getFullYear(),
          horasTrabajadas: "",
          horasExtra: "",
          bonificaciones: "",
          deducciones: "",
          metodoPago: "Transferencia",
          observaciones: "",
        });
        fetchData();
        alert("Pago registrado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar pago");
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // HANDLERS: ASIGNAR USUARIO A ROL
  // ============================================

  const handleAsignarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/roles/${selectedItem.id}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asignarUsuarioForm),
      });

      if (response.ok) {
        setAsignarUsuarioDialogOpen(false);
        setAsignarUsuarioForm({
          usuarioEmail: "",
          mensaje: "",
        });
        alert("Invitación enviada");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al enviar invitación");
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // HANDLERS: REPORTES Y EXPORTACIONES
  // ============================================

  const handleGenerarEstadoResultados = async () => {
    try {
      setActionLoading(true);
      const response = await fetch("/api/reportes/estado-resultados");
      if (response.ok) {
        const data = await response.json();
        const { generateEstadoResultadosPDF } = await import("@/lib/pdf-generator");
        generateEstadoResultadosPDF(data);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar reporte");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerarFlujoCaja = async () => {
    try {
      setActionLoading(true);
      const response = await fetch("/api/reportes/flujo-caja");
      if (response.ok) {
        const data = await response.json();
        const { generateFlujoCajaPDF } = await import("@/lib/pdf-generator");
        generateFlujoCajaPDF(data);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar reporte");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerarBalance = async () => {
    try {
      setActionLoading(true);
      const response = await fetch("/api/reportes/balance");
      if (response.ok) {
        const data = await response.json();
        const { generateBalancePDF } = await import("@/lib/pdf-generator");
        generateBalancePDF(data);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar reporte");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportarTransacciones = async () => {
    try {
      const { exportToExcel } = await import("@/lib/pdf-generator");
      exportToExcel(comprobantes, "transacciones");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al exportar");
    }
  };

  const handleExportarEmpleados = async () => {
    try {
      const { exportToExcel } = await import("@/lib/pdf-generator");
      exportToExcel(empleados, "empleados");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al exportar");
    }
  };

  const handleExportarActivos = async () => {
    try {
      const { exportToExcel } = await import("@/lib/pdf-generator");
      exportToExcel(activosFijos, "activos-fijos");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al exportar");
    }
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finanzas y Administración</h1>
          <p className="text-gray-600 mt-2">
            Sistema completo de gestión financiera con OCR, activos fijos y reportes profesionales
          </p>
        </div>
      </div>

      {/* KPIs Dashboard */}
      {dashboardData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Ingresos del Mes
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${dashboardData.resumenMesActual.ingresos.toFixed(0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Mes actual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Gastos del Mes
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${dashboardData.resumenMesActual.gastos.toFixed(0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Mes actual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Margen Bruto</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${dashboardData.resumenMesActual.margen.toFixed(0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData.resumenMesActual.porcentajeMargen.toFixed(1)}% de margen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Alertas Financieras
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {dashboardData.alertas.cuentasVencidas + dashboardData.alertas.cuentasPorCobrar}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                $
                {(
                  dashboardData.alertas.montoVencido + dashboardData.alertas.montoPorCobrar
                ).toFixed(0)}{" "}
                pendiente
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <Card className="bg-white border-2">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Búsqueda</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Estado</Label>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Pagado">Pagado</SelectItem>
                  <SelectItem value="Cobrado">Cobrado</SelectItem>
                  <SelectItem value="Parcial">Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Ordenar por</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fecha">Fecha</SelectItem>
                  <SelectItem value="monto">Monto</SelectItem>
                  <SelectItem value="nombre">Nombre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Orden</Label>
              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descendente</SelectItem>
                  <SelectItem value="asc">Ascendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setFilterEstado("Todos");
                setFilterTipo("Todos");
                setSortBy("fecha");
                setSortOrder("desc");
                setCurrentPage(1);
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-11">
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="comprobantes">
            <Receipt className="h-4 w-4 mr-2" />
            Comprob.
          </TabsTrigger>
          <TabsTrigger value="activos">
            <Building2 className="h-4 w-4 mr-2" />
            Activos
          </TabsTrigger>
          <TabsTrigger value="facturas">
            <FileText className="h-4 w-4 mr-2" />
            Facturas
          </TabsTrigger>
          <TabsTrigger value="cuentas">
            <CreditCard className="h-4 w-4 mr-2" />
            Cuentas
          </TabsTrigger>
          <TabsTrigger value="empleados">
            <Users className="h-4 w-4 mr-2" />
            Empleados
          </TabsTrigger>
          <TabsTrigger value="monedas">
            <DollarSign className="h-4 w-4 mr-2" />
            Monedas
          </TabsTrigger>
          <TabsTrigger value="margenes">
            <Calculator className="h-4 w-4 mr-2" />
            Márgenes
          </TabsTrigger>
          <TabsTrigger value="reportes">
            <Download className="h-4 w-4 mr-2" />
            Reportes
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Users className="h-4 w-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="contratistas">
            <Briefcase className="h-4 w-4 mr-2" />
            Contratistas
          </TabsTrigger>
        </TabsList>

        {/* TAB: DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Costos por Categoría</CardTitle>
                <CardDescription>Distribución de gastos del mes</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData && dashboardData.costosPorCategoria.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={dashboardData.costosPorCategoria}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ payload }: any) =>
                          `${payload.categoria}: $${payload.monto.toFixed(0)}`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="monto"
                      >
                        {dashboardData.costosPorCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">Sin datos</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Márgenes por Lote</CardTitle>
                <CardDescription>Lotes más rentables</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData && dashboardData.margenesPorLote.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData.margenesPorLote.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="detalles.loteNombre"
                        type="category"
                        width={100}
                      />
                      <Tooltip />
                      <Bar dataKey="porcentajeMargen" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">Sin datos</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-900">Alertas Financieras</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-white p-4 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <p className="font-medium text-red-900">Cuentas Vencidas</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {dashboardData.alertas.cuentasVencidas}
                    </p>
                    <p className="text-sm text-red-700">
                      Total: ${dashboardData.alertas.montoVencido.toFixed(0)}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <p className="font-medium text-orange-900">Cuentas por Cobrar</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {dashboardData.alertas.cuentasPorCobrar}
                    </p>
                    <p className="text-sm text-orange-700">
                      Total: ${dashboardData.alertas.montoPorCobrar.toFixed(0)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: COMPROBANTES - MEJORADO */}
        <TabsContent value="comprobantes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Comprobantes</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setOcrDialogOpen(true)}
                variant="outline"
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Cargar con OCR
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setComprobanteDialogOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Manual
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Facturas y Comprobantes</CardTitle>
              <CardDescription>{comprobantes.length} comprobantes registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">Cargando...</p>
                </div>
              ) : comprobantes.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay comprobantes registrados</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginate(
                      filterAndSort(
                        comprobantes,
                        ["numero", "razonSocial", "tipo"],
                        "estado" as any,
                        "tipo" as any
                      )
                    ).map((comp) => (
                      <div key={comp.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{comp.tipo}</Badge>
                              <p className="font-medium">{comp.numero}</p>
                              {comp.procesadoOCR && (
                                <Badge className="bg-purple-500">
                                  OCR {comp.confianzaOCR}%
                                </Badge>
                              )}
                              <Badge
                                className={
                                  comp.estado === "Pagado"
                                    ? "bg-green-500"
                                    : comp.estado === "Pendiente"
                                    ? "bg-yellow-500"
                                    : "bg-gray-500"
                                }
                              >
                                {comp.estado}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Razón Social</p>
                                <p className="font-medium">{comp.razonSocial}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Fecha</p>
                                <p className="font-medium">{formatDate(comp.fecha)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Total</p>
                                <p className="font-bold text-blue-600">
                                  {comp.moneda} ${comp.total.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedItem(comp);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditItem(comp, "comprobante")}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedItem({ ...comp, type: "comprobante" });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages(
                    filterAndSort(
                      comprobantes,
                      ["numero", "razonSocial", "tipo"],
                      "estado" as any,
                      "tipo" as any
                    )
                  ) > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-gray-600">
                        Página {currentPage} de{" "}
                        {totalPages(
                          filterAndSort(
                            comprobantes,
                            ["numero", "razonSocial", "tipo"],
                            "estado" as any,
                            "tipo" as any
                          )
                        )}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={
                          currentPage ===
                          totalPages(
                            filterAndSort(
                              comprobantes,
                              ["numero", "razonSocial", "tipo"],
                              "estado" as any,
                              "tipo" as any
                            )
                          )
                        }
                      >
                        Siguiente
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: ACTIVOS FIJOS */}
        <TabsContent value="activos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Activos Fijos</h2>
            <div className="flex gap-2">
              <Button
                onClick={calcularDepreciacion}
                variant="outline"
                className="bg-orange-600 text-white hover:bg-orange-700"
                disabled={actionLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Depreciar Mes Actual
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setActivoDialogOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Activo
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {activosFijos.map((activo) => (
              <Card key={activo.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{activo.nombre}</CardTitle>
                    <div className="flex gap-2">
                      <Badge
                        className={activo.estado === "Activo" ? "bg-green-500" : "bg-gray-500"}
                      >
                        {activo.estado}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditItem(activo, "activo")}
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedItem({ ...activo, type: "activo" });
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {activo.tipo} - {activo.codigo}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Valor Adquisición</p>
                      <p className="font-bold text-blue-700">
                        ${activo.valorAdquisicion.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Valor Actual</p>
                      <p className="font-bold text-green-700">
                        ${activo.valorActual.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-red-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Depreciación Acumulada</p>
                    <p className="font-bold text-red-700">
                      ${activo.depreciacionAcumulada.toFixed(0)}
                    </p>
                    <div className="w-full bg-red-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (activo.depreciacionAcumulada / activo.valorAdquisicion) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    <p>Adquirido: {formatDate(activo.fechaAdquisicion)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {activosFijos.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No hay activos fijos registrados</p>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setActivoDialogOpen(true);
                  }}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  Crear Primer Activo
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: FACTURAS EMITIDAS */}
        <TabsContent value="facturas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Facturas Emitidas</h2>
            <Button
              onClick={() => setFacturaDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Factura
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cuentas por Cobrar</CardTitle>
              <CardDescription>Facturas emitidas y pagos recibidos</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : facturasEmitidas.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay facturas emitidas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {facturasEmitidas.map((factura) => (
                    <div key={factura.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-lg">Factura {factura.numero}</p>
                            <Badge
                              className={
                                factura.estadoCobro === "Cobrado"
                                  ? "bg-green-500"
                                  : factura.estadoCobro === "Parcial"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }
                            >
                              {factura.estadoCobro}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-sm mb-2">
                            <div>
                              <p className="text-gray-500">Cliente</p>
                              <p className="font-medium">{factura.clienteNombre}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Fecha</p>
                              <p className="font-medium">{formatDate(factura.fecha)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Total</p>
                              <p className="font-bold text-green-600">
                                {factura.moneda} ${factura.total.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Saldo</p>
                              <p className="font-bold text-orange-600">
                                ${factura.saldo.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {factura.estadoCobro !== "Cobrado" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => {
                                setSelectedItem({ ...factura, tipo: "factura" });
                                setPagoDialogOpen(true);
                              }}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Registrar Pago
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: CUENTAS POR PAGAR */}
        <TabsContent value="cuentas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cuentas por Pagar</h2>
            <Button
              onClick={() => setCuentaDialogOpen(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cuenta
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Obligaciones Pendientes</CardTitle>
              <CardDescription>Control de pagos a proveedores</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : cuentasPorPagar.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay cuentas por pagar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cuentasPorPagar.map((cuenta) => {
                    const esVencida = new Date(cuenta.fechaVencimiento) < new Date();
                    return (
                      <div
                        key={cuenta.id}
                        className={`p-4 border rounded-lg hover:bg-gray-50 ${
                          esVencida ? "border-red-300 bg-red-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium text-lg">{cuenta.proveedor}</p>
                              <Badge
                                className={
                                  cuenta.estadoPago === "Pagado"
                                    ? "bg-green-500"
                                    : cuenta.estadoPago === "Parcial"
                                    ? "bg-yellow-500"
                                    : esVencida
                                    ? "bg-red-500"
                                    : "bg-orange-500"
                                }
                              >
                                {esVencida && cuenta.estadoPago !== "Pagado"
                                  ? "VENCIDA"
                                  : cuenta.estadoPago}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-4 gap-4 text-sm mb-2">
                              <div>
                                <p className="text-gray-500">Concepto</p>
                                <p className="font-medium">{cuenta.concepto}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Vencimiento</p>
                                <p
                                  className={`font-medium ${
                                    esVencida ? "text-red-600 font-bold" : ""
                                  }`}
                                >
                                  {formatDate(cuenta.fechaVencimiento)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Monto Total</p>
                                <p className="font-bold text-red-600">
                                  {cuenta.moneda} ${cuenta.monto.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Saldo</p>
                                <p className="font-bold text-orange-600">
                                  ${cuenta.saldo.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {cuenta.estadoPago !== "Pagado" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                onClick={() => {
                                  setSelectedItem({ ...cuenta, tipo: "cuenta" });
                                  setPagoDialogOpen(true);
                                }}
                              >
                                <Wallet className="h-4 w-4 mr-2" />
                                Registrar Pago
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: EMPLEADOS - MEJORADO */}
        <TabsContent value="empleados" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestión de Empleados</h2>
            <Button
              onClick={() => {
                setIsEditing(false);
                setEmpleadoDialogOpen(true);
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Empleado
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {paginate(
              filterAndSort(empleados, ["nombre", "apellido", "cargo"], "estado" as any)
            ).map((empleado) => (
              <Card key={empleado.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {empleado.nombre} {empleado.apellido}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge
                        className={empleado.estado === "Activo" ? "bg-green-500" : "bg-gray-500"}
                      >
                        {empleado.estado}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditItem(empleado, "empleado")}
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedItem({ ...empleado, type: "empleado" });
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {empleado.cargo} - {empleado.area}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-600">Legajo</p>
                      <p className="font-medium">{empleado.legajo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Fecha Ingreso</p>
                      <p className="font-medium">{formatDate(empleado.fechaIngreso)}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Salario Base</p>
                    <p className="text-lg font-bold text-blue-700">
                      ${empleado.salarioBase.toFixed(0)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedItem(empleado);
                        setHorasDialogOpen(true);
                      }}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Horas
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedItem(empleado);
                        setPagarSalarioDialogOpen(true);
                      }}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Pagar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {empleados.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No hay empleados registrados</p>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEmpleadoDialogOpen(true);
                  }}
                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                >
                  Agregar Primer Empleado
                </Button>
              </CardContent>
            </Card>
          )}

          {totalPages(filterAndSort(empleados, ["nombre", "apellido", "cargo"], "estado" as any)) >
            1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de{" "}
                {totalPages(filterAndSort(empleados, ["nombre", "apellido", "cargo"], "estado" as any))}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={
                  currentPage ===
                  totalPages(filterAndSort(empleados, ["nombre", "apellido", "cargo"], "estado" as any))
                }
              >
                Siguiente
              </Button>
            </div>
          )}
        </TabsContent>

        {/* TAB: TIPOS DE CAMBIO */}
        <TabsContent value="monedas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tipos de Cambio</h2>
            <Button
              onClick={() => setTipoCambioDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Tipo de Cambio
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Tipos de Cambio</CardTitle>
              <CardDescription>Gestión multi-moneda (USD, UYU, ARS)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : tiposCambio.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay tipos de cambio registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tiposCambio.slice(0, 10).map((tipo) => (
                    <div
                      key={tipo.id}
                      className="p-3 border rounded flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-lg">
                          USD → {tipo.monedaDestino}
                        </Badge>
                        <p className="text-sm text-gray-500">{formatDate(tipo.fecha)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          ${tipo.promedio.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">Promedio</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {tiposCambio.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Evolución del Tipo de Cambio</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={tiposCambio.slice(0, 30).reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="fecha"
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="promedio"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Tipo de Cambio"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: MÁRGENES EN VIVO */}
        <TabsContent value="margenes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Márgenes Brutos en Tiempo Real</h2>
            <Button
              onClick={fetchData}
              variant="outline"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>

          {dashboardData && (
            <>
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle>Resumen Mes Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                      <p className="text-sm text-gray-600 mb-1">Ingresos</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${dashboardData.resumenMesActual.ingresos.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                      <p className="text-sm text-gray-600 mb-1">Gastos</p>
                      <p className="text-2xl font-bold text-red-600">
                        ${dashboardData.resumenMesActual.gastos.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                      <p className="text-sm text-gray-600 mb-1">Margen Bruto</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${dashboardData.resumenMesActual.margen.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                      <p className="text-sm text-gray-600 mb-1">% Margen</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {dashboardData.resumenMesActual.porcentajeMargen.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rentabilidad por Lote</CardTitle>
                  <CardDescription>Análisis de márgenes por cultivo</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData.margenesPorLote.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.margenesPorLote.slice(0, 5).map((margen: any) => (
                        <div key={margen.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-lg">
                                {margen.detalles?.loteNombre ||
                                  margen.referenciaNombre ||
                                  "Lote"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {margen.detalles?.cultivo} - {margen.detalles?.hectareas} ha
                              </p>
                            </div>
                            <Badge
                              className={
                                margen.porcentajeMargen > 30
                                  ? "bg-green-500"
                                  : margen.porcentajeMargen > 10
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }
                            >
                              {margen.porcentajeMargen.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Ingresos</p>
                              <p className="font-bold text-green-600">
                                ${margen.ingresos.toFixed(0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Costos</p>
                              <p className="font-bold text-red-600">
                                ${margen.costos.toFixed(0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Margen</p>
                              <p className="font-bold text-blue-600">
                                ${margen.margen.toFixed(0)}
                              </p>
                            </div>
                          </div>
                          {margen.detalles?.margenPorHa && (
                            <p className="text-xs text-gray-500 mt-2">
                              Margen por hectárea: ${margen.detalles.margenPorHa.toFixed(0)}/ha
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No hay márgenes calculados por lote
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* TAB: REPORTES - MEJORADO */}
        <TabsContent value="reportes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Reportes Profesionales</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2 border-blue-200 hover:border-blue-400 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Estado de Resultados
                </CardTitle>
                <CardDescription>Ingresos y gastos por período</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleGenerarEstadoResultados}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Generar PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 hover:border-green-400 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                  Flujo de Caja
                </CardTitle>
                <CardDescription>Movimientos de efectivo</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleGenerarFlujoCaja}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Generar PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 hover:border-purple-400 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Balance General
                </CardTitle>
                <CardDescription>Activos, pasivos y patrimonio</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleGenerarBalance}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Generar PDF
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Exportación de Datos</CardTitle>
              <CardDescription>Descarga información en diferentes formatos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={handleExportarTransacciones}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Transacciones (CSV)
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={handleExportarActivos}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Activos Fijos (CSV)
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={handleExportarEmpleados}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Empleados (CSV)
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Cuentas por Pagar (CSV)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: ROLES - MEJORADO */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestión de Roles y Permisos</h2>
            <Button
              onClick={() => {
                setIsEditing(false);
                setRolDialogOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Rol
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((rol) => {
              let permisos = {};
              try {
                permisos = JSON.parse(rol.permisos || "{}");
              } catch (e) {
                console.error("Error parsing permisos:", e);
              }

              return (
                <Card key={rol.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{rol.nombre}</CardTitle>
                      <div className="flex gap-2">
                        <Badge className="bg-indigo-500">
                          {Object.keys(permisos).length} módulos
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditItem(rol, "rol")}
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedItem({ ...rol, type: "rol" });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    {rol.descripcion && <p className="text-sm text-gray-600">{rol.descripcion}</p>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-indigo-50 p-3 rounded">
                      <p className="text-xs text-gray-600 mb-2">Permisos por módulo:</p>
                      {Object.entries(permisos).map(([modulo, perms]: [string, any]) => (
                        <div
                          key={modulo}
                          className="flex items-center justify-between text-sm mb-1"
                        >
                          <span className="font-medium capitalize">{modulo}:</span>
                          <div className="flex gap-2">
                            {perms.ver && (
                              <Badge variant="outline" className="text-xs">
                                Ver
                              </Badge>
                            )}
                            {perms.editar && (
                              <Badge variant="outline" className="text-xs">
                                Editar
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedItem(rol);
                        setAsignarUsuarioDialogOpen(true);
                      }}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Asignar Usuario
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {roles.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No hay roles creados</p>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setRolDialogOpen(true);
                  }}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                >
                  Crear Primer Rol
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: CONTRATISTAS - MEJORADO */}
        <TabsContent value="contratistas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Portal de Contratistas</h2>
            <Button
              onClick={() => {
                setIsEditing(false);
                setContratistaDialogOpen(true);
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contratista
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {contratistas.map((contratista) => (
              <Card key={contratista.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{contratista.nombre}</CardTitle>
                    <div className="flex gap-2">
                      <Badge
                        className={
                          contratista.estado === "Activo"
                            ? "bg-green-500"
                            : contratista.estado === "Bloqueado"
                            ? "bg-red-500"
                            : "bg-gray-500"
                        }
                      >
                        {contratista.estado}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditItem(contratista, "contratista")}
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedItem({ ...contratista, type: "contratista" });
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {contratista.empresa || "Sin empresa"} - {contratista.especialidad}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-600">Email</p>
                      <p className="font-medium">{contratista.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Teléfono</p>
                      <p className="font-medium">{contratista.telefono || "N/A"}</p>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Código de Acceso</p>
                    <p className="text-lg font-bold text-orange-700 font-mono">
                      {contratista.codigoAcceso}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedItem(contratista);
                        setTrabajoDialogOpen(true);
                      }}
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Asignar Trabajo
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleVerTrabajosContratista(contratista.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Trabajos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {contratistas.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No hay contratistas registrados</p>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setContratistaDialogOpen(true);
                  }}
                  className="mt-4 bg-orange-600 hover:bg-orange-700"
                >
                  Agregar Primer Contratista
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      

      {/* DIALOG: Cargar Comprobante con OCR */}
      <Dialog open={ocrDialogOpen} onOpenChange={setOcrDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cargar Comprobante con OCR</DialogTitle>
            <DialogDescription>
              Sube una imagen o PDF y Claude extraerá automáticamente los datos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setOcrFile(file);
                    }
                  }}
                  className="max-w-xs mx-auto"
                />
                {ocrFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Archivo seleccionado: {ocrFile.name}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleOCRUpload}
              disabled={!ocrFile || ocrLoading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {ocrLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Procesando con Claude Vision...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Procesar con OCR
                </>
              )}
            </Button>

            {ocrResult && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="font-medium text-purple-900 mb-2 inline-flex items-center gap-1">
                  <Icon name="check" size={14} /> OCR Procesado (Confianza: {ocrResult.confianza || 0}%)
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Tipo:</span> {ocrResult.tipo}
                  </div>
                  <div>
                    <span className="text-gray-600">Número:</span> {ocrResult.numero}
                  </div>
                  <div>
                    <span className="text-gray-600">Fecha:</span> {ocrResult.fecha}
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span> {ocrResult.moneda} $
                    {ocrResult.total}
                  </div>
                </div>
              </div>
            )}

            {ocrResult && (
              <form onSubmit={handleCreateComprobante} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select
                      value={comprobanteForm.tipo}
                      onValueChange={(value) =>
                        setComprobanteForm({ ...comprobanteForm, tipo: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Factura">Factura</SelectItem>
                        <SelectItem value="Recibo">Recibo</SelectItem>
                        <SelectItem value="NotaCredito">Nota de Crédito</SelectItem>
                        <SelectItem value="NotaDebito">Nota de Débito</SelectItem>
                        <SelectItem value="Remito">Remito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Número *</Label>
                    <Input
                      value={comprobanteForm.numero}
                      onChange={(e) =>
                        setComprobanteForm({ ...comprobanteForm, numero: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha *</Label>
                    <Input
                      type="date"
                      value={comprobanteForm.fecha}
                      onChange={(e) =>
                        setComprobanteForm({ ...comprobanteForm, fecha: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Razón Social *</Label>
                    <Input
                      value={comprobanteForm.razonSocial}
                      onChange={(e) =>
                        setComprobanteForm({ ...comprobanteForm, razonSocial: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Subtotal *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={comprobanteForm.subtotal}
                      onChange={(e) =>
                        setComprobanteForm({ ...comprobanteForm, subtotal: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>IVA</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={comprobanteForm.iva}
                      onChange={(e) =>
                        setComprobanteForm({ ...comprobanteForm, iva: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={comprobanteForm.total}
                      onChange={(e) =>
                        setComprobanteForm({ ...comprobanteForm, total: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOcrDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={actionLoading}>
                    {actionLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Guardar Comprobante
                  </Button>
                </DialogFooter>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Nuevo/Editar Comprobante Manual */}
      <Dialog open={comprobanteDialogOpen} onOpenChange={setComprobanteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateComprobante}>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Comprobante" : "Nuevo Comprobante Manual"}</DialogTitle>
              <DialogDescription>Ingresar datos manualmente</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={comprobanteForm.tipo}
                    onValueChange={(value) =>
                      setComprobanteForm({ ...comprobanteForm, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Factura">Factura</SelectItem>
                      <SelectItem value="Recibo">Recibo</SelectItem>
                      <SelectItem value="NotaCredito">Nota de Crédito</SelectItem>
                      <SelectItem value="NotaDebito">Nota de Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Número *</Label>
                  <Input
                    placeholder="001-001-00000001"
                    value={comprobanteForm.numero}
                    onChange={(e) =>
                      setComprobanteForm({ ...comprobanteForm, numero: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={comprobanteForm.fecha}
                    onChange={(e) =>
                      setComprobanteForm({ ...comprobanteForm, fecha: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Moneda *</Label>
                  <Select
                    value={comprobanteForm.moneda}
                    onValueChange={(value) =>
                      setComprobanteForm({ ...comprobanteForm, moneda: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="UYU">UYU</SelectItem>
                      <SelectItem value="ARS">ARS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Razón Social *</Label>
                <Input
                  placeholder="Nombre del proveedor"
                  value={comprobanteForm.razonSocial}
                  onChange={(e) =>
                    setComprobanteForm({ ...comprobanteForm, razonSocial: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>RUT/CUIT</Label>
                <Input
                  placeholder="12-3456789-0"
                  value={comprobanteForm.rut}
                  onChange={(e) =>
                    setComprobanteForm({ ...comprobanteForm, rut: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Subtotal *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1000.00"
                    value={comprobanteForm.subtotal}
                    onChange={(e) =>
                      setComprobanteForm({ ...comprobanteForm, subtotal: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>IVA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="220.00"
                    value={comprobanteForm.iva}
                    onChange={(e) =>
                      setComprobanteForm({ ...comprobanteForm, iva: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1220.00"
                    value={comprobanteForm.total}
                    onChange={(e) =>
                      setComprobanteForm({ ...comprobanteForm, total: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={comprobanteForm.observaciones}
                  onChange={(e) =>
                    setComprobanteForm({ ...comprobanteForm, observaciones: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setComprobanteDialogOpen(false);
                  setIsEditing(false);
                  setSelectedItem(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={actionLoading}>
                {actionLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                {isEditing ? "Actualizar" : "Crear Comprobante"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Nuevo/Editar Activo Fijo */}
      <Dialog open={activoDialogOpen} onOpenChange={setActivoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateActivo}>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Activo Fijo" : "Nuevo Activo Fijo"}</DialogTitle>
              <DialogDescription>Registro con depreciación automática</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    placeholder="ACT-001"
                    value={activoForm.codigo}
                    onChange={(e) => setActivoForm({ ...activoForm, codigo: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={activoForm.tipo}
                    onValueChange={(value) => setActivoForm({ ...activoForm, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maquinaria">Maquinaria</SelectItem>
                      <SelectItem value="Instalacion">Instalación</SelectItem>
                      <SelectItem value="Vehiculo">Vehículo</SelectItem>
                      <SelectItem value="Herramienta">Herramienta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Tractor John Deere 6155M"
                  value={activoForm.nombre}
                  onChange={(e) => setActivoForm({ ...activoForm, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input
                    placeholder="John Deere"
                    value={activoForm.marca}
                    onChange={(e) => setActivoForm({ ...activoForm, marca: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Input
                    placeholder="6155M"
                    value={activoForm.modelo}
                    onChange={(e) => setActivoForm({ ...activoForm, modelo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Valor Adquisición (USD) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="50000"
                    value={activoForm.valorAdquisicion}
                    onChange={(e) =>
                      setActivoForm({ ...activoForm, valorAdquisicion: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha Adquisición *</Label>
                  <Input
                    type="date"
                    value={activoForm.fechaAdquisicion}
                    onChange={(e) =>
                      setActivoForm({ ...activoForm, fechaAdquisicion: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vida Útil (años) *</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={activoForm.vidaUtilAnios}
                    onChange={(e) =>
                      setActivoForm({ ...activoForm, vidaUtilAnios: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Valor Residual (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="5000"
                  value={activoForm.valorResidual}
                  onChange={(e) =>
                    setActivoForm({ ...activoForm, valorResidual: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500">Valor estimado al final de la vida útil</p>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Detalles adicionales..."
                  value={activoForm.observaciones}
                  onChange={(e) =>
                    setActivoForm({ ...activoForm, observaciones: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setActivoDialogOpen(false);
                  setIsEditing(false);
                  setSelectedItem(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={actionLoading}>
                {actionLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                {isEditing ? "Actualizar" : "Crear Activo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Nueva Factura Emitida */}
      <Dialog open={facturaDialogOpen} onOpenChange={setFacturaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateFactura}>
            <DialogHeader>
              <DialogTitle>Nueva Factura Emitida</DialogTitle>
              <DialogDescription>Factura de venta a cliente</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Factura *</Label>
                  <Input
                    placeholder="A-001-00000001"
                    value={facturaForm.numero}
                    onChange={(e) => setFacturaForm({ ...facturaForm, numero: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={facturaForm.fecha}
                    onChange={(e) => setFacturaForm({ ...facturaForm, fecha: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Input
                    placeholder="Nombre del cliente"
                    value={facturaForm.clienteNombre}
                    onChange={(e) =>
                      setFacturaForm({ ...facturaForm, clienteNombre: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>RUT/CUIT</Label>
                  <Input
                    placeholder="12-3456789-0"
                    value={facturaForm.clienteRut}
                    onChange={(e) =>
                      setFacturaForm({ ...facturaForm, clienteRut: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="cliente@email.com"
                  value={facturaForm.clienteEmail}
                  onChange={(e) =>
                    setFacturaForm({ ...facturaForm, clienteEmail: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Vencimiento</Label>
                  <Input
                    type="date"
                    value={facturaForm.fechaVencimiento}
                    onChange={(e) =>
                      setFacturaForm({ ...facturaForm, fechaVencimiento: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Moneda *</Label>
                  <Select
                    value={facturaForm.moneda}
                    onValueChange={(value) =>
                      setFacturaForm({ ...facturaForm, moneda: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="UYU">UYU</SelectItem>
                      <SelectItem value="ARS">ARS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Subtotal *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={facturaForm.subtotal}
                    onChange={(e) =>
                      setFacturaForm({ ...facturaForm, subtotal: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>IVA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={facturaForm.iva}
                    onChange={(e) => setFacturaForm({ ...facturaForm, iva: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={facturaForm.total}
                    onChange={(e) => setFacturaForm({ ...facturaForm, total: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={facturaForm.observaciones}
                  onChange={(e) =>
                    setFacturaForm({ ...facturaForm, observaciones: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFacturaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={actionLoading}>
                {actionLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                Crear Factura
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Nueva Cuenta por Pagar */}
      <Dialog open={cuentaDialogOpen} onOpenChange={setCuentaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateCuenta}>
            <DialogHeader>
              <DialogTitle>Nueva Cuenta por Pagar</DialogTitle>
              <DialogDescription>Registrar obligación con proveedor</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proveedor *</Label>
                  <Input
                    placeholder="Nombre del proveedor"
                    value={cuentaForm.proveedor}
                    onChange={(e) => setCuentaForm({ ...cuentaForm, proveedor: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>RUT/CUIT</Label>
                  <Input
                    placeholder="12-3456789-0"
                    value={cuentaForm.proveedorRut}
                    onChange={(e) =>
                      setCuentaForm({ ...cuentaForm, proveedorRut: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Concepto *</Label>
                <Input
                  placeholder="Descripción de la obligación"
                  value={cuentaForm.concepto}
                  onChange={(e) => setCuentaForm({ ...cuentaForm, concepto: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Emisión *</Label>
                  <Input
                    type="date"
                    value={cuentaForm.fechaEmision}
                    onChange={(e) =>
                      setCuentaForm({ ...cuentaForm, fechaEmision: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha Vencimiento *</Label>
                  <Input
                    type="date"
                    value={cuentaForm.fechaVencimiento}
                    onChange={(e) =>
                      setCuentaForm({ ...cuentaForm, fechaVencimiento: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1000.00"
                    value={cuentaForm.monto}
                    onChange={(e) => setCuentaForm({ ...cuentaForm, monto: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Moneda *</Label>
                  <Select
                    value={cuentaForm.moneda}
                    onValueChange={(value) => setCuentaForm({ ...cuentaForm, moneda: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="UYU">UYU</SelectItem>
                      <SelectItem value="ARS">ARS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={cuentaForm.observaciones}
                  onChange={(e) =>
                    setCuentaForm({ ...cuentaForm, observaciones: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCuentaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={actionLoading}>
                {actionLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                Crear Cuenta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Nuevo/Editar Empleado */}
      <Dialog open={empleadoDialogOpen} onOpenChange={setEmpleadoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateEmpleado}>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle>
              <DialogDescription>Registro de personal y nómina</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Legajo *</Label>
                  <Input
                    placeholder="EMP-001"
                    value={empleadoForm.legajo}
                    onChange={(e) => setEmpleadoForm({ ...empleadoForm, legajo: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Juan"
                    value={empleadoForm.nombre}
                    onChange={(e) => setEmpleadoForm({ ...empleadoForm, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Apellido *</Label>
                  <Input
                    placeholder="Pérez"
                    value={empleadoForm.apellido}
                    onChange={(e) =>
                      setEmpleadoForm({ ...empleadoForm, apellido: e.target.value })
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
                    value={empleadoForm.documento}
                    onChange={(e) =>
                      setEmpleadoForm({ ...empleadoForm, documento: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Ingreso *</Label>
                  <Input
                    type="date"
                    value={empleadoForm.fechaIngreso}
                    onChange={(e) =>
                      setEmpleadoForm({ ...empleadoForm, fechaIngreso: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cargo *</Label>
                  <Input
                    placeholder="Tractorista, Operario, etc"
                    value={empleadoForm.cargo}
                    onChange={(e) => setEmpleadoForm({ ...empleadoForm, cargo: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Área *</Label>
                  <Select
                    value={empleadoForm.area}
                    onValueChange={(value) => setEmpleadoForm({ ...empleadoForm, area: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Agricultura">Agricultura</SelectItem>
                      <SelectItem value="Ganadería">Ganadería</SelectItem>
                      <SelectItem value="Administración">Administración</SelectItem>
                      <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Contrato *</Label>
                  <Select
                    value={empleadoForm.tipoContrato}
                    onValueChange={(value) =>
                      setEmpleadoForm({ ...empleadoForm, tipoContrato: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mensual">Mensual</SelectItem>
                      <SelectItem value="Jornal">Jornal</SelectItem>
                      <SelectItem value="Por Hora">Por Hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Salario Base *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1500"
                    value={empleadoForm.salarioBase}
                    onChange={(e) =>
                      setEmpleadoForm({ ...empleadoForm, salarioBase: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="empleado@email.com"
                    value={empleadoForm.email}
                    onChange={(e) => setEmpleadoForm({ ...empleadoForm, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    placeholder="+598 99 123 456"
                    value={empleadoForm.telefono}
                    onChange={(e) =>
                      setEmpleadoForm({ ...empleadoForm, telefono: e.target.value })
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
                  setEmpleadoDialogOpen(false);
                  setIsEditing(false);
                  setSelectedItem(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={actionLoading}>
                {actionLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                {isEditing ? "Actualizar" : "Crear Empleado"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* DIALOG: Nuevo Tipo de Cambio */}
      <Dialog open={tipoCambioDialogOpen} onOpenChange={setTipoCambioDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateTipoCambio}>
            <DialogHeader>
              <DialogTitle>Registrar Tipo de Cambio</DialogTitle>
              <DialogDescription>Cotización USD a moneda local</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Moneda Destino *</Label>
                <Select
                  value={tipoCambioForm.monedaDestino}
                  onValueChange={(value) =>
                    setTipoCambioForm({ ...tipoCambioForm, monedaDestino: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UYU">Peso Uruguayo (UYU)</SelectItem>
                    <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                    <SelectItem value="BRL">Real Brasileño (BRL)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Compra *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="38.50"
                    value={tipoCambioForm.compra}
                    onChange={(e) =>
                      setTipoCambioForm({ ...tipoCambioForm, compra: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Venta *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="39.50"
                    value={tipoCambioForm.venta}
                    onChange={(e) =>
                      setTipoCambioForm({ ...tipoCambioForm, venta: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-gray-600">Promedio calculado:</p>
                <p className="text-2xl font-bold text-blue-700">
                  {tipoCambioForm.compra && tipoCambioForm.venta
                    ? (
                        (parseFloat(tipoCambioForm.compra) + parseFloat(tipoCambioForm.venta)) /
                        2
                      ).toFixed(2)
                    : "0.00"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTipoCambioDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={actionLoading}>
                {actionLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Registrar Pago */}
      <Dialog open={pagoDialogOpen} onOpenChange={setPagoDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleRegistrarPago}>
            <DialogHeader>
              <DialogTitle>Registrar Pago</DialogTitle>
              <DialogDescription>
                {selectedItem?.tipo === "factura"
                  ? `Factura ${selectedItem?.numero} - Cliente: ${selectedItem?.clienteNombre}`
                  : `Cuenta: ${selectedItem?.proveedor} - ${selectedItem?.concepto}`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedItem && (
                <div className="bg-gray-50 p-3 rounded">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Total:</p>
                      <p className="font-bold">
                        ${selectedItem.total?.toFixed(2) || selectedItem.monto?.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Saldo Pendiente:</p>
                      <p className="font-bold text-orange-600">${selectedItem.saldo?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Monto del Pago *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={pagoForm.monto}
                  onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })}
                  required
                />
                {selectedItem && parseFloat(pagoForm.monto || "0") > selectedItem.saldo && (
                  <p className="text-xs text-red-600 inline-flex items-center gap-1"><Icon name="alert" size={12} /> El monto excede el saldo pendiente</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Método de Pago *</Label>
                <Select
                  value={pagoForm.metodoPago}
                  onValueChange={(value) => setPagoForm({ ...pagoForm, metodoPago: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Referencia</Label>
                <Input
                  placeholder="Número de transacción, cheque, etc"
                  value={pagoForm.referencia}
                  onChange={(e) => setPagoForm({ ...pagoForm, referencia: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={pagoForm.observaciones}
                  onChange={(e) => setPagoForm({ ...pagoForm, observaciones: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPagoDialogOpen(false);
                  setSelectedItem(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className={
                  selectedItem?.tipo === "factura"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Registrar Pago
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Nuevo/Editar Rol */}
      <Dialog open={rolDialogOpen} onOpenChange={setRolDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateRol}>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
              <DialogDescription>
                Define roles y permisos para usuarios del sistema
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre del Rol *</Label>
                <Select
                  value={rolForm.nombre}
                  onValueChange={(value) => setRolForm({ ...rolForm, nombre: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Administrador</SelectItem>
                    <SelectItem value="Gerente">Gerente</SelectItem>
                    <SelectItem value="Agronomo">Agrónomo</SelectItem>
                    <SelectItem value="Inversor">Inversor</SelectItem>
                    <SelectItem value="Contratista">Contratista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Describe las responsabilidades de este rol..."
                  value={rolForm.descripcion}
                  onChange={(e) => setRolForm({ ...rolForm, descripcion: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <Label>Permisos por Módulo</Label>
                <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  {Object.entries(rolForm.permisos).map(([modulo, perms]: [string, any]) => (
                    <div key={modulo} className="flex items-center justify-between">
                      <span className="font-medium capitalize">{modulo}</span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={perms.ver}
                            onChange={(e) =>
                              setRolForm({
                                ...rolForm,
                                permisos: {
                                  ...rolForm.permisos,
                                  [modulo]: { ...perms, ver: e.target.checked },
                                },
                              })
                            }
                          />
                          <span className="text-sm">Ver</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={perms.editar}
                            onChange={(e) =>
                              setRolForm({
                                ...rolForm,
                                permisos: {
                                  ...rolForm.permisos,
                                  [modulo]: { ...perms, editar: e.target.checked },
                                },
                              })
                            }
                          />
                          <span className="text-sm">Editar</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRolDialogOpen(false);
                  setIsEditing(false);
                  setSelectedItem(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={actionLoading}>
                {actionLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                {isEditing ? "Actualizar" : "Crear Rol"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Nuevo/Editar Contratista */}
      <Dialog open={contratistaDialogOpen} onOpenChange={setContratistaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateContratista}>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Contratista" : "Nuevo Contratista"}</DialogTitle>
              <DialogDescription>
                Registra un contratista externo con código de acceso
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Juan Pérez"
                    value={contratistaForm.nombre}
                    onChange={(e) =>
                      setContratistaForm({ ...contratistaForm, nombre: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Input
                    placeholder="Agro Servicios SA"
                    value={contratistaForm.empresa}
                    onChange={(e) =>
                      setContratistaForm({ ...contratistaForm, empresa: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="contratista@email.com"
                    value={contratistaForm.email}
                    onChange={(e) =>
                      setContratistaForm({ ...contratistaForm, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    placeholder="+598 99 123 456"
                    value={contratistaForm.telefono}
                    onChange={(e) =>
                      setContratistaForm({ ...contratistaForm, telefono: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>RUT/CUIT</Label>
                  <Input
                    placeholder="12-3456789-0"
                    value={contratistaForm.rut}
                    onChange={(e) =>
                      setContratistaForm({ ...contratistaForm, rut: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Especialidad *</Label>
                  <Select
                    value={contratistaForm.especialidad}
                    onValueChange={(value) =>
                      setContratistaForm({ ...contratistaForm, especialidad: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Siembra">Siembra</SelectItem>
                      <SelectItem value="Cosecha">Cosecha</SelectItem>
                      <SelectItem value="Pulverizacion">Pulverización</SelectItem>
                      <SelectItem value="Transporte">Transporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setContratistaDialogOpen(false);
                  setIsEditing(false);
                  setSelectedItem(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={actionLoading}>
                {actionLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                {isEditing ? "Actualizar" : "Crear Contratista"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Asignar Trabajo */}
      <Dialog open={trabajoDialogOpen} onOpenChange={setTrabajoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateTrabajo}>
            <DialogHeader>
              <DialogTitle>Asignar Trabajo</DialogTitle>
              <DialogDescription>
                {selectedItem && `Contratista: ${selectedItem.nombre}`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  placeholder="Siembra de soja en Lote 5"
                  value={trabajoForm.titulo}
                  onChange={(e) => setTrabajoForm({ ...trabajoForm, titulo: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción *</Label>
                <Textarea
                  placeholder="Detalles del trabajo a realizar..."
                  value={trabajoForm.descripcion}
                  onChange={(e) => setTrabajoForm({ ...trabajoForm, descripcion: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Trabajo *</Label>
                  <Select
                    value={trabajoForm.tipo}
                    onValueChange={(value) => setTrabajoForm({ ...trabajoForm, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Siembra">Siembra</SelectItem>
                      <SelectItem value="Cosecha">Cosecha</SelectItem>
                      <SelectItem value="Pulverizacion">Pulverización</SelectItem>
                      <SelectItem value="Fertilizacion">Fertilización</SelectItem>
                      <SelectItem value="Transporte">Transporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lote</Label>
                  <Input
                    placeholder="Lote 5"
                    value={trabajoForm.loteNombre}
                    onChange={(e) =>
                      setTrabajoForm({ ...trabajoForm, loteNombre: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hectáreas</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="50"
                    value={trabajoForm.hectareas}
                    onChange={(e) => setTrabajoForm({ ...trabajoForm, hectareas: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Monto (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="5000"
                    value={trabajoForm.monto}
                    onChange={(e) => setTrabajoForm({ ...trabajoForm, monto: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTrabajoDialogOpen(false);
                  setSelectedItem(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={actionLoading}>
                {actionLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                Asignar Trabajo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* DIALOGS ADICIONALES */}
      {/* ============================================ */}

      {/* DIALOG: Ver Detalles */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Comprobante</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">Tipo</Label>
                  <p className="font-medium">{selectedItem.tipo}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">Número</Label>
                  <p className="font-medium">{selectedItem.numero}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">Fecha</Label>
                  <p className="font-medium">{formatDate(selectedItem.fecha)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">Estado</Label>
                  <Badge
                    className={
                      selectedItem.estado === "Pagado"
                        ? "bg-green-500"
                        : selectedItem.estado === "Pendiente"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                    }
                  >
                    {selectedItem.estado}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm text-gray-600">Razón Social</Label>
                <p className="font-medium text-lg">{selectedItem.razonSocial}</p>
                {selectedItem.rut && (
                  <p className="text-sm text-gray-600">RUT: {selectedItem.rut}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 border-t pt-4">
                <div className="bg-blue-50 p-3 rounded">
                  <Label className="text-sm text-gray-600">Subtotal</Label>
                  <p className="font-bold text-blue-700">
                    ${selectedItem.subtotal?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <Label className="text-sm text-gray-600">IVA</Label>
                  <p className="font-bold text-green-700">
                    ${selectedItem.iva?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <Label className="text-sm text-gray-600">Total</Label>
                  <p className="font-bold text-purple-700 text-xl">
                    {selectedItem.moneda} ${selectedItem.total?.toFixed(2)}
                  </p>
                </div>
              </div>

              {selectedItem.procesadoOCR && (
                <div className="bg-purple-50 p-3 rounded border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="h-4 w-4 text-purple-600" />
                    <Label className="text-sm font-medium text-purple-900">
                      Procesado con OCR
                    </Label>
                  </div>
                  <p className="text-sm text-purple-700">
                    Confianza: {selectedItem.confianzaOCR}%
                  </p>
                </div>
              )}

              {selectedItem.observaciones && (
                <div className="border-t pt-4">
                  <Label className="text-sm text-gray-600">Observaciones</Label>
                  <p className="text-sm mt-1">{selectedItem.observaciones}</p>
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

      {/* DIALOG: Confirmar Eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este registro?
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <p className="font-medium">
                {selectedItem.nombre ||
                  selectedItem.razonSocial ||
                  selectedItem.numero ||
                  "Registro"}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Tipo: {selectedItem.type || selectedItem.tipo}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedItem(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteItem}
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

      {/* DIALOG: Registrar Horas de Empleado */}
      <Dialog open={horasDialogOpen} onOpenChange={setHorasDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleRegistrarHoras}>
            <DialogHeader>
              <DialogTitle>Registrar Horas Trabajadas</DialogTitle>
              <DialogDescription>
                {selectedItem && `Empleado: ${selectedItem.nombre} ${selectedItem.apellido}`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={horasForm.fecha}
                  onChange={(e) => setHorasForm({ ...horasForm, fecha: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Horas Trabajadas *</Label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="8.0"
                  value={horasForm.horasTrabajadas}
                  onChange={(e) => setHorasForm({ ...horasForm, horasTrabajadas: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Tarea *</Label>
                <Select
                  value={horasForm.tipoTarea}
                  onValueChange={(value) => setHorasForm({ ...horasForm, tipoTarea: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Campo">Campo</SelectItem>
                    <SelectItem value="Administrativo">Administrativo</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Transporte">Transporte</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Detalles de la tarea realizada..."
                  value={horasForm.descripcion}
                  onChange={(e) => setHorasForm({ ...horasForm, descripcion: e.target.value })}
                  rows={3}
                />
              </div>

              {selectedItem && (
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Costo estimado</p>
                  <p className="text-lg font-bold text-blue-700">
                    $
                    {(
                      (parseFloat(horasForm.horasTrabajadas || "0") * selectedItem.salarioBase) /
                      160
                    ).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Basado en salario mensual / 160 horas</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setHorasDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={actionLoading}>
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4 mr-2" />
                )}
                Registrar Horas
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* DIALOG: Pagar Salario */}
      <Dialog open={pagarSalarioDialogOpen} onOpenChange={setPagarSalarioDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handlePagarSalario}>
            <DialogHeader>
              <DialogTitle>Pagar Salario</DialogTitle>
              <DialogDescription>
                {selectedItem && `Empleado: ${selectedItem.nombre} ${selectedItem.apellido}`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mes *</Label>
                  <Select
                    value={pagarSalarioForm.mes.toString()}
                    onValueChange={(value) =>
                      setPagarSalarioForm({ ...pagarSalarioForm, mes: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(2024, i).toLocaleDateString("es", { month: "long" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Año *</Label>
                  <Input
                    type="number"
                    value={pagarSalarioForm.anio}
                    onChange={(e) =>
                      setPagarSalarioForm({
                        ...pagarSalarioForm,
                        anio: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>

              {selectedItem && (
                <div className="bg-blue-50 p-3 rounded">
                  <Label className="text-sm text-gray-600">Salario Base</Label>
                  <p className="text-2xl font-bold text-blue-700">
                    ${selectedItem.salarioBase.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Tipo: {selectedItem.tipoContrato}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horas Trabajadas</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="160"
                    value={pagarSalarioForm.horasTrabajadas}
                    onChange={(e) =>
                      setPagarSalarioForm({ ...pagarSalarioForm, horasTrabajadas: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Horas Extra</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="0"
                    value={pagarSalarioForm.horasExtra}
                    onChange={(e) =>
                      setPagarSalarioForm({ ...pagarSalarioForm, horasExtra: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bonificaciones</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={pagarSalarioForm.bonificaciones}
                    onChange={(e) =>
                      setPagarSalarioForm({ ...pagarSalarioForm, bonificaciones: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Deducciones</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={pagarSalarioForm.deducciones}
                    onChange={(e) =>
                      setPagarSalarioForm({ ...pagarSalarioForm, deducciones: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Método de Pago *</Label>
                <Select
                  value={pagarSalarioForm.metodoPago}
                  onValueChange={(value) =>
                    setPagarSalarioForm({ ...pagarSalarioForm, metodoPago: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={pagarSalarioForm.observaciones}
                  onChange={(e) =>
                    setPagarSalarioForm({ ...pagarSalarioForm, observaciones: e.target.value })
                  }
                  rows={2}
                />
              </div>

              {selectedItem && (
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                    <div>
                      <p className="text-gray-600">Salario Base</p>
                      <p className="font-medium">${selectedItem.salarioBase.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Horas Extra</p>
                      <p className="font-medium">
                        $
                        {(
                          parseFloat(pagarSalarioForm.horasExtra || "0") *
                          (selectedItem.salarioBase / 160) *
                          1.5
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">+ Bonificaciones</p>
                      <p className="font-medium text-green-600">
                        ${parseFloat(pagarSalarioForm.bonificaciones || "0").toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">- Deducciones</p>
                      <p className="font-medium text-red-600">
                        ${parseFloat(pagarSalarioForm.deducciones || "0").toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <p className="text-sm text-gray-600">TOTAL A PAGAR</p>
                    <p className="text-2xl font-bold text-green-700">
                      $
                      {(
                        selectedItem.salarioBase +
                        parseFloat(pagarSalarioForm.horasExtra || "0") *
                          (selectedItem.salarioBase / 160) *
                          1.5 +
                        parseFloat(pagarSalarioForm.bonificaciones || "0") -
                        parseFloat(pagarSalarioForm.deducciones || "0")
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPagarSalarioDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4 mr-2" />
                )}
                Registrar Pago
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Asignar Usuario a Rol */}
      <Dialog open={asignarUsuarioDialogOpen} onOpenChange={setAsignarUsuarioDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAsignarUsuario}>
            <DialogHeader>
              <DialogTitle>Asignar Usuario al Rol</DialogTitle>
              <DialogDescription>
                {selectedItem && `Rol: ${selectedItem.nombre}`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedItem && (
                <div className="bg-indigo-50 p-3 rounded">
                  <p className="font-medium text-indigo-900">{selectedItem.nombre}</p>
                  {selectedItem.descripcion && (
                    <p className="text-sm text-indigo-700 mt-1">{selectedItem.descripcion}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Email del Usuario *</Label>
                <Input
                  type="email"
                  placeholder="usuario@email.com"
                  value={asignarUsuarioForm.usuarioEmail}
                  onChange={(e) =>
                    setAsignarUsuarioForm({ ...asignarUsuarioForm, usuarioEmail: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-gray-500">
                  Se enviará una invitación al email del usuario
                </p>
              </div>

              <div className="space-y-2">
                <Label>Mensaje Personalizado</Label>
                <Textarea
                  placeholder="Escribe un mensaje para el usuario..."
                  value={asignarUsuarioForm.mensaje}
                  onChange={(e) =>
                    setAsignarUsuarioForm({ ...asignarUsuarioForm, mensaje: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAsignarUsuarioDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Users className="h-4 w-4 mr-2" />
                )}
                Enviar Invitación
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Ver Trabajos de Contratista */}
      <Dialog open={verTrabajosDialogOpen} onOpenChange={setVerTrabajosDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Trabajos Asignados</DialogTitle>
            <DialogDescription>
              {selectedItem && `Contratista: ${selectedItem.nombre}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {actionLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Cargando trabajos...</p>
              </div>
            ) : trabajosContratista.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No hay trabajos asignados</p>
              </div>
            ) : (
              trabajosContratista.map((trabajo) => (
                <Card key={trabajo.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{trabajo.titulo}</CardTitle>
                      <Badge
                        className={
                          trabajo.estado === "Completado"
                            ? "bg-green-500"
                            : trabajo.estado === "EnProgreso"
                            ? "bg-blue-500"
                            : trabajo.estado === "Pendiente"
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                        }
                      >
                        {trabajo.estado}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-gray-600">{trabajo.descripcion}</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Tipo</p>
                        <p className="font-medium">{trabajo.tipo}</p>
                      </div>
                      {trabajo.loteNombre && (
                        <div>
                          <p className="text-gray-500">Lote</p>
                          <p className="font-medium">{trabajo.loteNombre}</p>
                        </div>
                      )}
                      {trabajo.monto && (
                        <div>
                          <p className="text-gray-500">Monto</p>
                          <p className="font-bold text-green-600">${trabajo.monto.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                    {trabajo.fechaCompletado && (
                      <p className="text-xs text-gray-500">
                        Completado: {formatDate(trabajo.fechaCompletado)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerTrabajosDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card Final: Resumen del Módulo */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">
                Módulo de Finanzas y Administración 100% Completo
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Sistema profesional con: OCR automático con Claude Vision • Motor de costos
                real-time • Activos fijos con depreciación automática • Márgenes brutos en tiempo
                real • Multi-moneda • Facturación completa • Cuentas por pagar • Gestión laboral •
                Roles y permisos • Portal de contratistas • Reportes profesionales • Búsqueda y
                filtros avanzados • Edición y eliminación • Paginación • Exportación a PDF/CSV
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}