-- ============================================================
-- FERREIRA & NEVES — Policies completas (RLS + Storage)
-- Execute este arquivo inteiro no SQL Editor do Supabase
-- ============================================================


-- ============================================================
-- 1. HABILITAR RLS NAS TABELAS
-- ============================================================

ALTER TABLE imoveis       ENABLE ROW LEVEL SECURITY;
ALTER TABLE proprietarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios      ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 2. TABELA: imoveis
--    - Leitura pública apenas dos disponíveis
--    - Admin pode fazer tudo
-- ============================================================

DROP POLICY IF EXISTS "imoveis_public_read"  ON imoveis;
DROP POLICY IF EXISTS "imoveis_admin_all"    ON imoveis;

CREATE POLICY "imoveis_public_read" ON imoveis
  FOR SELECT
  TO anon
  USING (status = 'disponivel');

CREATE POLICY "imoveis_admin_all" ON imoveis
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- 3. TABELA: proprietarios
--    - Apenas usuário autenticado
-- ============================================================

DROP POLICY IF EXISTS "proprietarios_admin_all" ON proprietarios;

CREATE POLICY "proprietarios_admin_all" ON proprietarios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- 4. TABELA: contratos
--    - Apenas usuário autenticado
-- ============================================================

DROP POLICY IF EXISTS "contratos_admin_all" ON contratos;

CREATE POLICY "contratos_admin_all" ON contratos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- 5. TABELA: agendamentos
--    - INSERT público (formulário do site, visitante agenda visita)
--    - SELECT, UPDATE, DELETE apenas autenticado
-- ============================================================

DROP POLICY IF EXISTS "agendamentos_public_insert" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_admin_all"     ON agendamentos;

CREATE POLICY "agendamentos_public_insert" ON agendamentos
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "agendamentos_admin_all" ON agendamentos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- 6. TABELA: configuracoes
--    - SELECT público (site precisa ler nome, telefone, etc.)
--    - UPDATE apenas autenticado
-- ============================================================

DROP POLICY IF EXISTS "configuracoes_public_read"  ON configuracoes;
DROP POLICY IF EXISTS "configuracoes_admin_write"  ON configuracoes;

CREATE POLICY "configuracoes_public_read" ON configuracoes
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "configuracoes_admin_write" ON configuracoes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- 7. TABELA: usuarios
--    - Apenas autenticado
-- ============================================================

DROP POLICY IF EXISTS "usuarios_admin_all" ON usuarios;

CREATE POLICY "usuarios_admin_all" ON usuarios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- 8. STORAGE: bucket imoveis-fotos
--    - Leitura pública
--    - Upload/delete apenas autenticado
-- ============================================================

DROP POLICY IF EXISTS "imoveis_fotos_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "imoveis_fotos_admin_insert"  ON storage.objects;
DROP POLICY IF EXISTS "imoveis_fotos_admin_update"  ON storage.objects;
DROP POLICY IF EXISTS "imoveis_fotos_admin_delete"  ON storage.objects;

CREATE POLICY "imoveis_fotos_public_read" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'imoveis-fotos');

CREATE POLICY "imoveis_fotos_admin_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'imoveis-fotos');

CREATE POLICY "imoveis_fotos_admin_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'imoveis-fotos');

CREATE POLICY "imoveis_fotos_admin_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'imoveis-fotos');


-- ============================================================
-- 9. STORAGE: bucket assets
--    - Leitura pública
--    - Upload/delete apenas autenticado
-- ============================================================

DROP POLICY IF EXISTS "assets_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "assets_admin_insert"  ON storage.objects;
DROP POLICY IF EXISTS "assets_admin_update"  ON storage.objects;
DROP POLICY IF EXISTS "assets_admin_delete"  ON storage.objects;

CREATE POLICY "assets_public_read" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'assets');

CREATE POLICY "assets_admin_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'assets');

CREATE POLICY "assets_admin_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'assets');

CREATE POLICY "assets_admin_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'assets');
