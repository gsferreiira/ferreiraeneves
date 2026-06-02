import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, MessageCircle, Heart, Home, Search } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import { useConfiguracoes } from '@/lib/queries'
import { cn } from '@/lib/utils'

const navLinks = [
  { name: 'Início', path: '/' },
  { name: 'Imóveis', path: '/imoveis' },
  { name: 'Sobre', path: '/#sobre' },
  { name: 'Contato', path: '/#contato' },
]

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { favorites } = useFavorites()
  const { data: config } = useConfiguracoes()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMenuOpen])

  const handleNav = (path: string) => {
    setIsMenuOpen(false)
    if (path.startsWith('/#')) {
      const id = path.replace('/#', '')
      if (location.pathname !== '/') {
        navigate('/')
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 400)
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate(path)
      window.scrollTo(0, 0)
    }
  }

  const isActive = (path: string) => {
    if (path.startsWith('/#')) return false
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const whatsapp = config?.whatsapp ?? ''

  return (
    <>
      <header className={cn(
        'fixed top-0 left-0 right-0 z-40 w-full bg-white transition-all duration-300',
        isScrolled ? 'shadow-md py-2' : 'border-b border-slate-100 py-3 md:py-4',
      )}>
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 md:gap-3 group" onClick={() => window.scrollTo(0, 0)}>
            <img
              src="/logo.png"
              alt="Ferreira & Neves"
              width={48}
              height={48}
              className="h-10 w-10 md:h-12 md:w-12 object-contain group-hover:scale-105 transition-transform"
            />
            <div className="leading-none flex flex-col justify-center">
              <span className="text-lg md:text-xl font-heading font-extrabold text-slate-900 tracking-tight">
                Ferreira & Neves
              </span>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 tracking-[0.15em] uppercase mt-0.5">
                Empreendimentos Imobiliários
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(link => (
              <button
                key={link.name}
                type="button"
                onClick={() => handleNav(link.path)}
                className={cn(
                  'relative py-2 text-sm font-bold transition-colors group',
                  isActive(link.path) ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600',
                )}
              >
                {link.name}
                <span className={cn(
                  'absolute bottom-0 left-0 h-[2px] bg-orange-500 transition-all duration-300 rounded-full',
                  isActive(link.path) ? 'w-full' : 'w-0 group-hover:w-full',
                )} />
              </button>
            ))}

            <div className="h-5 w-px bg-slate-200" />

            <Link to="/favoritos" className="relative flex items-center text-slate-400 hover:text-rose-500 transition-colors">
              <Heart className={cn('h-5 w-5', favorites.length > 0 ? 'fill-rose-500 text-rose-500' : '')} />
              {favorites.length > 0 && (
                <span className="absolute -top-1.5 -right-2 h-4 w-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {favorites.length}
                </span>
              )}
            </Link>

            {whatsapp && (
              <a
                href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm shadow-orange-200 hover:shadow-md hover:shadow-orange-200"
              >
                <MessageCircle className="h-4 w-4" />
                Fale conosco
              </a>
            )}
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            <Link to="/favoritos" className="relative p-2 text-slate-400 hover:text-rose-500 transition-colors">
              <Heart className={cn('h-6 w-6', favorites.length > 0 ? 'fill-rose-500 text-rose-500' : '')} />
              {favorites.length > 0 && (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>
            <button type="button" onClick={() => setIsMenuOpen(true)} className="p-2 text-slate-600 hover:text-orange-600 transition-colors">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <div className="h-[68px] md:h-[88px] w-full shrink-0" />

      {/* Mobile overlay */}
      <div
        className={cn(
          'md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300',
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile drawer */}
      <div className={cn(
        'md:hidden fixed top-0 right-0 h-dvh w-full max-w-[280px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out',
        isMenuOpen ? 'translate-x-0' : 'translate-x-full',
      )}>
        <div className="flex items-center justify-between p-5 pb-0">
          <img src="/logo.png" alt="Ferreira & Neves" width={36} height={36} className="object-contain" />
          <button type="button" onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 flex flex-col">
          {navLinks.map(link => (
            <button
              key={link.name}
              type="button"
              onClick={() => handleNav(link.path)}
              className={cn(
                'w-full flex items-center justify-between px-6 py-4 border-b border-slate-50 transition-all group',
                isActive(link.path) ? 'bg-orange-50' : '',
              )}
            >
              <span className={cn(
                'text-xs tracking-[0.2em] uppercase font-bold transition-colors',
                isActive(link.path) ? 'text-orange-600' : 'text-slate-500 group-hover:text-slate-900',
              )}>
                {link.name}
              </span>
              {isActive(link.path) && <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
            </button>
          ))}
        </div>

        {whatsapp && (
          <div className="p-6 bg-slate-50">
            <a
              href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-slate-950 hover:bg-slate-800 transition-colors text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg"
            >
              <MessageCircle className="h-4 w-4" />
              Fale com um Corretor
            </a>
          </div>
        )}
      </div>

      {/* WhatsApp floating button */}
      {whatsapp && (
        <a
          href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'fixed bottom-20 right-5 md:bottom-6 md:right-6 z-30 bg-[#25D366] text-white p-3.5 rounded-full shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center hover:bg-[#20bd5a]',
            isMenuOpen ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100',
          )}
          aria-label="WhatsApp"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around py-2">
          <Link to="/" className={cn('flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors', location.pathname === '/' ? 'text-orange-600' : 'text-slate-400')}>
            <Home className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-wide">Início</span>
          </Link>
          <Link to="/imoveis" className={cn('flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors', location.pathname.startsWith('/imoveis') ? 'text-orange-600' : 'text-slate-400')}>
            <Search className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-wide">Buscar</span>
          </Link>
          <Link to="/favoritos" className={cn('flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors relative', location.pathname === '/favoritos' ? 'text-rose-500' : 'text-slate-400')}>
            <Heart className={cn('h-5 w-5', favorites.length > 0 ? 'fill-rose-500 text-rose-500' : '')} />
            {favorites.length > 0 && (
              <span className="absolute top-0.5 right-2.5 h-3.5 w-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {favorites.length}
              </span>
            )}
            <span className="text-[9px] font-bold uppercase tracking-wide">Salvos</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
