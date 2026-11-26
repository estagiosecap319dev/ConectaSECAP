# Pasta `supabase/security` — leia antes de rodar qualquer script

Estes scripts **não** são migrações automáticas: foram aplicados à mão, em ordem, no banco em produção.
Vários deles **redefinem as mesmas funções**. Rodar de novo um script antigo **troca a regra atual por
uma versão anterior, sem aviso**. Exemplos reais:

| Script antigo | O que ele desfaz se for rodado de novo |
|---|---|
| `project_access.sql` | Volta versões antigas de `secap_read_state` (sem a lista de obras liberadas por usuário e sem filtros de linha) e da trava de campos. O banco continua filtrando as obras, mas a tela deixa de saber quais obras o usuário pode editar. |
| `audit_admin.sql` | Recria a auditoria **só para edição**: criação e exclusão de obras deixam de ser registradas. |
| `work_responsibility_required.sql` × `work_responsibility_optional.sql` | Um liga e o outro desliga a exigência de responsável. O último rodado é o que vale. |
| `project_work_selection.sql` × `responsible_acompanhamento_access.sql` | Redefinem as mesmas funções de permissão. A versão de `secap_read_state` em produção é a de `responsible_acompanhamento_access.sql` (a única que usa `effective_work_map`). |

## Regras

1. **Não rode** um script desta pasta “só para garantir”. Rode apenas o script novo da mudança que você está fazendo.
2. **Depois de rodar qualquer coisa**, rode `verificar_seguranca.sql` no SQL Editor (é só leitura).
   Todas as linhas precisam sair `ok = true`. Se alguma sair `false`, uma proteção foi desfeita.
3. Mudanças novas de segurança devem ir para `supabase/migrations/` com data no nome, nunca aqui.

## Estado conferido em 26/11/2026 (produção)

- Trava de campos e trava de exclusão ativas na tabela `obras`.
- Auditoria registra **criação, edição e exclusão** de obras, campo a campo, com valor antes/depois.
- Leitura e edição de obras filtradas por projeto **e** por obra liberada.
- RLS ligado em todas as tabelas; usuário sem login não acessa nenhuma tabela.
- Todas as funções de administrador conferem internamente se quem chama é administrador;
  as da sincronia e das notificações só aceitam o servidor (`service_role`).

## Pendências que dependem do painel do Supabase

- **Proteção contra senhas vazadas** está desligada: Authentication → Policies (ou Password security)
  → ativar “Leaked password protection”.
- `email_is_admin()` pode ser chamada sem login e revela se um e-mail é de administrador.
  Ela é usada na tela de cadastro; removê-la exige mudar o fluxo de cadastro.
