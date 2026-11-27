/* ============================================================================
   SECAP · CANCELAR A EDIÇÃO DE UMA OBRA
   Antes: "Cancelar" com algo digitado levava à tela de justificativas, que só
   permitia salvar; o X, o clique fora e a tecla Esc fechavam sem perguntar.
   Agora "Salvar alterações" só guarda as mudanças; elas são gravadas ao concluir as
   justificativas. Sair sem justificar (Cancelar, X, clique fora ou Esc, no formulário
   ou na janela de justificativas) pergunta "Tem certeza que deseja sair sem a
   justificativa?": "Voltar" mantém tudo; "Descartar alterações" joga fora (nada é gravado).
   ============================================================================ */

// Projeto e obra do formulário aberto (lidos do onsubmit do #recordForm).
function recordFormIds() {
  const form = document.querySelector('#modal #recordForm');
  const m = /saveRecord\('([^']*)','([^']*)'\)/.exec(form?.getAttribute('onsubmit') || '');
  return m ? { pid: m[1], rid: m[2] } : null;
}

// Alterações ainda não salvas: o que está digitado na obra aberta (lido direto do formulário,
// sem juntar à sessão) e as obras da sessão que foram editadas e não salvas.
function unsavedRecordChanges(pid, rid) {
  const list = [];
  const current = typeof collectCurrentFormDiffs === 'function' ? collectCurrentFormDiffs(pid, rid) : [];
  if (current.length) list.push({ rid: String(rid || 'novo_registro'), changes: current });
  if (typeof secapEditSession !== 'undefined' && secapEditSession.active && secapEditSession.records) {
    for (const entry of secapEditSession.records.values()) {
      if (entry.saved || !entry.changes?.size || entry.rid === String(rid || 'novo_registro')) continue;
      list.push({ rid: entry.rid, changes: [...entry.changes.values()] });
    }
  }
  return list;
}

function discardUnsavedRecordChanges() {
  // 1) o formulário aberto volta aos valores salvos (campos visíveis e escondidos);
  document.getElementById('recordForm')?.reset();
  // 2) as obras da sessão que não foram salvas saem da sessão. As já salvas ficam como estão.
  if (typeof secapEditSession === 'undefined' || !secapEditSession.records) return;
  for (const [key, entry] of [...secapEditSession.records.entries()]) {
    if (!entry.saved) secapEditSession.records.delete(key);
  }
}

// Janela de confirmação desenhada por cima do formulário (sem fechá-lo).
function confirmDiscardRecordChanges(unsaved) {
  return new Promise((resolve) => {
    document.getElementById('discardConfirm')?.remove();
    const fields = unsaved.reduce((n, item) => n + (item.changes?.length || 0), 0);
    const obras = unsaved.length;
    const detail =
      (obras > 1
        ? `Há alterações em <b>${obras} obras</b> (${fields} campo(s)) que ainda não foram salvas.`
        : `Há <b>${fields} campo(s)</b> alterado(s) que ainda não foram salvos.`) +
      ' As alterações só são salvas quando a justificativa é marcada. Se sair agora, elas serão descartadas.';
    const overlay = document.createElement('div');
    overlay.id = 'discardConfirm';
    overlay.className = 'discard-confirm-overlay';
    overlay.innerHTML = `
      <section class="discard-confirm" role="alertdialog" aria-modal="true" aria-labelledby="discardConfirmTitle" aria-describedby="discardConfirmText">
        <div class="discard-confirm-icon" aria-hidden="true">!</div>
        <h2 id="discardConfirmTitle">Tem certeza que deseja sair sem a justificativa?</h2>
        <p id="discardConfirmText">${detail}</p>
        <div class="discard-confirm-actions">
          <button type="button" class="btn" data-choice="stay">Voltar</button>
          <button type="button" class="btn danger" data-choice="discard">Descartar alterações</button>
        </div>
      </section>`;
    const finish = (discard) => {
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      resolve(discard);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        finish(false);
      }
    };
    overlay.addEventListener('click', (e) => {
      const choice = e.target.closest?.('[data-choice]')?.dataset.choice;
      if (choice) finish(choice === 'discard');
      else if (e.target === overlay) finish(false);
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(overlay);
    overlay.querySelector('[data-choice="stay"]').focus();
  });
}

// Obras desta sessão já salvas que ainda aguardam a revisão (justificativas).
function sessionHasSavedPending() {
  return (
    typeof secapEditSession !== 'undefined' &&
    secapEditSession.active &&
    [...secapEditSession.records.values()].some((e) => e.saved && e.changes.size)
  );
}

// Sai da edição sem passar pelas justificativas. O que já foi salvo continua salvo
// (e registrado na auditoria campo a campo); só a marcação da revisão não é registrada.
function exitRecordEditing(pid, rid) {
  if (typeof resetSecapEditSession === 'function') resetSecapEditSession();
  closeModal();
  if (rid && typeof editRecord === 'function') editRecord(pid, rid);
}

let recordCancelBusy = false;
handleCancelFromRecordForm = async function (pid, rid = '') {
  if (recordCancelBusy) return;
  const unsaved = unsavedRecordChanges(pid, rid);
  const savedPending = sessionHasSavedPending();
  if (!unsaved.length) {
    // Antes, com uma obra já salva, "Cancelar" voltava às justificativas e o usuário
    // ficava preso entre "Voltar à edição" e "Cancelar". Agora "Cancelar" sempre sai.
    exitRecordEditing(pid, rid);
    if (savedPending) notify('Edição encerrada. As alterações já salvas foram mantidas.');
    return;
  }
  recordCancelBusy = true;
  try {
    if (!(await confirmDiscardRecordChanges(unsaved))) return;
    discardUnsavedRecordChanges();
    exitRecordEditing(pid, rid);
    notify(
      savedPending
        ? 'Alterações não salvas descartadas. As já salvas foram mantidas.'
        : 'Alterações descartadas. Nada foi salvo.'
    );
  } finally {
    recordCancelBusy = false;
  }
};

// X do formulário, clique fora e Esc: mesmo caminho do "Cancelar" quando há algo digitado.
function recordFormHasUnsaved() {
  const ids = recordFormIds();
  if (!ids || document.getElementById('discardConfirm')) return null;
  return unsavedRecordChanges(ids.pid, ids.rid).length > 0 || sessionHasSavedPending() ? ids : null;
}
// No window (e não no document): roda antes da proteção de saída do templates.js, que leva
// direto às justificativas sem opção de descartar.
window.addEventListener(
  'click',
  (e) => {
    const closeBtn = e.target.closest?.('#modal .dialoghead .iconbtn');
    const backdrop = e.target.matches?.('#modal > .overlay') && e.target === e.target.closest('.overlay');
    if (!closeBtn && !backdrop) return;
    const ids = recordFormHasUnsaved();
    if (!ids) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    handleCancelFromRecordForm(ids.pid, ids.rid);
  },
  true
);
window.addEventListener(
  'keydown',
  (e) => {
    if (e.key !== 'Escape' || document.getElementById('discardConfirm')) return;
    const ids = recordFormHasUnsaved();
    if (!ids) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    handleCancelFromRecordForm(ids.pid, ids.rid);
  },
  true
);

// Janela de justificativas: X, clique fora ou Esc perguntam antes de sair. Nada foi gravado
// ainda (só grava ao concluir), então "Descartar alterações" apenas joga fora o que foi editado.
function sessionUnsavedList() {
  if (typeof secapEditSession === 'undefined' || !secapEditSession.active) return [];
  return [...secapEditSession.records.values()]
    .filter((e) => !e.saved && e.changes?.size)
    .map((e) => ({ rid: e.rid, changes: [...e.changes.values()] }));
}
let justificationExitBusy = false;
async function confirmExitFromJustification() {
  if (justificationExitBusy) return;
  const unsaved = sessionUnsavedList();
  const pid = secapEditSession.pid, rid = secapEditSession.currentRid;
  if (!unsaved.length) return exitRecordEditing(pid, rid);
  justificationExitBusy = true;
  try {
    if (!(await confirmDiscardRecordChanges(unsaved))) return;
    discardUnsavedRecordChanges();
    exitRecordEditing(pid, rid);
    notify('Alterações descartadas. Nada foi salvo.');
  } finally {
    justificationExitBusy = false;
  }
}
function justificationModalOpen() {
  return !!document.querySelector('#modal #exitAuditForm') && !document.getElementById('discardConfirm');
}
window.addEventListener(
  'click',
  (e) => {
    if (!justificationModalOpen()) return;
    const closeBtn = e.target.closest?.('#modal .dialoghead .iconbtn');
    const backdrop = e.target.matches?.('#modal > .overlay') && e.target === e.target.closest('.overlay');
    if (!closeBtn && !backdrop) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    confirmExitFromJustification();
  },
  true
);
window.addEventListener(
  'keydown',
  (e) => {
    if (e.key !== 'Escape' || !justificationModalOpen() || document.getElementById('adminUnmarkedExitDialog')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    confirmExitFromJustification();
  },
  true
);
