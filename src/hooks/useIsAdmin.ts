import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export function useIsAdmin(): boolean {
  const { user } = useAuth()
  const { data } = useQuery({
    queryKey: ['perfil-atual', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data } = await supabase
        .from('usuarios')
        .select('perfil, status')
        .eq('id', user.id)
        .maybeSingle()
      return data
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })
  if (!user) return false
  if (!data) return false
  return data.status === 'ativo' && data.perfil === 'admin'
}
