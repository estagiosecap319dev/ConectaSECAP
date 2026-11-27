-- SECAP · Verificação de segurança (SOMENTE LEITURA — não altera nada).
-- Rode no SQL Editor do Supabase depois de aplicar QUALQUER script desta pasta.
-- Todas as linhas devem sair com ok = true. Uma linha false indica que uma trava foi
-- removida ou substituída por uma versão antiga.
-- Conferido no banco em produção em 26/11/2026: todas as verificações passaram.

with checks(item, ok) as (
  -- 1) Travas da tabela de obras
  select 'Trava de campos liberados (obras_field_permissions_guard)',
         exists(select 1 from pg_trigger where tgrelid='public.obras'::regclass and tgname='obras_field_permissions_guard' and tgenabled<>'D')
  union all
  select 'Trava de exclusão (obras_delete_permissions_guard)',
         exists(select 1 from pg_trigger where tgrelid='public.obras'::regclass and tgname='obras_delete_permissions_guard' and tgenabled<>'D')
  union all
  select 'Auditoria registra criação, edição e exclusão (secap_capture_audit)',
         exists(select 1 from pg_trigger where tgrelid='public.obras'::regclass and tgname='secap_capture_audit' and tgenabled<>'D'
                and (tgtype & 4)<>0 and (tgtype & 8)<>0 and (tgtype & 16)<>0)
  -- 2) Versão atual das regras (a antiga de project_access.sql não filtra por obra)
  union all
  select 'Leitura de obras filtra por obra liberada (obra_allowed + user_has_work)',
         exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                where n.nspname='secap_private' and p.proname='obra_allowed' and p.prosrc like '%user_has_work%')
  union all
  select 'Política de leitura de obras usa obra_allowed',
         exists(select 1 from pg_policies where schemaname='public' and tablename='obras' and cmd='SELECT' and qual like '%obra_allowed%')
  union all
  select 'Política de edição de obras usa obra_allowed',
         exists(select 1 from pg_policies where schemaname='public' and tablename='obras' and cmd='UPDATE' and qual like '%obra_allowed%')
  -- 3) RLS ligado em todas as tabelas expostas
  union all
  select 'RLS ligado em todas as tabelas do schema public',
         not exists(select 1 from pg_class c where c.relnamespace='public'::regnamespace and c.relkind in ('r','p') and not c.relrowsecurity)
  -- 4) Quem não fez login não acessa tabelas
  union all
  select 'Usuário não logado (anon) sem acesso a tabelas',
         not exists(select 1 from information_schema.role_table_grants where grantee='anon' and table_schema='public')
  -- 5) Auditoria: só leitura para usuários; ninguém apaga ou edita registros
  union all
  select 'Auditoria não pode ser alterada por usuários',
         not has_table_privilege('authenticated','public.secap_audit_events','INSERT')
         and not has_table_privilege('authenticated','public.secap_audit_events','UPDATE')
         and not has_table_privilege('authenticated','public.secap_audit_events','DELETE')
  -- 6) Configuração geral (app_state): só administrador
  union all
  select 'Configuração geral (app_state) só para administrador',
         exists(select 1 from pg_policies where schemaname='public' and tablename='app_state' and qual like '%is_admin()%')
  -- 7) Funções do servidor da sincronia não podem ser chamadas por usuários
  union all
  select 'Sincronia da planilha só pelo servidor (secap_sheet_sync_apply)',
         not has_function_privilege('authenticated','public.secap_sheet_sync_apply(text,jsonb,jsonb,text)','EXECUTE')
         or (select prosrc like '%service_role%' from pg_proc where proname='secap_sheet_sync_apply' limit 1)
  -- 8) Só administrador conecta planilha ou altera fórmulas (migração 20261127120000)
  union all
  select 'Planilha conectada e fórmulas financeiras só por administrador',
         coalesce((select prosrc like '%Somente administradores podem conectar planilhas%' from pg_proc where proname='secap_save_project_state' limit 1), false)
)
select item, ok from checks order by ok, item;
