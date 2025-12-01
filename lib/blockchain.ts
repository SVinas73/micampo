import crypto from "crypto";

export function generarHashBlockchain(data: any, hashAnterior: string | null = null): string {
  const timestamp = new Date().toISOString();
  const contenido = JSON.stringify({
    data,
    timestamp,
    hashAnterior,
  });
  
  return crypto
    .createHash("sha256")
    .update(contenido)
    .digest("hex");
}

export function generarCodigoQR(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString("hex");
  return `MC-${timestamp}-${random}`.toUpperCase();
}

export function verificarCadenaBlockchain(
  hashActual: string,
  data: any,
  hashAnterior: string | null,
  timestamp: Date
): boolean {
  const contenido = JSON.stringify({
    data,
    timestamp: timestamp.toISOString(),
    hashAnterior,
  });
  
  const hashCalculado = crypto
    .createHash("sha256")
    .update(contenido)
    .digest("hex");
  
  return hashCalculado === hashActual;
}