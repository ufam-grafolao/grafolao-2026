import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { TemaContext } from '@/hooks/use-tema'
import {
  CHAVE_TEMA,
  aplicarTema,
  lerPreferencia,
  observarSistema,
  resolverTema,
  salvarPreferencia,
  sistemaPrefereEscuro,
  type PreferenciaTema,
} from '@/lib/tema'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(lerPreferencia)
  const [sistemaEscuro, setSistemaEscuro] = useState(sistemaPrefereEscuro)

  // Segue a troca de tema do sistema enquanto a página está aberta
  useEffect(() => observarSistema(setSistemaEscuro), [])

  // Mantém as abas abertas em sincronia quando a escolha muda em outra aba
  useEffect(() => {
    function aoMudarArmazenamento(e: StorageEvent) {
      if (e.key === CHAVE_TEMA) setPreferencia(lerPreferencia())
    }
    window.addEventListener('storage', aoMudarArmazenamento)
    return () => window.removeEventListener('storage', aoMudarArmazenamento)
  }, [])

  const resolvido = resolverTema(preferencia, sistemaEscuro)

  // Antes da pintura, para não mostrar um quadro no tema errado
  useLayoutEffect(() => aplicarTema(resolvido), [resolvido])

  const definirPreferencia = useCallback((nova: PreferenciaTema) => {
    setPreferencia(nova)
    salvarPreferencia(nova)
  }, [])

  const valor = useMemo(
    () => ({ preferencia, resolvido, definirPreferencia }),
    [preferencia, resolvido, definirPreferencia],
  )

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>
}
