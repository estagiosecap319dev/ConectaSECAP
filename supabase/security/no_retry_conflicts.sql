-- SECAP · Conflitos sem repetição automática.
-- secap_save_project_state e secap_recover_audit sinalizavam conflito com SQLSTATE 40001
-- (serialization_failure). O PostgREST trata 40001 como falha temporária e refaz a transação
-- sem limite: uma única tentativa de salvar com projetos desatualizados virou ~300 execuções
-- por segundo e levou o banco a mais de 80% de CPU (24/11/2026).
-- Este script troca o código por P0001 (erro comum, devolvido na hora). A mensagem não muda.
-- Reaplicável; aplicar depois de 20261117120000_sincronizar_seguranca.sql.
begin;

do $$
declare
  fn regprocedure;
  def text;
begin
  foreach fn in array array[
    'public.secap_save_project_state(jsonb,jsonb,jsonb)'::regprocedure,
    'public.secap_recover_audit(uuid,boolean)'::regprocedure
  ] loop
    def := pg_get_functiondef(fn);
    if def ~ '40001' then
      execute regexp_replace(def, 'errcode\s*=\s*''40001''', 'errcode = ''P0001''', 'g');
      raise notice 'Atualizada: %', fn;
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
commit;
select 'Conflitos de salvamento não são mais repetidos automaticamente' as resultado;
