import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const animalId = searchParams.get("animalId");

    if (animalId) {
      // Obtener registro específico con genealogía completa
      const registro = await prisma.registroGenetico.findUnique({
        where: { animalId },
        include: {
          animal: {
            select: {
              caravana: true,
              tipo: true,
              raza: true,
            },
          },
          padre: {
            select: {
              caravana: true,
              raza: true,
            },
          },
          madre: {
            select: {
              caravana: true,
              raza: true,
            },
          },
          abueloPaterno: {
            select: {
              caravana: true,
              raza: true,
            },
          },
          abuelaPaterna: {
            select: {
              caravana: true,
              raza: true,
            },
          },
          abueloMaterno: {
            select: {
              caravana: true,
              raza: true,
            },
          },
          abuelaMaterna: {
            select: {
              caravana: true,
              raza: true,
            },
          },
        },
      });

      return NextResponse.json(registro);
    }

    // Obtener todos los registros
    const registros = await prisma.registroGenetico.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        animal: {
          select: {
            caravana: true,
            tipo: true,
            raza: true,
          },
        },
        padre: {
          select: {
            caravana: true,
          },
        },
        madre: {
          select: {
            caravana: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(registros);
  } catch (error) {
    console.error("Error al obtener registros genéticos:", error);
    return NextResponse.json(
      { error: "Error al obtener registros" },
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
      animalId,
      padreId,
      madreId,
      abueloPaternoId,
      abuelaPaternaId,
      abueloMaternoId,
      abuelaMaternaId,
      razaPura,
      porcentajeRaza,
      registroGenealogia,
      muestraADN,
      fechaMuestraADN,
      laboratorio,
      marcadoresGeneticos,
      valorGeneticoEstimado,
      facilidadParto,
      habilidadMaterna,
      temperamento,
      gananciaEsperada,
      pesoAdultoEsperado,
      produccionLecheEsperada,
      observaciones,
    } = await request.json();

    if (!animalId) {
      return NextResponse.json(
        { error: "Animal es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el animal existe y pertenece al usuario
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
    });

    if (!animal || animal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Animal no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya existe un registro genético
    const existente = await prisma.registroGenetico.findUnique({
      where: { animalId },
    });

    if (existente) {
      return NextResponse.json(
        { error: "El animal ya tiene registro genético. Use PATCH para actualizar." },
        { status: 400 }
      );
    }

    const registro = await prisma.registroGenetico.create({
      data: {
        animalId,
        padreId: padreId || null,
        madreId: madreId || null,
        abueloPaternoId: abueloPaternoId || null,
        abuelaPaternaId: abuelaPaternaId || null,
        abueloMaternoId: abueloMaternoId || null,
        abuelaMaternaId: abuelaMaternaId || null,
        razaPura: razaPura || false,
        porcentajeRaza: porcentajeRaza ? parseFloat(porcentajeRaza) : null,
        registroGenealogia: registroGenealogia || null,
        muestraADN: muestraADN || null,
        fechaMuestraADN: fechaMuestraADN ? new Date(fechaMuestraADN) : null,
        laboratorio: laboratorio || null,
        marcadoresGeneticos: marcadoresGeneticos ? JSON.stringify(marcadoresGeneticos) : null,
        valorGeneticoEstimado: valorGeneticoEstimado ? parseFloat(valorGeneticoEstimado) : null,
        facilidadParto: facilidadParto || null,
        habilidadMaterna: habilidadMaterna || null,
        temperamento: temperamento || null,
        gananciaEsperada: gananciaEsperada ? parseFloat(gananciaEsperada) : null,
        pesoAdultoEsperado: pesoAdultoEsperado ? parseFloat(pesoAdultoEsperado) : null,
        produccionLecheEsperada: produccionLecheEsperada ? parseFloat(produccionLecheEsperada) : null,
        observaciones: observaciones || null,
        userId: session.user.id,
      },
      include: {
        animal: {
          select: {
            caravana: true,
            tipo: true,
          },
        },
        padre: {
          select: {
            caravana: true,
          },
        },
        madre: {
          select: {
            caravana: true,
          },
        },
      },
    });

    // Crear evento de vida
    await prisma.eventoVida.create({
      data: {
        animalId,
        fecha: new Date(),
        tipoEvento: "Genetica",
        referenciaId: registro.id,
        referenciaModelo: "RegistroGenetico",
        titulo: "Registro Genético Creado",
        descripcion: razaPura 
          ? `Raza pura registrada${registroGenealogia ? ` - Reg: ${registroGenealogia}` : ""}`
          : `Cruza ${porcentajeRaza || ""}%`,
        importante: true,
        userId: session.user.id,
      },
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    console.error("Error al crear registro genético:", error);
    return NextResponse.json(
      { error: "Error al crear registro" },
      { status: 500 }
    );
  }
}