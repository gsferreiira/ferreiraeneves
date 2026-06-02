import { createContext } from 'react'

export interface FavoritesContextValue {
  favorites: string[]
  toggle: (id: string) => void
  isFavorite: (id: string) => boolean
}

export const FavoritesContext = createContext<FavoritesContextValue | null>(null)
