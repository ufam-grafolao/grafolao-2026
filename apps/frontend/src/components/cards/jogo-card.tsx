import { Jogo } from "@/types/jogo";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { getBandeira } from "@/lib/bandeiras";
import { getRodada } from "@/lib/rodada";
import { use, useEffect, useState } from "react";
import { Input } from "../ui/input";
import usePalpitar from "@/hooks/use-palpitar";
import { Loader2 } from "lucide-react";
import { PalpiteExistente } from "@/types/palpites";
import { getNomePt } from "@/lib/nomes-times";
import { formatarDataJogo, formatarHoraJogo } from "@/lib/utils";
import { useToast } from "@/lib/toast";



const statusLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  AGENDADO:     { label: 'Agendado',     variant: 'secondary' },
  EM_ANDAMENTO: { label: 'Ao vivo',      variant: 'destructive' },
  ENCERRADO:    { label: 'Encerrado',    variant: 'outline' },
  BLOQUEADO:    { label: 'Bloqueado',    variant: 'outline' },
}

function getStatusEfetivo(jogo: Jogo): string {
  if (jogo.status === 'ENCERRADO') return 'ENCERRADO'
  if (jogo.status === 'BLOQUEADO') return 'BLOQUEADO'
  if (jogo.status === 'EM_ANDAMENTO') return 'EM_ANDAMENTO'

  const inicioUtcReal = new Date(new Date(jogo.dataHora).getTime() + 4 * 60 * 60 * 1000)
  if (new Date() >= inicioUtcReal) return 'EM_ANDAMENTO'

  return 'AGENDADO'
}

interface JogoCardProps {
    jogo: Jogo;
    mostrarBotaoPalpite?: boolean;
    palpitesExistente?: PalpiteExistente[];
}

export default function JogoCard({ jogo, mostrarBotaoPalpite = false, palpitesExistente }: JogoCardProps) {

    const { toast } = useToast()

    // — navegação
    const navigate = useNavigate()
    const estaNaPaginaJogos = useLocation().pathname === '/jogos'

    // — dados do jogo
    const statusEfetivo = getStatusEfetivo(jogo)
    const status = statusLabel[statusEfetivo]
    const nomeOriginalCasa      = jogo.timeCasa?.nome      ?? jogo.timeCasaRef      ?? '?'
    const nomeOriginalVisitante = jogo.timeVisitante?.nome ?? jogo.timeVisitanteRef ?? '?'

    const nomeCasa      = getNomePt(nomeOriginalCasa)
    const nomeVisitante = getNomePt(nomeOriginalVisitante)

    const codigoCasa      = getBandeira(nomeOriginalCasa)
    const codigoVisitante = getBandeira(nomeOriginalVisitante)

    // — palpite
    const { mutate: salvaPalpite, isPending } = usePalpitar()
    const palpiteExistente = palpitesExistente?.find(p => p.jogo.id === jogo.id)
    const edicoesRestantes = 2 - (palpiteExistente?.totalEdicoes ?? 0)
    const podeEditar = edicoesRestantes > 0

    // — estado local
    const [golsCasa, setGolsCasa] = useState<number | null>(null)
    const [golsVisitante, setGolsVisitante] = useState<number | null>(null)
    const [palpiteConfirmado, setPalpiteConfirmado] = useState(false)
    const [palpiteLiberado, setPalpiteLiberado] = useState(false)

    const liberarPalpite = () => {
        if (statusEfetivo !== 'AGENDADO') return
        if (!estaNaPaginaJogos) {
            navigate('/jogos')
            return
        }
        setPalpiteLiberado(true)
    }

    const confirmarPalpite = () => {
        if (statusEfetivo !== 'AGENDADO') return
        if (!palpiteLiberado) return;

        if (palpiteConfirmado) {
            setPalpiteConfirmado(false);
            setGolsCasa(0);
            setGolsVisitante(0);
            return;
        }

        if ((golsCasa === null || golsVisitante === null) || (golsCasa < 0 || golsVisitante < 0)) {
            toast('warning' ,'Por favor, insira um número válido de gols para ambos os times.');
            return;
        }

        if (golsCasa > 20 || golsVisitante > 20) {
            toast('warning', 'Número de gols muito alto', 'Por favor, insira um número razoável de gols (0-20).');
            return;
        }

        setPalpiteConfirmado(true);
        salvaPalpite({
            jogoId: jogo.id,
            golsCasa,
            golsVisitante,
        })
    }

    useEffect(() => {
        if (palpiteExistente) {
            setGolsCasa(palpiteExistente.golsCasa)
            setGolsVisitante(palpiteExistente.golsVisitante)
            setPalpiteConfirmado(true)
            setPalpiteLiberado(true)
        }
    }, [palpiteExistente?.id])

    return (
        <Card className="max-w-[400px] min-h-[200px] hover:border-primary/50 transition-colors flex flex-col">
            <CardContent className="flex flex-col h-full w-full pt-1 pb-2 gap-0">
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <span className="text-xs text-muted-foreground">
                        {jogo.grupo ?? jogo.fase}, {getRodada(jogo.fase, jogo.rodada)}
                    </span>
                    <span className="text-center">
                        {formatarDataJogo(jogo.dataHora)}
                    </span>
                    <span className="text-xs text-center text-muted-foreground line-clamp-2 leading-tight">
                        🏟️ {jogo.local}
                    </span>
                </div>

                <div className="flex flex-col flex-1">
                    <div className="flex justify-around gap-3 mb-3">
                        <div className="w-1/4 flex flex-col items-center gap-2">
                            {codigoCasa && <span className={`fi fi-${codigoCasa} rounded-full text-3xl`}/>}
                            <span className="font-medium text-sm text-center leading-tight line-clamp-2 min-h-[2.5rem]">
                                {nomeCasa}
                            </span>
                        </div>

                        {statusEfetivo === 'ENCERRADO' && jogo.resultado && (
                            <div className="w-1/2 flex flex-col items-center">
                                <span className="font-bold text-lg px-2 tabular-nums">
                                {jogo.resultado.golsCasa} - {jogo.resultado.golsVisitante}
                                </span>
                                <span className="text-xs text-muted-foreground mb-1">Encerrado</span>
                            </div>
                        )}

                        {statusEfetivo === 'EM_ANDAMENTO' ? (
                            <div className="w-1/2 h-full flex self-center flex-col items-center gap-1">
                                <span className="text-lg font-medium text-destructive animate-pulse">
                                    ● Ao vivo
                                </span>
                            </div>
                            ) : statusEfetivo !== 'ENCERRADO' && (
                            <div className="w-1/2 flex mt-2 flex-col items-center">
                                <span className="font-bold text-lg px-2">
                                {jogo.dataHora ? formatarHoraJogo(jogo.dataHora) : status.label}
                                </span>
                            </div>
                        )}

                        <div className="w-1/4 flex flex-col items-center gap-2">
                            {codigoVisitante && <span className={`fi fi-${codigoVisitante} rounded-full text-3xl`}/>}
                            <span className="font-medium text-sm text-center leading-tight line-clamp-2 min-h-[2.5rem]">
                                {nomeVisitante}
                            </span>

                        </div>
                    </div>

                    {statusEfetivo === 'ENCERRADO' && jogo.resultado && (
                        jogo.resultado.artilheirosCasa.length > 0 || jogo.resultado.artilheirosVisitante.length > 0
                        ) && (
                        <div className="flex justify-between gap-2 px-1 mt-1 mb-2">
                            <div className="flex flex-col items-start gap-0.5 w-[45%]">
                            {jogo.resultado.artilheirosCasa.map((jogador, idx) => (
                                <span key={idx} className="text-[11px] text-muted-foreground truncate w-full">
                                ⚽ {jogador}
                                </span>
                            ))}
                            </div>
                            <div className="flex flex-col items-end gap-0.5 w-[45%]">
                            {jogo.resultado.artilheirosVisitante.map((jogador, idx) => (
                                <span key={idx} className="text-[11px] text-muted-foreground truncate w-full text-right">
                                {jogador} ⚽
                                </span>
                            ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-3">
                    {(statusEfetivo === 'ENCERRADO' || statusEfetivo === 'EM_ANDAMENTO') && palpiteExistente && (
                        <div className={`mt-auto flex justify-center items-center text-xs text-center pt-2 border-t border-border font-medium ${
                            statusEfetivo === 'ENCERRADO'
                            ? palpiteExistente.status === 'ACERTO_PLACAR'
                                ? 'text-green-600 dark:text-green-400'
                                : palpiteExistente.status === 'ACERTO_VENCEDOR'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-muted-foreground'
                            : 'text-muted-foreground'
                        }`}>
                            {statusEfetivo === 'ENCERRADO' && palpiteExistente.status === 'ACERTO_PLACAR' && '🎯 Placar exato! '}
                            {statusEfetivo === 'ENCERRADO' && palpiteExistente.status === 'ACERTO_VENCEDOR' && '✅ Vencedor correto! '}
                            {statusEfetivo === 'ENCERRADO' && palpiteExistente.status === 'ERRO' && '❌ '}
                            {statusEfetivo === 'EM_ANDAMENTO' && '⏳ '}
                            Seu palpite: {palpiteExistente.golsCasa} – {palpiteExistente.golsVisitante}
                            {statusEfetivo === 'ENCERRADO' && (
                            <>{' -> '}<span className="font-semibold">{palpiteExistente.pontos} pts</span></>
                            )}
                        </div>
                    )}

                    {!palpiteLiberado && mostrarBotaoPalpite && statusEfetivo === 'AGENDADO' && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3"
                        onClick={() => liberarPalpite()}
                    >
                        Palpitar
                    </Button>
                    )}

                    {palpiteLiberado && statusEfetivo === 'AGENDADO' && (
                        <div className="w-full mt-6 flex gap-8">
                            <Input
                                min={0}
                                disabled={palpiteConfirmado}
                                className="w-auto text-center"
                                value={golsCasa !== null ? golsCasa : ''}
                                onChange={(e) => {
                                    const val = e.target.value
                                    if (val === '') { setGolsCasa(null); return }
                                    const n = parseInt(val, 10)
                                    if (isNaN(n)) return
                                    setGolsCasa(n)
                                }}
                            />

                            {isPending && (
                                <Button disabled className="flex-1 bg-zinc-800 text-zinc-400">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Salvando...
                                </Button>
                            )}

                            {!isPending && (
                                <Button
                                    variant="outline"
                                    onClick={() => confirmarPalpite()}
                                    disabled={
                                    golsCasa === null ||
                                    golsVisitante === null ||
                                    golsCasa < 0 ||
                                    golsVisitante < 0 ||
                                    (palpiteConfirmado && !podeEditar)
                                    }
                                    title={!podeEditar ? 'Limite de edições atingido' : undefined}
                                >
                                    {palpiteConfirmado
                                    ? podeEditar
                                        ? `🔁 (${edicoesRestantes}x)`
                                        : '🔒'
                                    : '✅'
                                    }
                                </Button>
                            )}

                            <Input
                                min={0}
                                disabled={palpiteConfirmado}
                                className="w-auto text-center"
                                value={golsVisitante !== null ? golsVisitante : ''}
                                onChange={(e) => {
                                    const val = e.target.value
                                    if (val === '') { setGolsVisitante(null); return }
                                    const n = parseInt(val, 10)
                                    if (isNaN(n)) return 
                                    setGolsVisitante(n)
                                }}
                            />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}