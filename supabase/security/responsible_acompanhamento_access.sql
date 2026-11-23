-- Acesso automático pelo campo "Responsável Acompanhamento".
--
-- O administrador vincula cada conta a um ou mais nomes do campo (por projeto).
-- A conta passa a ver/editar, em tempo real, todas as obras cujo Responsável
-- Acompanhamento contenha um desses nomes. Obras marcadas individualmente
-- continuam liberadas como antes. A edição de cada campo segue as "Permissões
-- do projeto" (campos liberados), sem alteração.
--
-- Vínculos: app_state.body.projectResponsibleLinks = {uid: {projeto: [nomes]}}
-- Reaplicável. Não altera obras nem apaga permissões existentes.
begin;

-- Normaliza nomes: sem acentos, minúsculo, espaços simples.
create or replace function secap_private.norm_name(v text) returns text
language sql immutable set search_path='' as $$
 select lower(translate(btrim(regexp_replace(coalesce(v,''),'\s+',' ','g')),
  'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
  'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'))
$$;

-- "Heloísa / Hélen" -> {heloisa, helen}. Separadores: / ; , e " e ".
create or replace function secap_private.acomp_names(v text) returns text[]
language sql immutable set search_path='' as $$
 select coalesce(array_agg(distinct secap_private.norm_name(n)) filter (where secap_private.norm_name(n)<>''),'{}')
 from regexp_split_to_table(coalesce(v,''),'\s*[/;,]\s*|\s+e\s+','i') n
$$;

-- Identificador do campo "Responsável Acompanhamento" do projeto.
create or replace function secap_private.acomp_field(pid text) returns text
language sql stable security definer set search_path='' as $$
 select f->>'id'
 from public.app_state s
 cross join lateral jsonb_array_elements(coalesce(s.body->'projects','[]')) p
 cross join lateral jsonb_array_elements(coalesce(p->'fields','[]')) f
 where s.id=1 and p->>'id'=pid and lower(f->>'name') ~ '^respons.vel\s+(pelo\s+)?acompanhamento'
 limit 1
$$;

-- A conta tem esta obra? (seleção individual OU nome vinculado no Responsável Acompanhamento)
create or replace function secap_private.user_has_work(uid uuid,o public.obras) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare st jsonb; ids jsonb; names jsonb; fid text;
begin
 if uid is null then return false;end if;
 select body into st from public.app_state where id=1;
 ids:=st->'projectWorkAccess'->uid::text->o.project_id;
 if jsonb_typeof(ids)='array' and ids ? o.id then return true;end if;
 names:=st->'projectResponsibleLinks'->uid::text->o.project_id;
 if jsonb_typeof(names) is distinct from 'array' or jsonb_array_length(names)=0 then return false;end if;
 fid:=secap_private.acomp_field(o.project_id);
 if fid is null then return false;end if;
 return secap_private.acomp_names(o.dados->>fid)
   && array(select secap_private.norm_name(x) from jsonb_array_elements_text(names) x);
end $$;

-- Mapa {projeto: [obras]} efetivo da conta.
create or replace function secap_private.effective_work_map(uid uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 with st as (select body from public.app_state where id=1),
 pids as (
  select jsonb_object_keys(coalesce(st.body->'projectWorkAccess'->uid::text,'{}')) pid from st
  union
  select jsonb_object_keys(coalesce(st.body->'projectResponsibleLinks'->uid::text,'{}')) from st
 )
 select coalesce(jsonb_object_agg(pid,ids),'{}') from (
  select p.pid,coalesce((select jsonb_agg(o.id order by o.id) from public.obras o
                          where o.project_id=p.pid and secap_private.user_has_work(uid,o)),'[]') ids
  from pids p
 ) x
$$;

revoke all on function secap_private.norm_name(text),secap_private.acomp_names(text),secap_private.acomp_field(text),
 secap_private.user_has_work(uuid,public.obras),secap_private.effective_work_map(uuid) from public,anon;
grant execute on function secap_private.norm_name(text),secap_private.acomp_names(text),secap_private.acomp_field(text),
 secap_private.user_has_work(uuid,public.obras),secap_private.effective_work_map(uuid) to authenticated;

-- Regra de leitura/edição das obras (RLS).
create or replace function secap_private.obra_allowed(o public.obras,editing boolean default false) returns boolean
language plpgsql stable security definer set search_path='' as $$
begin
 if not secap_private.project_allowed(o.project_id,editing) then return false;end if;
 if public.is_admin() then return true;end if;
 return secap_private.user_has_work(auth.uid(),o);
end $$;
revoke all on function secap_private.obra_allowed(public.obras,boolean) from public,anon;
grant execute on function secap_private.obra_allowed(public.obras,boolean) to authenticated;

-- Seleção do usuário conectado (Acompanhamento e edição) já com as obras automáticas.
create or replace function public.secap_my_work_selection() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not coalesce(public.is_member(),false) then raise exception 'Acesso não aprovado.' using errcode='42501';end if;
 return jsonb_build_object(auth.uid()::text,secap_private.effective_work_map(auth.uid()));
end $$;
revoke all on function public.secap_my_work_selection() from public,anon;
grant execute on function public.secap_my_work_selection() to authenticated;

create or replace function public.secap_read_state() returns jsonb
language plpgsql security definer set search_path to '' as $function$
declare body_value jsonb; personal jsonb; member_email text;
begin
 if not public.is_member() then raise exception 'Acesso não aprovado.' using errcode='42501';end if;
 select body into body_value from public.app_state where id=1;
 if body_value is null then return body_value;end if;
 if public.is_admin() then return jsonb_set(body_value,'{logs}','[]'::jsonb);end if;
 select body into personal from public.secap_member_state where owner=auth.uid();
 select lower(email) into member_email from public.profiles where id=auth.uid();
 return jsonb_build_object(
   'projects',coalesce((select jsonb_agg((p-'records')||jsonb_build_object('records','[]'::jsonb)) from jsonb_array_elements(body_value->'projects') p where secap_private.project_allowed(p->>'id')),'[]'),
   'users','[]'::jsonb,
   'notes',coalesce(personal->'notes','[]'::jsonb),
   'terms','[]'::jsonb,
   'logs','[]'::jsonb,
   -- O usuário recebe apenas as próprias obras (individuais + Responsável Acompanhamento).
   'projectWorkAccess',jsonb_build_object(auth.uid()::text,secap_private.effective_work_map(auth.uid())),
   'fieldPermissions',jsonb_build_object(member_email,coalesce(body_value->'fieldPermissions'->member_email,'{}'::jsonb)),
   'rowFilters',jsonb_build_object(member_email,coalesce(body_value->'rowFilters'->member_email,'{}'::jsonb))
 );
end$function$;

-- Contexto administrativo: inclui vínculos por nome e obras efetivas (para a Verificação do projeto).
create or replace function public.secap_admin_permission_context() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not coalesce(public.is_admin(),false) then raise exception 'Acesso restrito.' using errcode='42501';end if;
 return jsonb_build_object(
  'users',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'email',email,'role',role,'projectScope',project_scope,'projectIds',project_ids,'obrasAccess',obras_access) order by name,id),'[]') from public.profiles where role in ('administrador','usuario')),
  'works',(select coalesce(body->'projectWorkAccess','{}') from public.app_state where id=1),
  'responsibleLinks',(select coalesce(body->'projectResponsibleLinks','{}') from public.app_state where id=1),
  'effectiveWorks',(select coalesce(jsonb_object_agg(id::text,secap_private.effective_work_map(id)),'{}') from public.profiles where role='usuario'),
  'fields',(select coalesce(body->'fieldPermissions','{}') from public.app_state where id=1));
end $$;
revoke all on function public.secap_admin_permission_context() from public,anon;
grant execute on function public.secap_admin_permission_context() to authenticated;

-- Campo Responsável (rótulo) passa a listar também quem recebe a obra pelo nome vinculado.
create or replace function secap_private.sync_work_responsibles(pid text,work_ids text[]) returns void
language plpgsql security definer set search_path='' as $$
declare state jsonb; owner_key text; item record; label text; previous_sync text; previous_reason text;
begin
 select body into state from public.app_state where id=1;
 select coalesce(nullif(p->'biMapping'->>'owner',''),'responsavel') into owner_key from jsonb_array_elements(state->'projects') p where p->>'id'=pid;
 owner_key:=coalesce(owner_key,'responsavel');
 -- Nunca sobrescreve o próprio Responsável Acompanhamento.
 if owner_key=secap_private.acomp_field(pid) then return;end if;
 previous_sync:=coalesce(current_setting('secap.responsible_sync',true),'');previous_reason:=coalesce(current_setting('secap.change_reason',true),'');
 perform set_config('secap.responsible_sync','true',true);perform set_config('secap.change_reason','Atribuição de responsáveis pelas permissões do projeto',true);
 for item in select * from public.obras where project_id=pid and id=any(work_ids) order by id for update loop
  select coalesce(string_agg(coalesce(nullif(btrim(p.name),''),p.email),'; ' order by lower(p.name),p.id),'') into label
  from public.profiles p
  where p.role in ('administrador','usuario') and secap_private.user_has_work(p.id,(select o from public.obras o where o.id=item.id));
  if item.responsavel is distinct from label or (owner_key<>'responsavel' and item.dados->>owner_key is distinct from label) then
   update public.obras set responsavel=label,dados=case when owner_key<>'responsavel' then jsonb_set(coalesce(dados,'{}'),array[owner_key],to_jsonb(label)) else dados end,updated_at=now() where id=item.id;
  end if;
 end loop;
 perform set_config('secap.responsible_sync',previous_sync,true);perform set_config('secap.change_reason',previous_reason,true);
end $$;
revoke all on function secap_private.sync_work_responsibles(text,text[]) from public,anon,authenticated;

-- Salvar: nomes vinculados + obras individuais + campos, em uma transação.
create or replace function public.secap_admin_save_project_permissions(p_user uuid,p_project text,p_works text[],p_fields text[],p_responsibles text[]) returns boolean
language plpgsql security definer set search_path='' as $$
declare state jsonb; names text[]; before_ids text[]; after_ids text[];
begin
 if auth.uid() is null or not coalesce(public.is_admin(),false) then raise exception 'Acesso restrito.' using errcode='42501';end if;
 if p_responsibles is null then raise exception 'Informe os responsáveis vinculados (pode ser lista vazia).';end if;
 select coalesce(array_agg(distinct btrim(x) order by btrim(x)),'{}') into names from unnest(p_responsibles) x where btrim(x)<>'';
 if cardinality(names)>100 or exists(select 1 from unnest(names) n where char_length(n)>254) then raise exception 'Confira os responsáveis vinculados.';end if;
 if cardinality(names)>0 and secap_private.acomp_field(p_project) is null then raise exception 'Este projeto não possui o campo Responsável Acompanhamento.';end if;
 select coalesce(array_agg(o.id),'{}') into before_ids from public.obras o where o.project_id=p_project and secap_private.user_has_work(p_user,o);
 select body into state from public.app_state where id=1 for update;
 -- Os vínculos são um objeto {uid: {projeto: [nomes]}}; se vierem em outro formato (ex.: [] de uma migração), recomeça vazio.
 if jsonb_typeof(state->'projectResponsibleLinks') is distinct from 'object' then state:=jsonb_set(state,'{projectResponsibleLinks}','{}');end if;
 if jsonb_typeof(state->'projectResponsibleLinks'->p_user::text) is distinct from 'object' then state:=jsonb_set(state,array['projectResponsibleLinks',p_user::text],'{}');end if;
 state:=jsonb_set(state,array['projectResponsibleLinks',p_user::text,p_project],to_jsonb(names));
 update public.app_state set body=state,updated_at=now() where id=1;
 -- Grava obras individuais e campos (valida, registra log e sincroniza responsáveis).
 perform public.secap_admin_save_project_permissions(p_user,p_project,p_works,p_fields);
 select coalesce(array_agg(o.id),'{}') into after_ids from public.obras o where o.project_id=p_project and secap_private.user_has_work(p_user,o);
 perform secap_private.sync_work_responsibles(p_project,before_ids||after_ids);
 return true;
end $$;
revoke all on function public.secap_admin_save_project_permissions(uuid,text,text[],text[],text[]) from public,anon;
grant execute on function public.secap_admin_save_project_permissions(uuid,text,text[],text[],text[]) to authenticated;

notify pgrst,'reload schema';
commit;
select 'Acesso pelo Responsável Acompanhamento ativado com sucesso' as resultado;
