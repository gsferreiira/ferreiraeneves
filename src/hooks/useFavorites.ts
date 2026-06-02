import { useContext } from 'react'
import { FavoritesContext } from '@/contexts/favorites-context'

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites deve ser usado dentro de FavoritesProvider')
  return ctx
}
