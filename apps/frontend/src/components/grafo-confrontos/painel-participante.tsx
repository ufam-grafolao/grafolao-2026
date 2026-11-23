import { useMemo, useState } from 'react'
import { LocateFixed, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ArestaGrafo, NoGrafo } from '@/types/grafo-confrontos'

const TOP = 5

function Avatar({ no, grande = false }: { no: NoGrafo; grande?: boolean }) {
  const [erro, setErro] = useState(false)
  const tamanho = grande ? 'size-12 text-base' : 'size-8 text-[13px]'
  if (no.avatarUrl && !erro) {
    return <img src={no.avatarUrl} alt="" className={`${tamanho} shrink-0 rounded-full object-cover`} onError={() => setErro(true)} />
  }
  return (
    <span
      aria-hidden
      className={`${tamanho} grid shrink-0 place-items-center rounded-full font-semibold ${
        no.posicao <= TOP ? 'bg-gold text-gold-foreground' : 'bg-secondary text-secondary-foreground'
      }`}
    >
      {no.nome.charAt(0).toUpperCase()}
    </span>
  )
}

/** Vitórias (arestas que saem) e derrotas (arestas que chegam), só com o que a API já devolveu. */
function relacoesDoNo(noId: string, arestas: ArestaGrafo[], nos: NoGrafo[]) {
  const porId = new Map(nos.map((n) => [n.id, n]))
  const vitorias = arestas
    .filter((a) => a.origem === noId)
    .map((a) => ({ no: porId.get(a.destino), id: a.destino, peso: a.peso }))
    .sort((a, b) => b.peso - a.peso)
  const derrotas = arestas
    .filter((a) => a.destino === noId)
    .map((a) => ({ no: porId.get(a.origem), id: a.origem, peso: a.peso }))
    .sort((a, b) => b.peso - a.peso)
  return { vitorias, derrotas }
}

const formatarPR = (v: number) => v.toFixed(4).replace('.', ',')

// ─── Top 5 (estado sem seleção)
export function ListaTop({ nos, onSelecionar }: { nos: NoGrafo[]; onSelecionar: (no: NoGrafo) => void }) {
  const top = nos.slice(0, TOP)
  const maior = top[0]?.pageRank ?? 1
  return (
    <div className="flex flex-col">
      <h2 className="font-display text-2xl font-bold leading-tight">Top 5 do PageRank</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Quem acumula vitórias sobre quem também vence muito. Toque num nome para ver os confrontos.
      </p>
      <ol className="mt-4 flex flex-col">
        {top.map((no) => (
          <li key={no.id}>
            <button
              type="button"
              onClick={() => onSelecionar(no)}
              aria-label={`${no.posicao}º, ${no.nome}, PageRank ${formatarPR(no.pageRank)}`}
              className="group grid min-h-14 w-full grid-cols-[2rem_1fr_auto] items-center gap-x-3 rounded-md px-2 text-left transition-[background-color] duration-150 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="font-display text-[1.75rem] font-bold leading-none tabular-nums">{no.posicao}</span>
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-medium">{no.nome}</span>
                <span className="mt-1.5 block h-1 rounded-full bg-secondary" aria-hidden>
                  <span className="block h-1 rounded-full bg-gold" style={{ width: `${(no.pageRank / maior) * 100}%` }} />
                </span>
              </span>
              <span className="text-sm tabular-nums text-muted-foreground">{formatarPR(no.pageRank)}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

type Relacao = { no: NoGrafo | undefined; id: string; peso: number }

function ListaRelacoes({
  titulo,
  itens,
  sinal,
  cor,
  onSelecionar,
}: {
  titulo: string
  itens: Relacao[]
  sinal: '+' | '−'
  cor: string
  onSelecionar: (no: NoGrafo) => void
}) {
  return (
    <section>
      <h3 className="sticky top-0 z-[1] flex items-center gap-2 bg-card py-2 text-sm font-semibold">
        <span className={`h-0.5 w-3.5 rounded-full ${cor}`} aria-hidden />
        {titulo} <span className="font-normal tabular-nums text-muted-foreground">({itens.length})</span>
      </h3>
      {itens.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nenhum confronto neste recorte.</p>
      ) : (
        <ul>
          {itens.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={!item.no}
                onClick={() => item.no && onSelecionar(item.no)}
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-2 text-left text-sm transition-[background-color] duration-150 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
              >
                <span className="truncate">{item.no?.nome ?? item.id}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {sinal}
                  {item.peso}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ─── Detalhe do participante selecionado
interface DetalheProps {
  no: NoGrafo
  nos: NoGrafo[]
  arestas: ArestaGrafo[]
  onSelecionar: (no: NoGrafo | null) => void
  onCentralizar: (id: string) => void
  /** No celular a gaveta tem o próprio botão de fechar */
  mostrarFechar?: boolean
}

export function DetalheParticipante({ no, nos, arestas, onSelecionar, onCentralizar, mostrarFechar = true }: DetalheProps) {
  const { vitorias, derrotas } = useMemo(() => relacoesDoNo(no.id, arestas, nos), [no.id, arestas, nos])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start gap-3">
        <Avatar no={no} grande />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-[1.75rem] font-bold leading-none">{no.nome}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            <span className="tabular-nums">{no.posicao}º</span> no PageRank ·{' '}
            <span className="tabular-nums">{formatarPR(no.pageRank)}</span>
          </p>
        </div>
        {mostrarFechar && (
          <button
            type="button"
            onClick={() => onSelecionar(null)}
            className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            aria-label="Fechar detalhes e voltar ao Top 5"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-background px-3 py-2.5">
          <dt className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <span className="h-0.5 w-3 rounded-full bg-vitoria" aria-hidden /> Vitórias
          </dt>
          <dd className="font-display text-3xl font-bold leading-none tabular-nums">{vitorias.length}</dd>
        </div>
        <div className="rounded-md bg-background px-3 py-2.5">
          <dt className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <span className="h-0.5 w-3 rounded-full bg-derrota" aria-hidden /> Derrotas
          </dt>
          <dd className="font-display text-3xl font-bold leading-none tabular-nums">{derrotas.length}</dd>
        </div>
      </dl>
      <p className="mt-2 text-[13px] text-muted-foreground">O número ao lado de cada nome é o saldo de confrontos diretos.</p>

      <div className="-mx-2 mt-2 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-2" tabIndex={0} aria-label="Confrontos do participante">
        <ListaRelacoes titulo="Venceu" itens={vitorias} sinal="+" cor="bg-vitoria" onSelecionar={onSelecionar} />
        <ListaRelacoes titulo="Perdeu para" itens={derrotas} sinal="−" cor="bg-derrota" onSelecionar={onSelecionar} />
      </div>

      <div className="mt-4 flex gap-2 border-t border-border pt-4">
        <Button variant="outline" className="h-11 flex-1 border-input" onClick={() => onCentralizar(no.id)}>
          <LocateFixed aria-hidden /> Centralizar no grafo
        </Button>
      </div>
    </div>
  )
}
