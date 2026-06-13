import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

const config: Record<ToastType, { icon: React.ReactNode; accent: string }> = {
  success: { icon: <CheckCircle className="h-4 w-4" />, accent: 'border-emerald-500 [&_.toast-icon]:text-emerald-500' },
  error:   { icon: <XCircle className="h-4 w-4" />,     accent: 'border-red-500 [&_.toast-icon]:text-red-500' },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, accent: 'border-amber-500 [&_.toast-icon]:text-amber-500' },
  info:    { icon: <Info className="h-4 w-4" />,          accent: 'border-blue-500 [&_.toast-icon]:text-blue-500' },
}

interface ToastItemProps {
  id: number
  type: ToastType
  title: string
  desc?: string
  onDismiss: (id: number) => void
}

export interface ConfirmToast {
  id: number
  title: string
  desc: string
  onConfirm: () => void
}

function ConfirmItem({ id, title, desc, onConfirm, onDismiss }: ConfirmToast & {
  onConfirm: () => void
  onDismiss: (id: number) => void
}) {
  const [hiding, setHiding] = useState(false)

  const dismiss = () => {
    setHiding(true)
    setTimeout(() => onDismiss(id), 180)
  }

  return (
    <div className={cn(
        'flex items-start gap-3 px-3.5 py-3 rounded-lg border bg-background cursor-pointer',
        'transition-all duration-200',
        hiding ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0',
      )}>
      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{title}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>}
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={() => { dismiss(); onConfirm() }}
            className="text-xs px-2.5 py-1 rounded-md bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
          >
            Confirmar
          </button>
          <button
            onClick={dismiss}
            className="text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmStack({ confirms, onConfirm, onDismiss }: {
  confirms: ConfirmToast[]
  onConfirm: (id: number, fn: () => void) => void
  onDismiss: (id: number) => void
}) {
  return (
    <div className="fixed top-[10%] left-1/2 -translate-x-1/2 z-9999 flex flex-col gap-2 w-[280px] max-w-[340px]">
      {confirms.map(c => (
        <ConfirmItem
          key={c.id}
          {...c}
          onConfirm={() => onConfirm(c.id, c.onConfirm)}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}


function ToastItem({ id, type, title, desc, onDismiss }: ToastItemProps) {
  const [hiding, setHiding] = useState(false)
  const { icon, accent } = config[type]

  const dismiss = () => {
    setHiding(true)
    setTimeout(() => onDismiss(id), 180)
  }

  useEffect(() => {
    const t = setTimeout(dismiss, 3500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      onClick={dismiss}
      className={cn(
        'flex items-start gap-3 px-3.5 py-3 rounded-lg border bg-background cursor-pointer',
        'transition-all duration-200',
        hiding ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0',
        accent
      )}
    >
      <span className="toast-icon mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{title}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>}
      </div>
      <X className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
    </div>
  )
}

interface ToastStackProps {
  toasts: { id: number; type: ToastType; title: string; desc?: string }[]
  onDismiss: (id: number) => void
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="fixed top-[3%] left-1/2 -translate-x-1/2 z-9999 flex flex-col gap-2 w-[280px] max-w-[340px]">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}