-- SECAP · Planilha conectada e fórmulas financeiras: só o administrador altera.
--
-- Falha corrigida: secap_save_project_state (usada por usuários que editam o projeto) gravava o
-- objeto do projeto inteiro. Assim, um usuário limitado a algumas obras/campos podia:
--   • gravar project.sheetSync com uma planilha dele. A sincronia roda com service_role e ignora
--     as travas de obra e de campo, então a planilha dele sobrescrevia qualquer obra do projeto
--     (e recebia de volta os dados das obras que ele não pode ver);
--   • gravar project.financeFormulas, cujo gatilho (zz_obras_financial_formulas) roda depois da
--     trava de campos e sobrescreve campos que ele não pode editar.
-- Agora, se sheetSync ou financeFormulas mudarem nessa função, ela recusa. O administrador salva
-- por outro caminho e continua podendo conectar planilhas e configurar fórmulas.
--
-- O script acrescenta a checagem na definição que está em produção (preserva ajustes posteriores,
-- como o errcode P0001 de no_retry_conflicts.sql). Reaplicável: não faz nada se já aplicado.
begin;

do $$
declare
  fn regprocedure := 'public.secap_save_project_state(jsonb,jsonb,jsonb)'::regprocedure;
  def text := pg_get_functiondef(fn);
  guard text := $g$
  if exists (select 1 from jsonb_array_elements(current_visible) cv where cv->>'id'=item->>'id'
             and ((item->'sheetSync') is distinct from (cv->'sheetSync')
                  or (item->'financeFormulas') is distinct from (cv->'financeFormulas'))) then
   raise exception 'Somente administradores podem conectar planilhas ou alterar fórmulas financeiras.' using errcode='42501';
  end if;
 end loop;$g$;
begin
  if def like '%Somente administradores podem conectar planilhas%' then
    raise notice 'Já aplicado.';
    return;
  end if;
  if def !~ 'end loop;' then
    raise exception 'Definição inesperada de secap_save_project_state: confira antes de aplicar.';
  end if;
  -- Sem a flag 'g': troca só o primeiro (e único) "end loop;", o do laço que confere cada projeto.
  execute regexp_replace(def, '\s*end loop;', guard);
end $$;

notify pgrst, 'reload schema';
commit;

-- Planilhas já conectadas: confira se foram conectadas por um administrador.
select p->>'id' as projeto, p->>'name' as nome, p->'sheetSync'->>'conectadoPor' as conectado_por,
       p->'sheetSync'->>'url' as planilha
from public.app_state, jsonb_array_elements(body->'projects') p
where id = 1 and coalesce((p->'sheetSync'->>'ativo')::boolean, false);
