/**
 * Aventura da Zebra (Proposta 3): análise de sensibilidade nos CSVs anonimizados.
 *
 *  1. Distribuição de cada métrica de ousadia (um valor por palpite em jogo encerrado).
 *  2. Ranking do Índice de Zebra por métrica; Spearman entre rankings; quantos do top 10 mudam.
 *  3. MST agregada (distância média nos jogos em comum) para alguns mínimos de jogos em comum.
 *
 * Usa as funções puras do backend. Uso (na raiz): npx tsx analise/zebra.ts
 * Saída: terminal e analise/resultados/zebra.md
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { carregarDados } from './lib/dados.js'
import {
  METRICAS_OUSADIA,
  indiceDeZebra,
  mstKruskal,
  ousadiaNoJogo,
  spearman,
  type MetricaOusadia,
  type OrdemZebra,
} from '../apps/backend/src/modules/zebra/zebra.algoritmos.js'
import { distanciaMediaAgregada } from '../apps/backend/src/shared/similaridade/similaridade-palpites.js'

const { usuarios, jogos, palpites } = carregarDados()
const encerrados = new Set(jogos.filter(j => j.status === 'ENCERRADO').map(j => j.id))
const ps = palpites.filter(p => encerrados.has(p.jogoId))
const porJogo = new Map<string, typeof ps>()
for (const p of ps) porJogo.set(p.jogoId, [...(porJogo.get(p.jogoId) ?? []), p])

const total = new Map<string, number>()
for (const p of palpites) total.set(p.usuarioId, (total.get(p.usuarioId) ?? 0) + 1)
const recortes = [
  { nome: 'Completo (quem palpitou)', ids: new Set(ps.map(p => p.usuarioId)) },
  { nome: 'Núcleo ≥10', ids: new Set(usuarios.filter(u => (total.get(u.id) ?? 0) >= 10).map(u => u.id)) },
]

const linhas: string[] = []
const out = (s = '') => { linhas.push(s); console.log(s) }
const f = (x: number, c = 3) => (Number.isNaN(x) ? '—' : x.toFixed(c).replace('.', ','))
const quantil = (v: number[], q: number) => { const s = [...v].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1)))] }

out('# Aventura da Zebra: sensibilidade da métrica de ousadia')
out()
out(`Fonte: \`data/*.csv\` (exportação de produção de 2026-08-14). Gerado por \`analise/zebra.ts\` em ${new Date().toISOString().slice(0, 10)}.`)
out(`Jogos encerrados: ${encerrados.size}. Palpites nesses jogos: ${ps.length}. Ousadia calculada só entre quem palpitou no jogo, com todos os palpiteiros (o recorte ≥10 só filtra o ranking).`)
out()

// 1. Distribuições
const valores = new Map<MetricaOusadia, number[]>(METRICAS_OUSADIA.map(m => [m, []]))
const ousadias = new Map<MetricaOusadia, Map<string, Map<string, number>>>() // métrica → jogo → usuário → valor
for (const m of METRICAS_OUSADIA) {
  const porJ = new Map<string, Map<string, number>>()
  for (const [jogoId, doJogo] of porJogo) {
    const o = ousadiaNoJogo(doJogo, m)
    porJ.set(jogoId, o)
    valores.get(m)!.push(...o.values())
  }
  ousadias.set(m, porJ)
}
out('## 1. Distribuição da ousadia por palpite')
out()
out('| Métrica | n | Média | p25 | Mediana | p75 | p90 | Máx | % zeros | Valores distintos |')
out('|---|---|---|---|---|---|---|---|---|---|')
for (const m of METRICAS_OUSADIA) {
  const v = valores.get(m)!
  const media = v.reduce((s, x) => s + x, 0) / v.length
  const zeros = v.filter(x => x === 0).length / v.length
  out(`| ${m} | ${v.length} | ${f(media)} | ${f(quantil(v, 0.25))} | ${f(quantil(v, 0.5))} | ${f(quantil(v, 0.75))} | ${f(quantil(v, 0.9))} | ${f(Math.max(...v))} | ${f(100 * zeros, 1)}% | ${new Set(v.map(x => x.toFixed(6))).size} |`)
}
out()
// Correlação por palpite entre as métricas
out('Spearman entre métricas, por palpite (mesmos palpites):')
out()
for (let i = 0; i < METRICAS_OUSADIA.length; i++)
  for (let j = i + 1; j < METRICAS_OUSADIA.length; j++)
    out(`- ${METRICAS_OUSADIA[i]} × ${METRICAS_OUSADIA[j]}: ${f(spearman(valores.get(METRICAS_OUSADIA[i])!, valores.get(METRICAS_OUSADIA[j])!))}`)
out()

// 2. Rankings
for (const ordem of ['soma', 'media'] as OrdemZebra[]) {
  out(`## 2${ordem === 'soma' ? 'a' : 'b'}. Ranking do Índice de Zebra ordenado por ${ordem === 'soma' ? 'soma (padrão)' : 'média por jogo palpitado'}`)
  out()
  for (const rec of recortes) {
    const rankings = new Map(METRICAS_OUSADIA.map(m => [m, indiceDeZebra(ps, m, ordem).filter(l => rec.ids.has(l.usuarioId))]))
    const ids = rankings.get('media')!.map(l => l.usuarioId)
    const valor = (m: MetricaOusadia) => {
      const mapa = new Map(rankings.get(m)!.map(l => [l.usuarioId, ordem === 'soma' ? l.indice : l.indiceMedio]))
      return ids.map(id => mapa.get(id)!)
    }
    const top10 = (m: MetricaOusadia) => new Set(rankings.get(m)!.slice(0, 10).map(l => l.usuarioId))
    out(`### ${rec.nome} (${ids.length} participantes)`)
    out()
    out('| Par de métricas | Spearman (ranking inteiro) | Do top 10 da 1ª, quantos saem do top 10 da 2ª |')
    out('|---|---|---|')
    for (let i = 0; i < METRICAS_OUSADIA.length; i++)
      for (let j = i + 1; j < METRICAS_OUSADIA.length; j++) {
        const [a, b] = [METRICAS_OUSADIA[i], METRICAS_OUSADIA[j]]
        const tb = top10(b)
        const saem = [...top10(a)].filter(id => !tb.has(id)).length
        out(`| ${a} × ${b} | ${f(spearman(valor(a), valor(b)))} | ${saem} |`)
      }
    out()
    out('Top 10 por métrica (pseudônimos):')
    out()
    for (const m of METRICAS_OUSADIA)
      out(`- ${m}: ${rankings.get(m)!.slice(0, 10).map(l => `${l.usuarioId} (${f(ordem === 'soma' ? l.indice : l.indiceMedio, 1)}, ${l.jogosPalpitados} j)`).join(', ')}`)
    out()
  }
}

// Correlação do índice (soma) com o volume de palpites
out('## 2c. Quanto a soma reflete o volume de palpites')
out()
for (const rec of recortes) {
  for (const m of METRICAS_OUSADIA) {
    const r = indiceDeZebra(ps, m, 'soma').filter(l => rec.ids.has(l.usuarioId))
    out(`- ${rec.nome}, ${m}: Spearman(índice soma, jogos palpitados) = ${f(spearman(r.map(l => l.indice), r.map(l => l.jogosPalpitados)))}; Spearman(índice médio, jogos palpitados) = ${f(spearman(r.map(l => l.indiceMedio), r.map(l => l.jogosPalpitados)))}`)
  }
}
out()

// 3. MST agregada
out('## 3. MST do grafo agregado (distância média nos jogos em comum)')
out()
out('| Recorte | Mín. jogos em comum | Vértices | Pares no grafo | Arestas da MST | Componentes | Peso total | Peso médio por aresta | Tempo (ms) |')
out('|---|---|---|---|---|---|---|---|---|')
for (const rec of recortes) {
  const grupos = [...porJogo.values()].map(g => g.filter(p => rec.ids.has(p.usuarioId)))
  const agregado = distanciaMediaAgregada(grupos)
  const vertices = [...rec.ids].sort()
  for (const minimo of [1, 3, 5, 10]) {
    const inicio = Date.now()
    const pares = agregado.filter(a => a.jogosEmComum >= minimo)
    const mst = mstKruskal(vertices, pares)
    const ms = Date.now() - inicio
    out(`| ${rec.nome} | ${minimo} | ${vertices.length} | ${pares.length} | ${mst.arestas.length} | ${mst.componentes} | ${f(mst.pesoTotal, 2)} | ${f(mst.pesoTotal / Math.max(1, mst.arestas.length))} | ${ms} |`)
  }
}
out()

const saida = path.join(path.dirname(new URL(import.meta.url).pathname), 'resultados')
mkdirSync(saida, { recursive: true })
writeFileSync(path.join(saida, 'zebra.md'), linhas.join('\n') + '\n')
