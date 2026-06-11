import { Jogo } from "@/types/jogo";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { getBandeira } from "@/lib/bandeiras";
import { getRodada } from "@/lib/rodada";

const statusLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  AGENDADO:     { label: 'Agendado',     variant: 'secondary' },
  EM_ANDAMENTO: { label: 'Ao vivo',      variant: 'destructive' },
  ENCERRADO:    { label: 'Encerrado',    variant: 'outline' },
  BLOQUEADO:    { label: 'Bloqueado',    variant: 'outline' },
}

function formatarHora(dataHora: string) {
  return new Date(dataHora).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Manaus',
  })
}


interface JogoCardProps {
    jogo: Jogo;
    mostrarBotaoPalpite?: boolean;
}

export default function JogoCard({ jogo, mostrarBotaoPalpite = false }: JogoCardProps) {
    const navigate = useNavigate();
    const status = statusLabel[jogo.status];

    const nomeCasa = jogo.timeCasa?.nome ?? jogo.timeCasaRef ?? '?';
    const nomeVisitante = jogo.timeVisitante?.nome ?? jogo.timeVisitanteRef ?? '?';

    const codigoCasa = getBandeira(nomeCasa);
    const codigoVisitante = getBandeira(nomeVisitante);

    const heightClass = status.label === 'Encerrado' ? 'h-4/5' : 'h-2/5';

    return (
        <Card className="hover:border-primary/50 transition-colors">
            <CardContent className="h-full pt-1 pb-2">
                <div className="h-1/5 flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs text-muted-foreground">
                        {jogo.grupo ?? jogo.fase}, {getRodada(jogo.fase, jogo.rodada)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        🏟️ {jogo.local}
                    </span>
                </div>

                <div className={`${heightClass} flex items-start justify-around gap-3`}>
                    <div className="w-1/4 flex flex-col items-center gap-2">
                        {codigoCasa && <span className={`fi fi-${codigoCasa} rounded-full text-3xl`}/>}
                        <span className="font-medium text-sm text-center">{nomeCasa}</span>
                    </div>

                    {jogo.status === 'ENCERRADO' && jogo.resultado ? (
                        <div className="w-1/2 flex flex-col items-center">
                            <span className="font-bold text-lg px-2 tabular-nums">
                                {jogo.resultado.golsCasa} - {jogo.resultado.golsVisitante}
                            </span>
                            <span className="text-muted-foreground mb-2">
                                {jogo.status}
                            </span>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end gap-1">
                                    {jogo.resultado.artilheirosCasa.map((jogador, idx) => (
                                        <span key={`c-${idx}`} className="text-xs text-muted-foreground">{jogador}</span>
                                    ))}
                                </div>

                                <div className="px-2">⚽</div>

                                <div className="flex flex-col items-start gap-1">
                                    {jogo.resultado.artilheirosVisitante.map((jogador, idx) => (
                                        <span key={`v-${idx}`} className="text-xs text-muted-foreground">{jogador}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-1/2 flex flex-col items-center">
                            <span className="font-bold text-lg px-2">
                                {jogo.dataHora ? formatarHora(jogo.dataHora) : status.label}
                            </span>
                        </div>
                    )}

                    <div className="w-1/4 flex flex-col items-center gap-2">
                        {codigoVisitante && <span className={`fi fi-${codigoVisitante} rounded-full text-3xl`}/>}
                        <span className="font-medium text-sm text-center">{nomeVisitante}</span>
                    </div>
                </div>

                {mostrarBotaoPalpite && jogo.status === 'AGENDADO' && (
                <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-6"
                    onClick={() => navigate('/jogos')}
                >
                    Palpitar
                </Button>
                )}
            </CardContent>
        </Card>
    )
}