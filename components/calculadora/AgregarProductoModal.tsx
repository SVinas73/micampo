"use client";

import React, { useEffect, useState } from "react";
import { Icon, Modal, Field } from "@/components/mc";
import { CATEGORIAS, COLOR_CATEGORIA, type Categoria, type ProductoMezcla } from "./types";
import { logistica, num, fmtUSD } from "./calc";

export function AgregarProductoModal({
  open,
  onClose,
  onAdd,
  area,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (p: ProductoMezcla) => void;
  area: number;
  editing?: ProductoMezcla | null;
}) {
  const [tipo, setTipo] = useState<Categoria>("Herbicida");
  const [nombre, setNombre] = useState("");
  const [costoUnitario, setCostoUnitario] = useState("");
  const [dosis, setDosis] = useState("");
  const [unidad, setUnidad] = useState("Lt/Ha");
  const [concentracion, setConcentracion] = useState("");
  const [carencia, setCarencia] = useState("");

  useEffect(() => {
    if (open) {
      setTipo((editing?.tipo as Categoria) || "Herbicida");
      setNombre(editing?.nombre || "");
      setCostoUnitario(editing?.costoUnitario || "");
      setDosis(editing?.dosis || "");
      setUnidad(editing?.unidad || "Lt/Ha");
      setConcentracion(editing?.concentracion || "");
      setCarencia(editing?.carencia || "");
    }
  }, [open, editing]);

  const { litros, bidones } = logistica(num(dosis), num(area));
  const costoTotal = num(dosis) * num(area) * num(costoUnitario);

  const submit = () => {
    if (!nombre.trim() || !dosis) return;
    onAdd({ tipo, nombre: nombre.trim(), costoUnitario, dosis, unidad, concentracion, carencia });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agregar Producto"
      subtitle="Definí el producto, su dosis objetivo y costo para la mezcla."
      width={620}
      footer={
        <>
          <button className="mc-btn mc-btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" onClick={submit}>
            <Icon name="plus" size={14} />
            {editing ? "Guardar cambios" : "Agregar a la Mezcla"}
          </button>
        </>
      }
    >
      {/* 1. Categorización */}
      <SectionTitle n="1" label="Categorización" />
      <div className="row gap-8" style={{ flexWrap: "wrap", marginBottom: 16 }}>
        {CATEGORIAS.map((c) => {
          const on = tipo === c;
          const color = COLOR_CATEGORIA[c];
          return (
            <button
              key={c}
              onClick={() => setTipo(c)}
              style={{
                border: on ? `2px solid ${color}` : "1.5px solid var(--mc-line)",
                borderRadius: 9,
                padding: "7px 16px",
                fontSize: 13,
                fontWeight: on ? 700 : 500,
                cursor: "pointer",
                background: on ? color + "1a" : "var(--mc-surface)",
                color: on ? color : "var(--mc-text-2)",
                transition: "all .15s",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* 2. Nombre + costo */}
      <SectionTitle n="2" label="Identificación" />
      <div className="grid g-cols-2 gap-12" style={{ marginBottom: 16 }}>
        <Field label="Nombre Comercial">
          <input
            className="mc-input"
            placeholder="Ej: Glifosato 48%"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </Field>
        <Field label="Costo Unitario (USD /Lt)">
          <input
            className="mc-input"
            type="number"
            placeholder="0.00"
            value={costoUnitario}
            onChange={(e) => setCostoUnitario(e.target.value)}
          />
        </Field>
      </div>

      {/* 3. Dosis */}
      <SectionTitle n="3" label="Dosis y aplicación" />
      <div className="grid g-cols-3 gap-12">
        <Field label="Dosis Objetivo">
          <div className="row gap-4">
            <input
              className="mc-input"
              type="number"
              placeholder="0.0"
              value={dosis}
              onChange={(e) => setDosis(e.target.value)}
            />
            <select className="mc-select" style={{ width: 90 }} value={unidad} onChange={(e) => setUnidad(e.target.value)}>
              <option>Lt/Ha</option>
              <option>Kg/Ha</option>
            </select>
          </div>
        </Field>
        <Field label="Concentración % (opcional)">
          <input
            className="mc-input"
            type="number"
            placeholder="48"
            value={concentracion}
            onChange={(e) => setConcentracion(e.target.value)}
          />
        </Field>
        <Field label="Carencia (días)">
          <input
            className="mc-input"
            type="number"
            placeholder="0"
            value={carencia}
            onChange={(e) => setCarencia(e.target.value)}
          />
        </Field>
      </div>

      {/* Logística en vivo */}
      <div
        style={{
          marginTop: 16,
          padding: "12px 14px",
          borderRadius: 10,
          background: "var(--mc-green-50)",
          border: "1px solid var(--mc-green-200)",
        }}
      >
        <div className="font-semi text-sm" style={{ color: "var(--mc-green-700)", marginBottom: 4 }}>
          Logística
        </div>
        <div className="text-sm" style={{ color: "var(--mc-ink)" }}>
          Para <strong>{num(area)} Has</strong> necesitás{" "}
          <strong>{litros.toLocaleString("es-AR", { maximumFractionDigits: 1 })} {unidad.replace("/Ha", "")}</strong>{" "}
          (aprox. <strong>{bidones} bidones de 20L</strong>).
        </div>
        {num(costoUnitario) > 0 && (
          <div className="text-xs text-muted mt-4">Costo estimado del producto: {fmtUSD(costoTotal)} USD</div>
        )}
      </div>
    </Modal>
  );
}

function SectionTitle({ n, label }: { n: string; label: string }) {
  return (
    <div className="row gap-8" style={{ alignItems: "center", marginBottom: 10 }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          background: "var(--mc-green-600)",
          color: "white",
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          fontWeight: 800,
          fontFamily: "var(--ff-mono)",
        }}
      >
        {n}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--mc-text-2)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--mc-line)" }} />
    </div>
  );
}
