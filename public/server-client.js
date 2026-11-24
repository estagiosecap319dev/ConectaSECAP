/* Fila de salvamento do estado do portal.
   Protegida contra repetição em laço (que já chegou a centenas de requisições por segundo):
   · pedidos feitos enquanto um envio está em andamento viram um só (sempre o estado mais recente);
   · conflito "Recarregue antes de salvar" bloqueia novos envios até a página ser recarregada;
   · outras falhas esperam um intervalo crescente (até 60 s) antes de tentar de novo. */
// saveChain: promessa que termina quando a fila esvazia (usada antes de exportar/sair).
let saveChain = Promise.resolve(true),
  saveFailed = false,
  pendingSaves = 0,
  saveRunning = false,
  saveQueued = null,
  saveBlocked = '',
  saveFailures = 0,
  saveRetryAt = 0;
const SAVE_UNSAVED_MARK = ' • Não salvo';

function markUnsaved(on) {
  const clean = document.title.split(SAVE_UNSAVED_MARK).join('');
  document.title = on ? clean + SAVE_UNSAVED_MARK : clean;
}

function showSaveBlockedBanner(message) {
  let el = document.getElementById('saveBlockedBanner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'saveBlockedBanner';
    el.className = 'save-blocked-banner';
    el.setAttribute('role', 'alert');
    el.innerHTML =
      '<span class="save-blocked-text"></span><button type="button" class="btn primary" onclick="location.reload()">Recarregar agora</button>';
    document.body.appendChild(el);
  }
  el.querySelector('.save-blocked-text').textContent = message;
}

function queueSave(state) {
  if (saveBlocked) {
    notify(saveBlocked, 'error');
    return Promise.resolve(false);
  }
  if (!saveQueued) saveQueued = { state, waiters: [] };
  else saveQueued.state = state;
  pendingSaves = 1;
  const done = new Promise((resolve) => saveQueued.waiters.push(resolve));
  saveChain = Promise.all([saveChain, done]).then(() => !saveFailed);
  runSaveQueue();
  return done;
}

async function runSaveQueue() {
  if (saveRunning) return;
  saveRunning = true;
  try {
    while (saveQueued) {
      const wait = saveRetryAt - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      const job = saveQueued;
      saveQueued = null;
      if (saveBlocked) {
        job.waiters.forEach((resolve) => resolve(false));
        continue;
      }
      let ok = false;
      try {
        const r = await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: job.state }),
        });
        if (!r.ok) {
          const message = (await r.json().catch(() => ({}))).error || 'O servidor recusou a gravação.';
          const error = new Error(message);
          error.conflict = r.status === 409 && /recarregue/i.test(message);
          throw error;
        }
        ok = true;
        saveFailed = false;
        saveFailures = 0;
        saveRetryAt = 0;
        markUnsaved(false);
      } catch (e) {
        saveFailed = true;
        saveFailures++;
        markUnsaved(true);
        if (e.conflict) {
          // Outra pessoa alterou os projetos: tentar de novo nunca vai funcionar sem recarregar.
          saveBlocked =
            'Os projetos foram alterados por outra pessoa. Recarregue a página para continuar; suas últimas alterações não foram salvas.';
          showSaveBlockedBanner(saveBlocked);
          notify(saveBlocked, 'error');
        } else {
          saveRetryAt = Date.now() + Math.min(60000, 1000 * 2 ** Math.min(saveFailures, 6));
          notify('Não foi possível salvar: ' + e.message, 'error');
        }
      }
      job.waiters.forEach((resolve) => resolve(ok));
    }
  } finally {
    saveRunning = false;
    pendingSaves = saveQueued ? 1 : 0;
  }
}
async function authenticate(form) {
  const msg = document.getElementById('authMessage');
  msg.textContent = 'Aguarde…';
  const loading = window.SECAPLoading;
  if (loading) loading.show('Verificando suas credenciais…');
  try {
    const r = await fetch(window.SECAP_SETUP ? '/api/setup' : '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    // Mantém a tela de carregamento durante o recarregamento até o sistema abrir.
    if (loading) loading.show('Acesso confirmado. Carregando o sistema…', true);
    location.reload();
  } catch (e) {
    if (loading) loading.hide();
    msg.textContent = e.message;
  }
}
window.addEventListener('beforeunload', (e) => {
  if (saveFailed || pendingSaves) {
    e.preventDefault();
    e.returnValue = 'Existem alterações sem salvar.';
  }
});

async function submitRegistration(form) {
  const msg = document.getElementById('registerMessage');
  if (!msg) return;
  msg.textContent = 'Enviando solicitação…';
  try {
    const r = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Não foi possível enviar a solicitação.');
    form.innerHTML = `<div class="registration-success"><h2>Espere o Administrador aceitar</h2><p>Seu cadastro foi recebido. O administrador irá avaliar as informações e liberar o seu acesso ao SECAP. Você só conseguirá entrar depois dessa aceitação.</p></div><button class="btn primary" type="button" onclick="showLogin()">Voltar para entrar</button>`;
  } catch (e) {
    msg.textContent = e.message;
  }
}
