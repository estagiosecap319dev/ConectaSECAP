# Exportação automática dos projetos para o Google Drive

## O que acontece

- **Projeto criado no portal:** em até 15 minutos aparece no Drive, na pasta **Conecta SECAP - Projetos**, uma planilha Google com o **nome do projeto** e todo o conteúdo dele.
- **Projeto alterado** (linhas, campos, marcos ou nome): a **mesma planilha** é atualizada. Nunca são criadas cópias. Se o projeto for renomeado, a planilha também é renomeada.
- **Toda segunda-feira, às 3h:** todos os projetos são exportados de novo, mesmo sem alteração, e o arquivo `conecta-secap-backup-completo.json` é atualizado. Esse arquivo serve para restaurar o sistema.
- **Erros:** se algo falhar, chega um e-mail para a conta Google que roda o script.

Cada planilha tem quatro abas:

| Aba | Conteúdo |
|---|---|
| **Registros** | todas as linhas do projeto, com uma coluna para cada campo |
| **Campos** | os campos do projeto: nome, tipo e opções |
| **Marcos** | fases e marcos, com status e progresso |
| **Projeto** | descrição, quantidades e data da última exportação |

> A planilha é uma **cópia** do portal. Edições feitas nela são apagadas na próxima atualização. Para alterar dados, use o portal.
> Projetos excluídos no portal **continuam** no Drive. Apague a planilha manualmente, se quiser.

## Instalação (uma vez, cerca de 10 minutos)

1. Acesse <https://script.google.com> com a conta Google que vai guardar as planilhas e clique em **Novo projeto**.
2. Dê ao projeto o nome `Conecta SECAP - Exportação`.
3. Apague o conteúdo do arquivo `Código.gs` e cole o conteúdo de [Codigo.gs](Codigo.gs).
4. Clique em ⚙️ **Configurações do projeto**:
   - em **Fuso horário**, escolha `(GMT-03:00) São Paulo`;
   - em **Propriedades do script**, adicione:

     | Propriedade | Valor |
     |---|---|
     | `SUPABASE_URL` | URL do projeto. No Supabase: Project Settings → API → Project URL |
     | `SUPABASE_SERVICE_ROLE_KEY` | chave `service_role`. No Supabase: Project Settings → API |

5. No editor, selecione a função **`exportarTudo`** e clique em **Executar**. Na primeira vez, o Google pede autorização: aceite. As planilhas de todos os projetos são criadas.
6. Selecione a função **`instalarAgendamento`** e clique em **Executar**. A partir daí, tudo é automático.

## Segurança

- A chave `service_role` dá acesso total ao banco. Guarde-a **somente** nas Propriedades do script, nunca no código, e não compartilhe esse projeto do Apps Script.
- As planilhas contêm dados internos. Compartilhe a pasta apenas com quem precisa.
- Ative a verificação em duas etapas na conta Google que guarda as planilhas.
