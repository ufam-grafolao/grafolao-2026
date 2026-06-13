import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useComunidades } from '@/hooks/use-comunidades'
import { useAuth } from '@/hooks/use-auth'
import ComunidadeCard from '@/components/cards/comunidade-card'
import CriarComunidadeModal from '@/components/modals/comunidade-criar.modal'
import BuscarComunidadeModal from '@/components/modals/comunidade-buscar.modal'
import ComunidadeDetalheModal from '@/components/modals/comunidade-detalhe.modal'
import type { ComunidadeResponse } from '@/types/comunidade'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNavigate } from 'react-router-dom'

const LIMITE_COMUNIDADES = 3

function ComunidadesGrid({
  comunidades,
  isLoading,
  donoId,
  onSelect,
}: {
  comunidades: ComunidadeResponse[] | undefined
  isLoading: boolean
  donoId: string
  onSelect: (id: string) => void
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!comunidades || comunidades.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {comunidades.map(c => (
        <ComunidadeCard
          key={c.id}
          comunidade={c}
          meuRole={c.donoId === donoId ? 'DONO' : undefined}
          onClick={() => onSelect(c.id)}
        />
      ))}
    </div>
  )
}

export default function ComunidadesPage() {
  const { usuario, token } = useAuth()
  const { data: comunidades, isLoading } = useComunidades()

  const navigate = useNavigate()

  const [modalCriar, setModalCriar] = useState(false)
  const [modalBuscar, setModalBuscar] = useState(false)
  const [comunidadeSelecionada, setComunidadeSelecionada] = useState<string | null>(null)

  const minhas = comunidades?.filter(c => c.membros.length > 0) ?? []
  const descobrir = comunidades?.filter(c => c.membros.length === 0) ?? []

  const podecriar = usuario?.role === 'ADMIN' || minhas.length < LIMITE_COMUNIDADES

  const semComunidades = !isLoading && comunidades?.length === 0

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Comunidades</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Dispute o ranking com seus amigos em grupos separados.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setModalBuscar(true)}>
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
          {podecriar && (
            <Button size="sm" onClick={() => setModalCriar(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar
            </Button>
          )}
        </div>
      </div>

      {/* Estado vazio */}
      {semComunidades && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-5xl">🏘️</span>
          <div>
            <p className="font-semibold">Você ainda não faz parte de nenhuma comunidade</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie a sua ou entre em uma existente para competir com seus amigos.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setModalBuscar(true)}>
              <Search className="h-4 w-4 mr-2" />
              Buscar comunidade
            </Button>
            <Button onClick={() => setModalCriar(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar comunidade
            </Button>
          </div>
        </div>
      )}

      {!semComunidades && (
        <Tabs defaultValue="minhas">
          <TabsList variant="line">
            <TabsTrigger value="minhas">
              Minhas comunidades
              {!isLoading && <span className="ml-1.5 text-xs text-muted-foreground">({minhas.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="descobrir">
              Descobrir
              {!isLoading && descobrir.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">({descobrir.length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="minhas" className="mt-4">
            <ComunidadesGrid
              comunidades={minhas}
              isLoading={isLoading}
              donoId={usuario?.id ?? ''}
              onSelect={(id) => navigate(`/comunidades/${id}`)}
            />
          </TabsContent>

          <TabsContent value="descobrir" className="mt-4">
            <ComunidadesGrid
              comunidades={descobrir}
              isLoading={isLoading}
              donoId={usuario?.id ?? ''}
              onSelect={(id) => navigate(`/comunidades/${id}`)}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Modais */}
      <CriarComunidadeModal open={modalCriar} onClose={() => setModalCriar(false)} />
      <BuscarComunidadeModal open={modalBuscar} onClose={() => setModalBuscar(false)} />
    </div>
  )
}