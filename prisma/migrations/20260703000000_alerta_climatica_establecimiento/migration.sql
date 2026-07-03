-- Alcance por establecimiento para las alertas climáticas. Columna nullable, sin impacto en datos existentes.

-- AlterTable
ALTER TABLE "AlertaClimatica" ADD COLUMN "establecimientoId" TEXT;

-- CreateIndex
CREATE INDEX "AlertaClimatica_establecimientoId_idx" ON "AlertaClimatica"("establecimientoId");
