import { ConfirmStack, ConfirmToast, ToastStack } from '@/components/ui/toast'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: number
  type: ToastType
  title: string
  desc?: string
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, desc?: string) => void
  confirm: (title: string, desc: string, onConfirm: () => void) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: ToastType, title: string, desc?: string) => {
    const id = ++counter
    setToasts(prev => [...prev, { id, type, title, desc }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const [confirms, setConfirms] = useState<ConfirmToast[]>([])

  const confirm = useCallback((title: string, desc: string, onConfirm: () => void) => {
    const id = ++counter
    setConfirms(prev => [...prev, { id, title, desc, onConfirm }])
    setTimeout(() => setConfirms(prev => prev.filter(c => c.id !== id)), 8000)
  }, [])

  const dismissConfirm = (id: number) =>
    setConfirms(prev => prev.filter(c => c.id !== id))

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />
      <ConfirmStack
        confirms={confirms}
        onConfirm={(id, fn) => { dismissConfirm(id); fn() }}
        onDismiss={dismissConfirm}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}