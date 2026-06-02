import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  const { data: perfil, isLoading: perfilLoading } = useQuery({
    queryKey: ['perfil-status', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null
      const { data } = await supabase
        .from('usuarios')
        .select('status')
        .eq('id', session.user.id)
        .maybeSingle()
      return data
    },
    enabled: !!session?.user?.id,
    staleTime: 1000 * 60 * 5,
  })

  if (loading || (session && perfilLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-orange-500" />
          <p className="text-sm text-slate-400 font-medium">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (perfil !== undefined && perfil !== null && perfil.status !== 'ativo') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
