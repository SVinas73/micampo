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
import { Badge } from "@/components/ui/badge";
import { 
  QrCode, 
  Plus, 
  Trash2, 
  Shield,
  Eye,
  Link2,
  CheckCircle,
  Calendar,
  MapPin,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import QRCode from "qrcode";

type RegistroTrazabilidad = {
  id: string;
  codigoQR: string;
  tipoProducto: string;
  nombreProducto: string;
  loteProduccion: string | null;
  campo: string | null;
  ubicacion: string | null;
  certificaciones: string | null;
  hashBlockchain: string;
  estado: string;
  timestamp: string;
  etapas: EtapaTrazabilidad[];
};

type EtapaTrazabilidad = {
  id: string;
  etapa: string;
  descripcion: string;
  fecha: string;
  responsable: string | null;
  ubicacion: string | null;
  datos: string | null;
  hashValidacion: string;
};

export default function TrazabilidadPage() {
  const [registros, setRegistros] = useState<RegistroTrazabilidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [registroDialogOpen, setRegistroDialogOpen] = useState(false);
  const [etapaDialogOpen, setEtapaDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState<RegistroTrazabilidad | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const [registroForm, setRegistroForm] = useState({
    tipoProducto: "",
    nombreProducto: "",
    loteProduccion: "",
    campo: "",
    ubicacion: "",
  });

  const [etapaForm, setEtapaForm] = useState({
    etapa: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    responsable: "",
    ubicacion: "",
  });

  useEffect(() => {
    fetchRegistros();
  }, []);

  const fetchRegistros = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/trazabilidad");
      if (response.ok) {
        const data = await response.json();
        setRegistros(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/trazabilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registroForm),
      });

      if (response.ok) {
        setRegistroDialogOpen(false);
        setRegistroForm({
          tipoProducto: "",
          nombreProducto: "",
          loteProduccion: "",
          campo: "",
          ubicacion: "",
        });
        fetchRegistros();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCreateEtapa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registroSeleccionado) return;

    try {
      const response = await fetch(`/api/trazabilidad/${registroSeleccionado.id}/etapas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(etapaForm),
      });

      if (response.ok) {
        setEtapaDialogOpen(false);
        setEtapaForm({
          etapa: "",
          descripcion: "",
          fecha: new Date().toISOString().split("T")[0],
          responsable: "",
          ubicacion: "",
        });
        fetchRegistros();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarRegistro = async (id: string) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      const response = await fetch(`/api/trazabilidad/${id}`, { method: "DELETE" });
      if (response.ok) fetchRegistros();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const generarQR = async (registro: RegistroTrazabilidad) => {
    try {
      const url = `${window.location.origin}/verificar/${registro.codigoQR}`;
      const qrCode = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
      });
      setQrDataUrl(qrCode);
      setRegistroSeleccionado(registro);
      setQrDialogOpen(true);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const copiarEnlace = (codigo: string) => {
    const url = `${window.location.origin}/verificar/${codigo}`;
    navigator.clipboard.writeText(url);
    alert("Enlace copiado al portapapeles");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trazabilidad Blockchain</h1>
          <p className="text-gray-600 mt-2">
            Sistema de trazabilidad inmutable desde el campo al consumidor
          </p>
        </div>
        <Dialog open={registroDialogOpen} onOpenChange={setRegistroDialogOpen}>
          <DialogTrigger asChild>
            <button className="mc-btn mc-btn--primary">
              <Plus className="h-4 w-4" />
              Nuevo Producto
            </button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateRegistro}>
              <DialogHeader>
                <DialogTitle>Registrar Producto en Blockchain</DialogTitle>
                <DialogDescription>
                  Creá un registro inmutable de trazabilidad
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Producto *</Label>
                    <Select
                      value={registroForm.tipoProducto}
                      onValueChange={(value) => setRegistroForm({ ...registroForm, tipoProducto: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Soja">Soja</SelectItem>
                        <SelectItem value="Trigo">Trigo</SelectItem>
                        <SelectItem value="Maíz">Maíz</SelectItem>
                        <SelectItem value="Leche">Leche</SelectItem>
                        <SelectItem value="Carne">Carne</SelectItem>
                        <SelectItem value="Girasol">Girasol</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre del Producto *</Label>
                    <Input
                      placeholder="Ej: Soja Orgánica Premium"
                      value={registroForm.nombreProducto}
                      onChange={(e) => setRegistroForm({ ...registroForm, nombreProducto: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lote de Producción</Label>
                    <Input
                      placeholder="Ej: LOTE-2024-001"
                      value={registroForm.loteProduccion}
                      onChange={(e) => setRegistroForm({ ...registroForm, loteProduccion: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Campo</Label>
                    <Input
                      placeholder="Nombre del establecimiento"
                      value={registroForm.campo}
                      onChange={(e) => setRegistroForm({ ...registroForm, campo: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Input
                    placeholder="Coordenadas GPS o descripción"
                    value={registroForm.ubicacion}
                    onChange={(e) => setRegistroForm({ ...registroForm, ubicacion: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRegistroDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Registrar en Blockchain
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
              Productos Registrados
            </CardTitle>
            <QrCode className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registros.length}</div>
            <p className="text-xs text-gray-500 mt-1">En blockchain</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Etapas Totales
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registros.reduce((sum, r) => sum + r.etapas.length, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Verificadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Productos Activos
            </CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registros.filter(r => r.estado === "Activo").length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Trazables</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registros de Trazabilidad</CardTitle>
          <CardDescription>Productos con trazabilidad blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : registros.length === 0 ? (
            <div className="text-center py-8">
              <QrCode className="h-12 w-12 mx-auto text-gray-400" />
              <p className="text-gray-500 mt-4 mb-4">No hay productos registrados</p>
              <Button onClick={() => setRegistroDialogOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Registrar primer producto
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {registros.map((registro) => (
                <Card key={registro.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{registro.nombreProducto}</CardTitle>
                          <Badge variant="outline">{registro.tipoProducto}</Badge>
                          {registro.loteProduccion && (
                            <Badge variant="secondary">{registro.loteProduccion}</Badge>
                          )}
                          <Badge className="bg-green-100 text-green-800">
                            {registro.estado}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <QrCode className="h-4 w-4" />
                          {registro.codigoQR}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generarQR(registro)}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          Ver QR
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copiarEnlace(registro.codigoQR)}
                        >
                          <Link2 className="h-4 w-4 mr-2" />
                          Copiar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            setRegistroSeleccionado(registro);
                            setEtapaDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Etapa
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => eliminarRegistro(registro.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      {registro.campo && (
                        <div>
                          <p className="text-xs text-gray-500">Campo</p>
                          <p className="text-sm font-medium">{registro.campo}</p>
                        </div>
                      )}
                      {registro.ubicacion && (
                        <div>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Ubicación
                          </p>
                          <p className="text-sm font-medium">{registro.ubicacion}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Registrado
                        </p>
                        <p className="text-sm font-medium">{formatDate(registro.timestamp)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Etapas</p>
                        <p className="text-sm font-medium">{registro.etapas.length} registradas</p>
                      </div>
                    </div>

                    {registro.etapas.length > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <p className="text-sm font-medium mb-3">Línea de Tiempo:</p>
                        <div className="space-y-2">
                          {registro.etapas.map((etapa, idx) => (
                            <div key={etapa.id} className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{etapa.etapa}</p>
                                <p className="text-xs text-gray-600">{etapa.descripcion}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(etapa.fecha)}
                                  {etapa.responsable && ` • ${etapa.responsable}`}
                                  {etapa.ubicacion && ` • ${etapa.ubicacion}`}
                                </p>
                              </div>
                              <div>
                                <Badge variant="outline" className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Verificado
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Hash Blockchain:</p>
                      <p className="text-xs font-mono text-gray-700 break-all">
                        {registro.hashBlockchain}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Agregar Etapa */}
      <Dialog open={etapaDialogOpen} onOpenChange={setEtapaDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateEtapa}>
            <DialogHeader>
              <DialogTitle>Agregar Etapa de Trazabilidad</DialogTitle>
              <DialogDescription>
                Registrá una nueva etapa en el blockchain
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Etapa *</Label>
                  <Select
                    value={etapaForm.etapa}
                    onValueChange={(value) => setEtapaForm({ ...etapaForm, etapa: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Siembra">Siembra</SelectItem>
                      <SelectItem value="Fertilización">Fertilización</SelectItem>
                      <SelectItem value="Tratamiento">Tratamiento</SelectItem>
                      <SelectItem value="Cosecha">Cosecha</SelectItem>
                      <SelectItem value="Almacenamiento">Almacenamiento</SelectItem>
                      <SelectItem value="Procesamiento">Procesamiento</SelectItem>
                      <SelectItem value="Transporte">Transporte</SelectItem>
                      <SelectItem value="Distribución">Distribución</SelectItem>
                      <SelectItem value="Venta">Venta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={etapaForm.fecha}
                    onChange={(e) => setEtapaForm({ ...etapaForm, fecha: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descripción *</Label>
                <Textarea
                  placeholder="Describe lo que se hizo en esta etapa"
                  value={etapaForm.descripcion}
                  onChange={(e) => setEtapaForm({ ...etapaForm, descripcion: e.target.value })}
                  required
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsable</Label>
                  <Input
                    placeholder="Nombre del responsable"
                    value={etapaForm.responsable}
                    onChange={(e) => setEtapaForm({ ...etapaForm, responsable: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Input
                    placeholder="Lugar donde ocurrió"
                    value={etapaForm.ubicacion}
                    onChange={(e) => setEtapaForm({ ...etapaForm, ubicacion: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEtapaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Registrar Etapa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog QR Code */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Código QR de Trazabilidad</DialogTitle>
            <DialogDescription>
              Escaneá este código para verificar el producto
            </DialogDescription>
          </DialogHeader>
          {registroSeleccionado && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{registroSeleccionado.nombreProducto}</p>
                <p className="text-xs text-gray-600 mt-1">{registroSeleccionado.codigoQR}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => copiarEnlace(registroSeleccionado.codigoQR)}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Copiar Enlace
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.download = `QR-${registroSeleccionado.codigoQR}.png`;
                    link.href = qrDataUrl;
                    link.click();
                  }}
                >
                  Descargar QR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Trazabilidad Inmutable con Blockchain</p>
              <p className="text-sm text-green-700 mt-1">
                Cada producto y etapa se registra en un blockchain simulado con hash criptográfico SHA-256.
                Una vez registrado, no puede ser modificado ni eliminado, garantizando la autenticidad.
                Los consumidores pueden escanear el código QR para verificar toda la historia del producto.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}