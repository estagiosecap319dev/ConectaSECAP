-- SECAP · "Responsável pela próxima ação" preenchido à mão.
-- Antes, ao salvar as Permissões do projeto, o banco escrevia nesse campo os nomes das contas
-- com acesso à obra (secap_private.sync_work_responsibles). Este script desliga essa escrita:
-- a função continua existindo (é chamada pelas permissões), mas não altera mais as obras.
-- Permissões, acesso às obras e notificações semanais não mudam. Os nomes já gravados
-- permanecem e podem ser editados normalmente na obra.
-- Aplicar DEPOIS de responsible_acompanhamento_access.sql (que recria a versão automática).
-- Para voltar ao preenchimento automático, reaplique responsible_acompanhamento_access.sql.
begin;

create or replace function secap_private.sync_work_responsibles(pid text, work_ids text[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- Preenchimento automático desligado: o campo é editado manualmente.
  return;
end $$;
revoke all on function secap_private.sync_work_responsibles(text, text[]) from public, anon, authenticated;

commit;
select 'Responsável pela próxima ação agora é preenchido manualmente' as resultado;
