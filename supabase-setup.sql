-- ============================================================
-- FERREIRA & NEVES — Setup do Banco de Dados (Supabase)
-- Execute este arquivo inteiro no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela de usuários/administradores
CREATE TABLE usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  telefone text,
  foto_url text,
  perfil text DEFAULT 'admin',
  status text DEFAULT 'ativo',
  created_at timestamptz DEFAULT now()
);

-- 2. Tabela de proprietários dos imóveis
CREATE TABLE proprietarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf_cnpj text,
  email text,
  telefone text NOT NULL,
  endereco text,
  banco text,
  agencia text,
  conta text,
  observacoes text,
  created_at timestamptz DEFAULT now()
);

-- 3. Tabela de imóveis
CREATE TABLE imoveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE,
  titulo text NOT NULL,
  descricao text,
  tipo_imovel text NOT NULL,
  tipo_negocio text NOT NULL,
  rua text,
  numero text,
  complemento text,
  bairro text,
  cidade text NOT NULL,
  estado text NOT NULL,
  cep text,
  area_construida numeric,
  area_total numeric,
  quartos integer DEFAULT 0,
  suites integer DEFAULT 0,
  banheiros integer DEFAULT 0,
  vagas integer DEFAULT 0,
  preco_venda numeric,
  preco_locacao numeric,
  destaque boolean DEFAULT false,
  status text DEFAULT 'disponivel',
  fotos text[] DEFAULT '{}',
  video_url text,
  proprietario_id uuid REFERENCES proprietarios(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. Tabela de contratos
CREATE TABLE contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE,
  tipo text NOT NULL,
  imovel_id uuid REFERENCES imoveis(id) ON DELETE RESTRICT,
  proprietario_id uuid REFERENCES proprietarios(id) ON DELETE RESTRICT,
  nome_cliente text NOT NULL,
  cpf_cliente text,
  email_cliente text,
  telefone_cliente text,
  valor numeric NOT NULL,
  data_inicio date NOT NULL,
  data_fim date,
  dia_vencimento integer,
  status text DEFAULT 'ativo',
  observacoes text,
  created_at timestamptz DEFAULT now()
);

-- 5. Tabela de agendamentos
CREATE TABLE agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id uuid REFERENCES imoveis(id) ON DELETE CASCADE,
  nome_cliente text NOT NULL,
  email_cliente text,
  telefone_cliente text NOT NULL,
  data_hora timestamptz NOT NULL,
  tipo text DEFAULT 'visita',
  status text DEFAULT 'pendente',
  observacoes text,
  created_at timestamptz DEFAULT now()
);

-- 6. Tabela de configurações do site (linha única)
CREATE TABLE configuracoes (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nome_empresa text DEFAULT 'Ferreira & Neves',
  telefone text,
  whatsapp text,
  email text,
  endereco text,
  instagram text,
  facebook text,
  logo_url text,
  hero_titulo text DEFAULT 'Encontre o imóvel dos seus sonhos',
  hero_subtitulo text,
  sobre_texto text,
  creci text
);

INSERT INTO configuracoes DEFAULT VALUES;

-- ============================================================
-- RLS POLICIES (Row Level Security)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE imoveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE proprietarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- IMÓVEIS: leitura pública (disponíveis), escrita apenas autenticado
CREATE POLICY "imoveis_public_read" ON imoveis
  FOR SELECT USING (status = 'disponivel');

CREATE POLICY "imoveis_admin_all" ON imoveis
  FOR ALL USING (auth.role() = 'authenticated');

-- PROPRIETÁRIOS: apenas autenticado
CREATE POLICY "proprietarios_admin_all" ON proprietarios
  FOR ALL USING (auth.role() = 'authenticated');

-- CONTRATOS: apenas autenticado
CREATE POLICY "contratos_admin_all" ON contratos
  FOR ALL USING (auth.role() = 'authenticated');

-- AGENDAMENTOS: insert público (formulário do site), resto autenticado
CREATE POLICY "agendamentos_public_insert" ON agendamentos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "agendamentos_admin_all" ON agendamentos
  FOR ALL USING (auth.role() = 'authenticated');

-- CONFIGURAÇÕES: leitura pública, escrita autenticado
CREATE POLICY "configuracoes_public_read" ON configuracoes
  FOR SELECT USING (true);

CREATE POLICY "configuracoes_admin_write" ON configuracoes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- USUÁRIOS: apenas autenticado
CREATE POLICY "usuarios_admin_all" ON usuarios
  FOR ALL USING (auth.role() = 'authenticated');
