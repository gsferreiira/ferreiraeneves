-- Adiciona coluna `lido` na tabela agendamentos
-- Execute no SQL Editor do Supabase

ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS lido boolean NOT NULL DEFAULT false;

-- Marca todos os agendamentos existentes como já lidos
-- (para não poluir a inbox com registros antigos)
UPDATE public.agendamentos SET lido = true WHERE lido = false;
