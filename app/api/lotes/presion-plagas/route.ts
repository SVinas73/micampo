import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL, parseJsonTolerante, modeloPropio } from "@/lib/ia";
import { getInsight, saveInsight } from "@/lib/insight";
import { prescripcionPara, PRECIO_GRANO_REF, type Prescripcion } from "@/lib/tratamientos";

/**
 * GET /api/lotes/presion-plagas
 * Pronostica la presión de plagas/enfermedades para los próximos días a partir
 * del pronóstico climático real (Open-Meteo) sobre los lotes del usuario.
 * Reglas agronómicas determinísticas + refinamiento opcional con IA. Cachea 6 h.
 */

type Riesgo = {
  amenaza: string;
  cultivo: string;
  lote: string;
  nivel: "Alto" | "Medio" | "Bajo";
  probabilidad: number; // 0-100
  ventana: string;
  causa: string;
  prescripcion?: Prescripcion; // orden accionable: producto, dosis, costo, ROI
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const cache = await getInsight<{ riesgos: Riesgo[] }>(session.user.id, "presion-plagas", 6 * 60);
    if (cache) return NextResponse.json({ ...cache, cacheado: true });

    const lotes = await prisma.lote.findMany({
      where: { userId: session.user.id, cultivo: { not: null } },
      take: 12,
    });
    if (lotes.length === 0) return NextResponse.json({ riesgos: [] });

    // Centro del campo: promedio de centroides disponibles (o centro de Uruguay).
    const conGeo = lotes.filter((l) => l.centroLatitud != null && l.centroLongitud != null);
    const lat = conGeo.length ? conGeo.reduce((s, l) => s + (l.centroLatitud as number), 0) / conGeo.length : -32.8;
    const lon = conGeo.length ? conGeo.reduce((s, l) => s + (l.centroLongitud as number), 0) / conGeo.length : -56.0;

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max,wind_speed_10m_max` +
      `&timezone=auto&forecast_days=7`;
    const wres = await fetch(url, { next: { revalidate: 3600 } });
    if (!wres.ok) return NextResponse.json({ riesgos: [] });
    const w = await wres.json();
    const d = w.daily;
    if (!d?.time) return NextResponse.json({ riesgos: [] });

    // Resumen de los próximos 5 días.
    const dias = d.time.slice(0, 5).map((t: string, i: number) => ({
      fecha: t,
      tmax: d.temperature_2m_max?.[i],
      tmin: d.temperature_2m_min?.[i],
      lluvia: d.precipitation_sum?.[i] ?? 0,
      hrMax: d.relative_humidity_2m_max?.[i] ?? 0,
      viento: d.wind_speed_10m_max?.[i] ?? 0,
    }));

    const riesgos = reglasDeterministicas(lotes.map((l) => ({ nombre: l.nombre, cultivo: l.cultivo as string })), dias);

    // Precios de grano del usuario (para valuar la pérdida potencial).
    const precios = await prisma.precioReferencia.findMany({ where: { userId: session.user.id }, orderBy: { fecha: "desc" } }).catch(() => []);
    const precioGrano = (cultivo: string) => precios.find((p) => p.producto === cultivo)?.precio ?? PRECIO_GRANO_REF[cultivo];
    // Agrega la prescripción accionable (producto/dosis/costo/ROI) a cada riesgo.
    const enriquecer = (rs: Riesgo[]): Riesgo[] => rs.map((r) => ({
      ...r,
      prescripcion: prescripcionPara({ amenaza: r.amenaza, cultivo: r.cultivo, probabilidad: r.probabilidad, ventana: r.ventana, precioGranoUSDton: precioGrano(r.cultivo) }),
    }));

    // 1) Modelo propio de MiCampo (si está configurado) — tarea "presion.plagas".
    const propio = await modeloPropio<{ riesgos: Riesgo[] }>("presion.plagas", { dias, lotes: lotes.map((l) => ({ lote: l.nombre, cultivo: l.cultivo })) });
    if (propio?.riesgos?.length) {
      const out = { riesgos: enriquecer(propio.riesgos).slice(0, 4), simulado: false, fuente: "modelo-propio" };
      await saveInsight(session.user.id, "presion-plagas", "presion-plagas", out, "modelo-propio");
      return NextResponse.json(out);
    }

    // 2) Refinamiento con IA (si hay key): mejora redacción y prioriza.
    const anthropic = getAnthropic();
    if (anthropic && riesgos.length > 0) {
      try {
        const msg = await anthropic.messages.create({
          model: IA_MODEL,
          max_tokens: 700,
          messages: [{
            role: "user",
            content: `Sos un fitopatólogo. Con este pronóstico de 5 días y estos lotes, devolvé los 3-4 riesgos de plagas/enfermedades más probables.

PRONÓSTICO: ${JSON.stringify(dias)}
LOTES: ${JSON.stringify(lotes.map((l) => ({ lote: l.nombre, cultivo: l.cultivo })))}
PRECANDIDATOS (reglas): ${JSON.stringify(riesgos)}

Respondé SOLO con JSON: {"riesgos":[{"amenaza","cultivo","lote","nivel":"Alto|Medio|Bajo","probabilidad":0-100,"ventana":"texto","causa":"condición climática que lo dispara"}]}`,
          }],
        });
        const text = msg.content[0].type === "text" ? msg.content[0].text : "";
        const parsed = parseJsonTolerante<{ riesgos: Riesgo[] }>(text);
        if (parsed?.riesgos?.length) {
          const out = { riesgos: enriquecer(parsed.riesgos).slice(0, 4), simulado: false };
          await saveInsight(session.user.id, "presion-plagas", "presion-plagas", out, IA_MODEL);
          return NextResponse.json(out);
        }
      } catch { /* cae al determinístico */ }
    }

    const out = { riesgos: enriquecer(riesgos).slice(0, 4), simulado: true };
    await saveInsight(session.user.id, "presion-plagas", "presion-plagas", out, "reglas");
    return NextResponse.json(out);
  } catch (error) {
    console.error("Error en presión de plagas:", error);
    return NextResponse.json({ riesgos: [] }, { status: 200 });
  }
}

type Dia = { fecha: string; tmax: number; tmin: number; lluvia: number; hrMax: number; viento: number };

/** Reglas agronómicas básicas: humedad alta + temperatura templada → hongos; calor seco → ácaros/insectos. */
function reglasDeterministicas(lotes: { nombre: string; cultivo: string }[], dias: Dia[]): Riesgo[] {
  if (dias.length === 0) return [];
  const hrAlta = dias.filter((x) => x.hrMax >= 80).length;
  const lluviaAcum = dias.reduce((s, x) => s + (x.lluvia || 0), 0);
  const tmedMax = dias.reduce((s, x) => s + (x.tmax || 0), 0) / dias.length;
  const calorSeco = dias.filter((x) => x.tmax >= 28 && x.lluvia < 1 && x.hrMax < 60).length;
  const out: Riesgo[] = [];

  const porCultivo = new Map<string, string[]>();
  lotes.forEach((l) => { const a = porCultivo.get(l.cultivo) || []; a.push(l.nombre); porCultivo.set(l.cultivo, a); });

  for (const [cultivo, nombres] of porCultivo) {
    const lote = nombres[0];
    // Riesgo fúngico: humedad sostenida + temperatura templada
    if (hrAlta >= 2 && tmedMax >= 18 && tmedMax <= 30) {
      const prob = Math.min(92, 45 + hrAlta * 12 + (lluviaAcum > 15 ? 12 : 0));
      out.push({
        amenaza: fungicoPorCultivo(cultivo),
        cultivo, lote, nivel: prob >= 70 ? "Alto" : prob >= 50 ? "Medio" : "Bajo",
        probabilidad: prob,
        ventana: `Próximos ${hrAlta} días`,
        causa: `Humedad ≥80% en ${hrAlta} días${lluviaAcum > 15 ? ` y ${Math.round(lluviaAcum)}mm acumulados` : ""}`,
      });
    }
    // Riesgo de insectos/ácaros: calor seco
    if (calorSeco >= 2) {
      out.push({
        amenaza: "Ácaros / chinches (presión por calor seco)",
        cultivo, lote, nivel: calorSeco >= 3 ? "Alto" : "Medio",
        probabilidad: Math.min(85, 40 + calorSeco * 12),
        ventana: `Próximos ${calorSeco} días`,
        causa: `${calorSeco} días con T≥28°C y baja humedad`,
      });
    }
  }
  return out.sort((a, b) => b.probabilidad - a.probabilidad);
}

function fungicoPorCultivo(cultivo: string): string {
  const m: Record<string, string> = {
    Soja: "Roya asiática / mancha marrón", Trigo: "Roya / fusariosis de la espiga",
    Maíz: "Tizón / roya común", Cebada: "Mancha en red / escaldadura", Girasol: "Esclerotinia / mildiu",
  };
  return m[cultivo] || "Enfermedad fúngica foliar";
}
