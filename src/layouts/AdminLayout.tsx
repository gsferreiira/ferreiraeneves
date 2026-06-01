import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Home, FileText, UserCheck, CalendarDays,
  LogOut, Bell, Menu, X, UserCircle, Globe, Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const navGroups = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
      { label: 'Imóveis', icon: Home, path: '/admin/imoveis' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { label: 'Contratos', icon: FileText, path: '/admin/contratos' },
      { label: 'Proprietários', icon: UserCheck, path: '/admin/proprietarios' },
      { label: 'Agendamentos', icon: CalendarDays, path: '/admin/agendamentos' },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { label: 'Equipe', icon: Users, path: '/admin/equipe' },
    ],
  },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { signOut, user } = useAuth()

  const meta = user?.user_metadata ?? {}
  const nome = (meta.nome as string) || user?.email?.split('@')[0] || 'Admin'
  const fotoUrl = meta.foto_url as string | undefined
  const primeiraLetra = nome.charAt(0).toUpperCase()

  const handleLogout = async () => {
    await signOut()
    toast.info('Sessão encerrada. Até logo!')
    navigate('/admin/login')
  }

  const isActive = (path: string) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path)

  function NavItem({ item }: { item: { label: string; icon: React.ElementType; path: string } }) {
    const active = isActive(item.path)
    return (
      <Link
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
          active
            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
            : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100',
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    )
  }

  const Avatar = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizes = { sm: 'h-8 w-8 text-sm', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-lg' }
    return (
      <div className={cn('rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-white shadow-sm overflow-hidden shrink-0', sizes[size])}>
        {fotoUrl
          ? <img src={fotoUrl} alt={nome} className="w-full h-full object-cover" />
          : primeiraLetra
        }
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex bg-slate-50/50 relative">
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-60 bg-slate-950 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:shrink-0 shadow-2xl',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <Link to="/admin" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <img src="/logo.png" alt="Ferreira & Neves" width={36} height={36} className="object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="font-heading font-extrabold text-white text-lg tracking-tight">FN Admin</span>
          </Link>
          <button type="button" className="lg:hidden text-slate-400 hover:text-white p-1" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto sidebar-scroll">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => <NavItem key={item.path} item={item} />)}
              </div>
            </div>
          ))}
        </nav>

        {/* Perfil no fundo do sidebar */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link
            to="/admin/perfil"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all w-full',
              isActive('/admin/perfil')
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100',
            )}
          >
            <Avatar size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">{nome}</p>
              <p className="text-[10px] text-slate-500 truncate">Meu Perfil</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-400 hover:text-rose-400 w-full rounded-xl hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4 text-rose-500 shrink-0" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Conteúdo ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:min-h-0 lg:h-screen lg:overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-5 py-3.5 flex items-center justify-between z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button type="button" className="lg:hidden text-slate-600 hover:text-orange-500 transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-slate-700 font-bold text-sm hidden md:block">Gestão Inteligente</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Sino */}
            <button className="p-2 rounded-xl text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors">
              <Bell className="h-5 w-5" />
            </button>

            {/* Ver site */}
            <button
              onClick={() => navigate('/')}
              className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Globe className="h-3.5 w-3.5" /> Ver site
            </button>

            <div className="h-6 w-px bg-slate-200" />

            {/* Avatar dropdown */}
            <div className="relative z-50">
              <button
                type="button"
                onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2.5 cursor-pointer select-none"
              >
                <div className="hidden md:block text-right">
                  <p className="text-sm font-bold text-slate-900 leading-none">{nome}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Admin</p>
                </div>
                <Avatar size="md" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
                  {/* Cabeçalho dropdown */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Avatar size="md" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{nome}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="p-2">
                    <button
                      onClick={() => { navigate('/admin/perfil'); setProfileOpen(false) }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-700 text-sm font-semibold text-slate-700 transition-colors w-full text-left"
                    >
                      <UserCircle className="h-4 w-4 text-slate-400" />
                      Editar Perfil
                    </button>
                    <button
                      onClick={() => { navigate('/'); setProfileOpen(false) }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors w-full text-left"
                    >
                      <Globe className="h-4 w-4 text-slate-400" />
                      Ver Site
                    </button>
                  </div>

                  <div className="p-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-sm font-semibold text-rose-600 transition-colors w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-slate-50/50">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
