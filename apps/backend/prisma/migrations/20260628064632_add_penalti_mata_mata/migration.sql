-- AlterEnum
ALTER TYPE "StatusPalpite" ADD VALUE 'ACERTO_BONUS';

-- AlterTable
ALTER TABLE "palpites" ADD COLUMN     "vencedorPenalti" TEXT;

-- AlterTable
ALTER TABLE "resultados" ADD COLUMN     "penalti" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vencedorPenalti" TEXT;
