-- Fotos de padre y madre cargadas en el alta del animal (cuando el progenitor
-- no es un animal registrado con foto propia).
ALTER TABLE "Animal" ADD COLUMN "fotoPadre" TEXT;
ALTER TABLE "Animal" ADD COLUMN "fotoMadre" TEXT;
