import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number | null, decimals = 2): string {
  if (n === null) return '—'
  return n.toFixed(decimals)
}

export function gradeColor(letter: string): string {
  const l = letter.charAt(0).toUpperCase()
  if (l === 'A' || l === 'O') return 'grade-a'
  if (l === 'B') return 'grade-b'
  if (l === 'C') return 'grade-c'
  if (l === 'D') return 'grade-d'
  return 'grade-f'
}

export function standingColor(standing: string): string {
  if (standing === 'Distinction') return 'badge-success'
  if (standing === 'First Class') return 'badge-accent'
  if (standing === 'Second Class') return 'badge-warning'
  if (standing === 'Pass') return 'badge-neutral'
  if (standing === 'Fail') return 'badge-danger'
  return 'badge-neutral'
}
