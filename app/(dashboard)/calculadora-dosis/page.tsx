"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, KPI, Badge, Seg, Modal, Field, useToast, PageHeader, Tabs, IABadge } from "@/components/mc";
import { AgregarProductoModal } from "@/components/calculadora/AgregarProductoModal";
import {
  type ConfigCalculo,
  type ProductoMezcla,
  type HistRow,
  ICONO_CATEGORIA,
  COLOR_CATEGORIA,
  TIPO_A_CATEGORIA,
} from "@/components/calculadora/types";
import { CONFIG_VACIA } from "@/components/calculadora/presets";
import { useLoteScope } from "@/components/LoteScope";
import {
  caldoTotal,
  cargas,
  costoPorHa,
  costoPorHaMezcla,
  costoTotalMezcla,
  fmtUSD,
  num,
  porTanque,
  totalProducto,
} from "@/components/calculadora/calc";

const TABS = ["Inicio", "Nuevo Cálculo", "Historial", "Preestablecidos"];

type Lote = { id: string; nombre: string; hectareas: number };
type UserPreset = { id: string; nombre: string; config: ConfigCalculo };

export default function CalculadoraDosisPage() {
  return (
    <Suspense>
      <CalculadoraInner />
    </Suspense>
  );
}

function CalculadoraInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { lotes: scopeLotes } = useLoteScope();

  const initialTab = TABS.includes(searchParams.get("tab") || "")
    ? (searchParams.get("tab") as string)
    : "Inicio";
  const [tab, setTab] = useState(initialTab);

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [config, setConfig] = useState<ConfigCalculo>({ ...CONFIG_VACIA, productos: [] });
  const [historial, setHistorial] = useState<HistRow[]>([]);
  const [userPresets, setUserPresets] = useState<UserPreset[]>([]);

  // sincroniza el tab con el query param (atajos del dashboard)
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && TABS.includes(t)) setTab(t);
  }, [searchParams]);

  // lotes para el select — del alcance global (campo/lote activo)
  useEffect(() => {
    setLotes(scopeLotes.map((l) => ({ id: l.id, nombre: l.nombre, hectareas: l.hectareas || 0 })));
  }, [scopeLotes]);

  // carga de historial real
  useEffect(() => {
    fetch("/api/calculadora-dosis")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d)) return;
        setHistorial(d.map((c: CalculoApi) => apiToHistRow(c)));
      })
      .catch(() => {});
    fetch("/api/dosis-presets")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setUserPresets(d); })
      .catch(() => {});
  }, []);

  const guardarPreset = async (nombre: string, cfg: ConfigCalculo) => {
    try {
      const res = await fetch("/api/dosis-presets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, config: cfg }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setUserPresets((p) => [saved, ...p]);
      toast.show(`Preestablecido "${nombre}" guardado`);
    } catch { toast.show("No se pudo guardar el preestablecido", "err"); }
  };

  const eliminarPreset = async (id: string) => {
    const res = await fetch(`/api/dosis-presets/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res || !res.ok) { toast.show("No se pudo eliminar", "err"); return; }
    setUserPresets((p) => p.filter((x) => x.id !== id));
    toast.show("Preestablecido eliminado");
  };

  const eliminarCalculo = async (row: HistRow) => {
    if (row.id) {
      const res = await fetch(`/api/calculadora-dosis/${row.id}`, { method: "DELETE" }).catch(() => null);
      if (!res || !res.ok) { toast.show("No se pudo eliminar", "err"); return; }
    }
    setHistorial((prev) => prev.filter((r) => r !== row));
    toast.show("Cálculo eliminado");
  };

  const goTab = (t: string) => {
    setTab(t);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    router.replace(`/calculadora-dosis?${params.toString()}`);
  };

  // abrir Nuevo Cálculo precargando una config
  const abrirNuevo = (cfg: ConfigCalculo) => {
    setConfig(cfg);
    goTab("Nuevo Cálculo");
  };

  return (
    <div className="col gap-20">
      {toast.node}
      <PageHeader
        crumbs={["Agronomía", "Calculadora de Dosis"]}
        title="Calculadora de Dosis"
        subtitle="Dosificación precisa para herbicidas, fungicidas, insecticidas y fertilizantes."
      />
      <Tabs tabs={TABS} active={tab} onChange={goTab} />

      {tab === "Inicio" && <TabInicio historial={historial} onAbrir={(tipo) => abrirNuevo(configDesdeTipo(tipo))} onPreset={() => goTab("Preestablecidos")} onNuevo={() => abrirNuevo({ ...CONFIG_VACIA, productos: [] })} />}

      {tab === "Nuevo Cálculo" && (
        <TabNuevo
          lotes={lotes}
          config={config}
          setConfig={setConfig}
          onGuardar={async (row) => {
            setHistorial((prev) => [row, ...prev]);
            toast.show("Cálculo guardado en el historial");
            goTab("Historial");
          }}
          onGuardarPreset={guardarPreset}
          onError={(m) => toast.show(m, "err")}
          onCancelar={() => goTab("Inicio")}
        />
      )}

      {tab === "Historial" && (
        <TabHistorial
          rows={historial}
          onEliminar={eliminarCalculo}
          onDuplicar={(r) => {
            if (r.config) abrirNuevo(structuredClone(r.config));
            else abrirNuevo({ ...CONFIG_VACIA, area: r.ha, productos: [{ tipo: "Herbicida", nombre: r.producto, costoUnitario: "", dosis: r.dosis.replace(/[^\d.]/g, ""), unidad: "Lt/Ha" }] });
            toast.show("Cálculo duplicado en Nuevo Cálculo");
          }}
        />
      )}

      {tab === "Preestablecidos" && (
        <TabPreset
          userPresets={userPresets}
          onEliminarPreset={eliminarPreset}
          onCrear={() => abrirNuevo({ ...CONFIG_VACIA, productos: [] })}
          onUsar={(cfg) => {
            abrirNuevo(structuredClone(cfg));
            toast.show("Preset cargado en Nuevo Cálculo");
          }}
        />
      )}
    </div>
  );
}

/* =================================================================== */
/* TAB INICIO                                                          */
/* =================================================================== */

const TIPOS_CALCULO = [
  { tipo: "Herbicida", desc: "Dosis por mezcla en tanque", color: "var(--mc-green-600)" },
  { tipo: "Fungicida", desc: "Para control preventivo y curativo", color: "var(--mc-blue)" },
  { tipo: "Insecticida", desc: "Cálculo por ingrediente activo", color: "var(--mc-orange-600)" },
  { tipo: "Fertilizante", desc: "Balance NPK por hectárea", color: "var(--mc-amber)" },
  { tipo: "Mezcla personalizada", desc: "Combinación de productos", color: "var(--mc-green-700)" },
  { tipo: "Riego + agroquímico", desc: "Dosificación en fertirriego", color: "var(--mc-green-500)" },
];

function TabInicio({ historial, onAbrir, onPreset, onNuevo }: { historial: HistRow[]; onAbrir: (tipo: string) => void; onPreset: () => void; onNuevo: () => void }) {
  // KPIs reales derivados del historial
  const ahora = new Date();
  const esEsteMes = (f: string) => {
    const [d, m, y] = f.split("/").map(Number);
    return m === ahora.getMonth() + 1 && y === ahora.getFullYear();
  };
  const esteMes = historial.filter((r) => esEsteMes(r.fecha)).length;
  const litros = Math.round(historial.reduce((s, r) => s + (parseFloat(String(r.total).replace(/[^\d.]/g, "")) || 0), 0));
  const lotesTratados = new Set(historial.map((r) => r.lote).filter((l) => l && l !== "—")).size;
  const conteoProd = new Map<string, number>();
  historial.forEach((r) => conteoProd.set(r.producto, (conteoProd.get(r.producto) || 0) + 1));
  const masUsado = [...conteoProd.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <>
      <div className="grid g-cols-5">
        <KPI label="Cálculos guardados" value={String(historial.length)} delta={historial.length ? `${esteMes} este mes` : "—"} trend="up" icon="flask" accent />
        <KPI label="Cálculos este mes" value={String(esteMes)} delta={esteMes ? "registrados" : "—"} trend="up" icon="calendar" />
        <KPI label="Insumos dosificados" value={litros > 0 ? `${litros.toLocaleString("es-AR")} L` : "—"} delta="acumulado" trend="up" icon="droplet" />
        <KPI label="Lotes tratados" value={String(lotesTratados)} delta={lotesTratados ? "con cálculo" : "—"} trend="up" icon="map" />
        <KPI label="Producto más usado" value={masUsado ? masUsado[0] : "—"} delta={masUsado ? `${masUsado[1]} cálculo(s)` : "—"} trend="up" icon="leaf" />
      </div>
      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        <button className="mc-btn mc-btn--secondary" onClick={onPreset}>
          <Icon name="book" size={14} />Preestablecidos
        </button>
        <button className="mc-btn mc-btn--primary" onClick={onNuevo}>
          <Icon name="plus" size={14} />Nuevo cálculo
        </button>
      </div>
      <div className="grid g-cols-3 gap-16">
        {TIPOS_CALCULO.map((t) => (
          <div key={t.tipo} className="mc-card" style={{ cursor: "pointer", borderTop: `3px solid ${t.color}` }} onClick={() => onAbrir(t.tipo)}>
            <div className="row gap-8">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: t.color + "22", color: t.color, display: "grid", placeItems: "center" }}>
                <Icon name="flask" size={18} />
              </div>
              <div>
                <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{t.tipo}</div>
                <div className="text-xs text-muted">{t.desc}</div>
              </div>
            </div>
            <button
              className="mc-btn mc-btn--secondary mc-btn--sm mt-12"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={(e) => {
                e.stopPropagation();
                onAbrir(t.tipo);
              }}
            >
              Abrir calculadora →
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function configDesdeTipo(tipo: string): ConfigCalculo {
  const cat = TIPO_A_CATEGORIA[tipo] || "Herbicida";
  return {
    ...CONFIG_VACIA,
    productos: [{ tipo: cat, nombre: "", costoUnitario: "", dosis: "1.0", unidad: "Lt/Ha" }],
  };
}

/* =================================================================== */
/* TAB NUEVO CÁLCULO                                                   */
/* =================================================================== */

function TabNuevo({
  lotes,
  config,
  setConfig,
  onGuardar,
  onGuardarPreset,
  onError,
  onCancelar,
}: {
  lotes: Lote[];
  config: ConfigCalculo;
  setConfig: React.Dispatch<React.SetStateAction<ConfigCalculo>>;
  onGuardar: (row: HistRow) => void;
  onGuardarPreset: (nombre: string, cfg: ConfigCalculo) => void | Promise<void>;
  onError: (m: string) => void;
  onCancelar: () => void;
}) {
  const [prodModal, setProdModal] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [presetModal, setPresetModal] = useState(false);
  const [presetNombre, setPresetNombre] = useState("");

  const { area, caldo, tanque, productos } = config;
  const ct = caldoTotal(config);
  const nCargas = cargas(config);

  const setField = <K extends keyof ConfigCalculo>(k: K, v: ConfigCalculo[K]) => setConfig((c) => ({ ...c, [k]: v }));

  const onLoteChange = (nombre: string) => {
    const lote = lotes.find((l) => l.nombre === nombre);
    setConfig((c) => ({
      ...c,
      loteNombre: nombre,
      loteId: lote?.id ?? null,
      area: lote?.hectareas ?? c.area,
    }));
  };

  const addProducto = (p: ProductoMezcla) => {
    setConfig((c) => {
      const prods = [...c.productos];
      if (editIdx !== null) prods[editIdx] = p;
      else prods.push(p);
      return { ...c, productos: prods };
    });
    setEditIdx(null);
  };

  const removeProducto = (i: number) => setConfig((c) => ({ ...c, productos: c.productos.filter((_, idx) => idx !== i) }));

  const guardarCalculo = async () => {
    if (productos.length === 0) {
      onError("Agregá al menos un producto a la mezcla");
      return;
    }
    const p0 = productos[0];
    if (!p0.nombre.trim()) {
      onError("El primer producto necesita un nombre");
      return;
    }
    setGuardando(true);
    const payload = {
      nombre: `Mezcla ${p0.nombre} · ${area} Ha`,
      tipoProducto: p0.tipo,
      nombreProducto: p0.nombre,
      concentracion: p0.concentracion || null,
      dosisObjetivo: p0.dosis,
      superficieHa: String(area),
      costoUnitario: p0.costoUnitario || null,
      // Costo TOTAL real de la mezcla (todos los productos × área), no solo el primero.
      costoTotal: Math.round(costoPorHaMezcla(config) * Number(area) * 100) / 100 || null,
      aguaPorHa: String(caldo),
      loteId: config.loteId,
      // Guardamos la mezcla completa para poder duplicarla luego (incluye todos los productos)
      observaciones: `Aplicación ${config.tipoAplicacion}. ${productos.length} producto(s). Tanque ${tanque} L. ##CFG##${JSON.stringify(config)}`,
    };
    try {
      const res = await fetch("/api/calculadora-dosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const saved: CalculoApi = await res.json();
      onGuardar({ ...apiToHistRow(saved), config: structuredClone(config) });
    } catch {
      onError("No se pudo guardar el cálculo");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: "1.15fr 1fr", gap: 14 }}>
      {/* === Card izquierda: configuración === */}
      <div className="mc-card">
        <div className="mc-card__head">
          <div>
            <div className="mc-card__eyebrow">Configuración de aplicación</div>
            <div className="mc-card__title mt-4">Nueva Mezcla</div>
          </div>
        </div>
        <div className="col gap-18">
          {/* PASO 1 */}
          <div>
            <PasoTitle n="1" label="Lote y campo" />
            <div className="grid g-cols-2 gap-12">
              <Field label="Lote">
                <select className="mc-select" value={config.loteNombre} onChange={(e) => onLoteChange(e.target.value)}>
                  <option value="">Seleccionar lote…</option>
                  {lotes.map((l) => (
                    <option key={l.id} value={l.nombre}>
                      {l.nombre} ({l.hectareas} Ha)
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Área a tratar (Ha)">
                <input className="mc-input" type="number" value={area} onChange={(e) => setField("area", +e.target.value)} />
              </Field>
              <Field label="Volumen de caldo">
                <div className="row gap-4">
                  <input className="mc-input" type="number" value={caldo} onChange={(e) => setField("caldo", +e.target.value)} />
                  <select className="mc-select" style={{ width: 80 }}>
                    <option>L/Ha</option>
                  </select>
                </div>
              </Field>
              <Field label="Capacidad tanque">
                <div className="row gap-4">
                  <input className="mc-input" type="number" value={tanque} onChange={(e) => setField("tanque", +e.target.value)} />
                  <select className="mc-select" style={{ width: 60 }}>
                    <option>L</option>
                  </select>
                </div>
              </Field>
            </div>
            <div className="text-xs text-muted mt-8">
              Se calcularán <strong>{nCargas} carga{nCargas !== 1 ? "s" : ""}</strong> para cubrir el lote ({ct.toLocaleString("es-AR")} L de caldo).
            </div>
            <div className="mc-field mt-12">
              <label className="mc-label">Tipo de aplicación</label>
              <Seg options={["Terrestre", "Aérea"]} value={config.tipoAplicacion} onChange={(v) => setField("tipoAplicacion", v)} />
            </div>
          </div>

          {/* PASO 2 */}
          <div>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="row gap-8" style={{ alignItems: "center", flex: 1 }}>
                <PasoBadge n="2" />
                <PasoLabel label="Productos en la mezcla" />
                <div style={{ flex: 1, height: 1, background: "var(--mc-line)" }} />
              </div>
              <button
                className="mc-btn mc-btn--secondary mc-btn--sm"
                style={{ marginLeft: 10 }}
                onClick={() => {
                  setEditIdx(null);
                  setProdModal(true);
                }}
              >
                <Icon name="plus" size={12} />Agregar Producto
              </button>
            </div>

            {productos.length === 0 ? (
              <div
                style={{
                  padding: "20px 14px",
                  border: "1.5px dashed var(--mc-line)",
                  borderRadius: 10,
                  textAlign: "center",
                  color: "var(--mc-text-3)",
                  fontSize: 13,
                }}
              >
                Sin productos. Usá “+ Agregar Producto” para armar la mezcla.
              </div>
            ) : (
              <div className="col gap-8">
                {productos.map((p, i) => (
                  <div key={i} style={{ padding: 12, border: "1.5px solid var(--mc-line)", borderRadius: 10, background: "var(--mc-surface-2)" }}>
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                      <div className="row gap-8" style={{ alignItems: "center" }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: (COLOR_CATEGORIA[p.tipo] || "var(--mc-green-600)") + "22",
                            color: COLOR_CATEGORIA[p.tipo] || "var(--mc-green-600)",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <Icon name={ICONO_CATEGORIA[p.tipo] || "flask"} size={15} />
                        </div>
                        <div>
                          <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{p.nombre || "Producto sin nombre"}</div>
                          <div className="text-xs text-muted">
                            Dosis: {p.dosis} {p.unidad}
                            {num(p.costoUnitario) > 0 && <> · {fmtUSD(costoPorHa(p))}/Ha</>}
                          </div>
                        </div>
                      </div>
                      <div className="row gap-4">
                        <Badge tone="neutral" style={{ fontSize: 10 }}>{p.tipo}</Badge>
                        <button
                          className="mc-icon-btn"
                          style={{ width: 26, height: 26, border: "none" }}
                          title="Editar"
                          onClick={() => {
                            setEditIdx(i);
                            setProdModal(true);
                          }}
                        >
                          <Icon name="pen" size={13} />
                        </button>
                        <button
                          className="mc-icon-btn"
                          style={{ width: 26, height: 26, border: "none", color: "var(--mc-red)" }}
                          title="Eliminar"
                          onClick={() => removeProducto(i)}
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="row gap-8 mt-4" style={{ flexWrap: "wrap" }}>
            <button className="mc-btn mc-btn--ghost" onClick={onCancelar}>Cancelar</button>
            <div style={{ flex: 1 }} />
            <button
              className="mc-btn mc-btn--secondary"
              disabled={productos.length === 0}
              onClick={() => { setPresetNombre(productos[0]?.nombre ? `Mezcla ${productos[0].nombre}` : "Mi preestablecido"); setPresetModal(true); }}
              title="Guardar esta mezcla como preestablecido reutilizable"
            >
              <Icon name="book" size={14} />Guardar como preestablecido
            </button>
            <button className="mc-btn mc-btn--primary" onClick={guardarCalculo} disabled={guardando}>
              <Icon name="save" size={14} />{guardando ? "Guardando…" : "Guardar Cálculo"}
            </button>
          </div>
        </div>
      </div>

      {/* === Card derecha: resultado === */}
      <div className="mc-card" style={{ background: "var(--mc-green-50)", borderColor: "var(--mc-green-200)" }}>
        <div className="mc-card__eyebrow" style={{ color: "var(--mc-green-700)" }}>
          Resultado estimado · {productos.length} producto(s)
        </div>
        <div className="col gap-14 mt-12">
          {productos.length === 0 && <div className="text-sm text-muted">Agregá productos para ver el resultado estimado.</div>}
          {productos.map((p, i) => {
            const unidad = p.unidad.replace("/Ha", "");
            return (
              <div key={i}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div className="text-xs font-semi" style={{ color: "var(--mc-green-700)" }}>{p.nombre || `Producto ${i + 1}`}</div>
                  <Badge tone="neutral" style={{ fontSize: 10 }}>{p.tipo}</Badge>
                </div>
                <ResultRow label="Total producto" value={`${totalProducto(p, area).toFixed(1)} ${unidad}`} detail={`${area} Ha × ${p.dosis} ${p.unidad}`} />
                <div className="text-xs text-muted mt-2">{porTanque(p, caldo).toFixed(1)} {unidad} / tanque</div>
              </div>
            );
          })}
          <div className="mc-divider" />
          <ResultRow label="Caldo total" value={`${ct.toLocaleString("es-AR")} L`} detail={`${caldo} L/Ha × ${area} Ha`} />
          <ResultRow label="Cargas de tanque" value={`${nCargas} carga${nCargas !== 1 ? "s" : ""}`} detail={`Tanque ${tanque.toLocaleString("es-AR")} L`} />
          <div className="mc-divider" />
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <div className="mc-card__eyebrow">Costo Total Mezcla</div>
              <div className="text-xs text-muted mt-2">{fmtUSD(costoPorHaMezcla(config))} USD/Ha</div>
            </div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 32, color: "var(--mc-green-800)", lineHeight: 1 }}>
              {fmtUSD(costoTotalMezcla(config))}
            </div>
          </div>
          <div className="text-xs text-muted">Costo total USD basado en el último precio de insumos cargado.</div>
        </div>
      </div>

      <AgregarProductoModal
        open={prodModal}
        onClose={() => {
          setProdModal(false);
          setEditIdx(null);
        }}
        onAdd={addProducto}
        area={area}
        editing={editIdx !== null ? productos[editIdx] : null}
      />

      <Modal
        open={presetModal}
        onClose={() => setPresetModal(false)}
        title="Guardar preestablecido"
        subtitle="Reutilizá esta mezcla en futuros cálculos con un clic."
        width={460}
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setPresetModal(false)}>Cancelar</button>
            <button
              className="mc-btn mc-btn--primary"
              disabled={!presetNombre.trim()}
              onClick={async () => { await onGuardarPreset(presetNombre.trim(), structuredClone(config)); setPresetModal(false); }}
            >
              <Icon name="book" size={14} />Guardar
            </button>
          </>
        }
      >
        <Field label="Nombre del preestablecido">
          <input className="mc-input" value={presetNombre} onChange={(e) => setPresetNombre(e.target.value)} placeholder="Ej: Glifosato barbecho" autoFocus />
        </Field>
        <div className="text-xs text-muted mt-8">Se guardarán los {productos.length} producto(s), el caldo ({caldo} L/Ha) y el tanque ({tanque} L).</div>
      </Modal>
    </div>
  );
}

function ResultRow({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="text-sm" style={{ color: "var(--mc-text-2)" }}>{label}</div>
        <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--mc-ink)", lineHeight: 1 }}>{value}</div>
      </div>
      <div className="text-xs text-muted">{detail}</div>
    </div>
  );
}

function PasoBadge({ n }: { n: string }) {
  return (
    <span style={{ width: 22, height: 22, borderRadius: 7, background: "var(--mc-green-600)", color: "white", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, fontFamily: "var(--ff-mono)" }}>
      {n}
    </span>
  );
}
function PasoLabel({ label }: { label: string }) {
  return <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>;
}
function PasoTitle({ n, label }: { n: string; label: string }) {
  return (
    <div className="row gap-8" style={{ alignItems: "center", marginBottom: 10 }}>
      <PasoBadge n={n} />
      <PasoLabel label={label} />
      <div style={{ flex: 1, height: 1, background: "var(--mc-line)" }} />
    </div>
  );
}

/* =================================================================== */
/* TAB HISTORIAL                                                       */
/* =================================================================== */

function TabHistorial({ rows, onEliminar, onDuplicar }: { rows: HistRow[]; onEliminar: (r: HistRow) => void; onDuplicar: (r: HistRow) => void }) {
  const [q, setQ] = useState("");
  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => `${r.producto} ${r.lote} ${r.fecha}`.toLowerCase().includes(t));
  }, [rows, q]);

  const exportar = () => {
    const head = "Fecha,Producto,Lote,Ha,Dosis,Total,Costo,Usuario\n";
    const body = filtradas
      .map((r) => [r.fecha, r.producto, r.lote, r.ha, r.dosis, r.total, r.costo, r.usuario].map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([head + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "micampo-calculos-dosis.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div className="mc-card__title">Historial de cálculos</div>
        <div className="row gap-8" style={{ alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Icon name="search" size={13} style={{ position: "absolute", left: 9, top: 8, color: "var(--mc-text-3)" }} />
            <input className="mc-input mc-input--sm" style={{ paddingLeft: 28, height: 30, fontSize: 12.5, width: 200 }} placeholder="Buscar producto o lote…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={exportar} disabled={filtradas.length === 0}>
            <Icon name="download" size={13} />Exportar
          </button>
        </div>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--mc-text-3)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--mc-green-50)", color: "var(--mc-green-700)", display: "grid", placeItems: "center", margin: "0 auto 10px" }}><Icon name="flask" size={20} /></div>
          <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14 }}>Sin cálculos guardados</div>
          <div className="text-xs" style={{ marginTop: 4 }}>Armá una mezcla en “Nuevo Cálculo” y guardala para verla acá.</div>
        </div>
      ) : (
        <table className="mc-table">
          <thead>
            <tr>
              <th>Fecha</th><th>Producto</th><th>Lote</th><th className="mc-cell--num">Ha</th>
              <th>Dosis</th><th className="mc-cell--num">Total</th><th className="mc-cell--num">Costo</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((r, i) => (
              <tr key={r.id ?? i}>
                <td className="mc-cell--mono">{r.fecha}</td>
                <td className="mc-cell--emph">{r.producto}</td>
                <td>{r.lote}</td>
                <td className="mc-cell--num">{r.ha}</td>
                <td>{r.dosis}</td>
                <td className="mc-cell--num">{r.total}</td>
                <td className="mc-cell--num">{r.costo}</td>
                <td>
                  <div className="row gap-2" style={{ justifyContent: "flex-end" }}>
                    <button className="mc-icon-btn" style={{ width: 26, height: 26, border: "none" }} title="Duplicar" aria-label="Duplicar cálculo" onClick={() => onDuplicar(r)}>
                      <Icon name="copy" size={13} />
                    </button>
                    <button className="mc-icon-btn" style={{ width: 26, height: 26, border: "none", color: "var(--mc-red)" }} title="Eliminar" aria-label="Eliminar cálculo" onClick={() => onEliminar(r)}>
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* =================================================================== */
/* TAB PREESTABLECIDOS                                                 */
/* =================================================================== */

type SugeridoPreset = { nombre: string; tipo: string; dosis: string; caldo: string; productos: number; color: string; justificacion?: string; config: ConfigCalculo };

function TabPreset({ userPresets, onUsar, onEliminarPreset, onCrear }: { userPresets: UserPreset[]; onUsar: (cfg: ConfigCalculo) => void; onEliminarPreset: (id: string) => void; onCrear: () => void }) {
  const [detalle, setDetalle] = useState<{ nombre: string; tipo: string; caldo: string; config: ConfigCalculo } | null>(null);
  const [sugeridos, setSugeridos] = useState<SugeridoPreset[] | null>(null);

  useEffect(() => {
    fetch("/api/dosis-presets/sugeridos")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setSugeridos(Array.isArray(d) ? d : []))
      .catch(() => setSugeridos([]));
  }, []);

  const resumen = (cfg: ConfigCalculo) => {
    const p0 = cfg.productos[0];
    return {
      tipo: p0?.tipo || "Mezcla",
      dosis: p0 ? `${p0.dosis} ${p0.unidad}` : "—",
      caldo: `${cfg.caldo} L/Ha`,
      productos: cfg.productos.length,
    };
  };

  return (
    <>
      {/* Preestablecidos del usuario */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="mc-card__title">Tus preestablecidos</div>
        <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={onCrear}><Icon name="plus" size={13} />Crear nuevo</button>
      </div>
      {userPresets.length === 0 ? (
        <div className="mc-card" style={{ textAlign: "center", color: "var(--mc-text-3)", padding: "26px 16px" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--mc-green-50)", color: "var(--mc-green-700)", display: "grid", placeItems: "center", margin: "0 auto 10px" }}><Icon name="book" size={20} /></div>
          <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14 }}>Todavía no guardaste preestablecidos</div>
          <div className="text-xs" style={{ marginTop: 4 }}>Armá una mezcla en “Nuevo Cálculo” y tocá “Guardar como preestablecido”.</div>
        </div>
      ) : (
        <div className="grid g-cols-2 gap-16">
          {userPresets.map((up) => {
            const r = resumen(up.config);
            return (
              <div key={up.id} className="mc-card" style={{ borderTop: `3px solid var(--mc-green-600)` }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div className="mc-card__eyebrow">{r.tipo} · tuyo</div>
                    <div className="mc-card__title mt-4">{up.nombre}</div>
                  </div>
                  <div className="row gap-4">
                    <Badge tone="neutral">{r.productos} prod.</Badge>
                    <button className="mc-icon-btn" style={{ width: 26, height: 26, border: "none", color: "var(--mc-red)" }} title="Eliminar" aria-label="Eliminar preestablecido" onClick={() => onEliminarPreset(up.id)}>
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </div>
                <div className="grid g-cols-3 gap-8 mt-12">
                  <div><div className="text-xs text-muted">Dosis</div><div className="font-semi">{r.dosis}</div></div>
                  <div><div className="text-xs text-muted">Caldo</div><div className="font-semi">{r.caldo}</div></div>
                  <div><div className="text-xs text-muted">Área ref.</div><div className="font-semi">{up.config.area} Ha</div></div>
                </div>
                <div className="row gap-8 mt-12">
                  <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => setDetalle({ nombre: up.nombre, tipo: r.tipo, caldo: r.caldo, config: up.config })}>Ver detalle</button>
                  <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => onUsar(up.config)}>Usar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sugeridos por IA según tus cultivos */}
      <div className="row mt-12" style={{ alignItems: "center", gap: 8 }}>
        <div className="mc-card__title">Sugeridos para tus cultivos</div>
        <IABadge />
      </div>
      {sugeridos === null ? (
        <div className="mc-card" style={{ textAlign: "center", color: "var(--mc-text-3)", padding: 22 }}>Analizando tus cultivos…</div>
      ) : sugeridos.length === 0 ? (
        <div className="mc-card" style={{ textAlign: "center", color: "var(--mc-text-3)", padding: 22 }}>
          Cargá cultivos en tus lotes y acá vas a ver mezclas sugeridas según lo que sembrás.
        </div>
      ) : (
        <div className="grid g-cols-2 gap-16">
          {sugeridos.map((p, i) => (
            <div key={i} className="mc-card" style={{ borderTop: `3px solid ${p.color}` }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div className="mc-card__eyebrow">{p.tipo} · sugerido</div>
                  <div className="mc-card__title mt-4">{p.nombre}</div>
                </div>
                <Badge tone="neutral">{p.productos} prod.</Badge>
              </div>
              {p.justificacion && <div className="text-xs text-muted mt-8" style={{ lineHeight: 1.45 }}>{p.justificacion}</div>}
              <div className="grid g-cols-3 gap-8 mt-12">
                <div><div className="text-xs text-muted">Dosis</div><div className="font-semi">{p.dosis}</div></div>
                <div><div className="text-xs text-muted">Caldo</div><div className="font-semi">{p.caldo}</div></div>
                <div><div className="text-xs text-muted">Productos</div><div className="font-semi">{p.productos}</div></div>
              </div>
              <div className="row gap-8 mt-12">
                <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => setDetalle({ nombre: p.nombre, tipo: p.tipo, caldo: p.caldo, config: p.config })}>Ver detalle</button>
                <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => onUsar(p.config)}>Usar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!detalle}
        onClose={() => setDetalle(null)}
        title={detalle?.nombre || ""}
        subtitle={detalle ? `${detalle.tipo} · ${detalle.caldo} de caldo` : ""}
        width={520}
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setDetalle(null)}>Cerrar</button>
            <button
              className="mc-btn mc-btn--primary"
              onClick={() => {
                if (detalle) onUsar(detalle.config);
                setDetalle(null);
              }}
            >
              Usar preset
            </button>
          </>
        }
      >
        {detalle && (
          <div className="col gap-10">
            <div className="text-sm text-muted">Productos del preset:</div>
            {detalle.config.productos.map((p, i) => (
              <div key={i} className="row" style={{ justifyContent: "space-between", padding: "8px 12px", border: "1px solid var(--mc-line)", borderRadius: 8, background: "var(--mc-surface-2)" }}>
                <div className="row gap-8" style={{ alignItems: "center" }}>
                  <Icon name={ICONO_CATEGORIA[p.tipo] || "flask"} size={15} />
                  <span className="font-semi text-sm">{p.nombre}</span>
                </div>
                <span className="text-sm text-muted">{p.dosis} {p.unidad}</span>
              </div>
            ))}
            <div className="text-xs text-muted mt-4">Área de referencia: {detalle.config.area} Ha · Caldo {detalle.config.caldo} L/Ha</div>
          </div>
        )}
      </Modal>
    </>
  );
}

/* =================================================================== */
/* API helpers                                                         */
/* =================================================================== */

type CalculoApi = {
  id: string;
  nombreProducto: string;
  tipoProducto: string;
  dosisObjetivo: number;
  superficieHa: number;
  cantidadTotal: number;
  costoTotal: number | null;
  createdAt: string;
  observaciones?: string | null;
  lote?: { nombre: string } | null;
};

function apiToHistRow(c: CalculoApi): HistRow {
  const fecha = new Date(c.createdAt).toLocaleDateString("es-AR");
  // Recupera la mezcla completa guardada en observaciones (para duplicar)
  let config: ConfigCalculo | undefined;
  if (c.observaciones?.includes("##CFG##")) {
    try { config = JSON.parse(c.observaciones.split("##CFG##")[1]); } catch { /* ignora */ }
  }
  // Unidad real del producto principal (Kg/Ha o Lt/Ha), para no mostrar todo como litros.
  const unidadHa = config?.productos?.[0]?.unidad || "Lt/Ha";
  const unidad = unidadHa.replace("/Ha", "");
  return {
    id: c.id,
    fecha,
    producto: c.nombreProducto,
    lote: c.lote?.nombre || "—",
    ha: c.superficieHa,
    dosis: `${c.dosisObjetivo} ${unidadHa}`,
    total: `${c.cantidadTotal?.toFixed(1) ?? "—"} ${unidad}`,
    costo: c.costoTotal != null ? fmtUSD(c.costoTotal) : "—",
    usuario: "Yo",
    config,
  };
}
