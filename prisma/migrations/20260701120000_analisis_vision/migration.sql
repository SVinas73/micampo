-- Historial de análisis de Visión IA. Tabla nueva, sin impacto sobre datos existentes.

-- CreateTable
CREATE TABLE "AnalisisVision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "confianza" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "detalle" TEXT,
    "metricas" TEXT,
    "recomendaciones" TEXT,
    "fuente" TEXT,
    "imagenesCount" INTEGER NOT NULL DEFAULT 1,
    "thumb" TEXT,
    "loteId" TEXT,
    "loteNombre" TEXT,
    "establecimientoId" TEXT,
    "establecimientoNombre" TEXT,
    "alertaPlagaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalisisVision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalisisVision_userId_createdAt_idx" ON "AnalisisVision"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalisisVision_loteId_idx" ON "AnalisisVision"("loteId");
