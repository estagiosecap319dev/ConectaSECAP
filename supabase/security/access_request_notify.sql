-- SECAP · Aviso por e-mail aos administradores quando chega uma solicitação de acesso.
--
-- Fluxo:
--   1. Alguém cria conta na tela de login -> handle_new_user() grava em public.account_requests.
--   2. O gatilho abaixo chama (assíncrono, via pg_net) o endereço do portal
--      /api/access-request-notify. Se o endereço não estiver configurado no Vault, nada
--      acontece aqui e o portal local (server.py) pega a solicitação na próxima verificação.
--   3. O portal (access_request_notify.py) lê as solicitações ainda não avisadas, envia um
--      e-mail para cada administrador e marca a solicitação como avisada.
--
-- O gatilho nunca impede o cadastro: qualquer erro nele é ignorado.
-- Solicitações que já existiam antes desta instalação são marcadas como avisadas
-- (para não disparar e-mails antigos).
-- Reaplicável.
begin;

create extension if not exists pg_net with schema extensions;

alter table public.account_requests
  add column if not exists admin_notified_at timestamptz,
  add column if not exists admin_notify_status text not null default '';

-- Só na primeira instalação: o que já existia não gera e-mail.
do $$
begin
  if not exists (select 1 from public.account_requests where admin_notify_status <> '') then
    update public.account_requests
       set admin_notified_at = now(), admin_notify_status = 'anterior'
     where admin_notified_at is null;
  end if;
end $$;

-- Solicitações pendentes ainda não avisadas + e-mails dos administradores.
create or replace function public.secap_access_notify_pending()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Uso restrito ao servidor do portal.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'requests', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'email', r.email,
                                          'jobTitle', r.job_title, 'createdAt', r.created_at)
                       order by r.created_at)
      from public.account_requests r
      where r.admin_notified_at is null and r.status = 'Pendente'), '[]'::jsonb),
    'admins', coalesce((
      select jsonb_agg(distinct lower(p.email))
      from public.profiles p
      where p.role = 'administrador' and position('@' in coalesce(p.email, '')) > 1), '[]'::jsonb));
end $$;
revoke all on function public.secap_access_notify_pending() from public, anon, authenticated;
grant execute on function public.secap_access_notify_pending() to service_role;

-- Marca as solicitações como avisadas ('enviado' | 'teste') ou registra o erro.
create or replace function public.secap_access_notify_mark(p_ids bigint[], p_status text)
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Uso restrito ao servidor do portal.' using errcode = '42501';
  end if;
  update public.account_requests
     set admin_notify_status = left(coalesce(p_status, ''), 300),
         admin_notified_at = case when p_status in ('enviado', 'teste') then now() else null end
   where id = any(p_ids);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.secap_access_notify_mark(bigint[], text) from public, anon, authenticated;
grant execute on function public.secap_access_notify_mark(bigint[], text) to service_role;

-- Gatilho: avisa o portal na hora (endereço e segredo ficam no Vault do Supabase).
create or replace function public.secap_access_request_ping()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_url text; v_secret text;
begin
  begin
    select decrypted_secret into v_url from vault.decrypted_secrets where name = 'secap_access_notify_url';
    select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'secap_access_notify_secret';
    if coalesce(v_url, '') <> '' then
      perform net.http_post(
        url := v_url,
        body := jsonb_build_object('id', new.id),
        headers := jsonb_build_object('Content-Type', 'application/json',
                                      'Authorization', 'Bearer ' || coalesce(v_secret, '')),
        timeout_milliseconds := 10000);
    end if;
  exception when others then
    null;  -- o cadastro nunca falha por causa do aviso
  end;
  return new;
end $$;
revoke all on function public.secap_access_request_ping() from public, anon, authenticated;

drop trigger if exists account_requests_notify_admins on public.account_requests;
create trigger account_requests_notify_admins
  after insert on public.account_requests
  for each row execute function public.secap_access_request_ping();

notify pgrst, 'reload schema';
commit;
select 'Aviso de solicitação de acesso instalado com sucesso' as resultado;
