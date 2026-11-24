-- SECAP · Ajustes de desempenho apontados pelo Advisor do Supabase (24/11/2026).
-- 1) Regras de acesso (RLS) passam a calcular auth.uid(), is_member() e is_admin() uma vez por
--    consulta, com (select ...), em vez de uma vez por linha. Quem acessa o quê não muda.
-- 2) Índices nas chaves estrangeiras sem índice.
-- Reaplicável. Aplicar depois de 20261117160000_meeting_participants.sql.
begin;

alter policy profiles_select on public.profiles
  using ((id = (select auth.uid())) or (select public.is_admin()));

alter policy calendar_member_all on public.calendar_items
  using ((owner = (select auth.uid())) and (select public.is_member()))
  with check ((owner = (select auth.uid())) and (select public.is_member()));

alter policy calendar_invited_read on public.calendar_items
  using (
    (select public.is_member())
    and (body ->> 'kind') = 'meeting'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and exists (
          select 1
          from jsonb_array_elements_text(coalesce(calendar_items.body -> 'participants', '[]'::jsonb)) ps(email)
          where lower(ps.email) = lower(p.email)
        )
    )
  );

create index if not exists obra_section_configs_updated_by_idx on public.obra_section_configs (updated_by);
create index if not exists planilhas_importadas_importado_por_id_idx on public.planilhas_importadas (importado_por_id);

commit;
select 'Ajustes de desempenho aplicados' as resultado;
