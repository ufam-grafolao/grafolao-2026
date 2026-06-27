/*
  Warnings:

  - You are about to drop the column `valor` on the `palpites_especiais` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[apiFootballId]` on the table `times` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "TipoPalpiteEspecial" ADD VALUE 'MVP';

-- AlterTable
ALTER TABLE "palpites_especiais" DROP COLUMN "valor",
ADD COLUMN     "jogadorId" TEXT,
ADD COLUMN     "timeId" TEXT,
ADD COLUMN     "totalEdicoes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "times" ADD COLUMN     "apiFootballId" INTEGER;

-- CreateTable
CREATE TABLE "jogadores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiFootballId" INTEGER NOT NULL,
    "timeId" TEXT NOT NULL,
    "position" TEXT,
    "numero" INTEGER,
    "fotoUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jogadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados_especiais" (
    "id" TEXT NOT NULL,
    "tipo" "TipoPalpiteEspecial" NOT NULL,
    "timeId" TEXT,
    "jogadorId" TEXT,
    "inseridoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inseridoPor" TEXT NOT NULL,

    CONSTRAINT "resultados_especiais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jogadores_apiFootballId_key" ON "jogadores"("apiFootballId");

-- CreateIndex
CREATE INDEX "jogadores_timeId_idx" ON "jogadores"("timeId");

-- CreateIndex
CREATE INDEX "jogadores_name_idx" ON "jogadores"("name");

-- CreateIndex
CREATE UNIQUE INDEX "resultados_especiais_tipo_key" ON "resultados_especiais"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "times_apiFootballId_key" ON "times"("apiFootballId");

-- AddForeignKey
ALTER TABLE "jogadores" ADD CONSTRAINT "jogadores_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palpites_especiais" ADD CONSTRAINT "palpites_especiais_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "times"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palpites_especiais" ADD CONSTRAINT "palpites_especiais_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "jogadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_especiais" ADD CONSTRAINT "resultados_especiais_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "times"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_especiais" ADD CONSTRAINT "resultados_especiais_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "jogadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
