import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PropertyCard } from '@/components/PropertyCard'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useImoveis } from '@/lib/queries'

export default function Favoritos() {
  const { favorites } = useFavorites()
  const { data: imoveis = [] } = useImoveis()
  const favoritados = imoveis.filter(i => favorites.includes(i.id))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="h-6 w-6 text-red-500 fill-current" />
        <h1 className="text-2xl font-bold">Meus Favoritos</h1>
      </div>

      {favoritados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoritados.map(imovel => (
            <PropertyCard key={imovel.id} imovel={imovel} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-xl font-semibold text-muted-foreground mb-2">Nenhum favorito ainda</p>
          <p className="text-sm text-muted-foreground mb-6">
            Clique no coração nos cards para salvar imóveis aqui.
          </p>
          <Button asChild>
            <Link to="/imoveis">Ver Imóveis</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
