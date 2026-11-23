// Preferência de tema: claro, escuro ou seguir o sistema.
// A chave e os valores são os mesmos que o next-themes usava, então quem já tinha
// escolhido um tema continua com a mesma escolha.
// O script em index.html repete esta leitura antes do React montar, para não piscar.

export type PreferenciaTema = 'light' | 'dark' | 'system'
export type TemaResolvido = 'light' | 'dark'

export const CHAVE_TEMA = 'theme'
const CONSULTA_ESCURO = '(prefers-color-scheme: dark)'

function ehPreferencia(valor: unknown): valor is PreferenciaTema {
  return valor === 'light' || valor === 'dark' || valor === 'system'
}

/** Lê a escolha salva. Sem escolha (ou sem acesso ao localStorage), segue o sistema. */
export function lerPreferencia(): PreferenciaTema {
  try {
    const salvo = window.localStorage.getItem(CHAVE_TEMA)
    return ehPreferencia(salvo) ? salvo : 'system'
  } catch {
    // Modo privado, cookies bloqueados ou cota cheia: a escolha só não persiste
    return 'system'
  }
}

export function salvarPreferencia(preferencia: PreferenciaTema) {
  try {
    window.localStorage.setItem(CHAVE_TEMA, preferencia)
  } catch {
    // Sem armazenamento: o tema vale até recarregar a página
  }
}

export function sistemaPrefereEscuro() {
  return typeof window !== 'undefined' && window.matchMedia(CONSULTA_ESCURO).matches
}

export function observarSistema(aoMudar: (escuro: boolean) => void) {
  const consulta = window.matchMedia(CONSULTA_ESCURO)
  const ouvinte = (e: MediaQueryListEvent) => aoMudar(e.matches)
  consulta.addEventListener('change', ouvinte)
  return () => consulta.removeEventListener('change', ouvinte)
}

export function resolverTema(preferencia: PreferenciaTema, sistemaEscuro: boolean): TemaResolvido {
  if (preferencia === 'system') return sistemaEscuro ? 'dark' : 'light'
  return preferencia
}

/**
 * Aplica a classe `dark` no <html>. Desliga as transições durante a troca:
 * sem isso, cada borda e fundo animaria em tempos diferentes.
 */
export function aplicarTema(tema: TemaResolvido) {
  const raiz = document.documentElement
  if (raiz.classList.contains('dark') === (tema === 'dark')) return
  const semTransicao = document.createElement('style')
  semTransicao.textContent = '*,*::before,*::after{transition:none!important}'
  document.head.appendChild(semTransicao)
  raiz.classList.toggle('dark', tema === 'dark')
  void window.getComputedStyle(document.body).opacity // força o recálculo antes de reativar
  requestAnimationFrame(() => semTransicao.remove())
}
