-- ============================================================
-- FERREIRA & NEVES — Extras (rode DEPOIS do supabase-setup.sql)
--   1. Sincronização auth.users ↔ usuarios
--   2. Função is_admin() e RLS refinado por perfil
--   3. Auditoria (audit_log) com triggers
-- ============================================================


-- ============================================================
-- 1. Sync auth.users → usuarios
--    Quando alguém é criado em Auth, replica para `usuarios`.
--    Quando metadados (nome, foto) mudam, mantém em sincronia.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, telefone, foto_url, perfil, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data ->> 'telefone',
    NEW.raw_user_meta_data ->> 'foto_url',
    -- primeiro usuário criado é admin; demais entram como corretor
    CASE WHEN (SELECT COUNT(*) FROM public.usuarios) = 0 THEN 'admin' ELSE 'corretor' END,
    'ativo'
  )
  ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id,
    nome = COALESCE(EXCLUDED.nome, public.usuarios.nome),
    foto_url = COALESCE(EXCLUDED.foto_url, public.usuarios.foto_url),
    telefone = COALESCE(EXCLUDED.telefone, public.usuarios.telefone);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Garante que a tabela `usuarios` use o mesmo id do auth.users.
-- Caso a coluna id ainda tenha default antigo, mantemos compatibilidade.
ALTER TABLE public.usuarios ALTER COLUMN id DROP DEFAULT;


-- ============================================================
-- 2. is_admin() + RLS refinado
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid()
      AND perfil = 'admin'
      AND status = 'ativo'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_corretor_ativo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid()
      AND status = 'ativo'
  );
$$;

-- IMÓVEIS: leitura/criação/edição para qualquer corretor ativo;
-- exclusão apenas admin
DROP POLICY IF EXISTS "imoveis_admin_all" ON imoveis;
DROP POLICY IF EXISTS "imoveis_corretor_rw" ON imoveis;
DROP POLICY IF EXISTS "imoveis_admin_delete" ON imoveis;

CREATE POLICY "imoveis_corretor_rw" ON imoveis
  FOR ALL TO authenticated
  USING (public.is_corretor_ativo())
  WITH CHECK (public.is_corretor_ativo());

CREATE POLICY "imoveis_admin_delete" ON imoveis
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- PROPRIETÁRIOS: corretor lê/edita; admin apaga
DROP POLICY IF EXISTS "proprietarios_admin_all" ON proprietarios;

CREATE POLICY "proprietarios_corretor_rw" ON proprietarios
  FOR ALL TO authenticated
  USING (public.is_corretor_ativo())
  WITH CHECK (public.is_corretor_ativo());

CREATE POLICY "proprietarios_admin_delete" ON proprietarios
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- CONTRATOS: idem
DROP POLICY IF EXISTS "contratos_admin_all" ON contratos;

CREATE POLICY "contratos_corretor_rw" ON contratos
  FOR ALL TO authenticated
  USING (public.is_corretor_ativo())
  WITH CHECK (public.is_corretor_ativo());

CREATE POLICY "contratos_admin_delete" ON contratos
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- AGENDAMENTOS: corretor faz tudo; admin apaga
DROP POLICY IF EXISTS "agendamentos_admin_all" ON agendamentos;

CREATE POLICY "agendamentos_corretor_rw" ON agendamentos
  FOR ALL TO authenticated
  USING (public.is_corretor_ativo())
  WITH CHECK (public.is_corretor_ativo());

CREATE POLICY "agendamentos_admin_delete" ON agendamentos
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- CONFIGURAÇÕES: apenas admin escreve
DROP POLICY IF EXISTS "configuracoes_admin_write" ON configuracoes;
CREATE POLICY "configuracoes_admin_write" ON configuracoes
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- USUÁRIOS: todos veem; só admin edita/cria/apaga
DROP POLICY IF EXISTS "usuarios_admin_all" ON usuarios;

CREATE POLICY "usuarios_self_read" ON usuarios
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "usuarios_admin_write" ON usuarios
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "usuarios_admin_update" ON usuarios
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "usuarios_admin_delete" ON usuarios
  FOR DELETE TO authenticated USING (public.is_admin());


-- ============================================================
-- 3. Auditoria (audit_log)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigserial PRIMARY KEY,
  tabela text NOT NULL,
  registro_id text,
  acao text NOT NULL CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE')),
  usuario_id uuid,
  usuario_email text,
  dados_anteriores jsonb,
  dados_novos jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_tabela_idx ON public.audit_log(tabela, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_usuario_idx ON public.audit_log(usuario_id, created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_read" ON public.audit_log;
CREATE POLICY "audit_log_read" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.is_corretor_ativo());

CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  email text;
BEGIN
  SELECT u.email INTO email FROM public.usuarios u WHERE u.id = uid;

  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_log (tabela, registro_id, acao, usuario_id, usuario_email, dados_anteriores)
    VALUES (TG_TABLE_NAME, COALESCE(OLD.id::text, ''), 'DELETE', uid, email, to_jsonb(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_log (tabela, registro_id, acao, usuario_id, usuario_email, dados_anteriores, dados_novos)
    VALUES (TG_TABLE_NAME, COALESCE(NEW.id::text, ''), 'UPDATE', uid, email, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_log (tabela, registro_id, acao, usuario_id, usuario_email, dados_novos)
    VALUES (TG_TABLE_NAME, COALESCE(NEW.id::text, ''), 'INSERT', uid, email, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_imoveis        ON public.imoveis;
DROP TRIGGER IF EXISTS audit_proprietarios  ON public.proprietarios;
DROP TRIGGER IF EXISTS audit_contratos      ON public.contratos;
DROP TRIGGER IF EXISTS audit_agendamentos   ON public.agendamentos;
DROP TRIGGER IF EXISTS audit_configuracoes  ON public.configuracoes;
DROP TRIGGER IF EXISTS audit_usuarios       ON public.usuarios;

CREATE TRIGGER audit_imoveis       AFTER INSERT OR UPDATE OR DELETE ON public.imoveis       FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
CREATE TRIGGER audit_proprietarios AFTER INSERT OR UPDATE OR DELETE ON public.proprietarios FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
CREATE TRIGGER audit_contratos     AFTER INSERT OR UPDATE OR DELETE ON public.contratos     FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
CREATE TRIGGER audit_agendamentos  AFTER INSERT OR UPDATE OR DELETE ON public.agendamentos  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
CREATE TRIGGER audit_configuracoes AFTER UPDATE ON public.configuracoes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
CREATE TRIGGER audit_usuarios      AFTER INSERT OR UPDATE OR DELETE ON public.usuarios      FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
