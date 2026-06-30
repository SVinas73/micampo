-- Campos adicionales de Siembra y Cosecha (todos nullable, sin riesgo de datos existentes).

-- AlterTable
ALTER TABLE "Siembra" ADD COLUMN     "densidad" DOUBLE PRECISION,
ADD COLUMN     "costoSemilla" DOUBLE PRECISION,
ADD COLUMN     "responsable" TEXT,
ADD COLUMN     "observaciones" TEXT;

-- AlterTable
ALTER TABLE "Cosecha" ADD COLUMN     "humedad" DOUBLE PRECISION,
ADD COLUMN     "observaciones" TEXT;
