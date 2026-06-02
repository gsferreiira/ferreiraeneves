import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6">
        <p className="text-[120px] sm:text-[160px] font-heading font-extrabold text-slate-900 leading-none tracking-tighter">
          4<span className="text-orange-500">0</span>4
        </p>
        <div className="space-y-2">
          <h1 className="text-2xl font-heading font-extrabold text-slate-900">Página não encontrada</h1>
          <p className="text-slate-500 text-sm">A página que você procura não existe ou foi movida.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20">
            <Home className="h-4 w-4" /> Ir para a Home
          </Link>
          <Link to="/imoveis" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
            <Search className="h-4 w-4" /> Ver imóveis
          </Link>
        </div>
      </div>
    </div>
  )
}
