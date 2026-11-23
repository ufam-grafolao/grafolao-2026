/**
 * Grafo de Confrontos com e sem a regra da ausência, a partir dos CSVs de data/.
 *
 * Usa as MESMAS funções puras do backend (gerarConfrontosDoJogo,
 * gerarConfrontosDeAusenciaDosJogos, agregarSaldo, detectarCiclos), com a mesma
 * ordem fixa por id do service. |V|, |E| e densidade são os da API sobre os mesmos
 * dados. Os ciclos dependem da ordem dos ids: aqui os ids são pseudônimos (user1…N)
 * e em produção são UUIDs, então a contagem de ciclos pode diferir da API.
 *
 * Duas bases de jogos (ver docs: 53 dos 104 jogos encerrados não têm confrontos
 * gravados na exportação de 2026-08-14):
 *   A. "publicada": só os jogos cujos confrontos estão em confrontos_anonimizados.csv
 *      (a base da tabela do artigo).
 *   B. "completa": os 104 jogos encerrados, com confrontos regerados dos palpites.
 *
 * Uso (na raiz do repositório):
 *   npx tsx analise/confrontos-ausencia.ts
 * Saída: tabela no terminal e analise/resultados/confrontos-ausencia.md
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { carregarDados, densidade, pct } from './lib/dados.js'
import {
  agregarSaldo,
  detectarCiclos,
  gerarConfrontosDeAusenciaDosJogos,
  gerarConfrontosDoJogo,
  type ConfrontoAgregado,
} from '../apps/backend/src/modules/grafo-confrontos/grafo-confrontos.algoritmos.js'

const { usuarios, jogos, palpites, confrontos } = carregarDados()

const encerrados = jogos.filter(j => j.status === 'ENCERRADO')
const palpitesPorJogo = new Map<string, typeof palpites>()
for (const p of palpites) palpitesPorJogo.set(p.jogoId, [...(palpitesPorJogo.get(p.jogoId) ?? []), p])

const gravadosPorJogo = new Map<string, number>()
for (const c of confrontos) gravadosPorJogo.set(c.jogoId, (gravadosPorJogo.get(c.jogoId) ?? 0) + 1)

// Jogo "sem confrontos gravados": tem pares com pontos diferentes, mas zero linhas no CSV.
const semGravacao = encerrados.filter(
  j => (gravadosPorJogo.get(j.id) ?? 0) === 0 && gerarConfrontosDoJogo(palpitesPorJogo.get(j.id) ?? []).length > 0
)
const idsSemGravacao = new Set(semGravacao.map(j => j.id))
const jogosPublicada = encerrados.filter(j => !idsSemGravacao.has(j.id))

const totalPalpites = new Map<string, number>()
for (const p of palpites) totalPalpites.set(p.usuarioId, (totalPalpites.get(p.usuarioId) ?? 0) + 1)

const porId = (a: string, b: string) => a.localeCompare(b)
const ordenarArestas = (arestas: ConfrontoAgregado[]) =>
  arestas.sort((a, b) => porId(a.vencedorId, b.vencedorId) || porId(a.perdedorId, b.perdedorId))

interface Linha { base: string; recorte: string; regra: string; v: number; vComAresta: number; e: number; dens: number; ciclos: number }
const linhas: Linha[] = []

const recortes = [
  { nome: 'Completo', ids: usuarios.map(u => u.id) },
  { nome: 'Núcleo ≥10', ids: usuarios.filter(u => (totalPalpites.get(u.id) ?? 0) >= 10).map(u => u.id) },
]

for (const base of [
  { nome: 'A. publicada', jogos: jogosPublicada, brutos: confrontos },
  { nome: 'B. completa', jogos: encerrados, brutos: encerrados.flatMap(j => gerarConfrontosDoJogo(palpitesPorJogo.get(j.id) ?? [])) },
]) {
  for (const recorte of recortes) {
    const permitido = new Set(recorte.ids)
    const vertices = [...recorte.ids].sort(porId)
    const entre = base.brutos.filter(c => permitido.has(c.vencedorId) && permitido.has(c.perdedorId))
    const ausencia = gerarConfrontosDeAusenciaDosJogos(
      base.jogos,
      palpites.filter(p => permitido.has(p.usuarioId)),
      usuarios.filter(u => permitido.has(u.id))
    )

    for (const [regra, brutos] of [['sem', entre], ['com', [...entre, ...ausencia]]] as const) {
      const arestas = ordenarArestas(agregarSaldo(brutos))
      linhas.push({
        base: base.nome, recorte: recorte.nome, regra,
        v: vertices.length,
        vComAresta: new Set(arestas.flatMap(a => [a.vencedorId, a.perdedorId])).size,
        e: arestas.length,
        dens: densidade(vertices.length, arestas.length),
        ciclos: detectarCiclos(vertices, arestas).length,
      })
    }
  }
}

const milhar = (n: number) => n.toLocaleString('pt-BR')
const tabela = [
  '| Base | Recorte | Regra da ausência | \\|V\\| | V com aresta | \\|E\\| | Densidade | Ciclos (DFS, ordem por id) |',
  '|---|---|---|---|---|---|---|---|',
  ...linhas.map(l =>
    `| ${l.base} | ${l.recorte} | ${l.regra} | ${l.v} | ${l.vComAresta} | ${milhar(l.e)} | ${pct(l.dens)} | ${milhar(l.ciclos)} |`),
].join('\n')

const texto = `# Grafo de Confrontos com e sem a regra da ausência

Fonte: \`data/*.csv\` (exportação de produção de 2026-08-14). Gerado por \`analise/confrontos-ausencia.ts\` em ${new Date().toISOString().slice(0, 10)}.

- Jogos encerrados: ${encerrados.length}. Sem confrontos gravados no CSV: ${semGravacao.length}. Base A usa ${jogosPublicada.length}.
- Densidade = |E| / (|V|·(|V|−1)), com |V| = todos os usuários do recorte (como na API).
- Ciclos: contagem da \`detectarCiclos\` (um ciclo por aresta de retorno da DFS), com vértices e arestas em ordem de id. Não é o total de ciclos simples e muda com a ordem.
- Publicado (coleta de produção de 2026-08-14): completo 197 / 3.235 / 8,38% / 1.228; núcleo 72 / 1.612 / 31,53% / 841.

${tabela}
`
console.log(texto)
const saida = path.join(path.dirname(new URL(import.meta.url).pathname), 'resultados')
mkdirSync(saida, { recursive: true })
writeFileSync(path.join(saida, 'confrontos-ausencia.md'), texto)
