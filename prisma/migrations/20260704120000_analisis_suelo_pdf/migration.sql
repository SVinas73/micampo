-- PDF del laboratorio en el análisis de suelo. Columna nullable, sin impacto en datos existentes.

-- AlterTable
ALTER TABLE "AnalisisSuelo" ADD COLUMN "pdf" TEXT;
