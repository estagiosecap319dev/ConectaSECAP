-- SECAP · Fórmulas financeiras configuráveis.
--
-- O administrador configura as fórmulas de cada projeto no portal (botão "Fórmulas financeiras"
-- na pasta do projeto). Elas ficam na configuração do projeto (app_state -> projects[].financeFormulas),
-- já em ordem de cálculo, cada uma com o campo de resultado ("target") e a árvore da conta ("ast").
--
-- Sempre que uma obra é gravada (portal, sincronia com a planilha ou importação), o gatilho abaixo
-- aplica as fórmulas do projeto e grava os resultados. A mesma conta é feita no navegador
-- (public/finance-formulas.js) só para mostrar o resultado enquanto se digita.
--
-- Regras iguais às da planilha (Google Sheets):
--   SOMA ignora texto e vazio; numa conta, vazio vale 0 e texto dá erro; erro (inclusive divisão
--   por zero) deixa o resultado vazio (""); um resultado vazio vale 0 quando entra em outra conta.
--
-- Nós da árvore: num, ref, sum, op (+ - * /), neg, cmp (= <> < > <= >=), if, fn (max, min, round),
--   split (RATEIO_ANO: valor distribuído pelos dias de execução que caem no ano).
--
-- Também cria public.secap_financial_recalc(projeto), usada pelo botão "Recalcular obras agora".
-- Reaplicável. Não altera obras na instalação.
begin;

create schema if not exists secap_private;

-- Remove a primeira versão (fórmulas fixas), caso tenha sido instalada.
drop table if exists public.secap_financial_formula_projects;
drop function if exists secap_private.obra_financial_formulas(numeric, jsonb);

-- Valor para SOMA: número; texto e vazio contam 0.
create or replace function secap_private.fin_sum_arg(v jsonb)
returns numeric language sql immutable set search_path = '' as $$
  select case
    when v is null or jsonb_typeof(v) = 'null' then 0
    when jsonb_typeof(v) = 'number' then (v #>> '{}')::numeric
    when jsonb_typeof(v) = 'string' and btrim(v #>> '{}') ~ '^-?[0-9]+(\.[0-9]+)?$' then btrim(v #>> '{}')::numeric
    else 0 end
$$;

-- Valor numa conta: número; vazio = 0; texto = erro (null).
create or replace function secap_private.fin_calc_arg(v jsonb)
returns numeric language sql immutable set search_path = '' as $$
  select case
    when v is null or jsonb_typeof(v) = 'null' then 0
    when jsonb_typeof(v) = 'number' then (v #>> '{}')::numeric
    when jsonb_typeof(v) = 'string' and btrim(v #>> '{}') = '' then 0
    when jsonb_typeof(v) = 'string' and btrim(v #>> '{}') ~ '^-?[0-9]+(\.[0-9]+)?$' then btrim(v #>> '{}')::numeric
    else null end
$$;

-- Data numa conta: número de série do Sheets (dias desde 30/12/1899); vazio = 0; texto = erro.
create or replace function secap_private.fin_date_arg(v jsonb)
returns numeric language plpgsql immutable set search_path = '' as $$
declare s text := btrim(coalesce(v #>> '{}', ''));
begin
  if s = '' then return 0; end if;
  if s ~ '^\d{4}-\d{2}-\d{2}' then
    return (left(s, 10)::date - date '1899-12-30');
  end if;
  return null;
exception when others then
  return null;
end $$;

-- Avalia um nó da árvore. vals = valores atuais da obra (campos padrão + dados). null = erro.
create or replace function secap_private.fin_eval(n jsonb, vals jsonb, depth integer default 0)
returns numeric language plpgsql immutable set search_path = '' as $$
declare
  t text := n ->> 't';
  a numeric; b numeric; c numeric; x numeric; r numeric;
  q numeric; z numeric; aa numeric; y integer; places integer;
  item jsonb;
begin
  if n is null or depth > 40 then return null; end if;
  if t = 'num' then
    return (n ->> 'v')::numeric;
  elsif t = 'ref' then
    return secap_private.fin_calc_arg(vals -> (n ->> 'f'));
  elsif t = 'sum' then
    r := 0;
    for item in select * from jsonb_array_elements(coalesce(n -> 'f', '[]'::jsonb)) loop
      r := r + secap_private.fin_sum_arg(vals -> (item #>> '{}'));
    end loop;
    return r;
  elsif t = 'neg' then
    a := secap_private.fin_eval(n -> 'a', vals, depth + 1);
    return -a;
  elsif t = 'op' then
    a := secap_private.fin_eval(n -> 'a', vals, depth + 1);
    b := secap_private.fin_eval(n -> 'b', vals, depth + 1);
    if a is null or b is null then return null; end if;
    case n ->> 'o'
      when '+' then return a + b;
      when '-' then return a - b;
      when '*' then return a * b;
      when '/' then return case when b = 0 then null else a / b end;
      else return null;
    end case;
  elsif t = 'cmp' then
    a := secap_private.fin_eval(n -> 'a', vals, depth + 1);
    b := secap_private.fin_eval(n -> 'b', vals, depth + 1);
    if a is null or b is null then return null; end if;
    return case n ->> 'o'
      when '=' then (a = b)::int when '<>' then (a <> b)::int
      when '<' then (a < b)::int when '>' then (a > b)::int
      when '<=' then (a <= b)::int when '>=' then (a >= b)::int
      else null end;
  elsif t = 'if' then
    c := secap_private.fin_eval(n -> 'c', vals, depth + 1);
    if c is null then return null; end if;
    return case when c <> 0 then secap_private.fin_eval(n -> 'a', vals, depth + 1)
                else secap_private.fin_eval(n -> 'b', vals, depth + 1) end;
  elsif t = 'fn' then
    if jsonb_array_length(coalesce(n -> 'args', '[]'::jsonb)) = 0 then return null; end if;
    if n ->> 'n' = 'round' then
      a := secap_private.fin_eval(n -> 'args' -> 0, vals, depth + 1);
      b := case when jsonb_array_length(n -> 'args') > 1 then secap_private.fin_eval(n -> 'args' -> 1, vals, depth + 1) else 0 end;
      if a is null or b is null then return null; end if;
      places := greatest(0, least(10, trunc(b)::int));
      return round(a, places);
    end if;
    r := null;
    for item in select * from jsonb_array_elements(n -> 'args') loop
      x := secap_private.fin_eval(item, vals, depth + 1);
      if x is null then return null; end if;
      r := case when r is null then x
                when n ->> 'n' = 'max' then greatest(r, x)
                when n ->> 'n' = 'min' then least(r, x)
                else null end;
      if r is null then return null; end if;
    end loop;
    return r;
  elsif t = 'split' then
    q := secap_private.fin_calc_arg(vals -> (n ->> 'v'));
    z := secap_private.fin_date_arg(vals -> (n ->> 's'));
    aa := secap_private.fin_calc_arg(vals -> (n ->> 'd'));
    y := (n ->> 'y')::int;
    if q is null or z is null or aa is null or aa = 0 then return null; end if;
    return round(greatest(0, least(z + aa - 1, make_date(y, 12, 31) - date '1899-12-30')
                             - greatest(z, make_date(y, 1, 1) - date '1899-12-30') + 1) * (q / aa), 2);
  end if;
  return null;
exception when others then
  return null; -- conta impossível (ex.: número grande demais) = erro, como na planilha
end $$;

-- Fórmulas do projeto (já em ordem de cálculo).
create or replace function secap_private.fin_project_formulas(p_project text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce((
    select x -> 'financeFormulas'
    from public.app_state s, jsonb_array_elements(coalesce(s.body -> 'projects', '[]'::jsonb)) x
    where s.id = 1 and x ->> 'id' = p_project
    limit 1), '[]'::jsonb)
$$;
revoke all on function secap_private.fin_project_formulas(text) from public, anon, authenticated;

create or replace function secap_private.apply_obra_financial_formulas()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  formulas jsonb := secap_private.fin_project_formulas(new.project_id);
  vals jsonb; f jsonb; target text; v numeric; result jsonb; n integer := 0;
begin
  if jsonb_typeof(formulas) <> 'array' or jsonb_array_length(formulas) = 0 then
    return new;
  end if;
  vals := coalesce(new.dados, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
    'nome', new.nome, 'status', new.status, 'valor', new.valor, 'executado', new.executado,
    'prazo', new.prazo, 'responsavel', new.responsavel, 'progresso', new.progresso,
    'proxima', new.proxima, 'orgao', new.orgao));
  for f in select * from jsonb_array_elements(formulas) loop
    n := n + 1;
    exit when n > 100;
    target := f ->> 'target';
    continue when coalesce(target, '') = '' or target in ('nome', 'status', 'prazo', 'responsavel', 'proxima', 'orgao');
    v := secap_private.fin_eval(f -> 'ast', vals);
    result := case when v is null then to_jsonb(''::text) else to_jsonb(round(v, 2)) end;
    vals := vals || jsonb_build_object(target, result);
    if target = 'valor' then new.valor := round(v, 2);
    elsif target = 'executado' then new.executado := round(v, 2);
    elsif target = 'progresso' then new.progresso := round(v, 2);
    else new.dados := coalesce(new.dados, '{}'::jsonb) || jsonb_build_object(target, result);
    end if;
  end loop;
  return new;
end $$;
revoke all on function secap_private.apply_obra_financial_formulas() from public, anon, authenticated;

-- "zz_": roda depois das travas de permissão (gatilhos BEFORE rodam em ordem alfabética).
drop trigger if exists zz_obras_financial_formulas on public.obras;
create trigger zz_obras_financial_formulas
  before insert or update on public.obras
  for each row execute function secap_private.apply_obra_financial_formulas();

-- Botão "Recalcular obras agora" (somente administradores): regrava as obras do projeto para o
-- gatilho aplicar as fórmulas atuais. Só altera as obras cujo resultado muda.
create or replace function public.secap_financial_recalc(p_project text)
returns integer language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  if auth.uid() is null or not coalesce(public.is_admin(), false) then
    raise exception 'Somente administradores recalculam as fórmulas.' using errcode = '42501';
  end if;
  with calc as (
    select o.id, o.dados as antes from public.obras o where o.project_id = p_project
  ), upd as (
    update public.obras o set dados = o.dados from calc where o.id = calc.id returning o.id, o.dados, calc.antes
  )
  select count(*) into changed from upd where upd.dados is distinct from upd.antes;
  return changed;
end $$;
revoke all on function public.secap_financial_recalc(text) from public, anon;
grant execute on function public.secap_financial_recalc(text) to authenticated;

notify pgrst, 'reload schema';
commit;
select 'Fórmulas financeiras configuráveis instaladas com sucesso' as resultado;
