/**
 * Panelinhas (Proposta 5) nos CSVs anonimizados de data/.
 *
 * Usa as funções puras do backend (construirGrafoSimilaridade, cliquesMaximais,
 * resumirPanelas, ordenarRodadasPorData). Reporta a distribuição dos pesos, o efeito
 * do percentil, do ACERTO_BONUS e do filtro de jogos óbvios, e a série por rodada
 * acumulada.
 *
 * Uso (na raiz do repositório):
 *   npx tsx analise/panelinhas.ts
 * Saída: terminal e analise/resultados/panelinhas.md
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { carregarDados } from './lib/dados.js'
import {
  cliquesMaximais,
  construirGrafoSimilaridade,
  limiarPercentil,
  resumirPanelas,
  type OpcoesSimilaridade,
} from '../apps/backend/src/modules/panelinhas/panelinhas.algoritmos.js'
import { ordenarRodadasPorData } from '../apps/backend/src/shared/utils/ordenar-rodadas.js'

const ORCAMENTO_MS = 60_000
const K = 5
const { usuarios, jogos, palpites } = carregarDados()

const encerrados = jogos.filter(j => j.status === 'ENCERRADO')
const idsEncerrados = new Set(encerrados.map(j => j.id))
const rodadaDoJogo = new Map(jogos.map(j => [j.id, j.rodada]))
const palpitesEncerrados = palpites.filter(p => idsEncerrados.has(p.jogoId))

const total = new Map<string, number>()
for (const p of palpites) total.set(p.usuarioId, (total.get(p.usuarioId) ?? 0) + 1)
const recortes = [
  { nome: 'Completo', ids: usuarios.map(u => u.id) },
  { nome: 'Núcleo ≥10', ids: usuarios.filter(u => (total.get(u.id) ?? 0) >= 10).map(u => u.id) },
]

function rodar(ids: string[], ps: typeof palpites, percentil: number, opcoes: OpcoesSimilaridade = {}) {
  const grafo = construirGrafoSimilaridade(ids, ps, percentil, opcoes)
  const r = cliquesMaximais(grafo.vertices, grafo.arestas, ORCAMENTO_MS)
  return { grafo, r, resumo: resumirPanelas(r.cliques, K) }
}

const linhas: string[] = []
const out = (s = '') => { linhas.push(s); console.log(s) }
const num = (x: number, casas = 0) => x.toLocaleString('pt-BR', { maximumFractionDigits: casas, minimumFractionDigits: casas })

out('# Panelinhas (Proposta 5) nos CSVs anonimizados')
out()
out(`Fonte: \`data/*.csv\` (exportação de produção de 2026-08-14). Gerado por \`analise/panelinhas.ts\` em ${new Date().toISOString().slice(0, 10)}.`)
out(`Jogos encerrados: ${encerrados.length}. Palpites nesses jogos: ${palpitesEncerrados.length}. Orçamento por execução: ${ORCAMENTO_MS / 1000} s. Tempos medidos nesta máquina, uma execução.`)
out('Acerto = ACERTO_PLACAR, ACERTO_VENCEDOR ou ACERTO_BONUS (pontos > 0), salvo onde indicado.')
out()

// 1. Distribuição dos pesos (campeonato inteiro)
out('## 1. Distribuição dos pesos positivos (campeonato inteiro)')
out()
out('| Recorte | Pares com peso ≥ 1 | Mín | p50 | p75 | p90 | p95 | p99 | Máx |')
out('|---|---|---|---|---|---|---|---|---|')
for (const rec of recortes) {
  const { pesos } = construirGrafoSimilaridade(rec.ids, palpitesEncerrados, 0)
  const q = (p: number) => limiarPercentil(pesos, p)
  out(`| ${rec.nome} | ${num(pesos.length)} | ${q(0)} | ${q(50)} | ${q(75)} | ${q(90)} | ${q(95)} | ${q(99)} | ${q(100)} |`)
}
out()

// 2. Efeito do percentil
out('## 2. Efeito do percentil (campeonato inteiro)')
out()
out('| Recorte | p | Limiar (jogos) | \\|E\\| | Vértices com aresta | Clique máxima | Panelas (≥3) | Média top-5 | Tempo (ms) | Completou |')
out('|---|---|---|---|---|---|---|---|---|---|')
for (const rec of recortes) {
  for (const p of [75, 90, 95, 99]) {
    const { grafo, r, resumo } = rodar(rec.ids, palpitesEncerrados, p)
    const comAresta = new Set(grafo.arestas.flatMap(a => [a.a, a.b])).size
    out(`| ${rec.nome} | ${p} | ${grafo.limiar} | ${num(grafo.arestas.length)} | ${comAresta} | ${resumo.tamanhoMaximo} | ${num(resumo.totalPanelas)} | ${num(resumo.tamanhoMedioTopK, 1)} | ${r.tempoMs} | ${r.completou} |`)
  }
}
out()

// 3. ACERTO_BONUS e jogos óbvios
out('## 3. Sensibilidade à definição de acerto e ao filtro de jogos óbvios (p = 90, campeonato inteiro)')
out()
out('| Recorte | Variante | Limiar | \\|E\\| | Clique máxima | Panelas (≥3) | Tempo (ms) | Completou |')
out('|---|---|---|---|---|---|---|---|')
for (const rec of recortes) {
  for (const [nome, opcoes] of [
    ['padrão (com bônus, sem filtro)', {}],
    ['sem ACERTO_BONUS', { incluirBonus: false }],
    ['exclui jogos acertados por > 80%', { excluirAcimaDe: 0.8 }],
    ['exclui jogos acertados por > 60%', { excluirAcimaDe: 0.6 }],
  ] as [string, OpcoesSimilaridade][]) {
    const { grafo, r, resumo } = rodar(rec.ids, palpitesEncerrados, 90, opcoes)
    out(`| ${rec.nome} | ${nome} | ${grafo.limiar} | ${num(grafo.arestas.length)} | ${resumo.tamanhoMaximo} | ${num(resumo.totalPanelas)} | ${r.tempoMs} | ${r.completou} |`)
  }
}
out()

// 4. Série por rodada acumulada
const rodadas = ordenarRodadasPorData(encerrados)
for (const p of [90, 95]) {
  out(`## 4. Série por rodada acumulada (p = ${p}, limiar recalculado a cada rodada)`)
  out()
  out('| Rodada | Jogos acumulados | Recorte | Limiar | \\|E\\| | Clique máxima | Média top-5 | Panelas (≥3) | Tempo (ms) | Completou |')
  out('|---|---|---|---|---|---|---|---|---|---|')
  for (let i = 0; i < rodadas.length; i++) {
    const acumuladas = new Set(rodadas.slice(0, i + 1))
    const ps = palpitesEncerrados.filter(x => acumuladas.has(rodadaDoJogo.get(x.jogoId)!))
    const nJogos = encerrados.filter(j => acumuladas.has(j.rodada)).length
    for (const rec of recortes) {
      const { grafo, r, resumo } = rodar(rec.ids, ps, p)
      out(`| ${rodadas[i]} | ${nJogos} | ${rec.nome} | ${grafo.limiar} | ${num(grafo.arestas.length)} | ${resumo.tamanhoMaximo} | ${num(resumo.tamanhoMedioTopK, 1)} | ${num(resumo.totalPanelas)} | ${r.tempoMs} | ${r.completou} |`)
    }
  }
  out()
}

const saida = path.join(path.dirname(new URL(import.meta.url).pathname), 'resultados')
mkdirSync(saida, { recursive: true })
writeFileSync(path.join(saida, 'panelinhas.md'), linhas.join('\n') + '\n')
