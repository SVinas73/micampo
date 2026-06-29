"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, Modal, Field, useToast } from "@/components/mc";
import { postOffline } from "@/lib/offline";

type Draft = {
  tipoLabor: string;
  loteNombre: string | null;
  loteId: string | null;
  fechaISO: string;
  descripcion: string;
};

const TIPOS = ["Siembra", "Pulverización", "Fertilización", "Cosecha", "Labranza", "Riego", "Monitoreo"];

export function CapturaRapida({
  open,
  onClose,
  onCreada,
}: {
  open: boolean;
  onClose: () => void;
  onCreada?: () => void;
}) {
  const toast = useToast();
  const [texto, setTexto] = useState("");
  const [escuchando, setEscuchando] = useState(false);
  const [interpretando, setInterpretando] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confianza, setConfianza] = useState<number>(0);
  const [lotes, setLotes] = useState<{ id: string; nombre: string }[]>([]);
  const [guardando, setGuardando] = useState(false);
  const recRef = useRef<any>(null);
  const soportaVoz = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    if (open) {
      setTexto(""); setDraft(null); setConfianza(0);
      fetch("/api/lotes").then((r) => (r.ok ? r.json() : [])).then((rows) => {
        if (Array.isArray(rows)) setLotes(rows.map((l: any) => ({ id: l.id, nombre: l.nombre })));
      }).catch(() => {});
    }
  }, [open]);

  const toggleVoz = () => {
    if (!soportaVoz) {
      toast.show("Tu navegador no soporta dictado por voz", "err");
      return;
    }
    if (escuchando) {
      recRef.current?.stop();
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "es-AR";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
      setTexto(t);
    };
    rec.onend = () => setEscuchando(false);
    rec.onerror = () => setEscuchando(false);
    recRef.current = rec;
    setEscuchando(true);
    rec.start();
  };

  const interpretar = async () => {
    if (!texto.trim()) return;
    setInterpretando(true);
    try {
      const res = await fetch("/api/captura/interpretar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      const data = await res.json();
      if (data.labor) {
        setDraft(data.labor);
        setConfianza(data.confianza || 0);
      } else {
        toast.show("No pude interpretar la nota. Probá reformularla.", "err");
      }
    } catch {
      toast.show("Error al interpretar", "err");
    } finally {
      setInterpretando(false);
    }
  };

  const guardar = async () => {
    if (!draft) return;
    if (!draft.loteId) {
      toast.show("Elegí el lote antes de guardar", "err");
      return;
    }
    setGuardando(true);
    try {
      // Tolerante a la falta de señal: si no hay red, se guarda local y se sincroniza solo.
      const r = await postOffline("/api/labores", {
        tipo: draft.tipoLabor,
        fecha: draft.fechaISO,
        loteId: draft.loteId,
        descripcion: draft.descripcion,
        estado: "Programada",
      }, `${draft.tipoLabor} en ${draft.loteNombre || "lote"}`);
      if (!r.ok) { toast.show("No se pudo guardar la labor", "err"); return; }
      toast.show(r.offline ? "Guardado sin conexión · se sincroniza al reconectar" : "Labor registrada");
      onCreada?.();
      onClose();
    } catch {
      toast.show("No se pudo guardar la labor", "err");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Captura rápida"
      subtitle="Contá lo que hiciste en el campo y la IA lo registra por vos."
      footer={
        draft ? (
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setDraft(null)}>Volver</button>
            <button className="mc-btn mc-btn--primary" onClick={guardar} disabled={guardando}>
              <Icon name="check" size={14} />Guardar labor
            </button>
          </>
        ) : (
          <>
            <button className="mc-btn mc-btn--ghost" onClick={onClose}>Cancelar</button>
            <button className="mc-btn mc-btn--primary" onClick={interpretar} disabled={interpretando || !texto.trim()}>
              <Icon name="sparkles" size={14} />{interpretando ? "Interpretando…" : "Interpretar"}
            </button>
          </>
        )
      }
    >
      {!draft ? (
        <div className="col gap-12">
          <div style={{ position: "relative" }}>
            <textarea
              className="mc-input"
              style={{ width: "100%", minHeight: 90, resize: "vertical", paddingRight: 48 }}
              placeholder={'Ej: "Sembré el lote Norte 1 con soja hoy" o "pulvericé glifosato en el Este 2 ayer"'}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <button
              onClick={toggleVoz}
              title={escuchando ? "Detener" : "Dictar por voz"}
              style={{
                position: "absolute", right: 8, top: 8, width: 36, height: 36, borderRadius: 9, border: "none", cursor: "pointer",
                display: "grid", placeItems: "center", color: "#fff",
                background: escuchando ? "#c93434" : "#5e7733",
              }}
            >
              <Icon name="camera" size={16} />
              {escuchando && <span className="mc-copilot-orb__pulse" style={{ background: "rgba(201,52,52,0.5)" }} />}
            </button>
          </div>
          <div className="text-xs text-muted">
            {soportaVoz ? (escuchando ? "Escuchando… hablá ahora." : "Tocá el micrófono para dictar, o escribí la nota.") : "Escribí tu nota de campo."}
          </div>
        </div>
      ) : (
        <div className="col gap-12">
          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <span className="mc-badge mc-badge--green"><span className="mc-badge__dot" />Interpretado</span>
            <span className="text-xs text-muted">Confianza {confianza}% · revisá y confirmá</span>
          </div>
          <div className="grid g-cols-2 gap-12">
            <Field label="Tipo de labor">
              <select className="mc-select" value={draft.tipoLabor} onChange={(e) => setDraft({ ...draft, tipoLabor: e.target.value })}>
                {TIPOS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Lote">
              <select
                className="mc-select"
                value={draft.loteId || ""}
                onChange={(e) => {
                  const l = lotes.find((x) => x.id === e.target.value);
                  setDraft({ ...draft, loteId: l?.id || null, loteNombre: l?.nombre || null });
                }}
              >
                <option value="">Elegí un lote…</option>
                {lotes.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Fecha">
            <input type="date" className="mc-input" value={draft.fechaISO} onChange={(e) => setDraft({ ...draft, fechaISO: e.target.value })} />
          </Field>
          <Field label="Descripción">
            <textarea className="mc-input" style={{ width: "100%", minHeight: 60 }} value={draft.descripcion} onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })} />
          </Field>
        </div>
      )}
    </Modal>
  );
}
