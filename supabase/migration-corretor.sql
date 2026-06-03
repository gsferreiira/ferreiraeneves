-- ============================================================
-- FERREIRA & NEVES — Migração: corretor por imóvel + perfil + fix 406
-- Rode este arquivo UMA vez no SQL Editor do Supabase.
-- É idempotente (pode rodar de novo sem quebrar nada) e NÃO altera
-- as policies que você já aplicou e estão funcionando.
-- ============================================================


-- ============================================================
-- 1. FIX 406 — leitura pública das configurações
--    O site público (anon) precisa ler nome, telefone, whatsapp,
--    logo etc. Sem esta policy o .select() devolve 0 linhas e o
--    supabase-js dispara "406 Not Acceptable".
-- ============================================================

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "configuracoes_public_read" ON public.configuracoes;

CREATE POLICY "configuracoes_public_read" ON public.configuracoes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Garante que a linha única de configurações exista
INSERT INTO public.configuracoes (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. Coluna do corretor responsável no imóvel
-- ============================================================

ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS corretor_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL;


-- ============================================================
-- 3. View pública de corretores
--    Expõe ao site APENAS nome, foto e telefone (sem e-mail).
--    Como a view roda com privilégios do dono, ela contorna a
--    RLS de `usuarios` de forma controlada (só estas 4 colunas).
-- ============================================================

CREATE OR REPLACE VIEW public.corretores_publicos AS
  SELECT id, nome, foto_url, telefone
  FROM public.usuarios
  WHERE status = 'ativo';

GRANT SELECT ON public.corretores_publicos TO anon, authenticated;


-- ============================================================
-- 4. Perfil próprio — corretor/admin edita os PRÓPRIOS dados
--    (nome, telefone, foto) sem poder escalar perfil/status.
--    Sem isto, a RLS só deixa admin dar UPDATE em `usuarios` e a
--    alteração de nome do corretor nunca é salva na tabela.
-- ============================================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Funções auxiliares (SECURITY DEFINER evita recursão de RLS)
CREATE OR REPLACE FUNCTION public.my_perfil()
  RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT perfil FROM public.usuarios WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.my_status()
  RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT status FROM public.usuarios WHERE id = auth.uid()
$$;

DROP POLICY IF EXISTS "usuarios_self_update" ON public.usuarios;

CREATE POLICY "usuarios_self_update" ON public.usuarios
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- impede o próprio usuário de promover/alterar perfil ou status
    AND perfil = public.my_perfil()
    AND status = public.my_status()
  );
