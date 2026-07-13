-- Módulo Ganadería completo: tropas, hospital digital, rutinas de pastoreo,
-- planificador de movimientos, feedlot, boletas lecheras y trazabilidad SENASA.

-- AlterTable Animal: identidad extendida + baja + tropa
ALTER TABLE "Animal" ADD COLUMN "nombre" TEXT;
ALTER TABLE "Animal" ADD COLUMN "categoria" TEXT;
ALTER TABLE "Animal" ADD COLUMN "rfid" TEXT;
ALTER TABLE "Animal" ADD COLUMN "origen" TEXT;
ALTER TABLE "Animal" ADD COLUMN "condicionNacimiento" TEXT;
ALTER TABLE "Animal" ADD COLUMN "foto" TEXT;
ALTER TABLE "Animal" ADD COLUMN "ubicacion" TEXT;
ALTER TABLE "Animal" ADD COLUMN "fechaBaja" TIMESTAMP(3);
ALTER TABLE "Animal" ADD COLUMN "motivoBaja" TEXT;
ALTER TABLE "Animal" ADD COLUMN "tropaId" TEXT;

-- CreateTable RutinaTropa (referenciada por Tropa y MovimientoTropa)
CREATE TABLE "RutinaTropa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'rotacion',
    "emoji" TEXT,
    "color" TEXT,
    "descripcion" TEXT,
    "config" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Activa',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RutinaTropa_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RutinaTropa_userId_idx" ON "RutinaTropa"("userId");
ALTER TABLE "RutinaTropa" ADD CONSTRAINT "RutinaTropa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable Tropa
CREATE TABLE "Tropa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT,
    "color" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Activa',
    "loteId" TEXT,
    "rutinaId" TEXT,
    "notas" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Tropa_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Tropa_userId_idx" ON "Tropa"("userId");
CREATE INDEX "Tropa_loteId_idx" ON "Tropa"("loteId");
ALTER TABLE "Tropa" ADD CONSTRAINT "Tropa_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tropa" ADD CONSTRAINT "Tropa_rutinaId_fkey" FOREIGN KEY ("rutinaId") REFERENCES "RutinaTropa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tropa" ADD CONSTRAINT "Tropa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FK Animal.tropaId
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_tropaId_fkey" FOREIGN KEY ("tropaId") REFERENCES "Tropa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable TratamientoSanitario (Hospital Digital)
CREATE TABLE "TratamientoSanitario" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'Tratamiento',
    "diagnostico" TEXT NOT NULL,
    "zona" TEXT,
    "sintomas" TEXT,
    "severidad" TEXT,
    "notas" TEXT,
    "medicamento" TEXT,
    "dosis" TEXT,
    "via" TEXT,
    "dosisTotales" INTEGER NOT NULL DEFAULT 1,
    "dosisAplicadas" INTEGER NOT NULL DEFAULT 0,
    "proximaDosis" TIMESTAMP(3),
    "proximoControl" TIMESTAMP(3),
    "retiroHoras" INTEGER,
    "finRetiro" TIMESTAMP(3),
    "marcaZonas" TEXT,
    "marcaColor" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'En curso',
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "responsable" TEXT,
    "costo" DOUBLE PRECISION,
    "origenIA" BOOLEAN NOT NULL DEFAULT false,
    "protocolo" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TratamientoSanitario_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TratamientoSanitario_userId_idx" ON "TratamientoSanitario"("userId");
CREATE INDEX "TratamientoSanitario_animalId_idx" ON "TratamientoSanitario"("animalId");
CREATE INDEX "TratamientoSanitario_estado_idx" ON "TratamientoSanitario"("estado");
ALTER TABLE "TratamientoSanitario" ADD CONSTRAINT "TratamientoSanitario_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TratamientoSanitario" ADD CONSTRAINT "TratamientoSanitario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable MovimientoTropa
CREATE TABLE "MovimientoTropa" (
    "id" TEXT NOT NULL,
    "tropaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horario" TEXT,
    "origenNombre" TEXT,
    "destinoNombre" TEXT,
    "motivo" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Planificado',
    "cabezas" INTEGER,
    "distanciaKm" DOUBLE PRECISION,
    "duracionMin" INTEGER,
    "responsable" TEXT,
    "notas" TEXT,
    "rutinaId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MovimientoTropa_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MovimientoTropa_userId_idx" ON "MovimientoTropa"("userId");
CREATE INDEX "MovimientoTropa_tropaId_idx" ON "MovimientoTropa"("tropaId");
CREATE INDEX "MovimientoTropa_fecha_idx" ON "MovimientoTropa"("fecha");
CREATE INDEX "MovimientoTropa_estado_idx" ON "MovimientoTropa"("estado");
ALTER TABLE "MovimientoTropa" ADD CONSTRAINT "MovimientoTropa_tropaId_fkey" FOREIGN KEY ("tropaId") REFERENCES "Tropa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovimientoTropa" ADD CONSTRAINT "MovimientoTropa_rutinaId_fkey" FOREIGN KEY ("rutinaId") REFERENCES "RutinaTropa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MovimientoTropa" ADD CONSTRAINT "MovimientoTropa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable CorralEngorde
CREATE TABLE "CorralEngorde" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT,
    "capacidad" INTEGER,
    "cabezas" INTEGER NOT NULL DEFAULT 0,
    "fechaIngreso" TIMESTAMP(3),
    "pesoIngreso" DOUBLE PRECISION,
    "pesoActual" DOUBLE PRECISION,
    "pesoObjetivo" DOUBLE PRECISION,
    "gdpObjetivo" DOUBLE PRECISION,
    "diasEstimados" INTEGER,
    "racionId" TEXT,
    "consumoDiario" DOUBLE PRECISION,
    "costoDiario" DOUBLE PRECISION,
    "precioMercado" DOUBLE PRECISION,
    "fechaFaenaEst" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "notas" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CorralEngorde_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CorralEngorde_userId_idx" ON "CorralEngorde"("userId");
CREATE INDEX "CorralEngorde_estado_idx" ON "CorralEngorde"("estado");
ALTER TABLE "CorralEngorde" ADD CONSTRAINT "CorralEngorde_racionId_fkey" FOREIGN KEY ("racionId") REFERENCES "Racion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CorralEngorde" ADD CONSTRAINT "CorralEngorde_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable PesadaCorral
CREATE TABLE "PesadaCorral" (
    "id" TEXT NOT NULL,
    "corralId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pesoPromedio" DOUBLE PRECISION NOT NULL,
    "cabezas" INTEGER,
    "gdp" DOUBLE PRECISION,
    "consumo" DOUBLE PRECISION,
    "notas" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PesadaCorral_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PesadaCorral_userId_idx" ON "PesadaCorral"("userId");
CREATE INDEX "PesadaCorral_corralId_idx" ON "PesadaCorral"("corralId");
CREATE INDEX "PesadaCorral_fecha_idx" ON "PesadaCorral"("fecha");
ALTER TABLE "PesadaCorral" ADD CONSTRAINT "PesadaCorral_corralId_fkey" FOREIGN KEY ("corralId") REFERENCES "CorralEngorde"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PesadaCorral" ADD CONSTRAINT "PesadaCorral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable BoletaLechera
CREATE TABLE "BoletaLechera" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numero" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'retiro',
    "industria" TEXT,
    "litros" DOUBLE PRECISION,
    "grasa" DOUBLE PRECISION,
    "proteina" DOUBLE PRECISION,
    "ccs" DOUBLE PRECISION,
    "ufc" DOUBLE PRECISION,
    "temperatura" DOUBLE PRECISION,
    "precioLitro" DOUBLE PRECISION,
    "importe" DOUBLE PRECISION,
    "notas" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BoletaLechera_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BoletaLechera_userId_idx" ON "BoletaLechera"("userId");
CREATE INDEX "BoletaLechera_fecha_idx" ON "BoletaLechera"("fecha");
ALTER TABLE "BoletaLechera" ADD CONSTRAINT "BoletaLechera_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable DocumentoTransito
CREATE TABLE "DocumentoTransito" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origen" TEXT,
    "destino" TEXT,
    "motivo" TEXT,
    "categoria" TEXT,
    "cabezas" INTEGER,
    "pesoTotal" DOUBLE PRECISION,
    "precioKg" DOUBLE PRECISION,
    "importe" DOUBLE PRECISION,
    "transporte" TEXT,
    "vencimiento" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'Vigente',
    "notas" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DocumentoTransito_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DocumentoTransito_userId_idx" ON "DocumentoTransito"("userId");
CREATE INDEX "DocumentoTransito_fecha_idx" ON "DocumentoTransito"("fecha");
CREATE INDEX "DocumentoTransito_estado_idx" ON "DocumentoTransito"("estado");
ALTER TABLE "DocumentoTransito" ADD CONSTRAINT "DocumentoTransito_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable AuditoriaTrazabilidad
CREATE TABLE "AuditoriaTrazabilidad" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "organismo" TEXT,
    "alcance" TEXT,
    "resultado" TEXT,
    "observaciones" TEXT,
    "proximaFecha" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AuditoriaTrazabilidad_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditoriaTrazabilidad_userId_idx" ON "AuditoriaTrazabilidad"("userId");
CREATE INDEX "AuditoriaTrazabilidad_fecha_idx" ON "AuditoriaTrazabilidad"("fecha");
ALTER TABLE "AuditoriaTrazabilidad" ADD CONSTRAINT "AuditoriaTrazabilidad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
