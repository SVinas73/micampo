import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cuaderno-campo — Cuaderno de campo digital (trazabilidad).
 * Registro cronológico, por lote, de labores con sus aplicaciones de productos
 * (principio activo, dosis, método), siembras y cosechas. Base para reportes
 * certificables (EUDR / GlobalGAP). Filtros: ?loteId= ?desde= ?hasta=
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const loteId = searchParams.get("loteId");
    // Alcance (sidebar): lista de lotes del establecimiento activo. Si viene el
    // parámetro `loteIds`, se restringe a esos lotes (aunque esté vacío → nada).
    const loteIdsParam = searchParams.get("loteIds");
    const loteIds = loteIdsParam !== null ? loteIdsParam.split(",").filter(Boolean) : null;
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const rango: any = {};
    if (desde) rango.gte = new Date(desde);
    if (hasta) rango.lte = new Date(hasta);
    const fechaFiltro = (desde || hasta) ? rango : undefined;

    const loteWhere = loteId ? { loteId } : loteIds !== null ? { loteId: { in: loteIds } } : {};
    const where: any = { userId, ...loteWhere };

    const [labores, siembras, cosechas] = await Promise.all([
      prisma.labor.findMany({
        where: { ...where, ...(fechaFiltro ? { fecha: fechaFiltro } : {}) },
        include: { lote: { select: { nombre: true } }, maquinaria: { select: { marca: true, modelo: true } }, aplicacionesProductos: true },
        orderBy: { fecha: "desc" },
      }),
      prisma.siembra.findMany({ where: { ...where, ...(fechaFiltro ? { fechaSiembra: fechaFiltro } : {}) }, include: { lote: { select: { nombre: true } } }, orderBy: { fechaSiembra: "desc" } }),
      prisma.cosecha.findMany({ where: { ...where, ...(fechaFiltro ? { fechaCosecha: fechaFiltro } : {}) }, include: { lote: { select: { nombre: true } } }, orderBy: { fechaCosecha: "desc" } }),
    ]);

    type Registro = {
      id: string; loteId: string | null;
      fecha: string; fechaMs: number; lote: string; tipo: string; detalle: string;
      productos: { nombre: string; principioActivo?: string | null; dosis: string; metodo?: string | null }[];
      responsable?: string | null; maquinaria?: string | null; superficie?: number | null;
    };
    const registros: Registro[] = [];

    labores.forEach((l) => registros.push({
      id: `labor-${l.id}`, loteId: l.loteId ?? null,
      fecha: l.fecha.toISOString(), fechaMs: l.fecha.getTime(), lote: l.lote?.nombre || "—",
      tipo: l.tipo || "Labor", detalle: l.descripcion || "",
      productos: l.aplicacionesProductos.map((a) => ({ nombre: a.nombreProducto, principioActivo: a.principioActivo, dosis: `${a.dosis} ${a.unidadDosis}`, metodo: a.metodoAplicacion })),
      responsable: l.operarios, maquinaria: l.maquinaria ? `${l.maquinaria.marca} ${l.maquinaria.modelo}` : null, superficie: l.superficieTrabajada,
    }));
    siembras.forEach((s) => registros.push({
      id: `siembra-${s.id}`, loteId: s.loteId ?? null,
      fecha: s.fechaSiembra.toISOString(), fechaMs: s.fechaSiembra.getTime(), lote: s.lote?.nombre || "—",
      tipo: "Siembra", detalle: `${s.cultivo}${s.variedad ? ` · ${s.variedad}` : ""} · ${Math.round(s.hectareas)} ha`, productos: [], superficie: s.hectareas,
    }));
    cosechas.forEach((c) => registros.push({
      id: `cosecha-${c.id}`, loteId: c.loteId ?? null,
      fecha: c.fechaCosecha.toISOString(), fechaMs: c.fechaCosecha.getTime(), lote: c.lote?.nombre || "—",
      tipo: "Cosecha", detalle: `${Math.round(c.rendimiento)} kg/ha${c.calidad ? ` · ${c.calidad}` : ""}`, productos: [],
    }));

    registros.sort((a, b) => b.fechaMs - a.fechaMs);

    return NextResponse.json({
      registros,
      resumen: { total: registros.length, aplicaciones: registros.reduce((s, r) => s + r.productos.length, 0), lotes: new Set(registros.map((r) => r.loteId || r.lote)).size },
    });
  } catch (error) {
    console.error("Error en cuaderno de campo:", error);
    return NextResponse.json({ error: "Error al armar el cuaderno" }, { status: 500 });
  }
}
