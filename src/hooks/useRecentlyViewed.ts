import { useCallback, useEffect, useState } from 'react'

const KEY = 'fn_recently_viewed'
const MAX = 6

function load(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>(load)

  const track = useCallback((id: string) => {
    setIds(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, MAX)
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { ids, track }
}
