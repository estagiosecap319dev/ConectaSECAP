/* ============================================================================
   SECAP · CANCELAR A EDIÇÃO DE UMA OBRA
   Antes: "Cancelar" com algo digitado levava à tela de justificativas, que só
   permitia salvar; o X, o clique fora e a tecla Esc fechavam sem perguntar.
   Agora, se houver alteração ainda não salva, aparece "Tem certeza que deseja
   cancelar?". Ao confirmar, as alterações não salvas são descartadas (nada é
   gravado). Obras já salvas nesta sessão seguem para as justificativas, como antes.
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
      obras > 1
        ? `Há alterações não salvas em <b>${obras} obras</b> (${fields} campo(s)). Elas serão descartadas.`
        : `Há <b>${fields} campo(s)</b> alterado(s) nesta obra que ainda não foram salvos. Eles serão descartados.`;
    const overlay = document.createElement('div');
    overlay.id = 'discardConfirm';
    overlay.className = 'discard-confirm-overlay';
    overlay.innerHTML = `
      <section class="discard-confirm" role="alertdialog" aria-modal="true" aria-labelledby="discardConfirmTitle" aria-describedby="discardConfirmText">
        <div class="discard-confirm-icon" aria-hidden="true">!</div>
        <h2 id="discardConfirmTitle">Tem certeza que deseja cancelar?</h2>
        <p id="discardConfirmText">${detail}</p>
        <div class="discard-confirm-actions">
          <button type="button" class="btn" data-choice="stay">Continuar editando</button>
          <button type="button" class="btn danger" data-choice="discard">Sim, descartar alterações</button>
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

let recordCancelBusy = false;
const handleCancelFromRecordFormBefore = handleCancelFromRecordForm;
handleCancelFromRecordForm = async function (pid, rid = '') {
  if (recordCancelBusy) return;
  const unsaved = unsavedRecordChanges(pid, rid);
  if (!unsaved.length) return handleCancelFromRecordFormBefore(pid, rid);
  recordCancelBusy = true;
  try {
    if (!(await confirmDiscardRecordChanges(unsaved))) return;
    discardUnsavedRecordChanges();
    // Obras já salvas nesta sessão: segue o fluxo normal (justificativas). Sem nada salvo: só sai.
    const stillSaved = typeof secapEditSession !== 'undefined' && secapEditSession.active && [...secapEditSession.records.values()].some((e) => e.saved && e.changes.size);
    if (stillSaved) return handleCancelFromRecordFormBefore(pid, rid);
    if (typeof resetSecapEditSession === 'function') resetSecapEditSession();
    closeModal();
    if (rid && typeof editRecord === 'function') editRecord(pid, rid);
    notify('Alterações descartadas. Nada foi salvo.');
  } finally {
    recordCancelBusy = false;
  }
};

// X do formulário, clique fora e Esc: mesmo caminho do "Cancelar" quando há algo digitado.
function recordFormHasUnsaved() {
  const ids = recordFormIds();
  return ids && !document.getElementById('discardConfirm') && unsavedRecordChanges(ids.pid, ids.rid).length > 0 ? ids : null;
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
