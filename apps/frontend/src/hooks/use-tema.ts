import { createContext, useContext } from 'react'
import type { PreferenciaTema, TemaResolvido } from '@/lib/tema'

export interface ContextoTema {
  /** O que a pessoa escolheu (inclui "seguir o sistema") */
  preferencia: PreferenciaTema
  /** O tema que está na tela agora */
  resolvido: TemaResolvido
  definirPreferencia: (preferencia: PreferenciaTema) => void
}

export const TemaContext = createContext<ContextoTema | null>(null)

export function useTema() {
  const contexto = useContext(TemaContext)
  if (!contexto) throw new Error('useTema precisa estar dentro de <ThemeProvider>')
  return contexto
}
