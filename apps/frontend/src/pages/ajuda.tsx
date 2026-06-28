import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bell,
  Users,
  Target,
  Trophy,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  Smartphone,
  MessageSquarePlus,
  Send,
  GitBranch,
} from 'lucide-react'

function Secao({ icone, titulo, children }: {
  icone: React.ReactNode
  titulo: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icone}
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-3">
        {children}
      </CardContent>
    </Card>
  )
}

function ItemPontos({ pts, label, descricao }: { pts: number; label: string; descricao: string }) {
  return (
    <div className="flex items-start gap-3">
      <Badge className="shrink-0 min-w-12 justify-center text-xs">{pts} pts</Badge>
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs mt-0.5">{descricao}</p>
      </div>
    </div>
  )
}

function Passo({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0 mt-0.5">
        {n}
      </span>
      <p>{children}</p>
    </div>
  )
}

function ArvoreMataMata() {
  return (
    <div className="text-xs space-y-2 pt-1">
      <div className="font-medium text-foreground">Acertou o placar exato?</div>

      {/* SIM branch */}
      <div className="ml-2 pl-3 border-l-2 border-green-500/40 space-y-1.5">
        <p className="text-green-600 dark:text-green-400 font-semibold">SIM (+15) — Partida foi para pênaltis?</p>
        <div className="ml-2 pl-3 border-l border-muted space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Não →</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">15 pts</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Sim → Acertou quem passou?</p>
            <div className="ml-2 pl-3 border-l border-muted space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Não →</span>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">15 pts</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Sim (+5) →</span>
                <Badge className="text-[10px] h-4 px-1.5 bg-green-600 hover:bg-green-700">20 pts</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NÃO branch */}
      <div className="ml-2 pl-3 border-l-2 border-red-500/40 space-y-1.5">
        <p className="text-red-500 dark:text-red-400 font-semibold">NÃO — Acertou resultado parcial? (V/E/D)</p>
        <div className="ml-2 pl-3 border-l border-muted space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Não →</span>
            <Badge variant="destructive" className="text-[10px] h-4 px-1.5">0 pts</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Sim (+7) — Partida foi para pênaltis?</p>
            <div className="ml-2 pl-3 border-l border-muted space-y-1.5">
              <div className="space-y-1">
                <p className="text-muted-foreground">Não → Bônus (saldo ou gols de um time)?</p>
                <div className="ml-2 pl-3 border-l border-muted space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Não →</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">7 pts</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Sim (+3) →</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">10 pts</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Sim (+3) — Acertou quem passou?</p>
                <div className="ml-2 pl-3 border-l border-muted space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Não →</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">10 pts</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Sim (+5) →</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">15 pts</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CONTATO_EMAIL = 'samueldavi.0907@gmail.com'

function SecaoFeedback() {
  const [tipo, setTipo] = useState('')
  const [mensagem, setMensagem] = useState('')

  function enviar() {
    if (!tipo || !mensagem.trim()) return
    const assunto = encodeURIComponent(`[Grafolão] ${tipo}`)
    const corpo   = encodeURIComponent(mensagem.trim())
    window.location.href = `mailto:${CONTATO_EMAIL}?subject=${assunto}&body=${corpo}`
  }

  return (
    <Secao
      icone={<MessageSquarePlus className="h-4 w-4 text-primary" />}
      titulo="Sugestões e Reclamações"
    >
      <p>
        Encontrou um bug, tem uma ideia ou quer dar um feedback? Manda pra gente — toda
        mensagem é lida pelos responsáveis do projeto.
      </p>

      <div className="space-y-3 pt-1">
        <div className="space-y-1.5">
          <Label htmlFor="tipo-feedback" className="text-xs font-medium text-foreground">
            Tipo
          </Label>
          <Select onValueChange={(v: string | null) => setTipo(v ?? '')}>
            <SelectTrigger id="tipo-feedback" className="h-9 text-sm">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent className={`bg-sidebar`}>
              <SelectItem value="Sugestão">💡 Sugestão</SelectItem>
              <SelectItem value="Reclamação">😤 Reclamação</SelectItem>
              <SelectItem value="Bug">🐛 Bug / Erro</SelectItem>
              <SelectItem value="Elogio">🌟 Elogio</SelectItem>
              <SelectItem value="Outro">💬 Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mensagem-feedback" className="text-xs font-medium text-foreground">
            Mensagem
          </Label>
          <Textarea
            id="mensagem-feedback"
            placeholder="Descreva com detalhes..."
            className="resize-none text-sm min-h-24"
            value={mensagem}
            onChange={e => setMensagem(e.target.value)}
          />
        </div>

        <Button
          onClick={enviar}
          disabled={!tipo || !mensagem.trim()}
          className="w-full gap-2"
          size="sm"
        >
          <Send className="h-3.5 w-3.5" />
          Enviar por e-mail
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          Ao clicar em enviar, seu cliente de e-mail será aberto com a mensagem
          preenchida. Confirme o envio por lá.
        </span>
      </div>
    </Secao>
  )
}

export default function AjudaPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Central de Ajuda</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tudo o que você precisa saber para aproveitar o Grafolão.
        </p>
      </div>


      {/* Pontuação mata-mata */}
      <Secao icone={<GitBranch className="h-4 w-4 text-primary" />} titulo="Pontuação — Mata-Mata">
        <p>
          Nos jogos de mata-mata, um time precisa avançar. O placar pode terminar empatado e ir para pênaltis,
          o que muda a pontuação:
        </p>

        <ArvoreMataMata />

        <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2 text-xs">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-800 dark:text-amber-300">
            <strong>Atenção:</strong> se você palpitou vitória ou derrota mas o jogo foi para pênaltis, você{' '}
            <strong>não pontua</strong> — pois o jogo terminou empatado no tempo regulamentar.
          </span>
        </div>

        <Separator />

        <div className="space-y-1">
          <p className="font-medium text-foreground">Resumo rápido</p>
          <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs pt-1">
            <span>🥇 Placar exato + pênaltis correto</span>           <span className="font-semibold text-foreground">20 pts</span>
            <span>🎯 Placar exato (sem pên ou errou pên)</span>        <span className="font-semibold text-foreground">15 pts</span>
            <span>✅ Empate correto + pênaltis correto</span>          <span className="font-semibold text-foreground">15 pts</span>
            <span>✅ Vencedor certo + bônus (saldo/gols)</span>        <span className="font-semibold text-foreground">10 pts</span>
            <span>⭐ Empate correto, errou pênaltis</span>             <span className="font-semibold text-foreground">10 pts</span>
            <span>✅ Vencedor correto, sem bônus</span>                <span className="font-semibold text-foreground">7 pts</span>
            <span>❌ Erro (inclui palpitar V/D e jogo ir a pên)</span> <span className="font-semibold text-foreground">0 pts</span>
          </div>
        </div>
      </Secao>

      {/* Pontuação grupos */}
      <Secao icone={<Target className="h-4 w-4 text-primary" />} titulo="Pontuação — Fase de Grupos">
        <p>Cada palpite é avaliado após o resultado do jogo:</p>

        <div className="space-y-2.5 pt-1">
          <ItemPontos
            pts={10}
            label="Placar exato"
            descricao="Você acertou o placar completo. Ex: chutou 2x1 e foi 2x1."
          />
          <ItemPontos
            pts={5}
            label="Vencedor certo"
            descricao="Acertou quem ganhou, mas não o placar exato. Vale também para empate."
          />
          <ItemPontos
            pts={2}
            label="Gols de um time"
            descricao="Acertou o número de gols de um dos times, mesmo errando o outro."
          />
          <ItemPontos
            pts={2}
            label="Saldo de gols"
            descricao="Acertou a diferença entre os gols (ex: chutou 3x1 e foi 2x0 — saldo 2)."
          />
        </div>

        <Separator />

        <div className="space-y-1">
          <p className="font-medium text-foreground">Combinações possíveis</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs pt-1">
            <span>🥇 Placar exato</span>              <span className="font-semibold text-foreground">10 pts</span>
            <span>✅ Vencedor + gols de um time</span> <span className="font-semibold text-foreground">7 pts</span>
            <span>✅ Vencedor + saldo</span>           <span className="font-semibold text-foreground">7 pts</span>
            <span>✅ Só vencedor</span>                <span className="font-semibold text-foreground">5 pts</span>
            <span>❌ Erro completo</span>              <span className="font-semibold text-foreground">0 pts</span>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Cada palpite pode ser editado até <strong>2 vezes</strong> e somente antes do jogo começar.</span>
        </div>
      </Secao>

      {/* Palpites */}
      <Secao icone={<Trophy className="h-4 w-4 text-primary" />} titulo="Como Palpitar">
        <p className="font-medium text-foreground">Palpite individual</p>
        <div className="space-y-2">
          <Passo n={1}>Acesse <strong>Jogos e Palpites</strong> no menu lateral.</Passo>
          <Passo n={2}>Escolha um jogo que ainda não começou e clique nele.</Passo>
          <Passo n={3}>Informe o placar que você acha que vai ser e confirme.</Passo>
        </div>

        <Separator />

        <p className="font-medium text-foreground">Palpite em lote</p>
        <div className="space-y-2">
          <Passo n={1}>Na página de Jogos, clique em <strong>"Palpitar em lote"</strong>.</Passo>
          <Passo n={2}>Preencha os placares de vários jogos de uma só vez.</Passo>
          <Passo n={3}>Envie tudo com um único clique.</Passo>
        </div>

        <div className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs">
          <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Os palpites fecham automaticamente no horário de início de cada jogo. Após fechar, não é mais possível palpitar ou editar.</span>
        </div>
      </Secao>

      {/* Comunidades */}
      <Secao icone={<Users className="h-4 w-4 text-primary" />} titulo="Comunidades (Grupos)">
        <p>Dispute o ranking com seus amigos em grupos separados.</p>

        <p className="font-medium text-foreground">Criar uma comunidade</p>
        <div className="space-y-2">
          <Passo n={1}>Acesse <strong>Grupos</strong> e clique em <strong>"Criar"</strong>.</Passo>
          <Passo n={2}>Escolha um nome e defina se será pública ou privada.</Passo>
          <Passo n={3}>Compartilhe o link ou código de convite com seus amigos.</Passo>
        </div>

        <div className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Cada usuário pode criar até <strong>3 comunidades</strong>. Não há limite para entrar em comunidades.</span>
        </div>

        <Separator />

        <p className="font-medium text-foreground">Entrar em uma comunidade</p>
        <div className="space-y-2">
          <Passo n={1}>Clique em <strong>"Buscar"</strong> e pesquise pelo nome ou cole o código de convite.</Passo>
          <Passo n={2}>Para comunidades públicas, clique em <strong>"Entrar"</strong> e pronto.</Passo>
          <Passo n={3}>Para comunidades privadas, sua entrada precisa ser aprovada pelo dono ou moderador.</Passo>
        </div>

        <Separator />

        <p className="font-medium text-foreground">Cargos</p>
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2 text-xs">
            <span>👑</span>
            <span><strong className="text-foreground">Dono</strong> — cria, deleta e gerencia tudo na comunidade.</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>🛡️</span>
            <span><strong className="text-foreground">Moderador</strong> — aprova solicitações e pode expulsar membros.</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>👤</span>
            <span><strong className="text-foreground">Membro</strong> — participa do ranking e acompanha os jogos.</span>
          </div>
        </div>
      </Secao>

      {/* Notificações */}
      <Secao icone={<Bell className="h-4 w-4 text-primary" />} titulo="Notificações Push">
        <p>Receba alertas diretamente no seu dispositivo para não perder nenhum jogo.</p>

        <p className="font-medium text-foreground">O que você recebe</p>
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
            <span><strong className="text-foreground">1 hora antes</strong> de cada jogo — lembrete para palpitar.</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
            <span><strong className="text-foreground">30 minutos antes</strong> do kickoff — último aviso.</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
            <span>Quando um <strong className="text-foreground">resultado é publicado</strong> — confira sua pontuação.</span>
          </div>
        </div>

        <Separator />

        <p className="font-medium text-foreground">Como ativar (Android e PC)</p>
        <div className="space-y-2">
          <Passo n={1}>No rodapé do menu lateral, clique em <strong>"Ativar notificações"</strong>.</Passo>
          <Passo n={2}>Autorize as notificações no popup do seu navegador.</Passo>
          <Passo n={3}>Pronto — o botão muda para <strong>"Notificações ativas"</strong>.</Passo>
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary shrink-0" />
          <p className="font-medium text-foreground">iPhone / iPad (iOS)</p>
        </div>

        <p>
          No iOS, as notificações só funcionam quando o Grafolão é instalado como app na
          tela inicial. Siga os passos abaixo pelo <strong className="text-foreground">Safari</strong>{' '}
          (Chrome e Firefox no iPhone não suportam notificações).
        </p>

        <div className="space-y-2">
          <Passo n={1}>
            Abra o <strong>Safari</strong> e acesse o Grafolão.
          </Passo>
          <Passo n={2}>
            Toque no ícone de compartilhar{' '}
            <span className="inline-flex items-center justify-center h-4 w-4 rounded border text-[10px] align-middle mx-0.5">⎙</span>{' '}
            na barra inferior do Safari.
          </Passo>
          <Passo n={3}>
            Role a lista e toque em <strong>"Adicionar à Tela de Início"</strong>.
          </Passo>
          <Passo n={4}>
            Confirme tocando em <strong>"Adicionar"</strong> no canto superior direito.
          </Passo>
          <Passo n={5}>
            Abra o Grafolão pelo ícone que apareceu na tela inicial (não pelo Safari).
          </Passo>
          <Passo n={6}>
            Agora ative as notificações no menu lateral normalmente.
          </Passo>
        </div>

        <Separator />

        <p className="font-medium text-foreground">Compatibilidade</p>
        <div className="rounded-md border overflow-hidden text-xs">
          <div className="grid grid-cols-[1fr_auto] bg-muted px-3 py-1.5 font-medium text-foreground">
            <span>Dispositivo / Navegador</span>
            <span>Funciona?</span>
          </div>
          {[
            ['Android — Chrome, Edge, Firefox', true],
            ['PC / Mac — Chrome, Edge, Firefox, Safari 13+', true],
            ['iPhone — Safari + Adicionar à tela inicial', true],
            ['iPhone — Chrome ou Firefox (sem instalar)', false],
            ['iPhone — Safari sem adicionar à tela inicial', false],
          ].map(([label, ok]) => (
            <div key={label as string} className="grid grid-cols-[1fr_auto] px-3 py-1.5 border-t items-center">
              <span>{label as string}</span>
              {ok
                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                : <XCircle className="h-3.5 w-3.5 text-destructive" />
              }
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Para desativar, clique novamente no botão do menu lateral. As notificações chegam mesmo com o app minimizado, desde que o navegador (ou o app instalado) esteja aberto em segundo plano.</span>
        </div>
      </Secao>

      {/* Feedback */}
      <SecaoFeedback />

      {/* Rodapé */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2">
        <Layers className="h-3.5 w-3.5 shrink-0" />
        <span>Grafolão 2026 — trabalho acadêmico da disciplina ICC041 (UFAM).</span>
      </div>
    </div>
  )
}
