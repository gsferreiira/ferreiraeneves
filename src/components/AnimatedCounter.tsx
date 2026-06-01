import { useEffect, useState } from 'react'
import { useInView } from '@/hooks/useInView'

interface AnimatedCounterProps {
  target: number
  suffix?: string
  prefix?: string
  duration?: number
}

export function AnimatedCounter({ target, suffix = '', prefix = '', duration = 1400 }: AnimatedCounterProps) {
  const { ref, inView } = useInView()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView || target === 0) return
    let startTime: number | null = null
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    const raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, target, duration])

  return (
    <span ref={ref}>
      {prefix}{value}{suffix}
    </span>
  )
}
