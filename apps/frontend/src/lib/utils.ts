import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarHoraJogo(dataHora: string) {
  const date = new Date(dataHora)
  const hora = date.getUTCHours().toString().padStart(2, '0')
  const minuto = date.getUTCMinutes().toString().padStart(2, '0')
  return `${hora}:${minuto}`
}

export function formatarDataHoraJogo(dataHora: string) {
  const date = new Date(dataHora)
  const day = date.getUTCDate().toString()
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  const hora = date.getUTCHours().toString().padStart(2, '0')
  const minuto = date.getUTCMinutes().toString().padStart(2, '0')
  return `${day}/${month}, ${hora}:${minuto}`
}

export function formatarDataJogo(dataHora: string) {
  const date = new Date(dataHora)
  const day = date.getUTCDate().toString()
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  return `${day}/${month}`
}