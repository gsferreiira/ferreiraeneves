import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X, Home, ArrowUpDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PropertyCard } from '@/components/PropertyCard'
import { useImoveis } from '@/lib/queries'
import type { ImovelFiltros, ImovelOrdem } from '@/types'
import { CARACTERISTICAS_OPCOES } from '@/types'
import { cn } from '@/lib/utils'

const ORDEM_LABEL: Record<ImovelOrdem, string> = {
  recente: 'Mais recentes',
  preco_asc: 'Menor preço',
  preco_desc: 'Maior preço',
}

function readFilters(params: URLSearchParams): ImovelFiltros {
  return {
    busca: params.get('busca') ?? undefined,
    tipo_imovel: params.get('tipo_imovel') ?? undefined,
    tipo_negocio: params.get('tipo_negocio') ?? undefined,
    cidade: params.get('cidade') ?? undefined,
    quartos_min: params.get('quartos_min') ? Number(params.get('quartos_min')) : undefined,
    banheiros_min: params.get('banheiros_min') ? Number(params.get('banheiros_min')) : undefined,
    vagas_min: params.get('vagas_min') ? Number(params.get('vagas_min')) : undefined,
    preco_min: params.get('preco_min') ? Number(params.get('preco_min')) : undefined,
    preco_max: params.get('preco_max') ? Number(params.get('preco_max')) : undefined,
    caracteristica: params.get('caracteristica') ?? undefined,
    ordem: (params.get('ordem') as ImovelOrdem) || undefined,
  }
}

export default function Imoveis() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [filtros, setFiltros] = useState<ImovelFiltros>(() => readFilters(searchParams))

  const { data: imoveis = [], isLoading } = useImoveis(filtros)

  useEffect(() => {
    const params: Record<string, string> = {}
    if (filtros.busca) params.busca = filtros.busca
    if (filtros.tipo_imovel) params.tipo_imovel = filtros.tipo_imovel
    if (filtros.tipo_negocio) params.tipo_negocio = filtros.tipo_negocio
    if (filtros.cidade) params.cidade = filtros.cidade
    if (filtros.quartos_min) params.quartos_min = String(filtros.quartos_min)
    if (filtros.banheiros_min) params.banheiros_min = String(filtros.banheiros_min)
    if (filtros.vagas_min) params.vagas_min = String(filtros.vagas_min)
    if (filtros.preco_min) params.preco_min = String(filtros.preco_min)
    if (filtros.preco_max) params.preco_max = String(filtros.preco_max)
    if (filtros.caracteristica) params.caracteristica = filtros.caracteristica
    if (filtros.ordem) params.ordem = filtros.ordem
    setSearchParams(params, { replace: true })
  }, [filtros, setSearchParams])

  function limparFiltros() { setFiltros({}); setShowFilters(false) }

  const temFiltros = Object.values(filtros).some(Boolean)
  const filtrosAtivos = [
    filtros.tipo_negocio, filtros.tipo_imovel, filtros.quartos_min,
    filtros.banheiros_min, filtros.vagas_min,
    filtros.preco_min, filtros.preco_max, filtros.cidade, filtros.caracteristica,
  ].filter(Boolean).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">Imóveis</h1>
        <p className="text-slate-500 text-sm mt-1">
          {isLoading ? 'Buscando...' : `${imoveis.length} imóvel(is) encontrado(s)`}
        </p>
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Cidade, bairro ou tipo..."
              value={filtros.busca ?? ''}
              onChange={e => setFiltros(f => ({ ...f, busca: e.target.value || undefined }))}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all shadow-sm"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'h-11 px-4 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all shadow-sm whitespace-nowrap',
              showFilters || filtrosAtivos > 0
                ? 'bg-orange-500 text-white border-orange-500 shadow-orange-200'
                : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {filtrosAtivos > 0 && (
              <span className="h-5 w-5 bg-white/30 rounded-full text-xs flex items-center justify-center font-black">
                {filtrosAtivos}
              </span>
            )}
          </button>

          {temFiltros && (
            <button
              onClick={limparFiltros}
              className="h-11 w-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
              aria-label="Limpar filtros"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Ordenação — visível apenas em sm+; em mobile fica dentro dos filtros */}
        <div className="hidden sm:flex items-center justify-end gap-2 text-xs">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Ordenar:</span>
          <Select
            value={filtros.ordem ?? 'recente'}
            onValueChange={v => setFiltros(f => ({ ...f, ordem: v === 'recente' ? undefined : v as ImovelOrdem }))}
          >
            <SelectTrigger className="h-8 w-44 rounded-lg border-slate-200 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recente">{ORDEM_LABEL.recente}</SelectItem>
              <SelectItem value="preco_asc">{ORDEM_LABEL.preco_asc}</SelectItem>
              <SelectItem value="preco_desc">{ORDEM_LABEL.preco_desc}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Filtros avançados</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Ordenação visível apenas no mobile (sm+ usa a barra separada) */}
              <div className="col-span-2 sm:hidden">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Ordenar por</label>
                <Select value={filtros.ordem ?? 'recente'} onValueChange={v => setFiltros(f => ({ ...f, ordem: v === 'recente' ? undefined : v as ImovelOrdem }))}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recente">{ORDEM_LABEL.recente}</SelectItem>
                    <SelectItem value="preco_asc">{ORDEM_LABEL.preco_asc}</SelectItem>
                    <SelectItem value="preco_desc">{ORDEM_LABEL.preco_desc}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Negócio</label>
                <Select value={filtros.tipo_negocio ?? 'todos'} onValueChange={v => setFiltros(f => ({ ...f, tipo_negocio: v === 'todos' ? undefined : v }))}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="aluguel">Aluguel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Tipo</label>
                <Select value={filtros.tipo_imovel ?? 'todos'} onValueChange={v => setFiltros(f => ({ ...f, tipo_imovel: v === 'todos' ? undefined : v }))}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
                    <SelectItem value="terreno">Terreno</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Cidade</label>
                <input type="text" placeholder="Ex: Curitiba"
                  value={filtros.cidade ?? ''}
                  onChange={e => setFiltros(f => ({ ...f, cidade: e.target.value || undefined }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Quartos mín.</label>
                <Select value={filtros.quartos_min?.toString() ?? 'todos'} onValueChange={v => setFiltros(f => ({ ...f, quartos_min: v === 'todos' ? undefined : Number(v) }))}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm"><SelectValue placeholder="Qualquer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Qualquer</SelectItem>
                    <SelectItem value="1">1+ quarto</SelectItem>
                    <SelectItem value="2">2+ quartos</SelectItem>
                    <SelectItem value="3">3+ quartos</SelectItem>
                    <SelectItem value="4">4+ quartos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Banheiros mín.</label>
                <Select value={filtros.banheiros_min?.toString() ?? 'todos'} onValueChange={v => setFiltros(f => ({ ...f, banheiros_min: v === 'todos' ? undefined : Number(v) }))}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm"><SelectValue placeholder="Qualquer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Qualquer</SelectItem>
                    <SelectItem value="1">1+ banheiro</SelectItem>
                    <SelectItem value="2">2+ banheiros</SelectItem>
                    <SelectItem value="3">3+ banheiros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Vagas mín.</label>
                <Select value={filtros.vagas_min?.toString() ?? 'todos'} onValueChange={v => setFiltros(f => ({ ...f, vagas_min: v === 'todos' ? undefined : Number(v) }))}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm"><SelectValue placeholder="Qualquer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Qualquer</SelectItem>
                    <SelectItem value="1">1+ vaga</SelectItem>
                    <SelectItem value="2">2+ vagas</SelectItem>
                    <SelectItem value="3">3+ vagas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Preço mínimo (R$)</label>
                <input type="number" min={0} placeholder="0"
                  value={filtros.preco_min ?? ''}
                  onChange={e => setFiltros(f => ({ ...f, preco_min: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Preço máximo (R$)</label>
                <input type="number" min={0} placeholder="Sem limite"
                  value={filtros.preco_max ?? ''}
                  onChange={e => setFiltros(f => ({ ...f, preco_max: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all" />
              </div>

              <div className="col-span-2 sm:col-span-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Característica</label>
                <Select value={filtros.caracteristica ?? 'todos'} onValueChange={v => setFiltros(f => ({ ...f, caracteristica: v === 'todos' ? undefined : v }))}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm"><SelectValue placeholder="Qualquer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Qualquer</SelectItem>
                    {CARACTERISTICAS_OPCOES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : imoveis.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {imoveis.map(imovel => (
            <PropertyCard key={imovel.id} imovel={imovel} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-20 text-center">
          <Home className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-600 mb-1">Nenhum imóvel encontrado</p>
          <p className="text-sm text-slate-400 mb-5">Tente outros filtros ou termos de busca.</p>
          {temFiltros && (
            <button onClick={limparFiltros} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}
