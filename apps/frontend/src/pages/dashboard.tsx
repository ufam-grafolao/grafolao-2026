import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useJogosHoje } from '@/hooks/use-jogos-hoje'
import { Skeleton } from '@/components/ui/skeleton'
import JogoCard from '@/components/jogos/jogo-card'
import { useResumo } from '@/hooks/use-resumo'

export function DashboardPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { data: jogos, isLoading } = useJogosHoje()
  const { data: resumo, isLoading: loadingResumo } = useResumo()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Olá, {usuario?.nome.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bem-vindo ao Grafolão 2026
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Seus pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingResumo
              ? <Skeleton className="h-9 w-16" />
              : <p className="text-3xl font-semibold">{resumo?.pontos ?? 0}</p>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Acertos Completos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingResumo
              ? <Skeleton className="h-9 w-16" />
              : <p className="text-3xl font-semibold">
                  {resumo?.acertosCompletos ?? 0}
                </p>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Acertos Parciais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingResumo
              ? <Skeleton className="h-9 w-16" />
              : <p className="text-3xl font-semibold">
                  {resumo?.acertosParciais ?? 0}
                </p>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Palpites feitos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingResumo
              ? <Skeleton className="h-9 w-16" />
              : <p className="text-3xl font-semibold">{resumo?.totalPalpites ?? 0}</p>
            }
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Jogos de hoje</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('/jogos')}>
          Ver todos →
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : jogos && jogos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
          {jogos.map((jogo) => (
            <JogoCard key={jogo.id} jogo={jogo} mostrarBotaoPalpite />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Nenhum jogo hoje. Aproveite pra ver os próximos jogos!
            <Button variant="link" className="block mx-auto mt-2" onClick={() => navigate('/jogos')}>
              Ver calendário completo
            </Button>
          </CardContent>
        </Card>
      )}
      
    </div>
  )
}