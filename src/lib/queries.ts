import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, IMOVEIS_BUCKET } from './supabase'
import type { Imovel, Proprietario, Contrato, Agendamento, Configuracoes, ImovelFiltros, AuditLog, Artigo, Usuario, CorretorPublico } from '@/types'

// ─── Imóveis ────────────────────────────────────────────────────────────────

export function useImoveis(filtros?: ImovelFiltros) {
  return useQuery({
    queryKey: ['imoveis', filtros],
    queryFn: async () => {
      let q = supabase
        .from('imoveis')
        .select('*, proprietario:proprietarios(id,nome,telefone)')
        .eq('status', 'disponivel')

      if (filtros?.tipo_imovel) q = q.eq('tipo_imovel', filtros.tipo_imovel)
      if (filtros?.tipo_negocio) q = q.or(`tipo_negocio.eq.${filtros.tipo_negocio},tipo_negocio.eq.ambos`)
      if (filtros?.cidade) q = q.ilike('cidade', `%${filtros.cidade}%`)
      if (filtros?.quartos_min) q = q.gte('quartos', filtros.quartos_min)
      if (filtros?.banheiros_min) q = q.gte('banheiros', filtros.banheiros_min)
      if (filtros?.vagas_min) q = q.gte('vagas', filtros.vagas_min)
      if (filtros?.caracteristica) q = q.contains('caracteristicas', [filtros.caracteristica])
      if (filtros?.preco_min) {
        const campoMin = filtros.tipo_negocio === 'aluguel' ? 'preco_locacao' : 'preco_venda'
        q = q.gte(campoMin, filtros.preco_min)
      }
      if (filtros?.preco_max) {
        const campoMax = filtros.tipo_negocio === 'aluguel' ? 'preco_locacao' : 'preco_venda'
        q = q.lte(campoMax, filtros.preco_max)
      }
      if (filtros?.busca) {
        q = q.or(`titulo.ilike.%${filtros.busca}%,bairro.ilike.%${filtros.busca}%,cidade.ilike.%${filtros.busca}%`)
      }

      const campoPreco = filtros?.tipo_negocio === 'aluguel' ? 'preco_locacao' : 'preco_venda'
      switch (filtros?.ordem) {
        case 'preco_asc':
          q = q.order(campoPreco, { ascending: true, nullsFirst: false })
          break
        case 'preco_desc':
          q = q.order(campoPreco, { ascending: false, nullsFirst: false })
          break
        default:
          q = q.order('destaque', { ascending: false }).order('created_at', { ascending: false })
      }

      const { data, error } = await q
      if (error) throw error
      return data as Imovel[]
    },
  })
}

export function useImoveisDestaques() {
  return useQuery({
    queryKey: ['imoveis', 'destaques'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('status', 'disponivel')
        .eq('destaque', true)
        .order('created_at', { ascending: false })
        .limit(6)
      if (error) throw error
      return data as Imovel[]
    },
  })
}

export function useImovel(id: string) {
  return useQuery({
    queryKey: ['imovel', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imoveis')
        .select('*, proprietario:proprietarios(id,nome,telefone)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Imovel
    },
    enabled: !!id,
  })
}

// Busca por lista de IDs (usado em Favoritos — mostra mesmo se status mudar)
export function useImoveisByIds(ids: string[]) {
  return useQuery({
    queryKey: ['imoveis', 'by-ids', ids.slice().sort()],
    queryFn: async () => {
      if (ids.length === 0) return []
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Imovel[]
    },
    enabled: ids.length > 0,
  })
}

// Admin: lista todos os imóveis independente do status
export function useImoveisAdmin() {
  return useQuery({
    queryKey: ['imoveis', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imoveis')
        .select('*, proprietario:proprietarios(id,nome)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Imovel[]
    },
  })
}

export function useCreateImovel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<Imovel, 'id' | 'created_at' | 'proprietario'>) => {
      const { data, error } = await supabase.from('imoveis').insert(payload).select().single()
      if (error) throw error
      return data as Imovel
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['imoveis'] }),
  })
}

export function useUpdateImovel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Imovel> & { id: string }) => {
      const { data, error } = await supabase.from('imoveis').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data as Imovel
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['imoveis'] })
      // Invalida também o cache da query individual para o formulário de edição
      qc.invalidateQueries({ queryKey: ['imovel', data.id] })
    },
  })
}

export function useDeleteImovel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('imoveis').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['imoveis'] }),
  })
}

export async function uploadFoto(file: File): Promise<string> {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : undefined
  if (!ext) throw new Error('Arquivo sem extensão válida')
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(IMOVEIS_BUCKET).upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from(IMOVEIS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteFoto(url: string): Promise<void> {
  const path = url.split(`/${IMOVEIS_BUCKET}/`)[1]
  if (!path) return
  await supabase.storage.from(IMOVEIS_BUCKET).remove([path])
}

// ─── Proprietários ──────────────────────────────────────────────────────────

export function useProprietarios() {
  return useQuery({
    queryKey: ['proprietarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proprietarios')
        .select('*')
        .order('nome')
      if (error) throw error
      return data as Proprietario[]
    },
  })
}

export function useProprietario(id: string) {
  return useQuery({
    queryKey: ['proprietario', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('proprietarios').select('*').eq('id', id).single()
      if (error) throw error
      return data as Proprietario
    },
    enabled: !!id,
  })
}

export function useCreateProprietario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<Proprietario, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('proprietarios').insert(payload).select().single()
      if (error) throw error
      return data as Proprietario
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proprietarios'] }),
  })
}

export function useUpdateProprietario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Proprietario> & { id: string }) => {
      const { data, error } = await supabase.from('proprietarios').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data as Proprietario
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proprietarios'] }),
  })
}

export function useDeleteProprietario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('proprietarios').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proprietarios'] }),
  })
}

// ─── Corretores (equipe) ──────────────────────────────────────────────────────

// Admin: lista de corretores/admins ativos para atrelar a um imóvel
export function useCorretores() {
  return useQuery({
    queryKey: ['corretores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, perfil, foto_url, telefone')
        .eq('status', 'ativo')
        .order('nome')
      if (error) throw error
      return data as Pick<Usuario, 'id' | 'nome' | 'perfil' | 'foto_url' | 'telefone'>[]
    },
  })
}

// Usuário logado (linha da tabela `usuarios` — fonte de verdade do perfil)
export function useUsuarioAtual() {
  return useQuery({
    queryKey: ['usuario-atual'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id
      if (!uid) return null
      const { data, error } = await supabase.from('usuarios').select('*').eq('id', uid).maybeSingle()
      if (error) throw error
      return data as Usuario | null
    },
  })
}

// Público: dados de contato do corretor de um imóvel (view sem e-mail)
export function useCorretorPublico(id: string) {
  return useQuery({
    queryKey: ['corretor-publico', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corretores_publicos')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data as CorretorPublico | null
    },
    enabled: !!id,
  })
}

// ─── Contratos ──────────────────────────────────────────────────────────────

export function useContratos() {
  return useQuery({
    queryKey: ['contratos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos')
        .select('*, imovel:imoveis(id,titulo,codigo,cidade), proprietario:proprietarios(id,nome,telefone)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Contrato[]
    },
  })
}

export function useContrato(id: string) {
  return useQuery({
    queryKey: ['contrato', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos')
        .select('*, imovel:imoveis(id,titulo,codigo,cidade), proprietario:proprietarios(id,nome,telefone)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Contrato
    },
    enabled: !!id,
  })
}

export function useCreateContrato() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<Contrato, 'id' | 'created_at' | 'imovel' | 'proprietario'>) => {
      const { data, error } = await supabase.from('contratos').insert(payload).select().single()
      if (error) throw error
      return data as Contrato
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contratos'] }),
  })
}

export function useUpdateContrato() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Contrato> & { id: string }) => {
      const { data, error } = await supabase.from('contratos').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data as Contrato
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contratos'] }),
  })
}

export function useDeleteContrato() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contratos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contratos'] }),
  })
}

// ─── Agendamentos ───────────────────────────────────────────────────────────

export function useAgendamentos() {
  return useQuery({
    queryKey: ['agendamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*, imovel:imoveis(id,titulo,codigo,bairro,cidade)')
        .order('data_hora', { ascending: true })
      if (error) throw error
      return data as Agendamento[]
    },
  })
}

export function useMarcarAgendamentoLido() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agendamentos').update({ lido: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendamentos'] }),
  })
}

export function useCreateAgendamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<Agendamento, 'id' | 'created_at' | 'imovel' | 'lido'>) => {
      const { data, error } = await supabase.from('agendamentos').insert(payload).select().single()
      if (error) throw error
      return data as Agendamento
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendamentos'] }),
  })
}

export function useUpdateAgendamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Agendamento> & { id: string }) => {
      const { data, error } = await supabase.from('agendamentos').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data as Agendamento
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendamentos'] }),
  })
}

export function useDeleteAgendamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agendamentos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendamentos'] }),
  })
}

// ─── Configurações ──────────────────────────────────────────────────────────

export function useConfiguracoes() {
  return useQuery({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      // maybeSingle: retorna null em vez de erro 406 quando a linha não existe
      // ou a policy de leitura pública ainda não foi aplicada.
      const { data, error } = await supabase.from('configuracoes').select('*').maybeSingle()
      if (error) throw error
      return data as Configuracoes | null
    },
  })
}

export function useUpdateConfiguracoes() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Configuracoes>) => {
      const { data, error } = await supabase.from('configuracoes').update(payload).eq('id', 1).select().single()
      if (error) throw error
      return data as Configuracoes
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['configuracoes'] }),
  })
}

// ─── Auditoria ──────────────────────────────────────────────────────────────

export function useAuditLog({ tabela, acao, limit = 100 }: { tabela?: string; acao?: string; limit?: number }) {
  return useQuery({
    queryKey: ['audit_log', tabela, acao, limit],
    queryFn: async () => {
      let q = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (tabela && tabela !== 'todas') q = q.eq('tabela', tabela)
      if (acao && acao !== 'todas') q = q.eq('acao', acao)
      const { data, error } = await q
      if (error) throw error
      return data as AuditLog[]
    },
  })
}

// ─── Dashboard stats ────────────────────────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [imoveis, contratos, agendamentos, proprietarios] = await Promise.all([
        supabase.from('imoveis').select('id, status', { count: 'exact' }),
        supabase.from('contratos').select('id, status, tipo, valor'),
        supabase.from('agendamentos').select('id, status, data_hora').gte('data_hora', new Date().toISOString()),
        supabase.from('proprietarios').select('id', { count: 'exact' }),
      ])

      if (imoveis.error) throw imoveis.error
      if (contratos.error) throw contratos.error
      if (agendamentos.error) throw agendamentos.error
      if (proprietarios.error) throw proprietarios.error

      const totalImoveis = imoveis.count ?? 0
      const imoveisDisponiveis = imoveis.data?.filter(i => i.status === 'disponivel').length ?? 0
      const contratosAtivos = contratos.data?.filter(c => c.status === 'ativo').length ?? 0
      const receitaTotal = contratos.data?.filter(c => c.status === 'ativo').reduce((s, c) => s + (c.valor ?? 0), 0) ?? 0
      const agendamentosPendentes = agendamentos.data?.filter(a => a.status === 'pendente').length ?? 0
      const totalProprietarios = proprietarios.count ?? 0

      return { totalImoveis, imoveisDisponiveis, contratosAtivos, receitaTotal, agendamentosPendentes, totalProprietarios }
    },
  })
}

// ─── Imóveis Similares ───────────────────────────────────────────────────────

export async function incrementarVisualizacao(id: string): Promise<void> {
  await supabase.rpc('incrementar_visualizacao', { p_id: id })
}

export function useImoveisSimilares(imovelId: string, tipoImovel: string, cidade: string) {
  return useQuery({
    queryKey: ['imoveis-similares', imovelId, tipoImovel, cidade],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('status', 'disponivel')
        .eq('tipo_imovel', tipoImovel)
        .ilike('cidade', `%${cidade}%`)
        .neq('id', imovelId)
        .order('destaque', { ascending: false })
        .limit(3)
      if (error) throw error
      return data as Imovel[]
    },
    enabled: !!imovelId && !!tipoImovel && !!cidade,
  })
}

// ─── Blog ────────────────────────────────────────────────────────────────────

export function useArtigos(apenasPublicados = true) {
  return useQuery({
    queryKey: ['artigos', apenasPublicados],
    queryFn: async () => {
      let q = supabase.from('artigos').select('*').order('created_at', { ascending: false })
      if (apenasPublicados) q = q.eq('publicado', true)
      const { data, error } = await q
      if (error) throw error
      return data as Artigo[]
    },
  })
}

export function useArtigo(slug: string) {
  return useQuery({
    queryKey: ['artigo', slug],
    queryFn: async () => {
      const { data, error } = await supabase.from('artigos').select('*').eq('slug', slug).single()
      if (error) throw error
      return data as Artigo
    },
    enabled: !!slug,
  })
}

export function useArtigoById(id: string) {
  return useQuery({
    queryKey: ['artigo-id', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('artigos').select('*').eq('id', id).single()
      if (error) throw error
      return data as Artigo
    },
    enabled: !!id,
  })
}

export function useCreateArtigo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<Artigo, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('artigos').insert(payload).select().single()
      if (error) throw error
      return data as Artigo
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['artigos'] }),
  })
}

export function useUpdateArtigo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Artigo> & { id: string }) => {
      const { data, error } = await supabase.from('artigos').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data as Artigo
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['artigos'] }),
  })
}

export function useDeleteArtigo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('artigos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['artigos'] }),
  })
}
