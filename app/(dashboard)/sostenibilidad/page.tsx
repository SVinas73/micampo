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
  Leaf,
  FileText,
  ShieldCheck,
  Globe,
  TrendingDown,
  Plus,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download,
  Send,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  BarChart3,
  MapPin,
  Sprout,
  Award,
  FileCheck,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// ============================================
// TYPES
// ============================================

interface HuellaCarbono {
  id: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  emisionesCombustible: number;
  emisionesFertilizantes: number;
  emisionesAgroquimicos: number;
  emisionesGanaderia: number;
  emisionesElectricidad: number;
  emisionesTransporte: number;
  emisionesTotales: number;
  emisionesPorHectarea: number;
  emisionesPorTonelada?: number;
  tendencia?: string;
  metodologiaCalculo: string;
  certificado: boolean;
  createdAt: string;
  distribucion?: any;
}

interface RecetaAgronomica {
  id: string;
  numeroReceta: string;
  estado: string;
  ingenieroAgronomo: string;
  matriculaProfesional: string;
  cultivo: string;
  hectareas: number;
  diagnostico: string;
  fechaEmision: string;
  fechaVencimiento: string;
  fechaAplicacion?: string;
  productos: RecetaProducto[];
  lote?: any;
}

interface RecetaProducto {
  id: string;
  nombreComercial: string;
  ingredienteActivo: string;
  concentracion: string;
  dosis: number;
  unidadDosis: string;
  dosisTotal: number;
  bandaToxicologica: string;
  tipoProducto: string;
}

interface ReporteAgroquimico {
  id: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  tipoReporte: string;
  numeroReporte?: string;
  totalProductos: number;
  totalLitros: number;
  totalKilos: number;
  totalHectareas: number;
  herbicidas: number;
  insecticidas: number;
  fungicidas: number;
  bandaIa: number;
  bandaIb: number;
  bandaII: number;
  bandaIII: number;
  bandaIV: number;
  estado: string;
  productosDetalle: any;
}

interface Certificacion {
  id: string;
  tipoCertificacion: string;
  numeroCertificado?: string;
  estado: string;
  fechaSolicitud?: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  organismoCertificador: string;
  noConformidadesMayores: number;
  noConformidadesMenures: number;
  _count?: {
    checklistItems: number;
    carpetaDocumentos: number;
  };
}

interface ChecklistItem {
  id: string;
  codigo: string;
  categoria: string;
  descripcion: string;
  nivelRequerido: string;
  cumple: boolean;
  evidencia?: string;
  criticidad: string;
  esNoConformidad: boolean;
}

interface ComplianceEUDR {
  id: string;
  numeroDeclaracion: string;
  producto: string;
  volumenToneladas: number;
  destinoExportacion: string;
  areaHectareas: number;
  sinDeforestacion: boolean;
  estado: string;
  nivelRiesgo?: string;
  cambioDetectado: boolean;
  coberturaBoscosa2019?: number;
  coberturaBoscosa2020?: number;
  coberturaBoscosaActual?: number;
  loteIds: string[];
  lotes?: any[];
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function SostenibilidadPage() {
  // Estados principales
  const [huellas, setHuellas] = useState<HuellaCarbono[]>([]);
  const [recetas, setRecetas] = useState<RecetaAgronomica[]>([]);
  const [reportes, setReportes] = useState<ReporteAgroquimico[]>([]);
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([]);
  const [declaracionesEUDR, setDeclaracionesEUDR] = useState<ComplianceEUDR[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);

  const [selectedHuella, setSelectedHuella] = useState<HuellaCarbono | null>(null);
  const [selectedReceta, setSelectedReceta] = useState<RecetaAgronomica | null>(null);
  const [selectedReporte, setSelectedReporte] = useState<ReporteAgroquimico | null>(null);
  const [selectedCertificacion, setSelectedCertificacion] = useState<Certificacion | null>(null);
  const [selectedEUDR, setSelectedEUDR] = useState<ComplianceEUDR | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialogs
  const [huellaDialogOpen, setHuellaDialogOpen] = useState(false);
  const [recetaDialogOpen, setRecetaDialogOpen] = useState(false);
  const [reporteDialogOpen, setReporteDialogOpen] = useState(false);
  const [certificacionDialogOpen, setCertificacionDialogOpen] = useState(false);
  const [eudrDialogOpen, setEudrDialogOpen] = useState(false);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Formularios
  const [huellaForm, setHuellaForm] = useState({
    periodo: "",
    fechaInicio: "",
    fechaFin: "",
  });

  const [recetaForm, setRecetaForm] = useState({
    ingenieroAgronomo: "",
    matriculaProfesional: "",
    telefonoProfesional: "",
    emailProfesional: "",
    loteId: "",
    cultivo: "",
    variedad: "",
    hectareas: "",
    diagnostico: "",
    plagaEnfermedad: "",
    estadoFenologico: "",
    diasVigencia: "60",
    productos: [] as any[],
  });

  const [productoForm, setProductoForm] = useState({
    nombreComercial: "",
    ingredienteActivo: "",
    concentracion: "",
    registroSenasa: "",
    dosis: "",
    unidadDosis: "L/ha",
    bandaToxicologica: "III",
    tipoProducto: "Herbicida",
  });

  const [reporteForm, setReporteForm] = useState({
    periodo: "",
    fechaInicio: "",
    fechaFin: "",
    tipoReporte: "SENASA",
  });

  const [certificacionForm, setCertificacionForm] = useState({
    tipoCertificacion: "GLOBALG.A.P.",
    esquema: "",
    alcance: [] as string[],
    organismoCertificador: "",
    fechaSolicitud: "",
  });

  const [eudrForm, setEudrForm] = useState({
    producto: "Soja",
    codigoHS: "",
    volumenToneladas: "",
    destinoExportacion: "",
    loteIds: [] as string[],
    sinDeforestacion: false,
  });

  const [checklistForm, setChecklistForm] = useState({
    codigo: "",
    categoria: "",
    subcategoria: "",
    descripcion: "",
    nivelRequerido: "Mayor Must",
    cumple: false,
    evidencia: "",
    criticidad: "Mayor",
  });

  const [establecimientoId, setEstablecimientoId] = useState("");
  const [lotes, setLotes] = useState<any[]>([]);

  // ============================================
  // useEffect - Cargar datos
  // ============================================

  useEffect(() => {
    // Obtener establecimientoId del usuario (simplificado)
    // En producción, obtener del contexto de autenticación
    const fetchUserEstablecimiento = async () => {
      // Placeholder - ajustar según tu implementación
      setEstablecimientoId("clxxxxxxxxxx");
    };
    fetchUserEstablecimiento();
  }, []);

  useEffect(() => {
    if (establecimientoId) {
      fetchAllData();
      fetchLotes();
    }
  }, [establecimientoId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [
        huellasRes,
        recetasRes,
        reportesRes,
        certificacionesRes,
        eudrRes,
        dashboardRes,
      ] = await Promise.all([
        fetch(`/api/sostenibilidad/huella-carbono?establecimientoId=${establecimientoId}`),
        fetch(`/api/sostenibilidad/recetas?establecimientoId=${establecimientoId}`),
        fetch(`/api/sostenibilidad/reportes-agroquimico?establecimientoId=${establecimientoId}`),
        fetch(`/api/sostenibilidad/certificaciones?establecimientoId=${establecimientoId}`),
        fetch(`/api/sostenibilidad/eudr?establecimientoId=${establecimientoId}`),
        fetch(`/api/sostenibilidad/dashboard?establecimientoId=${establecimientoId}`),
      ]);

      if (huellasRes.ok) {
        const data = await huellasRes.json();
        setHuellas(data.huellas || []);
      }

      if (recetasRes.ok) {
        const data = await recetasRes.json();
        setRecetas(data.recetas || []);
      }

      if (reportesRes.ok) {
        const data = await reportesRes.json();
        setReportes(data.reportes || []);
      }

      if (certificacionesRes.ok) {
        const data = await certificacionesRes.json();
        setCertificaciones(data.certificaciones || []);
      }

      if (eudrRes.ok) {
        const data = await eudrRes.json();
        setDeclaracionesEUDR(data.declaraciones || []);
      }

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLotes = async () => {
    try {
      const res = await fetch(`/api/lotes?establecimientoId=${establecimientoId}`);
      if (res.ok) {
        const data = await res.json();
        setLotes(data.lotes || []);
      }
    } catch (error) {
      console.error("Error al cargar lotes:", error);
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

  const formatNumber = (num: number, decimals = 2) => {
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  // ============================================
  // HANDLERS - HUELLA DE CARBONO
  // ============================================

  const handleCalcularHuella = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch("/api/sostenibilidad/huella-carbono", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establecimientoId,
          ...huellaForm,
        }),
      });

      if (res.ok) {
        await fetchAllData();
        setHuellaDialogOpen(false);
        resetHuellaForm();
        alert("Huella de carbono calculada correctamente");
      } else {
        const error = await res.json();
        alert(error.error || "Error al calcular huella");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al calcular huella");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteHuella = async () => {
    if (!selectedHuella) return;

    setActionLoading(true);

    try {
      const res = await fetch(`/api/sostenibilidad/huella-carbono/${selectedHuella.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchAllData();
        setDeleteDialogOpen(false);
        setSelectedHuella(null);
      } else {
        const error = await res.json();
        alert(error.error || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar");
    } finally {
      setActionLoading(false);
    }
  };

  const resetHuellaForm = () => {
    setHuellaForm({
      periodo: "",
      fechaInicio: "",
      fechaFin: "",
    });
  };

  // ============================================
  // HANDLERS - RECETAS AGRONÓMICAS
  // ============================================

  const handleAgregarProducto = () => {
    if (
      !productoForm.nombreComercial ||
      !productoForm.ingredienteActivo ||
      !productoForm.dosis
    ) {
      alert("Complete los campos del producto");
      return;
    }

    const nuevoProducto = { ...productoForm };
    setRecetaForm({
      ...recetaForm,
      productos: [...recetaForm.productos, nuevoProducto],
    });

    // Reset producto form
    setProductoForm({
      nombreComercial: "",
      ingredienteActivo: "",
      concentracion: "",
      registroSenasa: "",
      dosis: "",
      unidadDosis: "L/ha",
      bandaToxicologica: "III",
      tipoProducto: "Herbicida",
    });
  };

  const handleEliminarProducto = (index: number) => {
    const nuevosProductos = recetaForm.productos.filter((_, i) => i !== index);
    setRecetaForm({ ...recetaForm, productos: nuevosProductos });
  };

  const handleCrearReceta = async (e: React.FormEvent) => {
    e.preventDefault();

    if (recetaForm.productos.length === 0) {
      alert("Debe agregar al menos un producto");
      return;
    }

    setActionLoading(true);

    try {
      const res = await fetch("/api/sostenibilidad/recetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establecimientoId,
          ...recetaForm,
        }),
      });

      if (res.ok) {
        await fetchAllData();
        setRecetaDialogOpen(false);
        resetRecetaForm();
        alert("Receta creada correctamente");
      } else {
        const error = await res.json();
        alert(error.error || "Error al crear receta");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear receta");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAprobarReceta = async (recetaId: string) => {
    setActionLoading(true);

    try {
      const res = await fetch(`/api/sostenibilidad/recetas/${recetaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "Aprobada" }),
      });

      if (res.ok) {
        await fetchAllData();
        alert("Receta aprobada");
      } else {
        const error = await res.json();
        alert(error.error || "Error al aprobar");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al aprobar");
    } finally {
      setActionLoading(false);
    }
  };

  const resetRecetaForm = () => {
    setRecetaForm({
      ingenieroAgronomo: "",
      matriculaProfesional: "",
      telefonoProfesional: "",
      emailProfesional: "",
      loteId: "",
      cultivo: "",
      variedad: "",
      hectareas: "",
      diagnostico: "",
      plagaEnfermedad: "",
      estadoFenologico: "",
      diasVigencia: "60",
      productos: [],
    });
  };

  // ============================================
  // HANDLERS - REPORTES AGROQUÍMICOS
  // ============================================

  const handleGenerarReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch("/api/sostenibilidad/reportes-agroquimico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establecimientoId,
          ...reporteForm,
        }),
      });

      if (res.ok) {
        await fetchAllData();
        setReporteDialogOpen(false);
        resetReporteForm();
        alert("Reporte generado correctamente");
      } else {
        const error = await res.json();
        alert(error.error || "Error al generar reporte");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar reporte");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnviarReporte = async (reporteId: string) => {
    const email = prompt("Email del destinatario:");
    if (!email) return;

    const organismo = prompt("Organismo destinatario:");
    const funcionario = prompt("Funcionario receptor:");

    setActionLoading(true);

    try {
      const res = await fetch(
        `/api/sostenibilidad/reportes-agroquimico/${reporteId}/enviar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            organismoDestino: organismo,
            funcionarioReceptor: funcionario,
          }),
        }
      );

      if (res.ok) {
        await fetchAllData();
        alert("Reporte enviado correctamente");
      } else {
        const error = await res.json();
        alert(error.error || "Error al enviar");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al enviar");
    } finally {
      setActionLoading(false);
    }
  };

  const resetReporteForm = () => {
    setReporteForm({
      periodo: "",
      fechaInicio: "",
      fechaFin: "",
      tipoReporte: "SENASA",
    });
  };

  // ============================================
  // HANDLERS - CERTIFICACIONES
  // ============================================

  const handleCrearCertificacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch("/api/sostenibilidad/certificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establecimientoId,
          ...certificacionForm,
        }),
      });

      if (res.ok) {
        await fetchAllData();
        setCertificacionDialogOpen(false);
        resetCertificacionForm();
        alert("Certificación creada correctamente");
      } else {
        const error = await res.json();
        alert(error.error || "Error al crear certificación");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear certificación");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAgregarChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCertificacion) {
      alert("Seleccione una certificación primero");
      return;
    }

    setActionLoading(true);

    try {
      const res = await fetch(
        `/api/sostenibilidad/certificaciones/${selectedCertificacion.id}/checklist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(checklistForm),
        }
      );

      if (res.ok) {
        await fetchChecklistItems(selectedCertificacion.id);
        setChecklistDialogOpen(false);
        resetChecklistForm();
        alert("Item agregado al checklist");
      } else {
        const error = await res.json();
        alert(error.error || "Error al agregar item");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al agregar item");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchChecklistItems = async (certificacionId: string) => {
    try {
      const res = await fetch(
        `/api/sostenibilidad/certificaciones/${certificacionId}/checklist`
      );
      if (res.ok) {
        const data = await res.json();
        setChecklistItems(data.items || []);
      }
    } catch (error) {
      console.error("Error al cargar checklist:", error);
    }
  };

  const resetCertificacionForm = () => {
    setCertificacionForm({
      tipoCertificacion: "GLOBALG.A.P.",
      esquema: "",
      alcance: [],
      organismoCertificador: "",
      fechaSolicitud: "",
    });
  };

  const resetChecklistForm = () => {
    setChecklistForm({
      codigo: "",
      categoria: "",
      subcategoria: "",
      descripcion: "",
      nivelRequerido: "Mayor Must",
      cumple: false,
      evidencia: "",
      criticidad: "Mayor",
    });
  };

  // ============================================
  // HANDLERS - EUDR
  // ============================================

  const handleCrearDeclaracionEUDR = async (e: React.FormEvent) => {
    e.preventDefault();

    if (eudrForm.loteIds.length === 0) {
      alert("Debe seleccionar al menos un lote");
      return;
    }

    setActionLoading(true);

    try {
      const res = await fetch("/api/sostenibilidad/eudr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establecimientoId,
          ...eudrForm,
        }),
      });

      if (res.ok) {
        await fetchAllData();
        setEudrDialogOpen(false);
        resetEudrForm();
        alert("Declaración EUDR creada correctamente");
      } else {
        const error = await res.json();
        alert(error.error || "Error al crear declaración");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear declaración");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLote = (loteId: string) => {
    const index = eudrForm.loteIds.indexOf(loteId);
    if (index === -1) {
      setEudrForm({
        ...eudrForm,
        loteIds: [...eudrForm.loteIds, loteId],
      });
    } else {
      setEudrForm({
        ...eudrForm,
        loteIds: eudrForm.loteIds.filter((id) => id !== loteId),
      });
    }
  };

  const resetEudrForm = () => {
    setEudrForm({
      producto: "Soja",
      codigoHS: "",
      volumenToneladas: "",
      destinoExportacion: "",
      loteIds: [],
      sinDeforestacion: false,
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
          <h1 className="text-3xl font-bold">🌍 Sostenibilidad y Cumplimiento</h1>
          <p className="text-gray-600">
            Gestión de huella de carbono, certificaciones y compliance regulatorio
          </p>
        </div>
      </div>

      {/* KPIs Dashboard */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700">
                Huella de Carbono
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {dashboard.huellaCarbono.ultima?.emisionesTotales
                  ? formatNumber(dashboard.huellaCarbono.ultima.emisionesTotales, 0)
                  : "N/A"}
              </div>
              <p className="text-xs text-gray-600 mt-1">kg CO2e total</p>
              {dashboard.huellaCarbono.tendencia !== 0 && (
                <p
                  className={`text-xs mt-1 ${
                    dashboard.huellaCarbono.tendencia < 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {dashboard.huellaCarbono.tendencia > 0 ? "↑" : "↓"}{" "}
                  {Math.abs(dashboard.huellaCarbono.tendencia).toFixed(1)}%
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700">
                Recetas Agronómicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {dashboard.recetas.total}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {dashboard.recetas.porEstado.aprobadas} aprobadas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700">
                Reportes Agroquímicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {dashboard.reportes.total}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {dashboard.reportes.porEstado.aprobados} aprobados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-700">
                Certificaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">
                {dashboard.certificaciones.porEstado.vigentes}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                de {dashboard.certificaciones.total} total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700">
                Declaraciones EUDR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">
                {dashboard.eudr.total}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {dashboard.eudr.porEstado.aprobadas || 0} aprobadas
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      {/* TABS PRINCIPALES */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="huella">
            <Leaf className="h-4 w-4 mr-2" />
            Huella Carbono
          </TabsTrigger>
          <TabsTrigger value="recetas">
            <FileText className="h-4 w-4 mr-2" />
            Recetas
          </TabsTrigger>
          <TabsTrigger value="reportes">
            <FileCheck className="h-4 w-4 mr-2" />
            Reportes
          </TabsTrigger>
          <TabsTrigger value="certificaciones">
            <Award className="h-4 w-4 mr-2" />
            Certificaciones
          </TabsTrigger>
          <TabsTrigger value="eudr">
            <Globe className="h-4 w-4 mr-2" />
            EUDR
          </TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* TAB 1: DASHBOARD GENERAL */}
        {/* ============================================ */}
        <TabsContent value="dashboard" className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Dashboard de Sostenibilidad</h2>
            <p className="text-gray-600">Resumen completo del módulo</p>
          </div>

          {dashboard && (
            <>
              {/* Gráfico: Evolución Huella de Carbono */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolución de Huella de Carbono</CardTitle>
                  <CardDescription>Últimos 12 períodos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {dashboard.huellaCarbono.historico.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboard.huellaCarbono.historico}>
                          <defs>
                            <linearGradient id="colorEmisiones" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periodo" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="emisionesTotales"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorEmisiones)"
                            name="Emisiones Totales (kg CO2e)"
                          />
                          <Area
                            type="monotone"
                            dataKey="emisionesPorHectarea"
                            stroke="#3b82f6"
                            fillOpacity={0.6}
                            fill="#3b82f6"
                            name="Por Hectárea (kg CO2e/ha)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No hay datos de huella de carbono</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Grid de Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recetas por Estado */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recetas Agronómicas por Estado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                        <span className="text-sm font-medium">Pendientes</span>
                        <Badge className="bg-yellow-600">
                          {dashboard.recetas.porEstado.pendientes}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                        <span className="text-sm font-medium">Aprobadas</span>
                        <Badge className="bg-green-600">
                          {dashboard.recetas.porEstado.aprobadas}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                        <span className="text-sm font-medium">Aplicadas</span>
                        <Badge className="bg-blue-600">
                          {dashboard.recetas.porEstado.aplicadas}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                        <span className="text-sm font-medium">Vencidas</span>
                        <Badge className="bg-red-600">
                          {dashboard.recetas.porEstado.vencidas}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Último Reporte */}
                {dashboard.reportes.ultimo && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Último Reporte de Agroquímicos</CardTitle>
                      <CardDescription>{dashboard.reportes.ultimo.periodo}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Productos Diferentes:</span>
                          <span className="font-bold">
                            {dashboard.reportes.ultimo.totalProductos}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total Litros:</span>
                          <span className="font-bold">
                            {formatNumber(dashboard.reportes.ultimo.totalLitros)} L
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total Kilos:</span>
                          <span className="font-bold">
                            {formatNumber(dashboard.reportes.ultimo.totalKilos)} kg
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Certificaciones Activas */}
              {dashboard.certificaciones.tiposActivas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Certificaciones Vigentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {dashboard.certificaciones.tiposActivas.map(
                        (tipo: string, index: number) => (
                          <Badge key={index} className="bg-green-600 text-white">
                            <Award className="h-3 w-3 mr-1" />
                            {tipo}
                          </Badge>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* EUDR por Riesgo */}
              {dashboard.eudr.total > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Declaraciones EUDR por Nivel de Riesgo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Bajo",
                                value: dashboard.eudr.porRiesgo.bajo,
                                color: "#10b981",
                              },
                              {
                                name: "Medio",
                                value: dashboard.eudr.porRiesgo.medio,
                                color: "#f59e0b",
                              },
                              {
                                name: "Alto",
                                value: dashboard.eudr.porRiesgo.alto,
                                color: "#ef4444",
                              },
                            ]}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 2: HUELLA DE CARBONO */}
        {/* ============================================ */}
        <TabsContent value="huella" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Huella de Carbono</h2>
              <p className="text-gray-600">Cálculo automático de emisiones de GEI</p>
            </div>
            <Button onClick={() => setHuellaDialogOpen(true)} className="bg-green-600">
              <Plus className="h-4 w-4 mr-2" />
              Calcular Nuevo Período
            </Button>
          </div>

          {/* Lista de Huellas Calculadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {huellas.map((huella) => (
              <Card
                key={huella.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedHuella(huella)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{huella.periodo}</CardTitle>
                      <CardDescription>
                        {formatDate(huella.fechaInicio)} - {formatDate(huella.fechaFin)}
                      </CardDescription>
                    </div>
                    {huella.certificado && (
                      <Badge className="bg-green-600">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Certificado
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Emisiones Totales</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatNumber(huella.emisionesTotales, 0)}
                    </p>
                    <p className="text-xs text-gray-600">kg CO2e</p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Por Hectárea:</span>
                    <span className="font-medium">
                      {formatNumber(huella.emisionesPorHectarea, 1)} kg CO2e/ha
                    </span>
                  </div>

                  <div className="pt-2 border-t text-xs text-gray-600">
                    <p>Metodología: {huella.metodologiaCalculo}</p>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHuella(huella);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHuella(huella);
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

          {huellas.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Leaf className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No hay cálculos de huella de carbono</p>
                <Button onClick={() => setHuellaDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Calcular Primer Período
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 3: RECETAS AGRONÓMICAS */}
        {/* ============================================ */}
        <TabsContent value="recetas" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Recetas Agronómicas</h2>
              <p className="text-gray-600">Prescripción legal de agroquímicos</p>
            </div>
            <Button onClick={() => setRecetaDialogOpen(true)} className="bg-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Receta
            </Button>
          </div>

          {/* Filtros por Estado */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Badge className="bg-yellow-600">
                  Pendientes: {recetas.filter((r) => r.estado === "Pendiente").length}
                </Badge>
                <Badge className="bg-green-600">
                  Aprobadas: {recetas.filter((r) => r.estado === "Aprobada").length}
                </Badge>
                <Badge className="bg-blue-600">
                  Aplicadas: {recetas.filter((r) => r.estado === "Aplicada").length}
                </Badge>
                <Badge className="bg-red-600">
                  Vencidas: {recetas.filter((r) => r.estado === "Vencida").length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Recetas */}
          <div className="space-y-3">
            {recetas.map((receta) => (
              <Card
                key={receta.id}
                className={`${
                  receta.estado === "Vencida"
                    ? "border-red-200 bg-red-50"
                    : receta.estado === "Pendiente"
                    ? "border-yellow-200 bg-yellow-50"
                    : ""
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{receta.numeroReceta}</h3>
                        <Badge
                          className={
                            receta.estado === "Pendiente"
                              ? "bg-yellow-600"
                              : receta.estado === "Aprobada"
                              ? "bg-green-600"
                              : receta.estado === "Aplicada"
                              ? "bg-blue-600"
                              : "bg-red-600"
                          }
                        >
                          {receta.estado}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-600">Ingeniero Agrónomo:</p>
                          <p className="font-medium">{receta.ingenieroAgronomo}</p>
                          <p className="text-xs text-gray-500">
                            Mat: {receta.matriculaProfesional}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Cultivo:</p>
                          <p className="font-medium">
                            {receta.cultivo} - {receta.hectareas} ha
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded mb-3">
                        <p className="text-xs text-gray-600 mb-1">Diagnóstico:</p>
                        <p className="text-sm">{receta.diagnostico}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-700">
                          Productos Prescriptos ({receta.productos.length}):
                        </p>
                        {receta.productos.map((prod, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <Badge
                              variant="outline"
                              className={
                                prod.bandaToxicologica === "Ia" ||
                                prod.bandaToxicologica === "Ib"
                                  ? "border-red-500 text-red-700"
                                  : prod.bandaToxicologica === "II"
                                  ? "border-orange-500 text-orange-700"
                                  : "border-blue-500 text-blue-700"
                              }
                            >
                              {prod.bandaToxicologica}
                            </Badge>
                            <span className="font-medium">{prod.nombreComercial}</span>
                            <span className="text-gray-600">
                              - {prod.dosis} {prod.unidadDosis}
                            </span>
                            <span className="text-gray-500">({prod.tipoProducto})</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                        <span>Emisión: {formatDate(receta.fechaEmision)}</span>
                        <span>Vencimiento: {formatDate(receta.fechaVencimiento)}</span>
                        {receta.fechaAplicacion && (
                          <span>Aplicada: {formatDate(receta.fechaAplicacion)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {receta.estado === "Pendiente" && (
                        <Button
                          size="sm"
                          className="bg-green-600"
                          onClick={() => handleAprobarReceta(receta.id)}
                          disabled={actionLoading}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReceta(receta);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {recetas.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No hay recetas agronómicas registradas</p>
                <Button onClick={() => setRecetaDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Receta
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        {/* ============================================ */}
        {/* TAB 4: REPORTES AGROQUÍMICOS */}
        {/* ============================================ */}
        <TabsContent value="reportes" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Reportes de Agroquímicos</h2>
              <p className="text-gray-600">Informes para autoridades (SENASA, MinAgro, etc.)</p>
            </div>
            <Button onClick={() => setReporteDialogOpen(true)} className="bg-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Generar Reporte
            </Button>
          </div>

          {/* Lista de Reportes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportes.map((reporte) => (
              <Card
                key={reporte.id}
                className={`${
                  reporte.estado === "Aprobado"
                    ? "border-green-200 bg-green-50"
                    : reporte.estado === "Enviado"
                    ? "border-blue-200 bg-blue-50"
                    : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{reporte.periodo}</CardTitle>
                      <CardDescription>
                        {formatDate(reporte.fechaInicio)} - {formatDate(reporte.fechaFin)}
                      </CardDescription>
                    </div>
                    <Badge
                      className={
                        reporte.estado === "Borrador"
                          ? "bg-gray-600"
                          : reporte.estado === "Enviado"
                          ? "bg-blue-600"
                          : "bg-green-600"
                      }
                    >
                      {reporte.estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white p-2 rounded">
                      <p className="text-xs text-gray-600">Tipo Reporte</p>
                      <p className="font-medium">{reporte.tipoReporte}</p>
                    </div>
                    {reporte.numeroReporte && (
                      <div className="bg-white p-2 rounded">
                        <p className="text-xs text-gray-600">Nº Reporte</p>
                        <p className="font-medium">{reporte.numeroReporte}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-xs font-medium mb-2">Resumen Cuantitativo:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Productos:</span>
                        <span className="font-medium">{reporte.totalProductos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hectáreas:</span>
                        <span className="font-medium">
                          {formatNumber(reporte.totalHectareas, 0)} ha
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Litros:</span>
                        <span className="font-medium">
                          {formatNumber(reporte.totalLitros, 0)} L
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kilos:</span>
                        <span className="font-medium">
                          {formatNumber(reporte.totalKilos, 0)} kg
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Por Tipo de Producto */}
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium mb-2">Por Tipo:</p>
                    <div className="space-y-1 text-xs">
                      {reporte.herbicidas > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Herbicidas:</span>
                          <span>{formatNumber(reporte.herbicidas, 1)}</span>
                        </div>
                      )}
                      {reporte.insecticidas > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Insecticidas:</span>
                          <span>{formatNumber(reporte.insecticidas, 1)}</span>
                        </div>
                      )}
                      {reporte.fungicidas > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fungicidas:</span>
                          <span>{formatNumber(reporte.fungicidas, 1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Banda Toxicológica */}
                  {(reporte.bandaIa > 0 ||
                    reporte.bandaIb > 0 ||
                    reporte.bandaII > 0) && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium mb-2 text-red-700">
                        ⚠️ Clasificación Toxicológica:
                      </p>
                      <div className="space-y-1 text-xs">
                        {reporte.bandaIa > 0 && (
                          <div className="flex justify-between text-red-700">
                            <span>Banda Ia (Extremadamente peligroso):</span>
                            <span className="font-bold">
                              {formatNumber(reporte.bandaIa, 1)}
                            </span>
                          </div>
                        )}
                        {reporte.bandaIb > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Banda Ib (Altamente peligroso):</span>
                            <span className="font-bold">
                              {formatNumber(reporte.bandaIb, 1)}
                            </span>
                          </div>
                        )}
                        {reporte.bandaII > 0 && (
                          <div className="flex justify-between text-orange-600">
                            <span>Banda II (Moderadamente peligroso):</span>
                            <span className="font-bold">
                              {formatNumber(reporte.bandaII, 1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedReporte(reporte);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalle
                    </Button>
                    {reporte.estado === "Borrador" && (
                      <Button
                        size="sm"
                        className="bg-blue-600"
                        onClick={() => handleEnviarReporte(reporte.id)}
                        disabled={actionLoading}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Enviar
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {reportes.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No hay reportes de agroquímicos generados</p>
                <Button onClick={() => setReporteDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Generar Primer Reporte
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 5: CERTIFICACIONES */}
        {/* ============================================ */}
        <TabsContent value="certificaciones" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Certificaciones de Sostenibilidad</h2>
              <p className="text-gray-600">GLOBALG.A.P., Organic, Rainforest Alliance, etc.</p>
            </div>
            <Button
              onClick={() => setCertificacionDialogOpen(true)}
              className="bg-yellow-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Certificación
            </Button>
          </div>

          {/* Lista de Certificaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificaciones.map((cert) => (
              <Card
                key={cert.id}
                className={`${
                  cert.estado === "Vigente"
                    ? "border-green-200 bg-green-50"
                    : cert.estado === "Por Renovar"
                    ? "border-yellow-200 bg-yellow-50"
                    : cert.estado === "Vencida"
                    ? "border-red-200 bg-red-50"
                    : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        {cert.tipoCertificacion}
                      </CardTitle>
                      {cert.numeroCertificado && (
                        <CardDescription>Nº {cert.numeroCertificado}</CardDescription>
                      )}
                    </div>
                    <Badge
                      className={
                        cert.estado === "Vigente"
                          ? "bg-green-600"
                          : cert.estado === "Por Renovar"
                          ? "bg-yellow-600"
                          : cert.estado === "En Proceso"
                          ? "bg-blue-600"
                          : "bg-red-600"
                      }
                    >
                      {cert.estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="text-gray-600 mb-1">Organismo Certificador:</p>
                    <p className="font-medium">{cert.organismoCertificador}</p>
                  </div>

                  {cert.fechaEmision && cert.fechaVencimiento && (
                    <div className="bg-white p-2 rounded text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Emisión:</span>
                        <span>{formatDate(cert.fechaEmision)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vencimiento:</span>
                        <span
                          className={
                            new Date(cert.fechaVencimiento) < new Date()
                              ? "text-red-600 font-bold"
                              : ""
                          }
                        >
                          {formatDate(cert.fechaVencimiento)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* No Conformidades */}
                  {(cert.noConformidadesMayores > 0 || cert.noConformidadesMenures > 0) && (
                    <div className="bg-red-50 border border-red-200 p-2 rounded text-xs">
                      <p className="font-medium text-red-700 mb-1">
                        No Conformidades Detectadas:
                      </p>
                      {cert.noConformidadesMayores > 0 && (
                        <p className="text-red-700">
                          • Mayores: {cert.noConformidadesMayores}
                        </p>
                      )}
                      {cert.noConformidadesMenures > 0 && (
                        <p className="text-orange-700">
                          • Menores: {cert.noConformidadesMenures}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex gap-2 text-xs">
                    <div className="bg-white p-2 rounded flex-1 text-center">
                      <p className="text-gray-600">Checklist</p>
                      <p className="font-bold text-lg">
                        {cert._count?.checklistItems || 0}
                      </p>
                    </div>
                    <div className="bg-white p-2 rounded flex-1 text-center">
                      <p className="text-gray-600">Documentos</p>
                      <p className="font-bold text-lg">
                        {cert._count?.carpetaDocumentos || 0}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedCertificacion(cert);
                        fetchChecklistItems(cert.id);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCertificacion(cert);
                        setChecklistDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Item
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {certificaciones.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No hay certificaciones registradas</p>
                <Button onClick={() => setCertificacionDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Iniciar Primera Certificación
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 6: EUDR - NO DEFORESTACIÓN */}
        {/* ============================================ */}
        <TabsContent value="eudr" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">EUDR - Compliance de No-Deforestación</h2>
              <p className="text-gray-600">
                Reglamento UE 2023/1115 - Productos libres de deforestación
              </p>
            </div>
            <Button onClick={() => setEudrDialogOpen(true)} className="bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Declaración
            </Button>
          </div>

          {/* Info EUDR */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-1" />
                <div className="text-sm">
                  <p className="font-medium text-orange-900 mb-1">
                    Fecha de corte: 31 de diciembre de 2020
                  </p>
                  <p className="text-orange-800">
                    Todos los productos deben declarar que NO provienen de tierras
                    deforestadas después de esta fecha. Se requiere geolocalización precisa y
                    evidencia satelital.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Declaraciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {declaracionesEUDR.map((declaracion) => (
              <Card
                key={declaracion.id}
                className={`${
                  declaracion.nivelRiesgo === "Alto"
                    ? "border-red-200 bg-red-50"
                    : declaracion.nivelRiesgo === "Medio"
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-green-200 bg-green-50"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {declaracion.numeroDeclaracion}
                      </CardTitle>
                      <CardDescription>{declaracion.producto}</CardDescription>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge
                        className={
                          declaracion.estado === "Aprobado"
                            ? "bg-green-600"
                            : declaracion.estado === "Declarado"
                            ? "bg-blue-600"
                            : "bg-gray-600"
                        }
                      >
                        {declaracion.estado}
                      </Badge>
                      {declaracion.nivelRiesgo && (
                        <Badge
                          variant="outline"
                          className={
                            declaracion.nivelRiesgo === "Alto"
                              ? "border-red-500 text-red-700"
                              : declaracion.nivelRiesgo === "Medio"
                              ? "border-yellow-500 text-yellow-700"
                              : "border-green-500 text-green-700"
                          }
                        >
                          Riesgo: {declaracion.nivelRiesgo}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Volumen:</p>
                      <p className="font-medium">
                        {formatNumber(declaracion.volumenToneladas, 0)} ton
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Destino:</p>
                      <p className="font-medium">{declaracion.destinoExportacion}</p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Geolocalización:</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p>Área total: {formatNumber(declaracion.areaHectareas, 1)} ha</p>
                      <p>Lotes incluidos: {declaracion.loteIds.length}</p>
                    </div>
                  </div>

                  {/* Declaración de No-Deforestación */}
                  <div
                    className={`p-3 rounded ${
                      declaracion.sinDeforestacion
                        ? "bg-green-100 border border-green-300"
                        : "bg-red-100 border border-red-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {declaracion.sinDeforestacion ? (
                        <CheckCircle className="h-4 w-4 text-green-700" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-700" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          declaracion.sinDeforestacion ? "text-green-900" : "text-red-900"
                        }`}
                      >
                        {declaracion.sinDeforestacion
                          ? "✓ Declaración: SIN deforestación"
                          : "⚠ Requiere verificación"}
                      </span>
                    </div>
                  </div>

                  {/* Análisis de Cobertura Boscosa */}
                  {declaracion.coberturaBoscosa2019 !== undefined &&
                    declaracion.coberturaBoscosaActual !== undefined && (
                      <div className="bg-white p-3 rounded">
                        <p className="text-xs font-medium mb-2">Análisis Temporal:</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">2019:</span>
                            <span>
                              {declaracion.coberturaBoscosa2019.toFixed(1)}% cobertura
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">2020 (corte):</span>
                            <span>
                              {declaracion.coberturaBoscosa2020?.toFixed(1)}% cobertura
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Actual:</span>
                            <span>
                              {declaracion.coberturaBoscosaActual.toFixed(1)}% cobertura
                            </span>
                          </div>
                        </div>
                        {declaracion.cambioDetectado && (
                          <p className="text-red-600 text-xs mt-2 font-medium">
                            ⚠ Cambio detectado - Requiere análisis
                          </p>
                        )}
                      </div>
                    )}

                  {/* Acciones */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedEUDR(declaracion);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalle
                    </Button>
                    <Button size="sm" variant="outline">
                      <MapPin className="h-4 w-4 mr-1" />
                      Mapa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {declaracionesEUDR.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Globe className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No hay declaraciones EUDR registradas</p>
                <Button onClick={() => setEudrDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Declaración
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      {/* ============================================ */}
      {/* DIALOGS */}
      {/* ============================================ */}

      {/* Dialog: Calcular Huella de Carbono */}
      <Dialog open={huellaDialogOpen} onOpenChange={setHuellaDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCalcularHuella}>
            <DialogHeader>
              <DialogTitle>Calcular Huella de Carbono</DialogTitle>
              <DialogDescription>
                Cálculo automático basado en combustible, fertilizantes, agroquímicos y
                ganadería registrados
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Período *</Label>
                <Input
                  placeholder="Ej: 2024-Q1, 2024-Enero, 2024-Año"
                  value={huellaForm.periodo}
                  onChange={(e) =>
                    setHuellaForm({ ...huellaForm, periodo: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Inicio *</Label>
                  <Input
                    type="date"
                    value={huellaForm.fechaInicio}
                    onChange={(e) =>
                      setHuellaForm({ ...huellaForm, fechaInicio: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha Fin *</Label>
                  <Input
                    type="date"
                    value={huellaForm.fechaFin}
                    onChange={(e) =>
                      setHuellaForm({ ...huellaForm, fechaFin: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded text-sm">
                <p className="font-medium mb-2">El cálculo incluirá:</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ Combustible de maquinaria (Alcance 1)</li>
                  <li>✓ Fertilizantes aplicados (Alcance 1)</li>
                  <li>✓ Agroquímicos (Alcance 1)</li>
                  <li>✓ Emisiones de ganado - metano (Alcance 1)</li>
                  <li>✓ Electricidad consumida (Alcance 2)</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setHuellaDialogOpen(false);
                  resetHuellaForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600" disabled={actionLoading}>
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Calcular Huella
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nueva Receta Agronómica */}
      <Dialog open={recetaDialogOpen} onOpenChange={setRecetaDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCrearReceta}>
            <DialogHeader>
              <DialogTitle>Nueva Receta Agronómica</DialogTitle>
              <DialogDescription>
                Prescripción legal de agroquímicos - Ingeniero Agrónomo Responsable
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Profesional Responsable */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-3">Profesional Responsable</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ingeniero Agrónomo *</Label>
                    <Input
                      placeholder="Nombre completo"
                      value={recetaForm.ingenieroAgronomo}
                      onChange={(e) =>
                        setRecetaForm({ ...recetaForm, ingenieroAgronomo: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Matrícula Profesional *</Label>
                    <Input
                      placeholder="Número de matrícula"
                      value={recetaForm.matriculaProfesional}
                      onChange={(e) =>
                        setRecetaForm({
                          ...recetaForm,
                          matriculaProfesional: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      placeholder="+598 99 123 456"
                      value={recetaForm.telefonoProfesional}
                      onChange={(e) =>
                        setRecetaForm({
                          ...recetaForm,
                          telefonoProfesional: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="ingeniero@email.com"
                      value={recetaForm.emailProfesional}
                      onChange={(e) =>
                        setRecetaForm({ ...recetaForm, emailProfesional: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Lote y Cultivo */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-3">Lote y Cultivo</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lote</Label>
                    <Select
                      value={recetaForm.loteId}
                      onValueChange={(value) =>
                        setRecetaForm({ ...recetaForm, loteId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un lote" />
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
                    <Label>Cultivo *</Label>
                    <Input
                      placeholder="Ej: Soja, Maíz, Trigo"
                      value={recetaForm.cultivo}
                      onChange={(e) =>
                        setRecetaForm({ ...recetaForm, cultivo: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Variedad</Label>
                    <Input
                      placeholder="Ej: DM 4670"
                      value={recetaForm.variedad}
                      onChange={(e) =>
                        setRecetaForm({ ...recetaForm, variedad: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Hectáreas *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="100"
                      value={recetaForm.hectareas}
                      onChange={(e) =>
                        setRecetaForm({ ...recetaForm, hectareas: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Diagnóstico */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-3">Diagnóstico</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Descripción del Problema *</Label>
                    <Textarea
                      placeholder="Describe el problema a tratar..."
                      value={recetaForm.diagnostico}
                      onChange={(e) =>
                        setRecetaForm({ ...recetaForm, diagnostico: e.target.value })
                      }
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plaga/Enfermedad</Label>
                      <Input
                        placeholder="Nombre científico"
                        value={recetaForm.plagaEnfermedad}
                        onChange={(e) =>
                          setRecetaForm({ ...recetaForm, plagaEnfermedad: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Estado Fenológico</Label>
                      <Input
                        placeholder="Ej: V6, R1, BBCH 65"
                        value={recetaForm.estadoFenologico}
                        onChange={(e) =>
                          setRecetaForm({ ...recetaForm, estadoFenologico: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-3">
                  Productos Prescriptos ({recetaForm.productos.length})
                </h4>

                {/* Formulario para agregar producto */}
                <div className="bg-gray-50 p-4 rounded mb-3">
                  <p className="text-sm font-medium mb-3">Agregar Producto:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Nombre Comercial *</Label>
                      <Input
                        placeholder="Ej: Roundup Max"
                        value={productoForm.nombreComercial}
                        onChange={(e) =>
                          setProductoForm({
                            ...productoForm,
                            nombreComercial: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Ingrediente Activo *</Label>
                      <Input
                        placeholder="Ej: Glifosato"
                        value={productoForm.ingredienteActivo}
                        onChange={(e) =>
                          setProductoForm({
                            ...productoForm,
                            ingredienteActivo: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Concentración</Label>
                      <Input
                        placeholder="Ej: 48% EC"
                        value={productoForm.concentracion}
                        onChange={(e) =>
                          setProductoForm({
                            ...productoForm,
                            concentracion: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Registro SENASA</Label>
                      <Input
                        placeholder="Número de registro"
                        value={productoForm.registroSenasa}
                        onChange={(e) =>
                          setProductoForm({
                            ...productoForm,
                            registroSenasa: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Dosis *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="3"
                        value={productoForm.dosis}
                        onChange={(e) =>
                          setProductoForm({ ...productoForm, dosis: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unidad *</Label>
                      <Select
                        value={productoForm.unidadDosis}
                        onValueChange={(value) =>
                          setProductoForm({ ...productoForm, unidadDosis: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L/ha">L/ha</SelectItem>
                          <SelectItem value="kg/ha">kg/ha</SelectItem>
                          <SelectItem value="cc/100L">cc/100L</SelectItem>
                          <SelectItem value="gr/ha">gr/ha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Banda Toxicológica *</Label>
                      <Select
                        value={productoForm.bandaToxicologica}
                        onValueChange={(value) =>
                          setProductoForm({ ...productoForm, bandaToxicologica: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ia">Ia - Extremadamente peligroso</SelectItem>
                          <SelectItem value="Ib">Ib - Altamente peligroso</SelectItem>
                          <SelectItem value="II">II - Moderadamente peligroso</SelectItem>
                          <SelectItem value="III">III - Ligeramente peligroso</SelectItem>
                          <SelectItem value="IV">IV - Normalmente no peligroso</SelectItem>
                          <SelectItem value="U">U - Improbable peligro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Producto *</Label>
                      <Select
                        value={productoForm.tipoProducto}
                        onValueChange={(value) =>
                          setProductoForm({ ...productoForm, tipoProducto: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Herbicida">Herbicida</SelectItem>
                          <SelectItem value="Insecticida">Insecticida</SelectItem>
                          <SelectItem value="Fungicida">Fungicida</SelectItem>
                          <SelectItem value="Fertilizante">Fertilizante</SelectItem>
                          <SelectItem value="Coadyuvante">Coadyuvante</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleAgregarProducto}
                    className="mt-3 w-full"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </Button>
                </div>

                {/* Lista de productos agregados */}
                {recetaForm.productos.length > 0 && (
                  <div className="space-y-2">
                    {recetaForm.productos.map((prod, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border rounded"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={
                                prod.bandaToxicologica === "Ia" ||
                                prod.bandaToxicologica === "Ib"
                                  ? "bg-red-600"
                                  : prod.bandaToxicologica === "II"
                                  ? "bg-orange-600"
                                  : "bg-blue-600"
                              }
                            >
                              {prod.bandaToxicologica}
                            </Badge>
                            <span className="font-medium text-sm">
                              {prod.nombreComercial}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {prod.ingredienteActivo} - {prod.dosis} {prod.unidadDosis} -{" "}
                            {prod.tipoProducto}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEliminarProducto(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vigencia */}
              <div className="space-y-2">
                <Label>Días de Vigencia *</Label>
                <Input
                  type="number"
                  placeholder="60"
                  value={recetaForm.diasVigencia}
                  onChange={(e) =>
                    setRecetaForm({ ...recetaForm, diasVigencia: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-gray-500">
                  La receta será válida por este período (generalmente 30-60 días)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRecetaDialogOpen(false);
                  resetRecetaForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600" disabled={actionLoading}>
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Crear Receta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Generar Reporte Agroquímico */}
      <Dialog open={reporteDialogOpen} onOpenChange={setReporteDialogOpen}>
        <DialogContent>
          <form onSubmit={handleGenerarReporte}>
            <DialogHeader>
              <DialogTitle>Generar Reporte de Agroquímicos</DialogTitle>
              <DialogDescription>
                Generación automática desde recetas aplicadas en el período
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Período *</Label>
                <Input
                  placeholder="Ej: 2024-Semestre-1, 2024-Trimestre-2"
                  value={reporteForm.periodo}
                  onChange={(e) =>
                    setReporteForm({ ...reporteForm, periodo: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Inicio *</Label>
                  <Input
                    type="date"
                    value={reporteForm.fechaInicio}
                    onChange={(e) =>
                      setReporteForm({ ...reporteForm, fechaInicio: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha Fin *</Label>
                  <Input
                    type="date"
                    value={reporteForm.fechaFin}
                    onChange={(e) =>
                      setReporteForm({ ...reporteForm, fechaFin: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Reporte *</Label>
                <Select
                  value={reporteForm.tipoReporte}
                  onValueChange={(value) =>
                    setReporteForm({ ...reporteForm, tipoReporte: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SENASA">SENASA</SelectItem>
                    <SelectItem value="MinAgro">Ministerio de Agricultura</SelectItem>
                    <SelectItem value="Aduana">Aduana</SelectItem>
                    <SelectItem value="Provincial">Autoridad Provincial</SelectItem>
                    <SelectItem value="Municipal">Autoridad Municipal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 p-3 rounded text-sm">
                <p className="font-medium mb-2">El reporte incluirá:</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ Resumen cuantitativo de productos aplicados</li>
                  <li>✓ Clasificación por tipo (herbicidas, insecticidas, etc.)</li>
                  <li>✓ Clasificación por banda toxicológica</li>
                  <li>✓ Hectáreas tratadas</li>
                  <li>✓ Detalle de cada producto</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReporteDialogOpen(false);
                  resetReporteForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-purple-600" disabled={actionLoading}>
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Generar Reporte
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nueva Certificación */}
      <Dialog open={certificacionDialogOpen} onOpenChange={setCertificacionDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCrearCertificacion}>
            <DialogHeader>
              <DialogTitle>Nueva Certificación</DialogTitle>
              <DialogDescription>
                Iniciar proceso de certificación de sostenibilidad
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Certificación *</Label>
                <Select
                  value={certificacionForm.tipoCertificacion}
                  onValueChange={(value) =>
                    setCertificacionForm({ ...certificacionForm, tipoCertificacion: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GLOBALG.A.P.">GLOBALG.A.P.</SelectItem>
                    <SelectItem value="Organic">Organic (Orgánico)</SelectItem>
                    <SelectItem value="Rainforest Alliance">Rainforest Alliance</SelectItem>
                    <SelectItem value="UTZ">UTZ Certified</SelectItem>
                    <SelectItem value="Fair Trade">Fair Trade</SelectItem>
                    <SelectItem value="ISO 14001">ISO 14001</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Esquema / Sub-protocolo</Label>
                <Input
                  placeholder="Ej: IFA, FSMA"
                  value={certificacionForm.esquema}
                  onChange={(e) =>
                    setCertificacionForm({ ...certificacionForm, esquema: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Organismo Certificador *</Label>
                <Input
                  placeholder="Nombre de la certificadora"
                  value={certificacionForm.organismoCertificador}
                  onChange={(e) =>
                    setCertificacionForm({
                      ...certificacionForm,
                      organismoCertificador: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha de Solicitud</Label>
                <Input
                  type="date"
                  value={certificacionForm.fechaSolicitud}
                  onChange={(e) =>
                    setCertificacionForm({
                      ...certificacionForm,
                      fechaSolicitud: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCertificacionDialogOpen(false);
                  resetCertificacionForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-yellow-600" disabled={actionLoading}>
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Crear Certificación
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Agregar Item Checklist */}
      <Dialog open={checklistDialogOpen} onOpenChange={setChecklistDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAgregarChecklistItem}>
            <DialogHeader>
              <DialogTitle>Agregar Item al Checklist</DialogTitle>
              <DialogDescription>
                Certificación: {selectedCertificacion?.tipoCertificacion}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    placeholder="Ej: AF 1.1"
                    value={checklistForm.codigo}
                    onChange={(e) =>
                      setChecklistForm({ ...checklistForm, codigo: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nivel Requerido *</Label>
                  <Select
                    value={checklistForm.nivelRequerido}
                    onValueChange={(value) =>
                      setChecklistForm({ ...checklistForm, nivelRequerido: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mayor Must">Mayor Must</SelectItem>
                      <SelectItem value="Minor Must">Minor Must</SelectItem>
                      <SelectItem value="Recomendación">Recomendación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Input
                  placeholder="Ej: Trazabilidad, Seguridad Alimentaria"
                  value={checklistForm.categoria}
                  onChange={(e) =>
                    setChecklistForm({ ...checklistForm, categoria: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción *</Label>
                <Textarea
                  placeholder="Describe el requisito..."
                  value={checklistForm.descripcion}
                  onChange={(e) =>
                    setChecklistForm({ ...checklistForm, descripcion: e.target.value })
                  }
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Criticidad *</Label>
                <Select
                  value={checklistForm.criticidad}
                  onValueChange={(value) =>
                    setChecklistForm({ ...checklistForm, criticidad: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mayor">Mayor</SelectItem>
                    <SelectItem value="Menor">Menor</SelectItem>
                    <SelectItem value="Recomendación">Recomendación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cumple"
                  checked={checklistForm.cumple}
                  onChange={(e) =>
                    setChecklistForm({ ...checklistForm, cumple: e.target.checked })
                  }
                />
                <Label htmlFor="cumple">¿Cumple con este requisito?</Label>
              </div>

              {checklistForm.cumple && (
                <div className="space-y-2">
                  <Label>Evidencia</Label>
                  <Textarea
                    placeholder="Describe la evidencia de cumplimiento..."
                    value={checklistForm.evidencia}
                    onChange={(e) =>
                      setChecklistForm({ ...checklistForm, evidencia: e.target.value })
                    }
                    rows={2}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setChecklistDialogOpen(false);
                  resetChecklistForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-yellow-600" disabled={actionLoading}>
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Agregar Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nueva Declaración EUDR */}
      <Dialog open={eudrDialogOpen} onOpenChange={setEudrDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCrearDeclaracionEUDR}>
            <DialogHeader>
              <DialogTitle>Nueva Declaración EUDR</DialogTitle>
              <DialogDescription>
                Declaración de productos libres de deforestación para exportación a UE
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Producto *</Label>
                  <Select
                    value={eudrForm.producto}
                    onValueChange={(value) =>
                      setEudrForm({ ...eudrForm, producto: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Soja">Soja</SelectItem>
                      <SelectItem value="Carne Bovina">Carne Bovina</SelectItem>
                      <SelectItem value="Cacao">Cacao</SelectItem>
                      <SelectItem value="Café">Café</SelectItem>
                      <SelectItem value="Aceite de Palma">Aceite de Palma</SelectItem>
                      <SelectItem value="Caucho">Caucho</SelectItem>
                      <SelectItem value="Madera">Madera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Código HS</Label>
                  <Input
                    placeholder="Código arancelario"
                    value={eudrForm.codigoHS}
                    onChange={(e) =>
                      setEudrForm({ ...eudrForm, codigoHS: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Volumen (Toneladas) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1000"
                    value={eudrForm.volumenToneladas}
                    onChange={(e) =>
                      setEudrForm({ ...eudrForm, volumenToneladas: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Destino (País UE) *</Label>
                  <Input
                    placeholder="Ej: España, Alemania"
                    value={eudrForm.destinoExportacion}
                    onChange={(e) =>
                      setEudrForm({ ...eudrForm, destinoExportacion: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Selección de Lotes */}
              <div className="space-y-2">
                <Label>Lotes Incluidos *</Label>
                <div className="border rounded p-3 max-h-48 overflow-y-auto space-y-2">
                  {lotes.map((lote) => (
                    <label key={lote.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={eudrForm.loteIds.includes(lote.id)}
                        onChange={() => handleToggleLote(lote.id)}
                      />
                      <span className="text-sm">
                        {lote.nombre} ({lote.hectareas} ha)
                        {lote.latitud && lote.longitud && (
                          <span className="text-xs text-gray-500 ml-2">
                            📍 {lote.latitud.toFixed(4)}, {lote.longitud.toFixed(4)}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
                {eudrForm.loteIds.length > 0 && (
                  <p className="text-xs text-gray-600">
                    {eudrForm.loteIds.length} lote(s) seleccionado(s)
                  </p>
                )}
              </div>

              {/* Declaración */}
              <div className="bg-orange-50 border border-orange-200 p-4 rounded">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={eudrForm.sinDeforestacion}
                    onChange={(e) =>
                      setEudrForm({ ...eudrForm, sinDeforestacion: e.target.checked })
                    }
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-orange-900 mb-1">
                      Declaración de No-Deforestación
                    </p>
                    <p className="text-orange-800">
                      Declaro que los productos provienen de tierras que NO han sido
                      deforestadas después del 31 de diciembre de 2020, conforme al
                      Reglamento (UE) 2023/1115.
                    </p>
                  </div>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEudrDialogOpen(false);
                  resetEudrForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-600" disabled={actionLoading}>
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Crear Declaración
              </Button>
            </DialogFooter>
          </form>
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
              Esta acción no se puede deshacer. ¿Estás seguro?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedHuella(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteHuella}
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
    </div>
  );
}