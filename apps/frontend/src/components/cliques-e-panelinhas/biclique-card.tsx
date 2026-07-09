import { useMemo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Biclique, CliqueJogo, CliqueUsuario } from '@/types/cliques-e-panelinhas'

const VIEWBOX_WIDTH = 960
const VIEWBOX_HEIGHT = 520
const USER_CENTER_X = 290
const GAME_CENTER_X = 670
const CENTER_Y = 260

type Point = { x: number; y: number }

export interface BicliqueCardData {
  indice: number
  biclique: Biclique
  usuarios: CliqueUsuario[]
  jogos: CliqueJogo[]
}

interface BicliqueCardProps extends BicliqueCardData {
  selecionado: boolean
  onSelecionar: () => void
}

function getIniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(parte => parte[0])
    .join('')
    .toUpperCase()
}

function getNomeJogo(jogo: CliqueJogo) {
  const casa = jogo.timeCasa ?? 'Casa'
  const visitante = jogo.timeVisitante ?? 'Visitante'
  return `${casa} x ${visitante}`
}

function distribuirEmArco(
  total: number,
  centroX: number,
  centroY: number,
  raioX: number,
  raioY: number,
  inicioGraus: number,
  fimGraus: number
) {
  if (total === 0) return [] as Point[]

  if (total === 1) {
    return [{ x: centroX, y: centroY }]
  }

  const pontos: Point[] = []
  const passo = (fimGraus - inicioGraus) / (total - 1)

  for (let indice = 0; indice < total; indice++) {
    const angulo = ((inicioGraus + passo * indice) * Math.PI) / 180
    const variacao = (indice % 2 === 0 ? 1 : -1) * Math.min(8, total)
    pontos.push({
      x: centroX + Math.cos(angulo) * (raioX + variacao * 0.15),
      y: centroY + Math.sin(angulo) * (raioY + variacao * 0.12),
    })
  }

  return pontos
}

function convexHull(points: Point[]) {
  if (points.length <= 2) return points

  const ordenados = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x))
  const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)

  const lower: Point[] = []
  for (const point of ordenados) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop()
    }
    lower.push(point)
  }

  const upper: Point[] = []
  for (let indice = ordenados.length - 1; indice >= 0; indice--) {
    const point = ordenados[indice]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop()
    }
    upper.push(point)
  }

  lower.pop()
  upper.pop()

  return [...lower, ...upper]
}

function pathBlob(points: Point[]) {
  if (points.length === 0) return ''
  if (points.length === 1) {
    const point = points[0]
    return `M ${point.x - 36} ${point.y} a 36 36 0 1 0 72 0 a 36 36 0 1 0 -72 0`
  }
  if (points.length === 2) {
    const [a, b] = points
    const raio = 42
    return [
      `M ${a.x} ${a.y - raio}`,
      `Q ${b.x} ${a.y - raio} ${b.x} ${a.y}`,
      `Q ${b.x} ${a.y + raio} ${a.x} ${a.y + raio}`,
      `Q ${a.x} ${a.y + raio} ${a.x} ${a.y}`,
      'Z',
    ].join(' ')
  }

  const hull = convexHull(points)
  if (hull.length === 0) return ''

  const midPoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
  const inicio = midPoint(hull[hull.length - 1], hull[0])
  let d = `M ${inicio.x} ${inicio.y}`

  for (let indice = 0; indice < hull.length; indice++) {
    const atual = hull[indice]
    const proximo = hull[(indice + 1) % hull.length]
    const meio = midPoint(atual, proximo)
    d += ` Q ${atual.x} ${atual.y} ${meio.x} ${meio.y}`
  }

  return `${d} Z`
}

function formatarListaCompacta(itens: string[], limite: number) {
  const exibidos = itens.slice(0, limite)
  const restante = itens.length - exibidos.length
  return restante > 0 ? [...exibidos, `+${restante}`] : exibidos
}

export function BicliqueCard({ indice, biclique, usuarios, jogos, selecionado, onSelecionar }: BicliqueCardProps) {
  const usuariosBiclique = useMemo(() => biclique[0].map(posicao => usuarios[posicao]).filter(Boolean), [biclique, usuarios])
  const jogosBiclique = useMemo(() => biclique[1].map(posicao => jogos[posicao]).filter(Boolean), [biclique, jogos])

  const usuariosLabel = usuariosBiclique.map(usuario => usuario.nome)
  const jogosLabel = jogosBiclique.map(getNomeJogo)
  const arestas = usuariosBiclique.length * jogosBiclique.length

  const pontosUsuarios = useMemo(
    () => distribuirEmArco(usuariosBiclique.length, USER_CENTER_X, CENTER_Y, 190, 122, 210, 330),
    [usuariosBiclique.length]
  )
  const pontosJogos = useMemo(
    () => distribuirEmArco(jogosBiclique.length, GAME_CENTER_X, CENTER_Y, 190, 122, -30, 90),
    [jogosBiclique.length]
  )

  const todosPontos = [...pontosUsuarios, ...pontosJogos]
  const blobPath = useMemo(() => pathBlob(todosPontos), [todosPontos])

  const grade = indice % 3
  const tema =
    grade === 0
      ? { sombra: 'rgba(251, 191, 36, 0.25)', fill: 'rgba(251, 191, 36, 0.12)', stroke: 'rgba(251, 191, 36, 0.5)' }
      : grade === 1
        ? { sombra: 'rgba(56, 189, 248, 0.22)', fill: 'rgba(56, 189, 248, 0.1)', stroke: 'rgba(56, 189, 248, 0.42)' }
        : { sombra: 'rgba(244, 63, 94, 0.2)', fill: 'rgba(244, 63, 94, 0.1)', stroke: 'rgba(244, 63, 94, 0.42)' }

  const maxLinhas = usuariosBiclique.length * jogosBiclique.length <= 42 ? usuariosBiclique.length * jogosBiclique.length : 30
  const linhasVisiveis = useMemo(() => {
    const linhas: Array<{ a: Point; b: Point }> = []

    if (usuariosBiclique.length === 0 || jogosBiclique.length === 0) {
      return linhas
    }

    if (usuariosBiclique.length * jogosBiclique.length <= 42) {
      for (let ui = 0; ui < usuariosBiclique.length; ui++) {
        for (let ji = 0; ji < jogosBiclique.length; ji++) {
          linhas.push({ a: pontosUsuarios[ui], b: pontosJogos[ji] })
        }
      }
      return linhas
    }

    const primeiroUsuario = pontosUsuarios[0]
    const primeiroJogo = pontosJogos[0]

    for (const ponto of pontosJogos) {
      linhas.push({ a: primeiroUsuario, b: ponto })
    }

    for (const ponto of pontosUsuarios) {
      linhas.push({ a: ponto, b: primeiroJogo })
    }

    return linhas.slice(0, maxLinhas)
  }, [jogosBiclique.length, maxLinhas, pontosJogos, pontosUsuarios, usuariosBiclique.length])

  return (
    <button
      type="button"
      onClick={onSelecionar}
      className={cn(
        'group w-full rounded-2xl border p-4 text-left transition-all duration-300',
        selecionado
          ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/10'
          : 'border-border bg-card hover:border-primary/20 hover:bg-muted/20'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Top {indice + 1}</p>
          <h3 className="mt-1 text-lg font-semibold">Biclique maximal #{indice + 1}</h3>
          <p className="text-sm text-muted-foreground">
            {usuariosBiclique.length} usuários, {jogosBiclique.length} jogos, {arestas} arestas implícitas
          </p>
        </div>

        <Badge variant={selecionado ? 'default' : 'outline'} className="shrink-0 rounded-full">
          {usuariosBiclique.length} x {jogosBiclique.length}
        </Badge>
      </div>

      <div
        className="relative mt-4 overflow-hidden rounded-2xl border border-border/70"
        style={{ background: `linear-gradient(135deg, ${tema.fill}, transparent 65%)` }}
      >
        <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id={`clique-gradient-${indice}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={tema.stroke} stopOpacity="0.9" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" stopOpacity="0.1" />
            </linearGradient>
            <filter id={`clique-shadow-${indice}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="14" result="blur" />
              <feOffset dy="6" result="offsetBlur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.45" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {linhasVisiveis.map((linha, indiceLinha) => (
            <line
              key={indiceLinha}
              x1={linha.a.x}
              y1={linha.a.y}
              x2={linha.b.x}
              y2={linha.b.y}
              stroke={tema.stroke}
              strokeOpacity={0.13}
              strokeWidth={2}
            />
          ))}

          <path
            d={blobPath}
            fill={`url(#clique-gradient-${indice})`}
            stroke={tema.stroke}
            strokeWidth={2}
            filter={`url(#clique-shadow-${indice})`}
          />
        </svg>

        <div className="relative min-h-[320px] px-5 py-6">
          <div className="absolute left-5 top-4 rounded-full border border-border bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur-sm">
            Clique com {usuariosBiclique.length} palpiteiros e {jogosBiclique.length} jogos
          </div>

          {pontosUsuarios.map((ponto, indiceUsuario) => {
            const usuario = usuariosBiclique[indiceUsuario]
            if (!usuario) return null

            return (
              <div
                key={usuario.id}
                className="absolute flex flex-col items-center gap-1"
                style={{ left: `${(ponto.x / VIEWBOX_WIDTH) * 100}%`, top: `${(ponto.y / VIEWBOX_HEIGHT) * 100}%`, transform: 'translate(-50%, -50%)' }}
                title={usuario.nome}
              >
                <Avatar className="h-12 w-12 border-2 border-background shadow-md shadow-black/10">
                  <AvatarImage src={usuario.avatarUrl ?? undefined} alt={usuario.nome} />
                  <AvatarFallback className="text-[11px] font-semibold">{getIniciais(usuario.nome)}</AvatarFallback>
                </Avatar>
                <span className="max-w-[92px] truncate rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium text-foreground/80 backdrop-blur-sm">
                  {usuario.nome}
                </span>
              </div>
            )
          })}

          {pontosJogos.map((ponto, indiceJogo) => {
            const jogo = jogosBiclique[indiceJogo]
            if (!jogo) return null

            return (
              <div
                key={jogo.id}
                className="absolute flex flex-col items-center gap-1"
                style={{ left: `${(ponto.x / VIEWBOX_WIDTH) * 100}%`, top: `${(ponto.y / VIEWBOX_HEIGHT) * 100}%`, transform: 'translate(-50%, -50%)' }}
                title={getNomeJogo(jogo)}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-primary/70 bg-background/70 shadow-sm shadow-black/10">
                  <div className="h-2.5 w-2.5 rounded-full border border-primary/70" />
                </div>
                <span className="max-w-[108px] truncate rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur-sm">
                  {getNomeJogo(jogo)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {formatarListaCompacta(usuariosLabel, 4).map((nome, indiceNome) => (
          <span
            key={`${nome}-${indiceNome}`}
            className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
          >
            {nome}
          </span>
        ))}
        {formatarListaCompacta(jogosLabel, 3).map((nome, indiceNome) => (
          <span
            key={`${nome}-${indiceNome}`}
            className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
          >
            {nome}
          </span>
        ))}
      </div>
    </button>
  )
}