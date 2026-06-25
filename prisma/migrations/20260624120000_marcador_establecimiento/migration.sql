-- AlterTable
ALTER TABLE "MarcadorGeorreferenciado" ADD COLUMN     "establecimientoId" TEXT,
ALTER COLUMN "loteId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "MarcadorGeorreferenciado_establecimientoId_idx" ON "MarcadorGeorreferenciado"("establecimientoId");

-- AddForeignKey
ALTER TABLE "MarcadorGeorreferenciado" ADD CONSTRAINT "MarcadorGeorreferenciado_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "Establecimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

