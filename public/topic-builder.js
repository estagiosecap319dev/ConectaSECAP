/* Per-topic configuration and compound dimensions. */
let designerTopic = 'overview',
  topicDraft = null;
const compoundBindings = new Map();
function biConfigurationUser() {
  return String(window.SECAP_MEMBER?.email || me()?.email || session || 'anonymous')
    .trim()
    .toLowerCase();
}
const topicTitles = {
  overview: 'Visão geral',
  pipeline: 'Pipeline',
  priorities: 'Prioridades',
  schedule: 'Prazos',
  finance: 'Financeiro',
  details: 'Marcos',
  quality: 'Qualidade',
  documents: 'Documentação',
  territory: 'Território',
  funding: 'Captação',
  terms: 'Termos vinculados',
};
function availableTopics(p) {
  let ids = ['overview', 'pipeline', 'priorities', 'schedule', 'finance', 'quality', 'details'];
  if (p.biTemplate === 'termos') ids.splice(4, 0, 'terms');
  if (p.managementTemplate === 'contratacao') ids.splice(2, 0, 'documents');
  if (p.managementTemplate === 'obras') ids.splice(4, 0, 'territory');
  if (p.managementTemplate === 'recursos') ids.splice(2, 0, 'funding');
  const t = templateDefinitions[p.managementTemplate];
  if (t && t.bi === p.biTemplate) ids = ids.filter((id) => t.tabs.includes(topicTitles[id]));
  return ids;
}
function designScope() {
  return biSection === 'designer' ? designerTopic : topicTitles[biSection] ? biSection : 'overview';
}
getDesign = function (p) {
  const scope = designScope();
  return {
    ...structuredClone(
      p.biUserDesigns?.[biConfigurationUser()]?.[scope] || {
        layout: 'executive',
        kpis: [],
        charts: [],
      }
    ),
    _topic: scope,
  };
};
commitDesign = function (p, d, action = 'Personalizou o BI') {
  const scope = d._topic || designScope();
  if (!canEdit(p)) return false;
  const user = biConfigurationUser();
  p.biUserDesigns ??= {};
  p.biUserDesignPrevious ??= {};
  p.biUserDesigns[user] ??= {};
  p.biUserDesignPrevious[user] ??= {};
  p.biUserDesignPrevious[user][scope] = structuredClone(
    p.biUserDesigns[user][scope] || emptyTopicDesign(scope)
  );
  p.biUserDesigns[user][scope] = structuredClone(d);
  persist(action, p, '', topicTitles[scope] || scope);
  return true;
};
function emptyTopicDesign(scope) {
  return { _topic: scope, layout: 'executive', kpis: [], charts: [] };
}
undoDesign = function (id) {
  const p = visible().find((p) => p.id === id),
    scope = designScope(),
    user = biConfigurationUser();
  if (!p || !canEdit(p) || !p.biUserDesignPrevious?.[user]?.[scope]) return;
  const old = p.biUserDesigns?.[user]?.[scope] || emptyTopicDesign(scope);
  const previous = p.biUserDesignPrevious[user][scope];
  p.biUserDesigns[user] ??= {};
  p.biUserDesignPrevious[user][scope] = old;
  p.biUserDesigns[user][scope] = structuredClone(previous);
  persist('Restaurou composição da aba', p, '', topicTitles[scope]);
  render();
};
resetDesign = function (id) {
  const p = visible().find((p) => p.id === id),
    scope = designScope();
  if (commitDesign(p, emptyTopicDesign(scope), 'Restaurou composição da aba')) {
    closeModal();
    render();
    notify('Composição desta aba restaurada.');
  }
};
function openTopicDesigner(id, scope = biSection) {
  const p = visible().find((p) => p.id === id);
  if (!p || !canEdit(p)) return;
  designerTopic = topicTitles[scope] ? scope : 'overview';
  switchBiSection('designer');
}
openDesigner = function (id) {
  if (id && id !== biProject) openBI(id);
  openTopicDesigner(id, biSection === 'designer' ? designerTopic : biSection);
};
const designerAll = biDesigner;
biDesigner = function (p, rs) {
  if (!availableTopics(p).includes(designerTopic)) designerTopic = 'overview';
  const user = biConfigurationUser();
  const scoped = {
    ...p,
    biDesignPrevious: p.biUserDesignPrevious?.[user]?.[designerTopic],
  };
  let html = designerAll(scoped, rs);
  html = html.replace(
    '<section class="designer-heading">',
    `<div class="topic-designer-selector"><div><label>Qual aba você quer personalizar?</label><select aria-label="Aba do BI a personalizar" onchange="designerTopic=this.value;render()">${availableTopics(
      p
    )
      .map(
        (id) =>
          `<option value="${id}" ${designerTopic === id ? 'selected' : ''}>${topicTitles[id]}</option>`
      )
      .join(
        ''
      )}</select></div><span>Composição individual por usuário, separada em cada aba.</span>${btn('Configurar agrupamentos e campos', `editTopic('${p.id}','${designerTopic}')`, 'edit')}</div><section class="designer-heading">`
  );
  html = html.replace("switchBiSection('overview')", `switchBiSection('${designerTopic}')`);
  html = html
    .replace('2. Indicadores principais', `2. Indicadores · ${topicTitles[designerTopic]}`)
    .replace('3. Gráficos e análises', `3. Gráficos · ${topicTitles[designerTopic]}`);
  return html;
};
function topicConfig(p, scope) {
  const defaults = {
    view: scope === 'overview' ? 'empty' : 'original',
    groups: [],
    fields: [],
  };
  if (scope === 'pipeline') {
    defaults.view = 'board';
    defaults.groups = [pipelineField(p)?.id].filter(Boolean);
    defaults.fields = ['status', 'prioridade', 'proxima', 'responsavel', 'prazo'].filter((id) =>
      p.fields.some((f) => f.id === id)
    );
  } else if (scope === 'details') {
    defaults.view = 'table';
    defaults.fields = p.fields.map((f) => f.id);
  }
  return structuredClone(
    p.biUserTopics?.[biConfigurationUser()]?.[scope] || {
      ...defaults,
      position: 'after',
    }
  );
}
function topicToolbar(p, scope) {
  if (!canEdit(p)) return '';
  const c = topicConfig(p, scope);
  return `<div class="topic-toolbar"><div><span class="topic-toolbar-label">${topicTitles[scope]}</span><small>${c.view === 'empty' ? 'BI ainda não configurado' : c.view === 'original' ? 'Análise original do modelo' : c.groups.length ? 'Agrupar por ' + c.groups.map((id) => biColumnName(p, id)).join(' + ') : 'Todos os registros em um único grupo'}</small></div><div class="actions">${btn('Personalizar esta aba', `editTopic('${p.id}','${scope}')`, 'edit')}${btn('Adicionar gráfico', `addTopicChart('${p.id}','${scope}')`, 'plus', 'primary')}<button class="iconbtn" title="Gerenciar indicadores e gráficos" aria-label="Gerenciar gráficos desta aba" onclick="openTopicDesigner('${p.id}','${scope}')">${icon('chart')}</button></div></div>`;
}
function addTopicChart(id, scope) {
  designerTopic = scope;
  editVisual(id);
}
function topicVisuals(p, rs, scope) {
  const d = getDesign(p),
    ks = d.kpis.filter((k) => k.visible !== false),
    cs = d.charts.filter((c) => c.visible !== false);
  if (!ks.length && !cs.length) return '';
  return `<section class="topic-custom-visuals visual-dashboard layout-${d.layout || 'executive'}"><div class="section-kicker">Indicadores e gráficos desta aba</div>${ks.length ? `<div class="visual-metrics">${ks.map((k) => `<article class="visual-kpi" ${typographyAttrs(k, '--kpi-color:' + esc(k.color || '#003856'))}><div class="visual-kpi-head"><span>${esc(k.title)}</span>${canEdit(p) ? `<button class="iconbtn" aria-label="Editar indicador ${esc(k.title)}" onclick="editMetric('${p.id}','${k.id}')">${icon('edit')}</button>` : ''}</div><strong>${formatVisual(metricResult(p, rs, k), k.format)}</strong><small>${esc(metricFoot(p, k))}</small></article>`).join('')}</div>` : ''}<div class="visual-board">${cs.map((c) => renderVisualCard(p, rs, c)).join('')}</div></section>`;
}
function compoundKey(row, fields) {
  return JSON.stringify(fields.map((f) => visualCategory(row[f])));
}
function composeValue(p, r, fields) {
  return fields
    .map((id) => {
      const f = p.fields.find((f) => f.id === id),
        v = r[id];
      return f?.type === 'date' && v ? date(v) : visualCategory(v);
    })
    .join(' · ');
}
function compositeGroups(p, rs, fields, ignoreCase = false) {
  const map = new Map();
  for (const r of rs) {
    const key = ignoreCase ? JSON.stringify(fields.map((f) => visualCategory(r[f]).trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR'))) : compoundKey(r, fields);
    if (!map.has(key))
      map.set(key, {
        key,
        label: composeValue(p, r, fields),
        rows: [],
        values: Object.fromEntries(fields.map((f) => [f, visualCategory(r[f])])),
      });
    map.get(key).rows.push(r);
  }
  return [...map.values()];
}
function fieldCell(p, r, f) {
  const v = r[f.id];
  if (v == null || v === '') return '<span class="no-information">Não informado</span>';
  return f.type === 'date' ? date(v) : f.type === 'currency' ? money(v) : esc(v);
}
function groupedTopicView(p, rs, c, scope) {
  const fields = c.fields.map((id) => p.fields.find((f) => f.id === id)).filter(Boolean),
    groups = c.groups.length
      ? compositeGroups(p, rs, c.groups, scope === 'pipeline')
      : [{ key: 'all', label: 'Todos os registros', rows: rs, values: {} }];
  if (c.view === 'board')
    return `<div class="topic-board">${groups
      .map(
        (g) =>
          `<section class="topic-board-column"><div class="topic-board-heading"><h3>${esc(g.label)}</h3><span>${g.rows.length}</span></div>${g.rows
            .map(
              (r) =>
                `<article class="topic-board-card"><button class="project-link" onclick="editRecord('${p.id}','${r.id}')">${esc(recordTitle(r, p))}</button>${fields
                  .filter((f) => f.id !== 'nome')
                  .map(
                    (f) =>
                      `<div class="topic-card-field"><small>${esc(biColumnName(p, f.id))}</small><span>${fieldCell(p, r, f)}</span></div>`
                  )
                  .join(
                    ''
                  )}<button class="textbtn" style="margin-top:12px" onclick="editRecord('${p.id}','${r.id}')">Abrir ficha ${icon('arrow')}</button></article>`
            )
            .join('')}</section>`
      )
      .join(
        ''
      )}</div>${rs.length ? '' : empty('Nenhum registro nesta seleção', 'Ajuste os filtros ou cadastre uma iniciativa.')}`;
  if (c.view === 'summary')
    return `<div class="topic-summary-grid">${groups
      .map(
        (g) =>
          `<section class="panel"><div class="panelhead"><h2>${esc(g.label)}</h2><span class="badge">${g.rows.length} registros</span></div><div class="panelbody"><p class="subtitle">${g.rows.filter((r) => urgency(r, p) !== 'Regular').length} precisam de atenção · ${g.rows.filter((r) => isFinished(r, p)).length} concluídos</p><div style="margin-top:18px">${g.rows
            .slice(0, 5)
            .map(
              (r) =>
                `<button class="topic-summary-record" onclick="editRecord('${p.id}','${r.id}')">${esc(recordTitle(r, p))}${icon('arrow')}</button>`
            )
            .join('')}</div></div></section>`
      )
      .join('')}</div>`;
  return groups
    .map(
      (g) =>
        `<section class="panel topic-data-panel">${c.groups.length ? `<div class="panelhead"><h2>${esc(g.label)}</h2><span class="badge">${g.rows.length} registros</span></div>` : ''}<div class="tablewrap"><table><thead><tr><th>Obra / iniciativa</th>${fields
          .filter((f) => f.id !== 'nome')
          .map((f) => `<th>${esc(biColumnName(p, f.id))}</th>`)
          .join('')}<th></th></tr></thead><tbody>${g.rows
          .map(
            (r) =>
              `<tr><td style="min-width:200px"><button class="project-link" onclick="editRecord('${p.id}','${r.id}')">${esc(recordTitle(r, p))}</button></td>${fields
                .filter((f) => f.id !== 'nome')
                .map(
                  (f) => `<td style="white-space:normal;min-width:130px">${fieldCell(p, r, f)}</td>`
                )
                .join(
                  ''
                )}<td><button class="iconbtn" aria-label="Abrir ficha" onclick="editRecord('${p.id}','${r.id}')">${icon('arrow')}</button></td></tr>`
          )
          .join(
            ''
          )}</tbody></table></div>${g.rows.length ? '' : empty('Nenhum registro', 'Ajuste os filtros desta análise.')}</section>`
    )
    .join('');
}
function topicPage(p, rs, scope, original) {
  const c = topicConfig(p, scope);
  if (scope === 'pipeline' && pipelineDisplayField && pipelineChoices(p).some((f) => f.id === pipelineDisplayField)) {
    c.view = 'board';
    c.groups = [pipelineDisplayField];
  }
  const body =
      c.view === 'empty'
        ? empty(
            'Monte seu BI nesta aba',
            'Adicione indicadores, gráficos ou escolha como apresentar os registros.'
          )
        : c.view === 'original'
          ? original()
          : groupedTopicView(p, rs, c, scope),
    extras = scope === 'overview' && c.view === 'original' ? '' : topicVisuals(p, rs, scope);
  return (
    topicToolbar(p, scope) +
    (c.position === 'before' ? extras : '') +
    body +
    (c.position !== 'before' ? extras : '')
  );
}
const beforeTopicOverview = biOverview;
biOverview = function (p, rs) {
  return topicPage(p, rs, 'overview', () => beforeTopicOverview(p, rs));
};
const beforeTopicPipeline = biPipeline;
biPipeline = function (p, rs) {
  const selected = pipelineChoices(p).find((f) => f.id === pipelineDisplayField) || pipelineField(p);
  return `<div class="workflow-toolbar"><label>Visualizar Kanban por <select aria-label="Visualizar pipeline por Status ou Macroetapa" onchange="setPipelineField('${esc(p.id)}',this.value)">${pipelineChoices(p).map((f) => `<option value="${esc(f.id)}" ${selected?.id === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></label></div>` + topicPage(p, rs, 'pipeline', () => beforeTopicPipeline(p, rs));
};
const beforeTopicPriorities = biPriorities;
biPriorities = function (p, rs) {
  return topicPage(p, rs, 'priorities', () => beforeTopicPriorities(p, rs));
};
const beforeTopicSchedule = biSchedule;
biSchedule = function (p, rs) {
  return topicPage(p, rs, 'schedule', () => beforeTopicSchedule(p, rs));
};
const beforeTopicFinance = biFinance;
biFinance = function (p, rs) {
  return topicPage(p, rs, 'finance', () => beforeTopicFinance(p, rs));
};
const beforeTopicQuality = biQuality;
biQuality = function (p, rs) {
  return topicPage(p, rs, 'quality', () => beforeTopicQuality(p, rs));
};
const beforeTopicDocuments = biDocuments;
biDocuments = function (p, rs) {
  return topicPage(p, rs, 'documents', () => beforeTopicDocuments(p, rs));
};
const beforeTopicTerritory = biTerritory;
biTerritory = function (p, rs) {
  return topicPage(p, rs, 'territory', () => beforeTopicTerritory(p, rs));
};
const beforeTopicFunding = biFunding;
biFunding = function (p, rs) {
  return topicPage(p, rs, 'funding', () => beforeTopicFunding(p, rs));
};
const beforeTopicTerms = biTerms;
biTerms = function (p, rs) {
  return topicPage(p, rs, 'terms', () => beforeTopicTerms(p, rs));
};
function dimensionPicker(p, fields, kind) {
  const candidates = p.fields.filter((f) => !['long', 'link'].includes(f.type)),
    label =
      kind === 'topic'
        ? 'Composição dos grupos ou colunas'
        : kind === 'category'
          ? 'Composição da categoria · eixo ou fatias'
          : 'Composição dos segmentos do empilhamento';
  return `<div class="dimension-picker"><label>${label}</label><div class="dimension-pills">${fields.map((id, i) => `<div class="dimension-pill"><span class="dimension-order">${i + 1}</span><b>${esc(biColumnName(p, id))}</b><button type="button" aria-label="Subir ${esc(biColumnName(p, id))}" ${i === 0 ? 'disabled' : ''} onclick="changeDimension('${kind}',${i},'up')">↑</button><button type="button" aria-label="Remover ${esc(biColumnName(p, id))}" onclick="changeDimension('${kind}',${i},'remove')">${icon('close')}</button></div>`).join('') || '<span class="subtitle">Nenhum campo selecionado</span>'}</div><div class="dimension-add"><select id="dimensionAdd_${kind}" aria-label="Adicionar campo ${kind === 'category' ? 'à categoria' : kind === 'series' ? 'aos segmentos' : 'ao agrupamento'}"><option value="">Escolha mais um campo...</option>${candidates
    .filter((f) => !fields.includes(f.id))
    .map((f) => `<option value="${f.id}">${esc(biColumnName(p, f.id))}</option>`)
    .join(
      ''
    )}</select><button class="btn" type="button" onclick="changeDimension('${kind}',0,'add')">${icon('plus')}Adicionar</button></div><small>A ordem escolhida define a apresentação. Ex.: Órgão + Macroetapa + Status.</small></div>`;
}
function editTopic(id, scope) {
  const p = visible().find((p) => p.id === id);
  if (!p || !canEdit(p)) return;
  topicDraft = { id, scope, config: topicConfig(p, scope) };
  renderTopicModal();
}
function renderTopicModal() {
  const p = visible().find((p) => p.id === topicDraft.id),
    c = topicDraft.config,
    scope = topicDraft.scope;
  modal(
    'Personalizar aba · ' + topicTitles[scope],
    `<p class="subtitle" style="margin-bottom:20px">Escolha como organizar as informações desta aba. A composição é individual por usuário e os registros do projeto não são alterados.</p><form id="topicConfigForm" onsubmit="event.preventDefault();saveTopicConfig()"><div class="field"><label>Como apresentar os registros</label><select aria-label="Apresentação desta aba" name="view" onchange="readTopicForm();renderTopicModal()">${[
      ['empty', 'Em branco · montar do zero'],
      ['original', 'Análise original do modelo'],
      ['board', 'Colunas com cartões'],
      ['table', 'Tabela de registros'],
      ['summary', 'Resumo por agrupamento'],
    ]
      .map(([key, n]) => `<option value="${key}" ${c.view === key ? 'selected' : ''}>${n}</option>`)
      .join(
        ''
      )}</select></div><div id="topicDimensions">${dimensionPicker(p, c.groups, 'topic')}</div><div class="compound-example">${icon('folder')}<div><b>Como os grupos ficarão</b><p>${
      c.groups.length
        ? compositeGroups(p, biRows(p), c.groups)
            .slice(0, 3)
            .map((g) => esc(g.label))
            .join('<br>') || 'Os grupos aparecerão quando houver registros.'
        : 'Todos os registros ficarão em um único grupo.'
    }</p></div></div><label style="margin:23px 0 12px">Informações exibidas nos cartões ou na tabela</label><div class="topic-fields-list">${p.fields.map((f) => `<label><input name="fields" type="checkbox" value="${f.id}" ${f.id === 'nome' ? 'checked disabled' : c.fields.includes(f.id) ? 'checked' : ''}>${esc(biColumnName(p, f.id))}${f.id === 'nome' ? ' (identificação fixa)' : ''}</label>`).join('')}</div><div class="field" style="margin-top:22px"><label>Posição dos gráficos adicionados</label><select name="position" aria-label="Posição dos gráficos da aba"><option value="before" ${c.position === 'before' ? 'selected' : ''}>Antes da análise ou dos registros</option><option value="after" ${c.position !== 'before' ? 'selected' : ''}>Depois da análise ou dos registros</option></select></div><p class="metric-note" style="margin:0">Para que o agrupamento escolhido organize os registros, use colunas com cartões, tabela ou resumo. A análise original mantém a estrutura do modelo.</p></form>`,
    btn('Voltar', 'closeModal()', 'arrow') +
      `<button class="btn primary" form="topicConfigForm" type="submit">Salvar esta aba</button>`
  );
}
function readTopicForm() {
  const f = $('#topicConfigForm');
  if (!f || !topicDraft) return;
  const d = new FormData(f);
  topicDraft.config.view = d.get('view');
  topicDraft.config.fields = d.getAll('fields');
  topicDraft.config.position = d.get('position');
}
function changeDimension(kind, index, action) {
  const isTopic = kind === 'topic',
    p = visible().find((p) => p.id === (isTopic ? topicDraft?.id : visualDraft?.pId));
  if (!p) return;
  if (isTopic) readTopicForm();
  const key = kind === 'category' ? 'categories' : 'seriesFields',
    arr = isTopic ? topicDraft.config.groups : visualDraft.config[key];
  if (action === 'add') {
    const v = $('#dimensionAdd_' + kind).value;
    if (v && !arr.includes(v)) arr.push(v);
  } else if (action === 'remove') arr.splice(index, 1);
  else if (action === 'up' && index > 0)
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
  if (isTopic) {
    if (topicDraft.config.view === 'original') topicDraft.config.view = 'board';
    renderTopicModal();
  } else {
    const form = $('#chartEditorForm');
    form.elements[kind === 'category' ? 'category' : 'series'].value = arr[0] || '';
    renderChartDimensions();
    updateVisualDraft();
  }
}
function saveTopicConfig() {
  readTopicForm();
  const p = visible().find((p) => p.id === topicDraft?.id);
  if (!p || !canEdit(p)) return;
  const { scope, config } = topicDraft;
  const user = biConfigurationUser();
  p.biUserTopics ??= {};
  p.biUserTopics[user] ??= {};
  p.biUserTopics[user][scope] = structuredClone(config);
  persist(
    'Personalizou estrutura da aba',
    p,
    '',
    topicTitles[scope] + ': ' + config.groups.map((id) => biColumnName(p, id)).join(' + ')
  );
  topicDraft = null;
  closeModal();
  render();
  notify('Agrupamentos e informações desta aba atualizados.');
}
// Compound labels map back to their original columns when selecting a chart.
function syntheticDimension(p, rows, fields, key) {
  const combinations = new Map(),
    labels = new Map(),
    reverse = new Map();
  for (const r of rows) {
    const code = compoundKey(r, fields);
    if (!combinations.has(code)) {
      let label = composeValue(p, r, fields),
        suffix = 2;
      while (reverse.has(label) && reverse.get(label) !== code)
        label = composeValue(p, r, fields) + ' (' + suffix++ + ')';
      combinations.set(code, label);
      reverse.set(label, code);
      labels.set(label, Object.fromEntries(fields.map((id) => [id, visualCategory(r[id])])));
    }
    r[key] = combinations.get(code);
  }
  compoundBindings.set(key, { fields, labels });
  return { id: key, name: fields.map((id) => biColumnName(p, id)).join(' + '), type: 'text' };
}
function compoundVisual(p, rows, config) {
  const c = structuredClone(config),
    categories = (c.categories || [c.category]).filter((id) => p.fields.some((f) => f.id === id)),
    segments = (c.seriesFields || [c.series]).filter((id) => p.fields.some((f) => f.id === id));
  const rs = rows.map((r) => ({ ...r })),
    pp = { ...p, fields: [...p.fields] };
  if (categories.length > 1) {
    const key = '__compound_' + (c.id || 'chart') + '_category';
    pp.fields.push(syntheticDimension(p, rs, categories, key));
    c.category = key;
  } else c.category = categories[0] || '';
  if (segments.length > 1) {
    const key = '__compound_' + (c.id || 'chart') + '_series';
    pp.fields.push(syntheticDimension(p, rs, segments, key));
    c.series = key;
  } else c.series = segments[0] || '';
  return { p: pp, rows: rs, c };
}
const mountSingleDimension = visualMount;
visualMount = function (p, rs, c, preview = false) {
  const prepared = compoundVisual(p, rs, c);
  return mountSingleDimension(prepared.p, prepared.rows, prepared.c, preview);
};
function applyVisualSelection(field, value) {
  const binding = compoundBindings.get(field);
  if (binding) {
    const values = binding.labels.get(value);
    if (values) Object.assign(biCrossFilters, values);
  } else if (field) biCrossFilters[field] = value;
}
selectVisualFilter = function (field, value, series = '', segment = '') {
  applyVisualSelection(field, value);
  if (series) applyVisualSelection(series, segment);
  render();
};
const validateSingleDimension = validateVisualConfig;
validateVisualConfig = function (p, c) {
  if (c.categories && c.categories.length === 0)
    return 'Escolha ao menos um campo para compor a categoria.';
  if (['line', 'area'].includes(c.type) && c.categories?.length > 1)
    return 'Linha e área usam uma única coluna de data. Para combinar campos, escolha barras, colunas ou composição.';
  return validateSingleDimension(p, c);
};
const editSingleDimension = editVisual;
editVisual = function (id, key = '') {
  editSingleDimension(id, key);
  if (!visualDraft) return;
  visualDraft.config.categories ??= [visualDraft.config.category].filter(Boolean);
  visualDraft.config.seriesFields ??= [visualDraft.config.series].filter(Boolean);
  const form = $('#chartEditorForm'),
    categoryField = form.elements.category.closest('.field');
  categoryField.style.display = 'none';
  categoryField.insertAdjacentHTML('beforebegin', '<div id="compoundCategoryEditor"></div>');
  form.elements.series.style.display = 'none';
  $('#seriesField').insertAdjacentHTML('beforeend', '<div id="compoundSeriesEditor"></div>');
  renderChartDimensions();
  updateVisualDraft();
};
function renderChartDimensions() {
  if (!visualDraft) return;
  const p = visible().find((p) => p.id === visualDraft.pId);
  $('#compoundCategoryEditor').innerHTML = dimensionPicker(
    p,
    visualDraft.config.categories,
    'category'
  );
  $('#compoundSeriesEditor').innerHTML = dimensionPicker(
    p,
    visualDraft.config.seriesFields,
    'series'
  );
}
const routeBeforeTopics = routeSnapshot;
routeSnapshot = function () {
  return { ...routeBeforeTopics(), designerTopic };
};
const restoreBeforeTopics = restoreRoute;
restoreRoute = function (r) {
  designerTopic = r.designerTopic || 'overview';
  restoreBeforeTopics(r);
};
function chartDimensionText(p, c) {
  const a = (c.categories || [c.category])
      .filter(Boolean)
      .map((id) => biColumnName(p, id))
      .join(' + '),
    b = (c.seriesFields || [c.series])
      .filter(Boolean)
      .map((id) => biColumnName(p, id))
      .join(' + ');
  return a + (b && ['stacked', 'stacked_h', 'stacked100'].includes(c.type) ? ' × ' + b : '');
}
const switchSectionBeforeTopics = switchBiSection;
switchBiSection = function (section) {
  if (section === 'designer' && biSection !== 'designer' && topicTitles[biSection])
    designerTopic = biSection;
  switchSectionBeforeTopics(section);
};
render();
