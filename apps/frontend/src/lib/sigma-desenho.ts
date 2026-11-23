// Desenho de rótulos e foco compartilhado pelos grafos em Sigma (Confrontos, Zebra, Panelinhas).
import type { NodeHoverDrawingFunction, NodeLabelDrawingFunction } from 'sigma/rendering'
import { COR_GRAFO as COR } from '@/lib/grafo-visual'

// ─── desenho dos rótulos: texto claro com contorno da cor do painel, legível sobre as arestas
export const desenharRotulo: NodeLabelDrawingFunction = (ctx, data, settings) => {
  if (!data.label) return
  const tamanho = settings.labelSize
  ctx.font = `${settings.labelWeight} ${tamanho}px ${settings.labelFont}`
  const largura = ctx.measureText(data.label).width
  const limite = ctx.canvas.clientWidth || ctx.canvas.width
  const cabe = data.x + data.size + 5 + largura <= limite - 4
  const x = cabe ? data.x + data.size + 5 : data.x - data.size - 5 - largura
  const y = data.y + tamanho / 3
  ctx.lineJoin = 'round'
  ctx.lineWidth = 4
  ctx.strokeStyle = COR.rotuloContorno
  ctx.strokeText(data.label, x, y)
  ctx.fillStyle = COR.rotulo
  ctx.fillText(data.label, x, y)
}

// Foco: anel claro em volta do nó + rótulo em pílula de vidro escuro.
// Desenha só o nó marcado como `highlighted` pelo nosso estado de foco: o Sigma 3.0.3 não limpa
// o nó em hover quando o mouse sai do canvas, e o anel ficaria preso.
export const desenharHover: NodeHoverDrawingFunction = (ctx, data, settings) => {
  if (!data.highlighted) return
  ctx.beginPath()
  ctx.arc(data.x, data.y, data.size + 3, 0, Math.PI * 2)
  ctx.lineWidth = 2
  ctx.strokeStyle = COR.rotulo
  ctx.stroke()
  if (!data.label) return
  const tamanho = settings.labelSize + 1
  ctx.font = `700 ${tamanho}px ${settings.labelFont}`
  const largura = ctx.measureText(data.label).width
  const limite = ctx.canvas.clientWidth || ctx.canvas.width
  const cabe = data.x + data.size + 14 + largura <= limite - 4
  const x = cabe ? data.x + data.size + 8 : data.x - data.size - 8 - largura
  const y = data.y
  const altura = tamanho + 10
  ctx.fillStyle = COR.pilula
  ctx.strokeStyle = COR.pilulaBorda
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(x - 6, y - altura / 2, largura + 12, altura, 6)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = COR.rotulo
  ctx.fillText(data.label, x, y + tamanho / 3)
}
