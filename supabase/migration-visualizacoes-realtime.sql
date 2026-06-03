-- ============================================================
-- FERREIRA & NEVES — Visualizações + Realtime
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Coluna de visualizações nos imóveis
ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS visualizacoes integer NOT NULL DEFAULT 0;

-- 2. Função para incrementar visualizações com segurança
--    SECURITY DEFINER permite que usuários anônimos chamem via RPC
CREATE OR REPLACE FUNCTION public.incrementar_visualizacao(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.imoveis
  SET visualizacoes = visualizacoes + 1
  WHERE id = p_id AND status = 'disponivel';
$$;

-- 3. Habilitar Realtime na tabela agendamentos
--    (permite que o admin receba novos agendamentos em tempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE public.agendamentos;
