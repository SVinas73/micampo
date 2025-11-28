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
import { Beef, Activity, Scale, Plus, Trash2, Heart } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Animal = {
  id: string;
  caravana: string;
  tipo: string;
  raza: string | null;
  sexo: string;
  fechaNacimiento: string | null;
  pesoNacimiento: number | null;
  estado: string;
  registrosPeso: { peso: number }[];
};

type EventoSanitario = {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  producto: string | null;
  dosis: string | null;
  animal: {
    caravana: string;
  };
};

type RegistroPeso = {
  id: string;
  fecha: string;
  peso: number;
  animal: {
    caravana: string;
  };
};

type EventoReproductivo = {
  id: string;
  tipo: string;
  fecha: string;
  tipoServicio: string | null;
  toroId: string | null;
  semenId: string | null;
  resultado: string | null;
  diasGestacion: number | null;
  numCrias: number | null;
  condicionParto: string | null;
  crias: string | null;
  observaciones: string | null;
  animal: {
    caravana: string;
    raza: string | null;
  };
};

type HistorialReproductivo = {
  id: string;
  totalPartos: number;
  totalCriasNacidas: number;
  totalCriasVivas: number;
  ultimoParto: string | null;
  ultimoServicio: string | null;
  ultimoDiagnostico: string | null;
  estadoActual: string;
  fechaEsperadaParto: string | null;
  animal: {
    caravana: string;
    raza: string | null;
    fechaNacimiento: string | null;
  };
};

const TIPOS_ANIMAL = ["Vacuno", "Ovino", "Porcino", "Equino", "Caprino"];
const RAZAS_VACUNO = ["Aberdeen Angus", "Hereford", "Holando", "Jersey", "Braford", "Brangus"];
const SEXOS = ["Macho", "Hembra"];
const TIPOS_EVENTO = ["Vacunación", "Desparasitación", "Tratamiento", "Revisión"];
const TIPOS_EVENTO_REPRODUCTIVO = ["Celo", "Servicio", "Diagnostico", "Parto", "Destete", "Aborto"];
const TIPOS_SERVICIO = ["Natural", "IA"];
const RESULTADOS_DIAGNOSTICO = ["Preñada", "Vacía"];
const CONDICIONES_PARTO = ["Normal", "Asistido", "Cesárea"];

export default function GanaderiaPage() {
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [eventos, setEventos] = useState<EventoSanitario[]>([]);
  const [registrosPeso, setRegistrosPeso] = useState<RegistroPeso[]>([]);
  const [eventosReproductivos, setEventosReproductivos] = useState<EventoReproductivo[]>([]);
  const [historialesReproductivos, setHistorialesReproductivos] = useState<HistorialReproductivo[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [animalDialogOpen, setAnimalDialogOpen] = useState(false);
  const [eventoDialogOpen, setEventoDialogOpen] = useState(false);
  const [pesoDialogOpen, setPesoDialogOpen] = useState(false);
  const [reproductivoDialogOpen, setReproductivoDialogOpen] = useState(false);

  // Forms
  const [animalForm, setAnimalForm] = useState({
    caravana: "",
    tipo: "",
    raza: "",
    sexo: "",
    fechaNacimiento: "",
    pesoNacimiento: "",
    madre: "",
    padre: "",
  });

  const [eventoForm, setEventoForm] = useState({
    tipo: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    producto: "",
    dosis: "",
    animalId: "",
  });

  const [pesoForm, setPesoForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    peso: "",
    animalId: "",
  });

  const [reproductivoForm, setReproductivoForm] = useState({
    tipo: "",
    fecha: new Date().toISOString().split("T")[0],
    animalId: "",
    tipoServicio: "",
    toroId: "",
    semenId: "",
    resultado: "",
    diasGestacion: "",
    numCrias: "",
    condicionParto: "",
    crias: "",
    observaciones: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchAnimales(),
      fetchEventos(),
      fetchRegistrosPeso(),
      fetchEventosReproductivos(),
      fetchHistorialesReproductivos()
    ]);
    setLoading(false);
  };

  const fetchAnimales = async () => {
    try {
      const response = await fetch("/api/animales");
      if (response.ok) {
        const data = await response.json();
        setAnimales(data);
      }
    } catch (error) {
      console.error("Error al cargar animales:", error);
    }
  };

  const fetchEventos = async () => {
    try {
      const response = await fetch("/api/eventos-sanitarios");
      if (response.ok) {
        const data = await response.json();
        setEventos(data);
      }
    } catch (error) {
      console.error("Error al cargar eventos:", error);
    }
  };

  const fetchRegistrosPeso = async () => {
    try {
      const response = await fetch("/api/registros-peso");
      if (response.ok) {
        const data = await response.json();
        setRegistrosPeso(data);
      }
    } catch (error) {
      console.error("Error al cargar registros:", error);
    }
  };

  const fetchEventosReproductivos = async () => {
    try {
      const response = await fetch("/api/eventos-reproductivos");
      if (response.ok) {
        const data = await response.json();
        setEventosReproductivos(data);
      }
    } catch (error) {
      console.error("Error al cargar eventos reproductivos:", error);
    }
  };

  const fetchHistorialesReproductivos = async () => {
    try {
      const response = await fetch("/api/historial-reproductivo");
      if (response.ok) {
        const data = await response.json();
        setHistorialesReproductivos(data);
      }
    } catch (error) {
      console.error("Error al cargar historiales reproductivos:", error);
    }
  };

  const handleCreateAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/animales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(animalForm),
      });

      if (response.ok) {
        setAnimalDialogOpen(false);
        setAnimalForm({
          caravana: "",
          tipo: "",
          raza: "",
          sexo: "",
          fechaNacimiento: "",
          pesoNacimiento: "",
          madre: "",
          padre: "",
        });
        fetchAnimales();
      }
    } catch (error) {
      console.error("Error al crear animal:", error);
    }
  };

  const handleCreateEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/eventos-sanitarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventoForm),
      });

      if (response.ok) {
        setEventoDialogOpen(false);
        setEventoForm({
          tipo: "",
          descripcion: "",
          fecha: new Date().toISOString().split("T")[0],
          producto: "",
          dosis: "",
          animalId: "",
        });
        fetchEventos();
      }
    } catch (error) {
      console.error("Error al crear evento:", error);
    }
  };

  const handleCreatePeso = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/registros-peso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pesoForm),
      });

      if (response.ok) {
        setPesoDialogOpen(false);
        setPesoForm({
          fecha: new Date().toISOString().split("T")[0],
          peso: "",
          animalId: "",
        });
        fetchRegistrosPeso();
        fetchAnimales();
      }
    } catch (error) {
      console.error("Error al crear registro:", error);
    }
  };

  const handleCreateEventoReproductivo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/eventos-reproductivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reproductivoForm),
      });

      if (response.ok) {
        setReproductivoDialogOpen(false);
        setReproductivoForm({
          tipo: "",
          fecha: new Date().toISOString().split("T")[0],
          animalId: "",
          tipoServicio: "",
          toroId: "",
          semenId: "",
          resultado: "",
          diasGestacion: "",
          numCrias: "",
          condicionParto: "",
          crias: "",
          observaciones: "",
        });
        fetchEventosReproductivos();
        fetchHistorialesReproductivos();
        fetchAnimales();
      }
    } catch (error) {
      console.error("Error al crear evento reproductivo:", error);
    }
  };

  const handleDeleteAnimal = async (id: string) => {
    if (!confirm("¿Eliminar este animal?")) return;
    try {
      const response = await fetch(`/api/animales/${id}`, { method: "DELETE" });
      if (response.ok) fetchAnimales();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteEventoReproductivo = async (id: string) => {
    if (!confirm("¿Eliminar este evento?")) return;
    try {
      const response = await fetch(`/api/eventos-reproductivos/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchEventosReproductivos();
        fetchHistorialesReproductivos();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const animalesActivos = animales.filter((a) => a.estado === "Activo");
  const hembrasActivas = animalesActivos.filter((a) => a.sexo === "Hembra");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ganadería</h1>
        <p className="text-gray-600 mt-2">
          Gestioná tu rodeo, sanidad, peso y reproducción
        </p>
      </div>

      {/* Stats Cards - ACTUALIZADO CON 4 CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Animales
            </CardTitle>
            <Beef className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{animalesActivos.length}</div>
            <p className="text-xs text-gray-500 mt-1">Activos en el rodeo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Hembras Preñadas
            </CardTitle>
            <Heart className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">
              {historialesReproductivos.filter(h => h.estadoActual === "Preñada").length}
            </div>
            <p className="text-xs text-gray-500 mt-1">En gestación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Eventos Sanitarios
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventos.length}</div>
            <p className="text-xs text-gray-500 mt-1">Registros totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Registros de Peso
            </CardTitle>
            <Scale className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registrosPeso.length}</div>
            <p className="text-xs text-gray-500 mt-1">Pesadas realizadas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="animales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="animales">
            <Beef className="h-4 w-4 mr-2" />
            Animales
          </TabsTrigger>
          <TabsTrigger value="reproduccion">
            <Heart className="h-4 w-4 mr-2" />
            Reproducción
          </TabsTrigger>
          <TabsTrigger value="sanidad">
            <Activity className="h-4 w-4 mr-2" />
            Sanidad
          </TabsTrigger>
          <TabsTrigger value="peso">
            <Scale className="h-4 w-4 mr-2" />
            Peso
          </TabsTrigger>
        </TabsList>

        {/* TAB ANIMALES */}
        <TabsContent value="animales">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Animales</CardTitle>
                <CardDescription>Registro individual del rodeo</CardDescription>
              </div>
              <Dialog open={animalDialogOpen} onOpenChange={setAnimalDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Animal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <form onSubmit={handleCreateAnimal}>
                    <DialogHeader>
                      <DialogTitle>Registrar Animal</DialogTitle>
                      <DialogDescription>
                        Agregá un nuevo animal al rodeo
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Caravana *</Label>
                        <Input
                          placeholder="001"
                          value={animalForm.caravana}
                          onChange={(e) => setAnimalForm({ ...animalForm, caravana: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo *</Label>
                        <Select
                          value={animalForm.tipo}
                          onValueChange={(value) => setAnimalForm({ ...animalForm, tipo: value, raza: "" })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_ANIMAL.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Raza</Label>
                        <Select
                          value={animalForm.raza}
                          onValueChange={(value) => setAnimalForm({ ...animalForm, raza: value })}
                          disabled={animalForm.tipo !== "Vacuno"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná raza" />
                          </SelectTrigger>
                          <SelectContent>
                            {RAZAS_VACUNO.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Sexo *</Label>
                        <Select
                          value={animalForm.sexo}
                          onValueChange={(value) => setAnimalForm({ ...animalForm, sexo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná sexo" />
                          </SelectTrigger>
                          <SelectContent>
                            {SEXOS.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha Nacimiento</Label>
                        <Input
                          type="date"
                          value={animalForm.fechaNacimiento}
                          onChange={(e) => setAnimalForm({ ...animalForm, fechaNacimiento: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Peso Nacimiento (kg)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="35"
                          value={animalForm.pesoNacimiento}
                          onChange={(e) => setAnimalForm({ ...animalForm, pesoNacimiento: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Madre (Caravana)</Label>
                        <Input
                          placeholder="002"
                          value={animalForm.madre}
                          onChange={(e) => setAnimalForm({ ...animalForm, madre: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Padre (Caravana)</Label>
                        <Input
                          placeholder="003"
                          value={animalForm.padre}
                          onChange={(e) => setAnimalForm({ ...animalForm, padre: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setAnimalDialogOpen(false)}>
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
              ) : animalesActivos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay animales registrados</p>
                  <Button onClick={() => setAnimalDialogOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar primer animal
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Caravana</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Raza</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Sexo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Nacimiento</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Último Peso</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {animalesActivos.map((animal) => (
                        <tr key={animal.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium">{animal.caravana}</td>
                          <td className="py-3 px-4 text-sm">{animal.tipo}</td>
                          <td className="py-3 px-4 text-sm">{animal.raza || "-"}</td>
                          <td className="py-3 px-4 text-sm">{animal.sexo}</td>
                          <td className="py-3 px-4 text-sm">
                            {animal.fechaNacimiento ? formatDate(animal.fechaNacimiento) : "-"}
                          </td>
                          <td className="py-3 px-4 text-sm text-right">
                            {animal.registrosPeso.length > 0
                              ? `${animal.registrosPeso[0].peso} kg`
                              : animal.pesoNacimiento
                              ? `${animal.pesoNacimiento} kg (nac.)`
                              : "-"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAnimal(animal.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        {/* TAB REPRODUCCIÓN - NUEVO */}
        <TabsContent value="reproduccion">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Eventos Reproductivos</CardTitle>
                <CardDescription>Registro del ciclo reproductivo del rodeo</CardDescription>
              </div>
              <Dialog open={reproductivoDialogOpen} onOpenChange={setReproductivoDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={hembrasActivas.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <form onSubmit={handleCreateEventoReproductivo}>
                    <DialogHeader>
                      <DialogTitle>Registrar Evento Reproductivo</DialogTitle>
                      <DialogDescription>
                        Registrá celo, servicio, diagnóstico o parto
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Animal (Hembra) *</Label>
                          <Select
                            value={reproductivoForm.animalId}
                            onValueChange={(value) => setReproductivoForm({ ...reproductivoForm, animalId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccioná animal" />
                            </SelectTrigger>
                            <SelectContent>
                              {hembrasActivas.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                  {a.caravana} - {a.tipo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo de Evento *</Label>
                          <Select
                            value={reproductivoForm.tipo}
                            onValueChange={(value) => setReproductivoForm({ ...reproductivoForm, tipo: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccioná tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIPOS_EVENTO_REPRODUCTIVO.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Fecha *</Label>
                        <Input
                          type="date"
                          value={reproductivoForm.fecha}
                          onChange={(e) => setReproductivoForm({ ...reproductivoForm, fecha: e.target.value })}
                          required
                        />
                      </div>

                      {/* Campos específicos para Servicio */}
                      {reproductivoForm.tipo === "Servicio" && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded">
                          <div className="space-y-2">
                            <Label>Tipo Servicio</Label>
                            <Select
                              value={reproductivoForm.tipoServicio}
                              onValueChange={(value) => setReproductivoForm({ ...reproductivoForm, tipoServicio: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {TIPOS_SERVICIO.map((t) => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {reproductivoForm.tipoServicio === "Natural" && (
                            <div className="space-y-2">
                              <Label>Toro (Caravana)</Label>
                              <Input
                                placeholder="Caravana del toro"
                                value={reproductivoForm.toroId}
                                onChange={(e) => setReproductivoForm({ ...reproductivoForm, toroId: e.target.value })}
                              />
                            </div>
                          )}
                          {reproductivoForm.tipoServicio === "IA" && (
                            <div className="space-y-2">
                              <Label>ID Semen</Label>
                              <Input
                                placeholder="Identificación del semen"
                                value={reproductivoForm.semenId}
                                onChange={(e) => setReproductivoForm({ ...reproductivoForm, semenId: e.target.value })}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Campos específicos para Diagnóstico */}
                      {reproductivoForm.tipo === "Diagnostico" && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded">
                          <div className="space-y-2">
                            <Label>Resultado</Label>
                            <Select
                              value={reproductivoForm.resultado}
                              onValueChange={(value) => setReproductivoForm({ ...reproductivoForm, resultado: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Resultado" />
                              </SelectTrigger>
                              <SelectContent>
                                {RESULTADOS_DIAGNOSTICO.map((r) => (
                                  <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {reproductivoForm.resultado === "Preñada" && (
                            <div className="space-y-2">
                              <Label>Días de Gestación</Label>
                              <Input
                                type="number"
                                placeholder="60"
                                value={reproductivoForm.diasGestacion}
                                onChange={(e) => setReproductivoForm({ ...reproductivoForm, diasGestacion: e.target.value })}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Campos específicos para Parto */}
                      {reproductivoForm.tipo === "Parto" && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-pink-50 rounded">
                          <div className="space-y-2">
                            <Label>Número de Crías</Label>
                            <Input
                              type="number"
                              placeholder="1"
                              value={reproductivoForm.numCrias}
                              onChange={(e) => setReproductivoForm({ ...reproductivoForm, numCrias: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Condición del Parto</Label>
                            <Select
                              value={reproductivoForm.condicionParto}
                              onValueChange={(value) => setReproductivoForm({ ...reproductivoForm, condicionParto: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Condición" />
                              </SelectTrigger>
                              <SelectContent>
                                {CONDICIONES_PARTO.map((c) => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label>Caravanas de Crías (separadas por coma)</Label>
                            <Input
                              placeholder="Ej: 101, 102"
                              value={reproductivoForm.crias}
                              onChange={(e) => setReproductivoForm({ ...reproductivoForm, crias: e.target.value })}
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Observaciones</Label>
                        <Textarea
                          placeholder="Observaciones adicionales"
                          value={reproductivoForm.observaciones}
                          onChange={(e) => setReproductivoForm({ ...reproductivoForm, observaciones: e.target.value })}
                          rows={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setReproductivoDialogOpen(false)}>
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
              ) : eventosReproductivos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay eventos reproductivos registrados</p>
                  {hembrasActivas.length === 0 ? (
                    <p className="text-sm text-gray-400">Primero registrá hembras en el rodeo</p>
                  ) : (
                    <Button onClick={() => setReproductivoDialogOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar primer evento
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {eventosReproductivos.map((evento) => (
                    <Card key={evento.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{evento.tipo}</CardTitle>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                evento.tipo === "Parto" ? "bg-pink-100 text-pink-800" :
                                evento.tipo === "Servicio" ? "bg-blue-100 text-blue-800" :
                                evento.tipo === "Diagnostico" ? "bg-purple-100 text-purple-800" :
                                "bg-green-100 text-green-800"
                              }`}>
                                {evento.animal.caravana}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(evento.fecha)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEventoReproductivo(evento.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {evento.tipoServicio && (
                            <div><strong>Tipo Servicio:</strong> {evento.tipoServicio}</div>
                          )}
                          {evento.toroId && (
                            <div><strong>Toro:</strong> {evento.toroId}</div>
                          )}
                          {evento.semenId && (
                            <div><strong>Semen:</strong> {evento.semenId}</div>
                          )}
                          {evento.resultado && (
                            <div><strong>Resultado:</strong> {evento.resultado}</div>
                          )}
                          {evento.diasGestacion && (
                            <div><strong>Días Gestación:</strong> {evento.diasGestacion} días</div>
                          )}
                          {evento.numCrias && (
                            <div><strong>Crías:</strong> {evento.numCrias}</div>
                          )}
                          {evento.condicionParto && (
                            <div><strong>Condición Parto:</strong> {evento.condicionParto}</div>
                          )}
                          {evento.crias && (
                            <div><strong>Caravanas Crías:</strong> {evento.crias}</div>
                          )}
                          {evento.observaciones && (
                            <div className="pt-2 border-t"><strong>Observaciones:</strong> {evento.observaciones}</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB SANIDAD */}
        <TabsContent value="sanidad">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Eventos Sanitarios</CardTitle>
                <CardDescription>Vacunaciones, tratamientos y revisiones</CardDescription>
              </div>
              <Dialog open={eventoDialogOpen} onOpenChange={setEventoDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={animalesActivos.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Evento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateEvento}>
                    <DialogHeader>
                      <DialogTitle>Registrar Evento Sanitario</DialogTitle>
                      <DialogDescription>
                        Registrá una vacunación, tratamiento o revisión
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Animal</Label>
                        <Select
                          value={eventoForm.animalId}
                          onValueChange={(value) => setEventoForm({ ...eventoForm, animalId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná animal" />
                          </SelectTrigger>
                          <SelectContent>
                            {animalesActivos.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.caravana} - {a.tipo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select
                          value={eventoForm.tipo}
                          onValueChange={(value) => setEventoForm({ ...eventoForm, tipo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_EVENTO.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                          placeholder="Ej: Vacuna aftosa"
                          value={eventoForm.descripcion}
                          onChange={(e) => setEventoForm({ ...eventoForm, descripcion: e.target.value })}
                          required
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Producto (opcional)</Label>
                        <Input
                          placeholder="Ej: Vacuna Triple"
                          value={eventoForm.producto}
                          onChange={(e) => setEventoForm({ ...eventoForm, producto: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Dosis (opcional)</Label>
                        <Input
                          placeholder="Ej: 2ml"
                          value={eventoForm.dosis}
                          onChange={(e) => setEventoForm({ ...eventoForm, dosis: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha</Label>
                        <Input
                          type="date"
                          value={eventoForm.fecha}
                          onChange={(e) => setEventoForm({ ...eventoForm, fecha: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setEventoDialogOpen(false)}>
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
              ) : eventos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay eventos registrados</p>
                  {animalesActivos.length === 0 ? (
                    <p className="text-sm text-gray-400">Primero registrá un animal</p>
                  ) : (
                    <Button onClick={() => setEventoDialogOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar primer evento
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Animal</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Descripción</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Producto</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Dosis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventos.map((evento) => (
                        <tr key={evento.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{formatDate(evento.fecha)}</td>
                          <td className="py-3 px-4 text-sm font-medium">{evento.animal.caravana}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {evento.tipo}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">{evento.descripcion}</td>
                          <td className="py-3 px-4 text-sm">{evento.producto || "-"}</td>
                          <td className="py-3 px-4 text-sm">{evento.dosis || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB PESO */}
        <TabsContent value="peso">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Registros de Peso</CardTitle>
                <CardDescription>Control de evolución de peso</CardDescription>
              </div>
              <Dialog open={pesoDialogOpen} onOpenChange={setPesoDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={animalesActivos.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Peso
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreatePeso}>
                    <DialogHeader>
                      <DialogTitle>Registrar Peso</DialogTitle>
                      <DialogDescription>
                        Registrá una pesada de animal
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Animal</Label>
                        <Select
                          value={pesoForm.animalId}
                          onValueChange={(value) => setPesoForm({ ...pesoForm, animalId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná animal" />
                          </SelectTrigger>
                          <SelectContent>
                            {animalesActivos.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.caravana} - {a.tipo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha</Label>
                        <Input
                          type="date"
                          value={pesoForm.fecha}
                          onChange={(e) => setPesoForm({ ...pesoForm, fecha: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Peso (kg)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="250"
                          value={pesoForm.peso}
                          onChange={(e) => setPesoForm({ ...pesoForm, peso: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setPesoDialogOpen(false)}>
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
              ) : registrosPeso.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay registros de peso</p>
                  {animalesActivos.length === 0 ? (
                    <p className="text-sm text-gray-400">Primero registrá un animal</p>
                  ) : (
                    <Button onClick={() => setPesoDialogOpen(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar primer peso
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Animal</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Peso (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrosPeso.map((registro) => (
                        <tr key={registro.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{formatDate(registro.fecha)}</td>
                          <td className="py-3 px-4 text-sm font-medium">{registro.animal.caravana}</td>
                          <td className="py-3 px-4 text-sm text-right font-medium text-green-600">
                            {registro.peso.toLocaleString()} kg
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
      </Tabs>
    </div>
  );
}