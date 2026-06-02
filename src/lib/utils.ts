import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr))
}

export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function generateCodigo(): string {
  return `FN-${Date.now().toString(36).toUpperCase()}`
}

export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/,
    /youtube\.com\/.*[?&]v=([\w-]{11})/,
  ]
  for (const re of patterns) {
    const m = url.match(re)
    if (m) return `https://www.youtube.com/embed/${m[1]}`
  }
  return null
}

export const TIPO_IMOVEL_LABELS: Record<string, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  comercial: 'Comercial',
}

export const TIPO_NEGOCIO_LABELS: Record<string, string> = {
  venda: 'Venda',
  aluguel: 'Aluguel',
  ambos: 'Venda e Aluguel',
}

export const STATUS_IMOVEL_LABELS: Record<string, string> = {
  disponivel: 'Disponível',
  alugado: 'Alugado',
  vendido: 'Vendido',
  inativo: 'Inativo',
}

export const STATUS_CONTRATO_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  encerrado: 'Encerrado',
  pendente: 'Pendente',
}

export const STATUS_AGENDAMENTO_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  realizado: 'Realizado',
}
