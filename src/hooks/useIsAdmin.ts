import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export function useIsAdmin(): boolean {
  const { user } = useAuth()
  const { data } = useQuery({
    queryKey: ['perfil-atual', user?.email],
    queryFn: async () => {
      if (!user?.email) return null
      const { data } = await supabase
        .from('usuarios')
        .select('perfil, status')
        .eq('email', user.email)
        .maybeSingle()
      return data
    },
    enabled: !!user?.email,
    staleTime: 1000 * 60 * 5,
  })
  // Se não há registro em `usuarios`, considera admin (compat com setup inicial)
  if (!user) return false
  if (!data) return true
  return data.status === 'ativo' && data.perfil === 'admin'
}
