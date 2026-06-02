import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bed, Bath, Maximize, MapPin, Heart, Car, Images, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useFavorites } from '@/hooks/useFavorites'
import { cn } from '@/lib/utils'
import type { Imovel } from '@/types'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800'

const statusColor: Record<string, string> = {
  alugado: 'bg-amber-500',
  vendido: 'bg-red-500',
  inativo: 'bg-slate-500',
}

interface PropertyCardProps {
  imovel: Imovel
  animDelay?: number
}

export function PropertyCard({ imovel, animDelay = 0 }: PropertyCardProps) {
  const { isFavorite, toggle } = useFavorites()
  const [imgSrc, setImgSrc] = useState(imovel.fotos?.[0] || PLACEHOLDER)
  const [imgLoaded, setImgLoaded] = useState(false)
  const price = imovel.preco_venda ?? imovel.preco_locacao
  const favored = isFavorite(imovel.id)

  return (
    <div
      className="animate-fade-up"
      style={animDelay ? { animationDelay: `${animDelay}ms` } : undefined}
    >
      <Link
        to={`/imoveis/${imovel.id}`}
        className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      >
        <div className="relative h-52 overflow-hidden m-1.5 rounded-xl bg-slate-100">
          {/* Placeholder enquanto carrega */}
          <div className={cn(
            'absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 transition-opacity duration-500',
            imgLoaded ? 'opacity-0' : 'opacity-100 animate-pulse',
          )} />
          <img
            src={imgSrc}
            alt={imovel.titulo}
            loading="lazy"
            decoding="async"
            className={cn(
              'absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ease-in-out',
              imgLoaded ? 'opacity-100' : 'opacity-0',
            )}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgSrc(PLACEHOLDER); setImgLoaded(true) }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute top-2.5 left-2.5 flex gap-1.5 z-10 flex-wrap max-w-[calc(100%-44px)]">
            <span className="bg-white/95 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide shadow">
              {imovel.tipo_negocio === 'venda' ? 'Venda' : imovel.tipo_negocio === 'aluguel' ? 'Aluguel' : 'Venda/Aluguel'}
            </span>
            {imovel.destaque && (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide shadow flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-white" /> Destaque
              </span>
            )}
            {imovel.status !== 'disponivel' && (
              <span className={cn('text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide shadow', statusColor[imovel.status] ?? 'bg-slate-700')}>
                {imovel.status === 'alugado' ? 'Alugado' : imovel.status === 'vendido' ? 'Vendido' : 'Inativo'}
              </span>
            )}
          </div>

          {imovel.fotos?.length > 1 && (
            <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur">
              <Images className="h-3 w-3" /> {imovel.fotos.length}
            </div>
          )}

          <button
            type="button"
            onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(imovel.id) }}
            className="absolute top-2.5 right-2.5 z-10 h-11 w-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow hover:bg-white transition-all"
            aria-label="Favoritar"
          >
            <Heart className={cn('h-4 w-4 transition-all', favored ? 'fill-rose-500 text-rose-500' : 'text-slate-400')} />
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <p className="text-[10px] font-bold text-orange-500 tracking-widest uppercase mb-1">
            {imovel.tipo_imovel === 'casa' ? 'Casa' : imovel.tipo_imovel === 'apartamento' ? 'Apartamento' : imovel.tipo_imovel === 'terreno' ? 'Terreno' : 'Comercial'}
            {imovel.bairro ? ` · ${imovel.bairro}` : ''}
          </p>
          <h3 className="font-heading font-bold text-slate-900 text-base line-clamp-2 mb-3 leading-snug group-hover:text-orange-600 transition-colors">
            {imovel.titulo}
          </h3>

          <div className="mt-auto space-y-3">
            <div className="flex items-center gap-3 text-slate-500 text-xs font-medium border-t border-slate-100 pt-3">
              {imovel.quartos > 0 && (
                <span className="flex items-center gap-1">
                  <Bed className="h-3.5 w-3.5 text-orange-400" />
                  {imovel.quartos}
                </span>
              )}
              {imovel.banheiros > 0 && (
                <span className="flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5 text-orange-400" />
                  {imovel.banheiros}
                </span>
              )}
              {imovel.vagas > 0 && (
                <span className="flex items-center gap-1">
                  <Car className="h-3.5 w-3.5 text-orange-400" />
                  {imovel.vagas}
                </span>
              )}
              {!!((imovel.area_construida ?? imovel.area_total)) && (
                <span className="flex items-center gap-1">
                  <Maximize className="h-3.5 w-3.5 text-orange-400" />
                  {imovel.area_construida ?? imovel.area_total}m²
                </span>
              )}
              <span className="flex items-center gap-1 ml-auto">
                <MapPin className="h-3.5 w-3.5 text-slate-300" />
                <span className="text-slate-400">{imovel.cidade}</span>
              </span>
            </div>

            <div className="flex items-end justify-between">
              <div>
                {!!price && (
                  <p className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                    {formatCurrency(price)}
                  </p>
                )}
                {!imovel.preco_venda && !!imovel.preco_locacao && (
                  <p className="text-xs text-slate-400 font-medium mt-0.5">/mês</p>
                )}
              </div>
              <div aria-hidden="true" role="presentation" className="h-8 w-8 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center group-hover:bg-orange-500 group-hover:border-orange-500 transition-all duration-300 pointer-events-none">
                <svg className="h-3.5 w-3.5 text-orange-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
