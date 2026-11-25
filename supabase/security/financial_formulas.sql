-- SECAP · Fórmulas do módulo financeiro (iguais às da planilha obras_prioritarias, aba PIPELINE).
--
-- Sempre que uma obra é gravada (portal, sincronia com a planilha ou importação), o banco
-- recalcula os campos financeiros abaixo a partir dos valores informados. Assim o portal
-- mostra o mesmo resultado que a planilha, sem esperar a próxima sincronia.
--
--   Campo do portal                         Coluna  Fórmula da planilha
--   federal_total                           AP      =SUM(AQ:AS)          (Recursos Federais 2026..2028)
--   municipal_total                         AT      =SUM(AU:AW)          (Recursos Municipais 2026..2028)
--   outros_total                            AX      =SUM(AY:BA)          (Recursos - Outros 2026..2028)
--   f_valorcomsolicitacaofinanceira_2010    AL      =IFERROR(SUM(AP;AT;AX);"")
--   total_2026 / total_2027                 AM/AN   =IFERROR(IF(AL=0; ROUND(MAX(0; MIN(Z+AA-1;31/12/ano) - MAX(Z;01/01/ano) + 1) * (Q/AA); 2);
--                                                              SUM(federal;municipal;outros do ano)); "")
--   total_2028                              AO      =IFERROR(IF(AL=0; MAX(0; Q - AM - AN); SUM(federal;municipal;outros 2028)); "")
--   valor_total                             AK      =SUM(AM:AO)
--
--   Q = valor (Valor Estimado Execução Obra), Z = prev_mobilizacao (Previsão Mobilização),
--   AA = f_previsaoexecucaodias_e9fa (Previsão Execução em dias).
--
-- Regras da planilha reproduzidas: SUM ignora texto e vazio; numa conta (Q, Z, AA) vazio vale 0
-- e texto dá erro; IFERROR devolve "" (vazio), e esse "" vale 0 quando entra em outra conta
-- (comportamento do Google Sheets). Divisão por AA = 0 ou vazio dá erro -> "".
--
-- Só vale para os projetos listados em public.secap_financial_formula_projects.
-- Não recalcula obras antigas sozinho: cada obra é recalculada na próxima gravação.
-- Reaplicável.
begin;

create schema if not exists secap_private;

create table if not exists public.secap_financial_formula_projects (
  project_id text primary key
);
alter table public.secap_financial_formula_projects enable row level security;
revoke all on public.secap_financial_formula_projects from anon, authenticated;
insert into public.secap_financial_formula_projects(project_id)
values ('8a68ca25-f76f-498c-819a-5e7743122a0c')
on conflict do nothing;

-- Valor para SUM: número; texto e vazio contam 0.
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

create or replace function secap_private.fin_num(v numeric)
returns jsonb language sql immutable set search_path = '' as $$
  select case when v is null then to_jsonb(''::text) else to_jsonb(v) end
$$;

-- Calcula os campos financeiros. Devolve só as chaves calculadas (número ou "").
create or replace function secap_private.obra_financial_formulas(p_valor numeric, d jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  fed numeric; mun numeric; outr numeric; al numeric;
  q numeric := coalesce(p_valor, 0);
  z numeric := secap_private.fin_date_arg(d -> 'prev_mobilizacao');
  aa numeric := secap_private.fin_calc_arg(d -> 'f_previsaoexecucaodias_e9fa');
  t jsonb := '{}'::jsonb;
  y integer; v numeric; t26 numeric; t27 numeric; t28 numeric;
begin
  fed := secap_private.fin_sum_arg(d -> 'federal_2026') + secap_private.fin_sum_arg(d -> 'federal_2027') + secap_private.fin_sum_arg(d -> 'federal_2028');
  mun := secap_private.fin_sum_arg(d -> 'municipal_2026') + secap_private.fin_sum_arg(d -> 'municipal_2027') + secap_private.fin_sum_arg(d -> 'municipal_2028');
  outr := secap_private.fin_sum_arg(d -> 'outros_2026') + secap_private.fin_sum_arg(d -> 'outros_2027') + secap_private.fin_sum_arg(d -> 'outros_2028');
  al := fed + mun + outr;

  for y in 2026..2027 loop
    if al = 0 then
      if z is null or aa is null or aa = 0 then
        v := null;
      else
        v := round(greatest(0, least(z + aa - 1, (make_date(y, 12, 31) - date '1899-12-30'))
                              - greatest(z, (make_date(y, 1, 1) - date '1899-12-30')) + 1) * (q / aa), 2);
      end if;
    else
      v := secap_private.fin_sum_arg(d -> ('federal_' || y)) + secap_private.fin_sum_arg(d -> ('municipal_' || y))
           + secap_private.fin_sum_arg(d -> ('outros_' || y));
    end if;
    if y = 2026 then t26 := v; else t27 := v; end if;
  end loop;

  if al = 0 then
    -- No Google Sheets, o "" devolvido pelo IFERROR de AM/AN vale 0 numa conta.
    t28 := greatest(0, q - coalesce(t26, 0) - coalesce(t27, 0));
  else
    t28 := secap_private.fin_sum_arg(d -> 'federal_2028') + secap_private.fin_sum_arg(d -> 'municipal_2028')
           + secap_private.fin_sum_arg(d -> 'outros_2028');
  end if;

  return jsonb_build_object(
    'federal_total', fed,
    'municipal_total', mun,
    'outros_total', outr,
    'f_valorcomsolicitacaofinanceira_2010', al,
    'total_2026', secap_private.fin_num(t26),
    'total_2027', secap_private.fin_num(t27),
    'total_2028', secap_private.fin_num(t28),
    'valor_total', coalesce(t26, 0) + coalesce(t27, 0) + coalesce(t28, 0));
end $$;

create or replace function secap_private.apply_obra_financial_formulas()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.secap_financial_formula_projects f where f.project_id = new.project_id) then
    new.dados := coalesce(new.dados, '{}'::jsonb)
                 || secap_private.obra_financial_formulas(new.valor, coalesce(new.dados, '{}'::jsonb));
  end if;
  return new;
end $$;
revoke all on function secap_private.apply_obra_financial_formulas() from public, anon, authenticated;

-- "zz_": roda depois das travas de permissão (gatilhos BEFORE rodam em ordem alfabética).
drop trigger if exists zz_obras_financial_formulas on public.obras;
create trigger zz_obras_financial_formulas
  before insert or update of valor, dados on public.obras
  for each row execute function secap_private.apply_obra_financial_formulas();

commit;
select 'Fórmulas do módulo financeiro instaladas com sucesso' as resultado;
