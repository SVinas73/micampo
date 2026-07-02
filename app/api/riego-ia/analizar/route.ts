import { NextResponse } from "next/server";

/**
 * DESACTIVADO. Este endpoint devolvía un balance hídrico con días, humedades y fechas
 * hardcodeadas (datos de ejemplo), lo que viola la regla de "datos reales únicamente".
 * El balance real se calcula en /plan-riego a partir de ET0 + lluvia (/api/clima) y el
 * agua útil del suelo. Se deja este stub 410 sin generar datos falsos.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Endpoint desactivado. El balance de riego real se calcula en Plan de Riego." },
    { status: 410 }
  );
}
