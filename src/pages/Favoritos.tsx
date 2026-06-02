import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PropertyCard } from '@/components/PropertyCard'
import { useFavorites } from '@/hooks/useFavorites'
import { useImoveisByIds } from '@/lib/queries'

export default function Favoritos() {
  const { favorites } = useFavorites()
  const { data: favoritados = [], isLoading } = useImoveisByIds(favorites)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="h-6 w-6 text-rose-500 fill-current" />
        <h1 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight">Meus Favoritos</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : favoritados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoritados.map(imovel => (
            <PropertyCard key={imovel.id} imovel={imovel} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Heart className="h-16 w-16 mx-auto text-slate-200 mb-4" />
          <p className="text-xl font-heading font-bold text-slate-700 mb-2">Nenhum favorito ainda</p>
          <p className="text-sm text-slate-400 mb-6">
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
