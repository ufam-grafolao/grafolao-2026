/**
 * Script de recálculo retroativo dos confrontos.
 *
 * Percorre todos os jogos já ENCERRADOS no banco e reconstrói os confrontos
 * (arestas vencedor->perdedor) a partir dos palpites e pontuações já salvas.
 *
 * Necessário rodar uma vez ao implementar o módulo de grafos, pois os jogos
 * anteriores foram encerrados antes da construção automática de confrontos
 * existir no fluxo de inserirResultado.
 *
 * Desde a regra da ausência, as rotas /grafos/confrontos NÃO leem mais a tabela
 * Confronto: o grafo é construído na leitura a partir dos palpites dos jogos
 * encerrados (arestasDeConfrontos). A tabela fica só como histórico, e este
 * script não é necessário para o grafo ficar correto.
 *
 * Contexto: nos dados exportados em 2026-08-14, 53 dos 104 jogos encerrados não
 * tinham confrontos gravados. Rodar este script em produção os criaria; isso não
 * muda mais o grafo servido pela API, só o histórico.
 *
 * Uso (a partir de apps/backend):
 *   npx tsx src/script/recalcular-confrontos.ts
 */

import prisma from '../db/prisma.js'
import { construirConfrontosJogo } from '../modules/grafo-confrontos/grafo-confrontos.service.js'

async function recalcularConfrontos() {
  console.log('🔄 Iniciando recálculo retroativo de confrontos...\n')

  const jogosEncerrados = await prisma.jogo.findMany({
    where: { status: 'ENCERRADO' },
    select: { id: true, rodada: true, grupo: true },
    orderBy: { dataHora: 'asc' },
  })

  console.log(`📊 ${jogosEncerrados.length} jogos encerrados encontrados.\n`)

  let totalConfrontos = 0
  let jogosProcessados = 0
  let jogosSemPalpites = 0

  for (const jogo of jogosEncerrados) {
    const { confrontosCriados } = await construirConfrontosJogo(jogo.id)

    if (confrontosCriados === 0) {
      jogosSemPalpites++
    } else {
      totalConfrontos += confrontosCriados
    }

    jogosProcessados++

    if (jogosProcessados % 10 === 0) {
      console.log(`   ... ${jogosProcessados}/${jogosEncerrados.length} jogos processados`)
    }
  }

  console.log('\n✅ Recálculo concluído!')
  console.log(`   Jogos processados: ${jogosProcessados}`)
  console.log(`   Jogos sem confrontos gerados (poucos palpites): ${jogosSemPalpites}`)
  console.log(`   Total de confrontos (arestas brutas) criados: ${totalConfrontos}`)
}

recalcularConfrontos()
  .catch((e) => {
    console.error('❌ Erro no recálculo:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })