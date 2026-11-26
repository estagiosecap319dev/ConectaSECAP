const sourceFieldCatalog = [
  {
    id: 'codigo',
    name: 'ID',
    type: 'text',
    group: 'Essenciais',
    sourceLabel: 'ID',
    help: 'Origem de referência: PIPELINE, coluna A.',
  },
  {
    id: 'orgao',
    name: 'Órgão responsável',
    type: 'text',
    group: 'Essenciais',
    sourceLabel: 'Orgão',
    help: 'Origem de referência: PIPELINE, coluna B.',
    required: true,
  },
  {
    id: 'nome',
    name: 'Nome da obra ou iniciativa',
    type: 'text',
    group: 'Essenciais',
    sourceLabel: 'Nome do Projeto',
    help: 'Origem de referência: PIPELINE, coluna C.',
    required: true,
  },
  {
    id: 'tipo',
    name: 'Tipo de Projeto',
    type: 'select',
    group: 'Essenciais',
    sourceLabel: 'Tipo de Projeto',
    help: 'Origem de referência: PIPELINE, coluna D.',
    options: [
      'Obra de infraestrutura',
      'Obra civil',
      'Reforma',
      'Serviço',
      'Estudo ou projeto',
      'Outro',
    ],
  },
  {
    id: 'sei',
    name: 'SEI',
    type: 'text',
    group: 'Acompanhamento',
    sourceLabel: 'SEI',
    help: 'Origem de referência: PIPELINE, coluna E.',
  },
  {
    id: 'observacao',
    name: 'Observação',
    type: 'long',
    group: 'Acompanhamento',
    sourceLabel: 'Observação',
    help: 'Origem de referência: PIPELINE, coluna F.',
  },
  {
    id: 'etapa',
    name: 'Macroetapa',
    type: 'select',
    group: 'Essenciais',
    sourceLabel: 'Macroetapa',
    help: 'Origem de referência: PIPELINE, coluna G.',
    options: [
      'Em estruturação',
      'Planejamento',
      'Preparatório para contratação',
      'Contratação',
      'Mobilização',
      'Execução',
      'Encerramento',
    ],
  },
  {
    id: 'detalhamento',
    name: 'Detalhamento Tipo de Projeto',
    type: 'text',
    group: 'Localização',
    sourceLabel: 'Detalhamento Tipo de Projeto',
    help: 'Origem de referência: PIPELINE, coluna H.',
  },
  {
    id: 'regiao',
    name: 'Região',
    type: 'select',
    group: 'Localização',
    sourceLabel: 'Região',
    help: 'Origem de referência: PIPELINE, coluna I.',
    options: [
      'Centro',
      'Leste',
      'Noroeste',
      'Norte',
      'Oeste',
      'Sudoeste',
      'Sul',
      'Várias / não definida',
    ],
  },
  {
    id: 'bairro',
    name: 'Bairro',
    type: 'text',
    group: 'Localização',
    sourceLabel: 'Bairro',
    help: 'Origem de referência: PIPELINE, coluna J.',
  },
  {
    id: 'id_bairro',
    name: 'Id Bairro',
    type: 'text',
    group: 'Localização',
    sourceLabel: 'Id Bairro',
    help: 'Origem de referência: PIPELINE, coluna K.',
  },
  {
    id: 'corredor',
    name: 'Corredor',
    type: 'text',
    group: 'Localização',
    sourceLabel: 'Corredor',
    help: 'Origem de referência: PIPELINE, coluna L.',
  },
  {
    id: 'origem_valor',
    name: 'Origem do Valor',
    type: 'text',
    group: 'Recursos e instrumentos',
    sourceLabel: 'Origem do Valor',
    help: 'Origem de referência: PIPELINE, coluna M.',
  },
  {
    id: 'tem_projeto',
    name: 'Tem projeto',
    type: 'select',
    group: 'Acompanhamento',
    sourceLabel: 'Tem projeto',
    help: 'Origem de referência: PIPELINE, coluna N.',
    options: ['Sim', 'Não', 'Em elaboração'],
  },
  {
    id: 'valor_projeto',
    name: 'Valor Estimado Execução Projeto',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Valor Estimado Execução Projeto',
    help: 'Origem de referência: PIPELINE, coluna O.',
  },
  {
    id: 'valor',
    name: 'Investimento previsto da obra',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Valor Estimado Execução Obra',
    help: 'Estimativa de execução da obra. Não somar novamente ao Valor Total ou aos subtotais anuais.',
  },
  {
    id: 'executado',
    name: 'Valor Executado',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Valor Executado',
    help: 'Origem de referência: PIPELINE, coluna Q.',
  },
  {
    id: 'captado',
    name: 'Valor Captado',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Valor Captado',
    help: 'Origem de referência: PIPELINE, coluna R.',
  },
  {
    id: 'contrapartida',
    name: 'Contrapartida Municipio',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Contrapartida Municipio',
    help: 'Origem de referência: PIPELINE, coluna S.',
  },
  {
    id: 'fonte',
    name: 'Fonte de Recursos',
    type: 'select',
    group: 'Recursos e instrumentos',
    sourceLabel: 'Fonte de Recursos',
    help: 'Origem de referência: PIPELINE, coluna T.',
    options: [
      'Recurso federal',
      'Financiamento',
      'Tesouro',
      'Emenda',
      'Termo de compromisso',
      'Outra',
      'A definir',
    ],
  },
  {
    id: 'programa',
    name: 'Programa / Gestor',
    type: 'text',
    group: 'Recursos e instrumentos',
    sourceLabel: 'Programa / Gestor',
    help: 'Origem de referência: PIPELINE, coluna U.',
  },
  {
    id: 'financiadora',
    name: 'Unidade Financiadora',
    type: 'text',
    group: 'Recursos e instrumentos',
    sourceLabel: 'Unidade Financiadora',
    help: 'Origem de referência: PIPELINE, coluna V.',
  },
  {
    id: 'financiar',
    name: 'Sugestão de Financiar',
    type: 'boolean',
    group: 'Recursos e instrumentos',
    sourceLabel: 'Sugestão de Financiar',
    help: 'Origem de referência: PIPELINE, coluna W.',
  },
  {
    id: 'status',
    name: 'Status do Projeto',
    type: 'select',
    group: 'Essenciais',
    sourceLabel: 'Status do Projeto',
    help: 'Origem de referência: PIPELINE, coluna X.',
    options: [
      'Em planejamento',
      'Em andamento',
      'Paralisado',
      'Concluído',
      'Cancelado',
      'Em análise',
    ],
  },
  {
    id: 'inicio',
    name: 'Data Início do Projeto',
    type: 'date',
    group: 'Prazos e marcos',
    sourceLabel: 'Data Início do Projeto',
    help: 'Origem de referência: PIPELINE, coluna Y.',
  },
  {
    id: 'prev_planejamento',
    name: 'Previsão Planejamento',
    type: 'date',
    group: 'Prazos e marcos',
    sourceLabel: 'Previsão Planejamento',
    help: 'Origem de referência: PIPELINE, coluna Z.',
  },
  {
    id: 'prev_preparatorio',
    name: 'Previsão Preparatório',
    type: 'date',
    group: 'Prazos e marcos',
    sourceLabel: 'Previsão Preparatório',
    help: 'Origem de referência: PIPELINE, coluna AA.',
  },
  {
    id: 'prev_contratacao',
    name: 'Previsão Contratação',
    type: 'date',
    group: 'Prazos e marcos',
    sourceLabel: 'Previsão Contratação',
    help: 'Origem de referência: PIPELINE, coluna AB.',
  },
  {
    id: 'prev_mobilizacao',
    name: 'Previsão Mobilizaçao',
    type: 'date',
    group: 'Prazos e marcos',
    sourceLabel: 'Previsão Mobilizaçao',
    help: 'Origem de referência: PIPELINE, coluna AC.',
  },
  {
    id: 'execucao_origem',
    name: 'Previsão de execução — conteúdo de origem',
    type: 'text',
    group: 'Prazos e marcos',
    sourceLabel: 'Previsão Execução',
    help: 'A coluna original mistura valores que podem representar duração. Confirme a unidade antes de transformar em data. O calendário não usa este campo.',
  },
  {
    id: 'prazo',
    name: 'Previsão Encerramento',
    type: 'date',
    group: 'Prazos e marcos',
    sourceLabel: 'Previsão Encerramento',
    help: 'Origem de referência: PIPELINE, coluna AE.',
  },
  {
    id: 'tem_termo',
    name: 'Termo de compromisso',
    type: 'boolean',
    group: 'Recursos e instrumentos',
    sourceLabel: 'Termo de compromisso',
    help: 'Origem de referência: PIPELINE, coluna AF.',
  },
  {
    id: 'prioridade',
    name: 'Prioridade',
    type: 'select',
    group: 'Essenciais',
    sourceLabel: 'Prioridade',
    help: 'Origem de referência: PIPELINE, coluna AG.',
    options: ['Muito alta', 'Alta', 'Média', 'Baixa', 'Ainda não definida'],
  },
  {
    id: 'numero_termo',
    name: 'Número Termo',
    type: 'text',
    group: 'Recursos e instrumentos',
    sourceLabel: 'Número Termo',
    help: 'Origem de referência: PIPELINE, coluna AH.',
  },
  {
    id: 'classificacao_origem',
    name: 'Classificação de origem — revisar',
    type: 'text',
    group: 'Acompanhamento',
    sourceLabel: 'AINDA NÃO DEFINIDA',
    help: 'Coluna original “AINDA NÃO DEFINIDA”. Confirmar seu significado com a equipe antes de usar em indicadores.',
  },
  {
    id: 'contratacao',
    name: 'Contratação',
    type: 'text',
    group: 'Acompanhamento',
    sourceLabel: 'Contratação',
    help: 'Origem de referência: PIPELINE, coluna AJ.',
  },
  {
    id: 'solicitacoes_financeiras',
    name: 'SOLICITAÇÕES FINANCEIRAS',
    type: 'text',
    group: 'Recursos e instrumentos',
    sourceLabel: 'SOLICITAÇÕES FINANCEIRAS',
    help: 'Origem de referência: PIPELINE, coluna AK.',
  },
  {
    id: 'valor_total',
    name: 'VALOR TOTAL',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'VALOR TOTAL',
    help: 'Valor total informado na fonte. Conferir a relação com o investimento da obra e com os subtotais antes de consolidar.',
  },
  {
    id: 'total_2026',
    name: 'Valor Subtotal 2026',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Valor Subtotal 2026',
    help: 'Origem de referência: PIPELINE, coluna AM.',
  },
  {
    id: 'total_2027',
    name: 'Valor Subtotal 2027',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Valor Subtotal 2027',
    help: 'Origem de referência: PIPELINE, coluna AN.',
  },
  {
    id: 'total_2028',
    name: 'Valor Subtotal 2028',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Valor Subtotal 2028',
    help: 'Origem de referência: PIPELINE, coluna AO.',
  },
  {
    id: 'federal_total',
    name: 'Valores Recursos Federais',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Valores Recursos Federais',
    help: 'Origem de referência: PIPELINE, coluna AP.',
  },
  {
    id: 'federal_2026',
    name: 'Recursos Federais 2026.',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Recursos Federais 2026.',
    help: 'Origem de referência: PIPELINE, coluna AQ.',
  },
  {
    id: 'federal_2027',
    name: 'Recursos Federais 2027',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Recursos Federais 2027',
    help: 'Origem de referência: PIPELINE, coluna AR.',
  },
  {
    id: 'federal_2028',
    name: 'Recursos Federais 2028',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Recursos Federais 2028',
    help: 'Origem de referência: PIPELINE, coluna AS.',
  },
  {
    id: 'municipal_total',
    name: 'Valor Recursos Municipais',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Valor Recursos Municipais',
    help: 'Origem de referência: PIPELINE, coluna AT.',
  },
  {
    id: 'municipal_2026',
    name: 'Recursos Municipais 2026',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Recursos Municipais 2026',
    help: 'Origem de referência: PIPELINE, coluna AU.',
  },
  {
    id: 'municipal_2027',
    name: 'Recursos Municipais 2027',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Recursos Municipais 2027',
    help: 'Origem de referência: PIPELINE, coluna AV.',
  },
  {
    id: 'municipal_2028',
    name: 'Recursos Municipais 2028',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Recursos Municipais 2028',
    help: 'Origem de referência: PIPELINE, coluna AW.',
  },
  {
    id: 'outros_total',
    name: 'Valor Recursos - Outros',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Valor Recursos - Outros',
    help: 'Origem de referência: PIPELINE, coluna AX.',
  },
  {
    id: 'outros_2026',
    name: 'Recursos - Outros 2026',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Recursos - Outros 2026',
    help: 'Origem de referência: PIPELINE, coluna AY.',
  },
  {
    id: 'outros_2027',
    name: 'Recursos - Outros 2027',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Recursos - Outros 2027',
    help: 'Origem de referência: PIPELINE, coluna AZ.',
  },
  {
    id: 'outros_2028',
    name: 'Recursos - Outros 2028',
    type: 'currency',
    group: 'Financeiro',
    sourceLabel: 'Recursos - Outros 2028',
    help: 'Origem de referência: PIPELINE, coluna BA.',
  },
  {
    id: 'atualizado_por',
    name: 'Responsável pela Atualização',
    type: 'text',
    group: 'Acompanhamento',
    sourceLabel: 'Responsável pela Atualização',
    help: 'Origem de referência: PIPELINE, coluna BB.',
  },
  {
    id: 'atualizado_em',
    name: 'Data da última Atualização',
    type: 'date',
    group: 'Prazos e marcos',
    sourceLabel: 'Data da última Atualização',
    help: 'Origem de referência: PIPELINE, coluna BC.',
  },
];

let templateLibraryView = '',
  selectedTemplate = 'obras';

const extraOperationalFields = [
  {
    id: 'responsavel',
    name: 'Responsável pela próxima ação (opcional)',
    type: 'text',
    required: false,
    group: 'Essenciais',
    help: 'Pessoa que acompanhará a próxima providência. É diferente de quem atualizou a planilha.',
  },
  {
    id: 'proxima',
    name: 'Próxima providência',
    type: 'long',
    group: 'Essenciais',
    help: 'Descreva uma ação concreta: o que será feito e o resultado esperado.',
  },
  {
    id: 'prazo_acao',
    name: 'Prazo da próxima providência',
    type: 'date',
    group: 'Essenciais',
    help: 'A data aparece no calendário junto com os demais marcos.',
  },
  {
    id: 'progresso',
    name: 'Avanço físico medido (%)',
    type: 'number',
    group: 'Acompanhamento',
    help: 'Percentual medido e informado pela equipe. Não é calculado a partir da macroetapa.',
  },
  {
    id: 'duracao_dias',
    name: 'Duração prevista da execução (dias)',
    type: 'number',
    group: 'Prazos e marcos',
    help: 'Duração em dias. Este campo não representa uma data do calendário.',
  },
];

const templateDefinitions = {
  obras: {
    name: 'Obras prioritárias',
    audience: 'Carteira da Secretaria',
    tag: 'Prioridades e entregas',
    icon: 'folder',
    color: '#003856',
    bi: 'obras',
    description:
      'Consolide obras de vários órgãos, identifique gargalos e conduza a reunião de gestão.',
    question: 'Quais obras precisam de decisão da Secretaria nesta semana?',
    decisions: [
      'Definir a próxima providência e quem deve agir.',
      'Destravar as iniciativas de maior prioridade.',
      'Acompanhar as entregas por órgão e região.',
    ],
    groups: [
      'Essenciais',
      'Localização',
      'Prazos e marcos',
      'Financeiro',
      'Recursos e instrumentos',
      'Acompanhamento',
    ],
    keys: null,
    kpis: [
      'Carteira por órgão e macroetapa',
      'Prioridades altas e obras paralisadas',
      'Prazos vencidos e próximas entregas',
      'Investimento previsto, captado e executado',
      'Registros sem atualização',
    ],
    tabs: [
      'Visão geral',
      'Pipeline',
      'Prioridades',
      'Prazos',
      'Território',
      'Financeiro',
      'Detalhamento',
      'Qualidade',
    ],
    note: 'Abrange as 55 colunas da aba PIPELINE e adiciona campos de ação, responsável e medição física. A classificação de origem e a previsão de execução exigem validação antes do uso.',
  },
  link_externo: {
    name: 'Link Externo / Página',
    tag: 'Redirecionamento',
    icon: 'link', // ou o nome do ícone svg cadastrado no seu sistema
    color: '#0066cc',
    audience: 'Acesso Rápido',
    description:
      'Acesse uma página externa, dashboard do PowerBI ou documento diretamente ao clicar no projeto.',
    question: 'Como integrar sistemas e páginas externas ao portal?',
    tabs: ['Link Externo'],
    isLink: true,
  },
  contratacao: {
    name: 'Preparação e contratação',
    audience: 'Equipe de projetos e licitação',
    tag: 'Documentos e pendências',
    icon: 'file',
    color: '#846bb1',
    bi: 'obras',
    description:
      'Acompanhe projetos, orçamento, ETP, TR, jurídico e licitação com as pendências de cada etapa.',
    question: 'O que falta para esta iniciativa chegar à contratação?',
    decisions: [
      'Identificar o documento ou parecer que está pendente.',
      'Direcionar a cobrança à pessoa responsável.',
      'Definir o prazo para liberar a próxima etapa.',
    ],
    keys: [
      'codigo',
      'nome',
      'orgao',
      'tipo',
      'sei',
      'etapa',
      'status',
      'prioridade',
      'regiao',
      'bairro',
      'tem_projeto',
      'valor_projeto',
      'valor',
      'inicio',
      'prev_planejamento',
      'prev_preparatorio',
      'prev_contratacao',
      'prazo',
      'observacao',
      'atualizado_por',
      'atualizado_em',
    ],
    additional: [
      ...[
        'Projeto técnico',
        'Orçamento',
        'ETP',
        'TR',
        'Matriz de riscos',
        'Parecer jurídico',
        'Licitação',
      ].map((n, i) => ({
        id: 'doc_' + i,
        name: n,
        type: 'select',
        options: ['Não iniciado', 'Em elaboração', 'Em revisão', 'Concluído', 'Não se aplica'],
        group: 'Documentação',
        help: 'Informe a situação do documento ou da etapa; concluído deve corresponder à validação da equipe.',
      })),
      { id: 'pendencia', name: 'Pendência que impede o avanço', type: 'long', group: 'Essenciais' },
    ],
    kpis: [
      'Iniciativas por etapa',
      'Documentos pendentes por tipo',
      'Itens sem parecer jurídico',
      'Prazos de contratação',
      'Ações por responsável',
    ],
    tabs: [
      'Visão geral',
      'Pipeline',
      'Documentação',
      'Prioridades',
      'Prazos',
      'Detalhamento',
      'Qualidade',
    ],
    note: 'O preenchimento de documentos é um apoio gerencial. As exigências aplicáveis a cada contratação devem ser confirmadas pela equipe responsável.',
  },
  fisicofin: {
    name: 'Execução físico-financeira',
    audience: 'Gestor e fiscalização',
    tag: 'Medição e investimento',
    icon: 'chart',
    color: '#169dc4',
    bi: 'fisicofin',
    description:
      'Compare avanço físico medido, investimento e execução financeira, com a programação por exercício.',
    question: 'O avanço físico e a aplicação dos recursos estão acompanhando a execução?',
    decisions: [
      'Conferir medições e valores executados.',
      'Revisar os prazos e a programação financeira.',
      'Acionar a fiscalização quando houver divergências.',
    ],
    keys: [
      'codigo',
      'nome',
      'orgao',
      'sei',
      'etapa',
      'status',
      'prioridade',
      'regiao',
      'bairro',
      'valor',
      'executado',
      'captado',
      'contrapartida',
      'valor_total',
      'total_2026',
      'total_2027',
      'total_2028',
      'fonte',
      'programa',
      'inicio',
      'prazo',
      'atualizado_em',
    ],
    additional: [
      { id: 'medicao_em', name: 'Data da última medição', type: 'date', group: 'Acompanhamento' },
      { id: 'fiscal', name: 'Fiscal responsável', type: 'text', group: 'Acompanhamento' },
      { id: 'contratado', name: 'Valor contratado', type: 'currency', group: 'Financeiro' },
      { id: 'pago', name: 'Valor pago', type: 'currency', group: 'Financeiro' },
    ],
    kpis: [
      'Avanço físico informado',
      'Executado sobre previsto',
      'Valor contratado e pago',
      'Saldo previsto por obra',
      'Programação por exercício',
    ],
    tabs: ['Visão geral', 'Financeiro', 'Prazos', 'Prioridades', 'Detalhamento', 'Qualidade'],
    note: 'Previsto, contratado, executado e pago são medidas distintas. As parcelas por exercício não devem ser somadas novamente ao total. Sem medição física, o percentual permanece sem informação.',
  },
  recursos: {
    name: 'Captação de recursos',
    audience: 'SECAP e articulação institucional',
    tag: 'Fontes e financiamento',
    icon: 'money',
    color: '#268c48',
    bi: 'recursos',
    description:
      'Organize iniciativas, fontes, programas, financiadores e valores captados em uma jornada de captação.',
    question:
      'Quais iniciativas estão prontas para buscar recursos e o que falta para a liberação?',
    decisions: [
      'Priorizar iniciativas com documentação e contrapartida definidas.',
      'Acompanhar o contato com a instituição financiadora.',
      'Agendar as próximas providências de contratação e liberação.',
    ],
    keys: [
      'codigo',
      'nome',
      'orgao',
      'tipo',
      'sei',
      'etapa',
      'status',
      'prioridade',
      'tem_projeto',
      'valor',
      'captado',
      'contrapartida',
      'fonte',
      'programa',
      'financiadora',
      'financiar',
      'inicio',
      'prazo',
      'observacao',
      'atualizado_em',
    ],
    additional: [
      { id: 'pleiteado', name: 'Valor pleiteado', type: 'currency', group: 'Financeiro' },
      { id: 'aprovado', name: 'Valor aprovado', type: 'currency', group: 'Financeiro' },
      { id: 'liberado', name: 'Valor liberado', type: 'currency', group: 'Financeiro' },
      {
        id: 'etapa_captacao',
        name: 'Etapa da captação',
        type: 'select',
        options: [
          'Preparação',
          'Proposta apresentada',
          'Em análise',
          'Aprovado',
          'Contratação',
          'Liberação',
          'Encerrado',
        ],
        group: 'Essenciais',
      },
      {
        id: 'contato_financiador',
        name: 'Referência na instituição',
        type: 'text',
        group: 'Recursos e instrumentos',
      },
    ],
    kpis: [
      'Pleiteado, aprovado e liberado',
      'Captação por fonte e programa',
      'Contrapartida municipal',
      'Etapas da captação',
      'Próximos contatos e prazos',
    ],
    tabs: [
      'Visão geral',
      'Pipeline',
      'Captação',
      'Financeiro',
      'Prioridades',
      'Prazos',
      'Detalhamento',
      'Qualidade',
    ],
    note: 'Recurso pleiteado, aprovado, captado e liberado não são intercambiáveis. Os indicadores devem mostrar cada medida com sua definição.',
  },
  termos: {
    name: 'Termos e compromissos',
    audience: 'Gestão de instrumentos',
    tag: 'Vigências e entregas',
    icon: 'file',
    color: '#c68b39',
    bi: 'termos',
    description:
      'Acompanhe instrumentos, obrigações, parceiros, vigências e entregas vinculadas às obras.',
    question: 'Quais compromissos precisam de providência para cumprir as obrigações no prazo?',
    decisions: [
      'Acionar o parceiro responsável por uma obrigação pendente.',
      'Revisar vigência e documentação.',
      'Relacionar cada instrumento às obras e entregas correspondentes.',
    ],
    keys: [
      'codigo',
      'nome',
      'orgao',
      'sei',
      'status',
      'etapa',
      'prioridade',
      'tem_termo',
      'numero_termo',
      'valor',
      'executado',
      'contrapartida',
      'fonte',
      'prazo',
      'observacao',
      'atualizado_em',
    ],
    additional: [
      {
        id: 'parceiro',
        name: 'Instituição parceira',
        type: 'text',
        group: 'Recursos e instrumentos',
      },
      {
        id: 'obrigacao',
        name: 'Obrigação ou entrega vinculada',
        type: 'long',
        group: 'Essenciais',
      },
      {
        id: 'prestacao_contas',
        name: 'Situação da prestação de contas',
        type: 'select',
        options: [
          'Não iniciada',
          'Em elaboração',
          'Em análise',
          'Aprovada',
          'Com pendência',
          'Não se aplica',
        ],
        group: 'Acompanhamento',
      },
    ],
    kpis: [
      'Instrumentos vinculados',
      'Vigências próximas e vencidas',
      'Entregas por situação',
      'Obrigações pendentes',
      'Valores dos termos sem duplicidade',
    ],
    tabs: [
      'Visão geral',
      'Termos vinculados',
      'Prioridades',
      'Prazos',
      'Financeiro',
      'Detalhamento',
      'Qualidade',
    ],
    note: 'Um instrumento pode se relacionar a várias obras. Seu valor deve ser contado uma única vez no conjunto dos termos. O cadastro do instrumento permanece na aba Termos de compromisso.',
  },
  iniciativas: {
    name: 'Projetos e serviços',
    audience: 'Projetos diversos da Prefeitura',
    tag: 'Modelo flexível',
    icon: 'dashboard',
    color: '#6a8195',
    bi: 'auto',
    description:
      'Organize ações, estudos, serviços e iniciativas que precisam de acompanhamento, mesmo sem uma obra física.',
    question: 'O que foi combinado, qual é a próxima entrega e quem precisa agir?',
    decisions: [
      'Acompanhar marcos e entregas da equipe.',
      'Distribuir as próximas ações entre responsáveis.',
      'Revisar escopo, prioridade e prazo.',
    ],
    keys: [
      'codigo',
      'nome',
      'orgao',
      'tipo',
      'sei',
      'etapa',
      'status',
      'prioridade',
      'inicio',
      'prazo',
      'valor',
      'executado',
      'observacao',
      'atualizado_em',
    ],
    additional: [
      { id: 'objetivo', name: 'Resultado esperado', type: 'long', group: 'Essenciais' },
      { id: 'entrega', name: 'Próxima entrega', type: 'text', group: 'Essenciais' },
      { id: 'publico', name: 'Público ou área atendida', type: 'text', group: 'Acompanhamento' },
    ],
    kpis: [
      'Entregas por situação',
      'Próximas ações',
      'Carga por responsável',
      'Prazos do projeto',
      'Indicadores personalizados',
    ],
    tabs: ['Visão geral', 'Pipeline', 'Prioridades', 'Prazos', 'Detalhamento', 'Qualidade'],
    note: 'Os indicadores vêm dos campos efetivamente preenchidos. Campos financeiros podem permanecer sem associação quando não se aplicarem ao projeto.',
  },
};

function templateFields(key) {
  const t = templateDefinitions[key];
  const all = t.keys ? sourceFieldCatalog.filter((f) => t.keys.includes(f.id)) : sourceFieldCatalog;
  const fields = structuredClone([...all, ...extraOperationalFields, ...(t.additional || [])]);
  const seen = new Set();
  const order = [
    'Essenciais',
    'Localização',
    'Documentação',
    'Prazos e marcos',
    'Financeiro',
    'Recursos e instrumentos',
    'Acompanhamento',
  ];

  return fields
    .filter((f) => !seen.has(f.id) && seen.add(f.id))
    .map((f) => {
      if (f.help?.startsWith('Origem de referência:')) f.help = '';
      return f;
    })
    .sort(
      (a, b) =>
        order.indexOf(a.group) - order.indexOf(b.group) ||
        (a.id === 'nome' ? -1 : b.id === 'nome' ? 1 : 0)
    );
}

const captureRouteWithBI = routeSnapshot;
routeSnapshot = function () {
  return { ...captureRouteWithBI(), templateLibraryView, selectedTemplate };
};

const restoreRouteWithBI = restoreRoute;
restoreRoute = function (r) {
  templateLibraryView = r.templateLibraryView || '';
  selectedTemplate = r.selectedTemplate || 'obras';
  restoreRouteWithBI(r);
};

const goWithBI = go;
go = function (t, id = '') {
  templateLibraryView = '';
  goWithBI(t, id);
};

const openBIWithTemplates = openBI;
openBI = function (id) {
  templateLibraryView = '';
  openBIWithTemplates(id);
};

function openTemplateLibrary(key = '') {
  routeTrail.push(routeSnapshot());
  tab = 'bi';
  projectId = '';
  biProject = '';
  templateLibraryView = key ? 'detail' : 'catalog';
  if (key) selectedTemplate = key;
  query = '';
  render();
  window.scrollTo(0, 0);
}

const biWithModels = bi;
bi = function () {
  if (templateLibraryView === 'catalog') return templateCatalog();
  if (templateLibraryView === 'detail') return templateDetail(selectedTemplate);
  return biWithModels();
};

const foldersWithModels = biFolderPage;
biFolderPage = function () {
  return foldersWithModels().replace(
    '<div class="actions">',
    `<div class="actions">${btn('Biblioteca de modelos', 'openTemplateLibrary()', 'dashboard', 'primary')}`
  );
};

function templateCatalog() {
  return (
    head(
      'MODELOS DE GESTÃO',
      'Biblioteca de modelos',
      'Comece pela decisão que precisa tomar. O modelo organiza os campos e o BI do projeto.',
      btn('Voltar aos painéis', 'templateLibraryView="";render()', 'arrow')
    ) +
    `<section class="template-intro">
      <div>
        <div class="eyebrow">DO REGISTRO À DECISÃO</div>
        <h2>O mesmo portal. Uma leitura para cada situação.</h2>
        <p>O servidor registra a informação uma vez. A equipe acompanha a próxima ação. A Secretaria enxerga os gargalos, os compromissos e as decisões que precisam de encaminhamento.</p>
      </div>
      <div class="template-intro-note">${icon('shield')}<span>Dados ausentes ficam visíveis.<br>Etapas, valores e datas mantêm seu significado.</span></div>
    </section>
    <div class="model-library">
      ${Object.entries(templateDefinitions)
        .filter(([, t]) => !t.isLink)
        .map(
          ([key, t]) => `
        <article class="model-card" style="--model-color:${t.color}">
          <div class="model-card-top"><span class="model-icon">${icon(t.icon)}</span><span class="badge">${t.tag}</span></div>
          <div class="eyebrow">${t.audience.toUpperCase()}</div>
          <h2>${t.name}</h2>
          <p>${t.description}</p>
          <div class="model-question">${t.question}</div>
          <div class="model-card-meta"><span>${templateFields(key).length} campos organizados</span><span>${t.tabs.length} áreas de análise</span></div>
          <div class="model-card-actions">
            ${btn('Conhecer o modelo', `openTemplateLibrary('${key}')`, 'arrow')}
            ${canManage() ? btn('Usar modelo', `newProjectFromTemplate('${key}')`, 'plus', 'primary') : ''}
          </div>
        </article>
      `
        )
        .join('')}
    </div>
    <div class="summary-strip" style="margin-top:25px">${icon('folder')}<p><strong>Obras de saúde, educação ou infraestrutura podem usar o mesmo modelo de gestão.</strong> O conteúdo muda por órgão, tipo, região e projeto. Uma nova estrutura é necessária quando muda a forma de acompanhar o trabalho: contratação, execução, captação ou compromisso.</p></div>`
  );
}

function templateDetail(key) {
  const t = templateDefinitions[key],
    fields = templateFields(key),
    groups = [...new Set(fields.map((f) => f.group || 'Outras informações'))];
  return (
    backLink('Voltar à biblioteca') +
    `<section class="bihero">
      <div>
        <div class="eyebrow">MODELO DE GESTÃO · ${t.audience.toUpperCase()}</div>
        <h1>${t.name}</h1>
        <p>${t.description}</p>
        <div class="hero-meta"><span>${icon('file')}${fields.length} campos em ${groups.length} grupos</span><span>${icon('chart')}${t.tabs.length} áreas de análise</span></div>
      </div>
      <div class="hero-actions">
        <span class="hero-emblem">${icon(t.icon)}</span>
        ${canManage() ? btn('Criar projeto com este modelo', `newProjectFromTemplate('${key}')`, 'plus', 'orange') : ''}
      </div>
    </section>
    <div class="summary-strip">${icon('eye')}<p><strong>${t.question}</strong><br>${t.decisions.join(' ')}</p></div>
    <div class="chart-grid">
      <section class="panel">
        <div class="panelhead"><h2>O que o gestor acompanha</h2></div>
        <div class="panelbody"><div class="model-checklist">${t.kpis.map((k) => `<div>${icon('chart')}<span>${k}</span></div>`).join('')}</div></div>
      </section>
      <section class="panel">
        <div class="panelhead"><h2>Como a análise se organiza</h2></div>
        <div class="panelbody">
          <div class="model-tab-list">${t.tabs.map((n, i) => `<span><b>${String(i + 1).padStart(2, '0')}</b>${n}</span>`).join('')}</div>
          <p class="metric-note" style="margin:20px 0 0">${t.note}</p>
        </div>
      </section>
    </div>
    <section class="panel">
      <div class="panelhead"><div><h2>Formulário organizado por assunto</h2><small>Os campos essenciais aparecem primeiro. O restante pode ser preenchido conforme a etapa do trabalho.</small></div></div>
      <div class="panelbody">
        ${groups
          .map(
            (g, i) => `
          <details class="schema-group" ${i === 0 ? 'open' : ''}>
            <summary><span>${g}</span><small>${fields.filter((f) => f.group === g).length} campos</small>${icon('down')}</summary>
            <div class="schema-fields">
              ${fields
                .filter((f) => f.group === g)
                .map(
                  (f) =>
                    `<div><span>${esc(f.name)}${f.required ? ' *' : ''}</span><small>${typeNames[f.type] || f.type}</small></div>`
                )
                .join('')}
            </div>
          </details>
        `
          )
          .join('')}
      </div>
    </section>
    <div class="model-guideline"><b>Comece com o necessário.</b> O nome da iniciativa, o órgão e o responsável são os campos obrigatórios de início. A equipe completa os demais grupos no momento adequado. O avanço físico exige medição; a etapa do projeto não determina um percentual.</div>`
  );
}

const editProjectBeforeTemplates = editProject;
editProject = function (id = '') {
  if (id) return editProjectBeforeTemplates(id);
  if (!canManage()) return;
  const choice = (onclick, color, ic, name, desc) =>
    `<button type="button" class="template-choice" onclick="${onclick}"><span class="model-icon" style="--model-color:${color}">${icon(ic)}</span><span><b>${name}</b><small>${desc}</small></span>${icon('arrow')}</button>`;
  const models = Object.entries(templateDefinitions).filter(([, t]) => !t.isLink);
  modal(
    'Criar um novo projeto',
    `<p class="subtitle">Comece do zero, use um modelo pronto ou crie um card que abre um link externo.</p>
    <div class="project-template-picker">
      ${choice('newBlankProject()', '#315c75', 'plus', 'Começar do zero', 'Sem modelo. Você define o nome e cria os campos que quiser depois.')}
      ${choice("newProjectFromTemplate('link_externo')", '#0066cc', 'link', 'Link externo / página', 'Um card que abre uma página, dashboard ou documento em nova aba.')}
    </div>
    <p class="metric-note" style="margin:18px 0 0"><b>Ou escolha um modelo pronto</b></p>
    <div class="project-template-picker" style="margin-top:10px">
      ${models.map(([key, t]) => choice(`newProjectFromTemplate('${key}')`, t.color, t.icon, t.name, t.description)).join('')}
    </div>`,
    btn('Cancelar', 'closeModal()', 'close')
  );
};

function newBlankProject() {
  if (!canManage()) return;
  modal(
    'Novo projeto · Do zero',
    `<form id="blankProjectForm" onsubmit="event.preventDefault();saveBlankProject()">
      <div class="summary-strip" style="margin-bottom:22px">${icon('plus')}<p><strong>Projeto totalmente personalizável</strong><br>Defina os campos que cada obra/subprojeto deverá preencher. O campo Nome da obra será mantido como identificação obrigatória.</p></div>
      <div class="field"><label>Nome do projeto *</label><input name="name" required placeholder="Ex.: Revitalização de praças"></div>
      <div class="field"><label>Descrição</label><textarea name="description" rows="3" placeholder="Qual é o objetivo deste projeto?"></textarea></div>
      <div class="twocol">
        <div class="field"><label>Responsável *</label><input name="owner" required value="${esc(me().name)}"></div>
        <div class="field"><label>Cor de identificação</label><input name="color" type="color" value="#003856" style="height:43px"></div>
      </div>
      <div class="panel" style="padding:16px;margin-top:18px">
        <div class="panelhead"><div><h3>Campos de cada obra/subprojeto</h3><small>Adicione os dados que deverão ser preenchidos em cada registro. Você poderá alterá-los depois.</small></div></div>
        <div id="blankCustomFields"></div>
        <button class="btn secondary" type="button" onclick="addBlankProjectField()">${icon('plus')} Adicionar campo personalizado</button>
      </div>
    </form>`,
    btn('Voltar', 'editProject()', 'arrow') +
      `<button class="btn primary" form="blankProjectForm" type="submit">${icon('check')} Criar projeto</button>`
  );
}

let blankProjectFieldCounter = 0;

function addBlankProjectField() {
  const host = $('#blankCustomFields');
  if (!host) return;
  const key = `blank_${++blankProjectFieldCounter}`;
  host.insertAdjacentHTML(
    'beforeend',
    `<div class="fieldrow blank-field-row" data-field-key="${key}" style="display:block;padding:12px 0;border-bottom:1px solid var(--line,#e5e7eb)">
    <div class="twocol"><div class="field"><label>Nome do campo *</label><input data-custom-name required placeholder="Ex.: Número do contrato"></div>
    <div class="field"><label>Tipo de informação</label><select data-custom-type onchange="this.closest('.blank-field-row').querySelector('[data-custom-options]').style.display=this.value==='select'?'block':'none'">${Object.entries(
      typeNames
    )
      .map(([k, v]) => `<option value="${k}">${v}</option>`)
      .join('')}</select></div></div>
    <div class="field" data-custom-options style="display:none"><label>Opções (separadas por vírgula)</label><input data-custom-list placeholder="Planejamento, Em execução, Concluída"></div>
    <div class="twocol"><div class="field"><label>Orientação de preenchimento</label><input data-custom-help placeholder="Explique o que deve ser informado"></div><label style="align-self:center"><input data-custom-required type="checkbox"> Obrigatório</label></div>
    <button class="btn danger small" type="button" onclick="this.closest('.blank-field-row').remove()">${icon('trash')} Remover campo</button>
  </div>`
  );
}

function saveBlankProject() {
  if (!canManage()) return;
  const form = $('#blankProjectForm');
  if (!form) return;
  const d = new FormData(form);
  const name = String(d.get('name') || '').trim();
  const owner = String(d.get('owner') || '').trim() || me().name;
  if (!name) return;
  const fields = [{ id: 'nome', name: 'Nome da obra', type: 'text', required: true }];
  const customRows = [...form.querySelectorAll('.blank-field-row')];
  for (const row of customRows) {
    const fieldName = row.querySelector('[data-custom-name]').value.trim();
    const type = row.querySelector('[data-custom-type]').value;
    const options = (row.querySelector('[data-custom-list]')?.value || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (!fieldName) return notify('Informe o nome de todos os campos personalizados.');
    if (type === 'select' && !options.length)
      return notify(`Informe as opções do campo "${fieldName}".`);
    fields.push({
      id: 'f_' + uid(),
      name: fieldName,
      type,
      options: type === 'select' ? [...new Set(options)] : undefined,
      help: row.querySelector('[data-custom-help]').value.trim(),
      required: row.querySelector('[data-custom-required]').checked,
    });
  }
  const p = {
    id: uid(),
    name,
    description: String(d.get('description') || '').trim(),
    owner,
    color: String(d.get('color') || '#003856'),
    externalUrl: '',
    isExternal: false,
    fields,
    records: [],
  };
  db.projects.push(p);
  persist('Criou projeto do zero', p, '', name);
  closeModal();
  go('projects', p.id);
  notify(
    `Projeto criado com ${Math.max(0, p.fields.length - 1)} campo(s) personalizado(s). Cada obra poderá preencher esses dados.`
  );
}

function newProjectFromTemplate(key) {
  if (key === 'link_externo') {
    openExternalLinkModal();
    return;
  }
  if (!canManage()) return;
  const t = templateDefinitions[key];
  modal(
    'Novo projeto · ' + t.name,
    `<form id="guidedProjectForm" onsubmit="event.preventDefault();saveGuidedProject('${key}')"><div class="summary-strip" style="margin-bottom:22px">${icon(t.icon)}<p>Modelo <strong>${t.name}</strong><br>${templateFields(key).length} campos agrupados e BI associado ao projeto.</p></div><div class="field"><label>Nome da pasta de projeto *</label><input aria-label="Nome da pasta de projeto" name="name" required placeholder="Ex.: Obras prioritárias — SEINFRA"></div><div class="field"><label>Objetivo ou descrição</label><textarea name="description" rows="3" placeholder="Qual resultado esta carteira de projetos precisa entregar?"></textarea></div><div class="twocol"><div class="field"><label>Responsável pela pasta *</label><input name="owner" required value="${esc(me().name)}"></div><div class="field"><label>Cor da pasta</label><input name="color" type="color" value="${t.color}" style="height:43px"></div></div><p class="metric-note" style="margin:0">A pasta será criada vazia. As linhas da planilha não são importadas automaticamente. Você poderá cadastrar os registros e personalizar o modelo.</p></form>`,
    btn('Escolher outro modelo', 'editProject()', 'arrow') +
      `<button class="btn primary" form="guidedProjectForm" type="submit">Criar pasta e painel</button>`
  );
}

function saveGuidedProject(key) {
  if (!canManage()) return;
  const t = templateDefinitions[key],
    d = new FormData($('#guidedProjectForm')),
    p = {
      id: uid(),
      name: String(d.get('name')).trim(),
      description: String(d.get('description')).trim(),
      owner: String(d.get('owner')).trim(),
      color: d.get('color'),
      fields: templateFields(key),
      records: [],
      biTemplate: t.bi,
      managementTemplate: key,
      entityKind: t.entityKind || 'work',
      biMapping: {
        status: 'status',
        stage: key === 'recursos' ? 'etapa_captacao' : 'etapa',
        budget: 'valor',
        spent: 'executado',
        raised: 'captado',
        deadline: 'prazo',
        progress: 'progresso',
        owner: 'responsavel',
        agency: 'orgao',
        priority: 'prioridade',
        source: 'fonte',
      },
    };
  if (!p.name || !p.owner) return;
  db.projects.push(p);
  persist('Criou projeto a partir de modelo', p, '', t.name);
  closeModal();
  templateLibraryView = '';
  go('projects', p.id);
  notify('Pasta criada com campos organizados e BI conectado.');
}

// Paleta de cores por assunto/seção (com suporte a cores personalizadas do projeto)
function getGroupTheme(groupName, project = null) {
  const defaultThemes = {
    Essenciais: { color: '#f37021', bg: 'rgba(243, 112, 33, 0.12)' },
    Localização: { color: '#003856', bg: 'rgba(0, 56, 86, 0.10)' },
    'Prazos e marcos': { color: '#00a3d7', bg: 'rgba(0, 163, 215, 0.12)' },
    Financeiro: { color: '#268c48', bg: 'rgba(38, 140, 72, 0.12)' },
    'Recursos e instrumentos': { color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.10)' },
    Acompanhamento: { color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
    Documentação: { color: '#0d9488', bg: 'rgba(13, 148, 136, 0.12)' },
  };

  const base = defaultThemes[groupName] || { color: '#475569', bg: 'rgba(71, 85, 105, 0.10)' };

  // Se o projeto tiver uma cor personalizada salva para este grupo, utilize-a
  if (project && project.groupColors && project.groupColors[groupName]) {
    const customColor = project.groupColors[groupName];
    return { color: customColor, bg: hexToRgba(customColor, 0.12) };
  }

  return base;
}

// Função auxiliar para converter HEX em RGBA para o fundo translúcido
function hexToRgba(hex, alpha) {
  let c = hex.replace('#', '');
  if (c.length === 3)
    c = c
      .split('')
      .map((x) => x + x)
      .join('');
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

function getGroupIcon(groupName) {
  const iconsByGroup = {
    Essenciais: 'folder',
    Localização: 'eye',
    'Prazos e marcos': 'chart',
    Financeiro: 'money',
    'Recursos e instrumentos': 'link',
    Acompanhamento: 'check',
    Documentação: 'file',
  };
  return iconsByGroup[groupName] || 'folder';
}

// Seção automática de um campo sem seção definida (projetos criados por link ou arquivo).
// Usa o nome e o tipo do campo; a seção escolhida pelo usuário sempre prevalece.
function autoFieldGroup(field) {
  const id = String(field?.id || '');
  const n = ' ' + String(field?.name || id).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9%]+/g, ' ').trim() + ' ';
  const has = (re) => re.test(n);
  if (['nome', 'codigo'].includes(id) || (has(/^ (nome|id|codigo|cod|item|obra|titulo|empreendimento|denominacao) /) && n.trim().split(' ').length <= 3 && !has(/ (contrato|convenio|processo|sei|valor|prazo|data) /))) return 'Essenciais';
  if (has(/ (avanco|progresso|percentual|%|andamento fisico) /)) return 'Acompanhamento';
  if (field?.type === 'currency' || has(/ (valor|valores|orcamento|orcado|investimento|contrapartida|repasse|executado|captado|pago|pagamento|empenhado|empenho|liquidado|custo|preco|saldo|r) /)) return 'Financeiro';
  if (field?.type === 'date' || has(/ (prazo|prazos|data|datas|inicio|termino|fim|vigencia|previsao|previsto|entrega|cronograma|dias|meses|duracao|conclusao|ano|mes) /)) return 'Prazos e marcos';
  if (has(/ (endereco|bairro|bairros|regiao|regional|logradouro|cep|latitude|longitude|coordenada|coordenadas|localizacao|local|setor|municipio|cidade|zona|quadra|lote|mapa|georreferenciamento|distrito|rua|avenida) /)) return 'Localização';
  if (has(/ (status|situacao|etapa|macroetapa|fase|responsavel|fiscal|gestor|providencia|observacao|observacoes|obs|acao|acoes|prioridade|atualizacao|atualizado|pendencia|pendencias|risco|riscos|comentario|comentarios) /)) return 'Acompanhamento';
  if (field?.type === 'link' || has(/ (sei|processo|documento|documentos|etp|tr|termo|parecer|licenca|licenciamento|alvara|anexo|anexos|link|arquivo|projeto basico|projeto executivo|art|rrt) /)) return 'Documentação';
  if (has(/ (convenio|fonte|programa|contrato|contratada|empresa|licitacao|licitatorio|modalidade|instrumento|emenda|ministerio|financiamento|operacao|recurso|recursos|parceiro|proponente) /)) return 'Recursos e instrumentos';
  if (has(/ (orgao|secretaria|unidade|tipo|categoria|objeto|descricao|eixo|area) /)) return 'Essenciais';
  return 'Outras informações';
}

let secapEditSession = {
  active: false,
  pid: '',
  currentRid: '',
  isSwitchingObra: false,
  bypassExitGuard: false,
  // Mapa por rid: { rid, obraNome, changes: Map<fieldId, { fieldId, fieldName, beforeRaw, afterRaw, before, after }>, saved: boolean }
  records: new Map(),
  justifications: new Map(),
  reviewMarks: new Map(),
};

function resetSecapEditSession() {
  secapEditSession = {
    active: false,
    pid: '',
    currentRid: '',
    isSwitchingObra: false,
    bypassExitGuard: false,
    records: new Map(),
    // Justificativas já digitadas na revisão (preservadas ao voltar para editar uma obra).
    justifications: new Map(),
    // Marcação feita pelo usuário em cada obra: 'alterada' | 'sem_alteracao'.
    reviewMarks: new Map(),
  };
}

function getRecordDisplayValue(field, rawValue) {
  if (rawValue === '' || rawValue === null || rawValue === undefined) return '—';
  if (field?.type === 'date') return typeof date === 'function' ? date(rawValue) : String(rawValue);
  if (field?.type === 'currency')
    return typeof money === 'function' ? money(rawValue) : String(rawValue);
  if (field?.type === 'boolean') {
    return rawValue === true || rawValue === 'true' || rawValue === 'Sim' ? 'Sim' : 'Não';
  }
  return String(rawValue);
}

// Coleta as diferenças atuais do formulário #recordForm em relação aos valores originais do banco
function collectCurrentFormDiffs(pid, rid) {
  const form = document.getElementById('recordForm');
  const p = visible().find((project) => String(project.id) === String(pid));
  if (!form || !p) return [];

  const diffs = [];
  const controls = form.querySelectorAll('[name][data-original-value]');

  for (const el of controls) {
    if (el.disabled) continue;
    const fieldId = String(el.name || '');
    if (!fieldId) continue;

    const originalRaw = String(el.dataset.originalValue ?? '');
    const currentRaw =
      el.type === 'checkbox' ? (el.checked ? 'true' : 'false') : String(el.value ?? '');

    if (originalRaw !== currentRaw) {
      const fieldMeta = (p.fields || []).find((f) => String(f.id) === fieldId);
      diffs.push({
        fieldId,
        fieldName: fieldMeta?.name || fieldId,
        beforeRaw: originalRaw,
        afterRaw: currentRaw,
        before: getRecordDisplayValue(fieldMeta, originalRaw),
        after: getRecordDisplayValue(fieldMeta, currentRaw),
      });
    }
  }

  return diffs;
}

// Armazena ou atualiza as alterações pendentes de uma obra na sessão atual
function stageObraChangesInSession(pid, rid, diffs, saved = false) {
  const key = String(rid || 'novo_registro');

  // Se o usuário voltou todos os campos da obra atual ao valor original e ela não havia sido salva, remove da sessão
  if (!diffs || !diffs.length) {
    const prev = secapEditSession.records.get(key);
    if (prev && !prev.saved) {
      secapEditSession.records.delete(key);
    }
    return;
  }

  const p = visible().find((project) => String(project.id) === String(pid));
  const r = (p?.records || []).find((record) => String(record.id) === String(rid));

  const existing = secapEditSession.records.get(key) || {
    rid: key,
    obraNome: r?.nome || diffs.find((d) => d.fieldId === 'nome')?.after || 'Nova obra',
    changes: new Map(),
    saved: false,
  };

  const currentFieldIds = new Set(diffs.map((d) => d.fieldId));

  // Se a obra ainda não foi salva individualmente, sincroniza exatamente o estado atual dos campos
  if (!existing.saved && !saved) {
    for (const existingFid of [...existing.changes.keys()]) {
      if (!currentFieldIds.has(existingFid)) {
        existing.changes.delete(existingFid);
      }
    }
  }

  for (const d of diffs) {
    const prevEntry = existing.changes.get(d.fieldId);
    const initialBefore = prevEntry ? prevEntry.before : d.before;
    const initialBeforeRaw = prevEntry ? prevEntry.beforeRaw : d.beforeRaw;

    if (initialBeforeRaw === d.afterRaw) {
      existing.changes.delete(d.fieldId);
    } else {
      existing.changes.set(d.fieldId, {
        ...d,
        before: initialBefore,
        beforeRaw: initialBeforeRaw,
      });
    }
  }

  if (saved) existing.saved = true;

  if (existing.changes.size === 0) {
    secapEditSession.records.delete(key);
  } else {
    secapEditSession.records.set(key, existing);
  }
}

// Captura as alterações da obra que está aberta na tela neste momento
function syncCurrentFormToSession() {
  if (secapEditSession.active && secapEditSession.pid) {
    const liveDiffs = collectCurrentFormDiffs(secapEditSession.pid, secapEditSession.currentRid);
    stageObraChangesInSession(secapEditSession.pid, secapEditSession.currentRid, liveDiffs, false);
  }
}

// Reaplica no formulário os valores já editados caso o usuário retorne a uma obra da mesma sessão
function restoreStagedValuesToForm(rid) {
  const key = String(rid || '');
  if (!key || !secapEditSession.records.has(key)) return;

  const entry = secapEditSession.records.get(key);
  if (entry.saved) return;

  const form = document.getElementById('recordForm');
  if (!form) return;

  for (const [fieldId, change] of entry.changes.entries()) {
    const el = form.querySelector(`[name="${CSS.escape(fieldId)}"]`);
    if (!el || el.disabled) continue;

    if (el.type === 'checkbox') {
      el.checked = change.afterRaw === 'true';
    } else {
      el.value = change.afterRaw;
    }
  }
}

function getAllSessionModifiedRecords() {
  syncCurrentFormToSession();

  const list = [];
  for (const entry of secapEditSession.records.values()) {
    if (entry.changes.size > 0) {
      list.push({
        rid: entry.rid,
        obraNome: entry.obraNome,
        saved: entry.saved,
        changes: [...entry.changes.values()],
      });
    }
  }
  return list;
}

function hasAnyPendingSessionChanges() {
  return getAllSessionModifiedRecords().length > 0;
}

// Intercepta saveRecord (caso o usuário clique manualmente em "Salvar alterações" em alguma obra)
(function attachSaveRecordAuditor() {
  if (typeof window.saveRecord === 'function' && !window.saveRecord.__secapSessionHooked) {
    const originalSaveRecord = window.saveRecord;
    window.saveRecord = function (pid, rid = '') {
      const diffs = collectCurrentFormDiffs(pid, rid);
      const isSessionSave = secapEditSession.active && String(secapEditSession.pid) === String(pid);

      if (isSessionSave) {
        // Registra a obra na sessão antes do salvamento individual. O salvamento
        // original continua responsável por persistir os dados no backend.
        stageObraChangesInSession(pid, rid, diffs, true);
        secapEditSession.isSwitchingObra = true;
      }

      let result;
      try {
        result = originalSaveRecord.apply(this, arguments);
      } finally {
        secapEditSession.isSwitchingObra = false;
      }

      // Ao clicar em "Salvar alterações", solicita a justificativa imediatamente,
      // antes de deixar o usuário voltar à listagem e continuar pelas demais obras.
      // Vale também quando o usuário voltou à edição pela revisão e salvou sem mudar
      // nada na obra aberta: as alterações da sessão ainda aguardam a justificativa.
      if (isSessionSave && hasAnyPendingSessionChanges()) {
        openExitAuditChecklistModal(() => {
          if (typeof render === 'function') render();
        });
      }

      return result;
    };
    window.saveRecord.__secapSessionHooked = true;
  }
})();

// Revisão das obras ao concluir a edição: lista todas as obras do projeto que o
// usuário recebeu. O próprio usuário marca cada uma como "Alteração feita" ou
// "Sem alteração" (nada vem marcado); a justificativa opcional aparece após marcar.
// Concluir só é permitido com todas as obras marcadas.
function buildObraReviewList(pid, modifiedRecords) {
  const p = (typeof visible === 'function' ? visible() : db.projects).find(
    (project) => String(project.id) === String(pid)
  );
  const byRid = new Map(modifiedRecords.map((item) => [String(item.rid), item]));
  const list = (p?.records || []).map((r) => {
    const mod = byRid.get(String(r.id));
    byRid.delete(String(r.id));
    return {
      rid: String(r.id),
      obraNome: mod?.obraNome || r.nome || 'Obra sem nome',
      status: mod ? 'alterada' : 'sem_alteracao',
      saved: !!mod?.saved,
      changes: mod?.changes || [],
    };
  });
  // Obras alteradas que não estão na lista do projeto (ex.: recém-cadastradas).
  for (const mod of byRid.values()) {
    list.unshift({
      rid: String(mod.rid),
      obraNome: mod.obraNome,
      status: 'alterada',
      saved: !!mod.saved,
      changes: mod.changes,
    });
  }
  return list;
}

function obraReviewLegendHtml() {
  return `<div class="obra-review-legend" aria-label="Legenda da revisão das obras">
    <span class="orl-item is-changed"><i aria-hidden="true">✓</i><span><strong>Alteração feita</strong> · marque nas obras que você alterou</span></span>
    <span class="orl-item is-unchanged"><i aria-hidden="true">✓</i><span><strong>Sem alteração</strong> · marque nas obras que ficaram iguais</span></span>
    <span class="orl-item is-note">${icon('note')}<span><strong>Justificativa</strong> · opcional, aparece após marcar</span></span>
  </div>`;
}

function obraReviewMark(rid) {
  return secapEditSession.reviewMarks?.get(String(rid)) || '';
}

function obraReviewCheck(label, value, item, kind) {
  const on = obraReviewMark(item.rid) === value;
  return `<button type="button" class="orr-check ${kind} ${on ? 'is-on' : ''}" role="radio" aria-checked="${on}" data-rid="${esc(item.rid)}" data-value="${value}" onclick="setObraReviewMark(this)">
    <i aria-hidden="true">${on ? '✓' : ''}</i>${label}
  </button>`;
}

// Marca a obra (clique do usuário) e libera a justificativa opcional.
function setObraReviewMark(button) {
  applyObraReviewMark(button.closest('.obra-review-row'), button.dataset.value);
  updateObraReviewProgress();
}

// Marca de uma vez todas as obras visíveis (respeita a busca) com a mesma situação.
function markAllObraReview(value) {
  document
    .querySelectorAll('#exitAuditForm .obra-review-row:not([hidden])')
    .forEach((row) => applyObraReviewMark(row, value));
  updateObraReviewProgress();
}

function applyObraReviewMark(row, value) {
  if (!row) return;
  if (!secapEditSession.reviewMarks) secapEditSession.reviewMarks = new Map();
  secapEditSession.reviewMarks.set(String(row.dataset.rid), value);
  row.querySelectorAll('.orr-check').forEach((el) => {
    const on = el.dataset.value === value;
    el.classList.toggle('is-on', on);
    el.setAttribute('aria-checked', String(on));
    el.querySelector('i').textContent = on ? '✓' : '';
  });
  row.classList.remove('needs-mark');
  row.classList.toggle('is-marked-changed', value === 'alterada');
  row.classList.toggle('is-marked-unchanged', value === 'sem_alteracao');
  row.querySelector('.orr-just').hidden = false;
}

function updateObraReviewProgress() {
  const rows = [...document.querySelectorAll('#exitAuditForm .obra-review-row')];
  const marked = rows.filter((row) => obraReviewMark(row.dataset.rid)).length;
  const progress = document.getElementById('obraReviewProgress');
  if (progress) progress.textContent = `${marked} de ${rows.length} obra(s) marcada(s)`;
  const warning = document.getElementById('obraReviewWarning');
  if (warning && marked === rows.length) warning.hidden = true;
}

function obraReviewRowHtml(item) {
  const changed = item.status === 'alterada';
  const rid = esc(item.rid);
  const draft = secapEditSession.justifications?.get(String(item.rid)) || '';
  const mark = obraReviewMark(item.rid);
  const markClass =
    mark === 'alterada'
      ? 'is-marked-changed'
      : mark === 'sem_alteracao'
        ? 'is-marked-unchanged'
        : '';
  return `
    <div class="obra-review-row ${changed ? 'is-changed' : 'is-unchanged'} ${markClass}" data-rid="${rid}" data-review-name="${esc(item.obraNome.toLowerCase())}">
      <div class="orr-top">
        <strong class="orr-name">${esc(item.obraNome)}</strong>
        <div class="orr-checks" role="radiogroup" aria-label="Situação da obra ${esc(item.obraNome)}" aria-required="true">
          ${obraReviewCheck('Alteração feita', 'alterada', item, 'is-changed')}
          ${obraReviewCheck('Sem alteração', 'sem_alteracao', item, 'is-unchanged')}
          <button type="button" class="btn secondary small orr-edit" data-rid="${rid}" onclick="editObraFromReview(this.dataset.rid)" title="Voltar à edição desta obra">${icon('edit')} Editar</button>
        </div>
      </div>
      ${
        changed && item.changes.length
          ? `<ul class="orr-changes">${item.changes
              .map(
                (c) =>
                  `<li><strong>${esc(c.fieldName)}:</strong> ${esc(c.before)} → <b>${esc(c.after)}</b></li>`
              )
              .join('')}</ul>`
          : ''
      }
      <div class="orr-just" ${mark ? '' : 'hidden'}>
        <button type="button" class="textbtn orr-add" onclick="openObraJustification(this)" ${draft ? 'hidden' : ''}>${icon('plus')} Adicionar justificativa</button>
        <textarea data-rid="${rid}" rows="2" maxlength="600" ${draft ? '' : 'hidden'} aria-label="Justificativa da obra ${esc(item.obraNome)}" placeholder="Contexto, reunião, ofício ou motivo (opcional)">${esc(draft)}</textarea>
      </div>
    </div>`;
}

function openObraJustification(button) {
  const box = button.parentElement.querySelector('textarea');
  if (!box) return;
  box.hidden = false;
  button.hidden = true;
  box.focus();
}

function filterObraReview(text) {
  const term = String(text || '')
    .trim()
    .toLowerCase();
  document.querySelectorAll('#exitAuditForm .obra-review-row').forEach((row) => {
    row.hidden = !!term && !row.dataset.reviewName.includes(term);
  });
  document.querySelectorAll('#exitAuditForm .obra-review-group').forEach((group) => {
    const visibleRows = group.querySelectorAll('.obra-review-row:not([hidden])').length;
    group.querySelector('.org-empty').hidden = visibleRows > 0;
  });
}

function openExitAuditChecklistModal(onCompleteExit) {
  const modifiedRecords = getAllSessionModifiedRecords();
  if (!modifiedRecords.length) {
    resetSecapEditSession();
    onCompleteExit();
    return;
  }

  const review = buildObraReviewList(secapEditSession.pid, modifiedRecords);
  const changed = review.filter((item) => item.status === 'alterada');
  const unchanged = review.filter((item) => item.status !== 'alterada');
  const totalFieldsChanged = modifiedRecords.reduce((acc, item) => acc + item.changes.length, 0);

  const group = (title, kind, items, emptyText) => `
    <section class="obra-review-group ${kind}">
      <h3><i aria-hidden="true">✓</i>${title} <span class="org-count">${items.length}</span></h3>
      ${items.map(obraReviewRowHtml).join('')}
      <p class="org-empty" ${items.length ? 'hidden' : ''}>${emptyText}</p>
    </section>`;

  window.__pendingExitAuditCallback = onCompleteExit;

  secapEditSession.bypassExitGuard = true;
  modal(
    'Justificativas das obras',
    `<div class="obra-review">
       <div class="summary-strip" style="margin-bottom: 12px; padding: 10px 14px;">
         ${icon('shield')}
         <p style="font-size: 12.5px;">
           <strong>Marque em cada obra se houve alteração ou não.</strong> Nada vem marcado: a marcação é sua e fica registrada na auditoria.${isSysAdmin() ? ' Para administradores a marcação é opcional.' : ''}<br>
           Nesta sessão, ${changed.length} obra(s) foram editadas (${totalFieldsChanged} campo(s)). Depois de marcar, você pode adicionar uma justificativa (opcional).
         </p>
       </div>
       ${obraReviewLegendHtml()}
       <form id="exitAuditForm" onsubmit="event.preventDefault(); submitExitAuditChecklist();" novalidate>
         <div class="obra-review-warning" id="obraReviewWarning" role="alert" hidden></div>
         <div class="obra-review-bulk">
           <p class="obra-review-progress" id="obraReviewProgress" aria-live="polite">${review.filter((item) => obraReviewMark(item.rid)).length} de ${review.length} obra(s) marcada(s)</p>
           <div class="obra-review-bulk-actions" role="group" aria-label="Marcar todas as obras">
             <button type="button" class="orr-bulk is-unchanged" onclick="markAllObraReview('sem_alteracao')" title="Marca todas as obras listadas como Sem alteração">Marcar todas: Sem alteração</button>
             <button type="button" class="orr-bulk is-changed" onclick="markAllObraReview('alterada')" title="Marca todas as obras listadas como Alteração feita">Marcar todas: Alteração feita</button>
           </div>
         </div>
         ${
           review.length > 6
             ? `<input type="search" class="obra-review-search" placeholder="Buscar obra pelo nome" aria-label="Buscar obra pelo nome" oninput="filterObraReview(this.value)">`
             : ''
         }
         <div class="obra-review-list">
           ${group('Editadas nesta sessão', 'is-changed', changed, 'Nenhuma obra encontrada.')}
           ${group('Demais obras', 'is-unchanged', unchanged, unchanged.length ? 'Nenhuma obra encontrada.' : 'Todas as suas obras foram editadas.')}
         </div>
       </form>
     </div>`,
    `<div style="margin-right: auto;">
       <button class="btn" type="button" onclick="returnToObraEditing()">${icon('arrow')} Voltar à edição</button>
     </div>
     <button class="btn primary" form="exitAuditForm" type="submit">${icon('check')} Salvar tudo e concluir</button>`
  );
  secapEditSession.bypassExitGuard = false;
}

// Guarda o que já foi digitado nas justificativas antes de sair da revisão.
function saveObraJustificationDrafts() {
  if (!secapEditSession.justifications) secapEditSession.justifications = new Map();
  document.querySelectorAll('#exitAuditForm textarea[data-rid]').forEach((box) => {
    const text = box.value.trim();
    if (text) secapEditSession.justifications.set(box.dataset.rid, box.value);
    else secapEditSession.justifications.delete(box.dataset.rid);
  });
}

// Botão "Editar" da revisão: volta à edição da obra escolhida, mantendo as
// alterações das demais obras e as justificativas já digitadas.
function editObraFromReview(rid) {
  saveObraJustificationDrafts();
  secapEditSession.isSwitchingObra = true;
  try {
    openRecordForm(secapEditSession.pid, rid);
  } finally {
    secapEditSession.isSwitchingObra = false;
  }
  const dialogBody = document.querySelector('#modal .dialogbody');
  if (dialogBody) dialogBody.scrollTop = 0;
}

function returnToObraEditing() {
  saveObraJustificationDrafts();
  const { pid, currentRid } = secapEditSession;
  secapEditSession.isSwitchingObra = true;
  openRecordForm(pid, currentRid);
  secapEditSession.isSwitchingObra = false;
}

function normalizeStagedFieldValue(fieldMeta, rawValue) {
  if (fieldMeta?.type === 'boolean') {
    return rawValue === 'true' || rawValue === true;
  }
  if (fieldMeta?.type === 'number' || fieldMeta?.type === 'currency') {
    if (rawValue === '' || rawValue === null || rawValue === undefined) return '';
    const num = Number(rawValue);
    return Number.isFinite(num) ? num : rawValue;
  }
  return rawValue;
}

// Grava no banco (tabela de obras) as obras alteradas que ainda não tinham sido salvas.
// Cada obra só é atualizada na tela depois que o servidor confirma a gravação.
// Devolve a lista de obras que falharam (vazia quando tudo foi salvo).
async function saveStagedObrasToBackend(p, modifiedRecords) {
  const failed = [];
  let saved = 0;
  if (!p || !Array.isArray(p.records)) return { saved, failed };
  for (const item of modifiedRecords) {
    if (item.saved) continue;
    const targetRec = p.records.find((rec) => String(rec.id) === String(item.rid));
    if (!targetRec) continue;
    const next = { ...targetRec };
    for (const ch of item.changes) {
      const fieldMeta = (p.fields || []).find((f) => String(f.id) === String(ch.fieldId));
      next[ch.fieldId] = normalizeStagedFieldValue(fieldMeta, ch.afterRaw);
    }
    const backend = window.SECAP_OBRAS_BACKEND;
    const result = backend ? await backend.saveObra(p.id, next) : { ok: true };
    if (!result || !result.ok) {
      failed.push({ name: item.obraNome, error: result?.error || 'erro desconhecido' });
      continue;
    }
    Object.assign(targetRec, next);
    item.saved = true;
    const sessionEntry = secapEditSession.records.get(String(item.rid));
    if (sessionEntry) sessionEntry.saved = true;
    saved++;
  }
  return { saved, failed };
}

// Confirmação visual para administradores que desejam sair sem marcar todos os checks.
function showAdminUnmarkedExitDialog(unmarkedCount, totalCount) {
  return new Promise((resolve) => {
    const existing = document.getElementById('adminUnmarkedExitDialog');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'adminUnmarkedExitDialog';
    overlay.className = 'admin-exit-confirm-overlay';
    overlay.innerHTML = `
      <section class="admin-exit-confirm" role="dialog" aria-modal="true"
        aria-labelledby="adminExitConfirmTitle" aria-describedby="adminExitConfirmText">
        <button type="button" class="admin-exit-confirm-close" aria-label="Fechar">×</button>
        <div class="admin-exit-confirm-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3.5 2.9 19.2a1.5 1.5 0 0 0 1.3 2.3h15.6a1.5 1.5 0 0 0 1.3-2.3L12 3.5Z"
              stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
            <path d="M12 9v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="12" cy="17.2" r="1" fill="currentColor"/>
          </svg>
        </div>
        <span class="admin-exit-confirm-eyebrow">REVISÃO DE OBRAS</span>
        <h2 id="adminExitConfirmTitle">Pendências na revisão</h2>
        <p id="adminExitConfirmText">
          Existem obras que ainda não tiveram seus checks preenchidos.
          Deseja realmente sair sem concluir todas as marcações?
        </p>
        <div class="admin-exit-confirm-counter">
          <div>
            <strong>${unmarkedCount}</strong>
            <span>obra(s) sem marcação</span>
          </div>
          <span class="admin-exit-confirm-total">de ${totalCount}</span>
        </div>
        <div class="admin-exit-confirm-actions">
          <button type="button" class="admin-exit-confirm-back">Voltar e revisar</button>
          <button type="button" class="admin-exit-confirm-leave">Sair sem marcar</button>
        </div>
        <small>Você poderá revisar essas informações posteriormente.</small>
      </section>
    `;

    const finish = (confirmed) => {
      overlay.classList.remove('is-visible');
      document.removeEventListener('keydown', onKeyDown);
      window.setTimeout(() => overlay.remove(), 160);
      resolve(confirmed);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') finish(false);
    };

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) finish(false);
    });
    overlay
      .querySelector('.admin-exit-confirm-close')
      .addEventListener('click', () => finish(false));
    overlay
      .querySelector('.admin-exit-confirm-back')
      .addEventListener('click', () => finish(false));
    overlay
      .querySelector('.admin-exit-confirm-leave')
      .addEventListener('click', () => finish(true));
    document.addEventListener('keydown', onKeyDown);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.classList.add('is-visible');
      overlay.querySelector('.admin-exit-confirm-back')?.focus();
    });
  });
}

let exitAuditSubmitting = false;
async function submitExitAuditChecklist() {
  const form = document.getElementById('exitAuditForm');
  if (!form || exitAuditSubmitting) return;

  const justificationOf = (rid) =>
    String(
      [...form.querySelectorAll('textarea[data-rid]')].find(
        (box) => box.dataset.rid === String(rid)
      )?.value || ''
    ).trim();

  const { pid } = secapEditSession;
  const p = db.projects.find((project) => String(project.id) === String(pid));
  const modifiedRecords = getAllSessionModifiedRecords();

  // Todas as obras precisam ser marcadas pelo usuário antes de concluir.
  const reviewList = buildObraReviewList(pid, modifiedRecords);
  const unmarked = reviewList.filter((item) => !obraReviewMark(item.rid));
  // Administradores não são obrigados a marcar: apenas confirmam a saída sem marcar.
  if (unmarked.length && isSysAdmin()) {
    const total = reviewList.length;
    const confirmed = await showAdminUnmarkedExitDialog(unmarked.length, total);
    if (!confirmed) return;
  } else if (unmarked.length) {
    const search = form.querySelector('.obra-review-search');
    if (search && search.value) {
      search.value = '';
      filterObraReview('');
    }
    const pendingIds = new Set(unmarked.map((item) => String(item.rid)));
    form
      .querySelectorAll('.obra-review-row')
      .forEach((row) => row.classList.toggle('needs-mark', pendingIds.has(row.dataset.rid)));
    const warning = document.getElementById('obraReviewWarning');
    const message = `Marque “Alteração feita” ou “Sem alteração” em todas as obras antes de concluir. Falta(m) ${unmarked.length} obra(s).`;
    if (warning) {
      warning.textContent = message;
      warning.hidden = false;
    }
    notify(message, 'error');
    const first = form.querySelector('.obra-review-row.needs-mark');
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      first.querySelector('.orr-check')?.focus({ preventScroll: true });
    }
    return;
  }

  const review = reviewList.map((item) => {
    // Situação declarada pelo usuário; a detecção do sistema fica registrada à parte.
    const entry = {
      recordId: item.rid,
      recordName: item.obraNome,
      status: obraReviewMark(item.rid) || 'sem_marcacao',
      detectedStatus: item.status,
    };
    const justification = justificationOf(item.rid);
    if (justification) entry.justification = justification;
    return entry;
  });
  const changedCount = review.filter((item) => item.status === 'alterada').length;
  const unchangedCount = review.filter((item) => item.status === 'sem_alteracao').length;
  const unmarkedCount = review.length - changedCount - unchangedCount;

  // Salva no banco TODAS as obras modificadas que ainda não haviam sido salvas.
  const submitButton = document.querySelector('#modal button[form="exitAuditForm"]');
  const submitLabel = submitButton ? submitButton.innerHTML : '';
  exitAuditSubmitting = true;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="save-spinner" aria-hidden="true"></span>Salvando as obras…';
  }
  let autoSavedCount = 0;
  try {
    const { saved, failed } = await saveStagedObrasToBackend(p, modifiedRecords);
    autoSavedCount = saved;
    if (failed.length) {
      // Mantém a janela aberta: as obras que falharam continuam pendentes e o
      // usuário pode tentar de novo sem perder as justificativas digitadas.
      notify(
        `Não foi possível salvar ${failed.length} obra(s): ${failed
          .map((f) => `${f.name} (${f.error})`)
          .join('; ')}. Nada foi registrado na auditoria; tente novamente.`,
        'error'
      );
      return;
    }
  } finally {
    exitAuditSubmitting = false;
    if (submitButton && document.body.contains(submitButton)) {
      submitButton.disabled = false;
      submitButton.innerHTML = submitLabel;
    }
  }

  // "reason" junta as justificativas no formato "[Obra] texto | [Obra] texto"; o servidor
  // repassa esse texto (e "checklist") aos registros individuais de cada campo alterado.
  const reasonText = review
    .filter((item) => item.justification)
    .map((item) => `[${item.recordName}] ${item.justification}`)
    .join(' | ');

  if (p && typeof persist === 'function') {
    persist(
      `Edição em lote de obras (${changedCount} com alteração · ${unchangedCount} sem alteração${unmarkedCount ? ` · ${unmarkedCount} sem marcação` : ''})`,
      p,
      '',
      '',
      '',
      false,
      {
        reason: reasonText || 'Não informada',
        checklist: [
          `Alteração feita: ${changedCount} obra(s)`,
          `Sem alteração: ${unchangedCount} obra(s)`,
          ...(unmarkedCount ? [`Sem marcação: ${unmarkedCount} obra(s)`] : []),
        ],
        review,
        changes: modifiedRecords.flatMap((item) =>
          item.changes.map((c) => ({
            recordId: item.rid,
            recordName: item.obraNome,
            fieldId: c.fieldId,
            action: 'Alterou campo',
            field: c.fieldName,
            before: c.beforeRaw ?? c.before,
            after: c.afterRaw ?? c.after,
            justification: justificationOf(item.rid),
          }))
        ),
      }
    );
  }

  const exitCallback = window.__pendingExitAuditCallback;
  window.__pendingExitAuditCallback = null;
  resetSecapEditSession();

  notify(
    autoSavedCount > 0
      ? `${autoSavedCount} obra(s) salva(s) automaticamente e revisão registrada na auditoria.`
      : 'Revisão das obras registrada na auditoria.'
  );

  secapEditSession.bypassExitGuard = true;
  try {
    if (typeof exitCallback === 'function') exitCallback();

    // Depois de concluir a auditoria, fecha também a janela/aba de edição
    // para não deixar o formulário da obra aberto.
    if (typeof window.closeModal === 'function') window.closeModal();
  } finally {
    secapEditSession.bypassExitGuard = false;
  }

  if (typeof render === 'function') render();
}

// Intercepta closeModal, go e o clique na seta de voltar (←) do cabeçalho do modal
(function attachExitNavigationGuards() {
  if (typeof window.closeModal === 'function' && !window.closeModal.__secapExitGuarded) {
    const baseCloseModal = window.closeModal;
    window.closeModal = function () {
      if (
        secapEditSession.active &&
        !secapEditSession.isSwitchingObra &&
        !secapEditSession.bypassExitGuard &&
        hasAnyPendingSessionChanges()
      ) {
        openExitAuditChecklistModal(() => baseCloseModal.apply(this, arguments));
        return;
      }
      if (!secapEditSession.isSwitchingObra) {
        resetSecapEditSession();
      }
      return baseCloseModal.apply(this, arguments);
    };
    window.closeModal.__secapExitGuarded = true;
  }

  if (typeof window.go === 'function' && !window.go.__secapExitGuarded) {
    const baseGo = window.go;
    window.go = function () {
      const args = arguments;
      if (
        secapEditSession.active &&
        !secapEditSession.bypassExitGuard &&
        hasAnyPendingSessionChanges()
      ) {
        openExitAuditChecklistModal(() => {
          if (typeof window.closeModal === 'function') window.closeModal();
          baseGo.apply(this, args);
        });
        return;
      }
      resetSecapEditSession();
      return baseGo.apply(this, args);
    };
    window.go.__secapExitGuarded = true;
  }

  // Garante interceptação mesmo se a seta de voltar (←) do cabeçalho tiver handler próprio
  if (!window.__secapModalBackArrowGuarded) {
    document.addEventListener(
      'click',
      function (ev) {
        if (
          !secapEditSession.active ||
          secapEditSession.isSwitchingObra ||
          secapEditSession.bypassExitGuard
        ) {
          return;
        }
        const backBtn = ev.target?.closest?.(
          '#modal .dialoghead button, #modal .modal-back-btn, #modal [data-modal-back]'
        );
        if (!backBtn) return;

        if (hasAnyPendingSessionChanges()) {
          ev.preventDefault();
          ev.stopImmediatePropagation();
          openExitAuditChecklistModal(() => {
            if (typeof window.closeModal === 'function') window.closeModal();
          });
        }
      },
      true
    );
    window.__secapModalBackArrowGuarded = true;
  }
})();

/* ============================================================================
   NAVEGAÇÃO SEQUENCIAL ENTRE OBRAS ("PRÓXIMA OBRA") E PROTEÇÃO DE ALTERAÇÕES
   ============================================================================ */

function getProjectRecordNavigation(pid, rid) {
  const p = visible().find((project) => String(project.id) === String(pid));
  if (!p) {
    return { project: null, list: [], currentIndex: -1, prevRecord: null, nextRecord: null };
  }

  const allRecords = Array.isArray(p.records) ? p.records : [];
  let activeList = allRecords;

  if (tab === 'projects' && String(projectId) === String(pid)) {
    const filtered = allRecords.filter(
      (item) =>
        matchesQuery(item) &&
        (typeof matchesCustomFilters === 'function' ? matchesCustomFilters(item, p.fields) : true)
    );
    if (filtered.some((item) => String(item.id) === String(rid))) {
      activeList = filtered;
    }
  }

  const currentIndex = activeList.findIndex((item) => String(item.id) === String(rid));
  const prevRecord = currentIndex > 0 ? activeList[currentIndex - 1] : null;
  const nextRecord =
    currentIndex >= 0 && currentIndex < activeList.length - 1 ? activeList[currentIndex + 1] : null;

  return {
    project: p,
    list: activeList,
    currentIndex,
    prevRecord,
    nextRecord,
  };
}

function goToAdjacentObra(pid, currentRid, direction = 'next', mode = 'view') {
  const { prevRecord, nextRecord } = getProjectRecordNavigation(pid, currentRid);
  const targetRecord = direction === 'prev' ? prevRecord : nextRecord;
  if (!targetRecord) return;

  if (mode === 'edit') {
    // Guarda automaticamente as alterações da obra atual na sessão sem exigir salvamento nem perguntar descarte
    syncCurrentFormToSession();
    secapEditSession.isSwitchingObra = true;
    openRecordForm(pid, targetRecord.id);
    secapEditSession.isSwitchingObra = false;
    const dialogBody = document.querySelector('#modal .dialogbody');
    if (dialogBody) dialogBody.scrollTop = 0;
    return;
  }

  editRecord(pid, targetRecord.id);
  const detailView = document.getElementById('fullscreenDetailView');
  if (detailView) detailView.scrollTop = 0;
}

function renderObraNavButtons(pid, rid, prevRecord, nextRecord, mode = 'view') {
  const isFirstObra = !prevRecord;
  const isLastObra = !nextRecord;
  const prevArrow = `<span style="display:inline-flex;transform:rotate(180deg)">${icon('arrow')}</span>`;

  return `
    <button
      class="btn"
      type="button"
      ${
        isFirstObra
          ? 'disabled aria-disabled="true" title="Você já está na primeira obra da lista"'
          : `title="Voltar para: ${esc(prevRecord.nome || 'Obra anterior')}" onclick="goToAdjacentObra('${pid}','${rid}','prev','${mode}')"`
      }
    >${prevArrow} Obra Anterior</button>
    <button
      class="btn"
      type="button"
      ${
        isLastObra
          ? 'disabled aria-disabled="true" title="Você já está na última obra da lista"'
          : `title="Avançar para: ${esc(nextRecord.nome || 'Próxima obra')}" onclick="goToAdjacentObra('${pid}','${rid}','next','${mode}')"`
      }
    >Próxima Obra ${icon('arrow')}</button>
  `;
}

function handleCancelFromRecordForm(pid, rid = '') {
  const proceedExit = () => {
    resetSecapEditSession();
    if (rid) editRecord(pid, rid);
    else closeModal();
  };

  if (
    secapEditSession.active &&
    !secapEditSession.bypassExitGuard &&
    hasAnyPendingSessionChanges()
  ) {
    openExitAuditChecklistModal(proceedExit);
    return;
  }

  proceedExit();
}

editRecord = function (pid, rid = '') {
  const p = visible().find((project) => project.id === pid);
  if (!p) return;
  const r = p.records.find((record) => record.id === rid);
  const edit = canEdit(p);

  if (!r) {
    openRecordForm(pid, rid);
    return;
  }

  closeFullscreenDetail();

  const { list, currentIndex, prevRecord, nextRecord } = getProjectRecordNavigation(pid, rid);
  const isFirstObra = !prevRecord;
  const isLastObra = !nextRecord;
  const positionLabel = currentIndex >= 0 ? `Obra ${currentIndex + 1} de ${list.length}` : '';
  const navButtonsHtml = renderObraNavButtons(pid, rid, prevRecord, nextRecord, 'view');

  // Seções e campos na organização pessoal do usuário atual.
  const layout = projectLayoutView(p);
  const fields = layout.fields;
  const groups = getProjectSections(layout);

  const detailContainer = document.createElement('div');
  detailContainer.id = 'fullscreenDetailView';
  detailContainer.className = 'fullscreen-detail-page';

  detailContainer.innerHTML = `
    <header class="fullscreen-header">
      <div style="display:flex; align-items:center; gap:16px;">
        <button class="btn" type="button" onclick="closeFullscreenDetail()">${icon('arrow')} Voltar às obras</button>
        <div>
          <span class="eyebrow">${esc(p.name)}${positionLabel ? ` · ${esc(positionLabel)}` : ''}</span>
          <h1 class="obra-detail-title" title="${esc(r.nome || Object.values(r)[1] || 'Registro')}">${esc(r.nome || Object.values(r)[1] || 'Registro')}</h1>
        </div>
      </div>
      <div class="actions" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <button class="btn secondary" type="button" onclick="closeFullscreenDetail(); editFields('${pid}')">${icon('edit')} Configurar seções e campos</button>
        ${edit ? `<button class="btn primary" type="button" onclick="closeFullscreenDetail(); openRecordForm('${pid}','${rid}')">${icon('edit')} Editar dados</button>` : ''}
        ${navButtonsHtml}
        <button class="iconbtn" type="button" onclick="closeFullscreenDetail()" title="Fechar">${icon('close')}</button>
      </div>
    </header>

    <div class="fullscreen-content">
      <div class="stats" style="margin-bottom: 24px;">
        <div class="stat">
          <div class="top">SITUAÇÃO</div>
          <div class="number" style="font-size:16px;">${badge(r.status)}</div>
        </div>
        <div class="stat">
          <div class="top">AVANÇO FÍSICO</div>
          <div class="number">${r.progresso !== '' && r.progresso != null ? r.progresso + '%' : '—'}</div>
        </div>
        <div class="stat">
          <div class="top">INVESTIMENTO</div>
          <div class="number">${r.valor !== '' && r.valor != null ? money(r.valor) : '—'}</div>
        </div>
        <div class="stat">
          <div class="top">PRAZO DE ENTREGA</div>
          <div class="number" style="font-size:16px;">${date(r.prazo)}</div>
        </div>
      </div>

      ${groups
        .map((g) => {
          const groupFields = fields.filter((f) => (f.group || 'Outras informações') === g);
          const theme = getGroupTheme(g, layout);
          return `
          <div class="section-group-header" style="--sec-color: ${theme.color}; --sec-bg: ${theme.bg}; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <h2 style="margin: 0;">${icon(getGroupIcon(g))} ${esc(g)}</h2>
              <span class="count-badge">${groupFields.length} campos</span>
            </div>
          </div>
          <div class="detail-grid" style="--sec-color: ${theme.color};">
            ${groupFields
              .map((f) => {
                const val = r[f.id];
                let displayVal = esc(val ?? '—');
                if (f.type === 'date') displayVal = date(val);
                if (f.type === 'currency')
                  displayVal = val !== '' && val != null ? money(val) : '—';

                return `
                <div class="detail-card">
                  <label>${esc(f.name)}</label>
                  <div class="val">${displayVal || '—'}</div>
                </div>
              `;
              })
              .join('')}
          </div>
        `;
        })
        .join('')}

      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:28px; padding-top:18px; border-top:1px solid #e2e8f0; flex-wrap:wrap;">
        <span class="subtitle" style="margin:0;">
          ${
            isFirstObra && isLastObra
              ? 'Única obra nesta lista.'
              : isLastObra
                ? 'Você está na última obra desta lista.'
                : `Próxima na lista: <strong>${esc(nextRecord.nome || 'Registro')}</strong>`
          }
        </span>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <button class="btn" type="button" onclick="closeFullscreenDetail()">Voltar às obras</button>
          ${edit ? `<button class="btn primary" type="button" onclick="closeFullscreenDetail(); openRecordForm('${pid}','${rid}')">${icon('edit')} Editar dados</button>` : ''}
          ${navButtonsHtml}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(detailContainer);
};
openRecordForm = function (pid, rid = '') {
  const p = visible().find((project) => project.id === pid);
  if (!p) return;

  if (!secapEditSession.active || String(secapEditSession.pid) !== String(pid)) {
    resetSecapEditSession();
    secapEditSession.active = true;
    secapEditSession.pid = String(pid);
  }
  secapEditSession.currentRid = String(rid || '');

  const r = (p.records || []).find((record) => record.id === rid);
  const edit = canEdit(p);
  const allowed =
    typeof getAllowedFieldsForCurrentUser === 'function'
      ? getAllowedFieldsForCurrentUser(p.id)
      : isSysAdmin()
        ? null
        : [];
  const canEditAnyField = edit && (allowed === null || allowed.length > 0);
  const layout = projectLayoutView(p);
  const groups = getProjectSections(layout);

  const { list, currentIndex, prevRecord, nextRecord } = r
    ? getProjectRecordNavigation(pid, rid)
    : { list: [], currentIndex: -1, prevRecord: null, nextRecord: null };
  const isLastObra = !nextRecord;

  const fieldMarkup = groups.length
    ? groups
        .map((group) => {
          const fields = layout.fields.filter(
            (field) => (field.group || 'Outras informações') === group
          );
          const theme = getGroupTheme(group, layout);
          return `
          <section class="edit-section-group" style="margin-bottom: 32px;">
            <div class="section-group-header" style="--sec-color: ${theme.color}; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <h2 style="color: ${theme.color}; display: flex; align-items: center; gap: 10px; margin: 0;">
                  ${icon(getGroupIcon(group))} ${esc(group)}
                </h2>
                <span class="count-badge" style="background-color: ${theme.bg}; color: ${theme.color}; border: 1px solid ${theme.color};">${fields.length} campos</span>
              </div>
              <button type="button" class="btn secondary small" onclick="editFields('${pid}', '${esc(group).replace(/'/g, "\\'")}')">
                ${icon('edit')} ${isSysAdmin() ? 'Editar campos da seção' : 'Organizar seção'}
              </button>
            </div>
            <div class="edit-cards-grid">
              ${fields
                .map((field) => {
                  const fieldAllowed =
                    edit && (allowed === null || allowed.includes(String(field.id)));
                  const htmlField = inputField(field, r?.[field.id], !fieldAllowed);
                  return htmlField.replace(
                    'class="field"',
                    `class="field" style="border: 1px solid #e2e8f0 !important; border-top: 3.5px solid ${theme.color} !important;"`
                  );
                })
                .join('')}
            </div>
          </section>`;
        })
        .join('')
    : '<p class="subtitle">Este projeto ainda não possui campos cadastrados.</p>';

  const obraFooterNavButtons = r
    ? renderObraNavButtons(pid, rid, prevRecord, nextRecord, 'edit')
    : '';

  const sessionModifiedCount = secapEditSession.records.size;

  modal(
    r ? 'Editar obra / subprojeto' : 'Cadastrar obra / subprojeto',
    `<div class="record-form-intro" style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
       <div>
         <p class="subtitle" style="margin-bottom:4px;">
           ${esc(p.name)}${r && currentIndex >= 0 ? ` · Obra ${currentIndex + 1} de ${list.length}` : ''}
           ${sessionModifiedCount > 0 ? ` · <strong style="color:#f37021;">${sessionModifiedCount} obra(s) alterada(s) nesta sessão</strong>` : ''}
         </p>
         <p class="metric-note" style="margin:0;">${r && isLastObra ? 'Esta é a última obra da lista.' : 'Preencha os campos organizados por seção.'}</p>
       </div>
       <div style="display:flex; gap:8px;">
         <button class="btn secondary small" type="button" onclick="editFields('${pid}')">
           ${icon('plus')} Configurar seções e campos
         </button>
         <button class="btn secondary small" type="button" onclick="openEditSectionColorsModal('${pid}', '${rid}')">
           ${icon('edit')} Cores das seções
         </button>
       </div>
     </div>
     ${allowed !== null && canEditAnyField ? '<div class="perm-legend" aria-label="Legenda dos campos"><span class="perm-legend-item is-editable"><i></i>Campos que você pode editar</span><span class="perm-legend-item is-readonly"><i></i>Campos somente leitura</span></div>' : ''}
     ${!canEditAnyField ? '<div class="summary-strip"><p><strong>Nenhum campo liberado para edição.</strong> Solicite ao administrador que configure suas permissões para este projeto.</p></div>' : ''}
     <form id="recordForm" onsubmit="event.preventDefault();saveRecord('${pid}','${rid}')" style="padding-top:10px;">
       ${fieldMarkup}
     </form>`,
    `<div style="margin-right: auto; display: flex; gap: 10px; align-items: center;">
       ${edit && r ? btn('Excluir', `deleteRecord('${pid}','${rid}')`, 'trash') : ''}
       ${btn('Cancelar', `handleCancelFromRecordForm('${pid}','${rid}')`, 'arrow')}
     </div>` +
      (canEditAnyField
        ? `<button class="btn primary" form="recordForm" type="submit">${icon('check')} ${r ? 'Salvar alterações' : 'Cadastrar obra'}</button>`
        : '') +
      obraFooterNavButtons
  );
  // Restaura nos campos o que já foi alterado nesta obra caso você tenha ido e voltado entre obras
  if (rid) restoreStagedValuesToForm(rid);
};
// Qualidade e funções analíticas do BI
function projectQuality(p, rs) {
  const issues = [],
    codes = new Map();
  for (const r of rs) {
    const title = recordTitle(r, p),
      key = String(r.codigo || '').trim();
    if (key) {
      if (!codes.has(key)) codes.set(key, []);
      codes.get(key).push(r);
    }
    const add = (level, field, reason, action) =>
      issues.push({ r, title, level, field, reason, action });
    for (const f of p.fields) {
      if (f.required && (r[f.id] == null || String(r[f.id]).trim() === ''))
        add(
          'Completar',
          f.name,
          'Campo obrigatório sem preenchimento.',
          'Preencher o campo na ficha.'
        );
      if (f.type === 'date' && r[f.id]) {
        const d = String(r[f.id]);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < '2000-01-01' || d > '2099-12-31')
          add(
            'Revisar',
            f.name,
            'Valor fora do padrão de data esperado.',
            'Conferir a data e a unidade na origem.'
          );
      }
      if (
        ['number', 'currency'].includes(f.type) &&
        r[f.id] !== '' &&
        r[f.id] != null &&
        !Number.isFinite(Number(r[f.id]))
      )
        add(
          'Revisar',
          f.name,
          'Valor não numérico em campo de número ou moeda.',
          'Revisar o valor informado.'
        );
      if (f.type === 'select' && r[f.id] && !f.options?.includes(r[f.id]))
        add(
          'Revisar',
          f.name,
          'Valor não previsto na lista configurada.',
          'Padronizar a opção ou ajustar o campo.'
        );
    }
    if (p.fields.some((f) => f.id === 'prazo') && !r.prazo && !isFinished(r, p))
      add(
        'Completar',
        'Prazo de encerramento',
        'Registro não concluído sem data de referência.',
        'Definir o prazo ou justificar a ausência.'
      );
    if (r.execucao_origem)
      add(
        'Revisar',
        'Previsão de execução — origem',
        'O conteúdo de origem pode representar uma duração.',
        'Confirmar a unidade e preencher a duração em dias ou o marco de data correto.'
      );
    if (r.atualizado_em && daysLeft(r.atualizado_em) < -30)
      add(
        'Atualizar',
        'Data da última atualização',
        'A data informada é anterior a 30 dias.',
        'Solicitar confirmação do andamento à equipe.'
      );
    if (
      numberOrNull(r.progresso) !== null &&
      (Number(r.progresso) < 0 || Number(r.progresso) > 100)
    )
      add(
        'Revisar',
        'Avanço físico',
        'Percentual fora do intervalo de 0 a 100.',
        'Conferir a medição informada.'
      );
  }
  for (const [code, rows] of codes) {
    if (rows.length > 1)
      rows.forEach((r) =>
        issues.push({
          r,
          title: recordTitle(r, p),
          level: 'Reconciliar',
          field: 'ID de origem',
          reason: `O código ${code} aparece em ${rows.length} registros desta seleção.`,
          action:
            'Comparar as versões e confirmar a chave com a equipe. Nenhuma linha é excluída automaticamente.',
        })
      );
  }
  return issues;
}

function biQuality(p, rs) {
  const issues = projectQuality(p, rs),
    affected = new Set(issues.map((i) => i.r.id)),
    dups = new Set(issues.filter((i) => i.level === 'Reconciliar').map((i) => i.r.codigo));
  return `<div class="stats">${biMetric('REGISTROS ANALISADOS', rs.length, 'Respeita os filtros do projeto', 'file')}${biMetric('REGISTROS COM PENDÊNCIA', affected.size, 'Uma iniciativa pode ter mais de uma pendência', 'alert', '#f37021')}${biMetric('CÓDIGOS REPETIDOS', dups.size, 'Chaves de origem para reconciliar', 'shield', '#c93636')}${biMetric('PONTOS PARA CONFERIR', issues.length, 'Campos obrigatórios, datas e padronização', 'edit', '#169dc4')}</div>
    <div class="summary-strip">${icon('shield')}<p><strong>Conferir antes de consolidar.</strong> Identificadores repetidos precisam ser reconciliados; valores ausentes não são estimados; duração e data têm campos separados. A conferência observa os dados da seleção atual e preserva todos os registros.</p></div>
    <section class="panel">
      <div class="panelhead"><div><h2>O que precisa ser conferido</h2><small>A próxima ação é sempre indicada ao lado da pendência.</small></div></div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Iniciativa</th><th>Tipo</th><th>Campo</th><th>O que foi encontrado</th><th>Como resolver</th></tr></thead>
          <tbody>${issues.map((i) => `<tr><td style="white-space:normal;min-width:200px"><button class="project-link" onclick="editRecord('${p.id}','${i.r.id}')">${esc(i.title)}</button></td><td><span class="badge ${i.level === 'Reconciliar' ? 'red' : 'orange'}">${i.level}</span></td><td style="white-space:normal">${esc(i.field)}</td><td style="white-space:normal;min-width:210px">${esc(i.reason)}</td><td style="white-space:normal;min-width:230px">${esc(i.action)}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      ${issues.length ? '' : empty('Nenhuma pendência detectada pelas regras atuais', 'A validação do conteúdo continua sob responsabilidade da equipe.')}
    </section>
    ${qualityPanel(p, rs)}`;
}

if (!biSections.some((s) => s[0] === 'quality'))
  biSections.splice(biSections.length - 1, 0, ['quality', 'Qualidade', 'shield']);

function biDocuments(p, rs) {
  const fs = p.fields.filter((f) => f.id.startsWith('doc_'));
  if (!fs.length)
    return empty(
      'Sem campos de documentação',
      'O modelo de preparação e contratação inclui as etapas documentais.'
    );
  const pending = (r, f) => !['Concluído', 'Não se aplica'].includes(r[f.id]);
  return `<div class="stats" style="grid-template-columns:repeat(3,1fr)">${biMetric('INICIATIVAS NA ANÁLISE', rs.length, 'Projetos e contratações', 'folder')}${biMetric('COM DOCUMENTO PENDENTE', rs.filter((r) => fs.some((f) => pending(r, f))).length, 'Inclui situações ainda não informadas', 'file', '#f37021')}${biMetric('DOCUMENTAÇÃO INFORMADA', rs.filter((r) => fs.every((f) => !pending(r, f))).length, 'Todos os itens concluídos ou não aplicáveis', 'check', '#268c48')}</div>
    <div class="summary-strip">${icon('file')}<p><strong>Qual documento está impedindo o avanço?</strong> A matriz organiza as etapas documentais por iniciativa. A validação da documentação e dos requisitos de contratação cabe à equipe responsável.</p></div>
    <section class="panel">
      <div class="panelhead"><h2>Matriz de preparação para contratação</h2></div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Iniciativa</th>${fs.map((f) => `<th>${esc(f.name)}</th>`).join('')}<th>Responsável</th></tr></thead>
          <tbody>${rs.map((r) => `<tr><td><button class="project-link" onclick="editRecord('${p.id}','${r.id}')">${esc(recordTitle(r, p))}</button></td>${fs.map((f) => `<td><span class="badge ${r[f.id] === 'Concluído' ? 'green' : r[f.id] === 'Não se aplica' ? 'gray' : 'orange'}">${esc(r[f.id] || 'Não informado')}</span></td>`).join('')}<td>${esc(r.responsavel || 'Definir responsável')}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      ${rs.length ? '' : empty('Nenhum registro cadastrado', 'Cadastre a iniciativa e informe a situação dos documentos.')}
    </section>
    <div class="chart-grid" style="margin-top:23px">${fs.map((f) => chartPanel(esc(f.name), 'Situação informada pela equipe', groupsChart(p, rs, f))).join('')}</div>`;
}

function biTerritory(p, rs) {
  const region = p.fields.find((f) => f.id === 'regiao'),
    district = p.fields.find((f) => f.id === 'bairro');
  return `<div class="summary-strip">${icon('folder')}<p><strong>Onde estão as entregas?</strong> Organize a carteira por região e bairro e confira os investimentos associados. Este painel usa as localidades cadastradas; nenhuma coordenada ou localização é estimada.</p></div>
    <div class="chart-grid">${chartPanel('Carteira por região', 'Quantidade de iniciativas', groupsChart(p, rs, region))}${chartPanel('Investimento por região', 'Valores previstos da carteira', groupsChart(p, rs, region, 'money'))}</div>
    ${chartPanel('Detalhamento territorial', 'Clique na iniciativa para conferir a ficha', `<div class="tablewrap"><table><thead><tr><th>Iniciativa</th><th>Órgão</th><th>Região</th><th>Bairro</th><th>Prioridade</th><th>Previsto</th></tr></thead><tbody>${rs.map((r) => `<tr><td style="white-space:normal;min-width:220px"><button class="project-link" onclick="editRecord('${p.id}','${r.id}')">${esc(recordTitle(r, p))}</button></td><td>${esc(r.orgao || '—')}</td><td>${esc(r[region?.id] || 'Não informado')}</td><td>${esc(r[district?.id] || 'Não informado')}</td><td>${esc(r.prioridade || 'Não informada')}</td><td>${numberOrNull(r.valor) === null ? '—' : compact(r.valor)}</td></tr>`).join('')}</tbody></table></div>`)}
    <p class="metric-note" style="margin-top:18px">A abrangência territorial não permite inferir população atendida. Esse indicador exige fonte e metodologia próprias.</p>`;
}

function directTotal(rs, key) {
  const vs = rs.map((r) => numberOrNull(r[key])).filter((n) => n !== null);
  return vs.length ? vs.reduce((a, b) => a + b, 0) : null;
}

function biFunding(p, rs) {
  const pleit = directTotal(rs, 'pleiteado'),
    approved = directTotal(rs, 'aprovado'),
    released = directTotal(rs, 'liberado'),
    counter = directTotal(rs, 'contrapartida');
  return `<div class="stats">${biMetric('VALOR PLEITEADO', semanticMoney(pleit), 'Propostas apresentadas', 'money')}${biMetric('VALOR APROVADO', semanticMoney(approved), 'Decisões de aprovação informadas', 'check', '#268c48')}${biMetric('VALOR LIBERADO', semanticMoney(released), 'Recursos efetivamente liberados', 'money', '#169dc4')}${biMetric('CONTRAPARTIDA MUNICIPAL', semanticMoney(counter), 'Compromisso informado do Município', 'money', '#f37021')}</div>
    <div class="summary-strip">${icon('money')}<p><strong>Da proposta à liberação.</strong> Acompanhe cada medida separadamente. A diferença entre pleiteado, aprovado e liberado depende da correspondência e do preenchimento de cada iniciativa; valores em branco não representam zero.</p></div>
    <div class="chart-grid">${chartPanel(
      'Jornada de captação',
      'Etapa atual de cada iniciativa',
      groupsChart(
        p,
        rs,
        p.fields.find((f) => f.id === 'etapa_captacao')
      )
    )}${chartPanel(
      'Instituições financiadoras',
      'Iniciativas por instituição',
      groupsChart(
        p,
        rs,
        p.fields.find((f) => f.id === 'financiadora')
      )
    )}</div>
    ${chartPanel('Painel das iniciativas de captação', 'Responsáveis, programas e valores na mesma leitura', `<div class="tablewrap"><table><thead><tr><th>Iniciativa</th><th>Fonte / programa</th><th>Etapa</th><th>Pleiteado</th><th>Aprovado</th><th>Liberado</th><th>Próxima ação</th></tr></thead><tbody>${rs.map((r) => `<tr><td><button class="project-link" onclick="editRecord('${p.id}','${r.id}')">${esc(recordTitle(r, p))}</button></td><td>${esc(r.fonte || '—')}<div class="desc">${esc(r.programa || '')}</div></td><td>${esc(r.etapa_captacao || 'Não informada')}</td>${['pleiteado', 'aprovado', 'liberado'].map((k) => `<td>${numberOrNull(r[k]) === null ? '—' : money(r[k])}</td>`).join('')}<td style="white-space:normal;min-width:220px">${esc(r.proxima || 'Definir providência')}<div class="desc">${esc(r.responsavel || 'Sem responsável')}</div></td></tr>`).join('')}</tbody></table></div>`)}`;
}

const biFinanceBase = biFinance;
biFinance = function (p, rs) {
  let html = biFinanceBase(p, rs);
  const years = p.fields.filter((f) => /^total_\d{4}$/.test(f.id));
  if (years.length)
    html += `<section class="panel" style="margin-top:23px"><div class="panelhead"><div><h2>Programação financeira por exercício</h2><small>Subtotais anuais informados · visão de planejamento</small></div></div><div class="tablewrap annual-table"><table><thead><tr><th>Iniciativa</th>${years.map((f) => `<th>${f.id.slice(6)}</th>`).join('')}</tr></thead><tbody>${rs.map((r) => `<tr><td><button class="project-link" onclick="editRecord('${p.id}','${r.id}')">${esc(recordTitle(r, p))}</button></td>${years.map((f) => `<td>${numberOrNull(r[f.id]) === null ? '—' : money(r[f.id])}</td>`).join('')}</tr>`).join('')}<tr><td><strong>Subtotal por exercício</strong></td>${years.map((f) => `<td><strong>${semanticMoney(directTotal(rs, f.id))}</strong></td>`).join('')}</tr></tbody></table></div><div class="insight-footer">A programação anual já compõe os valores do projeto. Não deve ser adicionada novamente aos totais. Não representa uma série histórica de execução.</div></section>`;
  const extras = p.fields.filter((f) => ['contratado', 'pago'].includes(f.id));
  if (extras.length)
    html += `<div class="stats" style="margin-top:23px;grid-template-columns:repeat(2,1fr)">${extras.map((f) => biMetric(f.name.toUpperCase(), semanticMoney(directTotal(rs, f.id)), 'Medida informada separadamente', 'money')).join('')}</div>`;
  return html;
};
// Abre o modal para o usuário escolher as cores de cada seção do projeto
function openEditSectionColorsModal(pid, rid = '') {
  const p = personalProjectLayout(pid);
  if (!p) return;

  const groups = getProjectSections(p);

  const colorRows = groups
    .map((group) => {
      const currentTheme = getGroupTheme(group, p);
      // Substituímos espaços e caracteres especiais no nome do input para evitar erros no formulário
      const safeKey = group.replace(/[^a-zA-Z0-9]/g, '_');
      return `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <span style="font-weight: 600; color: #003856; font-size: 13px;">${esc(group)}</span>
        <div style="display: flex; align-items: center; gap: 10px;">
          <input type="color" data-group-name="${esc(group)}" name="color_${safeKey}" value="${currentTheme.color}" style="width: 45px; height: 32px; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; background: transparent;">
          <span style="font-size: 11px; color: #64748b;">Escolher cor</span>
        </div>
      </div>
    `;
    })
    .join('');

  const back = rid ? `openRecordForm('${pid}','${rid}')` : `editFields('${pid}')`;
  modal(
    'Editar cores das seções',
    `<form id="sectionColorsForm" onsubmit="event.preventDefault(); saveSectionColors('${pid}', '${rid}');">
       <p class="subtitle">Personalize a cor de cada seção. A escolha vale só para você.</p>
       <div style="margin-top: 18px;">
         ${colorRows}
       </div>
     </form>`,
    btn('Voltar', back, 'arrow') +
      `<button class="btn primary" form="sectionColorsForm" type="submit">${icon('check')} Salvar cores</button>`
  );
}

// As cores ficam na configuração pessoal do usuário; o projeto compartilhado não muda.
function saveSectionColors(pid, rid = '') {
  const p = personalProjectLayout(pid);
  const form = document.getElementById('sectionColorsForm');
  if (!p || !form) {
    notify('Não foi possível localizar o projeto ou o formulário de cores.', 'error');
    return;
  }

  form.querySelectorAll('input[type="color"][data-group-name]').forEach((input) => {
    const groupName = input.getAttribute('data-group-name');
    if (groupName) p.groupColors[groupName] = input.value;
  });
  if (!savePersonalLayout(p)) return;

  if (rid) openRecordForm(pid, rid);
  else {
    editFields(pid);
    render();
  }
  notify('Cores das seções salvas.');
}
/* ============================================================================
   GERENCIAMENTO DE SEÇÕES E CAMPOS POR SEÇÃO COM DRAG-AND-DROP ENTRE SEÇÕES
   ============================================================================ */

/* Configuração pessoal de seções e campos: cada usuário organiza as seções
   (ordem, nome e cor) e a posição dos campos só para si. A estrutura do projeto
   (criar, editar e excluir campos) continua com o administrador e vale para todos. */
function personalLayoutKey(pid) {
  const userKey = (window.SECAP_EMAIL || me()?.email || session || 'guest').toLowerCase();
  return `secap_layout_${userKey}_${pid}`;
}

function readPersonalLayout(pid) {
  try {
    const saved = JSON.parse(localStorage.getItem(personalLayoutKey(pid)) || 'null');
    return saved && Array.isArray(saved.fields) ? saved : null;
  } catch (e) {
    return null;
  }
}

// Cópia do projeto com a organização do usuário atual. Os campos são cópias:
// mover ou renomear seções aqui nunca altera o projeto compartilhado.
// Campos criados depois da configuração entram no fim, na seção padrão deles.
function projectLayoutView(p) {
  if (!p) return p;
  const layout = readPersonalLayout(p.id);
  const saved = layout ? layout.fields : [];
  const position = new Map(saved.map((x, i) => [x.id, i]));
  const groupOf = new Map(saved.map((x) => [x.id, x.group]));
  const fields = (p.fields || [])
    .map((f, i) => ({ f, i, at: position.has(f.id) ? position.get(f.id) : Infinity }))
    .sort((a, b) => (a.at === b.at ? a.i - b.i : a.at < b.at ? -1 : 1))
    // Campo sem seção (importado por link ou arquivo) entra na seção automática pelo nome/tipo.
    .map(({ f }) => {
      const saved = groupOf.get(f.id);
      const auto = f.group || autoFieldGroup(f);
      return { ...f, group: saved && !(saved === 'Outras informações' && !f.group) ? saved : auto };
    });
  return {
    ...p,
    fields,
    groupOrder: layout?.groupOrder || p.groupOrder,
    groupColors: { ...(p.groupColors || {}), ...(layout?.groupColors || {}) },
  };
}

function personalProjectLayout(pid) {
  const list = typeof visible === 'function' ? visible() : db.projects;
  return projectLayoutView(list.find((x) => String(x.id) === String(pid)));
}

function savePersonalLayout(view) {
  try {
    localStorage.setItem(
      personalLayoutKey(view.id),
      JSON.stringify({
        fields: view.fields.map((f) => ({ id: f.id, group: f.group || 'Outras informações' })),
        groupOrder: getProjectSections(view),
        groupColors: view.groupColors || {},
      })
    );
    return true;
  } catch (e) {
    notify('Não foi possível salvar sua configuração neste navegador.', 'error');
    return false;
  }
}

function resetPersonalLayout(pid) {
  try {
    localStorage.removeItem(personalLayoutKey(pid));
  } catch (e) {}
  editFields(pid);
  render();
  notify('Organização padrão do projeto restaurada.');
}

function getProjectSections(p) {
  const fields = p?.fields || [];
  const rawGroups = [...new Set(fields.map((f) => f.group || 'Outras informações'))];
  const savedOrder = Array.isArray(p?.groupOrder) ? p.groupOrder : [];

  return rawGroups.sort((a, b) => {
    const idxA = savedOrder.indexOf(a);
    const idxB = savedOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    const standard = ['Essenciais', 'Localização', 'Documentação', 'Prazos e marcos', 'Financeiro', 'Recursos e instrumentos', 'Acompanhamento', 'Outras informações'];
    const stdA = standard.indexOf(a), stdB = standard.indexOf(b);
    if (stdA !== -1 && stdB !== -1) return stdA - stdB;
    if (a === 'Essenciais') return -1;
    if (b === 'Essenciais') return 1;
    return a.localeCompare(b, 'pt-BR');
  });
}

const PROTECTED_SYSTEM_FIELDS = new Set([
  'nome',
  'status',
  'etapa',
  'valor',
  'executado',
  'prazo',
  'progresso',
  'responsavel',
  'orgao',
  'proxima',
]);

let secapDragState = {
  type: '', // 'section' | 'field'
  id: '', // nome da seção ou id do campo
  section: '',
};

function clearSecapDragHighlights() {
  document.querySelectorAll('[data-sec-card]').forEach((c) => {
    c.style.boxShadow = '';
    c.style.outline = '';
  });
  document.querySelectorAll('[data-field-row]').forEach((r) => {
    r.style.borderTop = '';
  });
}

// --- DRAG AND DROP DE SEÇÕES ---
function secapSectionDragStart(e, sectionName) {
  secapDragState = { type: 'section', id: sectionName, section: sectionName };
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', 'section:' + sectionName);
  const card = e.currentTarget;
  setTimeout(() => {
    card.style.opacity = '0.5';
  }, 0);
}

function secapSectionDragEnd(el) {
  secapDragState = { type: '', id: '', section: '' };
  el.style.opacity = '1';
  clearSecapDragHighlights();
}

function secapSectionDragOver(e, targetSection) {
  if (!secapDragState.type) return;

  // Caso 1: Reordenando uma seção inteira
  if (secapDragState.type === 'section') {
    if (secapDragState.id === targetSection) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.style.boxShadow = '0 -3px 0 0 #f37021';
    return;
  }

  // Caso 2: Arrastando um campo para dentro desta seção (mesmo que de outra seção)
  if (secapDragState.type === 'field' && secapDragState.section !== targetSection) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.style.outline = '2px dashed #f37021';
  }
}

function secapSectionDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.style.boxShadow = '';
    e.currentTarget.style.outline = '';
  }
}

function secapSectionDrop(e, pid, targetSection) {
  e.preventDefault();
  clearSecapDragHighlights();

  const p = personalProjectLayout(pid);
  if (!p) return;

  // Soltou uma SEÇÃO sobre outra seção
  if (secapDragState.type === 'section') {
    if (!secapDragState.id || secapDragState.id === targetSection) return;
    const sections = getProjectSections(p);
    const fromIdx = sections.indexOf(secapDragState.id);
    const toIdx = sections.indexOf(targetSection);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = sections.splice(fromIdx, 1);
    sections.splice(toIdx, 0, moved);
    p.groupOrder = sections;

    if (!savePersonalLayout(p)) return;
    editFields(pid, moved);
    render();
    notify('Ordem das seções atualizada.');
    return;
  }

  // Soltou um CAMPO diretamente na área da seção de destino (vai para o final dela)
  if (secapDragState.type === 'field' && secapDragState.id) {
    const fieldIdx = p.fields.findIndex((f) => f.id === secapDragState.id);
    if (fieldIdx < 0) return;

    const [movedField] = p.fields.splice(fieldIdx, 1);
    const oldSection = movedField.group || 'Outras informações';
    movedField.group = targetSection;
    p.fields.push(movedField);

    if (oldSection === targetSection) return;
    if (!savePersonalLayout(p)) return;
    editFields(pid, targetSection);
    render();
    notify(`Campo "${movedField.name}" movido para "${targetSection}".`);
  }
}

// --- DRAG AND DROP DE CAMPOS (MESMA SEÇÃO OU ENTRE SEÇÕES) ---
function secapFieldDragStart(e, fid, sectionName) {
  e.stopPropagation();
  secapDragState = { type: 'field', id: fid, section: sectionName };
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', 'field:' + fid);
  const row = e.currentTarget;
  setTimeout(() => {
    row.style.opacity = '0.45';
  }, 0);
}

function secapFieldDragEnd(e, el) {
  e.stopPropagation();
  secapDragState = { type: '', id: '', section: '' };
  el.style.opacity = '1';
  clearSecapDragHighlights();
}

function secapFieldDragOver(e, targetFid, targetSection) {
  if (secapDragState.type !== 'field' || secapDragState.id === targetFid) return;
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.style.borderTop = '2.5px solid #f37021';

  const parentCard = e.currentTarget.closest('[data-sec-card]');
  if (parentCard && secapDragState.section !== targetSection) {
    parentCard.style.outline = '2px dashed #f37021';
  }
}

function secapFieldDragLeave(e) {
  e.stopPropagation();
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.style.borderTop = '';
  }
}

function secapFieldDrop(e, pid, targetFid, targetSection) {
  e.preventDefault();
  e.stopPropagation();
  clearSecapDragHighlights();

  if (secapDragState.type !== 'field' || !secapDragState.id || secapDragState.id === targetFid) {
    return;
  }

  const p = personalProjectLayout(pid);
  if (!p) return;

  const fromIdx = p.fields.findIndex((f) => f.id === secapDragState.id);
  if (fromIdx < 0) return;

  const [movedField] = p.fields.splice(fromIdx, 1);
  const oldSection = movedField.group || 'Outras informações';
  movedField.group = targetSection;

  const toIdx = p.fields.findIndex((f) => f.id === targetFid);
  if (toIdx < 0) {
    p.fields.push(movedField);
  } else {
    p.fields.splice(toIdx, 0, movedField);
  }

  if (!savePersonalLayout(p)) return;
  if (oldSection !== targetSection) {
    notify(`Campo "${movedField.name}" movido para "${targetSection}".`);
  } else {
    notify('Ordem dos campos atualizada.');
  }

  editFields(pid, targetSection);
  render();
}

// --- MODAL PRINCIPAL DE GERENCIAMENTO ---
editFields = function (pid, focusSection = '') {
  // Qualquer usuário organiza seções e campos para si (configuração pessoal).
  // Criar, editar e excluir campos muda o projeto de todos: só o administrador.
  const admin = isSysAdmin();
  const p = personalProjectLayout(pid);
  if (!p) return;

  const sections = getProjectSections(p);

  const sectionsHtml = sections
    .map((secName) => {
      const secFields = p.fields.filter((f) => (f.group || 'Outras informações') === secName);
      const theme = getGroupTheme(secName, p);
      const isFocused = focusSection === secName;
      const escapedSec = esc(
        String(secName).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/[\r\n\u2028\u2029]/g, ' ')
      );

      return `
      <div class="panel"
           data-sec-card="${esc(secName)}"
           draggable="true"
           ondragstart="secapSectionDragStart(event, '${escapedSec}')"
           ondragend="secapSectionDragEnd(this)"
           ondragover="secapSectionDragOver(event, '${escapedSec}')"
           ondragleave="secapSectionDragLeave(event)"
           ondrop="secapSectionDrop(event, '${pid}', '${escapedSec}')"
           style="margin-bottom: 14px; border: 1px solid ${isFocused ? theme.color : '#e2e8f0'}; border-left: 4px solid ${theme.color}; transition: box-shadow 0.15s ease, outline 0.15s ease;">
        <div class="panelhead" style="background: ${theme.bg}; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; cursor: grab;">
          <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
            <span title="Arraste para reordenar a seção" style="color: #64748b; font-weight: 700; letter-spacing: -1px; user-select: none; cursor: grab; padding-right: 2px;">⋮⋮</span>
            <span style="color: ${theme.color}; display: inline-flex; flex-shrink: 0;">${icon(getGroupIcon(secName))}</span>
            <strong style="color: #0f172a; font-size: 14px;">${esc(secName)}</strong>
            <span class="badge" style="font-size: 11px;">${secFields.length}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <button type="button" class="iconbtn" title="Renomear seção" onclick="renameProjectSectionPrompt('${pid}', '${escapedSec}')">${icon('edit')}</button>
            ${
              admin
                ? `<button type="button" class="btn secondary small" style="margin-left: 4px;" onclick="fieldForm('${pid}', '', '${escapedSec}')">
              ${icon('plus')} Campo
            </button>`
                : ''
            }
          </div>
        </div>
        <div style="padding: 4px 12px; min-height: 28px;">
          ${
            secFields.length
              ? secFields
                  .map((f) => {
                    const isProtected = PROTECTED_SYSTEM_FIELDS.has(f.id);
                    return `
                    <div data-field-row="${esc(f.id)}"
                         draggable="true"
                         ondragstart="secapFieldDragStart(event, '${f.id}', '${escapedSec}')"
                         ondragend="secapFieldDragEnd(event, this)"
                         ondragover="secapFieldDragOver(event, '${f.id}', '${escapedSec}')"
                         ondragleave="secapFieldDragLeave(event)"
                         ondrop="secapFieldDrop(event, '${pid}', '${f.id}', '${escapedSec}')"
                         style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; background: #fff; text-align: left;">
                      <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; text-align: left;">
                        <span title="Arraste para reordenar ou mover para outra seção" style="color: #94a3b8; font-weight: 700; letter-spacing: -1px; user-select: none; cursor: grab; flex-shrink: 0;">⋮⋮</span>
                        <div style="min-width: 0; text-align: left;">
                          <div style="font-weight: 600; color: #0f172a; font-size: 13.5px; line-height: 1.3;">${esc(f.name)}</div>
                          <small style="color: #64748b; display: block; font-size: 11.5px; line-height: 1.3;">
                            ${typeNames[f.type] || f.type}${f.required ? ' · <strong style="color:#c93636">Obrigatório</strong>' : ''}${f.type === 'date' ? ' · Calendário' : ''}${isProtected ? ' · Padrão' : ''}
                          </small>
                        </div>
                      </div>
                      <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                        <button type="button" class="iconbtn" title="${admin ? 'Editar campo ou trocar de seção' : 'Trocar o campo de seção'}" aria-label="${admin ? 'Editar campo' : 'Trocar o campo de seção'}" onclick="fieldForm('${pid}', '${f.id}')">${icon('edit')}</button>
                        ${
                          admin && !isProtected
                            ? `<button type="button" class="iconbtn" title="Excluir campo" aria-label="Excluir campo" onclick="removeField('${pid}', '${f.id}')">${icon('trash')}</button>`
                            : ''
                        }
                      </div>
                    </div>`;
                  })
                  .join('')
              : `<p class="subtitle" style="padding: 8px 0; margin: 0; font-size: 12px;">${admin ? 'Arraste um campo para cá ou clique em "+ Campo".' : 'Arraste um campo para cá.'}</p>`
          }
        </div>
      </div>`;
    })
    .join('');

  modal(
    'Personalizar seções e campos',
    `<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap;">
      <div style="text-align: left;">
        <p class="subtitle" style="margin: 0;"><strong>${esc(p.name)}</strong></p>
        <small style="color: #64748b;">Arraste pela alça <strong>⋮⋮</strong> para reordenar seções ou mover campos entre elas.</small>
        <small style="display: block; color: #64748b;">Esta organização é só sua: a de outros usuários não muda.</small>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        ${readPersonalLayout(pid) ? `<button type="button" class="btn secondary small" onclick="resetPersonalLayout('${pid}')">${icon('arrow')} Restaurar padrão</button>` : ''}
        <button type="button" class="btn secondary small" onclick="createProjectSectionPrompt('${pid}')">${icon('plus')} Nova seção</button>
        <button type="button" class="btn secondary small" onclick="openEditSectionColorsModal('${pid}')">${icon('edit')} Cores</button>
      </div>
    </div>
    <div style="max-height: 62vh; overflow-y: auto; padding-right: 4px;">
      ${sectionsHtml}
    </div>`,
    (admin ? btn('Adicionar campo', `fieldForm('${pid}')`, 'plus', 'primary') : '') +
      btn('Concluir', 'closeModal(); render()', 'check')
  );
};

function createProjectSectionPrompt(pid) {
  const p = personalProjectLayout(pid);
  if (!p) return;
  if (!p.fields.length)
    return notify('Este projeto ainda não possui campos para organizar.', 'error');

  modal(
    'Nova seção',
    `<form id="newSectionForm" onsubmit="event.preventDefault(); saveNewProjectSection('${pid}')">
      <div class="field">
        <label>Nome da nova seção *</label>
        <input name="sectionName" required maxlength="60" placeholder="Ex.: Licenciamento Ambiental, Fiscalização, Medições">
      </div>
      <div class="field">
        <label>Cor de identificação da seção</label>
        <input name="sectionColor" type="color" value="#003856" style="height: 40px;">
      </div>
      <div class="field">
        <label>Primeiro campo da seção *</label>
        <select name="firstField" required>
          ${p.fields
            .map(
              (f) =>
                `<option value="${esc(f.id)}">${esc(f.name)} (${esc(f.group || 'Outras informações')})</option>`
            )
            .join('')}
        </select>
        <small>Uma seção precisa de pelo menos um campo. Depois, arraste outros campos para ela.</small>
      </div>
      <p class="metric-note" style="margin: 0;">A nova seção aparece só para você.</p>
    </form>`,
    btn('Voltar', `editFields('${pid}')`, 'arrow') +
      `<button class="btn primary" type="submit" form="newSectionForm">${icon('check')} Criar seção</button>`
  );
}

function saveNewProjectSection(pid) {
  const p = personalProjectLayout(pid);
  if (!p) return;

  const data = new FormData($('#newSectionForm'));
  const sectionName = String(data.get('sectionName') || '').trim();
  const sectionColor = String(data.get('sectionColor') || '#003856');
  const field = p.fields.find((f) => f.id === String(data.get('firstField') || ''));

  if (!sectionName || !field) return;

  const existingSections = getProjectSections(p);
  if (existingSections.some((s) => s.toLowerCase() === sectionName.toLowerCase())) {
    return notify('Já existe uma seção com este nome neste projeto.', 'error');
  }

  field.group = sectionName;
  p.groupOrder = [...existingSections, sectionName];
  p.groupColors[sectionName] = sectionColor;

  if (!savePersonalLayout(p)) return;
  editFields(pid, sectionName);
  render();
  notify(`Seção "${sectionName}" criada.`);
}

function renameProjectSectionPrompt(pid, oldName) {
  const p = personalProjectLayout(pid);
  if (!p) return;

  modal(
    'Renomear seção',
    `<form id="renameSectionForm" onsubmit="event.preventDefault(); saveRenameProjectSection('${pid}', '${esc(oldName).replace(/'/g, "\\'")}')">
      <div class="field">
        <label>Novo nome da seção *</label>
        <input name="newName" required maxlength="60" value="${esc(oldName)}">
        <small>Os campos desta seção passam para o novo nome. A mudança vale só para você.</small>
      </div>
    </form>`,
    btn('Voltar', `editFields('${pid}')`, 'arrow') +
      `<button class="btn primary" type="submit" form="renameSectionForm">${icon('check')} Salvar nome</button>`
  );
}

function saveRenameProjectSection(pid, oldName) {
  const p = personalProjectLayout(pid);
  if (!p) return;

  const newName = String(new FormData($('#renameSectionForm')).get('newName') || '').trim();
  if (!newName) return;
  if (newName === oldName) return editFields(pid, oldName);

  const sections = getProjectSections(p);
  if (sections.some((s) => s.toLowerCase() === newName.toLowerCase())) {
    return notify('Já existe uma seção com esse nome.', 'error');
  }

  // Mantém a cor que a seção já tinha (inclusive a cor padrão pelo nome).
  const color = getGroupTheme(oldName, p).color;
  p.fields.forEach((f) => {
    if ((f.group || 'Outras informações') === oldName) f.group = newName;
  });
  p.groupOrder = sections.map((g) => (g === oldName ? newName : g));
  delete p.groupColors[oldName];
  p.groupColors[newName] = color;

  if (!savePersonalLayout(p)) return;
  editFields(pid, newName);
  render();
  notify('Seção renomeada.');
}

fieldForm = function (pid, fid = '', defaultSection = 'Essenciais') {
  const admin = isSysAdmin();
  const p = personalProjectLayout(pid);
  if (!p) return;
  const f = p.fields.find((x) => x.id === fid);
  if (!admin && !f) {
    notify('Apenas administradores podem criar campos no projeto.', 'error');
    return;
  }
  const sections = getProjectSections(p);
  const currentGroup = f?.group || defaultSection || sections[0] || 'Essenciais';

  const sectionSelect = `
      <div class="field">
        <label>Seção (aba/bloco da obra) *</label>
        <select name="group" required>
          ${sections
            .map(
              (sec) =>
                `<option value="${esc(sec)}" ${currentGroup === sec ? 'selected' : ''}>${esc(sec)}</option>`
            )
            .join('')}
        </select>
        <small>Define em qual bloco da ficha da obra este campo aparece para você.</small>
      </div>`;

  const schemaFields = `
      <div class="field">
        <label>Nome do campo *</label>
        <input required name="name" value="${esc(f?.name || '')}" placeholder="Ex.: Região, vistoria ou valor do convênio">
      </div>
      <div class="field">
        <label>Tipo de informação</label>
        <select name="type" ${f ? 'disabled' : ''} onchange="$('#optionsArea').style.display=this.value==='select'?'block':'none'">
          ${Object.entries(typeNames)
            .map(
              ([k, v]) => `<option value="${k}" ${f?.type === k ? 'selected' : ''}>${v}</option>`
            )
            .join('')}
        </select>
      </div>
      <div class="field" id="optionsArea" style="display:${f?.type === 'select' ? 'block' : 'none'}">
        <label>Opções da lista (separadas por vírgula)</label>
        <textarea name="options" rows="3" placeholder="Planejamento, Execução, Concluído">${esc(f?.options?.join(', ') || '')}</textarea>
        <small>As listas ficam disponíveis para agrupar o Kanban automaticamente.</small>
      </div>
      <div class="field">
        <label>Ajuda para quem preenche</label>
        <input name="help" value="${esc(f?.help || '')}" placeholder="Explique de forma simples o que informar aqui.">
      </div>
      <label style="display:flex; align-items:center; gap:8px; margin-top:10px;">
        <input name="required" type="checkbox" ${f?.required ? 'checked' : ''}> Preenchimento obrigatório
      </label>`;

  modal(
    f ? (admin ? 'Editar campo' : 'Trocar campo de seção') : 'Adicionar campo',
    `<form id="fieldForm" onsubmit="event.preventDefault(); saveField('${pid}', '${fid}')">
      ${admin ? '' : `<p class="subtitle">Campo: <strong>${esc(f.name)}</strong></p>`}
      ${sectionSelect}
      ${admin ? schemaFields : ''}
    </form>`,
    btn('Voltar', `editFields('${pid}', '${esc(currentGroup).replace(/'/g, "\\'")}')`, 'arrow') +
      `<button class="btn primary" type="submit" form="fieldForm">${icon('check')} Salvar campo</button>`
  );
};

saveField = function (pid, fid) {
  const admin = isSysAdmin();
  const shared = db.projects.find((x) => x.id === pid);
  const view = personalProjectLayout(pid);
  if (!shared || !view) return;

  const data = new FormData($('#fieldForm'));
  const mine = view.fields.find((x) => x.id === fid);
  const group = String(data.get('group') || mine?.group || 'Essenciais').trim();

  // Usuário comum: só muda a seção do campo na própria configuração.
  if (!admin) {
    if (!mine) return;
    mine.group = group;
    if (!savePersonalLayout(view)) return;
    editFields(pid, group);
    render();
    notify(`Campo "${mine.name}" agora aparece em "${group}".`);
    return;
  }
  if (!canEdit(shared)) return;

  const old = shared.fields.find((x) => x.id === fid);
  const type = old?.type || data.get('type');
  const options = [
    ...new Set(
      String(data.get('options') || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
    ),
  ];

  if (type === 'select' && !options.length) {
    return notify('Adicione pelo menos uma opção à lista.', 'error');
  }

  const f = {
    id: fid || 'f_' + uid(),
    name: String(data.get('name') || '').trim(),
    type,
    group,
    options: type === 'select' ? options : undefined,
    help: String(data.get('help') || '').trim(),
    required: data.has('required'),
  };

  if (!f.name) return;

  // Campo novo entra na seção escolhida para todos; em campo existente,
  // a troca de seção vale só na configuração pessoal do administrador.
  const before = old ? old.name : '';
  if (old) Object.assign(old, { ...f, group: old.group });
  else shared.fields.push(f);

  persist('Personalizou campo', shared, before, f.name);

  const adminView = projectLayoutView(shared);
  const placed = adminView.fields.find((x) => x.id === f.id);
  if (placed && placed.group !== group) {
    placed.group = group;
    savePersonalLayout(adminView);
  }

  editFields(pid, group);
  render();
  notify('Campo salvo e conectado às obras.');
};

render();
