import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
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
    // preserva a URL de destino para redirecionar após login
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
