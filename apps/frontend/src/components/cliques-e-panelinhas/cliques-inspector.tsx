import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BicliqueCardData } from './biclique-card'

function getIniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(parte => parte[0])
    .join('')
    .toUpperCase()
}

function getNomeJogo(timeCasa?: string | null, timeVisitante?: string | null, fallback?: string) {
  if (timeCasa || timeVisitante) {
    return `${timeCasa ?? 'Casa'} x ${timeVisitante ?? 'Visitante'}`
  }
  return fallback ?? 'Jogo sem nome'
}

interface CliquesInspectorProps {
  bicliqueSelecionada: BicliqueCardData | null
  bicliques: BicliqueCardData[]
  onSelecionar: (indice: number) => void
}

export function CliquesInspector({ bicliqueSelecionada, bicliques, onSelecionar }: CliquesInspectorProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-4 lg:h-[calc(100vh-14rem)] overflow-hidden">
      <div>
        <p className="text-sm font-semibold">Painel da biclique</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Selecione uma das 3 maiores bicliques para ver seus participantes e jogos em detalhe.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {bicliques.map(item => (
          <button
            key={item.indice}
            type="button"
            onClick={() => onSelecionar(item.indice)}
            className={cn(
              'rounded-xl border px-3 py-2 text-left transition-colors',
              bicliqueSelecionada?.indice === item.indice
                ? 'border-primary bg-primary/5'
                : 'border-border bg-background hover:bg-muted/40'
            )}
          >
            <p className="text-[11px] text-muted-foreground">Top {item.indice + 1}</p>
            <p className="mt-1 text-sm font-semibold">{item.usuarios.length} x {item.jogos.length}</p>
          </button>
        ))}
      </div>

      {!bicliqueSelecionada ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground">
          Clique em uma biclique para explorar a composição dela.
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Top {bicliqueSelecionada.indice + 1}</p>
                <h3 className="mt-1 text-lg font-semibold">Biclique maximal #{bicliqueSelecionada.indice + 1}</h3>
              </div>
              <Badge variant="outline" className="rounded-full">
                {bicliqueSelecionada.usuarios.length} usuários · {bicliqueSelecionada.jogos.length} jogos
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Usuários</p>
                <p className="mt-1 font-semibold">{bicliqueSelecionada.usuarios.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Jogos</p>
                <p className="mt-1 font-semibold">{bicliqueSelecionada.jogos.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Arestas implícitas</p>
                <p className="mt-1 font-semibold">{bicliqueSelecionada.usuarios.length * bicliqueSelecionada.jogos.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Partes da tupla</p>
                <p className="mt-1 font-semibold">Usuários + jogos</p>
              </div>
            </div>
          </div>

          <section className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm font-semibold">Usuários participantes</p>
            <div className="mt-3 flex flex-col gap-2">
              {bicliqueSelecionada.usuarios.map(usuario => (
                <div key={usuario.id} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={usuario.avatarUrl ?? undefined} alt={usuario.nome} />
                    <AvatarFallback className="text-[11px] font-semibold">{getIniciais(usuario.nome)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{usuario.nome}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm font-semibold">Jogos participantes</p>
            <div className="mt-3 flex flex-col gap-2">
              {bicliqueSelecionada.jogos.map(jogo => (
                <div key={jogo.id} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-primary/60 bg-primary/5 text-[10px] font-semibold text-primary shrink-0">
                    J
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {getNomeJogo(jogo.timeCasa, jogo.timeVisitante, jogo.id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {typeof jogo.golsCasa === 'number' && typeof jogo.golsVisitante === 'number'
                        ? `${jogo.golsCasa} x ${jogo.golsVisitante}`
                        : 'Resultado não informado'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}