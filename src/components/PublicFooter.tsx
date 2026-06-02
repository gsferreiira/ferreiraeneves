import { Link } from 'react-router-dom'
import { Share2, Camera, Globe, MapPin, Phone, Mail } from 'lucide-react'
import { useConfiguracoes } from '@/lib/queries'

export function PublicFooter() {
  const { data: config } = useConfiguracoes()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-950 text-white pt-16 pb-8 border-t-4 border-orange-500 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600 rounded-full blur-[120px] opacity-10 pointer-events-none translate-x-1/2 -translate-y-1/2" />

      <div className="container mx-auto px-4 max-w-7xl relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Ferreira & Neves" width={40} height={40} className="object-contain shrink-0" />
              <div>
                <h3 className="text-lg font-heading font-extrabold text-white tracking-tight">Ferreira & Neves</h3>
                <p className="text-[10px] text-slate-400 font-bold tracking-[0.15em] uppercase">Empreendimentos Imobiliários</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {config?.sobre_texto ?? 'Seus imóveis em confiança. As melhores soluções em compra, venda e locação.'}
            </p>
            {config?.creci && <p className="text-xs font-bold text-slate-500 tracking-wider">{config.creci}</p>}
            <div className="flex gap-3 pt-1">
              {config?.facebook && (
                <a href={config.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                  className="h-9 w-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-orange-500 hover:text-white hover:scale-110 transition-all duration-200 text-slate-400 border border-white/5 hover:border-orange-500">
                  <Share2 className="h-4 w-4" />
                </a>
              )}
              {config?.instagram && (
                <a href={config.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                  className="h-9 w-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-orange-500 hover:text-white hover:scale-110 transition-all duration-200 text-slate-400 border border-white/5 hover:border-orange-500">
                  <Camera className="h-4 w-4" />
                </a>
              )}
              <a href="#" aria-label="Web"
                className="h-9 w-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-orange-500 hover:text-white hover:scale-110 transition-all duration-200 text-slate-400 border border-white/5 hover:border-orange-500">
                <Globe className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-sm font-bold text-white mb-5 relative inline-block">
              Links
              <span className="absolute -bottom-1.5 left-0 w-6 h-0.5 bg-orange-500 rounded-full" />
            </h4>
            <ul className="space-y-3.5 text-slate-400 text-sm">
              <li><Link to="/" className="hover:text-orange-400 transition-colors font-medium">Início</Link></li>
              <li><Link to="/imoveis" className="hover:text-orange-400 transition-colors font-medium">Imóveis</Link></li>
              <li><Link to="/blog" className="hover:text-orange-400 transition-colors font-medium">Blog</Link></li>
              <li><Link to="/favoritos" className="hover:text-orange-400 transition-colors font-medium">Favoritos</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-sm font-bold text-white mb-5 relative inline-block">
              Serviços
              <span className="absolute -bottom-1.5 left-0 w-6 h-0.5 bg-orange-500 rounded-full" />
            </h4>
            <ul className="space-y-3.5 text-slate-400 text-sm font-medium">
              <li className="hover:text-orange-400 transition-colors cursor-default">Compra de Imóveis</li>
              <li className="hover:text-orange-400 transition-colors cursor-default">Venda de Imóveis</li>
              <li className="hover:text-orange-400 transition-colors cursor-default">Locação e Administração</li>
              <li className="hover:text-orange-400 transition-colors cursor-default">Avaliação de Imóveis</li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-sm font-bold text-white mb-5 relative inline-block">
              Contato
              <span className="absolute -bottom-1.5 left-0 w-6 h-0.5 bg-orange-500 rounded-full" />
            </h4>
            <ul className="space-y-3.5 text-slate-400 text-sm">
              {config?.endereco && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>{config.endereco}</span>
                </li>
              )}
              {config?.telefone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-orange-500 shrink-0" />
                  <a href={`tel:${config.telefone}`} className="hover:text-orange-400 transition-colors">{config.telefone}</a>
                </li>
              )}
              {config?.email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-orange-500 shrink-0" />
                  <a href={`mailto:${config.email}`} className="hover:text-orange-400 transition-colors">{config.email}</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
          <p>
            <Link to="/admin" className="cursor-default hover:text-slate-400 transition-colors">
              © {currentYear} Ferreira & Neves.
            </Link>
            {' '}Todos os direitos reservados.
          </p>
          <p>Empreendimentos Imobiliários</p>
        </div>
      </div>
    </footer>
  )
}
