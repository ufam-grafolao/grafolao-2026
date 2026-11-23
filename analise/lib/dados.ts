// Leitura dos CSVs anonimizados de data/ (pseudônimos user1…N).
// Só estes arquivos alimentam as análises: nada aqui fala com banco de dados.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const DIR_DADOS = path.join(RAIZ, 'data')

// Os CSVs exportados não têm aspas nem vírgulas dentro de campos (conferido com grep),
// então basta separar por vírgula. Se isso mudar, o número de colunas acusa o erro.
function lerCsv(arquivo: string): Record<string, string>[] {
  const texto = readFileSync(path.join(DIR_DADOS, arquivo), 'utf8').trim()
  const [cabecalho, ...linhas] = texto.split('\n')
  const colunas = cabecalho.split(',')
  return linhas.map((linha, i) => {
    const valores = linha.split(',')
    if (valores.length !== colunas.length) {
      throw new Error(`${arquivo}, linha ${i + 2}: ${valores.length} colunas, esperado ${colunas.length}`)
    }
    return Object.fromEntries(colunas.map((c, j) => [c, valores[j]]))
  })
}

export interface Usuario { id: string; criadoEm: Date }
export interface Jogo {
  id: string; fase: string; rodada: string; dataHora: Date; status: string
  golsCasa: number | null; golsVisitante: number | null
}
export interface Palpite {
  id: string; usuarioId: string; jogoId: string
  golsCasa: number; golsVisitante: number; pontos: number; status: string; criadoEm: Date
}
export interface Confronto { jogoId: string; vencedorId: string; perdedorId: string }

const numeroOuNulo = (v: string) => (v === '' ? null : Number(v))

export function carregarDados() {
  const usuarios: Usuario[] = lerCsv('usuarios_anonimizados.csv').map(l => ({
    id: l.usuarioId, criadoEm: new Date(l.criadoEm),
  }))
  const jogos: Jogo[] = lerCsv('jogos.csv').map(l => ({
    id: l.jogoId, fase: l.fase, rodada: l.rodada, dataHora: new Date(l.dataHora), status: l.status,
    golsCasa: numeroOuNulo(l.golsCasa), golsVisitante: numeroOuNulo(l.golsVisitante),
  }))
  const palpites: Palpite[] = lerCsv('palpites_anonimizados.csv').map(l => ({
    id: l.palpiteId, usuarioId: l.usuarioId, jogoId: l.jogoId,
    golsCasa: Number(l.golsCasa), golsVisitante: Number(l.golsVisitante),
    pontos: Number(l.pontos), status: l.status, criadoEm: new Date(l.criadoEm),
  }))
  const confrontos: Confronto[] = lerCsv('confrontos_anonimizados.csv').map(l => ({
    jogoId: l.jogoId, vencedorId: l.vencedorId, perdedorId: l.perdedorId,
  }))
  return { usuarios, jogos, palpites, confrontos }
}

export const pct = (x: number, casas = 2) => `${(100 * x).toFixed(casas).replace('.', ',')}%`
export const densidade = (v: number, e: number) => (v < 2 ? 0 : e / (v * (v - 1)))
