import type { ReactNode } from 'react'
import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils'

type Direction = 'up' | 'left' | 'right' | 'none'

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: Direction
  threshold?: number
}

const directionClass: Record<Direction, string> = {
  up: 'animate-fade-up',
  left: 'animate-fade-left',
  right: 'animate-fade-right',
  none: 'animate-fade-in',
}

export function FadeIn({ children, className, delay = 0, direction = 'up', threshold }: FadeInProps) {
  const { ref, inView } = useInView(threshold)
  return (
    <div
      ref={ref}
      className={cn(inView ? directionClass[direction] : 'opacity-0', className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
