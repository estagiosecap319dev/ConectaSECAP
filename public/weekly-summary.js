/* ============================================================================
   SECAP · RESUMO SEMANAL (Exportar → formato "Resumo semanal")
   Gera uma mensagem pronta (WhatsApp / e-mail / Teams) com a situação das obras do
   conjunto selecionado: prazos vencidos, prazos próximos, pontos de atenção, etc.
   O texto fica num campo editável; o botão copia o que estiver no campo.
   Usa os mesmos critérios do restante do portal (val, canonicalStatus, daysLeft,
   physicalProgress, recordTitle). Não altera dados.
   ============================================================================ */

const wsOptions = { horizon: 15, owner: true, progress: true, limit: 20 };

function wsBr(iso) {
  return /^\d{4}-\d{2}-\d{2}/.test(iso || '') ? iso.slice(0, 10).split('-').reverse().join('/') : '';
}

function wsShortBr(iso) {
  return wsBr(iso).slice(0, 5);
}

function wsWeekRange() {
  const now = new Date(today() + 'T12:00:00');
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const iso = (d) => d.toLocaleDateString('en-CA');
  return [iso(monday), iso(sunday)];
}

function wsRows(pid) {
  const projects = visible().filter((p) => !pid || p.id === pid);
  return projects
    .flatMap((p) => (p.records || []).map((r) => ({ r, p })))
    .filter(({ r, p }) => (typeof statusFilterMatch === 'function' ? statusFilterMatch(r, p) : !filterStatus || r.status === filterStatus || String(val(r, p, 'status') || '') === filterStatus) && matchesQuery(r));
}

function wsClassify(rows, horizon) {
  const groups = { done: [], cancelled: [], overdue: [], dueSoon: [], attention: [], running: [], noDeadline: [], stale: [] };
  for (const x of rows) {
    const status = canonicalStatus(val(x.r, x.p, 'status'));
    if (status === 'Cancelado') {
      groups.cancelled.push(x);
      continue;
    }
    if (status === 'Concluído') {
      groups.done.push(x);
      continue;
    }
    const deadline = val(x.r, x.p, 'deadline');
    const days = deadline ? daysLeft(deadline) : null;
    x.deadline = deadline;
    x.days = days;
    x.status = status;
    if ((days !== null && days < 0) || status === 'Atrasado') groups.overdue.push(x);
    else if (days !== null && days <= horizon) groups.dueSoon.push(x);
    else if (['Ponto de Atenção', 'Paralisado'].includes(status)) groups.attention.push(x);
    else groups.running.push(x);
    if (days === null) groups.noDeadline.push(x);
    const updated = typeof execDataDate === 'function' ? execDataDate(x) : null;
    if (!updated || daysLeft(updated) < -30) groups.stale.push(x);
  }
  groups.overdue.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
  groups.dueSoon.sort((a, b) => a.days - b.days);
  return groups;
}

function wsLine(x, kind, opts) {
  const parts = [recordTitle(x.r, x.p)];
  if (kind === 'overdue') {
    if (x.days !== null && x.days < 0) {
      const late = -x.days;
      parts.push(`venceu em ${wsBr(x.deadline)} (${late === 1 ? 'há 1 dia' : `há ${late} dias`})`);
    } else parts.push('marcada como atrasada' + (x.deadline ? ` · prazo ${wsBr(x.deadline)}` : ' · sem prazo informado'));
  } else if (kind === 'dueSoon') {
    parts.push(
      `vence em ${wsBr(x.deadline)} (${x.days === 0 ? 'hoje' : x.days === 1 ? 'amanhã' : `em ${x.days} dias`})`
    );
  } else if (kind === 'attention') {
    parts.push(x.status.toLowerCase() + (x.deadline ? ` · prazo ${wsBr(x.deadline)}` : ''));
  }
  if (opts.progress) {
    const pct = physicalProgress(val(x.r, x.p, 'progress'));
    if (pct !== null) parts.push(`${Math.round(pct)}% executado`);
  }
  if (opts.owner) {
    const owner = String(val(x.r, x.p, 'owner') || '').trim();
    parts.push(owner ? `Resp.: ${owner}` : 'Resp.: não informado');
  }
  return '• ' + parts.join(' — ');
}

function wsSection(emoji, title, items, kind, opts) {
  if (!items.length) return '';
  const shown = items.slice(0, opts.limit).map((x) => wsLine(x, kind, opts));
  if (items.length > opts.limit) shown.push(`… e mais ${items.length - opts.limit}`);
  return `${emoji} *${title} (${items.length})*\n${shown.join('\n')}\n`;
}

function weeklySummaryText(pid = '', opts = wsOptions) {
  const rows = wsRows(pid);
  const project = pid ? visible().find((p) => p.id === pid) : null;
  const g = wsClassify(rows, opts.horizon);
  const [mon, sun] = wsWeekRange();
  const active = rows.length - g.done.length - g.cancelled.length;
  const lines = [];
  lines.push(`📋 *Resumo semanal${project ? ' — ' + project.name : ''}*`);
  lines.push(`Semana de ${wsShortBr(mon)} a ${wsBr(sun)}`);
  lines.push('');
  lines.push('Bom dia! Segue o panorama atualizado das obras:');
  lines.push('');
  lines.push(`*Total: ${rows.length} obra(s)*${g.cancelled.length ? ` (${g.cancelled.length} cancelada(s))` : ''}`);
  lines.push(`🟢 Concluídas: ${g.done.length}`);
  lines.push(`🔵 Em andamento, dentro do prazo: ${g.running.length}`);
  lines.push(`🟡 Vencem nos próximos ${opts.horizon} dias: ${g.dueSoon.length}`);
  lines.push(`🟡 Ponto de atenção / paralisadas: ${g.attention.length}`);
  lines.push(`🔴 Atrasadas / prazo vencido: ${g.overdue.length}`);
  lines.push('');
  const sections = [
    wsSection('🔴', 'Atrasadas / prazo vencido', g.overdue, 'overdue', opts),
    wsSection('🟡', `Vencem nos próximos ${opts.horizon} dias`, g.dueSoon, 'dueSoon', opts),
    wsSection('🟡', 'Ponto de atenção / paralisadas', g.attention, 'attention', opts),
  ].filter(Boolean);
  if (sections.length) lines.push(sections.join('\n'));
  else lines.push('🟢 Nenhuma obra com prazo vencido, prazo próximo ou ponto de atenção. 👏\n');
  const notes = [];
  if (g.noDeadline.length) notes.push(`${g.noDeadline.length} obra(s) em aberto sem prazo informado`);
  if (g.stale.length) notes.push(`${g.stale.length} obra(s) sem atualização há mais de 30 dias`);
  if (notes.length) {
    lines.push('*Pendências de cadastro:*');
    notes.forEach((n) => lines.push('• ' + n));
    lines.push('');
  }
  if (g.overdue.length || g.dueSoon.length || notes.length)
    lines.push(
      'Peço, por gentileza, que os responsáveis atualizem no Portal SECAP a situação, o prazo e o percentual executado das obras listadas.'
    );
  lines.push('');
  lines.push('Qualquer dúvida, estou à disposição.');
  return { text: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim(), active };
}

function wsRefresh(pid) {
  const area = $('#weeklySummaryText');
  if (!area) return;
  wsOptions.horizon = Number($('#wsHorizon')?.value) || 15;
  wsOptions.owner = !!$('#wsOwner')?.checked;
  wsOptions.progress = !!$('#wsProgress')?.checked;
  area.value = weeklySummaryText(pid, wsOptions).text;
}

function wsToggle(pid) {
  const summary = $('#exportFormat')?.value === 'resumo';
  const columns = document.querySelector('#modal .export-columns')?.closest('.field');
  if (columns) columns.hidden = summary;
  const box = $('#weeklySummaryBox');
  if (box) box.hidden = !summary;
  const button = [...document.querySelectorAll('#modal button')].find((b) =>
    String(b.getAttribute('onclick') || '').startsWith('performExport')
  );
  if (button) button.innerHTML = summary ? `${icon('file')} Copiar mensagem` : `${icon('download')} Exportar arquivo`;
  const sub = document.querySelector('#modal .subtitle');
  if (sub && !sub.dataset.original) sub.dataset.original = sub.textContent;
  if (sub)
    sub.textContent = summary
      ? 'Mensagem pronta com a situação das obras do conjunto selecionado. Revise, edite se precisar e copie.'
      : sub.dataset.original;
  if (summary) wsRefresh(pid);
}

async function wsCopy() {
  const area = $('#weeklySummaryText');
  if (!area) return;
  try {
    await navigator.clipboard.writeText(area.value);
  } catch {
    area.select();
    document.execCommand('copy');
  }
  notify('Mensagem copiada. É só colar no WhatsApp, e-mail ou Teams.');
}

const wsOpenExportBefore = openExport;
openExport = function (pid = '') {
  wsOpenExportBefore(pid);
  const select = $('#exportFormat');
  if (!select || select.querySelector('option[value="resumo"]')) return;
  select.insertAdjacentHTML('beforeend', '<option value="resumo">Resumo semanal (mensagem para copiar)</option>');
  select.closest('.field').insertAdjacentHTML(
    'afterend',
    `<div class="field weekly-summary" id="weeklySummaryBox" hidden>
      <div class="weekly-summary-options">
        <label>Prazo próximo: <select id="wsHorizon">${[7, 15, 30]
          .map((d) => `<option value="${d}" ${wsOptions.horizon === d ? 'selected' : ''}>${d} dias</option>`)
          .join('')}</select></label>
        <label><input type="checkbox" id="wsOwner" ${wsOptions.owner ? 'checked' : ''}> Mostrar responsável</label>
        <label><input type="checkbox" id="wsProgress" ${wsOptions.progress ? 'checked' : ''}> Mostrar % executado</label>
      </div>
      <label for="weeklySummaryText">Mensagem (pode editar antes de copiar)</label>
      <textarea id="weeklySummaryText" rows="16" spellcheck="true"></textarea>
      <small>🟢 concluída · 🔵 em andamento · 🟡 atenção ou prazo próximo · 🔴 atrasada. Ao mudar as opções acima, a mensagem é gerada de novo.</small>
    </div>`
  );
  const pidArg = pid;
  select.addEventListener('change', () => wsToggle(pidArg));
  ['#wsHorizon', '#wsOwner', '#wsProgress'].forEach((s) =>
    $(s)?.addEventListener('change', () => wsRefresh(pidArg))
  );
};

const wsPerformExportBefore = performExport;
performExport = function (pid = '') {
  if ($('#exportFormat')?.value === 'resumo') return wsCopy();
  return wsPerformExportBefore(pid);
};
