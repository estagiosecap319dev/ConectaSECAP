# Instalação no Supabase em nuvem

Roteiro **testado** para instalar o banco do portal num projeto Supabase novo (vazio).

## Ordem de execução

Execute cada arquivo inteiro, **nesta ordem**, no SQL Editor do projeto (ou com `psql` usando o usuário `postgres`). Todos devem terminar sem erro.

| # | Arquivo |
|---|---|
| 1 | `supabase/migrations/20261105120000_secap.sql` |
| 2 | `supabase/migrations/20261109120000_modernization.sql` |
| 3 | `supabase/migrations/20261109120001_account_request_actions.sql` |
| 4 | `supabase/migrations/20261109130000_admin_account_requests_rpc.sql` |
| 5 | `supabase/migrations/20261109140000_harden_account_request_actions.sql` |
| 6 | `supabase/migrations/20261110120000_approved_users_access.sql` |
| 7 | `supabase/migrations/20261110130000_request_on_signup.sql` |
| 8 | `supabase/migrations/20261111120000_obras_access.sql` |
| 9 | `supabase/migrations/20261111130000_tabela_obras.sql` |
| 10 | `supabase/migrations/20261111140000_planilhas_importadas.sql` |
| 11 | `supabase/migrations/20261111150000_planilhas_sincronia.sql` |
| 12 | `supabase/migrations/20261113120000_remove_modernization.sql` |
| 13 | `supabase/migrations/20261117120000_sincronizar_seguranca.sql` |
| 14 | `supabase/migrations/20261117130000_endurecer_rls.sql` |
| 15 | `supabase/migrations/20261117140000_filtro_obras_por_usuario.sql` |
| 16 | `supabase/migrations/20261117150000_registro_semanal.sql` |
| 17 | `supabase/migrations/20261117160000_meeting_participants.sql` |
| 18 | `supabase/security/agenda_audit_update.sql` |
| 19 | `supabase/security/audit_name_dependency_fix.sql` |
| 20 | `supabase/security/audit_deduplicate.sql` |
| 21 | `supabase/security/recent_editors.sql` |
| 22 | `supabase/security/project_work_selection.sql` |
| 23 | `supabase/security/project_permission_review.sql` |
| 24 | `supabase/security/assigned_works_visibility.sql` |
| 25 | `supabase/security/work_responsibles_sync.sql` |
| 26 | `supabase/security/permission_works_acompanhamento.sql` |
| 27 | `supabase/security/responsible_acompanhamento_access.sql` |
| 28 | `supabase/security/sheet_sync.sql` |
| 29 | `supabase/security/work_responsibility_optional.sql` |
| 30 | `supabase/security/recent_editor_details.sql` |
| 31 | `supabase/security/weekly_notify.sql` |
| 32 | `supabase/security/admin_notifications.sql` |
| 33 | `supabase/security/user_notifications.sql` |
| 34 | `supabase/security/work_responsibles_manual.sql` (Responsável pela próxima ação preenchido à mão) |
| 35 | `supabase/security/no_retry_conflicts.sql` (evita repetição automática de conflitos pelo PostgREST) |
| 36 | `supabase/security/performance_advisor.sql` (regras de acesso otimizadas e índices de chaves estrangeiras) |

### NÃO executar num banco novo

- `supabase/security/project_access.sql` e `supabase/security/audit_admin.sql`: já estão dentro da migração 13 (`20261117120000_sincronizar_seguranca.sql`). Rodar depois traz de volta versões antigas — o `audit_admin.sql` chega a falhar (“function index_legacy_audit(jsonb) is not unique”).
- `supabase/security/work_responsibility_required.sql`: tornaria obrigatório o “Responsável pela próxima ação”, que hoje é opcional.
- `supabase/security/meeting_participants.sql`: já coberto pela migração 17.
- `supabase/security/diagnostico_nomes.sql`: apenas consulta de diagnóstico.
- `supabase/snippets/*`: rascunhos do editor.

Os arquivos 18 a 32 podem ser reaplicados sem efeito colateral (testado).

## Diferença importante da nuvem

No Supabase em nuvem, tabelas novas **não** dão leitura/gravação automática aos papéis `anon`, `authenticated` e `service_role` (no Supabase local antigo davam). Os scripts já concedem explicitamente o necessário; em especial `sheet_sync.sql` e `weekly_notify.sql` liberam ao `service_role` a leitura de `app_state`, `obras` e `profiles`, usada pelo servidor do portal (sincronia da planilha e notificação semanal).

## Depois de instalar

1. **Primeiro cadastro vira administrador.** Crie a conta de administrador antes de divulgar o portal.
2. No portal, `public/supabase-config.js`: troque a URL local pela URL do projeto e a chave pública (anon/publishable) do projeto.
3. No servidor do portal: em `data/sheet-sync.json` e `data/weekly-notify.json`, troque `supabase_url` e `service_role_key` pelos do projeto em nuvem.
4. Os **dados** (obras, projeto, usuários) não são copiados por estes scripts. Usuários precisam se cadastrar de novo na nuvem; as obras podem ser importadas pela planilha ou migradas à parte.

## Instalação feita (19/11/2026)

Projeto **DirgovDev's Project** (`https://yawnjpffwulxhykmigfn.supabase.co`), aplicado pela ferramenta de migrações do Supabase (histórico em *Database → Migrations*):

- Arquivos 1–18, 21, 22 e 27–32 aplicados na ordem acima.
- 19, 20 e 23–26 não foram reenviados: o conteúdo deles está 100% contido nos arquivos 18 e 22 (verificado linha a linha), então não mudariam nada.
- Conferência: funções (64), colunas (93), índices (33), RLS (14 tabelas) e gatilhos (10) idênticos ao banco de teste aprovado; as 20 políticas RLS idênticas às do banco local em uso.
- 23 testes de funcionamento executados na própria nuvem, dentro de uma transação desfeita ao final (nenhum dado ficou gravado): administrador, usuária vinculada pelo Responsável Acompanhamento, usuário sem vínculo, visitante sem login, chave de serviço, planilha, auditoria, notificação semanal e sino — todos aprovados.
- Avisos do Security Advisor: apenas os esperados — 3 tabelas internas com RLS sem política (acesso só pelas funções do sistema), `admin_exists`/`email_is_admin` liberadas para a tela de entrada e as funções RPC do portal (cada uma confere administrador/membro internamente).

## Testes realizados (19/11/2026)

Banco de teste réplica do projeto em nuvem (Postgres 17, regras de privilégio e de RLS automático iguais às do projeto), instalado do zero com a ordem acima:

- 32 arquivos sem erro; estrutura final (funções, políticas RLS, gatilhos, colunas, índices) idêntica ao banco local em uso.
- 36 testes de funcionamento aprovados com dados reais de amostra: administrador vê tudo; usuário vinculado pelo Responsável Acompanhamento vê só suas obras e o acesso acompanha o campo em tempo real; usuário sem vínculo e visitante sem login não veem obras; edição limitada aos campos liberados; funções de administrador, planilha e notificação bloqueadas para usuários comuns; responsável opcional; auditoria com autor; “Quem editou recentemente” e detalhe; sincronia da planilha pelo servidor; notificação semanal, registro na auditoria e sino do administrador.
- Reaplicação dos scripts 18–32: nenhuma alteração em dados ou estrutura.
- Portal: 30 arquivos JavaScript e 3 Python sem erro; sincronia da planilha (18 testes com planilha simulada) aprovada.
