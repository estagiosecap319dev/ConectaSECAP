/* SECAP revision: project-specific BI, reference administration and navigation. */
let pipelineDisplayField = '',
  biProject = '',
  biSection = 'overview',
  biDimension = '',
  biFilter = '',
  adminSection = 'system',
  adminStatus = '',
  adminRole = '',
  adminType = '',
  adminPerson = '',
  adminDepartment = '',
  adminSearch = '',
  routeTrail = [];
const biTemplates = {
  obras: {
    name: 'Obras e projetos',
    short: 'Gestão estratégica',
    description: 'Etapas, entregas, prioridades e execução da carteira.',
    icon: 'folder',
  },
  fisicofin: {
    name: 'Físico-financeiro',
    short: 'Execução e investimento',
    description: 'Avanço físico, aplicação dos recursos e saldo previsto.',
    icon: 'chart',
  },
  recursos: {
    name: 'Captação de recursos',
    short: 'Recursos e oportunidades',
    description: 'Fontes, valores captados e andamento das iniciativas.',
    icon: 'money',
  },
  termos: {
    name: 'Termos de compromisso',
    short: 'Compromissos e vigências',
    description: 'Instrumentos, parceiros, contrapartidas e prazos.',
    icon: 'file',
  },
  auto: {
    name: 'Análise personalizada',
    short: 'Campos do projeto',
    description: 'Indicadores e distribuições a partir dos campos cadastrados.',
    icon: 'dashboard',
  },
};
const semanticDefaults = {
  status: 'status',
  stage: 'etapa',
  budget: 'valor',
  spent: 'executado',
  deadline: 'prazo',
  progress: 'progresso',
  owner: 'responsavel',
  agency: 'orgao',
  priority: 'prioridade',
  raised: 'captado',
  source: 'fonte',
};
const palette = ['#003856', '#169dc4', '#f37021', '#268c48', '#97b0bf', '#b4a0c6', '#d2ae61'];
if (!db.portalSettings)
  db.portalSettings = {
    title: 'Portal de Projetos e Obras',
    department: 'Secretaria Municipal de Articulação Institucional e Captação',
    internalAssistant: true,
  };
if (!db.requests) db.requests = [];
persist();
function routeSnapshot() {
  return {
    tab,
    projectId,
    biProject,
    biSection,
    biDimension,
    biFilter,
    adminSection,
    query,
    filterProject,
    filterStatus,
  };
}
function restoreRoute(r) {
  tab = r.tab;
  projectId = r.projectId || '';
  biProject = r.biProject || '';
  biSection = r.biSection || 'overview';
  biDimension = r.biDimension || '';
  biFilter = r.biFilter || '';
  adminSection = r.adminSection || 'system';
  query = r.query || '';
  filterProject = r.filterProject || '';
  filterStatus = r.filterStatus || '';
  render();
  window.scrollTo(0, 0);
}
const goOriginal = go;
go = function (t, id = '') {
  routeTrail.push(routeSnapshot());
  if (routeTrail.length > 40) routeTrail.shift();
  if (t === 'bi') {
    biProject = '';
    biSection = 'overview';
    biFilter = '';
    biDimension = '';
  }
  goOriginal(t, id);
};
function goBack() {
  if ($('#modal').innerHTML) {
    closeModal();
    return;
  }
  const r = routeTrail.pop();
  if (r) restoreRoute(r);
  else goOriginal('dashboard');
}
function backLink(label = 'Voltar') {
  return `<button class="backlink" onclick="goBack()">${icon('arrow')}${label}</button>`;
}
function openBI(id) {
  if (!visible().some((p) => p.id === id)) return;
  routeTrail.push(routeSnapshot());
  tab = 'bi';
  projectId = '';
  biProject = id;
  biSection = 'overview';
  biFilter = '';
  biDimension = '';
  pipelineDisplayField = '';
  query = '';
  filterStatus = '';
  filterProject = '';
  render();
  window.scrollTo(0, 0);
}
function biHome() {
  routeTrail.push(routeSnapshot());
  biProject = '';
  biSection = 'overview';
  biFilter = '';
  biDimension = '';
  query = '';
  filterStatus = '';
  render();
}
function switchBiSection(s) {
  routeTrail.push(routeSnapshot());
  biSection = s;
  biFilter = '';
  render();
}
function openSystem(section = 'system') {
  if (!isSysAdmin()) return;
  routeTrail.push(routeSnapshot());
  adminSection = section;
  tab = 'admin';
  projectId = '';
  query = '';
  render();
  window.scrollTo(0, 0);
}
const headOriginal = head;
head = function (k, title, sub, actions = '') {
  return headOriginal(k, title, sub, actions);
};
const renderOriginal = render;
render = function () {
  renderOriginal();
  document.title = 'SECAP · ' + db.portalSettings.title;
  if (!me()) return;
  const crumb = $('.crumb');
  if (crumb) {
    crumb.insertAdjacentHTML(
      'afterbegin',
      `<button class="headerback" onclick="goBack()" aria-label="Voltar à tela anterior" title="Voltar">${icon('arrow')}</button>`
    );
    if (tab === 'bi' && biProject) {
      const p = visible().find((p) => p.id === biProject);
      crumb.insertAdjacentHTML('beforeend', `<span>/</span><b>${esc(p?.name || 'Painel')}</b>`);
    }
  }
  const v = $('.version');
  if (v) {
    v.outerHTML = isSysAdmin()
      ? `<button class="system-button" onclick="openSystem()" title="Abrir painel do sistema">${icon('shield')}Painel do sistema</button><span class="header-sep"></span>`
      : `<span class="mini-status"><i></i>Portal de gestão</span>`;
  }
  if (window.SECAP_MEMBER) {
    const roleLabel = $('.user small');
    if (roleLabel)
      roleLabel.innerHTML = `${isViewOnly() ? 'Somente visualização' : 'Usuário'} ${icon('down')}`;
  }
  const footer = $('.sidebarfooter b');
  if (footer) footer.innerHTML = '<span class="dot"></span> Portal de gestão';
  const log = $('.sidebarfooter>span');
  if (log) log.textContent = 'Gestão integrada · armazenamento no servidor';
  const brand = $('.brand');
  if (brand) brand.title = 'Prefeitura de Goiânia';
  if (tab === 'admin') {
    const c = $('.crumb b');
    if (c) c.textContent = 'Painel do sistema';
  }
  const content = $('.content');
  if (content) content.classList.toggle('bi-content', tab === 'bi');
};
function biField(p, semantic) {
  const id = p.biMapping?.[semantic] ?? semanticDefaults[semantic];
  const field = p.fields.find((f) => f.id === id);
  if (['deadline', 'startDate'].includes(semantic)) {
    const mapped = p.biMapping?.[semantic];
    if (mapped && field && (p.records || []).some((r) => spreadsheetDate(r[field.id]))) return field;
    const inferred = biDateField(p, semantic);
    if (inferred && (!field || !(p.records || []).some((r) => spreadsheetDate(r[field.id])))) return inferred;
  }
  return field;
}
function fieldKey(p, semantic) {
  return biField(p, semantic)?.id || '';
}
function val(r, p, s) {
  const value = r[fieldKey(p, s)];
  return ['deadline', 'startDate'].includes(s) ? spreadsheetDate(value) : value;
}
function numberOrNull(v) {
  return v === '' || v == null || !Number.isFinite(Number(v)) ? null : Number(v);
}
function metricTotal(rs, p, s) {
  const k = fieldKey(p, s);
  if (!k) return null;
  const vs = rs.map((r) => numberOrNull(r[k])).filter((v) => v !== null);
  return vs.length ? vs.reduce((a, b) => a + b, 0) : null;
}
function metricAvg(rs, p, s) {
  const k = fieldKey(p, s);
  if (!k) return null;
  const vs = rs.map((r) => numberOrNull(r[k])).filter((v) => v !== null);
  return vs.length ? Math.round(vs.reduce((a, b) => a + b, 0) / vs.length) : null;
}
function semanticMoney(n) {
  return n === null ? '—' : compact(n);
}
function isFinished(r, p) {
  return /conclu|entregue|finalizad/i.test(String(val(r, p, 'status') || ''));
}
function overdue(r, p) {
  const d = val(r, p, 'deadline');
  return !!d && d < today() && !isFinished(r, p);
}
function daysLeft(d) {
  if (!d) return null;
  return Math.ceil((new Date(d + 'T12:00:00') - new Date(today() + 'T12:00:00')) / 86400000);
}
function urgency(r, p) {
  const pri = String(val(r, p, 'priority') || '');
  if (overdue(r, p) || /crític|muito alt/i.test(pri)) return 'Crítica';
  if (/atenção|parad|suspens/i.test(String(val(r, p, 'status') || '')) || /^alta$/i.test(pri))
    return 'Alta';
  if (
    !isFinished(r, p) &&
    daysLeft(val(r, p, 'deadline')) !== null &&
    daysLeft(val(r, p, 'deadline')) <= 15
  )
    return 'Acompanhar';
  return 'Regular';
}
function attentionRows(rs, p) {
  return rs
    .filter((r) => urgency(r, p) !== 'Regular')
    .sort(
      (a, b) =>
        ['Crítica', 'Alta', 'Acompanhar'].indexOf(urgency(a, p)) -
        ['Crítica', 'Alta', 'Acompanhar'].indexOf(urgency(b, p))
    );
}
function recordTitle(r, p) {
  return (
    r.nome ||
    r[p.fields.find((f) => ['text', 'long'].includes(f.type))?.id] ||
    'Registro sem título'
  );
}
function biRows(p) {
  return p.records.filter(
    (r) =>
      matchesQuery(r) &&
      (!filterStatus || String(val(r, p, 'status') || '') === filterStatus) &&
      (!biFilter || String(r[biDimension] || 'Não informado') === biFilter)
  );
}
function groupRows(rs, key) {
  const g = new Map();
  for (const r of rs) {
    const v = String(r[key] || 'Não informado');
    if (!g.has(v)) g.set(v, []);
    g.get(v).push(r);
  }
  return [...g.entries()].sort((a, b) => b[1].length - a[1].length);
}
function biMetric(label, value, foot, ic, color = '#003856', fn = '') {
  return `<button class="stat bi-stat" style="--accent:${color}" ${fn ? `onclick="${fn}"` : ''}><div class="top">${label}${icon(ic)}</div><div class="number">${value}</div><div class="foot">${foot}</div></button>`;
}
function chartPanel(title, sub, body, foot = '') {
  return `<section class="panel"><div class="panelhead"><div><h2>${title}</h2>${sub ? `<small>${sub}</small>` : ''}</div></div><div class="panelbody">${body}</div>${foot ? `<div class="insight-footer">${foot}</div>` : ''}</section>`;
}
function groupsChart(p, rs, f, mode = 'count', semantic = 'budget') {
  if (!f) return empty('Campo não configurado', 'Associe um campo no botão Configurar painel.');
  const groups = groupRows(rs, f.id);
  if (!groups.length) return empty('Sem registros', 'Adicione obras ou ajuste os filtros.');
  const values = groups.map(([name, rows]) => ({
      name,
      rows,
      value: mode === 'count' ? rows.length : metricTotal(rows, p, semantic),
    })),
    max = Math.max(1, ...values.map((v) => v.value || 0));
  return `<div class="horizontal-bars">${values.map((g, i) => `<button class="hbar hbar-button" data-field="${esc(f.id)}" data-value="${esc(g.name)}" onclick="biDimension=this.dataset.field;biFilter=this.dataset.value;render()"><div class="hbar-top"><span>${esc(g.name)}</span><b>${mode === 'count' ? g.value : semanticMoney(g.value)}</b></div><div class="progress"><i style="width:${Math.max(0, ((g.value || 0) / max) * 100)}%;background:${palette[i % palette.length]}"></i></div>${mode !== 'count' ? `<small>${g.rows.length} registro(s)</small>` : ''}</button>`).join('')}</div>`;
}
function donutChart(p, rs, f) {
  if (!f)
    return empty(
      'Sem campo de situação',
      'Configure um campo de lista para visualizar a distribuição.'
    );
  const groups = groupRows(rs, f.id);
  let angle = 0;
  const stops = groups
    .map(([n, rows], i) => {
      const start = angle;
      angle += (rows.length / (rs.length || 1)) * 100;
      return `${palette[i % palette.length]} ${start}% ${angle}%`;
    })
    .join(',');
  return `<div class="donut-chart"><div class="donut" style="background:${stops ? `conic-gradient(${stops})` : '#edf2f5'}"><div class="donutvalue">${rs.length}<small>registros no projeto</small></div></div><div class="donut-legend">${groups.map(([name, rows], i) => `<button data-field="${esc(f.id)}" data-value="${esc(name)}" onclick="biDimension=this.dataset.field;biFilter=this.dataset.value;render()"><i style="background:${palette[i % palette.length]}"></i><span>${esc(name)}</span><b>${rows.length}</b></button>`).join('') || '<span class="subtitle">Sem dados para exibir</span>'}</div></div>`;
}
function biFolderPage() {
  const ps = visible().filter((p) => !query || p.name.toLowerCase().includes(query.toLowerCase())),
    all = visible().flatMap((p) => p.records);
  return (
    head(
      'INTELIGÊNCIA E RESULTADOS',
      'BI · Painéis de projetos',
      'Escolha uma pasta para explorar os indicadores e as decisões de cada projeto.',
      btn('Ver projetos', "go('projects')", 'folder')
    ) +
    `<div class="summary-strip">${icon('chart')}<p><strong>Um painel para cada projeto.</strong> Os dados cadastrados em Projetos se transformam em análises conectadas. Escolha o modelo de BI que melhor representa o trabalho da sua equipe.</p></div><div class="filters"><div class="search">${icon('search')}<input aria-label="Buscar painéis" placeholder="Encontrar o painel de um projeto..." value="${esc(query)}" oninput="updateQuery(this.value)"></div><span class="right">${ps.length} painéis · ${all.length} obras e registros</span></div><div class="cards">${ps
      .map((p, i) => {
        const model = biTemplates[p.biTemplate || 'obras'] || biTemplates.obras,
          progress = metricAvg(p.records, p, 'progress'),
          attn = attentionRows(p.records, p);
        return `<article class="project bi-folder" style="--folder-accent:${p.color || palette[i % palette.length]}" role="button" tabindex="0" aria-label="Abrir BI de ${esc(p.name)}" onclick="openBI('${p.id}')" onkeydown="if(event.key==='Enter'&&event.target===this)openBI('${p.id}')"><div class="pbody"><div class="ptop"><div class="folder" style="background:${p.color || palette[i % palette.length]}12;color:${p.color || palette[i % palette.length]}">${icon('folder')}</div><span class="panel-type">${model.short.toUpperCase()}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="folder-kpis"><div><b>${p.records.length}</b><small>OBRAS / REGISTROS</small></div><div><b>${progress === null ? '—' : progress + '%'}</b><small>AVANÇO MÉDIO</small></div><div><b style="color:${attn.length ? '#c37937' : '#268c48'}">${attn.length}</b><small>EXIGEM ATENÇÃO</small></div></div><div class="pmeta" style="margin:0"><span>Investimento previsto</span><b>${semanticMoney(metricTotal(p.records, p, 'budget'))}</b></div></div><div class="pfooter"><span>Explorar painel do projeto</span>${icon('arrow')}</div></article>`;
      })
      .join(
        ''
      )}</div>${ps.length ? '' : empty('Nenhum painel encontrado', 'Crie um projeto ou ajuste a busca para começar.')}`
  );
}
const biSections = [
  ['overview', 'Visão geral', 'dashboard'],
  ['pipeline', 'Pipeline', 'kanban'],
  ['priorities', 'Prioridades', 'alert'],
  ['schedule', 'Prazos', 'calendar'],
  ['finance', 'Financeiro', 'money'],
  ['details', 'Marcos', 'file'],
];
bi = function () {
  if (!biProject) return biFolderPage();
  const p = visible().find((p) => p.id === biProject);
  if (!p) {
    biProject = '';
    return biFolderPage();
  }
  const rs = biRows(p),
    model = biTemplates[p.biTemplate || 'obras'] || biTemplates.obras,
    sections = [...biSections];
  if (canEdit(p)) sections.push(['designer', 'Personalizar BI', 'edit']);
  if (p.managementTemplate === 'contratacao')
    sections.splice(2, 0, ['documents', 'Documentação', 'file']);
  if (p.managementTemplate === 'obras')
    sections.splice(4, 0, ['territory', 'Território', 'folder']);
  if (p.managementTemplate === 'recursos') sections.splice(2, 0, ['funding', 'Captação', 'money']);
  if (p.biTemplate === 'termos') sections.splice(4, 0, ['terms', 'Termos vinculados', 'file']);
  if (p.managementTemplate && templateDefinitions[p.managementTemplate]?.bi === p.biTemplate) {
    const labels = templateDefinitions[p.managementTemplate].tabs;
    sections.splice(
      0,
      sections.length,
      ...sections.filter((s) => s[0] === 'designer' || s[0] === 'details' || labels.includes(s[1]))
    );
  }
  if (!sections.some((s) => s[0] === biSection)) biSection = 'overview';
  return `<button class="backlink" onclick="biHome()">${icon('arrow')}Todos os painéis de projetos</button><section class="bihero"><div><div class="eyebrow">BI DO PROJETO · ${model.name.toUpperCase()}</div><h1>${esc(p.name)}</h1><p>${esc(p.description)}</p><div class="hero-meta"><span>${icon('user')}${esc(p.owner)}</span><span>${icon('folder')}${p.records.length} registros conectados</span><span>${icon('clock')}Dados locais · atualização automática</span></div></div><div class="hero-actions"><div class="hero-emblem">${icon(model.icon)}</div>${canEdit(p) ? btn('Configurar painel', `configureBI('${p.id}')`, 'edit') : ''}${btn('Exportar dados', `exportBI('${p.id}')`, 'download')}</div></section><nav class="subtabs" aria-label="Abas do BI do projeto">${sections.map(([id, n, i]) => `<button class="${biSection === id ? 'active' : ''}" aria-current="${biSection === id ? 'page' : 'false'}" onclick="switchBiSection('${id}')">${icon(i)}${n}</button>`).join('')}</nav>${biFilters(p, rs)}${{ overview: biOverview, pipeline: biPipeline, priorities: biPriorities, schedule: biSchedule, finance: biFinance, details: biDetails, designer: biDesigner, quality: biQuality, documents: biDocuments, territory: biTerritory, funding: biFunding, terms: biTerms }[biSection](p, rs)}<div class="system-state"><span>Modelo: ${model.name} · ${rs.length} de ${p.records.length} registros</span><button class="textbtn" onclick="go('projects','${p.id}')">Abrir dados do projeto ${icon('arrow')}</button></div>`;
};
function biFilters(p, rs) {
  const f = biField(p, 'status'),
    opts = f?.options || [],
    dims = p.fields.filter(
      (f) => ['select', 'text', 'responsible', 'boolean'].includes(f.type) && f.id !== 'nome'
    );
  return `<div class="bi-filters"><div class="search">${icon('search')}<input aria-label="Buscar no BI" placeholder="Buscar obra ou responsável neste painel..." value="${esc(query)}" oninput="updateQuery(this.value)"></div>${f ? `<select aria-label="Filtrar situação do BI" onchange="filterStatus=this.value;render()"><option value="">Todas as situações</option>${opts.map((o) => `<option value="${esc(o)}" ${filterStatus === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>` : ''}<select aria-label="Dimensão de análise" onchange="biDimension=this.value;biFilter='';render()"><option value="">Filtrar por campo</option>${dims.map((f) => `<option value="${f.id}" ${biDimension === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select>${biDimension ? `<select aria-label="Valor do campo" onchange="biFilter=this.value;render()"><option value="">Todos os valores</option>${[...new Set(p.records.map((r) => String(r[biDimension] || 'Não informado')))].map((v) => `<option value="${esc(v)}" ${biFilter === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>` : ''}${query || filterStatus || biFilter ? btn('Limpar', 'query="";filterStatus="";biFilter="";biDimension="";render()', 'close') : ''}<span class="filter-info">${rs.length} registros na análise</span></div>`;
}
function biOverview(p, rs) {
  const complete = rs.filter((r) => isFinished(r, p)).length,
    progress = metricAvg(rs, p, 'progress'),
    budget = metricTotal(rs, p, 'budget'),
    spent = metricTotal(rs, p, 'spent'),
    raised = metricTotal(rs, p, 'raised'),
    critical = attentionRows(rs, p),
    deadline = biField(p, 'deadline'),
    without = deadline ? rs.filter((r) => !r[deadline.id]).length : null;
  const moneyPercent = budget && spent !== null ? Math.round((spent / budget) * 100) : null;
  return `${biTemplateContext(p, rs)}<div class="stats sixstats">${biMetric('OBRAS E REGISTROS', rs.length, 'Carteira deste projeto', 'folder')}${biMetric('AVANÇO FÍSICO MÉDIO', progress === null ? '—' : progress + '%', progress === null ? 'Associe um campo de percentual' : 'Média simples dos valores informados', 'chart', '#169dc4')}${biMetric('ENTREGAS CONCLUÍDAS', complete, rs.length ? `${Math.round((complete / rs.length) * 100)}% dos registros filtrados` : 'Nenhum registro no período', 'check', '#268c48', "switchBiSection('details')")}${biMetric(p.biTemplate === 'recursos' ? 'VALOR CAPTADO' : 'INVESTIMENTO PREVISTO', semanticMoney(p.biTemplate === 'recursos' ? raised : budget), 'Somente valores preenchidos', 'money', '#003856', "switchBiSection('finance')")}${biMetric('EXIGEM ATENÇÃO', critical.length, `${critical.filter((r) => overdue(r, p)).length} com prazo vencido`, 'alert', '#f37021', "switchBiSection('priorities')")}${biMetric('SEM PRAZO DEFINIDO', without === null ? '—' : without, deadline ? 'Registros sem data de encerramento' : 'Campo de prazo não associado', 'calendar', '#97b0bf', "switchBiSection('schedule')")}</div><div class="summary-strip">${icon('chart')}<p><strong>Leitura da carteira.</strong> ${rs.length} registro(s) acompanhado(s), ${complete} entrega(s) concluída(s) e ${critical.length} item(ns) que merece(m) uma próxima ação.${moneyPercent !== null ? ` A execução financeira informada corresponde a <strong>${moneyPercent}%</strong> do investimento previsto.` : ''} ${without ? 'Complete os prazos em aberto para melhorar o acompanhamento.' : ''}</p></div><div class="chart-grid wide">${chartPanel('Como está o projeto', 'Distribuição das obras pela situação atual', donutChart(p, rs, biField(p, 'status')), 'Clique na legenda para filtrar o painel.')}${chartPanel('Avanço por macroetapa', 'Onde estão os registros na jornada de entrega', groupsChart(p, rs, biField(p, 'stage')), 'O agrupamento utiliza o campo associado ao pipeline.')}</div><div class="chart-grid">${chartPanel('Investimento e execução', 'Aplicação dos valores cadastrados', budget === null ? empty('Valor previsto não informado', 'Associe e preencha os campos financeiros do projeto.') : `<div class="finance-total">${semanticMoney(budget)}<small>investimento previsto</small></div><div class="money-split"><i style="width:${budget && spent !== null ? Math.min(100, Math.max(0, (spent / budget) * 100)) : 0}%;background:#169dc4"></i></div><div class="legend-rows"><div><span>Valor executado</span><b>${semanticMoney(spent)}</b></div><div><span>Saldo previsto</span><b>${spent === null ? '—' : semanticMoney(budget - spent)}</b></div><div><span>Execução financeira</span><b>${moneyPercent === null ? '—' : moneyPercent + '%'}</b></div></div>`, 'Valores captados, previstos e executados são medidas distintas.')}${chartPanel(
    'O que fazer agora',
    'Prioridades organizadas por urgência',
    critical
      .slice(0, 3)
      .map(
        (r) =>
          `<button class="attention" style="width:100%;text-align:left;padding:14px 0" onclick="editRecord('${p.id}','${r.id}')"><span class="alerticon">${icon(overdue(r, p) ? 'clock' : 'alert')}</span><div><h3>${esc(recordTitle(r, p))}</h3><p>${esc(r.proxima || 'Defina a próxima providência no registro.')}</p><span class="badge ${overdue(r, p) ? 'red' : 'orange'}">${urgency(r, p)} · ${date(val(r, p, 'deadline'))}</span></div></button>`
      )
      .join('') ||
      empty('Nenhuma atenção sinalizada', 'Mantenha os prazos e as situações atualizados.')
  )}</div>${biCustomCharts(p, rs)}${chartPanel('Entregas e próximos prazos', 'As datas vêm diretamente dos registros', biDeadlineList(p, rs, 4), 'Edite o registro de origem para atualizar o prazo em todo o portal.')}`;
}
function biCustomCharts(p, rs) {
  const nums = p.fields.filter(
    (f) =>
      ['number', 'currency'].includes(f.type) &&
      ![
        fieldKey(p, 'budget'),
        fieldKey(p, 'spent'),
        fieldKey(p, 'progress'),
        fieldKey(p, 'raised'),
      ].includes(f.id)
  );
  const dimensions = p.fields.filter(
    (f) => f.type === 'select' && ![fieldKey(p, 'status'), fieldKey(p, 'stage')].includes(f.id)
  );
  if (!nums.length && !dimensions.length) return '';
  return `<div class="section-kicker">Indicadores do seu projeto</div>${
    nums.length
      ? `<div class="stats" style="grid-template-columns:repeat(${Math.min(4, nums.length)},1fr)">${nums
          .map((f) => {
            const vs = rs.map((r) => numberOrNull(r[f.id])).filter((n) => n !== null),
              total = vs.reduce((a, b) => a + b, 0);
            return biMetric(
              esc(f.name).toUpperCase(),
              vs.length
                ? f.type === 'currency'
                  ? compact(total)
                  : total.toLocaleString('pt-BR')
                : '—',
              `Soma · ${vs.length} registro(s) preenchido(s)`,
              'chart'
            );
          })
          .join('')}</div>`
      : ''
  }${dimensions.length ? `<div class="chart-grid">${dimensions.map((f) => chartPanel(esc(f.name), 'Distribuição dos valores cadastrados', groupsChart(p, rs, f))).join('')}</div>` : ''}`;
}
function pipelineChoices(p) {
  const keys = [fieldKey(p, 'status'), fieldKey(p, 'stage'), 'status', 'etapa'];
  return p.fields.filter((f) => keys.includes(f.id) ||
    ['status', 'statusdoprojeto', 'statusdaobra', 'macroetapa', 'etapa'].includes(importHeaderKey(f.name)));
}
function pipelineField(p) {
  return (
    p.fields.find((f) => f.id === pipelineDisplayField) ||
    p.fields.find((f) => f.id === p.biPipelineField) ||
    pipelineChoices(p).find((f) => ['macroetapa', 'etapa'].includes(importHeaderKey(f.name))) ||
    biField(p, 'stage') ||
    biField(p, 'status') ||
    p.fields.find((f) => f.type === 'select')
  );
}
function biPipeline(p, rs) {
  const f = pipelineField(p),
    options = f?.options || [...new Set(rs.map((r) => String(r[f?.id] || 'Não informado')))],
    groups = f
      ? options.map((o) => [o, rs.filter((r) => String(r[f.id] || 'Não informado') === o)])
      : [];
  if (f && rs.some((r) => !options.includes(String(r[f.id] || 'Não informado'))))
    groups.push([
      'Não informado',
      rs.filter((r) => !options.includes(String(r[f.id] || 'Não informado'))),
    ]);
  return `<div class="pagehead"><div><h2>Pipeline do projeto</h2><p class="subtitle" style="margin-top:7px">Concentração de registros e investimento por etapa.</p></div><select aria-label="Organizar pipeline por" onchange="setPipelineField('${p.id}',this.value)">${p.fields
    .filter((f) => f.type === 'select')
    .map(
      (o) => `<option value="${o.id}" ${f?.id === o.id ? 'selected' : ''}>${esc(o.name)}</option>`
    )
    .join(
      ''
    )}</select></div>${f ? groups.map(([n, rows], i) => `<button class="pipeline-stage" data-field="${f.id}" data-value="${esc(n)}" onclick="openPipelineDetail(this.dataset.field,this.dataset.value)"><div class="stage-number">${String(i + 1).padStart(2, '0')}</div><div style="min-width:140px"><h3>${esc(n)}</h3><p>${rows.filter((r) => urgency(r, p) !== 'Regular').length} atenção · ${metricAvg(rows, p, 'progress') ?? '—'}% avanço médio</p></div><div class="stage-bar"><div class="progress"><i style="width:${rs.length ? (rows.length / rs.length) * 100 : 0}%;background:${palette[i % palette.length]}"></i></div></div><span class="stage-count">${rows.length}</span><span class="stage-amount">${semanticMoney(metricTotal(rows, p, 'budget'))}</span>${icon('arrow')}</button>`).join('') : empty('Defina as etapas do projeto', 'Crie um campo de lista para organizar o pipeline.')}<div class="chart-grid" style="margin-top:24px">${chartPanel('Carga por responsável', 'Quantidade de registros por pessoa', groupsChart(p, rs, biField(p, 'owner')))}${chartPanel('Distribuição por órgão', 'Participação dos órgãos envolvidos', groupsChart(p, rs, biField(p, 'agency')))}</div><p class="metric-note">Clique em uma etapa para abrir seu detalhamento. O pipeline acompanha as mesmas listas usadas em Projetos e Acompanhamento.</p>`;
}
function setPipelineField(id, value) {
  pipelineDisplayField = value;
  render();
}
function biPriorities(p, rs) {
  const ar = attentionRows(rs, p),
    critical = ar.filter((r) => urgency(r, p) === 'Crítica'),
    high = ar.filter((r) => urgency(r, p) === 'Alta'),
    soon = ar.filter((r) => urgency(r, p) === 'Acompanhar');
  return `<div class="stats" style="grid-template-columns:repeat(3,1fr)">${biMetric('URGÊNCIA CRÍTICA', critical.length, 'Prazos vencidos ou prioridade muito alta', 'alert', '#c93636')}${biMetric('ATENÇÃO DA EQUIPE', high.length, 'Situação de atenção ou prioridade alta', 'alert', '#f37021')}${biMetric('PRÓXIMOS 15 DIAS', soon.length, 'Entregas próximas que pedem acompanhamento', 'calendar', '#169dc4')}</div><p class="metric-note">Urgência calculada a partir de prazo, situação e prioridade, quando informada. Não substitui a classificação do responsável. Registros concluídos são desconsiderados nos alertas de prazo.</p>${
    ar
      .map((r) => {
        const u = urgency(r, p),
          past = overdue(r, p),
          d = val(r, p, 'deadline');
        return `<article class="priority-card ${u === 'Crítica' ? 'critical' : ''}"><div class="priority-top"><div><div class="eyebrow">${esc(val(r, p, 'agency') || 'SECAP')} · ${esc(val(r, p, 'stage') || 'Etapa não informada')}</div><h3>${esc(recordTitle(r, p))}</h3><span class="subtitle">${past ? `Prazo vencido há ${Math.abs(daysLeft(d))} dia(s)` : 'Acompanhar avanço e próximos marcos'}</span></div><span class="badge ${u === 'Crítica' ? 'red' : 'orange'}">${u}</span></div><div class="priority-flow"><div><small>Onde está</small><p>${esc(val(r, p, 'status') || 'Situação não informada')}</p></div><div><small>Quem acionar</small><p>${esc(val(r, p, 'owner') || 'Definir responsável')}</p></div><div><small>Próxima providência</small><p>${esc(r.proxima || 'Cadastrar uma próxima ação no registro.')}</p></div></div><div class="priority-meta"><span>${icon('calendar')} ${date(d)}</span><button class="textbtn" onclick="editRecord('${p.id}','${r.id}')">Abrir registro ${icon('arrow')}</button></div></article>`;
      })
      .join('') ||
    chartPanel(
      'Carteira em acompanhamento',
      'Nenhum alerta calculado com os dados atuais',
      empty(
        'Nenhuma prioridade pendente',
        'Continue atualizando os responsáveis, as etapas e os prazos.'
      )
    )
  }`;
}
function biDeadlineList(p, rs, limit = 99) {
  const f = biField(p, 'deadline'),
    withDates = f ? rs.map((r) => ({...r, [f.id]: spreadsheetDate(r[f.id])})).filter((r) => r[f.id]).sort((a, b) => a[f.id].localeCompare(b[f.id])) : [];
  return (
    withDates
      .slice(0, limit)
      .map((r) => {
        const d = r[f.id],
          dt = new Date(d + 'T12:00:00');
        return `<button class="timeline-row" style="text-align:left;width:100%" onclick="editRecord('${p.id}','${r.id}')"><span class="timeline-date"><strong>${dt.getDate()}</strong><small>${dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</small></span><div><h3>${esc(recordTitle(r, p))}</h3><p>${esc(val(r, p, 'owner') || 'Sem responsável')} · ${esc(f.name)}${biDateField(p, 'startDate') && spreadsheetDate(r[biDateField(p, 'startDate').id]) ? ' · Início da vigência: ' + esc(date(spreadsheetDate(r[biDateField(p, 'startDate').id]))) : ''}</p></div><span class="badge ${overdue(r, p) ? 'red' : isFinished(r, p) ? 'green' : ''}">${overdue(r, p) ? 'Vencido' : isFinished(r, p) ? 'Concluído' : date(d)}</span></button>`;
      })
      .join('') ||
    empty('Nenhum prazo informado', 'Associe um campo de data e preencha os registros no projeto.')
  );
}
function biSchedule(p, rs) {
  const f = biField(p, 'deadline'),
    normalized = f ? rs.map((r) => ({...r, [f.id]: spreadsheetDate(r[f.id])})) : rs,
    dated = f ? normalized.filter((r) => r[f.id]) : [],
    next30 = dated.filter(
      (r) => !isFinished(r, p) && daysLeft(r[f.id]) >= 0 && daysLeft(r[f.id]) <= 30
    ),
    noDate = f ? rs.length - dated.length : null;
  return `<div class="stats">${biMetric('PRAZOS INFORMADOS', dated.length, `${rs.length} registros na análise`, 'calendar')}${biMetric('PRAZOS VENCIDOS', dated.filter((r) => overdue(r, p)).length, 'Entregas ainda não concluídas', 'clock', '#c93636')}${biMetric('VENCEM EM 30 DIAS', next30.length, 'Próximas entregas da carteira', 'calendar', '#f37021')}${biMetric('SEM DATA', noDate === null ? '—' : noDate, 'Completar o cronograma', 'edit', '#97b0bf')}</div><div class="chart-grid wide">${chartPanel('Linha de entregas', 'Registros organizados pela data de encerramento', biDeadlineList(p, normalized))}${chartPanel(
    'Janelas de acompanhamento',
    'Prazos futuros de registros não concluídos',
    `<div class="calendar-bars">${[
      [0, 7, 'Até 7 dias'],
      [8, 30, '8 a 30 dias'],
      [31, 90, '31 a 90 dias'],
    ]
      .map(
        ([a, b, n]) =>
          `<div class="calendar-bar"><span>${n}</span><b>${dated.filter((r) => !isFinished(r, p) && daysLeft(r[f.id]) >= a && daysLeft(r[f.id]) <= b).length}</b><span>entregas</span></div>`
      )
      .join(
        ''
      )}</div><p class="metric-note" style="margin:23px 0 0">Os eventos de todos os campos de data, incluindo datas adicionais e vigências dos termos, também aparecem no calendário geral.</p><div style="margin-top:20px">${btn('Abrir calendário', "go('calendar')", 'calendar')}</div>`
  )}</div>`;
}
function biFinance(p, rs) {
  const b = metricTotal(rs, p, 'budget'),
    s = metricTotal(rs, p, 'spent'),
    raised = metricTotal(rs, p, 'raised'),
    rate = b && s !== null ? Math.round((s / b) * 100) : null,
    physical = metricAvg(rs, p, 'progress'),
    diff = rate !== null && physical !== null ? physical - rate : null,
    missing = rs.filter((r) => numberOrNull(val(r, p, 'budget')) === null).length;
  const ranked = [...rs].sort(
    (a, b) => (Number(val(b, p, 'budget')) || 0) - (Number(val(a, p, 'budget')) || 0)
  );
  return `<div class="stats">${biMetric('INVESTIMENTO PREVISTO', semanticMoney(b), `${rs.length - missing} registros com valor informado`, 'money')}${biMetric('VALOR EXECUTADO', semanticMoney(s), 'Aplicação financeira registrada', 'chart', '#169dc4')}${biMetric(p.biTemplate === 'recursos' ? 'VALOR CAPTADO' : 'SALDO PREVISTO', semanticMoney(p.biTemplate === 'recursos' ? raised : b !== null && s !== null ? b - s : null), p.biTemplate === 'recursos' ? 'Recurso captado informado' : 'Previsto menos executado', 'money', '#268c48')}${biMetric('EXECUÇÃO FINANCEIRA', rate === null ? '—' : rate + '%', 'Executado ÷ previsto', 'chart', '#f37021')}</div>${missing ? `<div class="data-quality">${icon('alert')}${missing} registro(s) sem valor previsto. Os totais consideram somente os valores preenchidos.</div>` : ''}<div class="chart-grid">${chartPanel('Físico × financeiro', 'Dois indicadores para acompanhar a execução', `<div class="horizontal-bars"><div class="hbar"><div class="hbar-top"><span>Avanço físico médio</span><b>${physical === null ? '—' : physical + '%'}</b></div><div class="progress"><i style="width:${Math.min(100, Math.max(0, physical || 0))}%;background:#003856"></i></div></div><div class="hbar"><div class="hbar-top"><span>Execução financeira</span><b>${rate === null ? '—' : rate + '%'}</b></div><div class="progress"><i style="width:${Math.min(100, Math.max(0, rate || 0))}%;background:#169dc4"></i></div></div></div><div class="summary-strip" style="margin:26px 0 0;font-size:11px">${icon('chart')}<p>${diff === null ? 'Preencha os campos físicos e financeiros para comparar os indicadores.' : `Diferença de <strong>${Math.abs(diff)} pontos percentuais</strong>. O avanço físico é uma média simples; a execução financeira representa o total aplicado sobre o total previsto.`}</p></div>`, 'Indicadores com bases diferentes: use a comparação como contexto, não como diagnóstico de eficiência.')}${chartPanel('Investimento por etapa', 'Valor previsto nas etapas do projeto', groupsChart(p, rs, biField(p, 'stage'), 'money'), 'Os valores seguem o campo associado a investimento previsto.')}</div><div class="chart-grid">${chartPanel(
    'Maiores investimentos',
    'Registros com maior valor previsto',
    `<div class="horizontal-bars">${
      ranked
        .filter((r) => numberOrNull(val(r, p, 'budget')) !== null)
        .slice(0, 7)
        .map((r, i) => {
          const max = Math.max(1, ...ranked.map((r) => Number(val(r, p, 'budget')) || 0));
          return `<button class="hbar hbar-button" onclick="editRecord('${p.id}','${r.id}')"><div class="hbar-top"><span>${esc(recordTitle(r, p))}</span><b>${compact(val(r, p, 'budget'))}</b></div><div class="progress"><i style="width:${Math.max(0, ((Number(val(r, p, 'budget')) || 0) / max) * 100)}%;background:${palette[i % palette.length]}"></i></div></button>`;
        })
        .join('') || empty('Sem valores previstos', 'Preencha os valores nos registros de origem.')
    }</div>`
  )}${chartPanel('Origem e captação', 'Fontes e valores captados, quando disponíveis', biField(p, 'source') ? groupsChart(p, rs, biField(p, 'source'), 'money', p.biTemplate === 'recursos' ? 'raised' : 'budget') : `<div class="finance-total">${semanticMoney(raised)}<small>valor captado informado</small></div><p class="metric-note">Para analisar a origem dos recursos, crie um campo de fonte ou programa e associe-o em Configurar painel.</p>`, 'Captação não é somada ao investimento previsto ou ao valor executado.')}</div>${chartPanel(
    'Detalhamento financeiro',
    'Valores por obra ou registro',
    `<div class="tablewrap"><table><thead><tr><th>Obra / registro</th><th class="numeric-cell">Previsto</th><th class="numeric-cell">Executado</th><th class="numeric-cell">Saldo previsto</th><th class="numeric-cell">Execução</th></tr></thead><tbody>${rs
      .map((r) => {
        const b = numberOrNull(val(r, p, 'budget')),
          e = numberOrNull(val(r, p, 'spent'));
        return `<tr><td><button class="project-link" onclick="editRecord('${p.id}','${r.id}')">${esc(recordTitle(r, p))}</button></td><td class="numeric-cell">${b === null ? '—' : money(b)}</td><td class="numeric-cell">${e === null ? '—' : money(e)}</td><td class="numeric-cell">${b === null || e === null ? '—' : money(b - e)}</td><td class="numeric-cell">${b && e !== null ? Math.round((e / b) * 100) + '%' : '—'}</td></tr>`;
      })
      .join('')}</tbody></table></div>`
  )}<p class="metric-note" style="margin-top:18px">Não há série histórica nesta fonte. As análises representam os valores atuais cadastrados e respeitam os filtros do painel.</p>`;
}
function ensureProjectMilestones(p) {
  if (!Array.isArray(p.milestones)) {
    p.milestones = [
      {
        id: 'phase_' + Date.now() + '_1',
        title: 'Fase 1',
        color: '#003856',
        items: [
          {
            id: 'm_' + Date.now() + '_1',
            title: 'Apresentação do Projeto',
            ownerId: '',
            status: 'done',
            progress: 100,
          },
          {
            id: 'm_' + Date.now() + '_2',
            title: 'Aprovação do orçamento',
            ownerId: '',
            status: 'progress',
            progress: 45,
          },
          {
            id: 'm_' + Date.now() + '_3',
            title: 'Conclusão do recrutamento',
            ownerId: '',
            status: 'done',
            progress: 25,
          },
        ],
      },
      {
        id: 'phase_' + Date.now() + '_2',
        title: 'Fase 2',
        color: '#a25ddc',
        items: [
          {
            id: 'm_' + Date.now() + '_4',
            title: 'Escopo do Projeto',
            ownerId: '',
            status: 'done',
            progress: 65,
          },
          {
            id: 'm_' + Date.now() + '_5',
            title: 'Reunião inicial',
            ownerId: '',
            status: 'progress',
            progress: 45,
          },
          {
            id: 'm_' + Date.now() + '_6',
            title: 'Aprovar fases do projeto',
            ownerId: '',
            status: 'stuck',
            progress: 25,
          },
          {
            id: 'm_' + Date.now() + '_7',
            title: 'Primeiro relatório de status',
            ownerId: '',
            status: 'progress',
            progress: 80,
          },
        ],
      },
    ];
  }
  return p.milestones;
}

const MILESTONE_STATUS = {
  progress: { label:'Em andamento', bg:'#007EFF', color:'#ffffff', next:'done' },
  done: { label:'Concluído', bg:'#00DE94', color:'#003247', next:'started' },
  started: { label:'Iniciado', bg:'#ffffff', color:'#003247', next:'canceled_black' },
  canceled_black: { label:'Cancelado', bg:'#000000', color:'#ffffff', next:'paused' },
  paused: { label:'Paralisado', bg:'#DC2626', color:'#ffffff', next:'planning' },
  planning: { label:'Em planejamento', bg:'#FFBF00', color:'#003247', next:'progress' },
};
function msStatusKey(value) { return value==='stuck'?'canceled_black':Object.hasOwn(MILESTONE_STATUS,value)?value:'progress'; }

const PHASE_PALETTE = ['#003856', '#f36e22', '#00a3d7', '#268c48'];

function getSystemUsersList() {
  if (typeof db !== 'undefined' && Array.isArray(db.users)) return db.users;
  if (typeof db !== 'undefined' && Array.isArray(db.members)) return db.members;
  if (typeof db !== 'undefined' && Array.isArray(db.people)) return db.people;
  return [];
}

function renderOwnerBadge(ownerId, ownerName = '') {
  const users = getSystemUsersList();
  const u = users.find((x) => String(x.id || x.email) === String(ownerId));
  const name=String(ownerName || u?.name || u?.full_name || u?.email || '').trim();
  if(!name)return `<span class="ms-avatar ms-avatar-empty" title="Atribuir responsável">+</span>`;
  const initials=name.split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase();
  return `<span class="ms-owner-display"><span class="ms-avatar" aria-hidden="true">${esc(initials)}</span><span class="ms-owner-name">${esc(name)}</span></span>`;
}

function biDetails(p) {
  const realProject = msGetProject(p.id) || p;
  const phases = ensureProjectMilestones(realProject);

  const allItems = phases.flatMap((ph) => ph.items || []);
  const doneCount = allItems.filter((it) => it.status === 'done').length;
  const avgPct = allItems.length
    ? Math.round(
        allItems.reduce((acc, it) => acc + (Number(it.progress) || 0), 0) / allItems.length
      )
    : 0;

  const trashSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

  const phasesHtml = phases.length
    ? phases
        .map((phase, pIdx) => {
          const color = phase.color || PHASE_PALETTE[pIdx % PHASE_PALETTE.length];
          const items = phase.items || [];
          const phaseDone = items.filter((it) => it.status === 'done').length;

          const rowsHtml = items
            .map((item) => {
              const statusKey = msStatusKey(item.status), st = MILESTONE_STATUS[statusKey];
              const pct = Math.max(0, Math.min(100, Number(item.progress) || 0));
              const barBg =
                pct === 100 ? '#268c48' : 'linear-gradient(90deg, #003856 0%, #00a3d7 100%)';

              return `
            <div class="ms-row" data-phase="${phase.id}" data-item="${item.id}">
              <div class="ms-cell ms-cell-title">
                <input
                  type="text"
                  class="ms-title-input"
                  value="${esc(item.title)}"
                  onchange="msUpdateItem('${realProject.id}', '${phase.id}', '${item.id}', 'title', this.value)"
                />
              </div>

              <button type="button" class="ms-cell ms-cell-owner ms-owner-trigger" aria-label="Definir responsável do marco ${esc(item.title)}" ${canEdit(realProject)?'':'disabled'} onclick="msOpenOwnerMenu(event, '${realProject.id}', '${phase.id}', '${item.id}')">
                ${renderOwnerBadge(item.ownerId, item.ownerName)}
              </button>

              <div class="ms-cell">
                <select class="ms-cell-status ms-status-select" aria-label="Status do marco ${esc(item.title)}" style="background-color:${st.bg};color:${st.color};border:1px solid ${statusKey==='started'?'#b8c7cf':st.bg}" ${canEdit(realProject)?'':'disabled'} onchange="msSetStatus('${realProject.id}','${phase.id}','${item.id}',this.value)">
                  ${Object.entries(MILESTONE_STATUS).map(([key,value])=>`<option value="${key}" ${key===statusKey?'selected':''}>${value.label}</option>`).join('')}
                </select>
              </div>

              <div class="ms-cell ms-cell-timeline" title="Clique na barra para ajustar o progresso (${pct}%)" onclick="msClickTimeline(event, '${realProject.id}', '${phase.id}', '${item.id}')">
                <div class="ms-bar-track">
                  <div class="ms-bar-fill" style="width: ${pct}%; background: ${barBg};"></div>
                </div>
                <span class="ms-pct-label">${pct}%</span>
              </div>

              <div class="ms-cell ms-cell-end">
                <button type="button" class="ms-del-btn" title="Excluir tarefa" aria-label="Excluir tarefa" onclick="msDeleteItem('${realProject.id}', '${phase.id}', '${item.id}')">${trashSvg}</button>
              </div>
            </div>
          `;
            })
            .join('');

          return `
          <div class="ms-group" style="border-left-color: ${color};">
            <div class="ms-group-header">
              <div class="ms-group-title-wrap">
                <input
                  type="text"
                  class="ms-phase-input"
                  style="color: ${color};"
                  value="${esc(phase.title)}"
                  onchange="msUpdatePhaseTitle('${realProject.id}', '${phase.id}', this.value)"
                />
                <span class="ms-phase-count">${phaseDone}/${items.length} concluídos</span>
              </div>
              <div class="ms-col-head">Responsável</div>
              <div class="ms-col-head">Status</div>
              <div class="ms-col-head">Progresso</div>
              <div class="ms-col-head ms-group-actions">
                <button type="button" class="ms-add-circle" title="Adicionar tarefa em ${esc(phase.title)}" aria-label="Adicionar tarefa" onclick="msAddItem('${realProject.id}', '${phase.id}')">+</button>
                <button type="button" class="ms-del-phase-btn" title="Excluir fase ${esc(phase.title)}" aria-label="Excluir fase" onclick="msDeletePhase('${realProject.id}', '${phase.id}')">${trashSvg}</button>
              </div>
            </div>
            <div class="ms-rows">
              ${rowsHtml || `<div class="ms-empty-row">Nenhuma tarefa nesta fase. Clique no botão <strong>+</strong> acima para adicionar.</div>`}
            </div>
          </div>
        `;
        })
        .join('')
    : `<div class="ms-empty-board">Nenhuma fase cadastrada neste projeto. Clique em <strong>+ Nova Fase</strong> para começar.</div>`;

  return `
    <div class="ms-board">
      <div class="ms-board-top">
        <div class="ms-board-heading">
          <span class="ms-board-eyebrow">PLANEJAMENTO E ENTREGAS · SECAP</span>
          <h2 class="ms-board-title">Marcos do Projeto</h2>
        </div>
        <div class="ms-board-summary">
          <span class="ms-kpi-pill">Concluídos: <b>${doneCount}/${allItems.length}</b></span>
          <span class="ms-kpi-pill">Avanço médio: <b>${avgPct}%</b></span>
          <button type="button" class="ms-btn-new-phase" onclick="msAddPhase('${realProject.id}')">+ Nova Fase</button>
        </div>
      </div>
      ${phasesHtml}
      <div id="ms-owner-popover" class="ms-owner-popover" style="display:none;"></div>
    </div>
  `;
}

function msGetProject(projectId) {
  if (typeof db !== 'undefined' && Array.isArray(db.projects)) {
    return db.projects.find((x) => String(x.id) === String(projectId));
  }
  return null;
}

function msCommit(p, actionText = 'Atualizou marcos do projeto') {
  if (typeof persist === 'function') persist(actionText, p);
  if (typeof render === 'function') render();
}

window.msAddPhase = function (projectId) {
  const p = msGetProject(projectId);
  if (!p) return;
  const phases = ensureProjectMilestones(p);
  const idx = phases.length + 1;
  phases.push({
    id: 'phase_' + Date.now(),
    title: 'Fase ' + idx,
    color: PHASE_PALETTE[(idx - 1) % PHASE_PALETTE.length],
    items: [
      { id: 'm_' + Date.now(), title: 'Novo marco', ownerId: '', status: 'progress', progress: 0 },
    ],
  });
  msCommit(p, 'Adicionou fase nos marcos');
};

window.msUpdatePhaseTitle = function (projectId, phaseId, newTitle) {
  const p = msGetProject(projectId);
  if (!p) return;
  const phase = ensureProjectMilestones(p).find((x) => x.id === phaseId);
  if (phase && newTitle.trim()) {
    phase.title = newTitle.trim();
    if (typeof persist === 'function') persist('Renomeou fase dos marcos', p);
  }
};
window.msDeletePhase = function (projectId, phaseId) {
  const p = msGetProject(projectId);
  if (!p) return;
  const phases = ensureProjectMilestones(p);
  const phase = phases.find((x) => x.id === phaseId);
  if (!phase) return;

  if (
    Array.isArray(phase.items) &&
    phase.items.length > 0 &&
    !confirm(`Deseja excluir a fase "${phase.title}" e suas ${phase.items.length} tarefa(s)?`)
  ) {
    return;
  }

  p.milestones = phases.filter((x) => x.id !== phaseId);
  msCommit(p, 'Removeu fase dos marcos');
};

window.msAddItem = function (projectId, phaseId) {
  const p = msGetProject(projectId);
  if (!p) return;
  const phase = ensureProjectMilestones(p).find((x) => x.id === phaseId);
  if (!phase) return;
  phase.items.push({
    id: 'm_' + Date.now(),
    title: 'Novo marco',
    ownerId: '',
    status: 'progress',
    progress: 20,
  });
  msCommit(p, 'Adicionou marco ao projeto');
};

window.msUpdateItem = function (projectId, phaseId, itemId, field, value) {
  const p = msGetProject(projectId);
  if (!p) return;
  const phase = ensureProjectMilestones(p).find((x) => x.id === phaseId);
  const item = phase?.items.find((x) => x.id === itemId);
  if (item) {
    item[field] = value;
    if (typeof persist === 'function') persist('Editou marco do projeto', p);
  }
};

window.msDeleteItem = function (projectId, phaseId, itemId) {
  const p = msGetProject(projectId);
  if (!p) return;
  const phase = ensureProjectMilestones(p).find((x) => x.id === phaseId);
  if (phase) {
    phase.items = phase.items.filter((x) => x.id !== itemId);
    msCommit(p, 'Removeu marco do projeto');
  }
};

window.msSetStatus = function(projectId,phaseId,itemId,value) {
 const p=msGetProject(projectId);if(!p||!canEdit(p)||!Object.hasOwn(MILESTONE_STATUS,value))return;
 const item=ensureProjectMilestones(p).find(ph=>ph.id===phaseId)?.items.find(it=>it.id===itemId);if(!item)return;
 const before=MILESTONE_STATUS[msStatusKey(item.status)].label;
 if(msStatusKey(item.status)===value)return;
 item.status=value;if(value==='done'&&item.progress<100)item.progress=100;
 persist('Alterou status do marco no BI',p,before,MILESTONE_STATUS[value].label,'Status do marco · '+item.title);render();
};
window.msCycleStatus = function(projectId,phaseId,itemId) {
 const p=msGetProject(projectId);if(!p)return;
 const item=ensureProjectMilestones(p).find(ph=>ph.id===phaseId)?.items.find(it=>it.id===itemId);
 if(item)msSetStatus(projectId,phaseId,itemId,MILESTONE_STATUS[msStatusKey(item.status)].next);
};

window.msClickTimeline = function (ev, projectId, phaseId, itemId) {
  const track = ev.currentTarget.querySelector('.ms-bar-track');
  if (!track) return;
  const rect = track.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
  const snapped = Math.round((ratio * 100) / 5) * 5;
  const p = msGetProject(projectId);
  if (!p) return;
  const phase = ensureProjectMilestones(p).find((x) => x.id === phaseId);
  const item = phase?.items.find((x) => x.id === itemId);
  if (item) {
    item.progress = snapped;
    msCommit(p, 'Atualizou progresso do marco');
  }
};

let msOwnerPicker=null, msOwnerSearchTimer=null;
window.msOpenOwnerMenu = function(ev,projectId,phaseId,itemId) {
 ev.stopPropagation();const p=msGetProject(projectId);if(!p||!canEdit(p))return;
 const item=ensureProjectMilestones(p).find(ph=>ph.id===phaseId)?.items.find(it=>it.id===itemId);if(!item)return;
 const user=getSystemUsersList().find(u=>String(u.id||u.email)===String(item.ownerId));
 msOwnerPicker={projectId,phaseId,itemId,users:new Map(),offset:0,query:'',hasMore:false,request:0,selected:item.ownerId?{id:item.ownerId,name:item.ownerName||user?.name||user?.email||'Responsável cadastrado'}:null};
 clearTimeout(msOwnerSearchTimer);
 modal('Responsável pelo marco',`<form id="msOwnerForm" onsubmit="event.preventDefault();msSaveOwner()"><div class="field"><label for="msOwnerMode">Como deseja informar?</label><select id="msOwnerMode" onchange="msToggleOwnerMode()"><option value="user" ${item.ownerType!=='manual'?'selected':''}>Selecionar usuário cadastrado</option><option value="manual" ${item.ownerType==='manual'?'selected':''}>Digitar nome</option></select></div><div id="msOwnerRegistered"><div class="field"><label for="msOwnerSearch">Buscar usuário</label><input id="msOwnerSearch" type="search" maxlength="100" placeholder="Nome ou e-mail" oninput="msSearchOwners(this.value)"></div><p id="msOwnerSelection" aria-live="polite"></p><div id="msOwnerOptions" class="ms-owner-options"></div><button type="button" id="msOwnerMore" class="btn" hidden onclick="msLoadOwners(true)">Mostrar mais usuários</button></div><div id="msOwnerManual" class="field" hidden><label for="msOwnerName">Nome do responsável</label><input id="msOwnerName" maxlength="120" value="${esc(item.ownerName || '')}" placeholder="Digite o nome"></div><div class="actions"><button type="button" class="btn" onclick="msClearOwner()">Sem responsável</button><button type="submit" class="btn primary">Salvar responsável</button></div></form>`,btn('Cancelar','closeModal()','close'));
 msRenderOwnerSelection();msToggleOwnerMode();
};
window.msToggleOwnerMode=function(){const manual=document.getElementById('msOwnerMode')?.value==='manual';document.getElementById('msOwnerRegistered').hidden=manual;document.getElementById('msOwnerManual').hidden=!manual;if(!manual && msOwnerPicker && !msOwnerPicker.users.size)msLoadOwners();};
function msRenderOwnerSelection(){const el=document.getElementById('msOwnerSelection');if(el)el.textContent=msOwnerPicker?.selected?'Selecionado: '+msOwnerPicker.selected.name:'Nenhum usuário selecionado.';}
window.msSearchOwners=function(value){if(!msOwnerPicker)return;msOwnerPicker.query=value.trim();msOwnerPicker.request++;clearTimeout(msOwnerSearchTimer);const state=msOwnerPicker;msOwnerSearchTimer=setTimeout(()=>{if(msOwnerPicker===state)msLoadOwners();},220);};
window.msLoadOwners=async function(more=false){
 const state=msOwnerPicker,list=document.getElementById('msOwnerOptions');if(!state||!list)return;
 const request=++state.request;if(!more){state.offset=0;state.users.clear();}list.textContent='Carregando usuários…';const moreButton=document.getElementById('msOwnerMore');moreButton.disabled=true;
 try{if(!window.sb)throw new Error('Conexão ao servidor indisponível.');const result=await window.sb.rpc('secap_meeting_users',{p_search:state.query,p_offset:state.offset});
 if(state!==msOwnerPicker || request!==state.request || !document.getElementById('msOwnerForm'))return;
 if(result.error)throw result.error;if(!Array.isArray(result.data?.users))throw new Error('Lista de usuários inválida.');
 for(const u of result.data.users)state.users.set(u.id,u);state.offset+=result.data.users.length;state.hasMore=!!result.data.hasMore;
 list.innerHTML=[...state.users.values()].map((u,i)=>`<button type="button" class="ms-owner-option" onclick="msPickOwner(${i})"><strong>${esc(u.name||u.email)}</strong><small>${esc(u.email)}</small></button>`).join('')||'<p>Nenhum usuário encontrado.</p>';moreButton.hidden=!state.hasMore;moreButton.disabled=false;
 }catch(error){if(state!==msOwnerPicker||request!==state.request)return;list.innerHTML='<p role="alert">Não foi possível carregar os usuários. Você pode digitar o nome ou tentar novamente.</p><button type="button" class="btn" onclick="msLoadOwners()">Tentar novamente</button>';moreButton.hidden=true;}
};
window.msPickOwner=function(index){const u=[...msOwnerPicker.users.values()][index];if(!u)return;msOwnerPicker.selected={id:u.id,name:u.name||u.email};msRenderOwnerSelection();};
window.msSaveOwner=function(){
 const state=msOwnerPicker;if(!state||!document.getElementById('msOwnerForm'))return;const p=msGetProject(state.projectId);if(!p||!canEdit(p))return;
 const item=ensureProjectMilestones(p).find(ph=>ph.id===state.phaseId)?.items.find(it=>it.id===state.itemId);if(!item)return;
 const manual=document.getElementById('msOwnerMode').value==='manual',name=manual?document.getElementById('msOwnerName').value.trim():state.selected?.name;
 if(!name||name.length>120)return notify(manual?'Informe o nome do responsável.':'Selecione um usuário cadastrado.','error');
 const before=item.ownerName||getSystemUsersList().find(u=>String(u.id||u.email)===String(item.ownerId))?.name||'—';
 item.ownerId=manual?'':state.selected.id;item.ownerName=name;item.ownerType=manual?'manual':'user';
 closeModal();persist('Alterou responsável do marco no BI',p,before,name,'Responsável do marco · '+item.title);render();
};
window.msClearOwner=function(){const state=msOwnerPicker;if(!state)return;const p=msGetProject(state.projectId);if(!p||!canEdit(p))return;const item=ensureProjectMilestones(p).find(ph=>ph.id===state.phaseId)?.items.find(it=>it.id===state.itemId);if(!item)return;const before=item.ownerName||'—';item.ownerId='';item.ownerName='';item.ownerType='';closeModal();persist('Removeu responsável do marco no BI',p,before,'—','Responsável do marco · '+item.title);render();};
window.msSelectOwner=function(projectId,phaseId,itemId,ownerId){const p=msGetProject(projectId);if(!p||!canEdit(p))return;const item=ensureProjectMilestones(p).find(ph=>ph.id===phaseId)?.items.find(it=>it.id===itemId);const u=getSystemUsersList().find(u=>String(u.id||u.email)===String(ownerId));if(!item||(!u&&ownerId))return;item.ownerId=ownerId;item.ownerName=u?.name||u?.email||'';item.ownerType=ownerId?'user':'';msCommit(p,'Alterou responsável do marco no BI');};

function biTerms(p, rs) {
  const terms = db.terms.filter((t) => t.project === p.id);
  return `<div class="stats" style="grid-template-columns:repeat(3,1fr)">${biMetric('TERMOS VINCULADOS', terms.length, 'Instrumentos associados a esta pasta', 'file')}${biMetric('VALOR DOS TERMOS', compact(terms.reduce((a, t) => a + (Number(t.value) || 0), 0)), 'Cada termo contado uma única vez', 'money', '#169dc4')}${biMetric('VIGÊNCIAS VENCIDAS', terms.filter((t) => t.deadline && t.deadline < today() && t.status !== 'Concluído').length, 'Termos ainda não concluídos', 'calendar', '#f37021')}</div><p class="metric-note">Os termos são relacionados à pasta do projeto. Seus valores não são somados aos investimentos das obras, evitando contagem em duplicidade. Filtros de obras não alteram os termos vinculados.</p>${terms.map((t) => `<article class="priority-card"><div class="priority-top"><div><div class="eyebrow">${esc(t.number)}</div><h3>${esc(t.name)}</h3><span class="subtitle">${esc(t.partner || 'Parceiro não informado')}</span></div>${badge(t.status)}</div><div class="priority-flow"><div><small>Valor do termo</small><p>${money(t.value)}</p></div><div><small>Vigência</small><p>${date(t.deadline)}</p></div><div><small>Próxima providência</small><p>${esc(t.next || 'Definir providência')}</p></div></div><button class="textbtn" onclick="editTerm('${t.id}')">Abrir termo ${icon('arrow')}</button></article>`).join('') || empty('Nenhum termo vinculado', 'Cadastre um termo e selecione este projeto.')}`;
}
function configureBI(id) {
  const p = visible().find((p) => p.id === id);
  if (!p || !canEdit(p)) return;
  const specs = [
    ['status', 'Situação / status', ['select']],
    ['stage', 'Macroetapa / pipeline', ['select']],
    ['budget', 'Investimento previsto', ['currency', 'number']],
    ['spent', 'Valor executado', ['currency', 'number']],
    ['raised', 'Valor captado', ['currency', 'number']],
    ['progress', 'Avanço físico (%)', ['number']],
    ['deadline', 'Prazo de encerramento', ['date']],
    ['owner', 'Responsável', ['text', 'responsible', 'select']],
    ['agency', 'Órgão', ['text', 'select']],
    ['priority', 'Prioridade', ['text', 'select']],
    ['source', 'Fonte / programa', ['text', 'select']],
  ];
  modal(
    'Configurar o BI deste projeto',
    `<p class="subtitle">${esc(p.name)} · Escolha um modelo e associe os campos existentes.</p><form id="biConfig" onsubmit="event.preventDefault();saveBIConfig('${id}')"><div class="template-grid">${Object.entries(
      biTemplates
    )
      .map(
        ([k, t]) =>
          `<label class="template-option"><input type="radio" name="template" value="${k}" ${(p.biTemplate || 'obras') === k ? 'checked' : ''}><span><b>${t.name}</b><small>${t.description}</small></span></label>`
      )
      .join(
        ''
      )}</div><h3>De onde vêm os indicadores?</h3><p class="metric-note">Vincule cada indicador ao campo correspondente. Sem vínculo ou valor preenchido, o painel mostra “—”.</p><div class="twocol">${specs
      .map(
        ([key, name, types]) =>
          `<div class="field"><label>${name}</label><select name="map_${key}" aria-label="${name}"><option value="">Não associado</option>${p.fields
            .filter((f) => types.includes(f.type))
            .map(
              (f) =>
                `<option value="${f.id}" ${fieldKey(p, key) === f.id ? 'selected' : ''}>${esc(f.name)}</option>`
            )
            .join('')}</select></div>`
      )
      .join('')}</div></form>`,
    btn('Voltar', 'closeModal()', 'arrow') +
      `<button class="btn primary" form="biConfig" type="submit">Salvar modelo do painel</button>`
  );
}
function saveBIConfig(id) {
  const p = db.projects.find((p) => p.id === id);
  if (!canEdit(p)) return;
  const d = new FormData($('#biConfig')),
    previous = p.biTemplate || 'obras';
  p.biTemplate = d.get('template');
  p.biMapping = Object.fromEntries(
    [...d.entries()].filter(([k]) => k.startsWith('map_')).map(([k, v]) => [k.slice(4), v])
  );
  persist(
    'Configurou modelo de BI',
    p,
    biTemplates[previous]?.name,
    biTemplates[p.biTemplate]?.name
  );
  closeModal();
  if (biSection === 'terms' && p.biTemplate !== 'termos') biSection = 'overview';
  render();
  notify('Modelo e indicadores atualizados para este projeto.');
}
function exportBI(id) {
  const p = visible().find((p) => p.id === id);
  if (!p) return;
  const rs = biRows(p),
    q = (v) =>
      '"' +
      String(v ?? '')
        .replace(/"/g, '""')
        .replace(/^[=+@-]/, "'$&") +
      '"',
    csv =
      '\ufeff' +
      [
        [
          p.fields
            .map((f) => f.name)
            .map(q)
            .join(';'),
        ],
        ...rs.map((r) => p.fields.map((f) => q(r[f.id])).join(';')),
      ].join('\r\n');
  const a = document.createElement('a'),
    url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.href = url;
  a.download = 'secap-bi-projeto.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  notify('Seleção atual do BI exportada.');
}
const adminSections = [['access', 'Acesso ao sistema', 'user']];
/* Administração: área exclusiva do administrador para aprovar ou recusar o acesso ao sistema. */
admin = function () {
  if (!isSysAdmin())
    return empty(
      'Acesso do administrador',
      'Esta área está disponível somente para o perfil administrador.'
    );
  adminSection = 'access';
  return (
    backLink() +
    `<section class="admin-institution"><div><div class="institution-label">PREFEITURA DE GOIÂNIA · SECAP<br>${esc(db.portalSettings.department.replace(/^Secretaria Municipal de /, ''))}</div><h1>Administração</h1><p>Aprove ou recuse o acesso ao sistema de quem se cadastrou no SECAP.</p></div><div class="admin-badge">${icon('shield')}Administrador</div></section>` +
    adminSolicitacoes() +
    adminAccess()
  );
};
function adminSolicitacoes() {
  return `<section class=\"panel solicitacoes-panel\"><div class=\"panelhead\"><div><h2>Solicitações</h2><p class=\"subtitle\">Acompanhe e responda as solicitações no sistema de solicitações da SECAP. O link abre em uma nova aba.</p></div><button class=\"btn primary\" type=\"button\" onclick=\"openSolicitacoes()\">${icon('link')} Ir para solicitações</button></div></section>`;
}

function setAdminSection() {
  adminSection = 'access';
  render();
}
function adminAccess() {
  return `<section class="panel access-panel"><div class="panelhead"><div><h2>Acesso ao sistema</h2><p class="subtitle">Cadastros feitos na tela de login. Decida quem pode ou não acessar.</p></div><button class="btn" type="button" onclick="loadAccountRequests()">${icon('history')} Atualizar</button></div><div class="panelbody" id="accountRequests"><div class="access-loading"><span class="spinner"></span><span>Consultando os cadastros…</span></div></div></section>`;
}
function adminSettings() {
  return '';
}
function savePortalSettings() {
  if (me()?.role !== 'Administrador') return;
  const d = new FormData($('#portalSettingsForm'));
  db.portalSettings.title = String(d.get('title')).trim();
  db.portalSettings.department = String(d.get('department')).trim();
  persist('Atualizou preferências', 'Configurações', '', 'Identificação do portal');
  render();
  notify('Preferências salvas no servidor.');
}
function toggleAssistant(value) {
  if (me()?.role !== 'Administrador') return;
  db.portalSettings.internalAssistant = value;
  persist(
    'Configurou assistente interno',
    'Configurações',
    '',
    value ? 'Habilitado' : 'Desabilitado'
  );
  notify('Preferência atualizada.');
}
function adminAudit() {
  return `<div class="pagehead"><div><h2>Registros do sistema</h2><p class="subtitle" style="margin-top:7px">Ações e alterações locais, em ordem de atualização.</p></div>${btn('Atualizar', 'render()', 'history')}</div><section class="panel"><div class="tablewrap"><table><thead><tr><th>Data e hora</th><th>Usuário</th><th>Ação / local</th><th>Antes</th><th>Depois</th></tr></thead><tbody>${db.logs.map((l) => `<tr><td>${new Date(l.at).toLocaleString('pt-BR')}</td><td>${esc(l.who)}</td><td><strong>${esc(l.action)}</strong><div class="desc">${esc(l.where)}</div></td><td style="white-space:normal;max-width:190px">${esc(l.before || '—')}</td><td style="white-space:normal;max-width:220px">${esc(l.after || '—')}</td></tr>`).join('')}</tbody></table></div>${db.logs.length ? '' : empty('Sem alterações registradas', 'As ações do portal aparecerão nesta área.')}</section><p class="metric-note" style="margin-top:18px">Demonstração de histórico local. A auditoria protegida contra alterações depende da integração ao servidor.</p>`;
}
// Add quick access to each project's BI from its data folder, preserving all existing editing flows.
const projectViewOriginal = projectView;
projectView = function () {
  let html = projectViewOriginal();
  const p = visible().find((p) => p.id === projectId);
  if (p)
    html = html.replace(
      '<section class="panel"><div class="panelhead"><h2>Obras e registros</h2>',
      `<div class="summary-strip">${icon('chart')}<p style="flex:1"><strong>Seu projeto também tem um BI.</strong> Explore indicadores, pipeline, prioridades e financeiro a partir destes registros.</p><button class="btn primary" onclick="openBI('${p.id}')">${icon('chart')}Abrir BI</button></div><section class="panel"><div class="panelhead"><h2>Obras e registros</h2>`
    );
  return html;
};
// Keep the previous step inside modal navigation; ESC and the close icon remain available.
const modalOriginal = modal;
modal = function (title, body, footer = '') {
  modalOriginal(title, body, footer);
  const dialog = $('.dialoghead');
  if (dialog) {
    dialog.insertAdjacentHTML(
      'afterbegin',
      `<button class="iconbtn" style="margin-right:10px" aria-label="Voltar e fechar esta janela" onclick="closeModal()">${icon('arrow').replace('<svg ', '<svg style="transform:rotate(180deg)" ')}</button>`
    );
    const h = dialog.querySelector('h2');
    if (h) h.style.flex = '1';
  }
};
const switchProfileOriginal = switchProfile;
switchProfile = function (id) {
  biProject = '';
  biSection = 'overview';
  adminSection = 'system';
  routeTrail = [];
  switchProfileOriginal(id);
};
const logoutOriginal = logout;
logout = function () {
  biProject = '';
  biSection = 'overview';
  routeTrail = [];
  logoutOriginal();
};
function openPipelineDetail(field, value) {
  routeTrail.push(routeSnapshot());
  biDimension = field;
  biFilter = value;
  biSection = 'details';
  render();
}
function biTemplateContext(p, rs) {
  const model = p.biTemplate || 'obras';
  if (model === 'termos')
    return (
      biTerms(p, rs) + `<div class="section-kicker">Obras e registros vinculados à pasta</div>`
    );
  if (model === 'recursos')
    return `<div class="chart-grid">${chartPanel('Captação por fonte ou programa', 'Valores captados organizados pela origem', groupsChart(p, rs, biField(p, 'source'), 'money', 'raised'), 'O valor captado é tratado separadamente do previsto e do executado.')}${chartPanel('Oportunidades na jornada', 'Distribuição pelo estágio das iniciativas', groupsChart(p, rs, biField(p, 'stage')))}</div>`;
  if (model === 'fisicofin') {
    const physical = metricAvg(rs, p, 'progress'),
      budget = metricTotal(rs, p, 'budget'),
      spent = metricTotal(rs, p, 'spent'),
      percent = budget && spent !== null ? Math.round((spent / budget) * 100) : null;
    return `<section class="model-context"><span class="folder">${icon('chart')}</span><div><h3>Acompanhamento físico-financeiro</h3><p>Avanço físico médio: <b>${physical === null ? '—' : physical + '%'}</b> · Execução financeira: <b>${percent === null ? '—' : percent + '%'}</b>. Compare as duas bases e confira os valores por obra.</p></div><button class="textbtn" onclick="switchBiSection('finance')">Analisar execução ${icon('arrow')}</button></section>`;
  }
  if (model === 'auto')
    return `<section class="model-context"><span class="folder">${icon('dashboard')}</span><div><h3>Painel orientado aos campos do projeto</h3><p>As listas viram distribuições; valores e números formam indicadores; datas alimentam o acompanhamento de prazos.</p></div><button class="textbtn" onclick="switchBiSection('details')">Conferir dados ${icon('arrow')}</button></section>`;
  return '';
}
render();

/* ============================================================================
   SECAP · CONTROLE GRANULAR DE PERMISSÕES POR CAMPO E OBRA (ADMINISTRAÇÃO)
   ============================================================================ */

if (!db.fieldPermissions) {
  // Estrutura: { [userId]: { [projectId]: ['fieldId1', 'fieldId2', ...] } }
  db.fieldPermissions = {};
}

let permSelectedUser = '',
  permSelectedProject = '';

// 1. Reestrutura a aba Administração com sub-abas no padrão visual do portal
admin = function () {
  if (!isSysAdmin())
    return empty(
      'Acesso do administrador',
      'Esta área está disponível somente para o perfil administrador.'
    );

  if (!['access', 'field-perms', 'project-check'].includes(adminSection)) {
    adminSection = 'access';
  }

  return (
    backLink() +
    `<section class="admin-institution">
      
      <div>
        <div class="institution-label">PREFEITURA DE GOIÂNIA · SECAP<br>${esc(db.portalSettings.department.replace(/^Secretaria Municipal de /, ''))}</div>
        <h1>Administração</h1>
        <p>Gerencie o acesso ao sistema e defina quais campos cada usuário pode editar por projeto.</p>
      </div>
      <div class="admin-badge">${icon('shield')}Administrador</div>
    </section>
    <nav class="subtabs" aria-label="Sub-abas da administração">
      <button class="${adminSection === 'access' ? 'active' : ''}" aria-current="${adminSection === 'access' ? 'page' : 'false'}" onclick="setAdminSection('access')">
        ${icon('user')}Acesso ao sistema
      </button>
      <button class="${adminSection === 'field-perms' ? 'active' : ''}" aria-current="${adminSection === 'field-perms' ? 'page' : 'false'}" onclick="setAdminSection('field-perms')">
        ${icon('edit')}Permissões do projeto
      </button>
      <button class="${adminSection === 'project-check' ? 'active' : ''}" aria-current="${adminSection === 'project-check' ? 'page' : 'false'}" onclick="setAdminSection('project-check')">${icon('shield')}Verificação do projeto</button>
    </nav>` +
    (adminSection === 'project-check' ? adminProjectVerification() : adminSection === 'field-perms' ? adminFieldPermissions() : adminSolicitacoes() + adminAccess())
  );
};

let cachedServerUsers = null;

let fieldPermUsersCache = null;

setAdminSection = function (section = 'access') {
  adminSection = section;
  render();
  if (section === 'access' && typeof loadAccountRequests === 'function') {
    loadAccountRequests();
  }
  if (section === 'field-perms') {
    ensureFieldPermUsersLoaded();
  }
};

async function ensureFieldPermUsersLoaded() {
  try {
    const response = await fetch('/api/account-requests', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok && Array.isArray(result.requests)) {
      fieldPermUsersCache = result.requests;
      render();
    }
  } catch (error) {
    console.error('Erro ao consultar usuários aprovados:', error);
  }
}

function getApprovedPortalUsers() {
  const reqs = Array.isArray(fieldPermUsersCache)
    ? fieldPermUsersCache
    : typeof accountRequestsCache !== 'undefined' && Array.isArray(accountRequestsCache)
      ? accountRequestsCache
      : [];

  // A RPC do Supabase retorna status 'aprovada' e profile_role='usuario'.
  // O ID disponível aqui é o da solicitação, não o UUID de auth.users;
  // por isso o e-mail é a chave estável usada também na verificação da edição.
  return reqs.filter((r) => {
    const status = String(r.status || '')
      .trim()
      .toLowerCase();
    const role = String(r.profile_role || r.role || '')
      .trim()
      .toLowerCase();
    const email = String(r.email || '')
      .trim()
      .toLowerCase();

    const isApproved = ['aprovada', 'aprovado', 'approved', 'active', 'ativo'].includes(status);
    const isUser = !role || ['usuario', 'usuário', 'user'].includes(role);
    const isAdmin =
      ['administrador', 'admin'].includes(role) ||
      email === 'secap@gmail.com' ||
      Boolean(r.isAdmin);

    return isApproved && isUser && !isAdmin && Boolean(email);
  });
}

async function loadFieldPermUsers() {
  try {
    // Usa exatamente o mesmo endpoint da loadAccountRequests()
    const res = await fetch('/api/account-requests');
    if (!res.ok) return;

    const data = await res.json();
    const list = Array.isArray(data) ? data : data.requests || data.items || [];

    // Filtra apenas os usuários que tiveram o acesso aprovado
    const approved = list.filter((r) =>
      ['approved', 'aprovado'].includes(String(r.status || '').toLowerCase())
    );

    // Ignora administradores, pois já possuem acesso irrestrito
    cachedServerUsers = approved.filter(
      (u) => u.role !== 'Administrador' && u.role !== 'admin' && !u.isAdmin
    );

    render();
  } catch (err) {
    console.error('Erro ao carregar usuários aprovados:', err);
  }
}

// 2. Renderização da Sub-aba "Permissões do projeto"
function adminFieldPermissions() {
  const users = getApprovedPortalUsers();
  const projects = Array.isArray(db.projects) ? db.projects : [];

  if (
    permSelectedUser &&
    !users.some(
      (u) =>
        String(u.email || '')
          .trim()
          .toLowerCase() === String(permSelectedUser).trim().toLowerCase()
    )
  ) {
    permSelectedUser = '';
  }
  if (permSelectedProject && !projects.some((p) => String(p.id) === String(permSelectedProject))) {
    permSelectedProject = '';
  }

  const selectedProjObj = projects.find((p) => String(p.id) === String(permSelectedProject));
  const userMap = db.fieldPermissions?.[permSelectedUser] || {};
  // Uma regra só existe quando o administrador salvou explicitamente a lista de campos permitidos.
  const hasExplicitRule =
    permSelectedUser && permSelectedProject && Array.isArray(userMap[permSelectedProject]);

  // Segurança por padrão: sem regra explícita, nenhum campo pode ser editado.
  const allowedFields = hasExplicitRule ? userMap[permSelectedProject] : [];
  const selectedUserItem = permSelectedUser
    ? users.find(
        (u) =>
          String(u.email || '')
            .trim()
            .toLowerCase() === String(permSelectedUser).trim().toLowerCase()
      )
    : null;
  const accessNotice = fieldPermAccessNotice(selectedUserItem, selectedProjObj);

  return `
    <section class="panel">
      <div class="panelhead">
        <div>
          <h2>Permissões de edição por obra e campo</h2>
          <p class="subtitle">Selecione um usuário e um projeto para restringir exatamente quais colunas/campos ele poderá alterar.</p>
        </div>
        ${
          permSelectedUser && permSelectedProject
            ? `<div style="display:flex;gap:8px;flex-wrap:wrap">
                <button type="button" class="btn" onclick="toggleAllPermFields(true)" title="Permitir edição de todos os campos">${icon('check')}Marcar todos</button>
                <button type="button" class="btn" onclick="toggleAllPermFields(false)" title="Bloquear edição de todos os campos">${icon('close')}Desmarcar todos</button>
              </div>`
            : ''
        }
      </div>
      <div class="panelbody">
        <div class="twocol" style="margin-bottom:20px">
          <div class="field">
            <label for="permUserSelect">1. Usuário</label>
            <select id="permUserSelect" onchange="permSelectedUser=this.value;render()">
              <option value="">Selecione um usuário...</option>
              ${users
                .map((u) => {
                  // O endpoint admin_list_account_requests não expõe auth.uid();
                  // usar o e-mail evita salvar regras sob o ID numérico da solicitação.
                  const uid = String(u.email || u.user_id || u.id)
                    .trim()
                    .toLowerCase();
                  const displayName = u.name || u.full_name || u.nome || u.email;
                  const label = `${displayName}${u.email && displayName !== u.email ? ' (' + u.email + ')' : ''}`;
                  return `<option value="${esc(uid)}" ${String(permSelectedUser) === uid ? 'selected' : ''}>${esc(label)}</option>`;
                })
                .join('')}
            </select>
          </div>
          <div class="field">
            <label for="permProjectSelect">2. Projeto / Pasta de Obras</label>
            <select id="permProjectSelect" ${!permSelectedUser ? 'disabled' : ''} onchange="permSelectedProject=this.value;render()">
              <option value="">Selecione um projeto...</option>
              ${projects
                .map(
                  (p) =>
                    `<option value="${esc(p.id)}" ${String(permSelectedProject) === String(p.id) ? 'selected' : ''}>${esc(p.name)} (${(p.records || []).length} registros)</option>`
                )
                .join('')}
            </select>
          </div>
        </div>

        ${
          !permSelectedUser || !permSelectedProject
            ? empty(
                'Selecione usuário e projeto',
                'Escolha um usuário e a pasta de obras acima para configurar os campos permitidos.'
              )
            : !selectedProjObj?.fields?.length
              ? empty(
                  'Projeto sem campos cadastrados',
                  'Este projeto ainda não possui campos configurados.'
                )
              : `
                ${accessNotice}
                <div class="summary-strip" style="margin-bottom:18px">
                  ${icon('shield')}
                  <p>
                    <strong>${hasExplicitRule ? 'Regra personalizada ativa.' : 'Padrão restrito (nenhum campo liberado).'}</strong>
                    Marque abaixo apenas os campos que este usuário pode editar em <strong>${esc(selectedProjObj.name)}</strong>.
                  </p>
                </div>
                <form id="fieldPermsForm" onsubmit="event.preventDefault();saveFieldPermissions()">
                  <div class="template-grid" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr))">
                    ${selectedProjObj.fields
                      .map((f) => {
                        const checked = allowedFields.includes(f.id);
                        return `
                          <label class="template-option" style="align-items:center">
                            <input type="checkbox" name="perm_field" value="${esc(f.id)}" ${checked ? 'checked' : ''}>
                            <span>
                              <b>${esc(f.name)}</b>
                              <small>ID: ${esc(f.id)} · Tipo: ${esc(f.type)}</small>
                            </span>
                          </label>
                        `;
                      })
                      .join('')}
                  </div>
                  <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:22px;padding-top:16px;border-top:1px solid var(--line,#e2e8f0)">
                    ${
                      hasExplicitRule
                        ? `<button type="button" class="btn" onclick="resetFieldPermissions()">Restaurar padrão (bloquear todos)</button>`
                        : ''
                    }
                    <button type="submit" class="btn primary">${icon('check')}Salvar permissões de campos</button>
                  </div>
                </form>
                ${rowFilterPanel(selectedProjObj)}
              `
        }
      </div>
    </section>
  `;
}

// Avisos de contexto: as permissões por campo só têm efeito se o usuário também tiver
// "Visualizar e editar" e acesso ao projeto (ambos definidos em Acesso ao sistema).
function fieldPermAccessNotice(item, project) {
  if (!item || !project) return '';
  const notes = [];
  if (item.obras_access !== 'editar') {
    notes.push(
      `<strong>${esc(item.name || item.email)} está como “Somente visualizar”.</strong> Os campos marcados abaixo só valem quando o acesso às obras for “Visualizar e editar”.` +
        ` <button type="button" class="btn small" onclick="grantEditFromFieldPerms(${Number(item.id)})">Liberar edição</button>`
    );
  }
  if (
    item.project_scope === 'selected' &&
    !(item.project_ids || []).map(String).includes(String(project.id))
  ) {
    notes.push(
      `<strong>Este usuário não tem acesso ao projeto ${esc(project.name)}.</strong> Inclua o projeto em “Projetos permitidos”, na sub-aba Acesso ao sistema, para que as permissões abaixo tenham efeito.`
    );
  }
  return notes
    .map(
      (html) =>
        `<div class="summary-strip" style="margin-bottom:12px;border-color:#f59e0b;background:#fffbeb">${icon('shield')}<p>${html}</p></div>`
    )
    .join('');
}

async function grantEditFromFieldPerms(requestId) {
  if (!isSysAdmin()) return;
  const id = Number(requestId);
  if (!Number.isSafeInteger(id) || id < 1) return;
  try {
    const response = await fetch('/api/account-requests/obras-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, access: 'editar' }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Não foi possível alterar a permissão.');
    // As duas listas (desta sub-aba e de Acesso ao sistema) guardam cópias separadas.
    [fieldPermUsersCache, typeof accountRequestsCache !== 'undefined' ? accountRequestsCache : null]
      .filter(Array.isArray)
      .forEach((list) => {
        const found = list.find((r) => Number(r.id) === id);
        if (found) found.obras_access = 'editar';
      });
    render();
    notify('Acesso às obras alterado para “Visualizar e editar”.', 'success');
  } catch (error) {
    notify(`Erro ao alterar a permissão: ${error.message}`, 'error');
  }
}

function toggleAllPermFields(checked) {
  const form = document.getElementById('fieldPermsForm');
  if (!form) return;

  form.querySelectorAll('input[name="perm_field"]').forEach((field) => {
    field.checked = Boolean(checked);
  });
}

function saveFieldPermissions() {
  if (!isSysAdmin() || !permSelectedUser || !permSelectedProject) return;
  const checked = Array.from(
    document.querySelectorAll('#fieldPermsForm input[name="perm_field"]:checked')
  ).map((el) => el.value);

  if (!db.fieldPermissions[permSelectedUser]) {
    db.fieldPermissions[permSelectedUser] = {};
  }
  db.fieldPermissions[permSelectedUser][permSelectedProject] = checked;

  const u = getApprovedPortalUsers().find(
    (x) =>
      String(x.email || '')
        .trim()
        .toLowerCase() === String(permSelectedUser).trim().toLowerCase()
  );
  const p = db.projects.find((x) => String(x.id) === String(permSelectedProject));

  persist(
    'Configurou permissões de campos',
    `${u?.name || u?.email || permSelectedUser} · ${p?.name || permSelectedProject}`,
    '',
    `${checked.length} campo(s) liberado(s)`
  );
  render();
  notify('Permissões de campos salvas com sucesso.');
}

function resetFieldPermissions() {
  if (!isSysAdmin() || !permSelectedUser || !permSelectedProject) return;
  if (db.fieldPermissions?.[permSelectedUser]) {
    delete db.fieldPermissions[permSelectedUser][permSelectedProject];
  }
  persist('Restaurou padrão de permissões', permSelectedProject, '', 'Todos os campos bloqueados');
  render();
  notify('Padrão restaurado: nenhum campo liberado para este usuário.');
}

/* ---------------------------------------------------------------------------
   Filtro de obras por usuário (opcional)
   Estrutura: db.rowFilters[email][projectId] = { field, values: [...] }
   Aplicado no banco (RLS em public.obras, função secap_private.obra_allowed):
   o usuário só lê, edita ou exclui obras cujo campo tenha um dos valores.
   --------------------------------------------------------------------------- */
if (!db.rowFilters || typeof db.rowFilters !== 'object') db.rowFilters = {};

// Tipos com valores discretos; números/moeda/texto longo não servem como filtro.
const ROW_FILTER_TYPES = ['text', 'select', 'boolean', 'date'];
let rowFilterDraft = null; // { key, field, values: Set<string> }

const rowFilterNorm = (v) =>
  String(v ?? '')
    .trim()
    .toLowerCase();

function savedRowFilter(user = permSelectedUser, projectId = permSelectedProject) {
  const rule = db.rowFilters?.[user]?.[projectId];
  return rule && rule.field && Array.isArray(rule.values) && rule.values.length ? rule : null;
}

function currentRowFilterDraft() {
  const key = `${permSelectedUser}|${permSelectedProject}`;
  if (!rowFilterDraft || rowFilterDraft.key !== key) {
    const saved = savedRowFilter();
    rowFilterDraft = {
      key,
      field: saved?.field || '',
      values: new Set((saved?.values || []).map(String)),
    };
  }
  return rowFilterDraft;
}

// Valores disponíveis: opções do campo + valores realmente presentes nas obras.
function rowFilterValueCounts(project, fieldId) {
  const field = (project.fields || []).find((f) => String(f.id) === String(fieldId));
  const counts = new Map(); // norm -> { label, count }
  const add = (raw, inc) => {
    const label = String(raw ?? '').trim();
    if (!label) return;
    const k = rowFilterNorm(label);
    const item = counts.get(k) || { label, count: 0 };
    item.count += inc;
    counts.set(k, item);
  };
  (Array.isArray(field?.options) ? field.options : []).forEach((o) =>
    add(typeof o === 'object' ? (o.value ?? o.label) : o, 0)
  );
  (project.records || []).forEach((r) => add(r[fieldId], 1));
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR')
  );
}

function rowFilterMatches(project, draft) {
  const wanted = new Set([...draft.values].map(rowFilterNorm));
  return (project.records || []).filter((r) => wanted.has(rowFilterNorm(r[draft.field]))).length;
}

function rowFilterPanel(project) {
  if (!project) return '';
  const draft = currentRowFilterDraft();
  const saved = savedRowFilter();
  const total = (project.records || []).length;
  const fields = (project.fields || []).filter((f) => ROW_FILTER_TYPES.includes(f.type));
  const values = draft.field ? rowFilterValueCounts(project, draft.field) : [];
  const savedField = saved && (project.fields || []).find((f) => f.id === saved.field);

  return `
    <section class="row-filter" style="margin-top:28px;padding-top:22px;border-top:1px solid var(--line,#e2e8f0)">
      <h3 style="margin:0 0 4px">Filtro de obras (opcional)</h3>
      <p class="subtitle" style="margin:0 0 14px">Limite quais obras deste projeto o usuário enxerga. Sem filtro, ele vê todas as obras do projeto. O filtro vale para visualização, edição e exclusão e é aplicado pelo servidor.</p>
      <div class="summary-strip" style="margin-bottom:16px">
        ${icon('shield')}
        <p>${
          saved
            ? `<strong>Filtro ativo:</strong> ${esc(savedField?.name || saved.field)} = ${saved.values.map((v) => `<b>${esc(v)}</b>`).join(', ')}.`
            : '<strong>Sem filtro.</strong> O usuário vê todas as obras deste projeto.'
        }</p>
      </div>
      <div class="field" style="max-width:420px">
        <label for="rowFilterField">Campo da obra usado no filtro</label>
        <select id="rowFilterField" onchange="setRowFilterField(this.value)">
          <option value="">Sem filtro (todas as obras)</option>
          ${fields
            .map(
              (f) =>
                `<option value="${esc(f.id)}" ${draft.field === f.id ? 'selected' : ''}>${esc(f.name)}</option>`
            )
            .join('')}
        </select>
      </div>
      ${
        draft.field
          ? `
        <div style="margin-top:14px">
          <div class="field" style="max-width:420px;margin-bottom:10px">
            <label for="rowFilterSearch">Valores permitidos <small>(marque um ou mais)</small></label>
            ${
              values.length > 12
                ? `<input id="rowFilterSearch" type="search" placeholder="Buscar valor…" oninput="filterRowFilterValues(this.value)">`
                : ''
            }
          </div>
          <div id="rowFilterValues" class="template-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));max-height:340px;overflow:auto">
            ${
              values.length
                ? values
                    .map(
                      (v) => `
              <label class="template-option" style="align-items:center" data-label="${esc(rowFilterNorm(v.label))}">
                <input type="checkbox" value="${esc(v.label)}" ${draft.values.has(v.label) ? 'checked' : ''} onchange="toggleRowFilterValue(this.value,this.checked)">
                <span><b>${esc(v.label)}</b><small>${v.count} obra(s)</small></span>
              </label>`
                    )
                    .join('')
                : '<p class="subtitle">Nenhuma obra deste projeto tem esse campo preenchido.</p>'
            }
          </div>
        </div>`
          : ''
      }
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:18px">
        <span id="rowFilterPreview" class="subtitle">${rowFilterPreviewText(project, draft, total)}</span>
        <div style="display:flex;gap:10px">
          ${saved ? `<button type="button" class="btn" onclick="removeRowFilter()">${icon('close')}Remover filtro</button>` : ''}
          <button type="button" class="btn primary" onclick="saveRowFilter()">${icon('check')}Salvar filtro</button>
        </div>
      </div>
    </section>`;
}

function rowFilterPreviewText(project, draft, total) {
  if (!draft.field) return `O usuário verá as ${total} obras do projeto.`;
  if (!draft.values.size) return 'Marque ao menos um valor (ou escolha “Sem filtro”).';
  return `O usuário verá ${rowFilterMatches(project, draft)} de ${total} obras.`;
}

function setRowFilterField(fieldId) {
  const draft = currentRowFilterDraft();
  draft.field = fieldId;
  draft.values = new Set();
  render();
}

function toggleRowFilterValue(value, checked) {
  const draft = currentRowFilterDraft();
  if (checked) draft.values.add(value);
  else draft.values.delete(value);
  const project = (db.projects || []).find((p) => String(p.id) === String(permSelectedProject));
  const el = document.getElementById('rowFilterPreview');
  if (project && el)
    el.textContent = rowFilterPreviewText(project, draft, (project.records || []).length);
}

function filterRowFilterValues(text) {
  const q = rowFilterNorm(text);
  document.querySelectorAll('#rowFilterValues [data-label]').forEach((el) => {
    el.style.display = !q || el.dataset.label.includes(q) ? '' : 'none';
  });
}

function saveRowFilter() {
  if (!isSysAdmin() || !permSelectedUser || !permSelectedProject) return;
  const draft = currentRowFilterDraft();
  if (!draft.field) return removeRowFilter();
  if (!draft.values.size) {
    notify('Marque ao menos um valor ou escolha “Sem filtro”.', 'error');
    return;
  }
  const project = db.projects.find((x) => String(x.id) === String(permSelectedProject));
  const field = (project?.fields || []).find((f) => f.id === draft.field);
  const values = [...draft.values];
  if (!db.rowFilters[permSelectedUser]) db.rowFilters[permSelectedUser] = {};
  db.rowFilters[permSelectedUser][permSelectedProject] = { field: draft.field, values };
  persist(
    'Configurou filtro de obras',
    `${permSelectedUser} · ${project?.name || permSelectedProject}`,
    '',
    `${field?.name || draft.field} = ${values.join(', ')}`
  );
  render();
  notify('Filtro de obras salvo.');
}

function removeRowFilter() {
  if (!isSysAdmin() || !permSelectedUser || !permSelectedProject) return;
  const had = Boolean(savedRowFilter());
  if (db.rowFilters?.[permSelectedUser]) {
    delete db.rowFilters[permSelectedUser][permSelectedProject];
    if (!Object.keys(db.rowFilters[permSelectedUser]).length) delete db.rowFilters[permSelectedUser];
  }
  rowFilterDraft = null;
  if (had)
    persist(
      'Removeu filtro de obras',
      `${permSelectedUser} · ${permSelectedProject}`,
      '',
      'Todas as obras do projeto'
    );
  render();
  notify(had ? 'Filtro removido: o usuário vê todas as obras do projeto.' : 'Nenhum filtro aplicado.');
}

// 3. Helper de verificação e bloqueio automático no Modal de Edição de Obra
function getAllowedFieldsForCurrentUser(projectId) {
  if (isSysAdmin()) return null; // null = acesso total do administrador
  const user = me() || window.SECAP_MEMBER;
  if (!user) return [];

  const pid = String(projectId);
  const email = String(user.email || window.SECAP_EMAIL || '')
    .trim()
    .toLowerCase();
  const id = String(user.id || '').trim();
  const permissions = db.fieldPermissions || {};
  const byEmail = email ? permissions[email]?.[pid] : null;
  const byId = id ? permissions[id]?.[pid] : null;
  const rules = Array.isArray(byEmail) ? byEmail : Array.isArray(byId) ? byId : null;

  // Ausência de regra não significa liberação: acesso negado por padrão.
  return rules ? rules.map(String) : [];
}

// Aplica as permissões também ao formulário de criação/edição, que é aberto
// diretamente por vários pontos da interface (não apenas por editRecord).
if (typeof openRecordForm === 'function') {
  const openRecordFormOriginal = openRecordForm;
  openRecordForm = function (projId, recId = '') {
    const result = openRecordFormOriginal(projId, recId);
    const allowed = getAllowedFieldsForCurrentUser(projId);
    if (allowed === null) return result;

    const project = (db.projects || []).find((item) => String(item.id) === String(projId));
    const form = document.getElementById('recordForm');
    if (!project || !form) return result;

    project.fields.forEach((field) => {
      if (allowed.includes(String(field.id))) return;
      const input = form.querySelector(`[name="${CSS.escape(String(field.id))}"]`);
      if (!input) return;
      input.disabled = true;
      input.title = 'Você não tem permissão para editar este campo neste projeto.';
      input.setAttribute('aria-disabled', 'true');
      input.style.opacity = '0.6';
      input.style.cursor = 'not-allowed';
    });

    if (!allowed.length) {
      const saveButton = document.querySelector('#modal button[type="submit"][form="recordForm"]');
      if (saveButton) saveButton.disabled = true;
      const notice = document.createElement('p');
      notice.className = 'subtitle';
      notice.style.cssText = 'color:#b45309;margin:12px 0 0';
      notice.textContent =
        'Você não possui permissão para editar campos deste projeto. Solicite a liberação ao administrador.';
      form.appendChild(notice);
    }
    return result;
  };
}

if (typeof editRecord === 'function') {
  const editRecordOriginal = editRecord;
  editRecord = function (projId, recId) {
    editRecordOriginal(projId, recId);

    const allowed = getAllowedFieldsForCurrentUser(projId);
    if (allowed === null) return; // Sem restrição customizada

    const p = db.projects.find((x) => String(x.id) === String(projId));
    if (!p) return;

    const modalEl = $('#modal');
    if (!modalEl) return;

    // Bloqueia todos os inputs/selects/textareas referentes aos campos não autorizados
    p.fields.forEach((f) => {
      if (!allowed.includes(f.id)) {
        const inputs = modalEl.querySelectorAll(
          `[name="${f.id}"], [name="field_${f.id}"], [data-field="${f.id}"], #field_${f.id}`
        );
        inputs.forEach((inp) => {
          inp.disabled = true;
          inp.title = 'Você não tem permissão para editar este campo neste projeto.';
          inp.style.opacity = '0.65';
          inp.style.cursor = 'not-allowed';
        });
      }
    });
  };
}
