import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const animales = await prisma.animal.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        tropa: { select: { id: true, nombre: true } },
        registrosPeso: {
          orderBy: { fecha: "desc" },
          take: 2,
        },
        registrosLecheros: {
          orderBy: { fecha: "desc" },
          take: 1,
        },
        historialReproductivo: true,
        tratamientos: {
          where: { estado: { in: ["En curso", "En retiro"] } },
          orderBy: { fechaInicio: "desc" },
        },
        eventosReproductivos: {
          orderBy: { fecha: "desc" },
          take: 5,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(animales);
  } catch (error) {
    console.error("Error al obtener animales:", error);
    return NextResponse.json(
      { error: "Error al obtener animales" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const {
      caravana,
      nombre,
      tipo,
      categoria,
      raza,
      sexo,
      fechaNacimiento,
      pesoNacimiento,
      madre,
      padre,
      rfid,
      origen,
      condicionNacimiento,
      foto,
      ubicacion,
      tropaId,
    } = await request.json();

    if (!caravana || !tipo || !sexo) {
      return NextResponse.json(
        { error: "Caravana, tipo y sexo son requeridos" },
        { status: 400 }
      );
    }

    // Validar tropa (si viene) que pertenezca al usuario
    if (tropaId) {
      const tropa = await prisma.tropa.findUnique({ where: { id: tropaId } });
      if (!tropa || tropa.userId !== session.user.id) {
        return NextResponse.json({ error: "Tropa no encontrada" }, { status: 404 });
      }
    }

    const animal = await prisma.animal.create({
      data: {
        caravana,
        nombre: nombre || null,
        tipo,
        categoria: categoria || null,
        raza: raza || null,
        sexo,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        pesoNacimiento: pesoNacimiento ? parseFloat(pesoNacimiento) : null,
        madre: madre || null,
        padre: padre || null,
        rfid: rfid || null,
        origen: origen || null,
        condicionNacimiento: condicionNacimiento || null,
        foto: foto || null,
        ubicacion: ubicacion || null,
        tropaId: tropaId || null,
        userId: session.user.id,
      },
      include: {
        tropa: { select: { id: true, nombre: true } },
      },
    });

    // Registros secundarios (peso inicial + timeline): NO deben hacer fallar el
    // alta. Si alguno falla, el animal ya quedó creado y devolvemos 201 igual
    // (evita el "no se pudo crear" + reintento que duplicaría el animal).
    try {
      if (pesoNacimiento && parseFloat(pesoNacimiento) > 0) {
        await prisma.registroPeso.create({
          data: {
            animalId: animal.id,
            peso: parseFloat(pesoNacimiento),
            fecha: fechaNacimiento ? new Date(fechaNacimiento) : new Date(),
            tipoMedicion: "Nacimiento",
            userId: session.user.id,
          },
        });
      }
    } catch (e) {
      console.error("Registro de peso inicial falló (no crítico):", e);
    }

    try {
      await prisma.eventoVida.create({
        data: {
          animalId: animal.id,
          tipoEvento: "Nacimiento",
          titulo:
            origen === "Compra"
              ? `Ingreso por compra · ${caravana}`
              : `Alta de animal · ${caravana}`,
          descripcion: [categoria, raza].filter(Boolean).join(" · ") || null,
          ubicacion: ubicacion || null,
          importante: true,
          userId: session.user.id,
        },
      });
    } catch (e) {
      console.error("Evento de vida (alta) falló (no crítico):", e);
    }

    return NextResponse.json(animal, { status: 201 });
  } catch (error) {
    console.error("Error al crear animal:", error);
    return NextResponse.json(
      { error: "Error al crear animal" },
      { status: 500 }
    );
  }
}
