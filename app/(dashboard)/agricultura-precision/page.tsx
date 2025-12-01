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
  Map, 
  Plus, 
  Trash2, 
  Satellite,
  MapPin,
  Layers,
  TrendingUp,
  Download,
  Eye,
  Calendar,
  RefreshCw,
} from "lucide-react";
import dynamic from "next/dynamic";
import { formatDate } from "@/lib/utils";
import AnalizadorNDVI from "@/components/AnalizadorNDVI";

// Importar mapa dinámicamente (solo en cliente)
const MapaPrecision = dynamic(() => import("@/components/MapaPrecision"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  ),
});

type Lote = {
  id: string;
  nombre: string;
  hectareas: number;
  cultivo: string | null;
  coordenadas: string | null;
  centroLatitud: number | null;
  centroLongitud: number | null;
  marcadoresGeo?: MarcadorGeo[];
  imagenesSatelitales?: any[];
};

type MarcadorGeo = {
  id: string;
  latitud: number;
  longitud: number;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
};

export default function AgriculturaPrecisionPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [marcadores, setMarcadores] = useState<MarcadorGeo[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [loteDialogOpen, setLoteDialogOpen] = useState(false);
  const [marcadorDialogOpen, setMarcadorDialogOpen] = useState(false);
  const [vistaMapaCompleto, setVistaMapaCompleto] = useState(true);

  // NUEVO: Estados para NDVI
  const [imagenesSatelitales, setImagenesSatelitales] = useState<any[]>([]);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<any>(null);
  const [generandoNDVI, setGenerandoNDVI] = useState(false);

  const [loteForm, setLoteForm] = useState({
    nombre: "",
    hectareas: "",
    cultivo: "",
  });

  const [marcadorForm, setMarcadorForm] = useState({
    tipo: "Observación",
    titulo: "",
    descripcion: "",
    responsable: "",
  });

  const [coordenadasTemporal, setCoordenadasTemporal] = useState<any>(null);
  const [hectareasTemporal, setHectareasTemporal] = useState<number>(0);
  const [marcadorTemporal, setMarcadorTemporal] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    fetchLotes();
  }, []);

  const fetchLotes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/lotes");
      if (response.ok) {
        const data = await response.json();
        setLotes(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarcadores = async (loteId?: string) => {
    try {
      const url = loteId ? `/api/marcadores-geo?loteId=${loteId}` : "/api/marcadores-geo";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMarcadores(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // NUEVO: Fetch imágenes satelitales
  const fetchImagenes = async (loteId?: string) => {
    try {
      const url = loteId ? `/api/imagenes-satelitales?loteId=${loteId}` : "/api/imagenes-satelitales";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setImagenesSatelitales(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // NUEVO: Generar NDVI
  const generarNDVI = async () => {
    if (!loteSeleccionado) {
      alert("Seleccioná un lote primero");
      return;
    }

    try {
      setGenerandoNDVI(true);
      const response = await fetch("/api/imagenes-satelitales/generar-ndvi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loteId: loteSeleccionado.id,
          fecha: new Date().toISOString(),
          tipoIndice: "NDVI",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setImagenSeleccionada(data);
        fetchImagenes(loteSeleccionado.id);
        fetchLotes();
        alert("Análisis NDVI generado exitosamente");
      } else {
        const error = await response.json();
        alert(error.error || "Error al generar NDVI");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar análisis NDVI");
    } finally {
      setGenerandoNDVI(false);
    }
  };

  // NUEVO: Eliminar imagen
  const eliminarImagen = async (id: string) => {
    if (!confirm("¿Eliminar esta imagen?")) return;
    try {
      const response = await fetch(`/api/imagenes-satelitales/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchImagenes(loteSeleccionado?.id);
        fetchLotes();
        if (imagenSeleccionada?.id === id) {
          setImagenSeleccionada(null);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleLoteCreado = (coordenadas: any, hectareas: number) => {
    setCoordenadasTemporal(coordenadas);
    setHectareasTemporal(hectareas);
    setLoteForm({ ...loteForm, hectareas: hectareas.toFixed(2) });
    setLoteDialogOpen(true);
  };

  const handleMarcadorCreado = (lat: number, lon: number) => {
    setMarcadorTemporal({ lat, lon });
    setMarcadorDialogOpen(true);
  };

  const handleCreateLote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calcular centro del polígono
      let centroLat = null;
      let centroLon = null;

      if (coordenadasTemporal?.geometry?.coordinates?.[0]) {
        const coords = coordenadasTemporal.geometry.coordinates[0];
        const lats = coords.map((c: number[]) => c[1]);
        const lons = coords.map((c: number[]) => c[0]);
        centroLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length;
        centroLon = lons.reduce((a: number, b: number) => a + b, 0) / lons.length;
      }

      const response = await fetch("/api/lotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...loteForm,
          coordenadas: coordenadasTemporal,
          centroLatitud: centroLat,
          centroLongitud: centroLon,
        }),
      });

      if (response.ok) {
        setLoteDialogOpen(false);
        setLoteForm({ nombre: "", hectareas: "", cultivo: "" });
        setCoordenadasTemporal(null);
        fetchLotes();
        alert("Lote creado exitosamente");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear lote");
    }
  };

  const handleCreateMarcador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteSeleccionado || !marcadorTemporal) {
      alert("Seleccioná un lote primero");
      return;
    }

    try {
      const response = await fetch("/api/marcadores-geo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loteId: loteSeleccionado.id,
          latitud: marcadorTemporal.lat,
          longitud: marcadorTemporal.lon,
          ...marcadorForm,
        }),
      });

      if (response.ok) {
        setMarcadorDialogOpen(false);
        setMarcadorForm({
          tipo: "Observación",
          titulo: "",
          descripcion: "",
          responsable: "",
        });
        setMarcadorTemporal(null);
        fetchMarcadores(loteSeleccionado.id);
        fetchLotes();
        alert("Marcador creado exitosamente");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear marcador");
    }
  };

  const eliminarLote = async (id: string) => {
    if (!confirm("¿Eliminar este lote?")) return;
    try {
      const response = await fetch(`/api/lotes/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchLotes();
        if (loteSeleccionado?.id === id) {
          setLoteSeleccionado(null);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarMarcador = async (id: string) => {
    if (!confirm("¿Eliminar este marcador?")) return;
    try {
      const response = await fetch(`/api/marcadores-geo/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchMarcadores(loteSeleccionado?.id);
        fetchLotes();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agricultura de Precisión</h1>
          <p className="text-gray-600 mt-2">
            Mapeo satelital, georreferenciación y análisis de cultivos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={vistaMapaCompleto ? "default" : "outline"}
            onClick={() => setVistaMapaCompleto(true)}
          >
            <Map className="h-4 w-4 mr-2" />
            Vista Mapa
          </Button>
          <Button
            variant={!vistaMapaCompleto ? "default" : "outline"}
            onClick={() => setVistaMapaCompleto(false)}
          >
            <Layers className="h-4 w-4 mr-2" />
            Vista Lista
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Lotes
            </CardTitle>
            <Map className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lotes.length}</div>
            <p className="text-xs text-gray-500 mt-1">Georreferenciados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Hectáreas Totales
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lotes.reduce((sum, l) => sum + l.hectareas, 0).toFixed(1)}
            </div>
            <p className="text-xs text-gray-500 mt-1">En producción</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Marcadores
            </CardTitle>
            <MapPin className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lotes.reduce((sum, l) => sum + (l.marcadoresGeo?.length || 0), 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Observaciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Imágenes Satelitales
            </CardTitle>
            <Satellite className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lotes.reduce((sum, l) => sum + (l.imagenesSatelitales?.length || 0), 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Disponibles</p>
          </CardContent>
        </Card>
      </div>

      {vistaMapaCompleto ? (
        /* VISTA MAPA COMPLETO */
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Mapa */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle>Mapa de Lotes</CardTitle>
                <CardDescription>
                  Dibujá polígonos para crear lotes o marcadores para observaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)]">
                <MapaPrecision
                  lotes={lotes}
                  onLoteCreado={handleLoteCreado}
                  onMarcadorCreado={handleMarcadorCreado}
                  modoEdicion={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lotes Activos</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Cargando...</div>
                ) : lotes.length === 0 ? (
                  <div className="text-center py-8">
                    <Map className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm">No hay lotes creados</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Dibujá un polígono en el mapa
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {lotes.map((lote) => (
                      <div
                        key={lote.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          loteSeleccionado?.id === lote.id
                            ? "bg-green-50 border-green-500"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setLoteSeleccionado(lote);
                          fetchMarcadores(lote.id);
                          fetchImagenes(lote.id);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{lote.nombre}</p>
                            <p className="text-sm text-gray-600">
                              {lote.hectareas} ha
                              {lote.cultivo && ` • ${lote.cultivo}`}
                            </p>
                            {lote.coordenadas && (
                              <Badge variant="outline" className="text-xs mt-1">
                                <Map className="h-3 w-3 mr-1" />
                                Georreferenciado
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarLote(lote.id);
                            }}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {(lote.marcadoresGeo && lote.marcadoresGeo.length > 0) && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-gray-500">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {lote.marcadoresGeo.length} marcador(es)
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {loteSeleccionado && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Marcadores</CardTitle>
                  <CardDescription>{loteSeleccionado.nombre}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {loteSeleccionado.marcadoresGeo && loteSeleccionado.marcadoresGeo.length > 0 ? (
                      loteSeleccionado.marcadoresGeo.map((marcador) => (
                        <div
                          key={marcador.id}
                          className="p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{marcador.tipo}</Badge>
                              </div>
                              <p className="font-medium text-sm">{marcador.titulo}</p>
                              {marcador.descripcion && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {marcador.descripcion}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(marcador.fecha)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => eliminarMarcador(marcador.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <MapPin className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500 text-sm">No hay marcadores</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* NUEVO: Card de Análisis NDVI */}
            {loteSeleccionado && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Análisis NDVI</CardTitle>
                      <CardDescription>{loteSeleccionado.nombre}</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={generarNDVI}
                      disabled={generandoNDVI || !loteSeleccionado.coordenadas}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {generandoNDVI ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Satellite className="h-4 w-4 mr-2" />
                          Generar NDVI
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!loteSeleccionado.coordenadas ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        El lote debe estar georreferenciado
                      </p>
                    </div>
                  ) : loteSeleccionado.imagenesSatelitales && loteSeleccionado.imagenesSatelitales.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {loteSeleccionado.imagenesSatelitales.map((img: any) => (
                        <div
                          key={img.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            imagenSeleccionada?.id === img.id
                              ? "bg-purple-50 border-purple-500"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => setImagenSeleccionada(img)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{img.tipoIndice}</Badge>
                                {img.ndviPromedio && (
                                  <Badge className={
                                    img.ndviPromedio >= 0.7
                                      ? "bg-green-500"
                                      : img.ndviPromedio >= 0.5
                                      ? "bg-green-400"
                                      : "bg-yellow-500"
                                  }>
                                    {img.ndviPromedio.toFixed(3)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">
                                {formatDate(img.fecha)} • {img.fuente}
                              </p>
                              {img.areaVerde && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Área saludable: {img.areaVerde.toFixed(1)}%
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                eliminarImagen(img.id);
                              }}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Satellite className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">No hay análisis NDVI</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Generá el primer análisis
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* VISTA LISTA */
        <Card>
          <CardHeader>
            <CardTitle>Listado de Lotes</CardTitle>
            <CardDescription>Todos los lotes registrados</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : lotes.length === 0 ? (
              <div className="text-center py-8">
                <Map className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No hay lotes creados</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lotes.map((lote) => (
                  <Card key={lote.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{lote.nombre}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {lote.hectareas} ha
                            {lote.cultivo && ` • ${lote.cultivo}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarLote(lote.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {lote.coordenadas && (
                          <Badge variant="outline" className="text-xs">
                            <Map className="h-3 w-3 mr-1" />
                            Georreferenciado
                          </Badge>
                        )}
                        {(lote.marcadoresGeo && lote.marcadoresGeo.length > 0) && (
                          <p className="text-xs text-gray-500">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {lote.marcadoresGeo.length} marcador(es)
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog Crear Lote */}
      <Dialog open={loteDialogOpen} onOpenChange={setLoteDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateLote}>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Lote</DialogTitle>
              <DialogDescription>
                Área calculada: {hectareasTemporal.toFixed(2)} ha
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre del Lote *</Label>
                <Input
                  placeholder="Ej: Lote Norte"
                  value={loteForm.nombre}
                  onChange={(e) => setLoteForm({ ...loteForm, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hectáreas *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={loteForm.hectareas}
                    onChange={(e) => setLoteForm({ ...loteForm, hectareas: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cultivo Actual</Label>
                  <Input
                    placeholder="Ej: Soja"
                    value={loteForm.cultivo}
                    onChange={(e) => setLoteForm({ ...loteForm, cultivo: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLoteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Crear Lote
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Crear Marcador */}
      <Dialog open={marcadorDialogOpen} onOpenChange={setMarcadorDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateMarcador}>
            <DialogHeader>
              <DialogTitle>Nuevo Marcador Georreferenciado</DialogTitle>
              <DialogDescription>
                {loteSeleccionado ? loteSeleccionado.nombre : "Seleccioná un lote primero"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={marcadorForm.tipo}
                    onValueChange={(value) => setMarcadorForm({ ...marcadorForm, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Observación">Observación</SelectItem>
                      <SelectItem value="Problema">Problema</SelectItem>
                      <SelectItem value="Foto">Foto</SelectItem>
                      <SelectItem value="Muestra">Muestra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Responsable</Label>
                  <Input
                    placeholder="Nombre"
                    value={marcadorForm.responsable}
                    onChange={(e) =>
                      setMarcadorForm({ ...marcadorForm, responsable: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  placeholder="Ej: Maleza detectada"
                  value={marcadorForm.titulo}
                  onChange={(e) => setMarcadorForm({ ...marcadorForm, titulo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Detalles adicionales..."
                  value={marcadorForm.descripcion}
                  onChange={(e) =>
                    setMarcadorForm({ ...marcadorForm, descripcion: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMarcadorDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Guardar Marcador
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* NUEVO: Dialog Análisis NDVI Completo */}
      {imagenSeleccionada && (
        <Dialog open={!!imagenSeleccionada} onOpenChange={() => setImagenSeleccionada(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Análisis Completo NDVI</DialogTitle>
              <DialogDescription>
                {loteSeleccionado?.nombre} • {formatDate(imagenSeleccionada.fecha)}
              </DialogDescription>
            </DialogHeader>
            <AnalizadorNDVI imagen={imagenSeleccionada} />
          </DialogContent>
        </Dialog>
      )}

      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Satellite className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Agricultura de Precisión</p>
              <p className="text-sm text-green-700 mt-1">
                Dibujá polígonos en el mapa para crear lotes georreferenciados. Las hectáreas
                se calculan automáticamente. Agregá marcadores para documentar observaciones,
                problemas o puntos de muestreo con precisión GPS. Generá análisis NDVI satelital
                para monitorear la salud de tus cultivos en tiempo real.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}