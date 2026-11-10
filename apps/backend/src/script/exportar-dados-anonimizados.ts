/**
 * Script de exportação anonimizada para reprodução acadêmica (WFA 2026).
 *
 * Gera CSVs com a estrutura completa de jogos, palpites e confrontos,
 * substituindo qualquer identificador pessoal (nome, e-mail, avatarUrl,
 * googleId) por um pseudônimo estável (user1, user2, ...).
 *
 * Saída: pasta data/ na raiz do repositório (grafolao-2026/data/).
 *
 * O mapeamento real -> pseudônimo é salvo em uma subpasta separada
 * (data/_privado/) que NUNCA deve ser commitada — adicione
 * "data/_privado/" ao .gitignore antes de rodar.
 *
 * Uso (a partir de apps/backend):
 *   npx tsx src/script/exportar-dados-anonimizados.ts
 *
 * Saída em data/ (para commitar na main):
 *   - usuarios_anonimizados.csv
 *   - jogos.csv
 *   - palpites_anonimizados.csv
 *   - confrontos_anonimizados.csv
 *   - README.md
 *
 * Saída em data/_privado/ (NÃO commitar):
 *   - mapeamento_privado.json
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'
import prisma from '../db/prisma.js'

// Ajuste este caminho se a raiz do repo estiver em outro nível relativo
// ao backend (ex: se este script rodar de apps/backend, '../../../data'
// aponta para <raiz-do-repo>/data).
const DIR_SAIDA = path.resolve('./data')
const DIR_PRIVADO = path.resolve('./data/_privado')

function paraCsv(linhas: Record<string, unknown>[]): string {
  if (linhas.length === 0) return ''
  const colunas = Object.keys(linhas[0])
  const escapar = (v: unknown) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = colunas.join(',')
  const corpo = linhas.map(l => colunas.map(c => escapar(l[c])).join(',')).join('\n')
  return `${header}\n${corpo}\n`
}

async function main() {
  console.log('🔒 Iniciando exportação anonimizada...\n')
  console.log(`   Saída pública: ${DIR_SAIDA}`)
  console.log(`   Saída privada: ${DIR_PRIVADO}\n`)

  if (!existsSync(DIR_SAIDA)) mkdirSync(DIR_SAIDA, { recursive: true })
  if (!existsSync(DIR_PRIVADO)) mkdirSync(DIR_PRIVADO, { recursive: true })

  // ── 1. Mapeamento estável usuarioId real -> pseudônimo ──────────────────
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, criadoEm: true },
    orderBy: { criadoEm: 'asc' },
  })

  const mapa = new Map<string, string>()
  usuarios.forEach((u, i) => {
    mapa.set(u.id, `user${i + 1}`)
  })

  writeFileSync(
    path.join(DIR_PRIVADO, 'mapeamento_privado.json'),
    JSON.stringify(Object.fromEntries(mapa), null, 2)
  )
  console.log(`✅ Mapeamento privado gerado (${mapa.size} usuários) — NÃO commitar data/_privado/.\n`)

  // ── 2. usuarios_anonimizados.csv ────────────────────────────────────────
  const usuariosAnon = usuarios.map(u => ({
    usuarioId: mapa.get(u.id),
    criadoEm: u.criadoEm.toISOString(),
  }))
  writeFileSync(path.join(DIR_SAIDA, 'usuarios_anonimizados.csv'), paraCsv(usuariosAnon))
  console.log(`✅ usuarios_anonimizados.csv (${usuariosAnon.length} linhas)`)

  // ── 3. jogos.csv — dados públicos da competição ─────────────────────────
  const jogos = await prisma.jogo.findMany({
    select: {
      id: true, num: true, fase: true, rodada: true, grupo: true,
      dataHora: true, status: true,
      timeCasa: { select: { nome: true } },
      timeVisitante: { select: { nome: true } },
      resultado: { select: { golsCasa: true, golsVisitante: true } },
    },
    orderBy: { dataHora: 'asc' },
  })
  const jogosCsv = jogos.map(j => ({
    jogoId: j.id,
    num: j.num,
    fase: j.fase,
    rodada: j.rodada,
    grupo: j.grupo,
    dataHora: j.dataHora.toISOString(),
    status: j.status,
    timeCasa: j.timeCasa?.nome ?? '',
    timeVisitante: j.timeVisitante?.nome ?? '',
    golsCasa: j.resultado?.golsCasa ?? '',
    golsVisitante: j.resultado?.golsVisitante ?? '',
  }))
  writeFileSync(path.join(DIR_SAIDA, 'jogos.csv'), paraCsv(jogosCsv))
  console.log(`✅ jogos.csv (${jogosCsv.length} linhas)`)

  // ── 4. palpites_anonimizados.csv ────────────────────────────────────────
  const palpites = await prisma.palpite.findMany({
    select: {
      id: true, usuarioId: true, jogoId: true,
      golsCasa: true, golsVisitante: true,
      pontos: true, status: true, criadoEm: true,
    },
    orderBy: { criadoEm: 'asc' },
  })
  const palpitesCsv = palpites.map(p => ({
    palpiteId: p.id,
    usuarioId: mapa.get(p.usuarioId) ?? 'DESCONHECIDO',
    jogoId: p.jogoId,
    golsCasa: p.golsCasa,
    golsVisitante: p.golsVisitante,
    pontos: p.pontos,
    status: p.status,
    criadoEm: p.criadoEm.toISOString(),
  }))
  writeFileSync(path.join(DIR_SAIDA, 'palpites_anonimizados.csv'), paraCsv(palpitesCsv))
  console.log(`✅ palpites_anonimizados.csv (${palpitesCsv.length} linhas)`)

  // ── 5. confrontos_anonimizados.csv — arestas já calculadas do grafo ────
  const confrontos = await prisma.confronto.findMany({
    select: { id: true, jogoId: true, vencedorId: true, perdedorId: true, peso: true, criadoEm: true },
    orderBy: { criadoEm: 'asc' },
  })
  const confrontosCsv = confrontos.map(c => ({
    confrontoId: c.id,
    jogoId: c.jogoId,
    vencedorId: mapa.get(c.vencedorId) ?? 'DESCONHECIDO',
    perdedorId: mapa.get(c.perdedorId) ?? 'DESCONHECIDO',
    peso: c.peso,
    criadoEm: c.criadoEm.toISOString(),
  }))
  writeFileSync(path.join(DIR_SAIDA, 'confrontos_anonimizados.csv'), paraCsv(confrontosCsv))
  console.log(`✅ confrontos_anonimizados.csv (${confrontosCsv.length} linhas)`)

  // ── 6. README.md ────────────────────────────────────────────────────────
  const readme = `# Dados de Reprodução — Grafolão (WFA 2026)

Dados anonimizados extraídos da instância de produção do Grafolão ao final
da fase avaliada da Copa do Mundo FIFA 2026, disponibilizados para fins de
reprodução dos resultados apresentados no artigo submetido ao Workshop de
Ferramentas e Aplicações (WFA 2026 / WebMedia).

## Anonimização

Todo \`usuarioId\` foi substituído por um pseudônimo estável (\`user1\`,
\`user2\`, ...). Não há nome, e-mail, avatar ou qualquer outro identificador
pessoal nestes arquivos. O mesmo pseudônimo é usado de forma consistente em
todos os CSVs, permitindo reconstruir o grafo de confrontos e reproduzir os
algoritmos descritos no artigo (detecção de ciclos, PageRank, caminho mais
longo).

Os participantes se cadastraram no Grafolão para uso recreativo do bolão,
sem consentimento formal para publicação de dados pessoais — por isso a
anonimização é uma condição obrigatória desta exportação, não uma opção.

## Arquivos

| Arquivo | Descrição |
|---|---|
| \`usuarios_anonimizados.csv\` | Pseudônimo de cada participante e data de criação da conta. |
| \`jogos.csv\` | Calendário completo da competição: times, fase, data, placar oficial. Dados públicos, sem alteração. |
| \`palpites_anonimizados.csv\` | Cada palpite registrado: usuário (pseudônimo), jogo, placar previsto, pontuação obtida. |
| \`confrontos_anonimizados.csv\` | Arestas do grafo de confrontos já agregadas: para cada par de participantes com saldo positivo, o vencedor, o perdedor e o peso (saldo de vitórias). |

## Reprodução

\`confrontos_anonimizados.csv\` já reflete a agregação descrita na Seção de
Modelagem do artigo (saldo de vitórias entre cada par de participantes) e
pode ser usado diretamente para reproduzir os três algoritmos: detecção de
ciclos (DFS), PageRank iterativo e busca de caminho mais longo com
orçamento de tempo.

Alternativamente, é possível reconstruir \`confrontos_anonimizados.csv\` do
zero a partir de \`palpites_anonimizados.csv\` e \`jogos.csv\`, comparando a
pontuação de cada par de participantes por partida — o mesmo critério
usado pelo sistema em produção. Essa via mais longa serve como verificação
independente do pipeline de agregação.

Os números resultantes devem corresponder à Tabela 1 do artigo: 197
participantes, 3.235 confrontos, 1.228 ciclos detectados no grafo
completo (dados equivalentes para a versão filtrada, \`k \\geq 10\` palpites).

Código-fonte da implementação: [link do repositório GitHub — este mesmo repositório]
`
  writeFileSync(path.join(DIR_SAIDA, 'README.md'), readme)
  console.log(`✅ README.md`)

  console.log(`\n🎉 Exportação concluída em: ${DIR_SAIDA}`)
  console.log(`⚠️  Confirme que data/_privado/ está no .gitignore antes de commitar.`)
}

main()
  .catch((e) => {
    console.error('❌ Erro na exportação:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })