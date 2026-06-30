"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, Modal, Field, useToast } from "@/components/mc";

export type Perfil = { id?: string; name?: string | null; email?: string | null; image?: string | null };

/** Redimensiona la imagen elegida a un cuadrado chico (≤256px) y devuelve un data URL liviano. */
function resizeToDataURL(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function iniciales(nombre?: string | null) {
  return (nombre || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
}

export function PerfilModal({ open, onClose, perfil, onSaved }: { open: boolean; onClose: () => void; perfil: Perfil | null; onSaved: (p: Perfil) => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setName(perfil?.name || ""); setImage(perfil?.image || null); }
  }, [open, perfil]);

  const elegir = async (f: File | null) => {
    if (!f) return;
    try { setImage(await resizeToDataURL(f)); }
    catch { toast.show("No se pudo procesar la imagen", "err"); }
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image }),
      });
      if (!res.ok) throw new Error();
      const p = await res.json();
      onSaved(p);
      toast.show("Perfil actualizado");
      onClose();
    } catch { toast.show("No se pudo guardar el perfil", "err"); }
    finally { setGuardando(false); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tu perfil"
      subtitle="Tu foto y nombre se muestran en las actividades que registres."
      footer={<>
        <button className="mc-btn mc-btn--ghost" onClick={onClose}>Cancelar</button>
        <button className="mc-btn mc-btn--primary" onClick={guardar} disabled={guardando}><Icon name="check" size={14} />{guardando ? "Guardando…" : "Guardar"}</button>
      </>}
    >
      {toast.node}
      <div className="col gap-14">
        <div className="row gap-14" style={{ alignItems: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "#5E8F78", color: "#fff", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 700, flexShrink: 0 }}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="Foto de perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : iniciales(name)}
          </div>
          <div className="col gap-8">
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => elegir(e.target.files?.[0] || null)} />
            <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => fileRef.current?.click()}><Icon name="camera" size={13} />Subir foto</button>
            {image && <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => setImage(null)} style={{ color: "var(--mc-red)" }}><Icon name="trash" size={13} />Quitar foto</button>}
          </div>
        </div>
        <Field label="Nombre"><input className="mc-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" /></Field>
        {perfil?.email && <div className="text-xs text-muted">{perfil.email}</div>}
      </div>
    </Modal>
  );
}
