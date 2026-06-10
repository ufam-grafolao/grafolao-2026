import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

interface RotaProtegidaProps {
  children: React.ReactNode
  apenasAdmin?: boolean
}

export function RotaProtegida({ children, apenasAdmin = false }: RotaProtegidaProps) {
  const { isAutenticado, isAdmin } = useAuth()

  if (!isAutenticado()) {
    return <Navigate to="/login" replace />
  }

  if (apenasAdmin && !isAdmin()) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}