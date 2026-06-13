-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PARTICIPANTE');

-- CreateEnum
CREATE TYPE "Fase" AS ENUM ('GRUPOS', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTAS', 'SEMIFINAL', 'TERCEIRO_LUGAR', 'FINAL');

-- CreateEnum
CREATE TYPE "StatusJogo" AS ENUM ('AGENDADO', 'EM_ANDAMENTO', 'ENCERRADO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "StatusPalpite" AS ENUM ('PENDENTE', 'ACERTO_PLACAR', 'ACERTO_VENCEDOR', 'ERRO');

-- CreateEnum
CREATE TYPE "TipoPalpiteEspecial" AS ENUM ('CAMPEAO', 'VICE', 'TERCEIRO_LUGAR', 'ARTILHEIRO');

-- CreateEnum
CREATE TYPE "TipoComunidade" AS ENUM ('PUBLICA', 'PRIVADA');

-- CreateEnum
CREATE TYPE "RoleComunidade" AS ENUM ('DONO', 'MODERADOR', 'MEMBRO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "googleId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARTICIPANTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "comunidadesCriadas" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "times" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT,
    "grupo" TEXT,

    CONSTRAINT "times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jogos" (
    "id" TEXT NOT NULL,
    "num" INTEGER,
    "fase" "Fase" NOT NULL,
    "rodada" TEXT NOT NULL,
    "grupo" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "local" TEXT NOT NULL,
    "timeCasaId" TEXT,
    "timeVisitanteId" TEXT,
    "timeCasaRef" TEXT,
    "timeVisitanteRef" TEXT,
    "status" "StatusJogo" NOT NULL DEFAULT 'AGENDADO',

    CONSTRAINT "jogos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "golsCasa" INTEGER NOT NULL,
    "golsVisitante" INTEGER NOT NULL,
    "cartoesAmarelos" INTEGER NOT NULL DEFAULT 0,
    "cartoesVermelhosIndiretos" INTEGER NOT NULL DEFAULT 0,
    "cartoesVermelhosDiretos" INTEGER NOT NULL DEFAULT 0,
    "cartoesAmarelosMaisVermelho" INTEGER NOT NULL DEFAULT 0,
    "inseridoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inseridoPor" TEXT NOT NULL,
    "artilheirosCasa" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "artilheirosVisitante" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "resultados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "palpites" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "resultadoId" TEXT,
    "golsCasa" INTEGER NOT NULL,
    "golsVisitante" INTEGER NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusPalpite" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "totalEdicoes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "palpites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "palpites_especiais" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoPalpiteEspecial" NOT NULL,
    "valor" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "acertou" BOOLEAN,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "palpites_especiais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunidades" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoComunidade" NOT NULL DEFAULT 'PUBLICA',
    "avatarUrl" TEXT,
    "codigoCovite" TEXT,
    "donoId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comunidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros_comunidade" (
    "id" TEXT NOT NULL,
    "comunidadeId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "role" "RoleComunidade" NOT NULL DEFAULT 'MEMBRO',
    "entradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membros_comunidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convites_comunidade" (
    "id" TEXT NOT NULL,
    "comunidadeId" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "usos" INTEGER NOT NULL DEFAULT 0,
    "maxUsos" INTEGER,
    "expiradoEm" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convites_comunidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confrontos" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "vencedorId" TEXT NOT NULL,
    "perdedorId" TEXT NOT NULL,
    "palpiteId" TEXT NOT NULL,
    "peso" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "confrontos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagerank_snapshots" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "rodada" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "ranking" INTEGER NOT NULL,
    "calculadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagerank_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciclos_detectados" (
    "id" TEXT NOT NULL,
    "rodada" TEXT,
    "participantes" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "detectadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ciclos_detectados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estados_rodada" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "rodada" TEXT NOT NULL,
    "totalPontos" INTEGER NOT NULL DEFAULT 0,
    "percentualAcerto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "melhorou" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "estados_rodada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acertos_compartilhados" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipoAcerto" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acertos_compartilhados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clique_snapshots" (
    "id" TEXT NOT NULL,
    "rodada" TEXT,
    "membros" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "calculadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clique_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_googleId_key" ON "usuarios"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "times_nome_key" ON "times"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "resultados_jogoId_key" ON "resultados"("jogoId");

-- CreateIndex
CREATE UNIQUE INDEX "palpites_usuarioId_jogoId_key" ON "palpites"("usuarioId", "jogoId");

-- CreateIndex
CREATE UNIQUE INDEX "palpites_especiais_usuarioId_tipo_key" ON "palpites_especiais"("usuarioId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "comunidades_codigoCovite_key" ON "comunidades"("codigoCovite");

-- CreateIndex
CREATE UNIQUE INDEX "membros_comunidade_comunidadeId_usuarioId_key" ON "membros_comunidade"("comunidadeId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "convites_comunidade_codigo_key" ON "convites_comunidade"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "confrontos_jogoId_vencedorId_perdedorId_key" ON "confrontos"("jogoId", "vencedorId", "perdedorId");

-- CreateIndex
CREATE UNIQUE INDEX "acertos_compartilhados_jogoId_usuarioId_key" ON "acertos_compartilhados"("jogoId", "usuarioId");

-- AddForeignKey
ALTER TABLE "jogos" ADD CONSTRAINT "jogos_timeCasaId_fkey" FOREIGN KEY ("timeCasaId") REFERENCES "times"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jogos" ADD CONSTRAINT "jogos_timeVisitanteId_fkey" FOREIGN KEY ("timeVisitanteId") REFERENCES "times"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados" ADD CONSTRAINT "resultados_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "jogos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palpites" ADD CONSTRAINT "palpites_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "jogos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palpites" ADD CONSTRAINT "palpites_resultadoId_fkey" FOREIGN KEY ("resultadoId") REFERENCES "resultados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palpites" ADD CONSTRAINT "palpites_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palpites_especiais" ADD CONSTRAINT "palpites_especiais_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_comunidade" ADD CONSTRAINT "membros_comunidade_comunidadeId_fkey" FOREIGN KEY ("comunidadeId") REFERENCES "comunidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_comunidade" ADD CONSTRAINT "membros_comunidade_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convites_comunidade" ADD CONSTRAINT "convites_comunidade_comunidadeId_fkey" FOREIGN KEY ("comunidadeId") REFERENCES "comunidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confrontos" ADD CONSTRAINT "confrontos_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "jogos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confrontos" ADD CONSTRAINT "confrontos_palpiteId_fkey" FOREIGN KEY ("palpiteId") REFERENCES "palpites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confrontos" ADD CONSTRAINT "confrontos_perdedorId_fkey" FOREIGN KEY ("perdedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confrontos" ADD CONSTRAINT "confrontos_vencedorId_fkey" FOREIGN KEY ("vencedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estados_rodada" ADD CONSTRAINT "estados_rodada_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "jogos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estados_rodada" ADD CONSTRAINT "estados_rodada_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
