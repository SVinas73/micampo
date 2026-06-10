import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const cuentaBancariaId = formData.get("cuentaBancariaId") as string;

    if (!file || !cuentaBancariaId) {
      return NextResponse.json({ error: "Archivo y cuenta requeridos" }, { status: 400 });
    }

    // Leer archivo CSV
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: "Archivo vacío" }, { status: 400 });
    }

    const movimientos = [];
    let importados = 0;
    let duplicados = 0;

    // Saltar header (primera línea)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parsear CSV (formato básico: fecha,concepto,debito,credito,saldo)
      const [fecha, concepto, debito, credito, saldo] = line.split(",");

      if (!fecha || !concepto) continue;

      try {
        const fechaDate = new Date(fecha.trim());
        const debitoNum = parseFloat(debito?.trim() || "0");
        const creditoNum = parseFloat(credito?.trim() || "0");
        const saldoNum = parseFloat(saldo?.trim() || "0");

        // Verificar duplicados
        const existente = await prisma.extractoBancario.findFirst({
          where: {
            cuentaId: cuentaBancariaId,
            fecha: fechaDate,
            descripcion: concepto.trim(),
            debito: debitoNum,
            credito: creditoNum,
          },
        });

        if (existente) {
          duplicados++;
          continue;
        }

        // Crear movimiento
        const movimiento = await prisma.extractoBancario.create({
          data: {
            cuentaId: cuentaBancariaId,
            fecha: fechaDate,
            descripcion: concepto.trim(),
            debito: debitoNum,
            credito: creditoNum,
            saldo: saldoNum,
            userId: session.user.id,
          },
        });

        // Mantener compatibilidad: exponer también "concepto"
        movimientos.push({ ...movimiento, concepto: movimiento.descripcion });
        importados++;
      } catch (error) {
        console.error("Error procesando línea:", line, error);
      }
    }

    return NextResponse.json({
      success: true,
      importados,
      duplicados,
      total: lines.length - 1,
      movimientos,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al importar extracto" }, { status: 500 });
  }
}