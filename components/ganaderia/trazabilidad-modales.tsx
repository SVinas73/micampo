"use client";

// Modales de Trazabilidad. Todos escriben contra APIs reales:
// - ModalRegistrarAplicacion → PATCH /api/animales/[id] { rfid } (identifica al ternero)
// - ModalNuevoDTE → POST /api/documentos-transito
// - ModalRegistrarAuditoria → POST /api/auditorias-trazabilidad

import { useState } from "react";
import { Icon, IABadge } from "@/components/mc";
import { SecNum } from "./animales-modales";
import { ConfigPais, TernPend } from "./trazabilidad-tipos";
import { TropaAPI } from "./tropas-tipos";

const hoyISO = () => new Date().toISOString().slice(0, 10);

const TIPOS_DISPOSITIVO = [
  { id: "boton", label: "Botón RFID + Tarjeta Visual" },
  { id: "bolo", label: "Bolo Ruminal" },
  { id: "transponder", label: "Transponder Inyectable" },
];

/* ============ REGISTRAR APLICACIÓN DE DISPOSITIVO ============ */
export function ModalRegistrarAplicacion({
  cfg,
  terneros,
  ternInicial,
  onClose,
  onGuardado,
}: {
  cfg: ConfigPais;
  terneros: TernPend[];
  ternInicial?: TernPend | null;
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [animalSel, setAnimalSel] = useState<TernPend | null>(ternInicial || null);
  const [tipoDisp, setTipoDisp] = useState("boton");
  const [numero, setNumero] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const q = busqueda.trim().toLowerCase();
  const resultados = q === "" ? terneros : terneros.filter((a) => a.id.toLowerCase().includes(q));

  const guardar = async () => {
    if (!animalSel || !numero.trim()) {
      setError("Seleccioná un animal e ingresá el número de identificación.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const r = await fetch(`/api/animales/${animalSel.animal.dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campos: { rfid: numero.trim() } }),
      });
      if (!r.ok) throw new Error();
      // Registrar la identificación como evento de vida para no perder el tipo de
      // dispositivo ni la fecha de aplicación (escritura secundaria, no fatal).
      const tipoLabel = TIPOS_DISPOSITIVO.find((t) => t.id === tipoDisp)?.label || tipoDisp;
      await fetch("/api/eventos-vida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId: animalSel.animal.dbId,
          fecha,
          tipoEvento: "Identificacion",
          titulo: `Identificación electrónica · ${tipoLabel}`,
          descripcion: `Dispositivo N° ${numero.trim()} aplicado. Declarar ante ${cfg.organismo} (${cfg.sistema}) dentro de ${cfg.plazoDeclaracionDias} días hábiles.`,
          importante: true,
        }),
      }).catch(() => {});
      onGuardado?.();
      onClose();
    } catch {
      setError("No se pudo registrar el dispositivo. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(540px,95vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div className="mc-modal__title" style={{ fontSize: 20 }}>Registrar Aplicación de Dispositivo</div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <SecNum n={1} title="¿A qué animal?" />
            <div className="row" style={{ background: "var(--mc-surface-2)", border: "1px solid var(--mc-line-2)", borderRadius: 10, padding: "8px 12px", marginBottom: 8 }}>
              <Icon name="search" size={14} style={{ color: "var(--mc-text-3)" }} />
              <input value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setAnimalSel(null); }} placeholder="Buscar por caravana…" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 13, fontFamily: "inherit" }} />
            </div>
            <div className="col gap-6" style={{ maxHeight: 140, overflowY: "auto" }}>
              {resultados.map((a) => {
                const sel = animalSel?.id === a.id;
                return (
                  <div key={a.animal.dbId} onClick={() => setAnimalSel(a)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, cursor: "pointer", border: sel ? "2px solid var(--mc-green-500)" : "1px solid var(--mc-line)", background: sel ? "var(--mc-green-50)" : "var(--mc-surface)" }}>
                    <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: "var(--mc-ink)" }}>{a.id} <span style={{ color: "var(--mc-text-3)", fontWeight: 500 }}>· {a.cat}</span></div>
                    {sel && <Icon name="check" size={14} style={{ color: "var(--mc-green-600)" }} />}
                  </div>
                );
              })}
              {resultados.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Sin terneros pendientes.</div>}
            </div>
          </div>

          <div>
            <SecNum n={2} title="Tipo de dispositivo" />
            <div className="row gap-10">
              {TIPOS_DISPOSITIVO.map((o) => {
                const sel = tipoDisp === o.id;
                return (
                  <div key={o.id} onClick={() => setTipoDisp(o.id)} style={{ flex: 1, textAlign: "center", padding: "12px 8px", borderRadius: 12, cursor: "pointer", border: sel ? "2px solid var(--mc-green-500)" : "1px solid var(--mc-line)", background: sel ? "var(--mc-green-50)" : "var(--mc-surface)", fontSize: 12, fontWeight: 600, color: "var(--mc-ink)" }}>
                    {o.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <SecNum n={3} title="Identificación" />
            <div className="col gap-10">
              <div className="mc-field">
                <label className="mc-label row gap-6" style={{ alignItems: "center" }}>
                  Número de identificación*
                  <span title="Código país + especie (bovino) + número secuencial" style={{ cursor: "help", display: "inline-flex" }}>
                    <Icon name="info" size={12} style={{ color: "var(--mc-text-3)" }} />
                  </span>
                </label>
                <input className="mc-input" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="032-01-0000001234" />
              </div>
              <div className="mc-field">
                <label className="mc-label">Fecha de aplicación</label>
                <input type="date" className="mc-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="row gap-8" style={{ padding: "10px 12px", background: "var(--mc-surface-2)", borderRadius: 10, alignItems: "flex-start" }}>
            <Icon name="clock" size={14} style={{ color: "var(--mc-text-2)", flexShrink: 0, marginTop: 1 }} />
            <span className="text-xs text-muted">Tenés {cfg.plazoDeclaracionDias} días hábiles para declarar esto ante {cfg.organismo} una vez aplicado.</span>
          </div>
          {error && <div className="text-xs" style={{ color: "var(--mc-red)" }}>{error}</div>}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} className="mc-btn mc-btn--ghost" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={guardar} disabled={guardando} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }}>{guardando ? "Guardando…" : "Guardar y Declarar"}</button>
        </div>
      </div>
    </div>
  );
}

/* ============ NUEVO DOCUMENTO DE TRÁNSITO ============ */
export function ModalNuevoDTE({
  cfg,
  tropas,
  onClose,
  onGuardado,
}: {
  cfg: ConfigPais;
  tropas: TropaAPI[];
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("Venta");
  const [cantidad, setCantidad] = useState("");
  const [tropaRefId, setTropaRefId] = useState("");
  const [csmCargado, setCsmCargado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const requiereAvisoCSM = motivo === "Venta" || motivo === "Faena";
  // En una compra la hacienda entra al establecimiento propio: el campo libre
  // es el origen (de dónde se compra) y el destino es el establecimiento propio.
  const esEntrada = motivo === "Compra";
  const rotuloContraparte = esEntrada ? "Origen" : "Destino";

  const seleccionarTropa = (id: string) => {
    setTropaRefId(id);
    const t = tropas.find((x) => x.id === id);
    if (t) setCantidad(String(t._count?.animales ?? t.animales?.length ?? ""));
  };

  const generar = async () => {
    if (!destino.trim()) {
      setError(`Ingresá el ${rotuloContraparte.toLowerCase()} del movimiento.`);
      return;
    }
    const cab = parseInt(cantidad);
    if (!cantidad.trim() || isNaN(cab) || cab <= 0) {
      setError("Ingresá la cantidad de cabezas del movimiento.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const tropa = tropas.find((x) => x.id === tropaRefId);
      const notas = [
        tropa ? `Tropa: ${tropa.nombre}` : null,
        cfg.tieneCertificadoSanitario && requiereAvisoCSM ? (csmCargado ? "CSM cargado" : "CSM pendiente") : null,
      ].filter(Boolean).join(" · ");
      const propio = "Establecimiento propio";
      const contraparte = destino.trim();
      const r = await fetch("/api/documentos-transito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origen: esEntrada ? contraparte : propio,
          destino: esEntrada ? propio : contraparte,
          motivo,
          cabezas: cab,
          estado: "Vigente",
          notas: notas || null,
        }),
      });
      if (!r.ok) throw new Error();
      onGuardado?.();
      onClose();
    } catch {
      setError("No se pudo generar el documento. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(580px,95vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div className="mc-modal__title" style={{ fontSize: 20 }}>Nuevo {cfg.documentoTransito}</div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <SecNum n={1} title="Origen y Destino" />
            <div className="col gap-10">
              <div className="row gap-8" style={{ alignItems: "center", padding: "9px 12px", background: "var(--mc-surface-2)", borderRadius: 10 }}>
                <Icon name="mapPin" size={14} style={{ color: "var(--mc-text-2)" }} />
                <span className="text-sm font-semi" style={{ color: "var(--mc-ink)" }}>Establecimiento propio</span>
                <span className="text-xs text-muted">{cfg.identificadorEstablecimiento} de {esEntrada ? "destino" : "origen"}</span>
              </div>
              <div className="mc-field">
                <label className="mc-label">{rotuloContraparte}*</label>
                <input className="mc-input" value={destino} onChange={(e) => setDestino(e.target.value)} placeholder={`Buscar ${cfg.identificadorEstablecimiento}, feria o frigorífico…`} />
              </div>
            </div>
          </div>

          <div>
            <SecNum n={2} title="Motivo del movimiento" />
            <select className="mc-select" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              {["Venta", "Remate-Feria", "Cambio de Campo", "Faena", "Compra"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <SecNum n={3} title="Animales incluidos" />
            <div className="grid g-cols-2">
              <div className="mc-field">
                <label className="mc-label">Cantidad de cabezas*</label>
                <input type="number" className="mc-input" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="0" />
              </div>
              <div className="mc-field">
                <label className="mc-label">Tropa de referencia (opcional)</label>
                <select className="mc-select" value={tropaRefId} onChange={(e) => seleccionarTropa(e.target.value)}>
                  <option value="">Sin tropa asociada</option>
                  {tropas.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({t._count?.animales ?? t.animales?.length ?? 0} cab.)</option>)}
                </select>
              </div>
            </div>
          </div>

          {cfg.tieneCertificadoSanitario && requiereAvisoCSM && (
            <div className="mc-card ia-card" style={{ padding: 14 }}>
              <div className="row gap-8" style={{ alignItems: "flex-start" }}>
                <IABadge />
                <span className="text-sm" style={{ color: "var(--mc-ink)" }}>Este movimiento puede requerir Certificado de Seronegatividad a Brucelosis (CSM) según el destino declarado en {cfg.identificadorEstablecimiento}.</span>
              </div>
              <label className="row gap-8" style={{ alignItems: "center", marginTop: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={csmCargado} onChange={(e) => setCsmCargado(e.target.checked)} />
                <span className="text-sm" style={{ color: "var(--mc-text-2)" }}>Ya tengo el CSM cargado</span>
              </label>
            </div>
          )}
          {error && <div className="text-xs" style={{ color: "var(--mc-red)" }}>{error}</div>}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} className="mc-btn mc-btn--ghost" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={generar} disabled={guardando} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }}>{guardando ? "Generando…" : `Generar ${cfg.documentoTransito}`}</button>
        </div>
      </div>
    </div>
  );
}

/* ============ REGISTRAR AUDITORÍA ============ */
export function ModalRegistrarAuditoria({ onClose, onGuardado }: { onClose: () => void; onGuardado?: () => void }) {
  const [organismo, setOrganismo] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [tipo, setTipo] = useState("Interna");
  const [resultado, setResultado] = useState("Aprobada");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);

  const tipos = ["Interna", "Externa SENASA", "Externa MGAP", "Certificación GLOBALG.A.P.", "Otra"];
  const resultados = ["Aprobada", "Aprobada con observaciones", "Observada", "Rechazada"];

  const confirmar = async () => {
    if (!organismo.trim()) return;
    setGuardando(true);
    try {
      const r = await fetch("/api/auditorias-trazabilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha,
          tipo,
          organismo: organismo.trim(),
          resultado,
          observaciones: observaciones.trim() || null,
        }),
      });
      if (!r.ok) throw new Error();
      onGuardado?.();
      onClose();
    } catch {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(500px,95vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--mc-green-600)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Trazabilidad · Auditoría</div>
              <div className="mc-modal__title" style={{ fontSize: 21 }}>Registrar Auditoría</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <SecNum n={1} title="Datos de la auditoría" />
            <div className="col gap-12">
              <div className="mc-field">
                <label className="mc-label">Auditor / Organismo</label>
                <input className="mc-input" value={organismo} onChange={(e) => setOrganismo(e.target.value)} placeholder="Ej: SENASA, MGAP, Bureau Veritas…" />
              </div>
              <div className="grid g-cols-2">
                <div className="mc-field">
                  <label className="mc-label">Fecha</label>
                  <input type="date" className="mc-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>
                <div className="mc-field">
                  <label className="mc-label">Tipo</label>
                  <select className="mc-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                    {tipos.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <SecNum n={2} title="Resultado" />
            <div className="mc-field">
              <label className="mc-label">Resultado de la auditoría</label>
              <select className="mc-select" value={resultado} onChange={(e) => setResultado(e.target.value)}>
                {resultados.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <SecNum n={3} title="Observaciones" />
            <div className="mc-field">
              <label className="mc-label">Observaciones (opcional)</label>
              <textarea className="mc-input" rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Detalles, hallazgos, acciones correctivas…" style={{ resize: "vertical", fontFamily: "inherit" }} />
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={confirmar} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }} disabled={!organismo.trim() || guardando}>
            <Icon name="check" size={14} /> {guardando ? "Guardando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
