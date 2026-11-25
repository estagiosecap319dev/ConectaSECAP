-- SECAP · Sincronia com a planilha Google rodando na nuvem (Vercel).
--
-- 1. O estado da sincronia ("base": último valor sincronizado de cada célula) passa a ficar
--    no banco, em public.secap_sheet_sync_state, e não mais só no arquivo
--    data/sheet-sync-state.json do computador. Assim a Vercel e o portal local usam a mesma base.
-- 2. Uma trava (locked_until) impede que dois lugares sincronizem ao mesmo tempo.
-- 3. O agendador do Supabase (pg_cron) chama /api/sheet-sync a cada 2 minutos via pg_net.
--    Endereço e segredo ficam no Vault ('secap_sheet_sync_url' e 'secap_sheet_sync_secret');
--    sem eles, o agendamento não faz nada.
--
-- Requer sheet_sync.sql. Reaplicável. Não altera obras.
begin;

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create table if not exists public.secap_sheet_sync_state (
  key text primary key,                 -- '<planilha_id>|<projeto_id>'
  body jsonb not null default '{}'::jsonb,
  locked_until timestamptz,
  locked_by text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.secap_sheet_sync_state enable row level security;
revoke all on public.secap_sheet_sync_state from public, anon, authenticated;

create or replace function public.secap_sheet_sync_state_get(p_key text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Uso restrito ao servidor do portal.' using errcode = '42501';
  end if;
  return (select s.body from public.secap_sheet_sync_state s where s.key = p_key);
end $$;

create or replace function public.secap_sheet_sync_state_put(p_key text, p_body jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Uso restrito ao servidor do portal.' using errcode = '42501';
  end if;
  insert into public.secap_sheet_sync_state(key, body, updated_at) values (p_key, coalesce(p_body, '{}'::jsonb), now())
  on conflict (key) do update set body = excluded.body, updated_at = now();
  return true;
end $$;

-- Trava: devolve true se conseguiu (ninguém sincronizando ou a trava anterior expirou).
create or replace function public.secap_sheet_sync_lock(p_key text, p_owner text, p_seconds integer default 240)
returns boolean language plpgsql security definer set search_path = '' as $$
declare got integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Uso restrito ao servidor do portal.' using errcode = '42501';
  end if;
  insert into public.secap_sheet_sync_state(key) values (p_key) on conflict (key) do nothing;
  update public.secap_sheet_sync_state
     set locked_until = now() + make_interval(secs => greatest(30, least(coalesce(p_seconds, 240), 900))),
         locked_by = left(coalesce(p_owner, ''), 120)
   where key = p_key and (locked_until is null or locked_until < now() or locked_by = p_owner);
  get diagnostics got = row_count;
  return got > 0;
end $$;

create or replace function public.secap_sheet_sync_unlock(p_key text, p_owner text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Uso restrito ao servidor do portal.' using errcode = '42501';
  end if;
  update public.secap_sheet_sync_state set locked_until = null, locked_by = ''
   where key = p_key and locked_by = p_owner;
  return true;
end $$;

revoke all on function public.secap_sheet_sync_state_get(text) from public, anon, authenticated;
revoke all on function public.secap_sheet_sync_state_put(text, jsonb) from public, anon, authenticated;
revoke all on function public.secap_sheet_sync_lock(text, text, integer) from public, anon, authenticated;
revoke all on function public.secap_sheet_sync_unlock(text, text) from public, anon, authenticated;
grant execute on function public.secap_sheet_sync_state_get(text) to service_role;
grant execute on function public.secap_sheet_sync_state_put(text, jsonb) to service_role;
grant execute on function public.secap_sheet_sync_lock(text, text, integer) to service_role;
grant execute on function public.secap_sheet_sync_unlock(text, text) to service_role;

-- Chamada agendada: pede à Vercel um ciclo de sincronia.
create or replace function public.secap_sheet_sync_ping()
returns void language plpgsql security definer set search_path = '' as $$
declare v_url text; v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'secap_sheet_sync_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'secap_sheet_sync_secret';
  if coalesce(v_url, '') = '' then
    return;
  end if;
  perform net.http_post(
    url := v_url,
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'Authorization', 'Bearer ' || coalesce(v_secret, '')),
    timeout_milliseconds := 60000);
end $$;
revoke all on function public.secap_sheet_sync_ping() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'secap-sheet-sync';
select cron.schedule('secap-sheet-sync', '*/2 * * * *', 'select public.secap_sheet_sync_ping()');

notify pgrst, 'reload schema';
commit;
select 'Sincronia da planilha na nuvem preparada com sucesso' as resultado;
