/* ============================================================================
   SECAP · SINO DE NOTIFICAÇÕES
   O sino do cabeçalho reúne as notificações semanais (obras sem edição), com
   contador de não lidas.
   · Administradores veem as notificações de todas as contas
     (secap_admin_notifications / secap_admin_notifications_seen — admin_notifications.sql).
   · Usuários veem só as próprias
     (secap_my_notifications / secap_my_notifications_seen — user_notifications.sql).
   ============================================================================ */

let adminBell = { data: null, error: '', loading: false, open: false, at: 0 };

// Sino disponível para qualquer conta logada; o modo define o que ela pode ver.
const bellIsAdmin = () => isSysAdmin();
const bellEnabled = () => typeof me === 'function' && !!me();
const bellRpc = (seen) =>
  bellIsAdmin()
    ? seen ? 'secap_admin_notifications_seen' : 'secap_admin_notifications'
    : seen ? 'secap_my_notifications_seen' : 'secap_my_notifications';

function adminBellStatus(s) {
  return s === 'enviado' ? 'E-mail enviado' : s === 'teste' ? 'Gerado em modo teste' : s === 'erro' ? 'Falha no envio' : s;
}

function adminBellDate(iso) {
  const [y, m, d] = String(iso || '').split('-');
  return d ? `${d}/${m}/${y}` : '';
}

async function loadAdminBell(force = false) {
  if (!bellEnabled() || !window.sb || adminBell.loading) return;
  if (!force && adminBell.data && Date.now() - adminBell.at < 60000) return paintAdminBell();
  adminBell.loading = true;
  try {
    const res = await window.sb.rpc(bellRpc(false), { p_limit: 60 });
    if (res.error) throw res.error;
    adminBell.data = res.data;
    adminBell.error = '';
  } catch (error) {
    const missing = /secap_(admin|my)_notifications/.test(error?.message || '');
    adminBell.error = !missing
      ? String(error?.message || error)
      : bellIsAdmin()
        ? 'Aplique supabase/security/admin_notifications.sql no banco.'
        : 'As notificações ainda não estão disponíveis. Avise o administrador.';
  } finally {
    adminBell.loading = false;
    adminBell.at = Date.now();
    paintAdminBell();
  }
}

// Ajusta o botão do sino que o render() desenha no cabeçalho.
function paintAdminBell() {
  const button = document.querySelector('.headright button[aria-label="Ver próximos prazos"], #adminBellButton');
  if (!button || !bellEnabled()) return;
  const unread = Number(adminBell.data?.unread || 0);
  button.id = 'adminBellButton';
  button.classList.add('admin-bell');
  button.setAttribute('onclick', 'toggleAdminBell(event)');
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-expanded', String(adminBell.open));
  button.setAttribute('aria-label', unread ? `Notificações: ${unread} não lida(s)` : 'Notificações');
  button.title = unread ? `${unread} notificação(ões) não lida(s)` : 'Notificações';
  let badge = button.querySelector('.admin-bell-badge');
  if (unread) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'admin-bell-badge';
      button.appendChild(badge);
    }
    badge.textContent = unread > 99 ? '99+' : String(unread);
  } else if (badge) badge.remove();
  if (adminBell.open) renderAdminBellPanel();
}

function toggleAdminBell(event) {
  event?.stopPropagation();
  adminBell.open = !adminBell.open;
  if (!adminBell.open) return closeAdminBell();
  renderAdminBellPanel();
  loadAdminBell(true).then(markAdminBellSeen);
}

async function markAdminBellSeen() {
  if (!adminBell.data?.unread) return;
  const res = await window.sb.rpc(bellRpc(true));
  if (res.error) return;
  // Mantém o destaque "Nova" enquanto o painel estiver aberto; zera só o contador.
  adminBell.data.unread = 0;
  paintAdminBell();
}

function closeAdminBell() {
  adminBell.open = false;
  document.getElementById('adminBellPanel')?.remove();
  document.getElementById('adminBellButton')?.setAttribute('aria-expanded', 'false');
  if (adminBell.data?.items) adminBell.data.items.forEach((item) => (item.unread = false));
}

function renderAdminBellPanel() {
  const button = document.getElementById('adminBellButton');
  if (!button) return;
  let panel = document.getElementById('adminBellPanel');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'adminBellPanel';
    panel.className = 'admin-bell-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Notificações');
    panel.addEventListener('click', (ev) => ev.stopPropagation());
    document.body.appendChild(panel);
  }
  const rect = button.getBoundingClientRect();
  panel.style.top = `${Math.round(rect.bottom + 8)}px`;
  panel.style.right = `${Math.max(12, Math.round(window.innerWidth - rect.right))}px`;
  const d = adminBell.data;
  const items = d?.items || [];
  const admin = bellIsAdmin();
  // Administrador vê quem foi notificado e o status do e-mail; o usuário vê só as próprias obras.
  const itemTitle = (n) =>
    admin
      ? `${esc(n.name || n.email)} · ${n.total} obra(s) sem edição`
      : `${n.total} obra(s) sua(s) sem atualização`;
  const itemInfo = (n) =>
    `Semana ${esc(adminBellDate(n.weekStart))} a ${esc(adminBellDate(n.weekEnd))}` +
    (admin ? ` · ${esc(adminBellStatus(n.status))}` : '');
  const body = adminBell.error
    ? `<p class="admin-bell-empty" role="alert">${esc(adminBell.error)}</p>`
    : !d
      ? '<p class="admin-bell-empty" role="status">Carregando…</p>'
      : items.length
        ? `<ul class="admin-bell-list">${items
            .map(
              (n, i) => `<li><button type="button" class="admin-bell-item ${n.unread ? 'is-unread' : ''}" onclick="openAdminBellItem(${i})">
                <span class="admin-bell-kind is-${esc(admin ? n.status : 'enviado')}" aria-hidden="true">${icon('bell')}</span>
                <span class="admin-bell-text"><strong>${itemTitle(n)}</strong>
                <small>${itemInfo(n)}</small>
                <small>${esc(new Date(n.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }))}${n.unread ? ' · <b class="admin-bell-new">Nova</b>' : ''}</small></span>
              </button></li>`
            )
            .join('')}</ul>`
        : '<p class="admin-bell-empty">Nenhuma notificação por enquanto.</p>';
  panel.innerHTML = `<div class="admin-bell-head"><div><strong>Notificações</strong><small>${d ? `${d.total} no total` : ''}</small></div>
      <button type="button" class="iconbtn" aria-label="Fechar notificações" onclick="closeAdminBell()">${icon('close')}</button></div>
    ${body}
    <div class="admin-bell-foot">${admin ? `<button type="button" class="textbtn" onclick="closeAdminBell();go('weekly')">Abrir Registro semanal</button>` : ''}
      <button type="button" class="textbtn" onclick="closeAdminBell();go('calendar')">Ver próximos prazos</button></div>`;
}

function openAdminBellItem(index) {
  const n = adminBell.data?.items?.[index];
  if (!n) return;
  closeAdminBell();
  const obras = Array.isArray(n.obras) ? n.obras : [];
  if (!bellIsAdmin()) {
    modal(
      'Obras sem atualização',
      `<p>Na semana de <strong>${esc(adminBellDate(n.weekStart))} a ${esc(adminBellDate(n.weekEnd))}</strong>,
        ${obras.length} obra(s) vinculada(s) a você não tiveram nenhuma atualização no portal:</p>
       <ul class="admin-bell-obras">${obras
         .map(
           (o) =>
             `<li>${esc(o.nome || 'Obra sem nome')}${o.codigo ? ` <small>ID ${esc(o.codigo)}</small>` : ''}${o.projectName ? `<br><small>${esc(o.projectName)}</small>` : ''}</li>`
         )
         .join('')}</ul>`,
      btn('Fechar', 'closeModal()', 'close') + btn('Ver projetos', "closeModal();go('projects')", 'folder', 'primary')
    );
    return;
  }
  modal(
    'Notificação semanal',
    `<p><strong>${esc(n.name || '')}</strong> &lt;${esc(n.email)}&gt;<br>
      Semana de <strong>${esc(adminBellDate(n.weekStart))} a ${esc(adminBellDate(n.weekEnd))}</strong> · ${esc(adminBellStatus(n.status))}
      · ${esc(new Date(n.at).toLocaleString('pt-BR'))}${n.origin ? ` · ${esc(n.origin)}` : ''}</p>
     ${n.error ? `<div class="banner" role="alert">Erro: ${esc(n.error)}</div>` : ''}
     <p>${obras.length} obra(s) sem edição na semana:</p>
     <ul class="admin-bell-obras">${obras
       .map(
         (o) =>
           `<li>${esc(o.nome || 'Obra sem nome')}${o.codigo ? ` <small>ID ${esc(o.codigo)}</small>` : ''}${o.projectName ? `<br><small>${esc(o.projectName)}</small>` : ''}</li>`
       )
       .join('')}</ul>`,
    btn('Fechar', 'closeModal()', 'close') + btn('Abrir Registro semanal', "closeModal();go('weekly')", 'calendar', 'primary')
  );
}

// Fecha o painel ao clicar fora ou apertar Esc.
document.addEventListener('click', () => adminBell.open && closeAdminBell());
document.addEventListener('keydown', (ev) => ev.key === 'Escape' && adminBell.open && closeAdminBell());

// Reaplica o sino a cada redesenho da tela e consulta o contador periodicamente.
const renderBeforeAdminBell = render;
render = function () {
  const result = renderBeforeAdminBell.apply(this, arguments);
  if (bellEnabled()) {
    paintAdminBell();
    loadAdminBell();
  } else if (adminBell.open) closeAdminBell();
  return result;
};
setInterval(() => {
  if (bellEnabled()) loadAdminBell(true);
}, 120000);
queueMicrotask(() => {
  if (bellEnabled()) loadAdminBell(true);
});
