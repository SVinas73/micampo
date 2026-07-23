"use client";

// GANADERÍA / ANIMALES — página principal del rodeo.
// Tabs: Resumen · Ganado · Reproducción · Sanidad · Timeline (según referencia).
// Todos los KPIs y vistas se calculan de datos reales; sin datos demo.

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Tabs, KPI, Icon, useToast } from "@/components/mc";
import {
  AnimalAPI,
  AnimalRow,
  BajaInfo,
  TratamientoAPI,
  TropaLite,
  mapAnimal,
  nfES,
  unidadesAnimal,
} from "@/components/ganaderia/tipos";
import {
  NuevoAnimalModal,
  VerDetalleAnimalModal,
  ModalRegistrarEvento,
} from "@/components/ganaderia/animales-modales";
import { ModalDiagnosticarAnimal } from "@/components/ganaderia/animales-sanidad-modales";
import { AnimResumen, AlertaSanitariaAPI } from "@/components/ganaderia/animales-tab-resumen";
import { AnimGanado } from "@/components/ganaderia/animales-tab-ganado";
import { AnimRepro, kpisRepro } from "@/components/ganaderia/animales-tab-repro";
import { AnimSanidad, StockInsumoAPI } from "@/components/ganaderia/animales-tab-sanidad";
import { AnimTimeline } from "@/components/ganaderia/animales-tab-timeline";

const TABS = ["Resumen", "Ganado", "Reproducción", "Sanidad", "Timeline"];

type PrecioReferenciaAPI = { id: string; producto: string; precio: number; fecha: string };

export default function AnimalesPage() {
  const [tab, setTab] = useState("Resumen");
  const { show, node: toast } = useToast();

  const [animalesAPI, setAnimalesAPI] = useState<AnimalAPI[]>([]);
  const [tropas, setTropas] = useState<TropaLite[]>([]);
  const [tratamientos, setTratamientos] = useState<TratamientoAPI[]>([]);
  const [alertas, setAlertas] = useState<AlertaSanitariaAPI[]>([]);
  const [stockVet, setStockVet] = useState<StockInsumoAPI[]>([]);
  const [precios, setPrecios] = useState<PrecioReferenciaAPI[]>([]);
  const [hectareas, setHectareas] = useState(0);

  const [verDetalle, setVerDetalle] = useState<AnimalRow | null>(null);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [eventoTimelineOpen, setEventoTimelineOpen] = useState(false);
  const [diagIA, setDiagIA] = useState<AnimalRow | null>(null);
  const [timelineSel, setTimelineSel] = useState<AnimalRow | null>(null);

  const cargar = useCallback(() => {
    fetch("/api/animales").then((r) => (r.ok ? r.json() : [])).then((d) => {
      const list: AnimalAPI[] = Array.isArray(d) ? d : [];
      setAnimalesAPI(list);
      // Abrir ficha pendiente proveniente de otro submódulo (una sola vez, al llegar los datos)
      const pendiente = typeof window !== "undefined" ? sessionStorage.getItem("mc-ficha-pendiente") : null;
      if (pendiente && list.length) {
        sessionStorage.removeItem("mc-ficha-pendiente");
        const norm = (v: string) => v.replace(/^#/, "").toLowerCase();
        const found = list.map(mapAnimal).find((a) => norm(a.id) === norm(pendiente) || a.dbId === pendiente);
        if (found) setVerDetalle(found);
      }
    }).catch(() => {});
    fetch("/api/tropas").then((r) => (r.ok ? r.json() : [])).then((d) => setTropas(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/tratamientos-sanitarios").then((r) => (r.ok ? r.json() : [])).then((d) => setTratamientos(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/alertas-sanitarias").then((r) => (r.ok ? r.json() : [])).then((d) => setAlertas(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/stock-insumos?categoria=Veterinaria").then((r) => (r.ok ? r.json() : [])).then((d) => setStockVet(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/precios-referencia").then((r) => (r.ok ? r.json() : [])).then((d) => setPrecios(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/lotes").then((r) => (r.ok ? r.json() : [])).then((d: { hectareas?: number }[]) => {
      if (Array.isArray(d)) setHectareas(d.reduce((s, l) => s + (l.hectareas || 0), 0));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const animales = useMemo(() => animalesAPI.map(mapAnimal), [animalesAPI]);
  const activos = useMemo(() => animales.filter((a) => a.activo), [animales]);

  /* ── Mutaciones ── */
  const onDarDeBaja = async (dbId: string, datos: BajaInfo) => {
    const motivo = datos.tipo.startsWith("Venta") ? "Venta" : datos.tipo === "Muerte" ? "Muerte" : datos.tipo;
    await fetch(`/api/animales/${dbId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "baja", motivoBaja: motivo, fechaBaja: datos.fecha, observacionesBaja: [datos.subcausa, datos.notas].filter(Boolean).join(" · ") }),
    });
    show("Animal dado de baja");
    setVerDetalle(null);
    cargar();
  };

  const onReactivar = async (dbId: string) => {
    await fetch(`/api/animales/${dbId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "reactivar" }),
    });
    show("Animal reactivado");
    setVerDetalle(null);
    cargar();
  };

  const exportarResumen = () => {
    const head = "Caravana,Nombre,Categoría,Raza,Sexo,Edad,Peso,Producción,Estado,Lote,Activo\n";
    const rows = animales.map((a) => [a.id, a.nombre || "", a.categoria, a.raza, a.sexo, a.edad, a.peso, a.prod, a.estado, a.lote, a.activo ? "Sí" : "No"].join(",")).join("\n");
    const blob = new Blob([head + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "rodeo.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  /* ── KPIs Resumen ── */
  // Altas del mes separadas por origen real: un animal registrado como "Compra"
  // es un ingreso, no un nacimiento — no hay que rotularlo como tal.
  const altasMes = useMemo(() => {
    const ini = new Date();
    ini.setDate(1);
    ini.setHours(0, 0, 0, 0);
    const enMes = (f?: string | null) => !!f && new Date(f) >= ini;
    let nacimientos = 0;
    let compras = 0;
    for (const a of animales) {
      const esCompra = (a.api.origen || "").toLowerCase() === "compra";
      if (esCompra) {
        if (enMes(a.api.createdAt)) compras += 1;
      } else if (enMes(a.fechaNacimiento)) {
        nacimientos += 1;
      }
    }
    return { nacimientos, compras };
  }, [animales]);
  const altasDelta = useMemo(() => {
    if (altasMes.nacimientos + altasMes.compras === 0) return "Sin altas este mes";
    const partes = [
      altasMes.nacimientos ? `+${altasMes.nacimientos} nacimiento${altasMes.nacimientos > 1 ? "s" : ""}` : null,
      altasMes.compras ? `+${altasMes.compras} compra${altasMes.compras > 1 ? "s" : ""}` : null,
    ].filter(Boolean);
    return `${partes.join(" · ")} este mes`;
  }, [altasMes]);

  const cargaAnimal = useMemo(() => {
    if (hectareas <= 0) return null;
    const ua = activos.reduce((s, a) => s + unidadesAnimal(a.categoria), 0);
    return Math.round((ua / hectareas) * 100) / 100;
  }, [activos, hectareas]);

  const enTratamiento = useMemo(
    () => new Set(tratamientos.filter((t) => ["En curso", "En retiro"].includes(t.estado)).map((t) => t.animal?.id)).size,
    [tratamientos]
  );
  const saludPct = activos.length > 0 ? Math.round(((activos.length - enTratamiento) / activos.length) * 100) : 0;

  const gananciaDiaria = useMemo(() => {
    const gpds: number[] = [];
    for (const a of animalesAPI) {
      const regs = a.registrosPeso || [];
      if (regs.length >= 2) {
        const dias = (new Date(regs[0].fecha).getTime() - new Date(regs[1].fecha).getTime()) / (24 * 3600 * 1000);
        if (dias > 0) gpds.push((regs[0].peso - regs[1].peso) / dias);
      } else if (regs[0]?.gananciaPromedioDiaria) {
        gpds.push(regs[0].gananciaPromedioDiaria);
      }
    }
    if (gpds.length === 0) return null;
    return Math.round((gpds.reduce((s, v) => s + v, 0) / gpds.length) * 1000) / 1000;
  }, [animalesAPI]);

  const partosAnio = useMemo(() => {
    const ini = new Date(new Date().getFullYear(), 0, 1);
    return animales.reduce((s, a) => s + (a.api.eventosReproductivos || []).filter((e) => e.tipo === "Parto" && new Date(e.fecha) >= ini).length, 0);
  }, [animales]);
  const partosProxMes = useMemo(() => {
    const ahora = new Date().getTime();
    const en30 = ahora + 30 * 24 * 3600 * 1000;
    return activos.filter((a) => {
      const f = a.api.historialReproductivo?.fechaEsperadaParto;
      return f && new Date(f).getTime() <= en30 && new Date(f).getTime() >= ahora;
    }).length;
  }, [activos]);

  /* ── KPIs Ganado ── */
  const precioKg = useMemo(() => {
    const ganaderos = precios.filter((p) => /novillo|vaquillona|ternero|vaca|kg *vivo|hacienda|gordo/i.test(p.producto));
    if (ganaderos.length === 0) return null;
    return ganaderos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
  }, [precios]);
  const valuacion = useMemo(() => {
    if (!precioKg) return null;
    const kg = activos.reduce((s, a) => s + (a.pesoNum || 0), 0);
    // Si el precio parece por tonelada (>100), convertir a kg
    const pKg = precioKg.precio > 100 ? precioKg.precio / 1000 : precioKg.precio;
    return Math.round(kg * pKg);
  }, [activos, precioKg]);
  const pesoProm = useMemo(() => {
    const con = activos.filter((a) => a.pesoNum !== null);
    return con.length > 0 ? Math.round(con.reduce((s, a) => s + (a.pesoNum || 0), 0) / con.length) : null;
  }, [activos]);
  const edadProm = useMemo(() => {
    const con = activos.filter((a) => a.edadMeses !== null);
    return con.length > 0 ? Math.round((con.reduce((s, a) => s + (a.edadMeses || 0), 0) / con.length / 12) * 10) / 10 : null;
  }, [activos]);
  const tasaParicion = useMemo(() => {
    const vientres = activos.filter((a) => ["Vaca", "Vaquillona"].includes(a.categoria)).length;
    return vientres > 0 ? Math.round((partosAnio / vientres) * 100) : 0;
  }, [activos, partosAnio]);

  /* ── KPIs Sanidad ── */
  const enRetiro = useMemo(() => tratamientos.filter((t) => t.finRetiro && new Date(t.finRetiro) > new Date()).length, [tratamientos]);
  const costoSanCab = useMemo(() => {
    const ini = new Date(new Date().getFullYear(), 0, 1);
    const total = tratamientos.filter((t) => new Date(t.fechaInicio) >= ini).reduce((s, t) => s + (t.costo || 0), 0);
    return activos.length > 0 ? Math.round((total / activos.length) * 100) / 100 : 0;
  }, [tratamientos, activos.length]);
  const proximaCampania = useMemo(() => {
    const futuras = alertas
      .filter((a) => a.estado !== "Completada" && a.fechaLimite && new Date(a.fechaLimite) > new Date())
      .sort((a, b) => new Date(a.fechaLimite!).getTime() - new Date(b.fechaLimite!).getTime());
    if (futuras.length === 0) return null;
    const dias = Math.ceil((new Date(futuras[0].fechaLimite!).getTime() - new Date().getTime()) / (24 * 3600 * 1000));
    return { dias, titulo: futuras[0].titulo };
  }, [alertas]);

  const kRepro = useMemo(() => kpisRepro(animales), [animales]);

  const abrirTimeline = (a: AnimalRow) => {
    setTimelineSel(a);
    setTab("Timeline");
  };

  const sanidadWarn = enTratamiento > 0 || enRetiro > 0;

  return (
    <div className="col gap-20">
      {toast}
      {verDetalle && (
        <VerDetalleAnimalModal
          animal={verDetalle}
          onClose={() => setVerDetalle(null)}
          onDarDeBaja={onDarDeBaja}
          onReactivar={onReactivar}
          onVerTimeline={abrirTimeline}
          onEditado={() => { cargar(); show("Animal actualizado"); }}
        />
      )}
      {nuevoOpen && <NuevoAnimalModal onClose={() => setNuevoOpen(false)} onCreado={() => { cargar(); show("Animal registrado"); }} />}
      {eventoTimelineOpen && <ModalRegistrarEvento animales={animales} animalPrefill={timelineSel} onClose={() => setEventoTimelineOpen(false)} onGuardado={() => { cargar(); show("Evento registrado"); }} />}
      {diagIA && <ModalDiagnosticarAnimal pacientes={activos} pacientePrefill={diagIA} onClose={() => setDiagIA(null)} onGuardado={() => { cargar(); show("Tratamiento guardado"); }} />}

      <PageHeader
        crumbs={["Ganadería", "Animales"]}
        title="Animales"
        subtitle={`${nfES(activos.length)} cabezas · ${tropas.length} tropa${tropas.length === 1 ? "" : "s"} · trazabilidad al día.`}
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} warnTabs={sanidadWarn ? ["Sanidad"] : []} />

      {tab === "Resumen" && (
        <>
          <div className="grid g-cols-5">
            <KPI label="Cantidad Total" value={nfES(activos.length)} delta={altasDelta} trend="up" icon="cow" accent />
            <KPI label="Carga Animal" value={cargaAnimal !== null ? `${cargaAnimal} EV/Ha` : "—"} delta={cargaAnimal !== null ? `${nfES(Math.round(hectareas))} ha totales` : "Cargá lotes con hectáreas"} trend={cargaAnimal !== null ? "up" : "warn"} icon="leaf" />
            <KPI label="Estado Sanitario" value={`${saludPct}%`} delta={`${enTratamiento} en tratamiento`} trend={enTratamiento > 0 ? "warn" : "up"} icon="heart" />
            <KPI label="Ganancia Diaria" value={gananciaDiaria !== null ? `${gananciaDiaria} kg/día` : "—"} delta={gananciaDiaria !== null ? "Prom. del rodeo" : "Registrá pesadas"} trend="up" icon="arrowUp" />
            <KPI label="Eventos Reproductivos" value={String(partosAnio)} delta={`${partosProxMes} esperados próx. mes`} trend="up" icon="egg" />
          </div>
          <div className="row gap-8" style={{ justifyContent: "flex-end" }}>
            <button className="mc-btn mc-btn--secondary" onClick={exportarResumen}><Icon name="download" size={14} />Exportar</button>
            <button className="mc-btn mc-btn--primary" onClick={() => setNuevoOpen(true)}><Icon name="plus" size={14} />Nuevo animal</button>
          </div>
          <AnimResumen animales={animales} tratamientos={tratamientos} alertas={alertas} onVerDetalle={setVerDetalle} onVerSanidad={() => setTab("Sanidad")} />
        </>
      )}

      {tab === "Ganado" && (
        <>
          <div className="grid g-cols-5">
            <KPI label="Valuación Estimada" value={valuacion !== null ? `$${nfES(valuacion)}` : "—"} delta={valuacion !== null ? `Ref: ${precioKg?.producto}` : "Cargá precio de hacienda en Comercialización"} trend={valuacion !== null ? "up" : "warn"} icon="activity" accent />
            <KPI label="Peso Promedio" value={pesoProm !== null ? `${pesoProm} kg` : "—"} delta={pesoProm !== null ? "Del rodeo activo" : "Sin pesadas"} trend="up" icon="arrowUp" />
            <KPI label="Animales Enfermos" value={String(enTratamiento)} delta={enTratamiento > 0 ? "Ver Sanidad…" : "Rodeo sano"} trend={enTratamiento > 0 ? "warn" : "up"} icon="heart" warn={enTratamiento > 0} />
            <KPI label="Edad Promedio" value={edadProm !== null ? `${edadProm} Años` : "—"} delta="Objetivo 4–6 años" trend={edadProm !== null && (edadProm < 4 || edadProm > 6) ? "warn" : "up"} icon="calendar" />
            <KPI label="Tasa de Parición" value={`${tasaParicion}%`} delta="Año actual" trend="up" icon="egg" />
          </div>
          <AnimGanado
            animales={animales}
            tropas={tropas}
            onVerDetalle={setVerDetalle}
            onAgregar={() => setNuevoOpen(true)}
            onDarDeBaja={onDarDeBaja}
            onReactivar={onReactivar}
            onRecomendacionIA={(a) => setDiagIA(a)}
          />
        </>
      )}

      {tab === "Reproducción" && (
        <>
          <div className="grid g-cols-5">
            <KPI label="Tasa de Preñez" value={`${kRepro.tasaPrenez}%`} delta="Sobre vientres en servicio" trend="up" icon="heart" accent />
            <KPI label="Vientres en Servicio" value={String(kRepro.enServicio)} delta="Actualmente" trend="up" icon="cow" />
            <KPI label="Días Abiertos" value={kRepro.diasAbiertos > 0 ? `${kRepro.diasAbiertos} días` : "—"} delta="Obj. < 110 días" trend={kRepro.diasAbiertos > 110 ? "warn" : "up"} icon="calendar" />
            <KPI label="Abortos / Mermas" value={`${kRepro.abortosPct}%`} delta={`${kRepro.perdidas} registradas`} trend={kRepro.perdidas > 0 ? "down" : "up"} icon="alert" />
            <div className="ia-card" style={{ borderRadius: 14 }}>
              <KPI label="Efectividad IA" value={kRepro.serviciosIA > 0 ? `${kRepro.efectividadIA}%` : "—"} delta="Primer Servicio (insem. artificial)" trend="up" ia />
            </div>
          </div>
          <AnimRepro animales={animales} onGuardado={() => { cargar(); show("Registro guardado"); }} />
        </>
      )}

      {tab === "Sanidad" && (
        <>
          <div className="grid g-cols-5">
            <KPI label="Salud Global" value={`${saludPct}%`} delta={`${activos.length} animales monitoreados`} trend="up" icon="heart" accent />
            <KPI label="Animales en Enfermería" value={String(enTratamiento)} delta={enTratamiento > 0 ? "Con tratamiento activo" : "Enfermería vacía"} trend={enTratamiento > 0 ? "warn" : "up"} icon="syringe" warn={enTratamiento > 0} />
            <KPI label="Alerta Retiro/Carencia" value={String(enRetiro)} delta={enRetiro > 0 ? "No se pueden vender ni ordeñar" : "Sin retiros vigentes"} trend={enRetiro > 0 ? "warn" : "up"} icon="alert" />
            <KPI label="Costo San. p/Cabeza" value={costoSanCab > 0 ? `$${nfES(costoSanCab, 2)}` : "—"} delta="Año actual" trend={costoSanCab > 0 ? "down" : "up"} icon="activity" />
            <KPI label="Próxima Campaña" value={proximaCampania ? `${proximaCampania.dias} días` : "—"} delta={proximaCampania ? proximaCampania.titulo : "Sin campañas programadas"} trend="up" icon="calendar" />
          </div>
          <AnimSanidad animales={animales} tratamientos={tratamientos} stockVet={stockVet} onVerDetalle={setVerDetalle} onGuardado={() => { cargar(); show("Guardado"); }} />
        </>
      )}

      {tab === "Timeline" && (
        <>
          {timelineSel && (
            <div className="grid g-cols-5">
              <KPI label="Edad" value={timelineSel.edad} delta={timelineSel.fechaNacimiento ? `Nacida ${new Date(timelineSel.fechaNacimiento).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}` : "Sin fecha de nacimiento"} trend="up" icon="calendar" accent />
              <KPI label="Peso Actual" value={timelineSel.peso !== "N/A" ? `${timelineSel.peso} kg` : "—"} delta="Última pesada" trend="up" icon="activity" />
              <KPI label="Producción" value={timelineSel.prodNum !== null ? `${Math.round(timelineSel.prodNum)} Lts/día` : "—"} delta={timelineSel.prodNum !== null ? "Último registro" : "Sin ordeñe"} trend="up" icon="droplet" />
              <KPI label="Estado Actual" value={timelineSel.estado} delta={timelineSel.api.historialReproductivo?.estadoActual || "—"} trend={timelineSel.ok ? "up" : "warn"} icon="heart" />
              <KPI label="Ubicación" value={timelineSel.lote} delta={timelineSel.api.tropa?.nombre ? `Tropa ${timelineSel.api.tropa.nombre}` : "Sin tropa"} trend="up" icon="map" />
            </div>
          )}
          <AnimTimeline
            animales={activos}
            animalSel={timelineSel}
            onSeleccionar={setTimelineSel}
            onVerDetalle={setVerDetalle}
            onRegistrarEvento={() => setEventoTimelineOpen(true)}
          />
        </>
      )}
    </div>
  );
}
