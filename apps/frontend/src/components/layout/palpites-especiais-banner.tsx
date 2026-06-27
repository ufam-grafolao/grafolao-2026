import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useConfigPalpitesEspeciais } from '@/hooks/use-palpites-especiais'

const STORAGE_KEY = 'grafolao:palpites-especiais-banner-visto'
const FALLBACK_PRAZO = new Date('2026-06-28T14:59:00-04:00')

function useContagem(prazo: Date) {
  const [restante, setRestante] = useState(() => Math.max(0, prazo.getTime() - Date.now()))

  useEffect(() => {
    if (restante <= 0) return
    const id = setInterval(() => {
      const diff = Math.max(0, prazo.getTime() - Date.now())
      setRestante(diff)
      if (diff === 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [prazo])

  const horas   = Math.floor(restante / 3_600_000)
  const minutos = Math.floor((restante % 3_600_000) / 60_000)
  const segundos = Math.floor((restante % 60_000) / 1_000)

  return { horas, minutos, segundos, encerrado: restante === 0 }
}

const TIPOS = [
  { emoji: '🏆', label: 'Campeão',      pts: 35 },
  { emoji: '🥈', label: 'Vice-Campeão', pts: 25 },
  { emoji: '🥉', label: '3º Lugar',     pts: 18 },
  { emoji: '⚽', label: 'Artilheiro',   pts: 30 },
  { emoji: '⭐', label: 'MVP',           pts: 35 },
]

export function PalpitesEspeciaisBanner() {
  const navigate = useNavigate()
  const { data: config } = useConfigPalpitesEspeciais()
  const prazo = config ? new Date(config.prazo) : FALLBACK_PRAZO
  const { horas, minutos, segundos, encerrado } = useContagem(prazo)

  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    const jaViu = localStorage.getItem(STORAGE_KEY)
    if (!jaViu && !encerrado) setAberto(true)
  }, [encerrado])

  function fechar() {
    localStorage.setItem(STORAGE_KEY, '1')
    setAberto(false)
  }

  function palpitar() {
    fechar()
    navigate('/palpites-especiais')
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <Dialog open={aberto} onOpenChange={open => { if (!open) fechar() }}>
      <DialogContent
        showCloseButton
        className="bg-sidebar sm:max-w-lg gap-0 p-0 overflow-hidden"
      >
        {/* Cabeçalho com gradiente */}
        <div className="bg-gradient-to-br from-primary/90 to-primary px-6 pt-8 pb-6 text-center">
          <div className="text-5xl mb-3">🏆</div>
          <DialogTitle className="text-xl font-bold text-primary-foreground leading-snug">
            Os Palpites Especiais chegaram!
          </DialogTitle>
          <p className="text-sm text-primary-foreground/80 mt-1">
            Ganhe pontos bônus prevendo os destaques da Copa
          </p>
        </div>

        {/* Lista de tipos */}
        <div className="px-6 py-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TIPOS.map(t => (
            <div
              key={t.label}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2"
            >
              <span className="text-base leading-none">{t.emoji}</span>
              <div>
                <p className="text-xs font-medium leading-none">{t.label}</p>
                <p className="text-[11px] text-primary font-semibold mt-0.5">+{t.pts} pts</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contador */}
        <div className="mx-6 mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Tempo restante para palpitar</p>
          <p className="text-2xl font-mono font-bold tabular-nums tracking-tight text-amber-600 dark:text-amber-400">
            {pad(horas)}<span className="text-base opacity-60">h</span>{' '}
            {pad(minutos)}<span className="text-base opacity-60">m</span>{' '}
            {pad(segundos)}<span className="text-base opacity-60">s</span>
          </p>
        </div>

        {/* Ações */}
        <div className="-mx-0 -mb-0 flex flex-col gap-2 rounded-b-xl border-t bg-muted/50 px-6 py-4 sm:flex-row sm:justify-end">
          <Button variant="outline" size="sm" onClick={fechar} className="sm:order-first">
            Ver depois
          </Button>
          <Button size="sm" onClick={palpitar} className="font-semibold">
            Palpitar agora →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
