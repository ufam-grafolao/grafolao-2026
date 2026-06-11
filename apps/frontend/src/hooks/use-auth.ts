import { Usuario } from '@/types/usuario'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStore {
  token: string | null
  usuario: Usuario | null
  setAuth: (token: string, usuario: Usuario) => void
  logout: () => void
  isAdmin: () => boolean
  isAutenticado: () => boolean
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      usuario: null,
      setAuth: (token, usuario) => set({ token, usuario }),
      logout: () => set({ token: null, usuario: null }),
      isAdmin: () => get().usuario?.role === 'ADMIN',
      isAutenticado: () => !!get().token,
    }),
    {
      name: 'grafolao-auth',
    }
  )
)