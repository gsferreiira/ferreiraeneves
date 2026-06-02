export interface Imovel {
  id: string
  codigo: string | null
  titulo: string
  descricao: string | null
  tipo_imovel: 'casa' | 'apartamento' | 'terreno' | 'comercial'
  tipo_negocio: 'venda' | 'aluguel' | 'ambos'
  rua: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string
  estado: string
  cep: string | null
  area_construida: number | null
  area_total: number | null
  quartos: number
  suites: number
  banheiros: number
  vagas: number
  preco_venda: number | null
  preco_locacao: number | null
  destaque: boolean
  status: 'disponivel' | 'alugado' | 'vendido' | 'inativo'
  fotos: string[]
  video_url: string | null
  proprietario_id: string | null
  proprietario?: Proprietario
  created_at: string
}

export interface Proprietario {
  id: string
  nome: string
  cpf_cnpj: string | null
  email: string | null
  telefone: string
  endereco: string | null
  banco: string | null
  agencia: string | null
  conta: string | null
  observacoes: string | null
  created_at: string
}

export interface Contrato {
  id: string
  numero: string | null
  tipo: 'venda' | 'aluguel'
  imovel_id: string
  proprietario_id: string
  imovel?: Pick<Imovel, 'id' | 'titulo' | 'codigo' | 'cidade'>
  proprietario?: Pick<Proprietario, 'id' | 'nome' | 'telefone'>
  nome_cliente: string
  cpf_cliente: string | null
  email_cliente: string | null
  telefone_cliente: string | null
  valor: number
  data_inicio: string
  data_fim: string | null
  dia_vencimento: number | null
  status: 'ativo' | 'encerrado' | 'pendente'
  observacoes: string | null
  created_at: string
}

export interface Agendamento {
  id: string
  imovel_id: string
  imovel?: Pick<Imovel, 'id' | 'titulo' | 'codigo' | 'bairro' | 'cidade'>
  nome_cliente: string
  email_cliente: string | null
  telefone_cliente: string
  data_hora: string
  tipo: 'visita' | 'reuniao'
  status: 'pendente' | 'confirmado' | 'cancelado' | 'realizado'
  observacoes: string | null
  created_at: string
}

export interface Configuracoes {
  id: number
  nome_empresa: string
  telefone: string | null
  whatsapp: string | null
  email: string | null
  endereco: string | null
  instagram: string | null
  facebook: string | null
  logo_url: string | null
  hero_titulo: string | null
  hero_subtitulo: string | null
  sobre_texto: string | null
  creci: string | null
}

export interface Usuario {
  id: string
  nome: string
  email: string
  telefone: string | null
  foto_url: string | null
  perfil: 'admin' | 'corretor'
  status: 'ativo' | 'inativo'
  created_at: string
}

export interface AuditLog {
  id: number
  tabela: string
  registro_id: string | null
  acao: 'INSERT' | 'UPDATE' | 'DELETE'
  usuario_id: string | null
  usuario_email: string | null
  dados_anteriores: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
  created_at: string
}

export type ImovelOrdem = 'recente' | 'preco_asc' | 'preco_desc'

export type ImovelFiltros = {
  tipo_imovel?: string
  tipo_negocio?: string
  cidade?: string
  quartos_min?: number
  preco_max?: number
  preco_min?: number
  busca?: string
  ordem?: ImovelOrdem
}
