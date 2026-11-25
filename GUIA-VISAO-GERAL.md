# Visão Geral e indicadores

## O que mudou

- A Visão Geral mostra resumo, conferência dos dados, prioridades, situação das obras, resumo por projeto, financeiro e próximas entregas.
- “Quem editou recentemente” foi mantido, com o mesmo código e consulta da versão enviada.
- No projeto, Obras cadastradas, Avanço médio, Investimento e Concluídas são blocos independentes.
- A tabela e os cards do projeto usam a ordem crescente do campo ID exibido. Os IDs salvos não são renumerados.

## Adicionar um cartão

1. Clique em **Adicionar contêiner**.
2. Escolha o assunto: situação, financeiro, quantidade, avanço, prazos ou conferência.
3. Escolha um projeto ou todos os projetos que você pode acessar.
4. Se for situação, marque o valor, por exemplo **Em planejamento**.
5. Se for financeiro, confira a coluna escolhida em cada projeto. Ela pode ter um nome ou ID diferente em cada pasta.
6. Confira a prévia e salve. O cartão pode ser editado ou movido depois.

Campos com o mesmo nome e tipos compatíveis podem ser usados em conjunto mesmo com IDs internos diferentes. Os campos gerais continuam seguindo os vínculos de cada projeto. O assistente financeiro permite escolher explicitamente as colunas de origem. Valores ausentes não são convertidos em zero. “Mais opções” abre o editor já existente.

## Editar os blocos prontos

Clique em **Organizar contêineres**, use o lápis do bloco e escolha **Personalizar dados e campos**. A largura e a visibilidade continuam configuráveis pelo editor existente. A opção de voltar ao conteúdo original permanece disponível.

## Conferência dos dados

Os apontamentos são indícios para revisão humana, não uma certificação de erro:

- datas inválidas, anos fora da faixa configurada e data final anterior à inicial;
- valores financeiros negativos, não numéricos ou executado maior que previsto;
- valor acima de 10 vezes a mediana da mesma coluna no mesmo projeto, quando há pelo menos 5 valores positivos;
- percentuais fora de 0 a 100;
- projetos sem associação de valor previsto ou prazo.

O padrão de conferência de anos é de 2000 até o ano atual + 30. Em **Critérios de conferência**, é possível alterar a faixa, o fator e definir um limite financeiro. Esses critérios são pessoais, salvos neste navegador.

Datas suspeitas ficam sinalizadas para revisão e não produzem um falso atraso no resumo. O valor original permanece disponível. Valores atípicos permanecem no total financeiro, com aviso para conferência. Nenhum dado é corrigido ou excluído automaticamente. Outros problemas podem não ser detectados: os alertas não substituem a revisão da planilha e dos vínculos.

## Instalação

Atualize os arquivos do portal pelo conteúdo deste ZIP, mantendo suas configurações de acesso. Esta atualização não exige executar um SQL novo. O banco de dados, a autenticação, os identificadores e as permissões existentes foram preservados.
