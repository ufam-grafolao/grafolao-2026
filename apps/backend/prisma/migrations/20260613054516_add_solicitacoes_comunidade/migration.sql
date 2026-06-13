-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('PENDENTE', 'ACEITA', 'REJEITADA');

-- CreateTable
CREATE TABLE "solicitacoes_comunidade" (
    "id" TEXT NOT NULL,
    "comunidadeId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "status" "StatusSolicitacao" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_comunidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_comunidade_comunidadeId_usuarioId_key" ON "solicitacoes_comunidade"("comunidadeId", "usuarioId");

-- AddForeignKey
ALTER TABLE "solicitacoes_comunidade" ADD CONSTRAINT "solicitacoes_comunidade_comunidadeId_fkey" FOREIGN KEY ("comunidadeId") REFERENCES "comunidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_comunidade" ADD CONSTRAINT "solicitacoes_comunidade_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
