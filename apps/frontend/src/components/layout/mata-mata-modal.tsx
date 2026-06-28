import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { useJogos } from '@/hooks/use-jogos'

const STORAGE_KEY = 'grafolao:mata-mata-pontuacao-modal-visto'

const CENARIOS = [
  { emoji: '🥇', label: 'Placar exato + pênaltis', pts: 20 },
  { emoji: '🎯', label: 'Placar exato', pts: 15 },
  { emoji: '✅', label: 'Empate + pênaltis certo', pts: 15 },
  { emoji: '⭐', label: 'Vencedor certo + bônus', pts: 10 },
  { emoji: '✅', label: 'Vencedor correto', pts: 7 },
  { emoji: '❌', label: 'V/D mas jogo foi pên', pts: 0 },
]

export function MataMataModal() {
  const navigate = useNavigate()
  const { data: jogos } = useJogos()
  const [aberto, setAberto] = useState(false)

  const temMataMata = jogos?.some(j => !j.grupo) ?? false

  useEffect(() => {
    if (!temMataMata) return
    const jaViu = localStorage.getItem(STORAGE_KEY)
    if (!jaViu) setAberto(true)
  }, [temMataMata])

  function fechar() {
    localStorage.setItem(STORAGE_KEY, '1')
    setAberto(false)
  }

  function irParaPalpites() {
    fechar()
    navigate('/jogos')
  }

  function verAjuda() {
    fechar()
    navigate('/ajuda')
  }

  return (
    <Dialog open={aberto} onOpenChange={open => { if (!open) fechar() }}>
      <DialogContent
        showCloseButton
        className="bg-sidebar sm:max-w-lg gap-0 p-0 overflow-hidden"
      >
        {/* Cabeçalho */}
        <div className="bg-gradient-to-br from-amber-500/90 to-orange-600 px-6 pt-8 pb-6 text-center">
          <div className="text-5xl mb-3">⚔️</div>
          <DialogTitle className="text-xl font-bold text-white leading-snug">
            A Copa entrou na fase mata-mata!
          </DialogTitle>
          <p className="text-sm text-white/80 mt-1">
            A pontuação muda — agora tem pênaltis e até{' '}
            <strong className="text-white">20 pts</strong> por jogo
          </p>
        </div>

        {/* Cenários de pontuação */}
        <div className="px-6 py-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CENARIOS.map(c => (
            <div
              key={c.label}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2"
            >
              <span className="text-base leading-none">{c.emoji}</span>
              <div>
                <p className="text-xs font-medium leading-none">{c.label}</p>
                <p className={`text-[11px] font-semibold mt-0.5 ${c.pts === 0 ? 'text-destructive' : 'text-primary'}`}>
                  {c.pts === 0 ? '0 pts' : `+${c.pts} pts`}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Aviso pênaltis */}
        <div className="mx-6 mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
          <p className="text-xs text-red-700 dark:text-red-400">
            <strong>Atenção:</strong> se você palpitar vitória ou derrota e o jogo for para pênaltis,
            você <strong>não pontua</strong> — o jogo terminou empatado no tempo regulamentar.
          </p>
        </div>

        {/* Ações */}
        <div className="flex justify-between w-full gap-2 rounded-b-xl border-t bg-muted/50 px-6 py-4 sm:flex-row sm:justify-end">
          <Button variant="outline" size="sm" onClick={verAjuda} className="sm:order-first">
            Saiba Mais
          </Button>
          <Button size="sm" onClick={irParaPalpites} className="font-semibold">
            Ir para palpites
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
