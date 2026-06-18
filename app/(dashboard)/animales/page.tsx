"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, KPI, Badge, Modal, Field, Prog, FeedRow, useToast, PageHeader, Tabs } from "@/components/mc";
import { demo } from "@/lib/demo";

/* ============ Datos demo (Figma) ============ */
type AnimalRow = {
  id: string;
  dbId?: string;
  caravana: string;
  categoria: string;
  raza: string;
  sexo: string;
  edad: string;
  peso: string;
  pesoNum?: number;
  estado: string;
  lote: string;
  fechaAlta?: string;
  demo?: boolean;
};

const DEMO_ANIMALES: AnimalRow[] = [
  { id: "UY-412008801", caravana: "88", categoria: "Vaca", raza: "Hereford", sexo: "H", edad: "5 años", peso: "452 kg", estado: "Preñada", lote: "Tropa A", demo: true },
  { id: "UY-412008812", caravana: "124", categoria: "Novillo", raza: "Angus", sexo: "M", edad: "2 años", peso: "510 kg", estado: "Listo venta", lote: "Tropa B", demo: true },
  { id: "UY-412008845", caravana: "201", categoria: "Vaquillona", raza: "Hereford", sexo: "H", edad: "18 meses", peso: "385 kg", estado: "Servicio", lote: "Tropa A", demo: true },
  { id: "UY-412008860", caravana: "305", categoria: "Ternero", raza: "Angus", sexo: "M", edad: "7 meses", peso: "148 kg", estado: "Saludable", lote: "Tropa C", demo: true },
  { id: "UY-412008871", caravana: "77", categoria: "Vaca", raza: "Braford", sexo: "H", edad: "7 años", peso: "468 kg", estado: "En tratamiento", lote: "Tropa A", demo: true },
  { id: "UY-412008890", caravana: "12", categoria: "Toro", raza: "Hereford", sexo: "M", edad: "4 años", peso: "820 kg", estado: "Saludable", lote: "Tropa D", demo: true },
  { id: "UY-412008902", caravana: "256", categoria: "Vaquillona", raza: "Angus", sexo: "H", edad: "20 meses", peso: "402 kg", estado: "Preñada", lote: "Tropa A", demo: true },
];

type EventoSanitario = { tipo: string; fecha: string; tropa?: string; n?: number; estado?: string };

const TABS = ["Resumen", "Ganado", "Peso", "Nutrición", "Reproducción", "Sanidad", "Timeline"];

// Paleta por categoría/tropa para los gráficos de composición
const CAT_COLOR = ["var(--mc-green-600)", "var(--mc-green-500)", "var(--mc-gold-500)", "var(--mc-amber)", "var(--mc-green-800)", "var(--mc-slate-500)", "var(--mc-blue)"];

export default function AnimalesPage() {
  return (
    <Suspense>
      <AnimalesInner />
    </Suspense>
  );
}

function AnimalesInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const initialTab = TABS.includes(searchParams.get("tab") || "") ? (searchParams.get("tab") as string) : "Resumen";
  const [tab, setTab] = useState(initialTab);
  const [animales, setAnimales] = useState<AnimalRow[]>(demo(DEMO_ANIMALES, []));
  const [totalReal, setTotalReal] = useState<number | null>(null);
  const [eventosSanitarios, setEventosSanitarios] = useState<EventoSanitario[]>([]);
  const [altaOpen, setAltaOpen] = useState(searchParams.get("modal") === "nuevo");
  const [altaForm, setAltaForm] = useState({
    caravana: "", senasa: "", categoria: "Vaca", raza: "Hereford", sexo: "Hembra",
    fechaNacimiento: "", peso: "", tropa: "Tropa A",
  });

  useEffect(() => {
    fetch("/api/animales")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        setTotalReal(d.length);
        setAnimales(
          d.map((a: { id: string; caravana: string; tipo?: string; raza?: string; sexo?: string; fechaNacimiento?: string; estado?: string; registrosPeso?: { peso: number }[]; tropa?: string; lote?: { nombre: string }; createdAt?: string }) => {
            const pesoNum = a.registrosPeso?.[0]?.peso;
            return {
              dbId: a.id,
              id: a.id.slice(-11).toUpperCase(),
              caravana: a.caravana,
              categoria: a.tipo || "Vacuno",
              raza: a.raza || "—",
              sexo: a.sexo === "Hembra" ? "H" : "M",
              edad: a.fechaNacimiento ? `${Math.max(0, Math.floor((Date.now() - new Date(a.fechaNacimiento).getTime()) / (365 * 86400000)))} años` : "—",
              peso: pesoNum ? `${pesoNum} kg` : "—",
              pesoNum: pesoNum ?? undefined,
              estado: a.estado === "Activo" ? "Saludable" : a.estado || "Saludable",
              lote: a.tropa || a.lote?.nombre || "Sin tropa",
              fechaAlta: a.createdAt || a.fechaNacimiento,
            };
          })
        );
      })
      .catch(() => {});

    fetch("/api/eventos-sanitarios")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d)) return;
        const futuros = d
          .map((e: { tipo?: string; nombre?: string; fechaProgramada?: string; fecha?: string; tropa?: string; cantidadAnimales?: number; estado?: string }) => ({
            tipo: e.tipo || e.nombre || "Evento sanitario",
            fechaRaw: e.fechaProgramada || e.fecha || "",
            tropa: e.tropa || "",
            n: e.cantidadAnimales,
            estado: e.estado || "",
          }))
          .filter((e) => e.fechaRaw)
          .sort((a, b) => new Date(a.fechaRaw).getTime() - new Date(b.fechaRaw).getTime())
          .slice(0, 5)
          .map((e) => ({ ...e, fecha: new Date(e.fechaRaw).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) }));
        setEventosSanitarios(futuros);
      })
      .catch(() => {});
  }, []);

  const crearAnimal = async () => {
    if (!altaForm.caravana) {
      toast.show("Ingresá la caravana", "err");
      return;
    }
    try {
      const res = await fetch("/api/animales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caravana: altaForm.caravana,
          tipo: altaForm.categoria,
          raza: altaForm.raza,
          sexo: altaForm.sexo,
          fechaNacimiento: altaForm.fechaNacimiento || null,
          pesoNacimiento: altaForm.peso ? parseFloat(altaForm.peso) : null,
        }),
      });
      if (!res.ok) throw new Error();
      const nuevo = await res.json();
      setAnimales((prev) => [
        {
          dbId: nuevo.id,
          id: (altaForm.senasa || nuevo.id.slice(-11)).toUpperCase(),
          caravana: altaForm.caravana,
          categoria: altaForm.categoria,
          raza: altaForm.raza,
          sexo: altaForm.sexo === "Hembra" ? "H" : "M",
          edad: "—",
          peso: altaForm.peso ? `${altaForm.peso} kg` : "—",
          estado: "Saludable",
          lote: altaForm.tropa,
        },
        ...prev,
      ]);
      toast.show(`Animal caravana ${altaForm.caravana} registrado`);
      setAltaOpen(false);
    } catch {
      toast.show("No se pudo registrar el animal", "err");
    }
  };

  const exportarCSV = () => {
    const head = "ID SENASA,Caravana,Categoría,Raza,Sexo,Edad,Peso,Estado,Tropa\n";
    const rows = animales.map((a) => [a.id, a.caravana, a.categoria, a.raza, a.sexo, a.edad, a.peso, a.estado, a.lote].join(",")).join("\n");
    const blob = new Blob([head + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "micampo-ganado.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.show("Ganado exportado a CSV");
  };

  const total = totalReal ?? demo(1284, 0);

  return (
    <div className="col gap-20">
      {toast.node}
      <PageHeader
        crumbs={["Ganadería", "Animales"]}
        title="Animales"
        subtitle={`${total.toLocaleString("es-AR")} cabezas · 4 tropas · trazabilidad SENASA al día.`}
        actions={
          <>
            <button className="mc-btn mc-btn--secondary" onClick={exportarCSV}>
              <Icon name="download" size={14} />Exportar
            </button>
            <button className="mc-btn mc-btn--primary" onClick={() => setAltaOpen(true)}>
              <Icon name="plus" size={14} />Nuevo animal
            </button>
          </>
        }
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === "Resumen" && <AnimResumen total={total} animales={animales} eventosSanitarios={eventosSanitarios} onVerSanidad={() => setTab("Sanidad")} />}
      {tab === "Ganado" && (
        <AnimGanado
          animales={animales}
          total={total}
          onAgregar={() => setAltaOpen(true)}
          onExportar={exportarCSV}
          onEliminar={async (a) => {
            if (a.dbId) {
              try {
                await fetch(`/api/animales/${a.dbId}`, { method: "DELETE" });
              } catch {}
            }
            setAnimales((prev) => prev.filter((x) => x !== a));
            toast.show(`Animal ${a.caravana} eliminado`);
          }}
        />
      )}
      {tab === "Peso" && <AnimPeso animales={animales} toast={toast} />}
      {tab === "Nutrición" && <AnimNutricion toast={toast} />}
      {tab === "Reproducción" && <AnimRepro animales={animales} toast={toast} />}
      {tab === "Sanidad" && <AnimSanidad animales={animales} toast={toast} onVerCalendario={() => router.push("/calendario")} />}
      {tab === "Timeline" && <AnimTimeline />}

      {/* Modal alta animal */}
      <Modal
        open={altaOpen}
        onClose={() => setAltaOpen(false)}
        title="Nuevo animal"
        subtitle="Alta con identificación SENASA y asignación de tropa."
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setAltaOpen(false)}>Cancelar</button>
            <button className="mc-btn mc-btn--primary" onClick={crearAnimal}>
              <Icon name="check" size={14} />Registrar animal
            </button>
          </>
        }
      >
        <div className="grid g-cols-2 gap-12">
          <Field label="Caravana *">
            <input className="mc-input" placeholder="Ej: 0124" value={altaForm.caravana} onChange={(e) => setAltaForm({ ...altaForm, caravana: e.target.value })} />
          </Field>
          <Field label="ID SENASA">
            <input className="mc-input" placeholder="UY-412..." value={altaForm.senasa} onChange={(e) => setAltaForm({ ...altaForm, senasa: e.target.value })} />
          </Field>
        </div>
        <div className="grid g-cols-2 gap-12">
          <Field label="Categoría">
            <select className="mc-select" value={altaForm.categoria} onChange={(e) => setAltaForm({ ...altaForm, categoria: e.target.value })}>
              {["Vaca", "Vaquillona", "Novillo", "Ternero", "Toro"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Raza">
            <select className="mc-select" value={altaForm.raza} onChange={(e) => setAltaForm({ ...altaForm, raza: e.target.value })}>
              {["Hereford", "Angus", "Braford", "Brangus", "Holando", "Otra"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid g-cols-2 gap-12">
          <Field label="Sexo">
            <select className="mc-select" value={altaForm.sexo} onChange={(e) => setAltaForm({ ...altaForm, sexo: e.target.value })}>
              <option>Hembra</option>
              <option>Macho</option>
            </select>
          </Field>
          <Field label="Fecha de nacimiento">
            <input type="date" className="mc-input" value={altaForm.fechaNacimiento} onChange={(e) => setAltaForm({ ...altaForm, fechaNacimiento: e.target.value })} />
          </Field>
        </div>
        <div className="grid g-cols-2 gap-12">
          <Field label="Peso actual (kg)">
            <input className="mc-input" placeholder="0" value={altaForm.peso} onChange={(e) => setAltaForm({ ...altaForm, peso: e.target.value })} />
          </Field>
          <Field label="Tropa">
            <select className="mc-select" value={altaForm.tropa} onChange={(e) => setAltaForm({ ...altaForm, tropa: e.target.value })}>
              {["Tropa A", "Tropa B", "Tropa C", "Tropa D"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ============ TAB RESUMEN (Figma) ============ */
function AnimResumen({ total, animales, eventosSanitarios, onVerSanidad }: { total: number; animales: AnimalRow[]; eventosSanitarios: EventoSanitario[]; onVerSanidad: () => void }) {
  const conPeso = animales.filter((a) => a.pesoNum != null);
  const pesoProm = conPeso.length ? Math.round(conPeso.reduce((s, a) => s + (a.pesoNum || 0), 0) / conPeso.length) : null;
  const prenadas = animales.filter((a) => a.estado === "Preñada").length;
  const hembras = animales.filter((a) => a.sexo === "H").length;
  const prenezPct = hembras > 0 ? Math.round((prenadas / hembras) * 100) : null;
  const enTrat = animales.filter((a) => a.estado === "En tratamiento").length;

  // Evolución del rodeo: cabezas acumuladas por mes de alta (últimos 12 meses)
  const evolucion = (() => {
    const conFecha = animales.filter((a) => a.fechaAlta).map((a) => new Date(a.fechaAlta as string).getTime()).sort((a, b) => a - b);
    if (conFecha.length === 0) return [] as { label: string; n: number }[];
    const now = new Date();
    const puntos: { label: string; n: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const fin = new Date(now.getFullYear(), now.getMonth() - i + 1, 0).getTime();
      const n = conFecha.filter((t) => t <= fin).length;
      puntos.push({ label: new Date(now.getFullYear(), now.getMonth() - i, 1).toLocaleDateString("es-AR", { month: "short" }), n });
    }
    return puntos;
  })();

  return (
    <>
      <div className="grid g-cols-4">
        <KPI label="Cabezas totales" value={total.toLocaleString("es-AR")} delta={`${animales.length} registradas`} trend="up" icon="cow" accent />
        <KPI label="Peso promedio" value={pesoProm ? `${pesoProm} kg` : "—"} delta={conPeso.length ? `${conPeso.length} con pesada` : "Sin pesadas"} trend="up" icon="scale" />
        <KPI label="Preñez general" value={prenezPct != null ? `${prenezPct}%` : "—"} delta={hembras ? `${prenadas}/${hembras} hembras` : "—"} trend="up" icon="heart" />
        <KPI label="En tratamiento" value={String(enTrat)} delta={enTrat ? "requieren atención" : "rodeo sano"} trend="warn" icon="syringe" warn />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
        <ComposicionRodeo animales={animales} />
        <div className="mc-card">
          <div className="mc-card__head"><div className="mc-card__title">Tropas activas</div></div>
          <Tropas animales={animales} />
        </div>
      </div>

      <div className="grid g-cols-2 gap-16">
        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Evolución del rodeo (12 meses)</div>
            {evolucion.length > 0 && <span className="mc-badge mc-badge--green">{evolucion[evolucion.length - 1].n} cab.</span>}
          </div>
          {evolucion.length === 0 ? (
            <div className="mc-empty"><div className="mc-empty__icon"><Icon name="cow" size={22} /></div>Sin altas registradas. La evolución del rodeo se grafica a medida que registrás animales.</div>
          ) : (() => {
            const W = 400, H = 180, maxN = Math.max(...evolucion.map((e) => e.n), 1);
            const X = (i: number) => (evolucion.length === 1 ? W / 2 : (i / (evolucion.length - 1)) * W);
            const Y = (n: number) => 170 - (n / maxN) * 150;
            const linePts = evolucion.map((e, i) => `${X(i)},${Y(e.n)}`).join(" ");
            return (
              <>
                <div style={{ height: 180, position: "relative" }}>
                  <svg viewBox="0 0 400 180" width="100%" height="100%" preserveAspectRatio="none">
                    <defs><linearGradient id="rodeoGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4a5e29" stopOpacity="0.25" /><stop offset="1" stopColor="#4a5e29" stopOpacity="0" /></linearGradient></defs>
                    {[30, 60, 90, 120, 150].map((y) => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#e6e8e4" />)}
                    <polygon points={`0,170 ${linePts} 400,170`} fill="url(#rodeoGrad)" />
                    <polyline points={linePts} fill="none" stroke="#4a5e29" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                    {evolucion.map((e, i) => <circle key={i} cx={X(i)} cy={Y(e.n)} r="3.5" fill="white" stroke="#4a5e29" strokeWidth="2" />)}
                  </svg>
                </div>
                <div className="row" style={{ justifyContent: "space-between", fontSize: 10, color: "var(--mc-text-3)", fontFamily: "var(--ff-mono)" }}>
                  {evolucion.map((e, i) => <span key={i}>{e.label}</span>)}
                </div>
              </>
            );
          })()}
        </div>

        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Próximos eventos sanitarios</div>
            <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={onVerSanidad}>Ver todos</button>
          </div>
          {eventosSanitarios.length === 0 ? (
            <div className="mc-empty"><div className="mc-empty__icon"><Icon name="syringe" size={22} /></div>Sin eventos sanitarios programados.</div>
          ) : (
            <div className="mc-feed">
              {eventosSanitarios.map((e, i) => (
                <FeedRow key={i} ic="syringe" tone={i === 0 ? "red" : i === 1 ? "orange" : "blue"} title={e.tipo} meta={`${e.tropa || "Rodeo"}${e.n ? ` · ${e.n} animales` : ""}`} time={e.fecha} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Tropas({ animales }: { animales: AnimalRow[] }) {
  const grupos = Array.from(animales.reduce((m, a) => m.set(a.lote, (m.get(a.lote) || 0) + 1), new Map<string, number>()).entries()).sort((a, b) => b[1] - a[1]);
  if (grupos.length === 0) return <div className="mc-empty"><div className="mc-empty__icon"><Icon name="cow" size={20} /></div>Sin tropas. Registrá animales y asignales una tropa.</div>;
  return (
    <div className="col gap-8">
      {grupos.map(([tropa, n], i) => (
        <div key={tropa} style={{ padding: 12, border: "1px solid var(--mc-line)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: CAT_COLOR[i % CAT_COLOR.length] + "22", color: CAT_COLOR[i % CAT_COLOR.length], display: "grid", placeItems: "center", fontFamily: "var(--ff-display)", fontSize: 18 }}>
            <Icon name="cow" size={18} />
          </div>
          <div style={{ flex: 1 }}><div className="font-semi" style={{ color: "var(--mc-ink)" }}>{tropa}</div></div>
          <div style={{ textAlign: "right" }}><div className="font-semi font-mono" style={{ color: "var(--mc-ink)" }}>{n}</div><div className="text-xs text-muted">cabezas</div></div>
        </div>
      ))}
    </div>
  );
}

function ComposicionRodeo({ animales }: { animales: AnimalRow[] }) {
  const [modo, setModo] = useState<"cat" | "tropa">("cat");
  const data = (() => {
    const key = modo === "cat" ? (a: AnimalRow) => a.categoria : (a: AnimalRow) => a.lote;
    const m = animales.reduce((acc, a) => acc.set(key(a), (acc.get(key(a)) || 0) + 1), new Map<string, number>());
    const tot = animales.length || 1;
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([cat, n], i) => ({ cat, n, pct: Math.round((n / tot) * 100), color: CAT_COLOR[i % CAT_COLOR.length] }));
  })();
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div className="mc-card__title">Composición del rodeo</div>
        <div className="mc-seg">
          <button className={modo === "cat" ? "is-on" : ""} onClick={() => setModo("cat")}>Por categoría</button>
          <button className={modo === "tropa" ? "is-on" : ""} onClick={() => setModo("tropa")}>Por tropa</button>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="mc-empty"><div className="mc-empty__icon"><Icon name="cow" size={22} /></div>Sin animales registrados. La composición se completa al dar de alta el rodeo.</div>
      ) : (
        <div className="grid g-cols-3 gap-16">
          {data.map((c) => (
            <div key={c.cat} style={{ padding: 12, border: "1px solid var(--mc-line)", borderRadius: 10 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div className="text-xs text-muted">{c.cat}</div>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, color: "var(--mc-ink)", lineHeight: 1, marginTop: 4 }}>{c.n}</div>
                </div>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: c.color + "22", color: c.color, display: "grid", placeItems: "center" }}>
                  <Icon name="cow" size={16} />
                </div>
              </div>
              <div className="mc-prog mt-8">
                <div className="mc-prog__bar" style={{ width: `${c.pct}%`, background: c.color }}></div>
              </div>
              <div className="text-xs text-muted mt-4">{c.pct}% del rodeo</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ TAB GANADO (Figma) ============ */
function AnimGanado({
  animales, total, onAgregar, onExportar, onEliminar,
}: {
  animales: AnimalRow[];
  total: number;
  onAgregar: () => void;
  onExportar: () => void;
  onEliminar: (a: AnimalRow) => void;
}) {
  const [vista, setVista] = useState<"Tabla" | "Tarjetas">("Tabla");
  const [tropa, setTropa] = useState("Todos");
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [filtroCat, setFiltroCat] = useState("Todas");
  const [pagina, setPagina] = useState(1);
  const [menuFila, setMenuFila] = useState<number | null>(null);
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());
  const PAGE = 7;

  const filtrados = useMemo(
    () =>
      animales.filter(
        (a) => (tropa === "Todos" || a.lote === tropa) && (filtroCat === "Todas" || a.categoria === filtroCat)
      ),
    [animales, tropa, filtroCat]
  );
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE));
  const visibles = filtrados.slice((pagina - 1) * PAGE, pagina * PAGE);

  const estadoTone = (estado: string) =>
    estado === "Preñada" || estado === "Saludable" || estado === "Listo venta"
      ? "green"
      : estado === "En tratamiento"
        ? "red"
        : estado === "Servicio"
          ? "blue"
          : "amber";

  return (
    <>
      <div className="row gap-8" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div className="row gap-8">
          <div className="mc-seg">
            {(["Tabla", "Tarjetas"] as const).map((v) => (
              <button key={v} className={vista === v ? "is-on" : ""} onClick={() => setVista(v)}>{v}</button>
            ))}
          </div>
          <div className="mc-seg">
            {["Todos", "Tropa A", "Tropa B", "Tropa C"].map((t) => (
              <button key={t} className={tropa === t ? "is-on" : ""} onClick={() => { setTropa(t); setPagina(1); }}>{t}</button>
            ))}
          </div>
        </div>
        <div className="row gap-8" style={{ position: "relative" }}>
          <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => setFiltrosOpen(!filtrosOpen)}>
            <Icon name="filter" size={13} />Filtros
          </button>
          {filtrosOpen && (
            <>
              <div onClick={() => setFiltrosOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, width: 240, zIndex: 51, background: "var(--mc-surface)", border: "1px solid var(--mc-line)", borderRadius: 12, boxShadow: "var(--sh-lg)", padding: 14 }}>
                <Field label="Categoría">
                  <select className="mc-select" value={filtroCat} onChange={(e) => { setFiltroCat(e.target.value); setPagina(1); }}>
                    {["Todas", "Vaca", "Vaquillona", "Novillo", "Ternero", "Toro"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
            </>
          )}
          <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={onExportar}>
            <Icon name="download" size={13} />Exportar
          </button>
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={onAgregar}>
            <Icon name="plus" size={13} />Agregar
          </button>
        </div>
      </div>

      {vista === "Tarjetas" ? (
        <div className="grid g-cols-3 gap-16">
          {visibles.map((a, i) => (
            <div key={i} className="mc-animal-card">
              <div className="mc-animal-card__avatar">{a.caravana}</div>
              <div style={{ flex: 1 }}>
                <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{a.categoria} · {a.raza}</div>
                <div className="text-xs text-muted">{a.id} · {a.edad} · {a.peso}</div>
              </div>
              <span className={`mc-badge mc-badge--${estadoTone(a.estado)}`}>
                <span className="mc-badge__dot"></span>{a.estado}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="mc-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={visibles.length > 0 && visibles.every((_, i) => seleccion.has((pagina - 1) * PAGE + i))}
                    onChange={(e) => {
                      const next = new Set(seleccion);
                      visibles.forEach((_, i) => {
                        const idx = (pagina - 1) * PAGE + i;
                        if (e.target.checked) next.add(idx);
                        else next.delete(idx);
                      });
                      setSeleccion(next);
                    }}
                  />
                </th>
                <th>ID SENASA</th><th>Caravana</th><th>Categoría</th><th>Raza</th><th>Sexo</th><th>Edad</th>
                <th className="mc-cell--num">Peso</th><th>Estado</th><th>Tropa</th><th></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((a, i) => {
                const idx = (pagina - 1) * PAGE + i;
                return (
                  <tr key={idx}>
                    <td>
                      <input
                        type="checkbox"
                        checked={seleccion.has(idx)}
                        onChange={(e) => {
                          const next = new Set(seleccion);
                          if (e.target.checked) next.add(idx);
                          else next.delete(idx);
                          setSeleccion(next);
                        }}
                      />
                    </td>
                    <td className="mc-cell--mono">{a.id}</td>
                    <td>
                      <div className="row gap-8">
                        <div className="mc-animal-card__avatar" style={{ width: 28, height: 28, fontSize: 11, borderRadius: 8 }}>{a.caravana}</div>
                      </div>
                    </td>
                    <td className="mc-cell--emph">{a.categoria}</td>
                    <td>{a.raza}</td>
                    <td>{a.sexo}</td>
                    <td>{a.edad}</td>
                    <td className="mc-cell--num">{a.peso}</td>
                    <td>
                      <span className={`mc-badge mc-badge--${estadoTone(a.estado)}`}>
                        <span className="mc-badge__dot"></span>{a.estado}
                      </span>
                    </td>
                    <td>{a.lote}</td>
                    <td style={{ position: "relative" }}>
                      <button className="mc-icon-btn" style={{ width: 26, height: 26, border: "none" }} onClick={() => setMenuFila(menuFila === idx ? null : idx)}>
                        <Icon name="more" size={14} />
                      </button>
                      {menuFila === idx && (
                        <>
                          <div onClick={() => setMenuFila(null)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
                          <div style={{ position: "absolute", top: "100%", right: 8, zIndex: 51, background: "var(--mc-surface)", border: "1px solid var(--mc-line)", borderRadius: 10, boxShadow: "var(--sh-lg)", padding: 4, width: 140 }}>
                            <button className="mc-btn mc-btn--ghost mc-btn--sm mc-btn--block" style={{ justifyContent: "flex-start" }} onClick={() => setMenuFila(null)}>
                              <Icon name="eye" size={13} />Ver
                            </button>
                            <button
                              className="mc-btn mc-btn--ghost mc-btn--sm mc-btn--block"
                              style={{ justifyContent: "flex-start", color: "var(--mc-red)" }}
                              onClick={() => { setMenuFila(null); onEliminar(a); }}
                            >
                              <Icon name="trash" size={13} />Eliminar
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)" }} className="row">
            <div className="text-xs text-muted">
              Mostrando {visibles.length} de {Math.max(filtrados.length, total).toLocaleString("es-AR")}
            </div>
            <div style={{ flex: 1 }}></div>
            <div className="mc-seg">
              <button onClick={() => setPagina(Math.max(1, pagina - 1))}>&lt;</button>
              {Array.from({ length: Math.min(totalPaginas, 4) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={pagina === p ? "is-on" : ""} onClick={() => setPagina(p)}>{p}</button>
              ))}
              {totalPaginas > 4 && <button onClick={() => setPagina(totalPaginas)}>{totalPaginas}</button>}
              <button onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}>&gt;</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============ TAB PESO (Figma) ============ */
function AnimPeso({ animales, toast }: { animales: AnimalRow[]; toast: ReturnType<typeof useToast> }) {
  const [form, setForm] = useState({
    metodo: "Individual", caravana: "", peso: "", fecha: new Date().toISOString().slice(0, 10), condicion: 3, obs: "",
  });

  const guardar = async () => {
    if (!form.caravana || !form.peso) {
      toast.show("Completá caravana y peso", "err");
      return;
    }
    const animal = animales.find((a) => a.caravana === form.caravana);
    try {
      if (animal?.dbId) {
        const res = await fetch("/api/registro-peso", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            animalId: animal.dbId,
            peso: parseFloat(form.peso),
            fecha: form.fecha,
            tipoMedicion: "Intermedio",
            observaciones: form.obs || `Condición corporal ${form.condicion}`,
          }),
        });
        if (!res.ok) throw new Error();
      }
      toast.show(`Pesada de ${form.peso} kg registrada para caravana ${form.caravana}`);
      setForm({ ...form, caravana: "", peso: "", obs: "" });
    } catch {
      toast.show("No se pudo guardar la pesada", "err");
    }
  };

  const pesoPorTropa = (() => {
    const m = new Map<string, { sum: number; n: number }>();
    animales.filter((a) => a.pesoNum != null).forEach((a) => { const g = m.get(a.lote) || { sum: 0, n: 0 }; g.sum += a.pesoNum as number; g.n++; m.set(a.lote, g); });
    return Array.from(m.entries()).map(([tropa, g]) => ({ tropa, prom: Math.round(g.sum / g.n), n: g.n })).sort((a, b) => b.prom - a.prom);
  })();

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div className="mc-card">
        <div className="mc-card__head"><div className="mc-card__title">Peso promedio por tropa</div></div>
        {pesoPorTropa.length === 0 ? (
          <div className="mc-empty"><div className="mc-empty__icon"><Icon name="scale" size={22} /></div>Sin pesadas registradas. Registrá pesos y el promedio por tropa se grafica acá.</div>
        ) : (() => {
          const maxP = Math.max(...pesoPorTropa.map((t) => t.prom), 1);
          const W = 400, H = 220, padL = 36, padB = 28, padT = 12, n = pesoPorTropa.length;
          const band = (W - padL) / n, bw = Math.min(46, band * 0.5);
          const Y = (v: number) => padT + (H - padT - padB) * (1 - v / maxP);
          return (
            <div style={{ height: 240, position: "relative" }}>
              <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                {[0, 0.25, 0.5, 0.75, 1].map((p, i) => { const y = Y(maxP * p); return (<g key={i}><line x1={padL} y1={y} x2={W} y2={y} stroke="var(--mc-line)" strokeDasharray={p === 0 ? "0" : "2,3"} /><text x={padL - 6} y={y + 3} fontSize="9" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="end">{Math.round(maxP * p)}</text></g>); })}
                {pesoPorTropa.map((t, i) => {
                  const cx = padL + band * i + band / 2;
                  return (
                    <g key={i}>
                      <rect x={cx - bw / 2} y={Y(t.prom)} width={bw} height={Y(0) - Y(t.prom)} rx="4" fill={CAT_COLOR[i % CAT_COLOR.length]} />
                      <text x={cx} y={Y(t.prom) - 5} fontSize="10" fontFamily="var(--ff-mono)" fontWeight="700" fill="var(--mc-ink)" textAnchor="middle">{t.prom}</text>
                      <text x={cx} y={H - 8} fontSize="10" fontFamily="var(--ff-ui)" fill="var(--mc-text-2)" textAnchor="middle">{t.tropa}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          );
        })()}
        {pesoPorTropa.length > 0 && (
          <div className="grid g-cols-3 gap-8 mt-8">
            {pesoPorTropa.slice(0, 3).map((r, i) => (
              <div key={r.tropa} style={{ padding: 10, background: "var(--mc-surface-2)", borderRadius: 8 }}>
                <div className="text-xs text-muted">{r.tropa}</div>
                <div className="font-semi" style={{ fontSize: 16, color: CAT_COLOR[i % CAT_COLOR.length] }}>{r.prom} kg</div>
                <div className="text-xs text-muted">{r.n} con pesada</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mc-card">
        <div className="mc-card__head">
          <div className="mc-card__title">Registrar pesada</div>
          <span className="mc-badge mc-badge--blue"><Icon name="activity" size={10} />Báscula conectada</span>
        </div>
        <div className="col gap-12">
          <Field label="Método">
            <div className="mc-seg">
              {["Individual", "Grupal", "Báscula auto"].map((m) => (
                <button key={m} className={form.metodo === m ? "is-on" : ""} onClick={() => setForm({ ...form, metodo: m })}>{m}</button>
              ))}
            </div>
          </Field>
          <div className="grid g-cols-2 gap-12">
            <Field label="Caravana / ID">
              <input className="mc-input" placeholder="Ej: 0124" value={form.caravana} onChange={(e) => setForm({ ...form, caravana: e.target.value })} />
            </Field>
            <Field label="Peso (kg)">
              <input className="mc-input" placeholder="0" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} />
            </Field>
          </div>
          <div className="grid g-cols-2 gap-12">
            <Field label="Fecha">
              <input className="mc-input" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </Field>
            <Field label="Condición corporal">
              <div className="row gap-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setForm({ ...form, condicion: n })}
                    style={{
                      flex: 1, padding: "8px 4px", border: "1px solid var(--mc-line-2)", borderRadius: 6,
                      background: n === form.condicion ? "var(--mc-green-600)" : "var(--mc-surface)",
                      color: n === form.condicion ? "white" : "var(--mc-text-2)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <Field label="Observaciones">
            <textarea className="mc-textarea" placeholder="Ej: animal con buen desarrollo" value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
          </Field>
          <div className="row gap-8 mt-4">
            <button className="mc-btn mc-btn--ghost" onClick={() => setForm({ ...form, caravana: "", peso: "", obs: "" })}>Cancelar</button>
            <div style={{ flex: 1 }}></div>
            <button className="mc-btn mc-btn--primary" onClick={guardar}>Guardar pesada</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ TAB NUTRICIÓN (Figma) ============ */
function AnimNutricion({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [raciones, setRaciones] = useState(demo([
    { tropa: "Tropa A · Cría", ing: "Pastura + suplemento", kg: "10.5 kg MS/cab", costo: "$132/cab" },
    { tropa: "Tropa B · Engorde", ing: "Silaje maíz + grano", kg: "14.2 kg MS/cab", costo: "$198/cab" },
    { tropa: "Tropa C · Destete", ing: "Pastura + núcleo proteico", kg: "6.8 kg MS/cab", costo: "$95/cab" },
    { tropa: "Tropa D · Toros", ing: "Pastura + heno", kg: "12.0 kg MS/cab", costo: "$156/cab" },
  ], [] as { tropa: string; ing: string; kg: string; costo: string }[]));
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ tropa: "Tropa A", ing: "", kg: "", costo: "" });

  const crear = async () => {
    if (!form.ing) {
      toast.show("Indicá los ingredientes de la ración", "err");
      return;
    }
    try {
      await fetch("/api/raciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: `Ración ${form.tropa}`, descripcion: form.ing, costoTotal: parseFloat(form.costo) || 0 }),
      }).catch(() => {});
      setRaciones((prev) => [{ tropa: `${form.tropa} · Nueva`, ing: form.ing, kg: `${form.kg || "?"} kg MS/cab`, costo: `$${form.costo || "?"}/cab` }, ...prev]);
      toast.show("Ración creada");
      setModal(false);
    } catch {
      toast.show("No se pudo crear la ración", "err");
    }
  };

  return (
    <div className="col gap-16">
      {/* KPIs */}
      <div className="grid g-cols-4 gap-16">
        <KPI label="Raciones activas" value={String(raciones.length)} delta={demo("4 tropas alimentadas", "—")} trend="up" icon="leaf" accent />
        <KPI label="Consumo diario" value={demo("12.4 t MS", "—")} delta={demo("Pradera + silaje", "—")} trend="up" icon="truck" />
        <KPI label="Costo alimentación / día" value={demo("$184,500", "—")} delta={demo("$144/cabeza", "—")} trend="up" icon="dollar" />
        <KPI label="GDP promedio" value={demo("0.92 kg/d", "—")} delta={demo("+0.08 vs mes pasado", "—")} trend="up" icon="arrowUp" />
      </div>

      <div className="grid g-cols-2 gap-16">
        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Raciones por tropa</div>
            <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => setModal(true)}>
              <Icon name="plus" size={13} />Nueva ración
            </button>
          </div>
          <div className="col gap-8">
            {raciones.map((r, i) => (
              <div key={i} style={{ padding: 14, border: "1px solid var(--mc-line)", borderRadius: 10 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{r.tropa}</div>
                  <span className="mc-badge mc-badge--green"><span className="mc-badge__dot"></span>Activa</span>
                </div>
                <div className="text-sm text-muted mt-4">{r.ing}</div>
                <div className="row gap-16 mt-8 text-xs">
                  <span className="font-mono"><span className="text-muted">Consumo: </span>{r.kg}</span>
                  <span className="font-mono"><span className="text-muted">Costo: </span>{r.costo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mc-card">
          <div className="mc-card__head"><div className="mc-card__title">Stock de insumos</div></div>
          <div className="col gap-8">
            {demo([
              { insumo: "Silaje de maíz", stock: 78, max: 120, unidad: "tn" },
              { insumo: "Grano maíz", stock: 22, max: 40, unidad: "tn" },
              { insumo: "Núcleo proteico", stock: 4.2, max: 10, unidad: "tn" },
              { insumo: "Sal mineralizada", stock: 1.1, max: 3, unidad: "tn" },
              { insumo: "Heno alfalfa", stock: 15, max: 40, unidad: "rollos" },
            ], [] as { insumo: string; stock: number; max: number; unidad: string }[]).map((s, i) => {
              const pct = (s.stock / s.max) * 100;
              return (
                <div key={i}>
                  <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}>
                    <span className="font-semi" style={{ color: "var(--mc-ink)" }}>{s.insumo}</span>
                    <span className="font-mono text-muted">{s.stock} / {s.max} {s.unidad}</span>
                  </div>
                  <Prog pct={pct} tone={pct < 30 ? "red" : pct < 50 ? "orange" : undefined} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Nueva ración"
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="mc-btn mc-btn--primary" onClick={crear}><Icon name="check" size={14} />Crear ración</button>
          </>
        }
      >
        <Field label="Tropa">
          <select className="mc-select" value={form.tropa} onChange={(e) => setForm({ ...form, tropa: e.target.value })}>
            {["Tropa A", "Tropa B", "Tropa C", "Tropa D"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Ingredientes">
          <input className="mc-input" placeholder="Ej: Silaje maíz + grano + núcleo" value={form.ing} onChange={(e) => setForm({ ...form, ing: e.target.value })} />
        </Field>
        <div className="grid g-cols-2 gap-12">
          <Field label="Consumo (kg MS/cab)">
            <input className="mc-input" placeholder="0" value={form.kg} onChange={(e) => setForm({ ...form, kg: e.target.value })} />
          </Field>
          <Field label="Costo ($/cab)">
            <input className="mc-input" placeholder="0" value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ============ TAB REPRODUCCIÓN (Figma) ============ */
function AnimRepro({ animales, toast }: { animales: AnimalRow[]; toast: ReturnType<typeof useToast> }) {
  const [evento, setEvento] = useState<string | null>(null);
  const [form, setForm] = useState({ caravana: "", fecha: new Date().toISOString().slice(0, 10), notas: "" });
  const [eventos, setEventos] = useState<{ tipo: string; fecha: string; caravana?: string }[]>([]);

  useEffect(() => {
    fetch("/api/eventos-reproductivos").then((r) => (r.ok ? r.json() : [])).then((d) => {
      if (!Array.isArray(d)) return;
      setEventos(d.map((e: { tipo?: string; fecha: string; animal?: { caravana?: string } }) => ({ tipo: e.tipo || "Evento", fecha: e.fecha, caravana: e.animal?.caravana })));
    }).catch(() => {});
  }, []);

  const cuenta = (t: string) => eventos.filter((e) => (e.tipo || "").toLowerCase().includes(t)).length;
  const hace30 = Date.now() - 30 * 86400000;
  const partos30 = eventos.filter((e) => (e.tipo || "").toLowerCase().includes("parto") && new Date(e.fecha).getTime() >= hace30).length;
  const servicios = cuenta("servicio");
  const tactos = cuenta("tacto");
  const partosTot = cuenta("parto");
  const hembras = animales.filter((a) => a.sexo === "H").length;
  const prenezPct = servicios > 0 ? Math.round((tactos / servicios) * 100) : null;

  const registrar = async () => {
    if (!form.caravana) {
      toast.show("Indicá la caravana", "err");
      return;
    }
    const animal = animales.find((a) => a.caravana === form.caravana);
    try {
      if (animal?.dbId) {
        await fetch("/api/eventos-reproductivos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animalId: animal.dbId, tipo: evento, fecha: form.fecha, observaciones: form.notas }),
        }).catch(() => {});
      }
      setEventos((prev) => [{ tipo: evento || "Evento", fecha: form.fecha, caravana: form.caravana }, ...prev]);
      toast.show(`${evento} registrado para caravana ${form.caravana}`);
      setEvento(null);
      setForm({ ...form, caravana: "", notas: "" });
    } catch {
      toast.show("No se pudo registrar el evento", "err");
    }
  };

  return (
    <div className="col gap-16">
      <div className="grid g-cols-5 gap-16">
        <KPI label="Hembras del rodeo" value={String(hembras)} delta={hembras ? "potenciales vientres" : "—"} trend="up" icon="heart" accent />
        <KPI label="Servicios registrados" value={String(servicios)} delta={servicios ? "en el rodeo" : "—"} trend="up" icon="heart" />
        <KPI label="Preñez (tacto/servicio)" value={prenezPct != null ? `${prenezPct}%` : "—"} delta={`${tactos} tactos`} trend="up" icon="check" />
        <KPI label="Partos últimos 30d" value={String(partos30)} delta={`${partosTot} en total`} trend="up" icon="cow" />
        <KPI label="Eventos registrados" value={String(eventos.length)} delta="reproductivos" trend="up" icon="calendar" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="mc-card">
          <div className="mc-card__head"><div className="mc-card__title">Calendario reproductivo</div></div>
          {eventos.length === 0 ? (
            <div className="mc-empty"><div className="mc-empty__icon"><Icon name="heart" size={22} /></div>Sin eventos reproductivos registrados. Registrá celos, servicios, tactos y partos con los botones de la derecha.</div>
          ) : (
            <>
              <div className="grid g-cols-3 gap-8" style={{ marginBottom: 12 }}>
                {[
                  { t: "Servicio", c: cuenta("servicio"), color: "var(--mc-green-600)" },
                  { t: "Tacto", c: cuenta("tacto"), color: "var(--mc-gold-500)" },
                  { t: "Parto", c: cuenta("parto"), color: "var(--mc-green-700)" },
                  { t: "Celo", c: cuenta("celo"), color: "var(--mc-red)" },
                  { t: "Aborto", c: cuenta("aborto"), color: "var(--mc-red)" },
                  { t: "Destete", c: cuenta("destete"), color: "var(--mc-amber)" },
                ].filter((x) => x.c > 0).map((x) => (
                  <div key={x.t} style={{ padding: 10, border: "1px solid var(--mc-line)", borderRadius: 10 }}>
                    <div className="text-xs text-muted">{x.t}</div>
                    <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, color: x.color, lineHeight: 1, marginTop: 2 }}>{x.c}</div>
                  </div>
                ))}
              </div>
              <div className="col gap-6">
                {eventos.slice(0, 6).map((e, i) => (
                  <div key={i} className="row" style={{ justifyContent: "space-between", padding: "8px 10px", border: "1px solid var(--mc-line)", borderRadius: 8, fontSize: 13 }}>
                    <span className="row gap-8" style={{ alignItems: "center" }}><Icon name="heart" size={13} style={{ color: "var(--mc-green-700)" }} /><span className="font-semi" style={{ color: "var(--mc-ink)" }}>{e.tipo}</span>{e.caravana && <span className="text-muted text-xs">· caravana {e.caravana}</span>}</span>
                    <span className="text-muted text-xs font-mono">{new Date(e.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mc-card">
          <div className="mc-card__head"><div className="mc-card__title">Registro rápido de eventos</div></div>
          <div className="grid g-cols-2 gap-8">
            {[
              { ev: "Celo", ic: "heart", color: "var(--mc-red)" },
              { ev: "Servicio", ic: "heart", color: "var(--mc-green-600)" },
              { ev: "Tacto", ic: "eye", color: "var(--mc-orange-600)" },
              { ev: "Parto", ic: "cow", color: "var(--mc-green-700)" },
              { ev: "Aborto", ic: "alert", color: "var(--mc-red)" },
              { ev: "Destete", ic: "egg", color: "var(--mc-amber)" },
            ].map((e) => (
              <button
                key={e.ev}
                className="mc-card"
                style={{ padding: 14, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", border: "1px solid var(--mc-line)" }}
                onClick={() => setEvento(e.ev)}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: e.color + "22", color: e.color, display: "grid", placeItems: "center" }}>
                  <Icon name={e.ic} size={16} />
                </div>
                <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{e.ev}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Modal
        open={!!evento}
        onClose={() => setEvento(null)}
        title={`Registrar ${evento || ""}`}
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setEvento(null)}>Cancelar</button>
            <button className="mc-btn mc-btn--primary" onClick={registrar}><Icon name="check" size={14} />Registrar</button>
          </>
        }
      >
        <div className="grid g-cols-2 gap-12">
          <Field label="Caravana">
            <input className="mc-input" placeholder="Ej: 0088" value={form.caravana} onChange={(e) => setForm({ ...form, caravana: e.target.value })} />
          </Field>
          <Field label="Fecha">
            <input type="date" className="mc-input" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </Field>
        </div>
        <Field label="Notas">
          <textarea className="mc-textarea" placeholder="Observaciones del evento..." value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
        </Field>
      </Modal>
    </div>
  );
}

/* ============ TAB SANIDAD (Figma) ============ */
function AnimSanidad({
  animales, toast, onVerCalendario,
}: {
  animales: AnimalRow[];
  toast: ReturnType<typeof useToast>;
  onVerCalendario: () => void;
}) {
  const [plan, setPlan] = useState(demo([
    { ev: "Vacuna aftosa", prod: "Bioaftogen", cat: "Todo el rodeo", dosis: "5 ml SC", fecha: "18/04/2026", n: "148", estado: "Hoy", tone: "red" },
    { ev: "Desparasitación", prod: "Ivermectina 3.15%", cat: "Terneros", dosis: "1ml/50kg", fecha: "03/05/2026", n: "284", estado: "Programada", tone: "amber" },
    { ev: "Vacuna reproductiva", prod: "Reprogen", cat: "Vacas + vaquillonas", dosis: "2 ml SC", fecha: "15/05/2026", n: "598", estado: "Programada", tone: "amber" },
    { ev: "Anti-clostridial", prod: "Bioclostrigen", cat: "Terneros destetados", dosis: "5 ml SC", fecha: "02/04/2026", n: "284", estado: "Completada", tone: "green" },
    { ev: "Mineralización", prod: "Selenio + Yodo", cat: "Vaquillonas", dosis: "2 ml IM", fecha: "28/03/2026", n: "186", estado: "Completada", tone: "green" },
  ], [] as { ev: string; prod: string; cat: string; dosis: string; fecha: string; n: string; estado: string; tone: string }[]));
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ev: "", prod: "", cat: "Todo el rodeo", dosis: "", fecha: new Date().toISOString().slice(0, 10), caravana: "" });

  const crear = async () => {
    if (!form.ev || !form.prod) {
      toast.show("Completá evento y producto", "err");
      return;
    }
    const animal = animales.find((a) => a.caravana === form.caravana);
    try {
      if (animal?.dbId) {
        await fetch("/api/eventos-sanitarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animalId: animal.dbId, descripcion: form.ev, fecha: form.fecha, producto: form.prod, dosis: form.dosis }),
        }).catch(() => {});
      }
      setPlan((prev) => [
        { ev: form.ev, prod: form.prod, cat: form.cat, dosis: form.dosis || "—", fecha: new Date(form.fecha).toLocaleDateString("es-AR"), n: form.caravana ? "1" : "—", estado: "Programada", tone: "amber" },
        ...prev,
      ]);
      toast.show("Aplicación sanitaria programada");
      setModal(false);
    } catch {
      toast.show("No se pudo programar la aplicación", "err");
    }
  };

  return (
    <div className="col gap-16">
      <div className="grid g-cols-4">
        <KPI label="Pendientes" value={demo("32", "0")} delta={demo("Vacuna aftosa + desparasit.", "—")} trend="warn" icon="syringe" warn />
        <KPI label="Aplicadas últ. 30d" value={demo("248", "0")} delta={demo("Cobertura 91%", "—")} trend="up" icon="check" accent />
        <KPI label="En tratamiento" value={demo("4", "0")} delta={demo("3 Tropa A · 1 Tropa B", "—")} trend="warn" icon="heart" />
        <KPI label="Mortalidad anual" value={demo("1.8%", "—")} delta={demo("Por debajo del objetivo", "—")} trend="up" icon="activity" />
      </div>

      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between" }}>
          <div className="mc-card__title">Plan sanitario</div>
          <div className="row gap-8">
            <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={onVerCalendario}>
              <Icon name="calendar" size={13} />Ver calendario
            </button>
            <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => setModal(true)}>
              <Icon name="plus" size={13} />Nueva aplicación
            </button>
          </div>
        </div>
        <table className="mc-table">
          <thead>
            <tr><th>Evento</th><th>Producto</th><th>Categoría</th><th>Dosis</th><th>Próxima fecha</th><th>Animales</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {plan.map((r, i) => (
              <tr key={i}>
                <td className="mc-cell--emph">{r.ev}</td>
                <td>{r.prod}</td>
                <td>{r.cat}</td>
                <td className="mc-cell--mono">{r.dosis}</td>
                <td className="mc-cell--mono">{r.fecha}</td>
                <td className="mc-cell--num">{r.n}</td>
                <td>
                  <span className={`mc-badge mc-badge--${r.tone}`}><span className="mc-badge__dot"></span>{r.estado}</span>
                </td>
                <td>
                  <button
                    className="mc-icon-btn"
                    style={{ width: 26, height: 26, border: "none" }}
                    title="Marcar completada"
                    onClick={() => {
                      setPlan((prev) => prev.map((p, j) => (j === i ? { ...p, estado: "Completada", tone: "green" } : p)));
                      toast.show(`${r.ev} marcada como completada`);
                    }}
                  >
                    <Icon name="check" size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Nueva aplicación sanitaria"
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="mc-btn mc-btn--primary" onClick={crear}><Icon name="check" size={14} />Programar</button>
          </>
        }
      >
        <div className="grid g-cols-2 gap-12">
          <Field label="Evento *">
            <input className="mc-input" placeholder="Ej: Vacuna aftosa" value={form.ev} onChange={(e) => setForm({ ...form, ev: e.target.value })} />
          </Field>
          <Field label="Producto *">
            <input className="mc-input" placeholder="Ej: Bioaftogen" value={form.prod} onChange={(e) => setForm({ ...form, prod: e.target.value })} />
          </Field>
        </div>
        <div className="grid g-cols-2 gap-12">
          <Field label="Categoría">
            <select className="mc-select" value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}>
              {["Todo el rodeo", "Vacas", "Vaquillonas", "Novillos", "Terneros", "Toros"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Dosis">
            <input className="mc-input" placeholder="Ej: 5 ml SC" value={form.dosis} onChange={(e) => setForm({ ...form, dosis: e.target.value })} />
          </Field>
        </div>
        <div className="grid g-cols-2 gap-12">
          <Field label="Fecha">
            <input type="date" className="mc-input" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </Field>
          <Field label="Caravana (opcional)">
            <input className="mc-input" placeholder="Aplicación individual" value={form.caravana} onChange={(e) => setForm({ ...form, caravana: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ============ TAB TIMELINE (Figma) ============ */
function AnimTimeline() {
  const [filtro, setFiltro] = useState("Todo");
  const events = demo([
    { fecha: "18/04/2026", hora: "09:30", tipo: "Sanidad", titulo: "Vacunación aftosa aplicada", meta: "Tropa A · 148 animales · Dr. M. López", tone: "green" },
    { fecha: "15/04/2026", hora: "14:00", tipo: "Peso", titulo: "Pesada mensual Tropa B", meta: "325 animales · peso prom. 510 kg (+18)", tone: "" },
    { fecha: "12/04/2026", hora: "08:00", tipo: "Nutrición", titulo: "Cambio de ración Tropa C", meta: "De suplemento a grano maíz + núcleo", tone: "amber" },
    { fecha: "10/04/2026", hora: "11:15", tipo: "Reproducción", titulo: "Tacto parcial Tropa A", meta: "72% preñez en 104 vientres evaluados", tone: "" },
    { fecha: "08/04/2026", hora: "—", tipo: "Movimiento", titulo: "Tropa B reubicada a Potrero 7", meta: "325 animales · Don Ramón", tone: "blue" },
    { fecha: "05/04/2026", hora: "09:00", tipo: "Sanidad", titulo: "Tratamiento antibiótico", meta: "3 animales · Tropa A · neumonía leve", tone: "red" },
    { fecha: "02/04/2026", hora: "07:45", tipo: "Parto", titulo: "Parto normal", meta: "Vaca 0088 · ternero macho 38 kg", tone: "green" },
    { fecha: "28/03/2026", hora: "—", tipo: "Ingreso", titulo: "Ingreso de 24 vaquillonas", meta: "Compra Remate Liniers", tone: "" },
  ], [] as { fecha: string; hora: string; tipo: string; titulo: string; meta: string; tone: string }[]);
  const map: Record<string, string[]> = {
    Todo: [],
    Sanidad: ["Sanidad"],
    Repro: ["Reproducción", "Parto"],
    Peso: ["Peso"],
    Movs: ["Movimiento", "Ingreso"],
  };
  const visibles = filtro === "Todo" ? events : events.filter((e) => map[filtro]?.includes(e.tipo));
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div className="mc-card__title">Línea de tiempo del rodeo</div>
        <div className="mc-seg">
          {["Todo", "Sanidad", "Repro", "Peso", "Movs"].map((f) => (
            <button key={f} className={filtro === f ? "is-on" : ""} onClick={() => setFiltro(f)}>{f}</button>
          ))}
        </div>
      </div>
      <div className="mc-timeline">
        {visibles.map((e, i) => (
          <div key={i} className="mc-tl-item" style={{ gridTemplateColumns: "24px 1fr auto auto", gap: 14 }}>
            <span className={`mc-tl-item__dot mc-tl-item__dot--${e.tone === "blue" ? "blue" : e.tone === "red" ? "red" : e.tone === "amber" ? "warn" : ""}`}></span>
            <div>
              <div className="mc-tl-item__label">{e.titulo}</div>
              <div className="mc-tl-item__meta">{e.tipo} · {e.meta}</div>
            </div>
            <span className="mc-badge mc-badge--neutral">{e.tipo}</span>
            <div className="mc-tl-item__time">{e.fecha} {e.hora}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
