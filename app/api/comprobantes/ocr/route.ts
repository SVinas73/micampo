import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Tipo permitido por Anthropic SDK
type AnthropicMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    // Convertir a base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    // Determinar media type con verificación estricta
    let mediaType: AnthropicMediaType;
    
    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      mediaType = "image/jpeg";
    } else if (file.type === "image/png") {
      mediaType = "image/png";
    } else if (file.type === "image/gif") {
      mediaType = "image/gif";
    } else if (file.type === "image/webp") {
      mediaType = "image/webp";
    } else {
      return NextResponse.json(
        { error: "Tipo de archivo no soportado. Solo imágenes JPEG, PNG, GIF y WebP." },
        { status: 400 }
      );
    }

    // Llamar a Claude Vision para OCR
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,  // Ahora TypeScript está contento
                data: base64,
              },
            },
            {
              type: "text",
              text: `Analiza esta factura/comprobante y extrae la siguiente información en formato JSON:

{
  "tipo": "Factura/Recibo/NotaCredito/NotaDebito",
  "numero": "número del comprobante",
  "fecha": "fecha en formato YYYY-MM-DD",
  "razonSocial": "nombre del emisor",
  "rut": "RUT/CUIT si está disponible",
  "direccion": "dirección si está disponible",
  "moneda": "USD/UYU/ARS",
  "subtotal": número,
  "iva": número,
  "total": número,
  "items": [
    {
      "descripcion": "descripción del item",
      "cantidad": número,
      "precioUnitario": número,
      "subtotal": número,
      "iva": número,
      "total": número
    }
  ],
  "confianza": número entre 0-100 indicando tu nivel de confianza en la extracción
}

Responde SOLO con el JSON, sin texto adicional.`,
            },
          ],
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    
    // Extraer JSON de la respuesta
    let datosOCR;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        datosOCR = JSON.parse(jsonMatch[0]);
      } else {
        datosOCR = JSON.parse(responseText);
      }
    } catch (e) {
      console.error("Error parsing JSON:", e);
      datosOCR = { error: "No se pudo extraer información estructurada", rawText: responseText };
    }

    return NextResponse.json({
      success: true,
      datos: datosOCR,
      confianza: datosOCR.confianza || 0,
    });
  } catch (error) {
    console.error("Error OCR:", error);
    return NextResponse.json({ error: "Error al procesar OCR" }, { status: 500 });
  }
}