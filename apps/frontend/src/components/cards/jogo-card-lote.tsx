import { Input } from "@/components/ui/input"
import { getBandeira } from "@/lib/bandeiras"
import { getNomePt } from "@/lib/nomes-times"
import { formatarHoraJogo } from "@/lib/utils"
import { getRodada } from "@/lib/rodada"
import type { Jogo } from "@/types/jogo"
import type { PalpiteExistente } from "@/types/palpites"

export interface RascunhoLote {
  jogoId: string
  golsCasa: number | null
  golsVisitante: number | null
}

interface JogoCardLoteProps {
  jogo: Jogo
  rascunho: RascunhoLote
  palpiteExistente?: PalpiteExistente
  onChange: (jogoId: string, campo: "golsCasa" | "golsVisitante", valor: number | null) => void
}

export default function JogoCardLote({ jogo, rascunho, palpiteExistente, onChange }: JogoCardLoteProps) {
  const nomeOriginalCasa      = jogo.timeCasa?.nome      ?? jogo.timeCasaRef      ?? "?"
  const nomeOriginalVisitante = jogo.timeVisitante?.nome ?? jogo.timeVisitanteRef ?? "?"
  const nomeCasa      = getNomePt(nomeOriginalCasa)
  const nomeVisitante = getNomePt(nomeOriginalVisitante)
  const codigoCasa      = getBandeira(nomeOriginalCasa)
  const codigoVisitante = getBandeira(nomeOriginalVisitante)

  const temRascunho = rascunho.golsCasa !== null && rascunho.golsVisitante !== null

  function handleInput(campo: "golsCasa" | "golsVisitante", val: string) {
    if (val === "") { onChange(jogo.id, campo, null); return }
    const n = parseInt(val, 10)
    if (!isNaN(n) && n >= 0 && n <= 20) onChange(jogo.id, campo, n)
  }

  return (
    <div className={`rounded-xl border bg-card p-3 flex flex-col gap-3 transition-colors ${temRascunho ? "border-primary/60" : ""}`}>
      {/* Cabeçalho mini */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{jogo.grupo ?? jogo.fase}, {getRodada(jogo.fase, jogo.rodada)}</span>
        <span className="font-semibold text-foreground">{formatarHoraJogo(jogo.dataHora)}</span>
      </div>

      {/* Times + inputs */}
      <div className="flex items-center gap-2">
        {/* Time casa */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          {codigoCasa && <span className={`fi fi-${codigoCasa} text-2xl`} />}
          <span className="text-xs text-center font-medium line-clamp-1">{nomeCasa}</span>
        </div>

        {/* Inputs */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Input
            type="number"
            min={0}
            max={20}
            className="w-12 h-9 text-center text-base font-bold px-1"
            value={rascunho.golsCasa ?? ""}
            placeholder={palpiteExistente ? String(palpiteExistente.golsCasa) : "–"}
            onChange={(e) => handleInput("golsCasa", e.target.value)}
          />
          <span className="text-muted-foreground font-bold">×</span>
          <Input
            type="number"
            min={0}
            max={20}
            className="w-12 h-9 text-center text-base font-bold px-1"
            value={rascunho.golsVisitante ?? ""}
            placeholder={palpiteExistente ? String(palpiteExistente.golsVisitante) : "–"}
            onChange={(e) => handleInput("golsVisitante", e.target.value)}
          />
        </div>

        {/* Time visitante */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          {codigoVisitante && <span className={`fi fi-${codigoVisitante} text-2xl`} />}
          <span className="text-xs text-center font-medium line-clamp-1">{nomeVisitante}</span>
        </div>
      </div>

      {/* Palpite anterior (se existir) */}
      {palpiteExistente && (
        <p className="text-[11px] text-muted-foreground text-center">
          Atual: {palpiteExistente.golsCasa}–{palpiteExistente.golsVisitante}
          {" · "}edições restantes: {2 - palpiteExistente.totalEdicoes}
        </p>
      )}
    </div>
  )
}