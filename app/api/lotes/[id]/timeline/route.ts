import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/lotes/[id]/timeline — la historia completa del lote.
 * Une en una sola línea de tiempo cronológica: siembras, cosechas, labores,
 * análisis de suelo, lluvias, riegos, detecciones sanitarias y notas.
 */
type Evento = { fecha: string; fechaMs: number; tipo: string; categoria: string; titulo: string; detalle: string; icono: string; color: string };

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Verifica propiedad con una consulta mínima (siempre disponible).
    const dueño = await prisma.lote.findUnique({ where: { id }, select: { userId: true } });
    if (!dueño || dueño.userId !== session.user.id) {
      return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
    }

    // Historia completa (con relaciones). Si alguna relación no está disponible en
    // la base (migración sin aplicar en un entorno), degrada a una línea de tiempo
    // vacía en vez de un 500 — la ficha muestra "Sin historia todavía".
    let lote;
    try {
      lote = await prisma.lote.findUnique({
        where: { id },
        include: {
          siembras: true,
          cosechas: true,
          labores: true,
          analisisSuelo: true,
          registrosPluviometricos: true,
          alertasPlagas: true,
          marcadoresGeo: true,
          planesRiego: { include: { eventosRiego: true } },
        },
      });
    } catch (err) {
      console.error("Timeline de lote: relación no disponible, devuelvo historia vacía:", err);
      return NextResponse.json({ lote: { id }, eventos: [] });
    }
    if (!lote) {
      return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
    }

    const ev: Evento[] = [];
    const push = (d: Date | string | null | undefined, e: Omit<Evento, "fecha" | "fechaMs">) => {
      const ms = d ? new Date(d).getTime() : NaN;
      if (Number.isNaN(ms)) return;
      ev.push({ ...e, fechaMs: ms, fecha: new Date(ms).toISOString() });
    };

    lote.siembras.forEach((s) => push(s.fechaSiembra, { tipo: "siembra", categoria: "Siembra", titulo: `Siembra de ${s.cultivo}`, detalle: `${s.variedad ? s.variedad + " · " : ""}${Math.round(s.hectareas)} ha`, icono: "sprout", color: "#5e7733" }));
    lote.cosechas.forEach((c) => push(c.fechaCosecha, { tipo: "cosecha", categoria: "Cosecha", titulo: "Cosecha", detalle: `${Math.round(c.rendimiento)} kg/ha${c.calidad ? ` · ${c.calidad}` : ""}${c.precioVenta ? ` · US$${c.precioVenta}/t` : ""}`, icono: "wheat", color: "#c08a22" }));
    lote.labores.forEach((l) => push(l.fecha, { tipo: "labor", categoria: l.estado === "Completada" ? "Labor realizada" : "Labor programada", titulo: l.tipo || "Labor", detalle: l.descripcion || l.observaciones || l.estado || "—", icono: "wrench", color: "#768f44" }));
    lote.analisisSuelo.forEach((a) => push(a.fechaAnalisis, { tipo: "suelo", categoria: "Análisis de suelo", titulo: "Análisis de suelo", detalle: `pH ${a.pH ?? "—"}${a.materiaOrganica != null ? ` · MO ${a.materiaOrganica}%` : ""}${a.fosforo != null ? ` · P ${a.fosforo}ppm` : ""}`, icono: "flask", color: "#8a6d3b" }));
    lote.registrosPluviometricos.forEach((r) => push(r.fecha, { tipo: "lluvia", categoria: "Lluvia", titulo: `${r.milimetros} mm de lluvia`, detalle: r.observaciones || "Registro pluviométrico", icono: "droplet", color: "#2c6bb8" }));
    lote.alertasPlagas.forEach((a) => push(a.fechaDeteccion, { tipo: "sanidad", categoria: "Sanidad", titulo: `${a.plaga} (${a.severidad})`, detalle: `${a.metodoDeteccion} · ${a.recomendacion || ""}`.trim(), icono: "bug", color: a.severidad === "Alta" || a.severidad === "Crítica" ? "#c93434" : "#d9a538" }));
    lote.marcadoresGeo.forEach((m) => push(m.fecha, { tipo: "nota", categoria: "Nota", titulo: m.titulo || "Nota", detalle: m.descripcion || "", icono: "pen", color: "#64748b" }));
    lote.planesRiego.forEach((p) => p.eventosRiego.forEach((e) => push(e.fechaProgramada, { tipo: "riego", categoria: "Riego", titulo: `Riego ${e.laminaAplicada ? `de ${e.laminaAplicada} mm` : ""}`.trim(), detalle: e.observaciones || e.estado || "Evento de riego", icono: "droplet", color: "#2c82c9" })));

    ev.sort((a, b) => b.fechaMs - a.fechaMs);

    return NextResponse.json({
      lote: { id: lote.id, nombre: lote.nombre, cultivo: lote.cultivo, hectareas: lote.hectareas },
      eventos: ev,
    });
  } catch (error) {
    console.error("Error en timeline del lote:", error);
    return NextResponse.json({ error: "Error al armar la historia del lote" }, { status: 500 });
  }
}
