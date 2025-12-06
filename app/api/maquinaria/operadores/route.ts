import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/maquinaria/operadores - Listar operadores
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado") || "Activo";

    const operadores = await prisma.operador.findMany({
      where: {
        ...(estado !== "Todos" && { estado }),
      },
      orderBy: { scorePromedio: "desc" },
    });

    // Calcular estadísticas generales
    const resumen = {
      total: operadores.length,
      activos: operadores.filter((o) => o.estado === "Activo").length,
      inactivos: operadores.filter((o) => o.estado === "Inactivo").length,
      enLicencia: operadores.filter((o) => o.estado === "Licencia").length,
      scorePromedio:
        operadores.length > 0
          ? operadores.reduce((acc, o) => acc + o.scorePromedio, 0) / operadores.length
          : 0,
      mejorOperador:
        operadores.length > 0
          ? operadores.reduce((max, o) => (o.scorePromedio > max.scorePromedio ? o : max))
          : null,
    };

    return NextResponse.json({
      operadores,
      resumen,
    });
  } catch (error) {
    console.error("Error al obtener operadores:", error);
    return NextResponse.json({ error: "Error al obtener operadores" }, { status: 500 });
  }
}

// POST /api/maquinaria/operadores - Crear operador
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      nombre,
      apellido,
      documento,
      licenciaConducir,
      categoriaLicencia,
      vencimientoLicencia,
      especialidades,
      telefono,
      email,
      fechaIngreso,
    } = body;

    // Validaciones
    if (!nombre || !apellido || !documento || !fechaIngreso) {
      return NextResponse.json(
        { error: "Campos requeridos: nombre, apellido, documento, fechaIngreso" },
        { status: 400 }
      );
    }

    // Verificar documento único
    const existe = await prisma.operador.findUnique({
      where: { documento },
    });

    if (existe) {
      return NextResponse.json(
        { error: "Ya existe un operador con ese documento" },
        { status: 400 }
      );
    }

    const operador = await prisma.operador.create({
      data: {
        nombre,
        apellido,
        documento,
        licenciaConducir,
        categoriaLicencia,
        vencimientoLicencia: vencimientoLicencia ? new Date(vencimientoLicencia) : null,
        especialidades: especialidades || [],
        telefono,
        email,
        fechaIngreso: new Date(fechaIngreso),
        estado: "Activo",
        totalEvaluaciones: 0,
        scorePromedio: 0,
      },
    });

    return NextResponse.json(operador, { status: 201 });
  } catch (error) {
    console.error("Error al crear operador:", error);
    return NextResponse.json({ error: "Error al crear operador" }, { status: 500 });
  }
}