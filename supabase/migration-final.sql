-- ============================================================
-- FERREIRA & NEVES — Migration Final
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela do blog
CREATE TABLE IF NOT EXISTS public.artigos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  slug text UNIQUE NOT NULL,
  resumo text,
  conteudo text NOT NULL DEFAULT '',
  imagem_url text,
  publicado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.artigos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "artigos_public_read" ON public.artigos;
DROP POLICY IF EXISTS "artigos_admin_all"   ON public.artigos;

CREATE POLICY "artigos_public_read" ON public.artigos
  FOR SELECT TO anon
  USING (publicado = true);

CREATE POLICY "artigos_admin_all" ON public.artigos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);


-- 2. Coluna de características nos imóveis
ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS caracteristicas text[] DEFAULT '{}';


-- 3. Coluna lido nos agendamentos
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS lido boolean NOT NULL DEFAULT false;

-- Marca registros existentes como já lidos (não poluir a inbox)
UPDATE public.agendamentos SET lido = true WHERE lido = false;
