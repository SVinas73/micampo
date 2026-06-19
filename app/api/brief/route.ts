import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";

export const maxDuration = 45;

/**
 * Brief diario proactivo — escanea todos los módulos, detecta las prioridades
 * reales del día (deudas vencidas, alertas, stock, labores atrasadas) y las
 * presenta priorizadas con su impacto económico. Si hay IA, Claude reordena y
 * redacta con criterio agronómico-económico; si no, hay un brief determinístico
 * construido a partir de los mismos datos reales.
 */

type Item = {
  severidad: "alta" | "media" | "baja";
  icono: string;
  titulo: string;
  detalle: string;
  impacto?: string;
  accion: string;
  ruta: string;
};

const sevRank = { alta: 0, media: 1, baja: 2 } as const;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const userId = session.user.id;
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [cuentas, stocks, alertasPred, alertasClim, alertasSan, labores, transMes] = await Promise.all([
      prisma.cuentaPorPagar.findMany({ where: { userId, estadoPago: { not: "Pagado" } } }),
      prisma.stockInsumo.findMany({ where: { userId } }),
      prisma.alertaPredictiva.findMany({ where: { userId, estado: "Activa" }, orderBy: { fechaDeteccion: "desc" }, take: 30 }),
      prisma.alertaClimatica.findMany({ where: { userId }, orderBy: { fechaInicio: "desc" }, take: 20 }),
      prisma.alertaSanitaria.findMany({ where: { userId, estado: { not: "Completada" } }, orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.labor.findMany({ where: { userId }, orderBy: { fecha: "asc" }, take: 100 }),
      prisma.transaccion.findMany({ where: { userId, fecha: { gte: inicioMes } } }),
    ]);

    // ---- Señales determinísticas (datos reales) ----
    const items: Item[] = [];

    const vencidas = cuentas.filter((c) => new Date(c.fechaVencimiento) < hoy);
    if (vencidas.length > 0) {
      const monto = vencidas.reduce((s, c) => s + c.saldo, 0);
      items.push({
        severidad: "alta",
        icono: "dollar",
        titulo: `${vencidas.length} cuenta(s) por pagar vencida(s)`,
        detalle: `Tenés pagos a proveedores vencidos sin saldar.`,
        impacto: `$${monto.toLocaleString("es-AR", { maximumFractionDigits: 0 })} en mora`,
        accion: "Revisá y regularizá los vencimientos",
        ruta: "/finanzas",
      });
    }

    const stockBajo = stocks.filter((s) => s.alertaStockBajo || s.stockActual <= s.stockMinimo);
    if (stockBajo.length > 0) {
      items.push({
        severidad: stockBajo.some((s) => s.stockActual <= 0) ? "alta" : "media",
        icono: "box",
        titulo: `${stockBajo.length} insumo(s) bajo el mínimo`,
        detalle: `Insumos que necesitan reposición: ${stockBajo.slice(0, 3).map((s) => s.nombre).join(", ")}${stockBajo.length > 3 ? "…" : ""}.`,
        accion: "Planificá la compra antes de que falte",
        ruta: "/logistica-inventario",
      });
    }

    const climActivas = alertasClim.filter((a) => !a.fechaFin || new Date(a.fechaFin) >= hoy);
    climActivas
      .filter((a) => a.severidad === "Alta" || a.severidad === "Extrema")
      .slice(0, 2)
      .forEach((a) => {
        items.push({
          severidad: "alta",
          icono: "cloud",
          titulo: a.titulo,
          detalle: a.descripcion,
          accion: "Tomá recaudos en los lotes y la hacienda",
          ruta: "/clima",
        });
      });

    alertasSan
      .filter((a) => a.severidad === "Alta" || a.severidad === "Crítica")
      .slice(0, 2)
      .forEach((a) => {
        items.push({
          severidad: a.severidad === "Crítica" ? "alta" : "media",
          icono: "syringe",
          titulo: a.titulo,
          detalle: `${a.descripcion} (${a.numeroAfectados} afectado/s)`,
          accion: a.accionRequerida,
          ruta: "/ganaderia-avanzada",
        });
      });

    alertasPred
      .filter((a) => a.severidad === "Alta" || a.severidad === "Crítica")
      .slice(0, 3)
      .forEach((a) => {
        items.push({
          severidad: a.severidad === "Crítica" ? "alta" : "media",
          icono: "sparkles",
          titulo: a.titulo,
          detalle: a.descripcion,
          accion: a.recomendacion,
          ruta: a.entidad === "Animal" ? "/animales" : "/campo-digital",
        });
      });

    const atrasadas = labores.filter((l) => l.estado === "Atrasada" || (l.estado !== "Completada" && new Date(l.fecha) < hoy));
    if (atrasadas.length > 0) {
      items.push({
        severidad: "media",
        icono: "calendar",
        titulo: `${atrasadas.length} labor(es) atrasada(s)`,
        detalle: `Trabajos programados que pasaron su fecha: ${atrasadas.slice(0, 3).map((l) => l.tipo).join(", ")}.`,
        accion: "Reprogramá o completá las labores pendientes",
        ruta: "/calendario",
      });
    }

    items.sort((a, b) => sevRank[a.severidad] - sevRank[b.severidad]);

    const ingresos = transMes.filter((t) => t.tipo.toLowerCase() === "ingreso").reduce((s, t) => s + Number(t.monto), 0);
    const gastos = transMes.filter((t) => t.tipo.toLowerCase() !== "ingreso").reduce((s, t) => s + Number(t.monto), 0);

    // Sin señales: brief vacío honesto
    if (items.length === 0) {
      return NextResponse.json({
        fecha: hoy.toISOString(),
        generadoPorIA: false,
        resumen: "Todo en orden: no detectamos prioridades urgentes para hoy.",
        items: [],
      });
    }

    // ---- Enriquecer con IA (opcional) ----
    const anthropic = getAnthropic();
    if (anthropic) {
      try {
        const contexto = {
          finanzasMes: { ingresos, gastos, margen: ingresos - gastos },
          senales: items,
        };
        const res = await anthropic.messages.create({
          model: IA_MODEL,
          max_tokens: 1200,
          system:
            "Sos el copiloto de MiCampo. A partir de señales reales de un establecimiento agropecuario, redactá un brief diario ejecutivo. Priorizá por impacto económico y urgencia. No inventes datos: usá solo lo provisto. Devolvé SOLO JSON.",
          messages: [
            {
              role: "user",
              content: `Datos del día:\n${JSON.stringify(contexto, null, 2)}\n\nDevolvé un JSON con esta forma exacta:\n{\n  "resumen": "una frase ejecutiva de contexto del día",\n  "items": [\n    {"severidad":"alta|media|baja","icono":"dollar|box|cloud|syringe|sparkles|calendar|leaf","titulo":"...","detalle":"...","impacto":"texto corto con $ si aplica, si no omitir","accion":"qué hacer","ruta":"/ruta-del-modulo"}\n  ]\n}\nMáximo 5 items, ordenados por prioridad. Mantené las rutas provistas.`,
            },
          ],
        });
        const text = res.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
        const parsed = parseJsonTolerante<{ resumen: string; items: Item[] }>(text);
        if (parsed?.items?.length) {
          return NextResponse.json({
            fecha: hoy.toISOString(),
            generadoPorIA: true,
            resumen: parsed.resumen,
            items: parsed.items.slice(0, 5),
          });
        }
      } catch (e) {
        console.error("Brief IA falló, usando determinístico:", e);
      }
    }

    return NextResponse.json({
      fecha: hoy.toISOString(),
      generadoPorIA: false,
      resumen: `${items.length} tema(s) requieren tu atención hoy.`,
      items: items.slice(0, 5),
    });
  } catch (error) {
    console.error("Error en brief:", error);
    return NextResponse.json({ error: "Error al generar el brief" }, { status: 500 });
  }
}
