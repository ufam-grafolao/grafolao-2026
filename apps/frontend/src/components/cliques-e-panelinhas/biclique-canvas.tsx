import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { createNodeImageProgram, NodeImageProgram } from '@sigma/node-image'
import { floatColor } from 'sigma/utils'
import { EdgeLineProgram, NodeProgram, Program, ProgramAttributeSpecification } from 'sigma/rendering'
import Graph from 'graphology'
import Sigma from 'sigma'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import { cn } from '@/lib/utils'
import type { Biclique, CliqueJogo, CliqueUsuario } from '@/types/cliques-e-panelinhas'

type NodeKind = 'user' | 'game'

export type BicliqueCardData = {
  indice: number
  biclique: Biclique
  usuarios: CliqueUsuario[]
  jogos: CliqueJogo[]
}

interface BicliqueCanvasProps {
  bicliques: BicliqueCardData[]
  selecionada: number
  onSelecionar: (indice: number) => void
}

type GraphNodeAttributes = {
  label: string
  kind: NodeKind
  memberships: number[]
  color: string
  size: number
  avatarUrl?: string
  image?: string
  type: 'circle' | 'image'
  x: number
  y: number
}

type GraphEdgeAttributes = {
  weight: number
  memberships: number[]
}

type ImageCacheEntry = {
  loaded: boolean
  errored: boolean
  localUrl?: string
  loading?: boolean
}

const imageCache = new Map<string, ImageCacheEntry>()
const pendingQueue: string[] = []
let isProcessingQueue = false
const BATCH_SIZE = 4
const BATCH_DELAY_MS = 250

function getCustomFragmentShader(texturesCount: number) {
  return `
precision highp float;

varying vec4 v_color;
varying vec2 v_diffVector;
varying float v_radius;
varying vec4 v_texture;
varying float v_textureIndex;

varying vec4 v_borderColor;
varying float v_borderSize;
varying float v_opacity;

uniform sampler2D u_atlas[${texturesCount}];
uniform float u_correctionRatio;
uniform float u_cameraAngle;
uniform float u_percentagePadding;
uniform bool u_colorizeImages;
uniform bool u_keepWithinCircle;

const vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);
const float radius = 0.5;

void main(void) {
  float aa = 2.0 * u_correctionRatio;
  float dist = length(v_diffVector);
  vec4 color = transparent;

  float c = cos(-u_cameraAngle);
  float s = sin(-u_cameraAngle);
  vec2 diffVector = mat2(c, s, -s, c) * (v_diffVector);

  #ifdef PICKING_MODE
  if (dist < v_radius) {
    gl_FragColor = v_color;
  } else {
    gl_FragColor = transparent;
  }
  #else
  // First case: No image to display
  if (v_texture.w <= 0.0) {
    color = v_color;
  }
  // Second case: Image loaded into the texture
  else {
    float paddingRatio = 1.0 + 2.0 * u_percentagePadding;
    float coef = 1.0;
    vec2 coordinateInTexture = diffVector * vec2(paddingRatio, -paddingRatio) / v_radius / 2.0 * coef + vec2(0.5, 0.5);
    int index = int(v_textureIndex + 0.5);

    bool noTextureFound = false;
    vec4 texel = transparent;

    ${Array.from({ length: texturesCount })
      .map((_, i) => `if (index == ${i}) texel = texture2D(u_atlas[${i}], (v_texture.xy + coordinateInTexture * v_texture.zw), -1.0);`)
      .join("\n    else ") || "texel = texture2D(u_atlas[0], (v_texture.xy + coordinateInTexture * v_texture.zw), -1.0);"}
    else {
      texel = texture2D(u_atlas[0], (v_texture.xy + coordinateInTexture * v_texture.zw), -1.0);
      noTextureFound = true;
    }

    if (noTextureFound) {
      color = v_color;
    } else {
      if (u_colorizeImages) {
        color = mix(transparent, v_color, texel.a);
      } else {
        color = vec4(mix(v_color.rgb, texel.rgb, texel.a), max(texel.a, v_color.a));
      }

      if (abs(diffVector.x) > v_radius / paddingRatio || abs(diffVector.y) > v_radius / paddingRatio) {
        color = v_color;
      }
    }
  }

  // Draw circle, border and apply opacity
  float borderWidth = v_borderSize * v_radius;
  float innerRadius = v_radius - borderWidth;

  vec4 finalColor = transparent;
  if (dist < innerRadius - aa) {
    finalColor = color;
  } else if (dist < innerRadius) {
    float t = (dist - (innerRadius - aa)) / aa;
    finalColor = mix(color, v_borderColor, t);
  } else if (dist < v_radius - aa) {
    finalColor = v_borderColor;
  } else if (dist < v_radius) {
    float t = (v_radius - dist) / aa;
    finalColor = mix(transparent, v_borderColor, t);
  }

  // Apply final opacity:
  finalColor.a *= v_opacity;

  // Premultiply alpha for correct blending in WebGL:
  gl_FragColor = vec4(finalColor.rgb * finalColor.a, finalColor.a);
  #endif
}
`;
}

const CUSTOM_VERTEX_SHADER = `
attribute vec4 a_id;
attribute vec4 a_color;
attribute vec2 a_position;
attribute float a_size;
attribute float a_angle;
attribute vec4 a_texture;
attribute float a_textureIndex;

attribute vec4 a_borderColor;
attribute float a_borderSize;
attribute float a_opacity;

uniform mat3 u_matrix;
uniform float u_sizeRatio;
uniform float u_correctionRatio;

varying vec4 v_color;
varying vec2 v_diffVector;
varying float v_radius;
varying vec4 v_texture;
varying float v_textureIndex;

varying vec4 v_borderColor;
varying float v_borderSize;
varying float v_opacity;

const float bias = 255.0 / 254.0;
const float marginRatio = 1.05;

void main() {
  float size = a_size * u_correctionRatio / u_sizeRatio * 4.0;
  vec2 diffVector = size * vec2(cos(a_angle), sin(a_angle));
  vec2 position = a_position + diffVector * marginRatio;
  gl_Position = vec4(
    (u_matrix * vec3(position, 1)).xy,
    0,
    1
  );

  v_diffVector = diffVector;
  v_radius = size / 2.0 / marginRatio;

  #ifdef PICKING_MODE
  v_color = a_id;
  #else
  v_color = a_color;
  v_textureIndex = a_textureIndex;
  v_texture = a_texture;
  #endif

  v_color.a *= bias;

  v_borderColor = a_borderColor;
  v_borderColor.a *= bias;
  v_borderSize = a_borderSize;
  v_opacity = a_opacity;
}
`;

// Standard TS mixin-constructor helper (see TS handbook's mixins pattern) —
// widens a class's instance type without an `unknown` bridge.
type Constructor<T = object> = new (...args: any[]) => T;

// Extends `NodeImageProgram` with properties and methods present in the underlying type but not exposed in the API.
const ImageBaseProgram = createNodeImageProgram() as Constructor<
  InstanceType<typeof NodeImageProgram> & {
    array: (typeof Program.prototype)["array"];
    getDefinition(): ReturnType<typeof Program.prototype.getDefinition>;
    processVisibleItem(...args: Parameters<typeof NodeProgram.prototype.processVisibleItem>): void;
  }
> & {
  textureManager: { getTextures(): unknown[] };
};

class CustomUserNodeProgram extends ImageBaseProgram {
  getDefinition() {
    const baseDef = super.getDefinition();
    return {
      ...baseDef,
      VERTEX_SHADER_SOURCE: CUSTOM_VERTEX_SHADER,
      FRAGMENT_SHADER_SOURCE: getCustomFragmentShader(ImageBaseProgram.textureManager.getTextures().length),
      ATTRIBUTES: [
        ...baseDef.ATTRIBUTES,
        {
          name: 'a_borderColor',
          size: 4,
          type: WebGLRenderingContext.UNSIGNED_BYTE,
          normalized: true
        },
        {
          name: 'a_borderSize',
          size: 1,
          type: WebGLRenderingContext.FLOAT
        },
        {
          name: 'a_opacity',
          size: 1,
          type: WebGLRenderingContext.FLOAT
        }
      ]
    };
  }

  processVisibleItem(nodeIndex: number, startIndex: number, data: any) {
    super.processVisibleItem(nodeIndex, startIndex, data);
    const offset = startIndex + 10;
    const borderColor = data.borderColor || '#000000';
    const borderSize = typeof data.borderSize === 'number' ? data.borderSize : 0.0;
    const opacity = typeof data.opacity === 'number' ? data.opacity : 1.0;

    this.array[offset] = floatColor(borderColor);
    this.array[offset + 1] = borderSize;
    this.array[offset + 2] = opacity;
  }
}

class CustomEdgeProgram extends EdgeLineProgram {
  getDefinition() {
    const baseDef = super.getDefinition();
    return {
      ...baseDef,
      FRAGMENT_SHADER_SOURCE: `
precision mediump float;
varying vec4 v_color;

void main(void) {
  #ifdef PICKING_MODE
  gl_FragColor = v_color;
  #else
  gl_FragColor = vec4(v_color.rgb * v_color.a, v_color.a);
  #endif
}
      `
    };
  }
}

const activeRefreshes = new Set<() => void>()
let refreshFrameId: number | null = null

function scheduleRefreshes() {
  if (refreshFrameId !== null) return
  refreshFrameId = requestAnimationFrame(() => {
    refreshFrameId = null
    activeRefreshes.forEach((refresh) => refresh())
  })
}

async function processQueue() {
  if (isProcessingQueue || pendingQueue.length === 0) return
  isProcessingQueue = true

  while (pendingQueue.length > 0) {
    const batch = pendingQueue.splice(0, BATCH_SIZE)

    await Promise.all(
      batch.map(async (url) => {
        const entry = imageCache.get(url)
        if (!entry || entry.loaded || entry.errored) return

        entry.loading = true
        try {
          const response = await fetch(url, { cache: 'force-cache' })
          if (!response.ok) {
            throw new Error(`Failed to fetch avatar ${response.status}`)
          }
          const blob = await response.blob()
          entry.localUrl = URL.createObjectURL(blob)
          entry.loaded = true
        } catch (e) {
          entry.errored = true
        } finally {
          entry.loading = false
          scheduleRefreshes()
        }
      })
    )

    if (pendingQueue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  isProcessingQueue = false
}

function requestImageLoad(url: string | undefined) {
  if (!url) return undefined

  let entry = imageCache.get(url)
  if (!entry) {
    entry = {
      loaded: false,
      errored: false,
      loading: false,
    }
    imageCache.set(url, entry)
  }

  if (entry.loaded || entry.errored) {
    return entry
  }

  if (!entry.loading && !pendingQueue.includes(url)) {
    pendingQueue.push(url)
    void processQueue()
  }

  return entry
}

function clamp(valor: number, minimo: number, maximo: number) {
  return Math.min(maximo, Math.max(minimo, valor))
}

function hashString(texto: string) {
  let hash = 0
  for (let indice = 0; indice < texto.length; indice++) {
    hash = (hash * 31 + texto.charCodeAt(indice)) >>> 0
  }
  return hash
}

function seededRandom(seed: number) {
  let state = seed || 1
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff
  }
}

function getNomeJogo(jogo: CliqueJogo) {
  const casa = jogo.timeCasa ?? 'Casa'
  const visitante = jogo.timeVisitante ?? 'Visitante'
  return `${casa} x ${visitante}`
}

function buildGraph(bicliques: BicliqueCardData[]) {
  const graph = new Graph<GraphNodeAttributes, GraphEdgeAttributes>({ type: 'undirected', multi: false })
  const memberships = new Map<string, Set<number>>()
  const edgeMemberships = new Map<string, Set<number>>()
  const edgeWeights = new Map<string, number>()

  bicliques.forEach((biclique, indice) => {
    const userIds = biclique.usuarios.map(usuario => usuario.id)
    const gameIds = biclique.jogos.map(jogo => jogo.id)
    const userColor = indice === 0 ? '#f59e0b' : indice === 1 ? '#38bdf8' : '#fb7185'
    const gameColor = indice === 0 ? '#fbbf24' : indice === 1 ? '#7dd3fc' : '#fda4af'

    for (const usuario of biclique.usuarios) {
      const nodeKey = `user:${usuario.id}`
      const currentMemberships = memberships.get(nodeKey) ?? new Set<number>()
      currentMemberships.add(indice)
      memberships.set(nodeKey, currentMemberships)

      if (!graph.hasNode(nodeKey)) {
        const random = seededRandom(hashString(nodeKey))
        graph.addNode(nodeKey, {
          label: usuario.nome,
          kind: 'user',
          memberships: [...currentMemberships],
          color: userColor,
          size: 20,
          avatarUrl: usuario.avatarUrl ?? undefined,
          image: undefined,
          type: 'circle',
          x: random() * 2 - 1,
          y: random() * 2 - 1,
        })
      } else {
        graph.mergeNodeAttributes(nodeKey, {
          label: usuario.nome,
          memberships: [...currentMemberships],
          color: userColor,
          avatarUrl: usuario.avatarUrl ?? (graph.getNodeAttribute(nodeKey, 'avatarUrl') as string | undefined),
          image: undefined,
          type: 'circle',
        })
      }
    }

    for (const jogo of biclique.jogos) {
      const nodeKey = `game:${jogo.id}`
      const currentMemberships = memberships.get(nodeKey) ?? new Set<number>()
      currentMemberships.add(indice)
      memberships.set(nodeKey, currentMemberships)

      if (!graph.hasNode(nodeKey)) {
        const random = seededRandom(hashString(nodeKey))
        graph.addNode(nodeKey, {
          label: getNomeJogo(jogo),
          kind: 'game',
          memberships: [...currentMemberships],
          color: gameColor,
          size: 18,
          type: 'circle',
          x: random() * 2 - 1,
          y: random() * 2 - 1,
        })
      } else {
        graph.mergeNodeAttributes(nodeKey, {
          label: getNomeJogo(jogo),
          memberships: [...currentMemberships],
          color: gameColor,
          type: 'circle',
        })
      }
    }

    for (const usuarioId of userIds) {
      for (const jogoId of gameIds) {
        const edgeKey = `${usuarioId}::${jogoId}`
        edgeWeights.set(edgeKey, (edgeWeights.get(edgeKey) ?? 0) + 1)
        const membershipSet = edgeMemberships.get(edgeKey) ?? new Set<number>()
        membershipSet.add(indice)
        edgeMemberships.set(edgeKey, membershipSet)
      }
    }
  })

  for (const [edgeKey, weight] of edgeWeights) {
    const [usuarioId, jogoId] = edgeKey.split('::')
    const source = `user:${usuarioId}`
    const target = `game:${jogoId}`
    if (!graph.hasNode(source) || !graph.hasNode(target)) continue

    if (graph.hasEdge(source, target)) {
      const currentWeight = (graph.getEdgeAttribute(source, target, 'weight') as number) ?? 0
      const currentMemberships = (graph.getEdgeAttribute(source, target, 'memberships') as number[]) ?? []
      graph.setEdgeAttribute(source, target, 'weight', currentWeight + weight)
      graph.setEdgeAttribute(source, target, 'memberships', [...new Set([...currentMemberships, ...(edgeMemberships.get(edgeKey) ?? new Set())])])
    } else {
      graph.addEdge(source, target, {
        weight,
        memberships: [...(edgeMemberships.get(edgeKey) ?? new Set())],
      })
    }
  }

  return graph
}

export function BicliqueCanvas({ bicliques, selecionada, onSelecionar }: BicliqueCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<Sigma<any, any, any> | null>(null)
  const graphRef = useRef<Graph<GraphNodeAttributes, GraphEdgeAttributes> | null>(null)
  const selecionadaRef = useRef(selecionada)
  const isDarkRef = useRef(false)
  const [height, setHeight] = useState(720)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    selecionadaRef.current = selecionada
  }, [selecionada])

  useEffect(() => {
    isDarkRef.current = isDark
  }, [isDark])

  const selecionadaData = useMemo(
    () => bicliques.find(item => item.indice === selecionada) ?? bicliques[0],
    [bicliques, selecionada]
  )

  const totalUsuarios = useMemo(
    () => new Set(bicliques.flatMap(item => item.usuarios.map(usuario => usuario.id))).size,
    [bicliques]
  )

  const totalJogos = useMemo(
    () => new Set(bicliques.flatMap(item => item.jogos.map(jogo => jogo.id))).size,
    [bicliques]
  )

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return
      const largura = Math.floor(entry.contentRect.width)
      const base = 620 + Math.max(totalUsuarios, totalJogos) * 5
      setHeight(clamp(base, 700, 920))
      if (largura > 0 && rendererRef.current) {
        rendererRef.current.refresh()
      }
    })

    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [totalJogos, totalUsuarios])

  useEffect(() => {
    const container = containerRef.current
    if (!container || bicliques.length === 0) return

    let cancelled = false

    const triggerRefresh = () => {
      if (!cancelled && rendererRef.current) {
        rendererRef.current.refresh()
      }
    }
    activeRefreshes.add(triggerRefresh)

    rendererRef.current?.kill()

    const graph = buildGraph(bicliques)
    graphRef.current = graph

    forceAtlas2.assign(graph, {
      iterations: 140,
      settings: forceAtlas2.inferSettings(graph),
    })

    const renderer = new Sigma(graph, container, {
      nodeProgramClasses: {
        image: CustomUserNodeProgram
      },
      edgeProgramClasses: {
        line: CustomEdgeProgram
      },
      defaultDrawNodeHover: ()=>{},
      renderEdgeLabels: false,
      labelRenderedSizeThreshold: 10,
      defaultNodeColor: isDarkRef.current ? '#334155' : '#94a3b8',
      defaultEdgeColor: isDarkRef.current ? 'rgba(148,163,184,0.05)' : 'rgba(148,163,184,0.05)',
      defaultEdgeType: 'line',
      defaultNodeType: 'circle',
      labelColor: { color: isDarkRef.current ? '#e2e8f0' : '#0f172a' },
      nodeReducer: (node, data) => {
        const memberships = (graph.getNodeAttribute(node, 'memberships') as number[]) ?? []
        const kind = graph.getNodeAttribute(node, 'kind') as NodeKind
        const selected = memberships.includes(selecionadaRef.current)
        const isUser = kind === 'user'
        const avatarUrl = graph.getNodeAttribute(node, 'avatarUrl') as string | undefined
        const imageEntry = requestImageLoad(avatarUrl)
        return {
          ...data,
          label: isUser ? '' : graph.getNodeAttribute(node, 'label') as string,
          highlighted: false,
          color: selected ? '#38bdf8' : '#94a3b8',
          size: isUser ? 20 : 18,
          zIndex: selected ? 2 : 1,
          image: imageEntry?.loaded && !imageEntry.errored ? imageEntry.localUrl : undefined,
          type: 'image',
          borderColor: isUser ? (selected ? '#f59e0b' : '#94a3b8') : undefined,
          borderSize: isUser ? 0.15 : 0.0,
          opacity: selected ? 1.0 : 0.3,
          hidden: false,
        }
      },
      edgeReducer: (edge, data) => {
        const memberships = (graph.getEdgeAttribute(edge, 'memberships') as number[]) ?? []
        const selected = memberships.includes(selecionadaRef.current)
        return {
          ...data,
          color: selected ? 'rgba(59,130,246,0.5)' : (isDarkRef.current ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.15)'),
          size: selected ? 2.2 : 1.2,
          hidden: false,
        }
      },
    })

    rendererRef.current = renderer
    renderer.on('clickNode', ({ node }) => {
      const memberships = (graph.getNodeAttribute(node, 'memberships') as number[]) ?? []
      if (memberships.length > 0) onSelecionar(memberships[0])
    })
    renderer.on('clickStage', () => onSelecionar(selecionadaRef.current))

    renderer.refresh()

    return () => {
      cancelled = true
      activeRefreshes.delete(triggerRefresh)
      renderer.kill()
      rendererRef.current = null
      graphRef.current = null
    }
  }, [bicliques, onSelecionar])

  useEffect(() => {
    rendererRef.current?.refresh()
  }, [selecionada, isDark])

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="mt-1 text-lg font-semibold">Top 3 panelinhas</h3>
          <p className="text-sm text-muted-foreground">
            O grafo abaixo demonstra um subgrafo induzido pelos 3 maiores bicliques maximais do grafo, mostrando como os usuários e jogos se conectam entre si nas top 3 maiores panelinhas. As panelinhas são escolhidas de acordo com os filtros e ordenação aplicados na acima.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {bicliques.map(item => (
            <button
              key={item.indice}
              type="button"
              onClick={() => onSelecionar(item.indice)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs transition-colors',
                selecionada === item.indice
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              Top {item.indice + 1} · {item.usuarios.length} x {item.jogos.length}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-border/70" style={{ height }}>
        <div ref={containerRef} className="h-full w-full" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {bicliques.map(item => (
          <span key={item.indice} className="rounded-full border border-border bg-background px-2.5 py-1">
            Top {item.indice + 1} · {item.usuarios.length} usuários · {item.jogos.length} jogos
          </span>
        ))}
      </div>

      {selecionadaData && (
        <p className="mt-2 text-xs text-muted-foreground">
          Selecionada: {selecionadaData.usuarios.length} usuários, {selecionadaData.jogos.length} jogos. {totalUsuarios} usuários únicos · {totalJogos} jogos únicos.
        </p>
      )}
    </div>
  )
}
