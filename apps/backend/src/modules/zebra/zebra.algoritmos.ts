// Proposta 3 — Aventura da Zebra. Funções puras (sem Prisma).
//
// Ideia: num jogo, quem palpitou longe da maioria foi "ousado". O Índice de Zebra
// premia ousadia que deu certo: soma, nos jogos, de ousadia × pontos do jogo.
// A MST (árvore geradora mínima) do grafo de distâncias mostra como os palpites se
// agrupam: arestas de peso 0 ligam placares iguais, 0,5 resultados iguais e 1 liga
// grupos de resultados diferentes.

import {
  distanciasAosDemais,
  grafoCompletoDoJogo,
  resultadoDoPlacar,
  type PalpiteComPlacar,
  type ParDistancia,
} from '../../shared/similaridade/similaridade-palpites.js'

// ─── MST (Kruskal) com desempate determinístico ──────────────────────────────
//
// As distâncias só têm 3 valores (0; 0,5; 1), então há muitas MSTs com o mesmo peso
// total. Para a resposta ser sempre a mesma, as arestas são ordenadas por
//   (peso, menor id do par, maior id do par)
// e o Kruskal escolhe a primeira que não fecha ciclo. O PESO TOTAL é o mesmo para
// qualquer desempate; só a escolha das arestas muda. Em grafo desconexo o resultado
// é uma floresta geradora mínima (uma árvore por componente).

export interface ResultadoMst {
  arestas: ParDistancia[]
  pesoTotal: number
  componentes: number
}

export function mstKruskal(vertices: string[], arestas: ParDistancia[]): ResultadoMst {
  const pai = new Map(vertices.map(v => [v, v]))
  const raiz = (v: string): string => {
    let r = v
    while (pai.get(r) !== r) r = pai.get(r)!
    let x = v
    while (pai.get(x) !== r) { const prox = pai.get(x)!; pai.set(x, r); x = prox }
    return r
  }

  const normalizar = (e: ParDistancia): ParDistancia => (e.a <= e.b ? e : { a: e.b, b: e.a, peso: e.peso })
  const ordenadas = arestas
    .map(normalizar)
    .filter(e => e.a !== e.b && pai.has(e.a) && pai.has(e.b))
    .sort((x, y) => x.peso - y.peso || x.a.localeCompare(y.a) || x.b.localeCompare(y.b))

  const escolhidas: ParDistancia[] = []
  let componentes = vertices.length
  for (const e of ordenadas) {
    const ra = raiz(e.a)
    const rb = raiz(e.b)
    if (ra === rb) continue
    pai.set(ra, rb)
    escolhidas.push(e)
    componentes--
    if (componentes === 1) break
  }

  return { arestas: escolhidas, pesoTotal: escolhidas.reduce((s, e) => s + e.peso, 0), componentes }
}

export function mstDoJogo(palpites: PalpiteComPlacar[]): ResultadoMst {
  return mstKruskal(palpites.map(p => p.usuarioId), grafoCompletoDoJogo(palpites))
}

// ─── Ousadia por jogo ─────────────────────────────────────────────────────────
//
//   media     (padrão) média das distâncias do participante aos demais palpiteiros.
//   mediana   mediana dessas distâncias.
//   raridade  −ln(fração de palpiteiros que deu o mesmo resultado, incluindo ele).
//             Não usa o placar, só o resultado; vai de 0 (todos iguais) a ln(n).
// Com um único palpiteiro não há com quem comparar: ousadia 0 nas três.

export type MetricaOusadia = 'media' | 'mediana' | 'raridade'
export const METRICAS_OUSADIA: MetricaOusadia[] = ['media', 'mediana', 'raridade']

function mediana(valores: number[]): number {
  if (valores.length === 0) return 0
  const v = [...valores].sort((a, b) => a - b)
  const meio = Math.floor(v.length / 2)
  return v.length % 2 === 1 ? v[meio] : (v[meio - 1] + v[meio]) / 2
}

export function ousadiaNoJogo(
  palpites: PalpiteComPlacar[],
  metrica: MetricaOusadia = 'media'
): Map<string, number> {
  const resultado = new Map<string, number>()
  if (palpites.length <= 1) {
    for (const p of palpites) resultado.set(p.usuarioId, 0)
    return resultado
  }

  if (metrica === 'raridade') {
    const contagem = new Map<string, number>()
    for (const p of palpites) {
      const r = resultadoDoPlacar(p)
      contagem.set(r, (contagem.get(r) ?? 0) + 1)
    }
    for (const p of palpites) {
      const fracao = contagem.get(resultadoDoPlacar(p))! / palpites.length
      resultado.set(p.usuarioId, fracao === 1 ? 0 : -Math.log(fracao))
    }
    return resultado
  }

  for (const [id, distancias] of distanciasAosDemais(palpites)) {
    resultado.set(
      id,
      metrica === 'media' ? distancias.reduce((s, d) => s + d, 0) / distancias.length : mediana(distancias)
    )
  }
  return resultado
}

// ─── Índice de Zebra ──────────────────────────────────────────────────────────
//
//   indice      = Σ_jogos ousadia × pontos           (soma, NÃO normalizada)
//   indiceMedio = indice / jogos palpitados           (média por jogo palpitado)
// As duas saem na resposta. A ordenação padrão é pela MÉDIA: nos CSVs de 2026-08-14
// a soma acompanha quase só o volume (Spearman ≈ 0,92–0,95 com jogos palpitados,
// analise/resultados/zebra.md), ou seja, mede quem palpitou mais, não quem foi zebra.
// A média tem o problema oposto (um único acerto ousado domina), por isso o ranking
// usa minPalpites (padrão 10 na rota). Jogos com um só palpiteiro contribuem 0.

export interface PalpiteJogo extends PalpiteComPlacar {
  jogoId: string
  pontos: number
}

export interface LinhaZebra {
  usuarioId: string
  indice: number
  indiceMedio: number
  jogosPalpitados: number
  /** Jogos em que pontuou com ousadia > 0 (acertos "contra a maré"). */
  acertosOusados: number
}

export type OrdemZebra = 'soma' | 'media'

export function indiceDeZebra(
  palpites: PalpiteJogo[],
  metrica: MetricaOusadia = 'media',
  ordem: OrdemZebra = 'media'
): LinhaZebra[] {
  const porJogo = new Map<string, PalpiteJogo[]>()
  for (const p of palpites) porJogo.set(p.jogoId, [...(porJogo.get(p.jogoId) ?? []), p])

  const linhas = new Map<string, LinhaZebra>()
  for (const doJogo of porJogo.values()) {
    const ousadia = ousadiaNoJogo(doJogo, metrica)
    for (const p of doJogo) {
      const linha = linhas.get(p.usuarioId) ?? {
        usuarioId: p.usuarioId, indice: 0, indiceMedio: 0, jogosPalpitados: 0, acertosOusados: 0,
      }
      const o = ousadia.get(p.usuarioId) ?? 0
      linha.indice += o * p.pontos
      linha.jogosPalpitados += 1
      if (o > 0 && p.pontos > 0) linha.acertosOusados += 1
      linhas.set(p.usuarioId, linha)
    }
  }

  const resultado = [...linhas.values()].map(l => ({ ...l, indiceMedio: l.indice / l.jogosPalpitados }))
  const chave = (l: LinhaZebra) => (ordem === 'soma' ? l.indice : l.indiceMedio)
  return resultado.sort((x, y) => chave(y) - chave(x) || x.usuarioId.localeCompare(y.usuarioId))
}

/** Palpites que pontuaram, do mais ousado para o menos (desempate: mais pontos, depois id). */
export function ousadosQueAcertaram(
  palpites: (PalpiteComPlacar & { pontos: number })[],
  metrica: MetricaOusadia = 'media',
  limite = 10
): { usuarioId: string; ousadia: number; pontos: number }[] {
  const ousadia = ousadiaNoJogo(palpites, metrica)
  return palpites
    .filter(p => p.pontos > 0)
    .map(p => ({ usuarioId: p.usuarioId, ousadia: ousadia.get(p.usuarioId) ?? 0, pontos: p.pontos }))
    .sort((x, y) => y.ousadia - x.ousadia || y.pontos - x.pontos || x.usuarioId.localeCompare(y.usuarioId))
    .slice(0, limite)
}

// ─── Utilitários estatísticos (análise de sensibilidade) ─────────────────────

/** Postos com empates pela média (1 = maior valor). */
export function postosMedios(valores: number[]): number[] {
  const indices = valores.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0])
  const postos = new Array<number>(valores.length)
  for (let i = 0; i < indices.length; ) {
    let j = i
    while (j + 1 < indices.length && indices[j + 1][0] === indices[i][0]) j++
    const medio = (i + j) / 2 + 1
    for (let k = i; k <= j; k++) postos[indices[k][1]] = medio
    i = j + 1
  }
  return postos
}

/** Correlação de Spearman (Pearson sobre os postos médios). */
export function spearman(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return NaN
  const rx = postosMedios(x)
  const ry = postosMedios(y)
  const media = (v: number[]) => v.reduce((s, a) => s + a, 0) / v.length
  const mx = media(rx)
  const my = media(ry)
  let num = 0, dx = 0, dy = 0
  for (let i = 0; i < rx.length; i++) {
    num += (rx[i] - mx) * (ry[i] - my)
    dx += (rx[i] - mx) ** 2
    dy += (ry[i] - my) ** 2
  }
  return dx === 0 || dy === 0 ? NaN : num / Math.sqrt(dx * dy)
}
