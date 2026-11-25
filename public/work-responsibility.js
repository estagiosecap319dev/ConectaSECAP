/* Responsabilidade da obra não concede permissões de edição de campos. */
function workOwnerKey(p) {
  return fieldKey(p, 'owner') || 'responsavel';
}
function workOwnerNames(value) {
  const values = Array.isArray(value) ? value : String(value ?? '').split(/[;\n]+/);
  return [
    ...new Set(
      values
        .map((v) => String(v?.name || v || '').trim())
        .filter(
          (name) =>
            name &&
            ![
              '—',
              '-',
              'sem responsável',
              'sem responsavel',
              'não informado',
              'nao informado',
            ].includes(name.toLowerCase())
        )
    ),
  ];
}
function workOwnerText(r, p) {
  return workOwnerNames(r[workOwnerKey(p)] ?? r.responsavel).join('; ');
}
/* Aba Acompanhamento: o responsável exibido é o do campo "Responsável Acompanhamento"
   (mesmo critério do SQL acomp_field). Sem esse campo no projeto, usa o responsável da obra. */
function workAcompField(p) {
  return (p?.fields || []).find((f) =>
    /^respons[aá]vel\s+(pelo\s+)?acompanhamento/i.test(String(f?.name || '').trim())
  );
}
function workAcompNames(value) {
  // Mesmos separadores do banco: "/" ";" "," e " e " ("Heloísa / Hélen" => Heloísa, Hélen).
  const parts = String(value ?? '').split(/\s*[\/;,\n]\s*|\s+e\s+/i);
  return workOwnerNames(parts);
}
function workCardNames(r, p) {
  const f = workAcompField(p);
  return f ? workAcompNames(r?.[f.id]) : workOwnerNames(workOwnerText(r, p));
}
function workFieldEditable(p, key) {
  if (!p || !canEdit(p)) return false;
  const allowed = getAllowedFieldsForCurrentUser(p.id);
  return allowed === null || (Array.isArray(allowed) && allowed.includes(key));
}
function workStageStatus(stage) {
  const value = canonicalStatus(stage);
  if (value === 'Ainda não definido') return value;
  if (value === 'Em planejamento') return 'Em planejamento';
  return [
    'Concluído',
    'Em andamento',
    'Ponto de Atenção',
    'Paralisado',
    'Cancelado',
    'Não iniciado',
    'Atrasado',
    'Em análise',
    'Iniciado',
  ].includes(value)
    ? value
    : // Etapa nova criada no quadro de Acompanhamento passa a ser um status da obra.
      value || null;
}
function workStatusValue(p, stage) {
  const target = workStageStatus(stage);
  if (!target) return null;
  const options = p.fields.find((f) => f.id === obraStatusKey(p))?.options || [];
  return options.find((v) => canonicalStatus(v) === target) || target;
}
obraStage = function (r, p, b = activeBoard()) {
  const status = canonicalStatus(obraStatus(r, p));
  return (
    b.stages.find((stage) => workStageStatus(stage) === status) ||
    b.stages.find(
      (stage) =>
        stage ===
        (OBRA_STAGE_FALLBACK[status] ||
          (['Em planejamento', 'Não iniciado'].includes(status)
            ? 'Planejamento'
            : ''))
    ) ||
    'Ainda não definido'
  );
};
obraCard = function (p, r, b) {
  const editable = workFieldEditable(p, obraStatusKey(p)),
    names = workCardNames(r, p),
    acompField = workAcompField(p),
    color = p.color || '#003856',
    pct = physicalProgress(r.progresso),
    stage = obraStage(r, p, b);
  const owners = names.length
    ? names
        .slice(0, 2)
        .map(
          (name) =>
            `<span class="work-owner-chip"><span aria-hidden="true">${esc(initials(name))}</span>${esc(name)}</span>`
        )
        .join('') +
      (names.length > 2 ? `<span class="work-owner-extra">+${names.length - 2}</span>` : '')
    : acompField
      ? '<span class="work-owner-missing">Sem responsável de acompanhamento</span>'
      : '<span class="work-owner-missing">+ Definir responsáveis</span>';
  return `<article class="kanban tcard" style="border-top:4px solid ${color}" draggable="${editable}" ondragstart="kanbanDragStart(event,'${esc(p.id)}|${esc(r.id)}')" ondragend="kanbanDragEnd(this)"><button class="tcard-title" onclick="editRecord('${esc(p.id)}','${esc(r.id)}')"><h3>${esc(r.nome || 'Obra sem nome')}</h3></button><p class="tcard-next">${esc(p.name)}${r.orgao ? ' · ' + esc(r.orgao) : ''}</p>${pct !== null ? `<div class="pr"><div class="progress"><i style="width:${pct}%;background:${color}"></i></div>${pct}%</div>` : ''}<div class="tcard-foot">${late(r) ? `<span class="tcard-chip late">${icon('alert')}Em atraso</span>` : ''}${r.prazo ? `<span class="tcard-chip">${icon('calendar')}${esc(date(r.prazo))}</span>` : ''}</div><button type="button" class="work-owner-list" title="${esc(names.join('; ') || (acompField ? 'Sem Responsável Acompanhamento — edite a obra para definir' : 'Sem responsável — clique para definir'))}" aria-label="Responsáveis por ${esc(r.nome || 'obra')}: ${esc(names.join('; ') || 'não informados')}" ${workFieldEditable(p, acompField ? acompField.id : workOwnerKey(p)) ? '' : 'disabled'} onclick="${acompField ? `editRecord('${esc(p.id)}','${esc(r.id)}')` : `openWorkOwners('${esc(p.id)}','${esc(r.id)}')`}">${owners}</button>${editable ? `<select class="tcard-move" aria-label="Alterar status de ${esc(r.nome || 'obra')}" onchange="moveObra('${esc(p.id)}','${esc(r.id)}',this.value)">${b.stages.map((v) => `<option ${v === stage ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>` : ''}</article>`;
};
const workSaving = new Set();
async function saveWorkUpdate(p, r, next) {
  if (workSaving.has(r.id)) return false;
  // Responsável pela próxima ação é opcional: a obra pode ser salva sem ele.
  const backend = window.SECAP_OBRAS_BACKEND;
  if (!backend) {
    notify('Conexão ao banco indisponível. A obra não foi alterada.', 'error');
    return false;
  }
  workSaving.add(r.id);
  try {
    const result = await backend.saveObra(p.id, next);
    if (!result?.ok) throw new Error(result?.error || 'O banco não confirmou a alteração.');
    Object.assign(r, next);
    const live = db.projects.find((q) => q.id === p.id)?.records.find((item) => item.id === r.id);
    if (live && live !== r) Object.assign(live, next);
    return true;
  } catch (error) {
    notify('Não foi possível salvar a obra: ' + error.message, 'error');
    return false;
  } finally {
    workSaving.delete(r.id);
  }
}
moveObra = async function (pid, rid, stage) {
  const b = activeBoard(),
    p = visible().find((p) => p.id === pid),
    r = p?.records.find((r) => r.id === rid);
  if (!r || !b.stages.includes(stage)) return;
  if (obraStage(r, p, b) === stage) {
    render();
    return;
  }
  const key = obraStatusKey(p);
  if (!workFieldEditable(p, key)) {
    notify('Você não tem permissão para alterar o status desta obra.', 'error');
    render();
    return;
  }
  const value = workStatusValue(p, stage);
  if (!value) {
    notify('A etapa precisa ter um nome de situação reconhecido para atualizar a obra.', 'error');
    render();
    return;
  }
  // Responsável pela próxima ação é opcional: mover a obra não exige preenchê-lo.
  if (canonicalStatus(obraStatus(r, p)) === canonicalStatus(value)) {
    render();
    return;
  }
  if (await saveWorkUpdate(p, r, { ...r, [key]: value })) {
    auditLoaded = false;
    render();
    notify('Status da obra atualizado no projeto, acompanhamento e BI.');
  } else render();
};
let workOwnersContext = null;
function openWorkOwners(pid, rid, pendingStage = '', formMode = false) {
  const p = visible().find((p) => p.id === pid),
    r = p?.records.find((r) => r.id === rid) || {};
  if (!p || !workFieldEditable(p, workOwnerKey(p))) return;
  const form = document.getElementById('recordForm'),
    key = workOwnerKey(p);
  const existing = formMode ? form?.elements.namedItem(key)?.value : workOwnerText(r, p);
  workOwnersContext = { pid, rid, pendingStage, formMode, formElement: formMode ? form : null };
  // No formulário, o seletor é inserido sem fechar a edição nem perder os campos preenchidos.
  const markup = `<form id="workOwnersForm" onsubmit="event.preventDefault();saveWorkOwners()">${meetingParticipantPicker(
    workOwnerNames(existing)
  )
    .replace('Participantes da reunião', 'Responsáveis pela obra')
    .replace('Selecionar usuários cadastrados', 'Selecionar responsáveis cadastrados')
    .replace(
      /<small>Selecione uma ou mais pessoas\.[\s\S]*?<\/small>/,
      '<small>Selecione uma ou mais pessoas. A atribuição não altera permissões de acesso.</small>'
    )}<div class="field"><label for="workOwnerManual">Ou adicionar um nome</label><div class="actions"><input id="workOwnerManual" maxlength="120" placeholder="Nome do responsável"><button class="btn" type="button" onclick="addWorkOwnerName()">Adicionar</button></div></div><p id="workOwnersError" role="alert"></p><button class="btn primary" type="submit">${pendingStage ? 'Salvar responsáveis e mover obra' : 'Salvar responsáveis'}</button></form>`;
  if (formMode) {
    document.getElementById('workOwnersInline')?.remove();
    const panel = document.createElement('section');
    panel.id = 'workOwnersInline';
    panel.className = 'panel work-owner-inline';
    panel.innerHTML =
      '<h3>Responsáveis pela obra</h3>' +
      markup +
      '<button type="button" class="btn" onclick="document.getElementById(\'workOwnersInline\').remove()">Cancelar seleção</button>';
    form.after(panel);
    panel.scrollIntoView?.({ block: 'nearest' });
  } else modal('Responsáveis pela obra', markup, btn('Cancelar', 'closeModal();render()', 'close'));
  renderMeetingParticipants();
  loadMeetingParticipants();
}
function addWorkOwnerName() {
  const input = document.getElementById('workOwnerManual'),
    name = input.value.trim();
  if (!name) return;
  if (meetingPicker.selected.size >= 100) return notify('Selecione até 100 responsáveis.', 'error');
  meetingPicker.selected.set(name, { email: name, name });
  input.value = '';
  renderMeetingParticipants();
}
async function saveWorkOwners() {
  const context = workOwnersContext,
    p = visible().find((p) => p.id === context?.pid);
  if (!p || !workFieldEditable(p, workOwnerKey(p))) return;
  const names = [
    ...new Set(
      [...meetingPicker.selected.values()]
        .map((u) => String(u.name || u.email).trim())
        .filter(Boolean)
    ),
  ];
  if (!names.length && context.pendingStage) {
    document.getElementById('workOwnersError').textContent =
      'Selecione ou informe pelo menos um responsável.';
    return;
  }
  if (names.some((name) => name.length > 254) || names.length > 100)
    return notify('Confira os nomes dos responsáveis.', 'error');
  const key = workOwnerKey(p),
    text = names.join('; ');
  if (context.formMode) {
    const form = context.formElement,
      input = form?.elements.namedItem(key);
    if (!input) return notify('Reabra a edição da obra.', 'error');
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('workOwnersInline')?.remove();
    return;
  }
  const r = p.records.find((r) => r.id === context.rid);
  if (!r) return;
  if (context.pendingStage && !workFieldEditable(p, obraStatusKey(p)))
    return notify('Você não tem permissão para alterar o status.', 'error');
  const next = { ...r, [key]: text };
  if (context.pendingStage) next[obraStatusKey(p)] = workStatusValue(p, context.pendingStage);
  const button = document.querySelector('#workOwnersForm [type=submit]');
  if (button.disabled) return;
  button.disabled = true;
  if (await saveWorkUpdate(p, r, next)) {
    auditLoaded = false;
    closeModal();
    render();
    notify('Responsáveis da obra salvos.');
  } else if (button.isConnected) button.disabled = false;
}
const workRecordFormBefore = openRecordForm;
openRecordForm = function (pid, rid = '') {
  const result = workRecordFormBefore.apply(this, arguments),
    p = visible().find((p) => p.id === pid),
    form = document.getElementById('recordForm');
  if (!p || !form) return result;
  const key = workOwnerKey(p);
  let input = form.elements.namedItem(key);
  if (!input && isSysAdmin()) {
    const box = document.createElement('div');
    box.className = 'field';
    box.innerHTML = `<label>Responsáveis pela obra (opcional)</label><input name="${esc(key)}" value="${esc(workOwnerText(p.records.find((r) => r.id === rid) || {}, p))}">`;
    form.prepend(box);
    input = form.elements.namedItem(key);
  }
  if (input) {
    input.required = false;
    input.placeholder = 'Informe um ou mais nomes, separados por ponto e vírgula';
    if (!input.disabled && workFieldEditable(p, key)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn work-owner-choose';
      button.textContent = 'Selecionar responsáveis';
      button.onclick = () => openWorkOwners(pid, rid, '', true);
      input.after(button);
    }
  }
  return result;
};
const workSaveRecordBefore = window.saveRecord;
window.saveRecord = function (pid, rid = '') {
  const p = visible().find((p) => p.id === pid),
    form = document.getElementById('recordForm'),
    key = p ? workOwnerKey(p) : 'responsavel';
  const value = form?.elements.namedItem(key)?.value ?? p?.records.find((r) => r.id === rid)?.[key];
  // Responsável pela próxima ação é opcional (o acesso é definido pelo Responsável Acompanhamento).
  return workSaveRecordBefore.apply(this, arguments);
};
