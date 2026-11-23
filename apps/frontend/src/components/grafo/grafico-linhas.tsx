import { useEffect, useRef, useState } from 'react'

export interface SerieLinha {
  rotulo: string
  /** cor CSS (use os tokens --chart-*, que já mudam com o tema) */
  cor: string
  valores: (number | null)[]
  tracejada?: boolean
}

interface Props {
  /** Rótulos do eixo x (curtos) e nomes completos para a tabela e a dica */
  rotulosX: { curto: string; longo: string }[]
  series: SerieLinha[]
  /** Faixa sombreada no começo do eixo (índices de 0 a fimFaixa-1) com uma nota */
  faixaInicial?: { fim: number; nota: string }
  /** Índices com um marcador de aviso (ex.: resultado parcial) */
  avisos?: Set<number>
  titulo: string
  formatar?: (v: number) => string
}

const ALTURA = 260
const MARGEM = { topo: 16, direita: 16, baixo: 44, esquerda: 36 }

/**
 * Gráfico de linhas em SVG, sem biblioteca. Uma tabela com os mesmos números fica logo abaixo
 * (recolhida), para teclado e leitor de tela.
 */
export function GraficoLinhas({ rotulosX, series, faixaInicial, avisos, titulo, formatar = (v) => v.toLocaleString('pt-BR') }: Props) {
  const caixaRef = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(640)
  const [ativo, setAtivo] = useState<number | null>(null)

  useEffect(() => {
    const el = caixaRef.current
    if (!el) return
    const obs = new ResizeObserver(([e]) => setLargura(Math.max(280, Math.round(e.contentRect.width))))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const n = rotulosX.length
  const todos = series.flatMap((s) => s.valores.filter((v): v is number => v !== null))
  const maxY = Math.max(1, ...todos)
  const passoY = maxY <= 10 ? 2 : maxY <= 30 ? 5 : 10
  const topoY = Math.ceil(maxY / passoY) * passoY
  const w = largura - MARGEM.esquerda - MARGEM.direita
  const h = ALTURA - MARGEM.topo - MARGEM.baixo
  const x = (i: number) => MARGEM.esquerda + (n <= 1 ? w / 2 : (i / (n - 1)) * w)
  const y = (v: number) => MARGEM.topo + h - (v / topoY) * h
  // Quantos rótulos cabem no eixo: no celular, um a cada dois ou três
  const salto = Math.max(1, Math.ceil((n * 34) / w))
  const marcasY = Array.from({ length: topoY / passoY + 1 }, (_, i) => i * passoY)

  const caminho = (valores: (number | null)[]) =>
    valores
      .map((v, i) => (v === null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
      .reduce<string[]>((acc, p, i, arr) => {
        if (p === null) return acc
        acc.push(`${i === 0 || arr[i - 1] === null ? 'M' : 'L'}${p}`)
        return acc
      }, [])
      .join(' ')

  function aoMover(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - r.left - MARGEM.esquerda
    const i = Math.round((px / w) * (n - 1))
    setAtivo(i >= 0 && i < n ? i : null)
  }

  return (
    <figure className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm" aria-hidden>
        {series.map((s) => (
          <span key={s.rotulo} className="flex items-center gap-2">
            <svg width="18" height="8" className="shrink-0">
              <path d="M0 4h18" stroke={s.cor} strokeWidth="2.5" strokeDasharray={s.tracejada ? '4 3' : undefined} />
            </svg>
            {s.rotulo}
          </span>
        ))}
      </div>

      <div ref={caixaRef} className="relative w-full">
        <svg
          width={largura}
          height={ALTURA}
          role="img"
          aria-label={titulo}
          className="block touch-pan-y select-none"
          onPointerMove={aoMover}
          onPointerDown={aoMover}
          onPointerLeave={() => setAtivo(null)}
        >
          {faixaInicial && faixaInicial.fim > 0 && (
            <g>
              <rect
                x={MARGEM.esquerda}
                y={MARGEM.topo}
                width={Math.max(0, x(faixaInicial.fim - 1) - MARGEM.esquerda + (n > 1 ? w / (n - 1) / 2 : 0))}
                height={h}
                className="fill-foreground/[0.07]"
              />
            </g>
          )}
          {marcasY.map((v) => (
            <g key={v}>
              <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} />
              <text x={MARGEM.esquerda - 8} y={y(v) + 4} textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                {v}
              </text>
            </g>
          ))}
          {rotulosX.map((r, i) =>
            i % salto === 0 || i === n - 1 ? (
              <text
                key={i}
                x={x(i)}
                y={ALTURA - MARGEM.baixo + 16}
                textAnchor="end"
                transform={`rotate(-35 ${x(i)} ${ALTURA - MARGEM.baixo + 16})`}
                className="fill-muted-foreground text-[11px]"
              >
                {r.curto}
              </text>
            ) : null,
          )}
          {ativo !== null && (
            <line x1={x(ativo)} x2={x(ativo)} y1={MARGEM.topo} y2={MARGEM.topo + h} className="stroke-foreground/40" strokeWidth={1} />
          )}
          {series.map((s) => (
            <g key={s.rotulo}>
              <path d={caminho(s.valores)} fill="none" stroke={s.cor} strokeWidth={2.5} strokeLinejoin="round" strokeDasharray={s.tracejada ? '6 4' : undefined} />
              {s.valores.map((v, i) =>
                v === null ? null : (
                  <circle key={i} cx={x(i)} cy={y(v)} r={ativo === i ? 4.5 : 2.5} fill={s.cor} className="stroke-card" strokeWidth={ativo === i ? 2 : 0} />
                ),
              )}
            </g>
          ))}
          {avisos &&
            [...avisos].map((i) => (
              <text key={i} x={x(i)} y={MARGEM.topo + 10} textAnchor="middle" className="fill-destructive text-[12px] font-bold">
                !
              </text>
            ))}
        </svg>

        {ativo !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-md border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"
            style={x(ativo) > largura / 2 ? { right: largura - x(ativo) + 10 } : { left: x(ativo) + 10 }}
            aria-hidden
          >
            <p className="font-semibold">{rotulosX[ativo].longo}</p>
            {series.map((s) => (
              <p key={s.rotulo} className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{s.rotulo}</span>
                <span className="font-semibold tabular-nums">{s.valores[ativo] === null ? '—' : formatar(s.valores[ativo]!)}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {faixaInicial && faixaInicial.fim > 0 && (
        <figcaption className="flex items-start gap-2 text-sm text-muted-foreground">
          <span className="mt-1 size-3 shrink-0 rounded-sm bg-foreground/[0.07] ring-1 ring-border" aria-hidden />
          {faixaInicial.nota}
        </figcaption>
      )}

      <details className="text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center font-medium text-primary">Ver os números em tabela</summary>
        <div className="max-h-80 overflow-auto rounded-md border border-border">
          <table className="w-full text-left tabular-nums">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th scope="col" className="px-3 py-2 font-semibold">Rodada</th>
                {series.map((s) => (
                  <th key={s.rotulo} scope="col" className="px-3 py-2 text-right font-semibold">{s.rotulo}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rotulosX.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <th scope="row" className="px-3 py-1.5 font-normal">
                    {r.longo}
                    {avisos?.has(i) && <span className="ml-1 text-destructive">(parcial)</span>}
                  </th>
                  {series.map((s) => (
                    <td key={s.rotulo} className="px-3 py-1.5 text-right">{s.valores[i] === null ? '—' : formatar(s.valores[i]!)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
