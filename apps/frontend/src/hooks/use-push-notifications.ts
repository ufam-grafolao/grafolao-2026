import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { apiFetch } from '@/lib/api-client'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

async function getVapidKey(): Promise<string> {
  const data = await apiFetch<{ key: string }>('/push/vapid-public-key')
  return data.key
}

type Estado = 'carregando' | 'sem-suporte' | 'negado' | 'inscrito' | 'nao-inscrito'

export function usePushNotifications() {
  const { token } = useAuth()
  const [estado, setEstado] = useState<Estado>('carregando')
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setEstado('sem-suporte')
      return
    }

    navigator.serviceWorker.register('/sw.js').then(async () => {
      if (Notification.permission === 'denied') {
        setEstado('negado')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setEstado(sub ? 'inscrito' : 'nao-inscrito')
    })
  }, [])

  async function ativar() {
    setProcessando(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setEstado('negado')
        return
      }

      const vapidKey = await getVapidKey()
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const subJson = sub.toJSON()
      await apiFetch('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
      })

      setEstado('inscrito')
    } catch {
      setEstado('nao-inscrito')
    } finally {
      setProcessando(false)
    }
  }

  async function desativar() {
    setProcessando(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await apiFetch('/push/unsubscribe', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setEstado('nao-inscrito')
    } catch {
      setEstado('inscrito')
    } finally {
      setProcessando(false)
    }
  }

  return { estado, processando, ativar, desativar }
}
