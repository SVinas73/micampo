"use client";

import { use, useEffect, useState } from "react";
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Package,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
} from "lucide-react";

type EtapaPublica = {
  etapa: string;
  descripcion: string;
  fecha: string;
  responsable: string | null;
  ubicacion: string | null;
  hashValidacion: string;
};

type RegistroPublico = {
  codigoQR: string;
  tipoProducto: string;
  nombreProducto: string;
  loteProduccion: string | null;
  campo: string | null;
  ubicacion: string | null;
  certificaciones: string[] | null;
  hashBlockchain: string;
  timestamp: string;
  etapas: EtapaPublica[];
};

function formatFecha(value: string) {
  try {
    return new Date(value).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export default function VerificarPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = use(params);
  const [registro, setRegistro] = useState<RegistroPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegistro = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/trazabilidad/verificar?codigo=${encodeURIComponent(codigo)}`
        );
        if (res.ok) {
          setRegistro(await res.json());
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Producto no encontrado");
        }
      } catch {
        setError("No se pudo verificar el producto");
      } finally {
        setLoading(false);
      }
    };
    fetchRegistro();
  }, [codigo]);

  return (
    <div className="min-h-screen bg-[#f4f3ee] text-[#2a281f]">
      {/* Encabezado */}
      <header className="bg-gradient-to-br from-[#46603a] via-[#3a4f2e] to-[#324428] text-white">
        <div className="max-w-2xl mx-auto px-5 py-6 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="MiCampo"
            className="h-10 w-10 object-contain rounded-lg bg-white/10 p-1"
          />
          <div>
            <p className="text-lg font-bold leading-tight">MiCampo</p>
            <p className="text-xs text-white/70">Verificación de trazabilidad</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        {loading && (
          <div className="text-center py-20 text-gray-500">
            <div className="animate-pulse">Verificando en blockchain…</div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl border border-red-100 p-8 text-center shadow-sm">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
            <h1 className="text-lg font-semibold mt-4">{error}</h1>
            <p className="text-sm text-gray-500 mt-2">
              El código <span className="font-mono">{codigo}</span> no corresponde a un
              producto registrado.
            </p>
          </div>
        )}

        {!loading && registro && (
          <>
            {/* Sello verificado */}
            <div className="bg-white rounded-2xl border border-[#e7e5e0] p-5 shadow-sm">
              <div className="flex items-center gap-3 text-[#5e7733]">
                <ShieldCheck className="h-7 w-7" />
                <div>
                  <p className="font-semibold">Producto verificado</p>
                  <p className="text-xs text-gray-500">
                    Registro inmutable en blockchain · SHA-256
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{registro.nombreProducto}</h1>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#eef1e6] text-[#5e7733]">
                    {registro.tipoProducto}
                  </span>
                </div>
                {registro.loteProduccion && (
                  <p className="text-sm text-gray-500 mt-1">
                    Lote: {registro.loteProduccion}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-5">
                {registro.campo && (
                  <div>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Package className="h-3 w-3" /> Origen
                    </p>
                    <p className="text-sm font-medium">{registro.campo}</p>
                  </div>
                )}
                {registro.ubicacion && (
                  <div>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Ubicación
                    </p>
                    <p className="text-sm font-medium">{registro.ubicacion}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Registrado
                  </p>
                  <p className="text-sm font-medium">{formatFecha(registro.timestamp)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Etapas verificadas</p>
                  <p className="text-sm font-medium">{registro.etapas.length}</p>
                </div>
              </div>

              {registro.certificaciones && registro.certificaciones.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {registro.certificaciones.map((cert, i) => (
                    <span
                      key={i}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#eef1e6] text-[#5e7733] inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {cert}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Línea de tiempo */}
            <div className="bg-white rounded-2xl border border-[#e7e5e0] p-5 shadow-sm">
              <h2 className="font-semibold mb-4">Historia del producto</h2>
              {registro.etapas.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">
                  Aún no se registraron etapas para este producto.
                </p>
              ) : (
                <ol className="relative border-l border-[#dcdad2] ml-3 space-y-6">
                  {registro.etapas.map((etapa, idx) => (
                    <li key={idx} className="ml-6">
                      <span className="absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full bg-[#5e7733] text-white text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{etapa.etapa}</p>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#eef1e6] text-[#5e7733] inline-flex items-center gap-1">
                          <ShieldCheck className="h-2.5 w-2.5" /> Verificado
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{etapa.descripcion}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatFecha(etapa.fecha)}
                        {etapa.responsable && ` · ${etapa.responsable}`}
                        {etapa.ubicacion && ` · ${etapa.ubicacion}`}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Hash blockchain */}
            <div className="bg-white rounded-2xl border border-[#e7e5e0] p-5 shadow-sm">
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                <Fingerprint className="h-3 w-3" /> Hash blockchain
              </p>
              <p className="text-xs font-mono text-gray-600 break-all">
                {registro.hashBlockchain}
              </p>
            </div>

            <p className="text-center text-xs text-gray-400 pb-6">
              Trazabilidad garantizada por MiCampo · {registro.codigoQR}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
