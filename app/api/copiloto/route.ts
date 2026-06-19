import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL } from "@/lib/ia";
import { resumenEconomicoLotes } from "@/lib/economia";

export const maxDuration = 60;

/**
 * Copiloto del Campo — agente conversacional con acceso de solo lectura a los
 * datos reales del establecimiento. Usa tool-use de Claude para razonar cruzando
 * agronomía, ganadería, finanzas, stock y precios. Degrada con elegancia cuando
 * no hay API key (responde de forma orientativa, marcando `simulado: true`).
 */

const SYSTEM = `Sos "Copiloto", el asistente de inteligencia de MiCampo, un sistema integral de gestión agropecuaria.
Tenés herramientas para consultar los DATOS REALES del establecimiento del usuario (lotes, animales, finanzas, stock, alertas, precios, producción lechera).

Reglas:
- Usá las herramientas cuando necesites datos concretos. No inventes cifras ni nombres: si no tenés el dato, decílo.
- Razoná cruzando dominios (agronomía + hacienda + finanzas). Ese es tu diferencial.
- Cuando recomiendes algo, incluí el impacto económico aproximado en USD o USD/ha si los datos lo permiten.
- Respondé en español rioplatense, claro y accionable. Sé conciso: andá al grano con conclusiones y próximos pasos.
- Si el usuario pide navegar a una pantalla, sugerí la ruta (ej: "/finanzas").`;

// ---- Definición de herramientas (solo lectura) ----
const TOOLS = [
  {
    name: "resumen_financiero",
    description:
      "Resumen financiero del mes en curso: ingresos, gastos y margen. Incluye cuentas por pagar vencidas y su saldo. Usalo para preguntas de plata, rentabilidad o deudas.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "listar_lotes",
    description:
      "Lista los lotes/parcelas del establecimiento con superficie en hectáreas y cultivo actual. Usalo para preguntas sobre superficie, cultivos sembrados o qué lotes existen.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "resumen_ganaderia",
    description:
      "Resumen del rodeo: cantidad de animales por tipo y estado, peso promedio del último pesaje y ganancia diaria promedio. Usalo para preguntas de hacienda, stock de animales o engorde.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "alertas_activas",
    description:
      "Lista las alertas predictivas activas (enfermedad, clima, nutrición, reproducción, financiero) con su severidad y recomendación. Usalo para 'qué tengo que atender' o riesgos.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "stock_bajo",
    description:
      "Insumos cuyo stock está por debajo del mínimo (necesitan reposición). Usalo para preguntas de inventario, insumos o compras pendientes.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "precios_referencia",
    description:
      "Últimos precios de referencia de granos (USD/ton). Usalo para preguntas de mercado, venta de cosecha o valuación.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "produccion_lechera_reciente",
    description:
      "Producción lechera de los últimos registros (litros y fecha). Usalo para preguntas de tambo o producción de leche.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "economia_por_lote",
    description:
      "Economía de cada lote: ingresos, costos, margen, costo/ha y margen/ha (USD). Usalo para preguntas de rentabilidad por lote, '¿qué lote me da más/menos margen?' o decisiones de inversión por hectárea.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "buscar_animal",
    description: "Busca un animal por su número de caravana y devuelve sus datos y últimos pesajes.",
    input_schema: {
      type: "object" as const,
      properties: { caravana: { type: "string", description: "Número de caravana del animal" } },
      required: ["caravana"],
    },
  },
];

async function ejecutarTool(name: string, input: any, userId: string): Promise<any> {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  switch (name) {
    case "resumen_financiero": {
      const [transacciones, cuentas] = await Promise.all([
        prisma.transaccion.findMany({ where: { userId, fecha: { gte: inicioMes } } }),
        prisma.cuentaPorPagar.findMany({ where: { userId, estadoPago: { not: "Pagado" } } }),
      ]);
      const ingresos = transacciones
        .filter((t) => t.tipo.toLowerCase() === "ingreso")
        .reduce((s, t) => s + Number(t.monto), 0);
      const gastos = transacciones
        .filter((t) => t.tipo.toLowerCase() !== "ingreso")
        .reduce((s, t) => s + Number(t.monto), 0);
      const hoy = new Date();
      const vencidas = cuentas.filter((c) => new Date(c.fechaVencimiento) < hoy);
      return {
        mesActual: { ingresos, gastos, margen: ingresos - gastos },
        cuentasPorPagar: {
          total: cuentas.length,
          saldoTotal: cuentas.reduce((s, c) => s + c.saldo, 0),
          vencidas: vencidas.length,
          saldoVencido: vencidas.reduce((s, c) => s + c.saldo, 0),
        },
      };
    }
    case "listar_lotes": {
      const lotes = await prisma.lote.findMany({ where: { userId } });
      return {
        cantidad: lotes.length,
        hectareasTotales: lotes.reduce((s, l) => s + (l.hectareas || 0), 0),
        lotes: lotes.map((l) => ({ nombre: l.nombre, hectareas: l.hectareas, cultivo: l.cultivo || "sin asignar" })),
      };
    }
    case "resumen_ganaderia": {
      const animales = await prisma.animal.findMany({ where: { userId } });
      const porTipo: Record<string, number> = {};
      const porEstado: Record<string, number> = {};
      animales.forEach((a) => {
        porTipo[a.tipo] = (porTipo[a.tipo] || 0) + 1;
        porEstado[a.estado] = (porEstado[a.estado] || 0) + 1;
      });
      const pesos = await prisma.registroPeso.findMany({
        where: { animal: { userId } },
        orderBy: { fecha: "desc" },
        take: 50,
      });
      const pesoProm = pesos.length ? pesos.reduce((s, p) => s + p.peso, 0) / pesos.length : null;
      const gdpVals = pesos.map((p) => p.gananciaPromedioDiaria).filter((v): v is number => v != null);
      const gdpProm = gdpVals.length ? gdpVals.reduce((s, v) => s + v, 0) / gdpVals.length : null;
      return {
        total: animales.length,
        porTipo,
        porEstado,
        pesoPromedioUltimo: pesoProm,
        gananciaDiariaPromedio: gdpProm,
      };
    }
    case "alertas_activas": {
      const alertas = await prisma.alertaPredictiva.findMany({
        where: { userId, estado: "Activa" },
        orderBy: { fechaDeteccion: "desc" },
        take: 20,
      });
      return {
        cantidad: alertas.length,
        alertas: alertas.map((a) => ({
          tipo: a.tipo,
          severidad: a.severidad,
          titulo: a.titulo,
          recomendacion: a.recomendacion,
          afecta: a.entidadNombre || "general",
        })),
      };
    }
    case "stock_bajo": {
      const stocks = await prisma.stockInsumo.findMany({ where: { userId } });
      const bajos = stocks.filter((s) => s.alertaStockBajo || s.stockActual <= s.stockMinimo);
      return {
        cantidad: bajos.length,
        insumos: bajos.map((s) => ({
          nombre: s.nombre,
          categoria: s.categoria,
          stockActual: s.stockActual,
          stockMinimo: s.stockMinimo,
          unidad: s.unidadMedida,
        })),
      };
    }
    case "precios_referencia": {
      const precios = await prisma.precioReferencia.findMany({
        where: { userId },
        orderBy: { fecha: "desc" },
        take: 30,
      });
      const ultimoPorProducto: Record<string, any> = {};
      precios.forEach((p) => {
        if (!ultimoPorProducto[p.producto]) {
          ultimoPorProducto[p.producto] = { producto: p.producto, precioUSDton: p.precio, fecha: p.fecha, fuente: p.fuente };
        }
      });
      return { precios: Object.values(ultimoPorProducto) };
    }
    case "produccion_lechera_reciente": {
      const registros = await prisma.produccionLechera.findMany({
        where: { userId },
        orderBy: { fecha: "desc" },
        take: 14,
      });
      return {
        registros: registros.map((r: any) => ({ fecha: r.fecha, litros: r.litrosTotales ?? r.litros ?? null })),
      };
    }
    case "economia_por_lote": {
      const eco = await resumenEconomicoLotes(userId);
      const conDatos = eco.filter((l) => l.fuente !== "sin-datos");
      const ordenados = [...conDatos].sort((a, b) => a.margenPorHa - b.margenPorHa);
      return {
        lotesConDatos: conDatos.length,
        lotes: eco.map((l) => ({
          nombre: l.nombre,
          cultivo: l.cultivo,
          hectareas: l.hectareas,
          ingresos: Math.round(l.ingresos),
          costos: Math.round(l.costos),
          margen: Math.round(l.margen),
          costoPorHa: Math.round(l.costoPorHa),
          margenPorHa: Math.round(l.margenPorHa),
          fuente: l.fuente,
        })),
        peorMargenPorHa: ordenados[0]?.nombre || null,
        mejorMargenPorHa: ordenados[ordenados.length - 1]?.nombre || null,
      };
    }
    case "buscar_animal": {
      const animal = await prisma.animal.findFirst({
        where: { userId, caravana: input.caravana },
      });
      if (!animal) return { encontrado: false };
      const pesos = await prisma.registroPeso.findMany({
        where: { animalId: animal.id },
        orderBy: { fecha: "desc" },
        take: 5,
      });
      return {
        encontrado: true,
        caravana: animal.caravana,
        tipo: animal.tipo,
        raza: animal.raza,
        sexo: animal.sexo,
        estado: animal.estado,
        ultimosPesajes: pesos.map((p) => ({ fecha: p.fecha, peso: p.peso, gdp: p.gananciaPromedioDiaria })),
      };
    }
    default:
      return { error: "Herramienta desconocida" };
  }
}

function respuestaSimulada(pregunta: string) {
  return {
    reply:
      "El Copiloto necesita una clave de IA configurada (ANTHROPIC_API_KEY) para razonar sobre tus datos en tiempo real. " +
      "Una vez activado, voy a poder responder cosas como: «¿conviene vender los novillos ahora o engordarlos 60 días más?», " +
      "«¿qué lote me está dando menos margen?» o «armame el plan de la semana», cruzando agronomía, hacienda y finanzas de tu establecimiento.",
    simulado: true,
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const userId = session.user.id;
    const body = await request.json();
    const historial: { role: "user" | "assistant"; content: string }[] = Array.isArray(body.messages)
      ? body.messages
      : [];
    const modulo: string | undefined = body.modulo;

    const anthropic = getAnthropic();
    if (!anthropic) {
      return NextResponse.json(respuestaSimulada(historial[historial.length - 1]?.content || ""));
    }

    const messages: any[] = historial.map((m) => ({ role: m.role, content: m.content }));
    const systemPrompt = modulo
      ? `${SYSTEM}\n\nContexto: el usuario está viendo la pantalla "${modulo}".`
      : SYSTEM;

    let reply = "";
    const herramientasUsadas: string[] = [];

    for (let i = 0; i < 6; i++) {
      const res = await anthropic.messages.create({
        model: IA_MODEL,
        max_tokens: 1500,
        system: systemPrompt,
        tools: TOOLS as any,
        messages,
      });

      if (res.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: res.content });
        const toolResults: any[] = [];
        for (const block of res.content) {
          if (block.type === "tool_use") {
            herramientasUsadas.push(block.name);
            let result: any;
            try {
              result = await ejecutarTool(block.name, block.input, userId);
            } catch (e) {
              result = { error: "No se pudo obtener el dato" };
            }
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          }
        }
        messages.push({ role: "user", content: toolResults });
        continue;
      }

      reply = res.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n")
        .trim();
      break;
    }

    if (!reply) reply = "No pude completar el análisis. Reformulá la pregunta, por favor.";
    return NextResponse.json({ reply, herramientas: [...new Set(herramientasUsadas)], simulado: false });
  } catch (error) {
    console.error("Error en copiloto:", error);
    return NextResponse.json({ error: "Error al procesar la consulta" }, { status: 500 });
  }
}
