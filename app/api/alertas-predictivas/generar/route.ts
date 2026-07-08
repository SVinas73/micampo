import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL } from "@/lib/ia";

// Analiza todo el establecimiento con IA (hasta 2000 tokens sobre muchos datos):
// sin este límite Vercel corta a ~10s y la generación devuelve 504.
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Recopilar datos del usuario
    const [lotes, animales, cosechas, eventosSanitarios, registrosPeso, registrosLecheros, costos] = await Promise.all([
      prisma.lote.findMany({ where: { userId: session.user.id } }),
      prisma.animal.findMany({ where: { userId: session.user.id } }),
      prisma.cosecha.findMany({ 
        where: { userId: session.user.id },
        orderBy: { fechaCosecha: "desc" },
        take: 20,
      }),
      prisma.eventoSanitario.findMany({
        where: { userId: session.user.id },
        orderBy: { fecha: "desc" },
        take: 50,
      }),
      prisma.registroPeso.findMany({
        where: { userId: session.user.id },
        orderBy: { fecha: "desc" },
        take: 100,
      }),
      prisma.registroLechero.findMany({
        where: { userId: session.user.id },
        orderBy: { fecha: "desc" },
        take: 100,
      }),
      prisma.costoLote.findMany({
        where: { userId: session.user.id },
        orderBy: { fecha: "desc" },
        take: 50,
      }),
    ]);

    // Preparar contexto para Claude
    const contexto = {
      lotes: lotes.map(l => ({ nombre: l.nombre, hectareas: l.hectareas, cultivo: l.cultivo })),
      animales: animales.map(a => ({ 
        caravana: a.caravana, 
        tipo: a.tipo, 
        raza: a.raza,
        sexo: a.sexo,
        estado: a.estado,
      })),
      cosechasRecientes: cosechas.map(c => ({
        fecha: c.fechaCosecha,
        rendimiento: c.rendimiento,
        precioVenta: c.precioVenta,
      })),
      eventosSanitariosRecientes: eventosSanitarios.map(e => ({
        tipo: e.tipo,
        fecha: e.fecha,
        descripcion: e.descripcion,
      })),
      registrosPesoRecientes: registrosPeso.slice(0, 20).map(p => ({
        fecha: p.fecha,
        peso: p.peso,
      })),
      registrosLecherosRecientes: registrosLecheros.slice(0, 20).map(l => ({
        fecha: l.fecha,
        litros: l.litros,
        calidad: l.calidad,
      })),
      costosRecientes: costos.slice(0, 20).map(c => ({
        fecha: c.fecha,
        concepto: c.concepto,
        monto: c.monto,
      })),
    };

    const anthropic = getAnthropic();
    if (!anthropic) {
      return NextResponse.json(
        { error: "Las alertas predictivas con IA requieren configurar ANTHROPIC_API_KEY", simulado: true },
        { status: 503 }
      );
    }

    // Llamar a Claude para análisis
    const message = await anthropic.messages.create({
      model: IA_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Sos un experto agrónomo y veterinario con experiencia en análisis predictivo agropecuario. 

Analizá los siguientes datos de un establecimiento agropecuario y generá alertas predictivas basadas en patrones, anomalías y riesgos potenciales:

DATOS DEL ESTABLECIMIENTO:
${JSON.stringify(contexto, null, 2)}

TAREA:
1. Identificá patrones preocupantes o riesgos potenciales
2. Generá alertas predictivas específicas
3. Clasificá cada alerta por severidad (Baja, Media, Alta, Crítica)
4. Categorizá por tipo (Enfermedad, Clima, Nutrición, Reproducción, Financiero)
5. Proporcioná recomendaciones accionables

FORMATO DE RESPUESTA (JSON):
{
  "alertas": [
    {
      "tipo": "Enfermedad|Clima|Nutrición|Reproducción|Financiero",
      "severidad": "Baja|Media|Alta|Crítica",
      "titulo": "Título corto de la alerta",
      "descripcion": "Descripción detallada del problema detectado",
      "recomendacion": "Acción específica recomendada",
      "entidad": "Lote|Animal|General",
      "entidadNombre": "Nombre del lote/animal afectado o null si es general",
      "confianza": 0-100
    }
  ]
}

IMPORTANTE: 
- Solo generá alertas con confianza mayor a 60%
- Priorizá alertas accionables
- Sé específico con nombres de lotes/animales cuando aplique
- Respondé SOLO con el JSON, sin texto adicional`,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    
    // Parsear respuesta de Claude
    let alertasGeneradas;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        alertasGeneradas = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No se encontró JSON en la respuesta");
      }
    } catch (parseError) {
      console.error("Error parseando respuesta de Claude:", responseText);
      return NextResponse.json(
        { error: "Error al procesar análisis de IA" },
        { status: 500 }
      );
    }

    // Guardar alertas en la base de datos
    const alertasCreadas = [];
    
    if (alertasGeneradas.alertas && Array.isArray(alertasGeneradas.alertas)) {
      for (const alerta of alertasGeneradas.alertas) {
        // Buscar ID de la entidad si es necesario
        let entidadId = null;
        if (alerta.entidad === "Lote" && alerta.entidadNombre) {
          const lote = lotes.find(l => l.nombre === alerta.entidadNombre);
          entidadId = lote?.id || null;
        } else if (alerta.entidad === "Animal" && alerta.entidadNombre) {
          const animal = animales.find(a => a.caravana === alerta.entidadNombre);
          entidadId = animal?.id || null;
        }

        const alertaCreada = await prisma.alertaPredictiva.create({
          data: {
            tipo: alerta.tipo,
            severidad: alerta.severidad,
            titulo: alerta.titulo,
            descripcion: alerta.descripcion,
            recomendacion: alerta.recomendacion,
            entidad: alerta.entidad === "General" ? null : alerta.entidad,
            entidadId,
            entidadNombre: alerta.entidadNombre,
            metadata: JSON.stringify({ confianza: alerta.confianza }),
            userId: session.user.id,
          },
        });

        alertasCreadas.push(alertaCreada);
      }
    }

    return NextResponse.json({
      mensaje: `${alertasCreadas.length} alertas generadas`,
      alertas: alertasCreadas,
    });
  } catch (error) {
    console.error("Error al generar alertas:", error);
    return NextResponse.json(
      { error: "Error al generar alertas predictivas" },
      { status: 500 }
    );
  }
}