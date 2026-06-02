-- ============================================================
-- FERREIRA & NEVES — Correção das RLS Policies
-- Execute no SQL Editor do Supabase.
-- ============================================================


-- ============================================================
-- 0. Funções auxiliares (cria se não existirem)
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


-- ============================================================
-- 1. IMÓVEIS — corretor lê/cria/edita; só admin apaga
-- ============================================================

DROP POLICY IF EXISTS "imoveis_admin_all"          ON imoveis;
DROP POLICY IF EXISTS "imoveis_corretor_rw"         ON imoveis;
DROP POLICY IF EXISTS "imoveis_corretor_read_write" ON imoveis;
DROP POLICY IF EXISTS "imoveis_corretor_insert"     ON imoveis;
DROP POLICY IF EXISTS "imoveis_corretor_update"     ON imoveis;
DROP POLICY IF EXISTS "imoveis_admin_delete"        ON imoveis;

CREATE POLICY "imoveis_corretor_read" ON imoveis
  FOR SELECT TO authenticated
  USING (public.is_corretor_ativo());

CREATE POLICY "imoveis_corretor_insert" ON imoveis
  FOR INSERT TO authenticated
  WITH CHECK (public.is_corretor_ativo());

CREATE POLICY "imoveis_corretor_update" ON imoveis
  FOR UPDATE TO authenticated
  USING (public.is_corretor_ativo())
  WITH CHECK (public.is_corretor_ativo());

CREATE POLICY "imoveis_admin_delete" ON imoveis
  FOR DELETE TO authenticated
  USING (public.is_admin());


-- ============================================================
-- 2. PROPRIETÁRIOS — corretor lê/cria/edita; só admin apaga
-- ============================================================

DROP POLICY IF EXISTS "proprietarios_admin_all"    ON proprietarios;
DROP POLICY IF EXISTS "proprietarios_corretor_rw"  ON proprietarios;
DROP POLICY IF EXISTS "proprietarios_admin_delete" ON proprietarios;

CREATE POLICY "proprietarios_corretor_read" ON proprietarios
  FOR SELECT TO authenticated
  USING (public.is_corretor_ativo());

CREATE POLICY "proprietarios_corretor_insert" ON proprietarios
  FOR INSERT TO authenticated
  WITH CHECK (public.is_corretor_ativo());

CREATE POLICY "proprietarios_corretor_update" ON proprietarios
  FOR UPDATE TO authenticated
  USING (public.is_corretor_ativo())
  WITH CHECK (public.is_corretor_ativo());

CREATE POLICY "proprietarios_admin_delete" ON proprietarios
  FOR DELETE TO authenticated
  USING (public.is_admin());


-- ============================================================
-- 3. CONTRATOS — corretor lê/cria/edita; só admin apaga
-- ============================================================

DROP POLICY IF EXISTS "contratos_admin_all"    ON contratos;
DROP POLICY IF EXISTS "contratos_corretor_rw"  ON contratos;
DROP POLICY IF EXISTS "contratos_admin_delete" ON contratos;

CREATE POLICY "contratos_corretor_read" ON contratos
  FOR SELECT TO authenticated
  USING (public.is_corretor_ativo());

CREATE POLICY "contratos_corretor_insert" ON contratos
  FOR INSERT TO authenticated
  WITH CHECK (public.is_corretor_ativo());

CREATE POLICY "contratos_corretor_update" ON contratos
  FOR UPDATE TO authenticated
  USING (public.is_corretor_ativo())
  WITH CHECK (public.is_corretor_ativo());

CREATE POLICY "contratos_admin_delete" ON contratos
  FOR DELETE TO authenticated
  USING (public.is_admin());


-- ============================================================
-- 4. AGENDAMENTOS — anon insere; corretor lê/edita; admin apaga
-- ============================================================

DROP POLICY IF EXISTS "agendamentos_admin_all"       ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_corretor_rw"     ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_public_insert"   ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_corretor_read"   ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_corretor_update" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_admin_delete"    ON agendamentos;

CREATE POLICY "agendamentos_public_insert" ON agendamentos
  FOR INSERT TO anon
  WITH CHECK (
    nome_cliente IS NOT NULL AND nome_cliente <> ''
    AND telefone_cliente IS NOT NULL AND telefone_cliente <> ''
    AND data_hora IS NOT NULL
    AND data_hora > now()
    AND status = 'pendente'
    AND tipo = 'visita'
  );

CREATE POLICY "agendamentos_corretor_read" ON agendamentos
  FOR SELECT TO authenticated
  USING (public.is_corretor_ativo());

CREATE POLICY "agendamentos_corretor_update" ON agendamentos
  FOR UPDATE TO authenticated
  USING (public.is_corretor_ativo())
  WITH CHECK (public.is_corretor_ativo());

CREATE POLICY "agendamentos_admin_delete" ON agendamentos
  FOR DELETE TO authenticated
  USING (public.is_admin());


-- ============================================================
-- 5. CONFIGURAÇÕES — leitura pública; escrita só admin
-- ============================================================

DROP POLICY IF EXISTS "configuracoes_admin_write" ON configuracoes;

CREATE POLICY "configuracoes_admin_write" ON configuracoes
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- 6. USUÁRIOS — todos autenticados leem; só admin escreve/apaga
-- ============================================================

DROP POLICY IF EXISTS "usuarios_admin_all"    ON usuarios;
DROP POLICY IF EXISTS "usuarios_self_read"    ON usuarios;
DROP POLICY IF EXISTS "usuarios_admin_write"  ON usuarios;
DROP POLICY IF EXISTS "usuarios_admin_update" ON usuarios;
DROP POLICY IF EXISTS "usuarios_admin_delete" ON usuarios;

CREATE POLICY "usuarios_self_read" ON usuarios
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "usuarios_admin_insert" ON usuarios
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "usuarios_admin_update" ON usuarios
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "usuarios_admin_delete" ON usuarios
  FOR DELETE TO authenticated
  USING (public.is_admin());


-- ============================================================
-- 7. Trigger de sync auth.users → usuarios (se não existir)
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
    CASE WHEN (SELECT COUNT(*) FROM public.usuarios) = 0 THEN 'admin' ELSE 'corretor' END,
    'ativo'
  )
  ON CONFLICT (email) DO UPDATE SET
    id       = EXCLUDED.id,
    nome     = COALESCE(EXCLUDED.nome, public.usuarios.nome),
    foto_url = COALESCE(EXCLUDED.foto_url, public.usuarios.foto_url),
    telefone = COALESCE(EXCLUDED.telefone, public.usuarios.telefone);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
