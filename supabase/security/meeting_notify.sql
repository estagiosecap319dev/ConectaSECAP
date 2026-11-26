-- SECAP · Aviso de reunião marcada na agenda (no sino do portal e por e-mail).
--
-- Fluxo:
--   1. Alguém salva uma reunião na agenda (public.calendar_items, body.kind = 'meeting').
--   2. O gatilho abaixo registra uma notificação para cada participante (menos quem marcou):
--        · reunião nova                                  -> todos os participantes;
--        · mudou título, data ou horário                 -> todos os participantes ("alterada");
--        · só entraram participantes novos               -> apenas os novos.
--      Salvar de novo sem mudança relevante não gera aviso.
--   3. O sino do portal mostra a notificação (secap_my_notifications / secap_admin_notifications)
--      na hora, pelo tempo real do Supabase (Realtime): cada pessoa recebe só os próprios avisos.
--   4. O gatilho chama (assíncrono, via pg_net) /api/meeting-notify na Vercel, que envia o e-mail
--      e marca a notificação como enviada. Endereço e segredo: 'secap_meeting_notify_url' e
--      'secap_meeting_notify_secret' no Vault ou, se não existirem, os do aviso de acesso
--      (secap_access_notify_*), trocando o endereço para /api/meeting-notify. Assim não é preciso
--      configurar nada novo. O agendamento diário da Vercel e o portal local enviam os pendentes.
--
-- O gatilho nunca impede salvar a agenda: qualquer erro no aviso é ignorado.
-- Requer admin_notifications.sql e user_notifications.sql (sino). Reaplicável.
begin;

create extension if not exists pg_net with schema extensions;

create table if not exists public.secap_meeting_notifications (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,
  user_id uuid,
  email text not null,
  kind text not null default 'nova' check (kind in ('nova', 'alterada')),
  title text not null default '',
  meeting_date date,
  meeting_time text not null default '',
  description text not null default '',
  organizer text not null default '',
  created_at timestamptz not null default now(),
  email_status text not null default '',
  emailed_at timestamptz
);
create index if not exists secap_meeting_notifications_user_idx on public.secap_meeting_notifications (user_id, created_at desc);
create index if not exists secap_meeting_notifications_pending_idx on public.secap_meeting_notifications (created_at) where email_status = '';
alter table public.secap_meeting_notifications enable row level security;
revoke all on public.secap_meeting_notifications from anon, authenticated;

-- E-mails dos participantes (minúsculos, sem repetição, só endereços válidos).
create or replace function secap_private.meeting_emails(body jsonb)
returns text[] language sql immutable set search_path = '' as $$
  select coalesce(array_agg(distinct lower(btrim(v))), '{}')
  from jsonb_array_elements_text(case when jsonb_typeof(body -> 'participants') = 'array' then body -> 'participants' else '[]'::jsonb end) v
  where position('@' in v) > 1 and char_length(v) <= 254
$$;

create or replace function secap_private.notify_meeting_participants()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  owner_email text; organizer text; targets text[]; kind text := 'nova';
  v_url text; v_secret text; n integer := 0;
begin
  begin
    if coalesce(new.body ->> 'kind', '') <> 'meeting' then return new; end if;
    if tg_op = 'UPDATE' and coalesce(old.body ->> 'kind', '') = 'meeting'
       and old.body ->> 'title' is not distinct from new.body ->> 'title'
       and old.body ->> 'date' is not distinct from new.body ->> 'date'
       and coalesce(old.body ->> 'time', '') = coalesce(new.body ->> 'time', '') then
      -- Nada relevante mudou: só os participantes acrescentados recebem aviso.
      select coalesce(array_agg(e), '{}') into targets
      from unnest(secap_private.meeting_emails(new.body)) e
      where not (e = any (secap_private.meeting_emails(old.body)));
    else
      targets := secap_private.meeting_emails(new.body);
      if tg_op = 'UPDATE' and coalesce(old.body ->> 'kind', '') = 'meeting' then kind := 'alterada'; end if;
    end if;

    select lower(p.email), coalesce(nullif(btrim(p.name), ''), p.email) into owner_email, organizer
    from public.profiles p where p.id = new.owner;

    insert into public.secap_meeting_notifications (item_id, user_id, email, kind, title, meeting_date, meeting_time, description, organizer)
    select new.id, p.id, t.email, kind,
           left(coalesce(new.body ->> 'title', ''), 180),
           case when coalesce(new.body ->> 'date', '') ~ '^\d{4}-\d{2}-\d{2}$' then (new.body ->> 'date')::date end,
           left(coalesce(new.body ->> 'time', ''), 8),
           left(coalesce(new.body ->> 'description', ''), 2000),
           coalesce(organizer, '')
    from unnest(targets) t(email)
    -- Só contas aprovadas do portal: o aviso nunca vai para endereços digitados à mão
    -- (evita usar o e-mail do portal para mandar mensagens a qualquer pessoa).
    join public.profiles p on lower(p.email) = t.email and p.role in ('administrador', 'usuario')
    where t.email is distinct from owner_email
      -- Restaurar um backup reinsere a agenda: quem já foi avisado desta mesma versão não recebe de novo.
      and not exists (
        select 1 from public.secap_meeting_notifications x
        where x.item_id = new.id and x.email = t.email
          and x.title = left(coalesce(new.body ->> 'title', ''), 180)
          and x.meeting_date is not distinct from (case when coalesce(new.body ->> 'date', '') ~ '^\d{4}-\d{2}-\d{2}$' then (new.body ->> 'date')::date end)
          and x.meeting_time = left(coalesce(new.body ->> 'time', ''), 8));
    get diagnostics n = row_count;

    if n > 0 then
      select decrypted_secret into v_url from vault.decrypted_secrets where name = 'secap_meeting_notify_url';
      select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'secap_meeting_notify_secret';
      -- Sem configuração própria, usa a do aviso de solicitação de acesso (mesmo portal e segredo).
      if coalesce(v_url, '') = '' then
        select replace(decrypted_secret, '/api/access-request-notify', '/api/meeting-notify') into v_url
        from vault.decrypted_secrets where name = 'secap_access_notify_url';
        select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'secap_access_notify_secret';
      end if;
      if coalesce(v_url, '') <> '' then
        perform net.http_post(
          url := v_url,
          body := jsonb_build_object('item', new.id),
          headers := jsonb_build_object('Content-Type', 'application/json',
                                        'Authorization', 'Bearer ' || coalesce(v_secret, '')),
          timeout_milliseconds := 20000);
      end if;
    end if;
  exception when others then
    null; -- salvar a agenda nunca falha por causa do aviso
  end;
  return new;
end $$;
revoke all on function secap_private.notify_meeting_participants() from public, anon, authenticated;

drop trigger if exists calendar_items_notify_meeting on public.calendar_items;
create trigger calendar_items_notify_meeting
  after insert or update on public.calendar_items
  for each row execute function secap_private.notify_meeting_participants();

-- E-mails pendentes (para o servidor do portal) e marcação do resultado.
create or replace function public.secap_meeting_notify_pending(p_limit integer default 200)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Uso restrito ao servidor do portal.' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', n.id, 'email', n.email, 'kind', n.kind, 'title', n.title,
             'date', n.meeting_date, 'time', n.meeting_time, 'description', n.description,
             'organizer', n.organizer, 'name', coalesce(nullif(btrim(p.name), ''), n.email)) order by n.created_at)
    from (select * from public.secap_meeting_notifications where email_status = '' order by created_at
          limit greatest(1, least(coalesce(p_limit, 200), 500))) n
    left join public.profiles p on p.id = n.user_id), '[]'::jsonb);
end $$;
revoke all on function public.secap_meeting_notify_pending(integer) from public, anon, authenticated;
grant execute on function public.secap_meeting_notify_pending(integer) to service_role;

create or replace function public.secap_meeting_notify_mark(p_ids uuid[], p_status text)
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Uso restrito ao servidor do portal.' using errcode = '42501';
  end if;
  update public.secap_meeting_notifications
     set email_status = left(coalesce(nullif(p_status, ''), 'erro'), 300), emailed_at = now()
   where id = any(p_ids);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.secap_meeting_notify_mark(uuid[], text) from public, anon, authenticated;
grant execute on function public.secap_meeting_notify_mark(uuid[], text) to service_role;

-- Sino: as reuniões entram junto com as notificações semanais (campo "type" distingue).
create or replace function secap_private.my_meeting_items(uid uuid, seen timestamptz, p_limit integer)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(x.item order by x.created_at desc), '[]'::jsonb) from (
    select n.created_at, jsonb_build_object('type', 'reuniao', 'id', n.id, 'at', n.created_at, 'kind', n.kind,
             'title', n.title, 'date', n.meeting_date, 'time', n.meeting_time, 'organizer', n.organizer,
             'unread', seen is null or n.created_at > seen) as item
    from public.secap_meeting_notifications n
    where n.user_id = uid order by n.created_at desc limit greatest(1, least(coalesce(p_limit, 60), 300))
  ) x
$$;
revoke all on function secap_private.my_meeting_items(uuid, timestamptz, integer) from public, anon, authenticated;

create or replace function public.secap_my_notifications(p_limit integer default 60)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare seen timestamptz; uid uuid := auth.uid(); weekly jsonb; meetings jsonb; merged jsonb;
begin
  if uid is null or not coalesce(public.is_member(), false) then
    raise exception 'Entre no portal para ver suas notificações.' using errcode = '42501';
  end if;
  select r.last_seen_at into seen from public.secap_notification_reads r where r.user_id = uid;
  select coalesce(jsonb_agg(x.item order by x.created_at desc), '[]'::jsonb) into weekly from (
    select n.created_at, jsonb_build_object(
      'type', 'semanal', 'id', n.id, 'at', n.created_at, 'weekStart', n.week_start, 'weekEnd', n.week_start + 6,
      'total', jsonb_array_length(n.obras), 'obras', n.obras,
      'unread', seen is null or n.created_at > seen) as item
    from public.secap_weekly_notifications n
    where n.user_id = uid order by n.created_at desc limit greatest(1, least(coalesce(p_limit, 60), 300))
  ) x;
  meetings := secap_private.my_meeting_items(uid, seen, p_limit);
  select coalesce(jsonb_agg(i order by (i ->> 'at')::timestamptz desc), '[]'::jsonb) into merged
  from (select i from jsonb_array_elements(weekly || meetings) i limit greatest(1, least(coalesce(p_limit, 60), 300))) s;
  return jsonb_build_object(
    'lastSeen', seen,
    'unread', (select count(*) from public.secap_weekly_notifications n where n.user_id = uid and (seen is null or n.created_at > seen))
            + (select count(*) from public.secap_meeting_notifications n where n.user_id = uid and (seen is null or n.created_at > seen)),
    'total', (select count(*) from public.secap_weekly_notifications n where n.user_id = uid)
           + (select count(*) from public.secap_meeting_notifications n where n.user_id = uid),
    'items', merged);
end $$;
revoke all on function public.secap_my_notifications(integer) from public, anon;
grant execute on function public.secap_my_notifications(integer) to authenticated;

create or replace function public.secap_admin_notifications(p_limit integer default 60)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare seen timestamptz; uid uuid := auth.uid(); weekly jsonb; meetings jsonb; merged jsonb;
begin
  if uid is null or not coalesce(public.is_admin(), false) then
    raise exception 'Consulta restrita aos administradores.' using errcode = '42501';
  end if;
  select r.last_seen_at into seen from public.secap_notification_reads r where r.user_id = uid;
  select coalesce(jsonb_agg(x.item order by x.created_at desc), '[]'::jsonb) into weekly from (
    select n.created_at, jsonb_build_object(
      'type', 'semanal', 'id', n.id, 'at', n.created_at, 'weekStart', n.week_start, 'weekEnd', n.week_start + 6,
      'name', n.name, 'email', n.email, 'total', jsonb_array_length(n.obras), 'obras', n.obras,
      'status', n.status, 'error', n.error, 'origin', n.origin,
      'unread', seen is null or n.created_at > seen) as item
    from public.secap_weekly_notifications n
    order by n.created_at desc limit greatest(1, least(coalesce(p_limit, 60), 300))
  ) x;
  -- Reuniões: o administrador vê as dele (convites recebidos), como qualquer participante.
  meetings := secap_private.my_meeting_items(uid, seen, p_limit);
  select coalesce(jsonb_agg(i order by (i ->> 'at')::timestamptz desc), '[]'::jsonb) into merged
  from (select i from jsonb_array_elements(weekly || meetings) i limit greatest(1, least(coalesce(p_limit, 60), 300))) s;
  return jsonb_build_object(
    'lastSeen', seen,
    'unread', (select count(*) from public.secap_weekly_notifications n where seen is null or n.created_at > seen)
            + (select count(*) from public.secap_meeting_notifications n where n.user_id = uid and (seen is null or n.created_at > seen)),
    'total', (select count(*) from public.secap_weekly_notifications)
           + (select count(*) from public.secap_meeting_notifications n where n.user_id = uid),
    'items', merged);
end $$;
revoke all on function public.secap_admin_notifications(integer) from public, anon;
grant execute on function public.secap_admin_notifications(integer) to authenticated;

-- Tempo real: o portal "ouve" os avisos novos e atualiza o sino na hora (Supabase Realtime).
-- Cada pessoa só pode ler e receber os próprios avisos (regra abaixo). Gravar continua
-- proibido para os usuários: só o gatilho grava.
grant select on public.secap_meeting_notifications to authenticated;
drop policy if exists meeting_notifications_own on public.secap_meeting_notifications;
create policy meeting_notifications_own on public.secap_meeting_notifications
  for select to authenticated using (user_id = auth.uid());
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public'
                       and tablename = 'secap_meeting_notifications') then
    alter publication supabase_realtime add table public.secap_meeting_notifications;
  end if;
end $$;

notify pgrst, 'reload schema';
commit;
select 'Aviso de reunião instalado com sucesso' as resultado;
