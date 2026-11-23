# Sincronia com a planilha Google (obras_prioritarias)

O portal e a planilha do Google ficam ligados nos dois sentidos:

- alterou uma obra no portal → a linha da obra é atualizada na planilha;
- alterou a planilha → a obra é atualizada no portal (na Auditoria aparece como **Planilha Google (sincronização)**).

A sincronia roda dentro do servidor do portal (`server.py`), a cada 60 segundos, **enquanto o portal estiver ligado**. O que mudar com o portal desligado é sincronizado quando ele voltar.

## Regras

| Situação | O que acontece |
|---|---|
| Mudou só no portal | Vai para a planilha |
| Mudou só na planilha | Vai para o portal |
| Mesma célula mudou nos dois lados entre duas sincronias | **Conflito**: vence o portal (configurável) e o caso fica no relatório |
| Obra nova no portal com ID | Nova linha no fim da planilha |
| Linha nova na planilha com ID e nome | Nova obra no portal |
| Obra excluída em um dos lados | **Não** é excluída no outro; só aparece no relatório |
| Célula com fórmula na planilha | Nunca é sobrescrita; o valor da planilha prevalece |
| ID repetido ou obra sem ID | Não sincroniza; aparece nos avisos |

As linhas são ligadas pela coluna **ID** (campo `codigo`). As colunas são ligadas pelo nome do cabeçalho, igual à importação do portal. A aba e a linha de cabeçalho são detectadas automaticamente (ou fixadas em `"aba"`).

O campo **Responsável pela próxima ação** fica fora da sincronia por padrão (`campos_ignorados`). Desde 23/11/2026 ele é preenchido à mão no portal (`work_responsibles_manual.sql`); para que a planilha também o atualize, remova `"responsavel"` de `campos_ignorados`.

> Atenção: quem edita a planilha não passa pelas permissões do portal (Responsável Acompanhamento, campos liberados). Mantenha como editores da planilha apenas pessoas que podem alterar qualquer obra. Toda alteração vinda da planilha fica registrada na Auditoria.

## Instalação (uma vez)

### 1. Banco
No SQL Editor do Supabase usado pelo portal, execute todo o arquivo `supabase/security/sheet_sync.sql`. Resultado: “Sincronia com a planilha Google preparada com sucesso”.

### 2. Python
```powershell
python -m pip install pyjwt cryptography
```

### 3. Conta técnica do Google (conta de serviço)
1. Acesse https://console.cloud.google.com/ com a conta da equipe e crie (ou escolha) um projeto.
2. Em **APIs e serviços → Biblioteca**, ative **Google Sheets API**.
3. Em **APIs e serviços → Credenciais → Criar credenciais → Conta de serviço**, crie uma conta (ex.: `portal-secap-sync`).
4. Abra a conta criada → **Chaves → Adicionar chave → JSON**. Salve o arquivo como `data/google-service-account.json` dentro da pasta do portal. **Não compartilhe nem envie esse arquivo**: a pasta `data/` não vai para o Git.
5. Copie o e-mail da conta de serviço (termina em `.iam.gserviceaccount.com`).

### 4. Compartilhar a planilha
O dono da planilha **obras_prioritarias** compartilha o arquivo com o e-mail da conta de serviço como **Editor**.

### 5. Configurar o portal
1. Copie `sheet-sync.example.json` para `data/sheet-sync.json`.
2. Em `service_role_key`, coloque a chave `SERVICE_ROLE_KEY` mostrada por `supabase status` (ou defina a variável de ambiente `SECAP_SERVICE_ROLE_KEY` e deixe o campo vazio). Essa chave tem acesso total ao banco: não a coloque em arquivos públicos.
3. Confira `planilha_id` (o trecho do link entre `/d/` e `/edit`) e `projeto_id`.

### 6. Primeira sincronia (conferência)
Com `"primeira_sincronia": "relatorio"`, rode:
```powershell
python sheet_sync.py --relatorio
```
Nada é gravado. O resultado mostra as diferenças entre portal e planilha; a lista completa fica em `data/sheet-sync-relatorio.json`.

Depois de conferir, escolha quem prevalece **apenas nesta primeira vez** e edite `data/sheet-sync.json`:
- `"primeira_sincronia": "portal"` → a planilha recebe os valores do portal e as obras que só existem no portal viram linhas novas;
- `"primeira_sincronia": "planilha"` → o portal recebe os valores da planilha e as linhas que só existem na planilha viram obras novas.

Rode `python sheet_sync.py --uma-vez`. A partir daí as mudanças seguem as regras da tabela acima.

### 7. Ligar
Reinicie o portal (`python server.py`). Na inicialização aparece “Sincronia com a planilha Google: ativa”.

## Acompanhamento

- Situação da última execução: http://127.0.0.1:8080/api/sheet-sync/status
- Relatório da última execução: `data/sheet-sync-relatorio.json` (conflitos, avisos, obras só em um dos lados)
- Histórico: `data/sheet-sync.log`
- Pausar: `"ativo": false` em `data/sheet-sync.json` (vale no próximo ciclo). Recomeçar do zero: apague `data/sheet-sync-state.json`.

## Testes realizados

Com planilha simulada e um projeto de teste isolado no banco local (removido após o teste): detecção da aba e do cabeçalho, relatório sem gravação, primeira sincronia, planilha → portal (coluna e campo personalizado), portal → planilha (número e data), conflito com vitória do portal, fórmula preservada, obra nova nos dois sentidos, exclusão apenas relatada, ciclo seguinte estável e autoria na Auditoria. A conexão real com o Google ainda depende da conta de serviço (passos 3 a 5).
