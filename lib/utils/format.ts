import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function formatDateShort(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatRelative(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const DAY_OF_WEEK_MAP: Record<string, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

export const FREQUENCY_MAP: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
}

export const POSITION_MAP: Record<string, string> = {
  goleiro: 'Goleiro',
  zagueiro: 'Zagueiro',
  meia: 'Meia',
  atacante: 'Atacante',
}
