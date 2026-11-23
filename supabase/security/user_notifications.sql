-- SECAP · Sino de notificações dos usuários.
-- Cada conta vê apenas as próprias notificações semanais (obras sem atualização),
-- com contador de não lidas. Administradores continuam usando secap_admin_notifications.
-- Requer weekly_notify.sql e admin_notifications.sql. Reaplicável; não altera dados existentes.
begin;

create or replace function public.secap_my_notifications(p_limit integer default 60)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare seen timestamptz; uid uuid := auth.uid();
begin
  if uid is null or not coalesce(public.is_member(), false) then
    raise exception 'Entre no portal para ver suas notificações.' using errcode = '42501';
  end if;
  select r.last_seen_at into seen from public.secap_notification_reads r where r.user_id = uid;
  return jsonb_build_object(
    'lastSeen', seen,
    'unread', (select count(*) from public.secap_weekly_notifications n
               where n.user_id = uid and (seen is null or n.created_at > seen)),
    'total', (select count(*) from public.secap_weekly_notifications n where n.user_id = uid),
    'items', coalesce((
      select jsonb_agg(x.item order by x.created_at desc)
      from (
        select n.created_at, jsonb_build_object(
          'id', n.id, 'at', n.created_at, 'weekStart', n.week_start, 'weekEnd', n.week_start + 6,
          'total', jsonb_array_length(n.obras), 'obras', n.obras,
          'unread', seen is null or n.created_at > seen) as item
        from public.secap_weekly_notifications n
        where n.user_id = uid
        order by n.created_at desc
        limit greatest(1, least(coalesce(p_limit, 60), 300))
      ) x
    ), '[]'::jsonb));
end $$;
revoke all on function public.secap_my_notifications(integer) from public, anon;
grant execute on function public.secap_my_notifications(integer) to authenticated;

create or replace function public.secap_my_notifications_seen()
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not coalesce(public.is_member(), false) then
    raise exception 'Entre no portal para ver suas notificações.' using errcode = '42501';
  end if;
  insert into public.secap_notification_reads(user_id, last_seen_at) values (auth.uid(), now())
  on conflict (user_id) do update set last_seen_at = now();
  return true;
end $$;
revoke all on function public.secap_my_notifications_seen() from public, anon;
grant execute on function public.secap_my_notifications_seen() to authenticated;

notify pgrst, 'reload schema';
commit;
select 'Sino de notificações dos usuários instalado com sucesso' as resultado;
