declare module 'graphology-layout-forceatlas2' {
  import type Graph from 'graphology'
  const forceAtlas2: {
    assign: (graph: Graph, options?: { iterations?: number; settings?: Record<string, unknown> }) => void
    inferSettings: (graph: Graph) => Record<string, unknown>
  }
  export default forceAtlas2
}