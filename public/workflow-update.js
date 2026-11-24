/* Workflow preferences are additive: existing project data is preserved. */
let activeWorkflow = 'principal';
const softDefaults = ['#edf3fb', '#e8f5f5', '#fff2e4', '#eaf6ec'];
const validHex = (v) => /^#[0-9a-f]{6}$/i.test(v || '');
function workflowSettings() {
  db.workflowSettings ||= { colors: {}, boards: [] };
  const s = db.workflowSettings;
  if (!s.boards.some((b) => b.id === 'principal'))
    s.boards.unshift({
      id: 'principal',
      name: 'Projetos · fluxo principal',
      stages: [...PROJECT_STAGES],
      colors: {},
      positions: {},
    });
  for (const board of s.boards) {
    if (!board.stages.includes('Ainda não definido')) board.stages.push('Ainda não definido');
  }
  return s;
}
function activeBoard() {
  const s = workflowSettings();
  return s.boards.find((b) => b.id === activeWorkflow) || s.boards[0];
}
function boardStage(p, b = activeBoard()) {
  const manual = b.id === 'principal' ? p.stage : b.positions[p.id];
  if (b.stages.includes(manual)) return manual;
  const inferred = originalProjectStage(p);
  return b.stages.includes(inferred) ? inferred : b.stages[0];
}
const originalProjectStage = projectStage;
projectStage = function (p) {
  const b = workflowSettings().boards[0];
  return b.stages.includes(p.stage) ? p.stage : originalProjectStage(p);
};
function setWorkflow(id) {
  activeWorkflow = id;
  render();
}
function statusColor(label, i = 0) {
  const own = workflowSettings().colors[label];
  return validHex(own) ? own : semanticColorOriginal(label, i, 'institutional');
}
function pale(color) {
  return (
    '#' +
    [1, 3, 5]
      .map((i) =>
        Math.round(parseInt(color.slice(i, i + 2), 16) * 0.13 + 255 * 0.87)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
}
// O quadro de Acompanhamento mostra as OBRAS que o usuário pode ver (visible() já limita aos
// projetos liberados e o banco só devolve as obras permitidas), e não mais os projetos.
const OBRA_STAGE_FALLBACK = {
  Concluído: 'Concluído',
  'Em andamento': 'Em andamento',
  Atrasado: 'Em atenção',
  'Ponto de Atenção': 'Em atenção',
  Paralisado: 'Em atenção',
};
function obraStatusKey(p) {
  return fieldKey(p, 'status') || p.fields.find((f) =>
    ['status', 'statusdoprojeto', 'statusdaobra', 'situacao'].includes(importHeaderKey(f.name)))?.id || 'status';
}
function obraStatus(r, p) {
  return workStatusSource(r, p).value;
}
// As etapas do quadro são só a organização visual de cada usuário: não têm relação com o
// status da obra. A posição de cada obra fica salva neste navegador, por usuário e por quadro.
function kanbanPositionsKey(b) {
  const userKey = (window.SECAP_EMAIL || me()?.email || session || 'guest').toLowerCase();
  return `secap_kanban_${userKey}_${b.id}`;
}
const kanbanPositionsCache = new Map();
function kanbanPositions(b) {
  const key = kanbanPositionsKey(b);
  if (!kanbanPositionsCache.has(key)) {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(key) || '{}') || {};
    } catch (e) {}
    kanbanPositionsCache.set(key, saved);
  }
  return kanbanPositionsCache.get(key);
}
function saveKanbanPositions(b, positions) {
  const key = kanbanPositionsKey(b);
  kanbanPositionsCache.set(key, positions);
  try {
    localStorage.setItem(key, JSON.stringify(positions));
    return true;
  } catch (e) {
    return false;
  }
}
function obraStage(r, p, b = activeBoard()) {
  const mine = kanbanPositions(b)[r.id];
  if (b.stages.includes(mine)) return mine;
  // Quadros adicionais antigos guardavam posições compartilhadas: usadas só como ponto de partida.
  const legacy = b.id !== 'principal' ? b.positions?.[r.id] : '';
  if (b.stages.includes(legacy)) return legacy;
  return b.stages[0];
}
function obraCard(p, r, b) {
  const color = p.color || '#003856',
    // Mover é só visual (organização do usuário), então qualquer um que vê a obra pode mover.
    editable = true,
    pct = physicalProgress(r.progresso),
    isLate = late(r),
    stage = obraStage(r, p, b),
    status = obraStatus(r, p),
    sc = statusColor(status);
  return `<article class="kanban tcard" style="border-top:4px solid ${color}" draggable="${editable}" ondragstart="kanbanDragStart(event,'${esc(p.id)}|${esc(r.id)}')" ondragend="kanbanDragEnd(this)"><button class="tcard-title" onclick="editRecord('${esc(p.id)}','${esc(r.id)}')"><h3>${esc(r.nome || 'Obra sem nome')}</h3></button><p class="tcard-next">${esc(p.name)}${r.orgao ? ' · ' + esc(r.orgao) : ''}</p>${pct !== null ? `<div class="pr"><div class="progress"><i style="width:${Math.min(100, pct)}%;background:${color}"></i></div>${pct}%</div>` : ''}<div class="tcard-foot"><span class="tcard-chip" title="Situação da obra" style="border-left:3px solid ${sc}">${esc(canonicalStatus(status))}</span>${isLate ? `<span class="tcard-chip late" title="Prazo vencido">${icon('alert')}Em atraso</span>` : ''}${r.prazo ? `<span class="tcard-chip" title="Prazo">${icon('calendar')}${esc(date(r.prazo))}</span>` : ''}<span class="tcard-spacer"></span><span class="tcard-avatar" title="${esc(r.responsavel || 'Sem responsável')}">${esc(initials(r.responsavel))}</span></div>${editable ? `<select class="tcard-move" aria-label="Alterar etapa de ${esc(r.nome || 'obra')}" onchange="moveObra('${esc(p.id)}','${esc(r.id)}',this.value)">${b.stages.map((v) => `<option ${stage === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>` : ''}</article>`;
}
kanban = function () {
  const b = activeBoard(),
    projects = visible().filter((p) => !filterProject || p.id === filterProject);
  const items = projects
    .flatMap((p) => (p.records || []).filter(r => isSysAdmin() || (typeof canSeeAssignedWork === 'function' && canSeeAssignedWork(p.id,r.id))).map((r) => ({ p, r })))
    .filter(({ p, r }) => {
      if(typeof matchesKanbanResponsible==='function'&&!matchesKanbanResponsible(p,r))return false;
      if (
        filterStatus &&
        obraStage(r, p, b) !== filterStatus &&
        canonicalStatus(obraStatus(r, p)) !== canonicalStatus(filterStatus)
      )
        return false;
      return (
        matchesQuery(r) ||
        (query &&
          [p.name, p.description, p.owner].some((v) =>
            String(v || '')
              .toLowerCase()
              .includes(query.toLowerCase())
          ))
      );
    });
  return (
    head(
      'FLUXO DE TRABALHO',
      'Acompanhamento',
      'Obras que você tem acesso, organizadas por etapa. Cada quadro mantém suas próprias etapas.',
      btn('Identificação de cores', 'editStatusColors()', 'edit') +
        (me()?.role === 'Administrador' ? btn('Novo quadro', 'editWorkflow()', 'plus') : '')
    ) +
    filters(typeof kanbanResponsibleFilter==='function'?kanbanResponsibleFilter():'') +
    `${workflowSettings().boards.length>1?'<div class="workflow-switch"><label>Quadro <select aria-label="Selecionar quadro de acompanhamento" onchange="setWorkflow(this.value)">'+workflowSettings().boards.map(q=>'<option value="'+esc(q.id)+'" '+(q.id===b.id?'selected':'')+'>'+esc(q.id==='principal'?'Principal':q.name)+'</option>').join('')+'</select></label></div>':''}<div class="workflow-toolbar"><span>Arraste as obras entre etapas ou use a seleção no cartão. Mover entre etapas atualiza o status da obra no projeto. ${items.length} ${items.length === 1 ? 'obra' : 'obras'} neste quadro.</span>${me()?.role === 'Administrador' ? btn('Configurar quadro', `editWorkflow('${b.id}')`, 'edit') : ''}</div><div class="board trello-board calm-board">${b.stages
      .map((stage, i) => {
        const color = validHex(b.colors[stage]) ? b.colors[stage] : softDefaults[i % 4],
          col = items.filter(({ p, r }) => obraStage(r, p, b) === stage);
        return `<section class="column tlist" style="background:${color}" data-stage="${esc(stage)}" ondragover="event.preventDefault();this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')" ondrop="this.classList.remove('dragover');dropObra(event,this.dataset.stage)"><div class="colhead"><span>${esc(stage)}</span><em>${col.length}</em></div><div class="tlist-cards">${col.map(({ p, r }) => obraCard(p, r, b)).join('') || '<div class="tlist-empty">Solte uma obra aqui</div>'}</div></section>`;
      })
      .join(
        ''
      )}</div>${items.length ? '' : empty('Nenhuma obra encontrada', 'Não há obras liberadas para você com os filtros atuais.')}`
  );
};
// Mover entre etapas é só visual: guarda a posição na organização do próprio usuário.
// Não altera o status da obra, não grava no banco e não gera registro de auditoria.
function moveObra(pid, rid, stage) {
  const b = activeBoard(),
    p = visible().find((p) => p.id === pid),
    r = p?.records.find((r) => r.id === rid);
  if (!p || !r || !b.stages.includes(stage)) return;
  if (obraStage(r, p, b) === stage) return;
  const positions = { ...kanbanPositions(b), [r.id]: stage };
  if (!saveKanbanPositions(b, positions))
    notify('A posição foi alterada, mas não pôde ser salva neste navegador.', 'error');
  render();
}
// Arrastar e soltar os cartões de obra entre as etapas do quadro.
// (Antes ficavam no app.js junto com o quadro de projetos; os cartões de obra dependem delas.)
function kanbanDragStart(e, key) {
  e.dataTransfer.setData('text/plain', key);
  e.dataTransfer.effectAllowed = 'move';
  const el = e.currentTarget;
  setTimeout(() => el.classList.add('dragging'), 0);
}
function kanbanDragEnd(el) {
  el.classList.remove('dragging');
  document.querySelectorAll('.tlist.dragover').forEach((c) => c.classList.remove('dragover'));
}
function dropObra(e, stage) {
  e.preventDefault();
  const [pid, rid] = e.dataTransfer.getData('text/plain').split('|');
  if (pid && rid) moveObra(pid, rid, stage);
}
function editWorkflow(id = '') {
  if (me()?.role !== 'Administrador') return;
  const b = workflowSettings().boards.find((q) => q.id === id);
  modal(
    b ? 'Configurar quadro' : 'Novo quadro',
    `<form id="workflowForm" onsubmit="event.preventDefault();saveWorkflow('${id}')"><div class="field"><label>Nome do quadro</label><input name="name" required maxlength="100" value="${esc(b?.name || '')}"></div><p>Todas as obras que o usuário pode acessar aparecem neste quadro. As etapas refletem o status da obra. Mover uma obra atualiza seu registro no projeto e exige permissão para editar o status e ao menos um responsável.</p><div class="field"><label>Etapas · uma por linha</label><textarea name="stages" required rows="6">${esc((b?.stages || PROJECT_STAGES).join('\n'))}</textarea><small>Se uma etapa for retirada, as obras que estavam nela voltam para a primeira etapa.</small></div>${b ? `<h3>Cores claras das etapas</h3>${b.stages.map((s, i) => `<label class="color-row"><span>${esc(s)}</span><input type="color" name="color_${i}" value="${validHex(b.colors[s]) ? b.colors[s] : softDefaults[i % 4]}"></label>`).join('')}` : ''}<button class="btn primary">Salvar quadro</button></form>`,
    (b && b.id !== 'principal'
      ? btn('Excluir quadro', `confirmWorkflowDelete('${id}')`, 'trash')
      : '') + btn('Voltar', 'closeModal()', 'arrow')
  );
}
function saveWorkflow(id) {
  if (me()?.role !== 'Administrador') return;
  const form = document.getElementById('workflowForm'),
    name = form.elements.name.value.trim(),
    stages = form.elements.stages.value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    s = workflowSettings(),
    b = s.boards.find((q) => q.id === id);
  if (!name || !stages.length || stages.length > 30 || new Set(stages).size !== stages.length)
    return notify('Informe de 1 a 30 etapas com nomes diferentes.');
  const colors = {};
  b?.stages.forEach((v, i) => (colors[v] = form.elements['color_' + i].value));
  if (b) Object.assign(b, { name, stages, colors });
  else {
    s.boards.push({ id: uid(), name, stages, colors: {}, positions: {} });
    activeWorkflow = s.boards.at(-1).id;
  }
  persist('Configurou quadro', name);
  closeModal();
  render();
}
function confirmWorkflowDelete(id) {
  const b = workflowSettings().boards.find((b) => b.id === id);
  if (!b || id === 'principal' || me()?.role !== 'Administrador') return;
  modal(
    'Confirmar exclusão do quadro',
    `<p>Você vai excluir <strong>${esc(b.name)}</strong>, suas etapas, cores e posições. Os projetos e as obras serão preservados nas outras abas.</p><p>Digite <strong>EXCLUIR</strong> para confirmar.</p><input id="deleteBoardConfirmation" autocomplete="off" aria-label="Digite EXCLUIR">`,
    btn('Cancelar', 'closeModal()', 'arrow') +
      btn('Excluir este quadro', `deleteWorkflow('${id}')`, 'trash')
  );
}
function deleteWorkflow(id) {
  if (
    me()?.role !== 'Administrador' ||
    id === 'principal' ||
    document.getElementById('deleteBoardConfirmation')?.value !== 'EXCLUIR'
  )
    return notify('Digite EXCLUIR para confirmar.');
  db.workflowSettings.boards = db.workflowSettings.boards.filter((b) => b.id !== id);
  activeWorkflow = 'principal';
  persist('Excluiu quadro de acompanhamento', id);
  closeModal();
  render();
}
function colorLabels() {
  return [
    ...new Set(
      [
        ...PROJECT_STAGES,
        ...db.projects.flatMap((p) => [
          ...(p.fields || []).filter((f) => f.type === 'select').flatMap((f) => f.options || []),
          ...(p.records || []).map((r) => r.status),
        ]),
        ...Object.keys(workflowSettings().colors),
        ...Array.from(
          document.querySelectorAll('.topic-board-heading h3,.pipeline-stage h3'),
          (el) => el.textContent
        ),
      ].filter(Boolean)
    ),
  ];
}
function editStatusColors() {
  if (me()?.role !== 'Administrador')
    return notify('Somente o administrador altera as cores compartilhadas.');
  const labels = colorLabels();
  modal(
    'Identificação de cores',
    `<p>As cores fixas continuam disponíveis. Escolha cores próprias para status e categorias no calendário, no pipeline e nos gráficos institucionais. As etapas do Kanban têm fundos configuráveis em “Configurar quadro”.</p><form id="statusColorsForm" onsubmit="event.preventDefault();saveStatusColors()">${labels.map((label, i) => `<label class="color-row"><span>${esc(label)}</span><input type="color" data-label="${esc(label)}" value="${statusColor(label, i)}"></label>`).join('')}<button class="btn primary">Salvar cores</button></form>`,
    btn('Restaurar cores fixas', 'resetStatusColors()', 'arrow') +
      btn('Voltar', 'closeModal()', 'arrow')
  );
}
function saveStatusColors() {
  if (me()?.role !== 'Administrador') return;
  const colors = {};
  document
    .querySelectorAll('#statusColorsForm input')
    .forEach((e) => (colors[e.dataset.label] = e.value));
  workflowSettings().colors = colors;
  persist('Personalizou identificação de cores', 'Portal');
  closeModal();
  render();
}
function resetStatusColors() {
  if (me()?.role !== 'Administrador') return;
  workflowSettings().colors = {};
  persist('Restaurou cores fixas', 'Portal');
  closeModal();
  render();
}
// Respect custom colors in all ECharts types, including per-item colors.
const semanticColorOriginal = semanticVisualColor;
let activeChartColors = null;
semanticVisualColor = function (label, i, palette) {
  return validHex(activeChartColors?.[label])
    ? activeChartColors[label]
    : palette === 'institutional'
      ? statusColor(label, i)
      : semanticColorOriginal(label, i, palette);
};
const optionsBeforeWorkflow = visualOptions;
visualOptions = function (p, rs, c, d) {
  activeChartColors = c.customColors || null;
  try {
    return optionsBeforeWorkflow(p, rs, c, d);
  } finally {
    activeChartColors = null;
  }
};
const editVisualBeforeWorkflow = editVisual;
editVisual = function (...args) {
  editVisualBeforeWorkflow(...args);
  const form = document.getElementById('chartEditorForm');
  if (!form || !visualDraft) return;
  const c = visualDraft.config;
  const box = document.createElement('details');
  box.className = 'chart-color-settings';
  box.open = !!c.customColors;
  box.innerHTML = `<summary>Cores próprias deste gráfico</summary><p>Escolha uma cor para cada categoria. Alterar uma cor ativa a personalização deste gráfico.</p><label><input type="checkbox" name="useCustomColors" ${c.customColors ? 'checked' : ''}> Personalizar cores</label><div class="chart-custom-color-rows"></div>`;
  form.append(box);
  const activate = (event) => {
    if (event.target.matches('.custom-chart-color'))
      form.querySelector('[name=useCustomColors]').checked = true;
  };
  form.addEventListener('input', activate, true);
  form.addEventListener('change', activate, true);
  updateVisualDraft();
};
function syncChartColorControls() {
  const form = document.getElementById('chartEditorForm'),
    rows = form?.querySelector('.chart-custom-color-rows');
  if (!rows || !visualDraft) return;
  const p = visible().find((p) => p.id === visualDraft.pId),
    c = readVisualBeforeWorkflow(),
    d = visualData(p, biRows(p), c);
  const values = d.error ? [] : d.stacked ? d.names : d.groups.map((g) => g.name);
  const signature = JSON.stringify(values);
  if (rows.dataset.signature === signature) return;
  const colors = { ...(visualDraft.config.customColors || {}) };
  rows.querySelectorAll('[data-label]').forEach((e) => (colors[e.dataset.label] = e.value));
  rows.innerHTML = values.length
    ? values
        .map(
          (label, i) =>
            `<label class="color-row"><span>${esc(label)}</span><input aria-label="Cor · ${esc(label)}" type="color" class="custom-chart-color" data-label="${esc(label)}" value="${validHex(colors[label]) ? colors[label] : statusColor(label, i)}"></label>`
        )
        .join('')
    : '<p class="subtitle">Selecione uma categoria com dados para escolher as cores.</p>';
  rows.dataset.signature = signature;
}
const updateVisualBeforeColors = updateVisualDraft;
updateVisualDraft = function () {
  syncChartColorControls();
  return updateVisualBeforeColors();
};
const readVisualBeforeWorkflow = readVisualForm;
readVisualForm = function () {
  const c = readVisualBeforeWorkflow();
  if (!c) return c;
  const form = document.getElementById('chartEditorForm');
  const checkbox = form?.querySelector('input[name="useCustomColors"]');
  if (!checkbox) return c; // The base editor runs once before the color controls are mounted.
  const enabled = checkbox.checked === true;
  if (!enabled) {
    c.customColors = null;
    return c;
  }
  // Capture every selected color from the editor at save time. Keep the
  // category label as the key so the chart can restore the same color later.
  const customColors = {};
  form.querySelectorAll('input.custom-chart-color[data-label]').forEach((input) => {
    const label = input.dataset.label;
    const color = input.value;
    if (label && validHex(color)) customColors[label] = color;
  });
  c.customColors = customColors;
  return c;
};
// Pipeline color configuration also covers composed board columns.
const pipelineBeforeWorkflow = biPipeline;
biPipeline = function (p, rs) {
  const html = pipelineBeforeWorkflow(p, rs),
    root = document.createElement('div');
  root.innerHTML = html;
  root.querySelectorAll('.topic-board-column,.pipeline-stage').forEach((el, i) => {
    const label = el.querySelector('h3')?.textContent || '',
      color = statusColor(label, i);
    el.style.background = pale(color);
    el.style.borderTop = '3px solid ' + color;
    const bar = el.querySelector('.progress i');
    if (bar) bar.style.background = color;
  });
  return (
    `<div class="workflow-toolbar"><span>Cores por etapa ou agrupamento</span>${me()?.role === 'Administrador' ? btn('Identificação de cores', 'editStatusColors()', 'edit') : ''}</div>` +
    root.innerHTML
  );
};
let calendarPrivateItems = [],
  calendarLoaded = false,
  calendarDayQuery = '',
  calendarDayStatus = '';
async function loadPrivateAgenda() {
  try {
    const r = await fetch('/api/calendar');
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Não foi possível carregar a agenda.');
    calendarPrivateItems = data.items;
    calendarLoaded = true;
    if (tab === 'calendar') render();
  } catch (error) {
    notify(error.message || 'Não foi possível carregar a agenda.', 'error');
  }
}
const eventsBeforeWorkflow = events;
events = function () {
  const ev = eventsBeforeWorkflow();
  for (const p of visible().filter((p) => !filterProject || p.id === filterProject)) {
    for (const key of ['deadline', 'prazo', 'startDate', 'endDate'])
      if (/^\d{4}-\d{2}-\d{2}$/.test(p[key] || ''))
        ev.push({
          date: p[key],
          title: p.name,
          field: 'Data do projeto',
          projectOnly: p,
          r: { status: projectStage(p), project: p },
        });
  }
  return ev.sort((a, b) => a.date.localeCompare(b.date));
};
function agendaEvents() {
  return events().concat(
    calendarPrivateItems.map((e) => ({
      date: e.date,
      title: e.title,
      field: e.kind === 'meeting' ? 'Reunião' : 'Lembrete privado',
      personal: e,
      r: { status: e.kind === 'meeting' ? 'Reunião' : 'Pessoal' },
    }))
  );
}
calendar = function () {
  if (!calendarLoaded) loadPrivateAgenda();
  const ev = agendaEvents(),
    days = new Date(year, month + 1, 0).getDate(),
    offset = new Date(year, month, 1).getDay(),
    prefix = `${year}-${String(month + 1).padStart(2, '0')}`,
    monthEvents = ev.filter((e) => e.date.startsWith(prefix));
  return (
    head(
      'AGENDA CONECTADA',
      'Calendário',
      'Prazos por status. Seus lembretes ficam separados dos dados dos projetos.',
      btn('Atualizar agenda', 'loadPrivateAgenda()', 'history') +
        btn('Novo lembrete / reunião', `editAgendaItem('${today()}')`, 'plus') +
        btn('Cores', 'editStatusColors()', 'edit')
    ) +
    filters() +
    `<section class="panel"><div class="panelhead"><h2>${esc(new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))}</h2><div class="actions">${btn('Anterior', 'changeMonth(-1)', 'arrow')}${btn('Hoje', 'calendarToday()', 'calendar')}${btn('Próximo', 'changeMonth(1)', 'arrow')}</div></div><div class="agenda-legend">${[...new Set(['Atrasado', ...ev.map((e) => e.r.status || 'Não informado')])].map((s, i) => `<span><i style="background:${statusColor(s, i)}"></i>${esc(s)}</span>`).join('')}</div><div class="calgrid compact-calendar">${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => `<div class="weekday">${d}</div>`).join('')}${Array.from({ length: offset }, () => '<div class="day blank"></div>').join('')}${Array.from(
      { length: days },
      (_, i) => {
        const d = prefix + '-' + String(i + 1).padStart(2, '0'),
          es = ev.filter((e) => e.date === d),
          groups = new Map();
        es.forEach((e) => {
          const s = e.r.status || 'Não informado';
          groups.set(s, (groups.get(s) || 0) + 1);
        });
        return `<button class="day agenda-day ${d === today() ? 'today' : ''}" onclick="openAgendaDay('${d}')" aria-label="${date(d)}, ${es.length} eventos"><b>${i + 1}</b>${
          es.length
            ? `<strong>${es.length} ${es.length === 1 ? 'item' : 'itens'}</strong><div class="day-statuses">${[
                ...groups,
              ]
                .slice(0, 3)
                .map(
                  ([s, n], j) =>
                    `<span style="border-left:3px solid ${statusColor(s, j)};background:${pale(statusColor(s, j))}">${n} · ${esc(s)}</span>`
                )
                .join(
                  ''
                )}${groups.size > 3 ? `<small>+${groups.size - 3} status</small>` : ''}</div>`
            : '<small>Adicionar</small>'
        }</button>`;
      }
    ).join(
      ''
    )}</div></section><section class="panel" style="margin-top:20px"><div class="panelhead"><h2>Resumo do mês</h2><span>${monthEvents.length} itens</span></div><div class="panelbody"><p>Clique em um dia para consultar, buscar e filtrar todas as obras, os prazos e os compromissos. Nenhum registro é omitido na lista do dia.</p><p class="subtitle">Lembretes pessoais não alteram projetos, indicadores ou Kanban. Reuniões aparecem na agenda de quem organiza e dos participantes selecionados. Apenas o organizador pode editar ou excluir.</p></div></section>`
  );
};
let openedAgendaDay = '';
function openAgendaDay(d, keep = false) {
  openedAgendaDay = d;
  if (!keep) {
    calendarDayQuery = '';
    calendarDayStatus = '';
  }
  const ev = agendaEvents().filter((e) => e.date === d),
    statuses = [...new Set(['Atrasado', ...ev.map((e) => e.r.status || 'Não informado')])];
  modal(
    'Agenda · ' + date(d),
    `<div class="agenda-day-filters"><input type="search" id="agendaSearch" placeholder="Buscar obra, projeto ou lembrete" value="${esc(calendarDayQuery)}" oninput="calendarDayQuery=this.value;renderAgendaRows()"><select aria-label="Filtrar por status" onchange="calendarDayStatus=this.value;renderAgendaRows()"><option value="">Todos os status</option>${statuses.map((s) => `<option ${s === calendarDayStatus ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div><p id="agendaResultCount"></p><div id="agendaRows"></div>`,
    btn('Adicionar neste dia', `editAgendaItem('${d}')`, 'plus') +
      btn('Voltar', 'closeModal()', 'arrow')
  );
  document.querySelector('.dialog').classList.add('agenda-dialog');
  renderAgendaRows();
}
function renderAgendaRows() {
  const ev = agendaEvents().filter((e) => e.date === openedAgendaDay),
    matches = ev.filter(
      (e) =>
        (!calendarDayStatus || (e.r.status || 'Não informado') === calendarDayStatus) &&
        (!calendarDayQuery ||
          [e.title, e.field, e.r.project?.name, e.personal?.description]
            .join(' ')
            .toLowerCase()
            .includes(calendarDayQuery.toLowerCase()))
    );
  document.getElementById('agendaResultCount').textContent =
    matches.length + ' de ' + ev.length + ' itens';
  document.getElementById('agendaRows').innerHTML =
    matches
      .map((e) => {
        const index = ev.indexOf(e),
          s = e.r.status || 'Não informado',
          c = statusColor(s);
        return `<button class="agenda-row" onclick="openAgendaEntry(${index})"><span class="agenda-status" style="background:${pale(c)};color:#203744;border-left:4px solid ${c}">${esc(s)}</span><div><strong>${esc(e.title)}</strong><p>${esc(e.field)}${e.r.project ? ' · ' + esc(e.r.project.name) : ''}${e.personal?.time ? ' · ' + esc(e.personal.time) : ''}</p></div>${icon('arrow')}</button>`;
      })
      .join('') || empty('Nenhum item', 'Adicione um compromisso ou ajuste os filtros.');
}
function openAgendaEntry(index) {
  const e = agendaEvents().filter((e) => e.date === openedAgendaDay)[index];
  if (!e) return;
  if (e.personal) return showAgendaItem(e.personal.id);
  if (e.projectOnly) {
    closeModal();
    go('projects', e.projectOnly.id);
    return;
  }
  if (e.term) editTerm(e.term);
  else editRecord(e.r.project.id, e.r.id);
  const foot = document.querySelector('.dialogfoot');
  if (foot)
    foot.insertAdjacentHTML(
      'afterbegin',
      btn('Voltar ao dia', `openAgendaDay('${openedAgendaDay}',true)`, 'arrow')
    );
}
let meetingPicker = null,
  meetingPickerTimer = null;
function meetingParticipantPicker(values) {
  meetingPicker = {
    selected: new Map(
      [...new Set(values || [])].map((value) => [value, { email: value, name: value }])
    ),
    users: new Map(),
    query: '',
    offset: 0,
    hasMore: false,
    request: 0,
    loading: false,
  };
  return `<div class="field meeting-participants-field" id="meetingParticipantsField"><label>Participantes da reunião</label><details class="meeting-participant-select" id="meetingParticipantsBox"><summary>Selecionar usuários cadastrados <span id="meetingParticipantsCount"></span></summary><div class="meeting-participant-menu"><input type="search" aria-label="Buscar participantes por nome ou e-mail" placeholder="Buscar nome ou e-mail..." oninput="searchMeetingParticipants(this.value)"><div id="meetingParticipantsOptions" class="meeting-participant-options" aria-label="Usuários cadastrados"></div><button class="btn" type="button" id="meetingParticipantsMore" hidden onclick="loadMeetingParticipants(true)">Mostrar mais usuários</button></div></details><div id="meetingParticipantsSelected" class="meeting-participant-selected" aria-live="polite"></div><small>Selecione uma ou mais pessoas. A reunião aparecerá também na agenda dos participantes selecionados. Apenas quem organiza pode editar ou excluir.</small></div>`;
}
function renderMeetingParticipants() {
  const state = meetingPicker,
    root = document.getElementById('meetingParticipantsSelected');
  if (!state || !root) return;
  root.innerHTML = [...state.selected.values()]
    .map(
      (u, i) =>
        `<span class="meeting-participant-chip">${esc(u.name || u.email)}<input type="hidden" name="participants" value="${esc(u.email)}"><button type="button" aria-label="Remover participante ${esc(u.name || u.email)}" onclick="removeMeetingParticipant(${i})">×</button></span>`
    )
    .join('');
  const count = document.getElementById('meetingParticipantsCount');
  if (count) count.textContent = state.selected.size ? `${state.selected.size} selecionado(s)` : '';
  const list = document.getElementById('meetingParticipantsOptions');
  if (!list) return;
  list.innerHTML =
    [...state.users.values()]
      .map(
        (u, i) =>
          `<label class="meeting-participant-option"><input type="checkbox" data-participant-index="${i}" ${state.selected.has(u.email) ? 'checked' : ''} onchange="selectMeetingParticipant(${i},this.checked)"><span><strong>${esc(u.name || u.email)}</strong><small>${esc(u.email)}</small></span></label>`
      )
      .join('') ||
    `<p class="subtitle">${state.loading ? 'Carregando usuários…' : 'Nenhum usuário encontrado.'}</p>`;
  const more = document.getElementById('meetingParticipantsMore');
  if (more) {
    more.hidden = !state.hasMore;
    more.disabled = state.loading;
  }
}
function selectMeetingParticipant(index, checked) {
  if (!meetingPicker) return;
  const user = [...meetingPicker.users.values()][index];
  if (!user) return;
  if (checked) {
    if (meetingPicker.selected.size >= 100) {
      renderMeetingParticipants();
      return notify('Selecione até 100 participantes.', 'error');
    }
    meetingPicker.selected.set(user.email, user);
  } else meetingPicker.selected.delete(user.email);
  renderMeetingParticipants();
  document.querySelector(`[data-participant-index="${index}"]`)?.focus();
}
function removeMeetingParticipant(index) {
  if (!meetingPicker) return;
  const key = [...meetingPicker.selected.keys()][index];
  meetingPicker.selected.delete(key);
  renderMeetingParticipants();
}
function searchMeetingParticipants(value) {
  if (!meetingPicker) return;
  meetingPicker.query = value.trim();
  meetingPicker.request++;
  clearTimeout(meetingPickerTimer);
  const state = meetingPicker;
  meetingPickerTimer = setTimeout(() => {
    if (meetingPicker === state) loadMeetingParticipants(false);
  }, 220);
}
async function loadMeetingParticipants(more = false) {
  const state = meetingPicker;
  if (!state || !(document.getElementById('agendaItemForm') || document.getElementById('workOwnersForm'))) return;
  const request = ++state.request;
  if (!more) {
    state.offset = 0;
    state.users.clear();
  }
  state.loading = true;
  renderMeetingParticipants();
  try {
    if (!window.sb) throw new Error('Conexão ao servidor indisponível.');
    const result = await window.sb.rpc('secap_meeting_users', {
      p_search: state.query,
      p_offset: state.offset,
    });
    if (
      state !== meetingPicker ||
      request !== state.request ||
      !(document.getElementById('agendaItemForm') || document.getElementById('workOwnersForm'))
    )
      return;
    if (
      result.error &&
      (result.error.code === 'PGRST202' || /schema cache/.test(result.error.message || ''))
    ) {
      if (typeof isSysAdmin === 'function' && isSysAdmin()) {
        let directory = window.sb
          .from('profiles')
          .select('id,name,email')
          .in('role', ['administrador', 'usuario'])
          .order('name')
          .order('id');
        if (state.query)
          directory = directory.or(
            'name.ilike.%' +
              state.query.replace(/[%,().]/g, '') +
              '%,email.ilike.%' +
              state.query.replace(/[%,().]/g, '') +
              '%'
          );
        const fallback = await directory.range(state.offset, state.offset + 50);
        if (fallback.error) throw fallback.error;
        result.error = null;
        result.data = {
          users: (fallback.data || []).slice(0, 50),
          hasMore: (fallback.data || []).length > 50,
        };
      } else
        throw new Error(
          'A consulta de participantes ainda não foi instalada neste banco. Solicite ao administrador aplicar supabase/security/meeting_participants.sql.'
        );
    }
    if (
      state !== meetingPicker ||
      request !== state.request ||
      !(document.getElementById('agendaItemForm') || document.getElementById('workOwnersForm'))
    )
      return;
    if (result.error) throw result.error;
    if (!Array.isArray(result.data?.users)) throw new Error('Lista de usuários inválida.');
    for (const u of result.data.users) {
      if (!u.email) continue;
      state.users.set(u.id, u);
      if (state.selected.has(u.email)) state.selected.set(u.email, u);
    }
    state.offset += result.data.users.length;
    state.hasMore = !!result.data.hasMore;
  } catch (error) {
    if (state !== meetingPicker || request !== state.request) return;
    state.hasMore = false;
    state.loading = false;
    renderMeetingParticipants();
    const list = document.getElementById('meetingParticipantsOptions');
    if (list)
      list.innerHTML = `<p class="meeting-participant-error" role="alert">Não foi possível carregar os usuários. ${esc(error?.message || error)}</p><button class="btn" type="button" onclick="loadMeetingParticipants()">Tentar novamente</button>`;
    return;
  } finally {
    if (state === meetingPicker && request === state.request) {
      state.loading = false;
    }
  }
  renderMeetingParticipants();
}
function toggleMeetingParticipants() {
  const form = document.getElementById('agendaItemForm'),
    field = document.getElementById('meetingParticipantsField');
  if (!form || !field) return;
  const isMeeting = form.elements.kind.value === 'meeting';
  field.hidden = !isMeeting;
  if (isMeeting && meetingPicker && !meetingPicker.users.size) loadMeetingParticipants();
}
function editAgendaItem(d, id = '') {
  const e = calendarPrivateItems.find((e) => e.id === id) || {};
  if (e.canEdit === false)
    return notify('Somente o organizador pode editar esta reunião.', 'error');
  clearTimeout(meetingPickerTimer);
  modal(
    id ? 'Editar compromisso' : 'Adicionar compromisso',
    `<form id="agendaItemForm" onsubmit="event.preventDefault();saveAgendaItem('${id}')"><div class="field"><label>Tipo</label><select name="kind" onchange="toggleMeetingParticipants()"><option value="personal" ${e.kind !== 'meeting' ? 'selected' : ''}>Lembrete privado</option><option value="meeting" ${e.kind === 'meeting' ? 'selected' : ''}>Reunião de equipe</option></select></div><div class="field"><label>Título</label><input name="title" required maxlength="180" value="${esc(e.title || '')}"></div><div class="twocol"><div class="field"><label>Data</label><input type="date" name="date" required value="${esc(e.date || d)}"></div><div class="field"><label>Horário (opcional)</label><input type="time" name="time" value="${esc(e.time || '')}"></div></div><div class="field"><label>Anotações / pauta / local</label><textarea name="description" rows="4" maxlength="10000">${esc(e.description || '')}</textarea></div>${meetingParticipantPicker(e.participants || [])}<p>Este compromisso não altera as obras ou o BI.</p><button class="btn primary" type="submit" data-agenda-save>Salvar compromisso</button></form>`,
    btn('Voltar ao dia', `openAgendaDay('${d}',true)`, 'arrow')
  );
  renderMeetingParticipants();
  toggleMeetingParticipants();
}
async function saveAgendaItem(id) {
  const f = document.getElementById('agendaItemForm'),
    formData = new FormData(f),
    data = Object.fromEntries(formData);
  data.id = id;
  data.participants =
    data.kind === 'meeting' ? [...new Set(formData.getAll('participants').map(String))] : [];
  if (data.participants.length > 100) return notify('Selecione até 100 participantes.', 'error');
  const b = f.querySelector('[data-agenda-save]');
  if (b.disabled) return;
  b.disabled = true;
  try {
    const r = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error((await r.json()).error);
    calendarLoaded = false;
    await loadPrivateAgenda();
    openAgendaDay(data.date);
    notify('Compromisso salvo na agenda.');
  } catch (error) {
    notify(error.message, 'error');
    b.disabled = false;
  }
}

function showAgendaItem(id) {
  const e = calendarPrivateItems.find((e) => e.id === id);
  if (!e) return;
  const names =
    e.participantNames ||
    (e.participants || []).map((value) =>
      value.includes('@') ? 'Participante sem nome cadastrado' : value
    );
  modal(
    e.kind === 'meeting' ? 'Reunião de equipe' : 'Lembrete privado',
    `<h3>${esc(e.title)}</h3><p>${date(e.date)} ${esc(e.time || '')}</p><p style="white-space:pre-wrap">${esc(e.description || 'Sem anotações')}</p>${e.kind === 'meeting' ? `<h4>Participantes</h4><ul>${names.map((name) => `<li>${esc(name)}</li>`).join('') || '<li>Nenhum participante informado</li>'}</ul><p class="subtitle">Organizador: ${esc(e.organizerName || 'Não informado')}. Visível nas agendas dos participantes selecionados.</p>` : '<p class="subtitle">Visível apenas ao titular da agenda.</p>'}`,
    btn('Voltar ao dia', `openAgendaDay('${e.date}',true)`, 'arrow') +
      (e.canEdit === false
        ? ''
        : btn('Editar', `editAgendaItem('${e.date}','${e.id}')`, 'edit') +
          btn('Excluir', `confirmAgendaDelete('${e.id}')`, 'trash'))
  );
}
function confirmAgendaDelete(id) {
  const e = calendarPrivateItems.find((e) => e.id === id);
  if (!e) return;
  modal(
    'Excluir compromisso?',
    `<p>Excluir <strong>${esc(e.title)}</strong> da sua agenda? Projetos e obras serão preservados.</p>`,
    btn('Cancelar', `showAgendaItem('${id}')`, 'arrow') +
      btn('Confirmar exclusão', `deleteAgendaItem('${id}')`, 'trash')
  );
}
async function deleteAgendaItem(id) {
  const e = calendarPrivateItems.find((e) => e.id === id);
  if (!e) return;
  const r = await fetch('/api/calendar/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!r.ok) return notify('Não foi possível excluir.');
  calendarLoaded = false;
  await loadPrivateAgenda();
  openAgendaDay(e.date);
}
