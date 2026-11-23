/** Liga/desliga com rótulo e uma linha de detalhe (role="switch"). Alvo de 44 px. */
export function Interruptor({
  rotulo,
  detalhe,
  ligado,
  onChange,
}: {
  rotulo: string
  detalhe?: string
  ligado: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={() => onChange(!ligado)}
      className="group flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span
        aria-hidden
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-[background-color,border-color] duration-150 motion-reduce:transition-none ${
          ligado ? 'border-primary bg-primary' : 'border-input bg-muted'
        }`}
      >
        <span
          className={`absolute left-0.5 size-[1.125rem] rounded-full shadow-sm transition-transform duration-150 motion-reduce:transition-none ${
            ligado ? 'translate-x-5 bg-primary-foreground' : 'translate-x-0 bg-foreground/70'
          }`}
        />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold leading-tight">{rotulo}</span>
        {detalhe && <span className="text-xs leading-tight text-muted-foreground">{detalhe}</span>}
      </span>
    </button>
  )
}
