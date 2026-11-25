const $ = (s) => document.querySelector(s),
  esc = (v) =>
    String(v ?? '').replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c]
    );

const paths = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  folder: 'M3 7V4h6l3 3h9v13H3z',
  kanban: 'M4 4h16v16H4z M9 4v16 M15 4v16 M6 8h1 M11 8h2 M17 8h1',
  chart: 'M4 20V10 M10 20V4 M16 20v-8 M22 21H2',
  calendar: 'M4 5h16v16H4z M7 2v6 M17 2v6 M4 10h16',
  file: 'M5 3h9l5 5v13H5z M14 3v6h5 M8 13h8 M8 17h6',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-3a8 8 0 0 1 16 0v3',
  note: 'M4 3h16v18H4z M8 7h8 M8 11h8 M8 15h5',
  history: 'M3 10a9 9 0 1 1 1 8 M3 4v6h6 M12 7v6l4 2',
  shield: 'M12 2l8 4v6c0 6-8 10-8 10S4 18 4 12V6z M8 12l3 3 5-6',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  plus: 'M12 4v16 M4 12h16',
  arrow: 'M4 12h16 M14 6l6 6-6 6',
  down: 'M6 9l6 6 6-6',
  edit: 'M4 16L16 4l4 4L8 20H4z M13 7l4 4',
  close: 'M5 5l14 14 M19 5L5 19',
  bell: 'M5 16h14l-2-4V9a5 5 0 0 0-10 0v3z M10 20h4',
  download: 'M12 3v12 M7 10l5 5 5-5 M4 17v4h16v-4',
  upload: 'M12 16V4 M7 9l5-5 5 5 M4 17v4h16v-4',
  sheet: 'M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h8 M12 6v12',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2',
  alert: 'M12 3L2 21h20z M12 9v5 M12 17v1',
  check: 'M4 12l5 5L20 6',
  money: 'M12 2v20 M17 6H9a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8H6',
  menu: 'M3 5h18 M3 12h18 M3 19h18',
  logout: 'M9 3H3v18h6 M10 12h12 M17 7l5 5-5 5',
  trash: 'M3 6h18 M8 6V3h8v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1 M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
};

function icon(n) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n] || paths.file}"/></svg>`;
}

const uid = () =>
    crypto.randomUUID?.() ||
    'local_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2),
  money = (n) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(Number(n) || 0),
  compact = (n) =>
    Math.abs(n) >= 1e9
      ? `R$ ${(n / 1e9).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} bi`
      : Math.abs(n) >= 1e6
        ? `R$ ${(n / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mi`
        : money(n),
  date = (d) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem prazo'),
  today = () => new Date().toLocaleDateString('en-CA'),
  baseFields = () => [
    { id: 'nome', name: 'Nome da obra', type: 'text', required: true },
    {
      id: 'status',
      name: 'Status',
      type: 'select',
      options: ['Planejamento', 'Em andamento', 'Em atenção', 'Concluído'],
    },
    {
      id: 'etapa',
      name: 'Macroetapa',
      type: 'select',
      options: ['Estudos e projetos', 'Licitação', 'Execução', 'Entrega'],
    },
    { id: 'valor', name: 'Investimento previsto', type: 'currency' },
    { id: 'executado', name: 'Valor executado', type: 'currency' },
    { id: 'prazo', name: 'Prazo de entrega', type: 'date' },
    { id: 'responsavel', name: 'Responsável', type: 'text' },
    { id: 'progresso', name: 'Avanço físico (%)', type: 'number' },
    { id: 'proxima', name: 'Próxima providência', type: 'long' },
    { id: 'orgao', name: 'Órgão', type: 'text' },
  ];

const seed = {
  projects: [],
  notes: [],
  logs: [],
  terms: [],
  requests: [],
  users: [
    {
      id: 'admin',
      name: 'Administrador SECAP',
      email: '',
      role: 'Administrador',
      status: 'Ativo',
      projects: [],
      tabs: ['dashboard', 'projects', 'kanban', 'bi', 'calendar', 'terms', 'notes', 'history'],
    },
  ],
};

let db;
try {
  db = window.SECAP_STATE || structuredClone(seed);
} catch {
  db = structuredClone(seed);
}

// Usuário aprovado (não administrador): existe só na sessão e nunca é gravado no estado compartilhado.
if (window.SECAP_MEMBER && !db.users.some((u) => u.id === 'member'))
  db.users.push(window.SECAP_MEMBER);

let session = window.SECAP_AUTH ? (window.SECAP_MEMBER ? 'member' : 'admin') : '',
  tab = 'dashboard',
  projectId = '',
  query = '',
  filterProject = '',
  filterStatus = '',
  kanbanField = 'status',
  month = new Date().getMonth(),
  year = new Date().getFullYear(),
  selectedRole = 'admin',
  authView = 'login';

// Perto de let session = ..., query = '', filterProject = '', filterStatus = '',
let customProjectFilters = []; // Array de { id, fieldId, value, valueTo }

const me = () => db.users.find((u) => u.id === session);
// A aba Administração é exclusiva do administrador do sistema; o usuário aprovado usa o resto do portal.
const isSysAdmin = () => !window.SECAP_MEMBER && me()?.role === 'Administrador';
// Usuário aprovado com permissão "somente visualizar" nas obras (definida em Administração).
const isViewOnly = () => !!window.SECAP_MEMBER && window.SECAP_MEMBER.obras_access !== 'editar';
// Pode criar/excluir projetos, termos e modelos (administrador ou usuário aprovado com edição).
const canManage = () => isSysAdmin();
const canEdit = (p) =>
  !!p &&
  !isViewOnly() &&
  (!window.SECAP_MEMBER ||
    window.SECAP_MEMBER.project_scope === 'all' ||
    window.SECAP_MEMBER.projects.includes(p.id)) &&
  (me()?.role === 'Administrador' ||
    (me()?.permissions?.[p.id]
      ? me().permissions[p.id] === 'edit'
      : me()?.edit && me()?.projects.includes(p.id)));
const visible = () =>
  db.projects.filter((p) =>
    window.SECAP_MEMBER
      ? window.SECAP_MEMBER.project_scope === 'all' || window.SECAP_MEMBER.projects.includes(p.id)
      : me()?.role === 'Administrador' ||
        me()?.role === 'Secretaria' ||
        me()?.projects.includes(p.id)
  );

// Busca por texto: ignora o projeto embutido (`project`), que contém todas as obras da pasta
// e tornava cada digitação quadrática. Só olha os campos do próprio registro.
function matchesQuery(r, q = query) {
  if (!q) return true;
  const needle = String(q).toLowerCase();
  for (const k in r) {
    if (k === 'project') continue;
    const v = r[k];
    if (v == null || typeof v === 'function') continue;
    const text = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (text.toLowerCase().includes(needle)) return true;
  }
  return false;
}

let records = () =>
  visible()
    .filter((p) => !filterProject || p.id === filterProject)
    .flatMap((p) => p.records.map((r) => ({ ...r, project: p })))
    .filter((r) => (!filterStatus || r.status === filterStatus) && matchesQuery(r));

const avg = (rs) =>
  Math.round(rs.reduce((s, r) => s + (Number(r.progresso) || 0), 0) / (rs.length || 1));
const sum = (rs, f) => rs.reduce((s, r) => s + (Number(r[f]) || 0), 0);
// Situação normalizada ("04 – Concluído" -> "Concluído"); canonicalStatus vem de status-presentation.js.
const statusIs = (r, label) =>
  (typeof canonicalStatus === 'function' ? canonicalStatus(r.status) : r.status) === label;
// Investimento: obras canceladas não entram na soma (mesmo critério do Painel executivo).
const investRows = (rs) => rs.filter((r) => !statusIs(r, 'Cancelado'));
// Indicadores da pasta: usam o campo vinculado (ou reconhecido pelo nome) em vez de IDs fixos,
// para que projetos criados do zero também mostrem situação, avanço e investimento.
const projectKey = (p, semantic, fallback) =>
  (typeof fieldKey === 'function' ? fieldKey(p, semantic) : '') || fallback;
const projectStatusIs = (r, p, label) => {
  const v = r[projectKey(p, 'status', 'status')];
  return (typeof canonicalStatus === 'function' ? canonicalStatus(v) : v) === label;
};
const projectNumbers = (rs, key) =>
  rs.map((r) => r[key]).filter((v) => v !== '' && v != null && Number.isFinite(Number(v))).map(Number);
const projectProgressText = (rs, p) => {
  const key = projectKey(p, 'progress', 'progresso');
  const ns = rs
    .map((r) => (typeof physicalProgress === 'function' ? physicalProgress(r[key]) : Number(r[key])))
    .filter((n) => n !== null && Number.isFinite(n));
  return ns.length ? Math.round(ns.reduce((a, b) => a + b, 0) / ns.length) + '%' : '—';
};
const projectBudgetText = (rs, p) => {
  const ns = projectNumbers(rs.filter((r) => !projectStatusIs(r, p, 'Cancelado')), projectKey(p, 'budget', 'valor'));
  return ns.length ? compact(ns.reduce((a, b) => a + b, 0)) : '—';
};
const tone = (s) =>
  s === 'Concluído'
    ? 'green'
    : s === 'Em atenção'
      ? 'orange'
      : s === 'Pendente'
        ? 'orange'
        : s === 'Ativo'
          ? 'green'
          : '';
const badge = (s) => {
  const label = s || 'Não informado',
    key = typeof canonicalStatus === 'function' ? canonicalStatus(label) : label;
  const palette = {
    Concluído: '#00DE94',
    'Em andamento': '#007EFF',
    'Não iniciado': '#F2F2F2',
    Atrasado: '#E35336',
    'Ponto de Atenção': '#BE5103',
    Cancelado: '#000000',
    'Em planejamento': '#FFBF00',
    Planejamento: '#FFBF00',
    Paralisado: '#6B1025',
    'Em análise': '#7C3AED',
    'Não informado': '#94A3B8',
  };
  const color = palette[key];
  if (!color) return `<span class="badge ${tone(s)}">${esc(label)}</span>`;
  const ink =
    {
      Concluído: '#00794F',
      'Não iniciado': '#53636E',
      'Em planejamento': '#806000',
      Planejamento: '#806000',
      'Não informado': '#53636E',
    }[key] || color;
  return `<span class="badge" data-status-chip style="--status-color:${color};--status-ink:${ink}">${esc(label)}</span>`;
};
const late = (r) => r.prazo && r.prazo < today() && r.status !== 'Concluído';

function persist(
  action,
  where,
  before = '',
  after = '',
  field = '',
  serverRecorded = false,
  details = null
) {
  auditLoaded = false;
  if (action && !serverRecorded)
    db.logs.unshift({
      id: uid(),
      at: new Date().toISOString(),
      who: me()?.name || 'Sistema',
      user: window.SECAP_ACTOR_ID || session,
      project: where?.id || '',
      where: where?.name || String(where || 'Portal'),
      action,
      source: tab === 'bi' ? 'bi' : tab === 'projects' ? 'projects' : tab,
      details,
      field: field || (action?.startsWith('Alterou ') ? action.slice(8) : ''),
      projectName: where?.name || '',
      before,
      after,
    });
  if (window.SECAP_AUTH) return queueSave(db);
  return Promise.resolve(true);
}

let toastTimer = null;

function notify(s, type = '') {
  const el = $('#toast');
  if (!el) return;

  const isError =
    type === 'error' ||
    (type !== 'success' &&
      /erro|inválid|não foi possível|falha|não permitid|indisponível|recusad|selecione pelo menos|informe um|nenhum/i.test(
        String(s)
      ));

  el.textContent = s;
  el.classList.remove('toast-success', 'toast-error');
  el.classList.add(isError ? 'toast-error' : 'toast-success');
  el.style.display = 'block';

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.style.display = 'none';
  }, 3800);
}

const navs = [
  ['dashboard', 'Visão geral', 'dashboard'],
  ['projects', 'Projetos', 'folder'],
  ['kanban', 'Acompanhamento', 'kanban'],
  ['bi', 'BI/Painéis', 'chart'],
  ['calendar', 'Calendário', 'calendar'],
  ['terms', 'Termos de compromisso', 'file'],
  ['profile', 'Meu perfil', 'user'],
  ['notes', 'Minhas anotações', 'note'],
  ['solicitacoes', 'Solicitações', 'link'],
  ['history', 'Auditoria', 'history'],
  ['admin', 'Administração', 'shield'],
];
// Itens do grupo "GESTÃO E ACOMPANHAMENTO"; os demais ficam em "ÁREA PESSOAL".
// (Definido por chave, não por posição, para não quebrar quando a ordem do menu muda.)
const managementNavs = ['dashboard', 'projects', 'kanban', 'bi', 'calendar', 'terms'];

// Link externo das Solicitações (Apps Script). Configurado em public/supabase-config.js.
function solicitacoesUrl() {
  const raw = String((window.SECAP_LINKS || {}).solicitacoes || '').trim();
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function openSolicitacoes() {
  const url = solicitacoesUrl();
  if (!url) return notify('O link das Solicitações ainda não foi configurado.');
  window.open(url, '_blank', 'noopener,noreferrer');
}

function go(t, id = '') {
  if ((t === 'history' || t === 'weekly') && !isSysAdmin())
    return notify('Auditoria disponível apenas para administradores.', 'error');
  if (t === 'weekly' && typeof loadWeeklyLog === 'function') queueMicrotask(loadWeeklyLog);
  tableLimit = 50;
  if (t === 'calendar' && typeof calendarLoaded !== 'undefined') calendarLoaded = false;
  tab = t;
  projectId = id;
  query = '';
  filterStatus = '';
  filterProject = '';
  customProjectFilters = t === 'projects' && id ? loadUserProjectFilters(id) : [];
  render();
  window.scrollTo(0, 0);
}

function accessNoticeMarkup() {
  const notice = window.SECAP_ACCESS_NOTICE;
  if (!notice || window.SECAP_SETUP) return '';
  const refused = notice.kind === 'refused';
  const who = notice.email ? ` (${esc(notice.email)})` : '';
  return refused
    ? `<div class="access-notice is-refused" role="alert"><strong>Acesso recusado</strong><p>Seu acesso${who} foi recusado pelo administrador. Fale com o administrador do SECAP.</p></div>`
    : `<div class="access-notice" role="alert"><strong>Espere o Administrador aceitar</strong><p>Seu cadastro${who} foi recebido. Você poderá entrar assim que o administrador liberar o seu acesso.</p></div>`;
}

function login() {
  const registering = authView === 'register' && !window.SECAP_SETUP;
  const heading = window.SECAP_SETUP
    ? 'Configurar administrador'
    : registering
      ? 'Solicitar cadastro'
      : 'Acessar o portal';
  const subtitle = window.SECAP_SETUP
    ? 'Defina as credenciais do administrador deste servidor.'
    : registering
      ? 'Informe seus dados. O acesso será liberado após avaliação do administrador.'
      : 'Entre com suas credenciais para continuar.';
  const formMarkup = window.SECAP_PREVIEW
    ? `<p>Esta é uma prévia de demonstração, sem autenticação real. Não informe sua senha.</p><button class="btn primary" type="button" onclick="resumeSECAPPreview()">Entrar na prévia</button>`
    : registering
      ? `<form onsubmit="event.preventDefault();submitRegistration(this)"><div class="field"><label>Nome completo *</label><input name="name" required maxlength="120" autocomplete="name"></div><div class="field"><label>E-mail *</label><input name="email" type="email" required maxlength="254" autocomplete="email"></div><div class="field"><label>Senha *</label><input name="password" type="password" required minlength="8" maxlength="512" autocomplete="new-password"><small class="password-hint">Mínimo de 8 caracteres, incluindo pelo menos 1 caractere especial (ex.: ! @ # $ %).</small></div><div class="field"><label>Cargo *</label><input name="job_title" required maxlength="120" placeholder="Ex.: Analista de projetos"></div><button class="btn primary" type="submit">Enviar solicitação</button><p id="registerMessage" role="status"></p></form><button class="login-create" type="button" onclick="showLogin()">Voltar para entrar</button>`
      : `<form onsubmit="event.preventDefault();authenticate(this)"><div class="field"><label>E-mail</label><input name="email" type="email" required autocomplete="username"></div><div class="field"><label>Senha</label><input name="password" type="password" required ${window.SECAP_SETUP ? 'minlength="8" maxlength="512" autocomplete="new-password"' : 'maxlength="512" autocomplete="current-password"'}>${window.SECAP_SETUP ? '<small class="password-hint">Mínimo de 8 caracteres, incluindo pelo menos 1 caractere especial (ex.: ! @ # $ %).</small>' : ''}</div><button class="btn primary" type="submit">${window.SECAP_SETUP ? 'Criar administrador' : 'Entrar'}</button><p id="authMessage" role="status"></p></form>${window.SECAP_SETUP ? '' : `<div class="login-divider"><span>ou</span></div><button class="btn google-login" type="button" onclick="googleLogin()"><span class="google-g">G</span> Continuar com Google</button><button class="login-create" type="button" onclick="showRegister()">Criar conta</button><p id="socialAuthMessage" class="social-auth-message" role="status"></p>`}`;
  return `<div class="stripe"></div><div class="login"><section class="loginart"><img class="loginart-logo" src="marca-goiania-horizontal.svg" alt="Prefeitura de Goiânia"><div class="loginart-copy"><h1>Projetos que <em>avançam</em>.<br>Uma cidade que <em>transforma</em>.</h1><span class="loginart-rule" aria-hidden="true"></span><p>Planejamento, acompanhamento e decisões conectados em um só lugar.</p><ul class="loginart-points"><li><b>Planejamento</b><span>Metas e marcos organizados</span></li><li><b>Acompanhamento</b><span>Execução em tempo real</span></li><li><b>Decisões</b><span>Indicadores para a gestão</span></li></ul></div></section><section class="loginform"><div class="eyebrow">PORTAL DE PROJETOS</div><h1>${heading}</h1><p class="subtitle">${subtitle}</p>${accessNoticeMarkup()}${formMarkup}</section></div>`;
}

function showRegister() {
  authView = 'register';
  render();
}
function showLogin() {
  authView = 'login';
  render();
}

function googleLogin() {
  const el = document.getElementById('socialAuthMessage');
  if (window.SECAP_CLOUD && window.sb) {
    if (window.SECAPLoading) window.SECAPLoading.show('Redirecionando para o Google…', true);
    window.sb.auth
      .signInWithOAuth({
        provider: 'google',
        options: { redirectTo: location.origin + location.pathname },
      })
      .then(({ error }) => {
        if (!error) return;
        if (window.SECAPLoading) window.SECAPLoading.hide();
        if (el) el.textContent = error.message;
      });
    return;
  }
  if (el)
    el.textContent =
      'O acesso com Google ficará disponível após configurar as credenciais OAuth do projeto.';
}

function requestAccountInfo() {
  const el = document.getElementById('socialAuthMessage');
  if (el)
    el.textContent =
      'Para proteger os dados institucionais, solicite a criação do seu usuário ao administrador do SECAP. Após a criação, acesse com seu e-mail e senha.';
}

function enterDemo() {
  return false;
}

function currentAvatar() {
  try {
    return localStorage.getItem('user_avatar') || '';
  } catch {
    return '';
  }
}

function avatarMarkup(user, sizeClass = '') {
  const src = currentAvatar();
  const initials = (user?.name || 'Vitor Farias')
    .split(' ')
    .slice(0, 2)
    .map((x) => x[0])
    .join('');
  return src
    ? `<img class="profile-avatar ${sizeClass}" src="${esc(src)}" alt="Foto de perfil" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'profile-avatar ${sizeClass}',textContent:'${esc(initials)}'}))">`
    : `<span class="profile-avatar ${sizeClass}" aria-label="Avatar de ${esc(user?.name || 'usuário')}">${esc(initials)}</span>`;
}

function openAvatarModal() {
  // Estilos atuais disponíveis no DiceBear Playground (API 10.x).
  const options = [
    { name: 'Adventurer', style: 'adventurer-neutral', seed: 'Vitor' },
    { name: 'Avataaars', style: 'avataaars', seed: 'Vitor-Farias' },
    { name: 'Big Ears', style: 'big-ears', seed: 'SECAP-01' },
    { name: 'Croodles', style: 'croodles', seed: 'SECAP-02' },
    { name: 'Lorelei', style: 'lorelei', seed: 'SECAP-03' },
    { name: 'Personas', style: 'personas', seed: 'SECAP-04' },
  ];
  const choices = options
    .map(({ name, style, seed }) => {
      const url = `https://api.dicebear.com/10.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
      return `<button type="button" class="avatar-choice" aria-label="Selecionar avatar ${name}" onclick="saveAvatar('${url}')"><img src="${url}" alt="Avatar ${name}" loading="lazy"><span>${name}</span></button>`;
    })
    .join('');
  modal(
    'Personalizar avatar',
    `<p class="avatar-modal-help">Escolha um modelo pronto ou crie seu próprio personagem escolhendo o estilo e digitando uma palavra, nome ou apelido. <a href="https://www.dicebear.com/playground/" target="_blank" rel="noopener noreferrer">Abrir o Playground completo do DiceBear</a>.</p><div class="avatar-options">${choices}</div><section class="avatar-builder"><h3>Monte seu próprio avatar</h3><div class="avatar-builder-controls"><div class="field"><label for="customAvatarStyle">Estilo</label><select id="customAvatarStyle" onchange="updateCustomDicebearPreview()"><option value="adventurer-neutral">Adventurer</option><option value="avataaars">Avataaars</option><option value="big-ears">Big Ears</option><option value="croodles">Croodles</option><option value="lorelei">Lorelei</option><option value="personas">Personas</option></select></div><div class="field"><label for="customAvatarSeed">Nome ou palavra para gerar</label><input id="customAvatarSeed" type="text" value="Meu avatar" maxlength="50" placeholder="Digite seu nome" oninput="updateCustomDicebearPreview()"></div></div><div class="avatar-builder-preview"><img id="customDicebearPreview" src="https://api.dicebear.com/10.x/adventurer-neutral/svg?seed=Meu%20avatar" alt="Prévia do avatar personalizado"><span>Prévia do seu avatar</span></div><button class="btn primary" type="button" onclick="applyCustomDicebearAvatar()">Usar meu avatar</button></section><form class="avatar-custom-form" onsubmit="event.preventDefault();saveCustomAvatar(this)"><div class="field"><label for="customAvatarFile">Enviar uma foto do dispositivo</label><input id="customAvatarFile" name="avatarFile" type="file" accept="image/*" required><small class="avatar-upload-help">Selecione uma imagem para usar como foto do perfil.</small></div><button class="btn secondary" type="submit">Enviar foto</button><button class="btn secondary" type="button" onclick="saveAvatar('')">Remover foto</button></form>`
  );
  updateCustomDicebearPreview();
}

function customDicebearUrl() {
  const style = document.getElementById('customAvatarStyle')?.value || 'adventurer-neutral';
  const seed = document.getElementById('customAvatarSeed')?.value.trim() || 'Meu avatar';
  return `https://api.dicebear.com/10.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

function updateCustomDicebearPreview() {
  const preview = document.getElementById('customDicebearPreview');
  if (preview) preview.src = customDicebearUrl();
}

function applyCustomDicebearAvatar() {
  saveAvatar(customDicebearUrl());
}

function saveAvatar(url) {
  try {
    if (url) localStorage.setItem('user_avatar', url);
    else localStorage.removeItem('user_avatar');
  } catch {
    notify('Não foi possível guardar a foto neste navegador.');
    return;
  }
  closeModal();
  render();
  notify('Foto de perfil atualizada.');
}

async function saveCustomAvatar(form) {
  const file = form.avatarFile?.files?.[0];
  if (!file) {
    notify('Selecione uma foto para continuar.');
    return;
  }
  if (!file.type.startsWith('image/')) {
    notify('Selecione um arquivo de imagem válido.');
    return;
  }
  if (file.size > 12 * 1024 * 1024) {
    notify('A foto deve ter no máximo 12 MB.');
    return;
  }

  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Não foi possível ler a foto.'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Não foi possível abrir essa imagem.'));
        image.onload = () => {
          const maxDimension = 512;
          const ratio = Math.min(
            1,
            maxDimension / Math.max(image.naturalWidth, image.naturalHeight)
          );
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
          const context = canvas.getContext('2d');
          if (!context) return reject(new Error('Não foi possível processar a foto.'));
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const webp = canvas.toDataURL('image/webp', 0.82);
          resolve(webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.82));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    saveAvatar(dataUrl);
  } catch (error) {
    notify(error.message || 'Não foi possível carregar a foto.');
  }
}

function render() {
  if (!me()) {
    session = '';
    $('#app').innerHTML = login();
    return;
  }
  const u = me(),
    allowed = (n) =>
      ['profile', 'notes', 'solicitacoes'].includes(n) ||
      (['admin', 'history', 'weekly'].includes(n)
        ? isSysAdmin()
        : u.role === 'Administrador' || u.tabs.includes(n));
  if (!allowed(tab)) tab = 'profile';
  $('#app').innerHTML =
    `<div class="stripe"></div><div class="shell"><aside class="sidebar" id="sidebar"><div class="brand"><img class="brand-logo" src="marca-goiania-horizontal.svg" alt="Prefeitura de Goiânia"></div><div class="navlabel">GESTÃO E ACOMPANHAMENTO</div>${navs
      .filter((n) => managementNavs.includes(n[0]))
      .filter((n) => allowed(n[0]))
      .map(nav)
      .join('')}<div class="navlabel">ÁREA PESSOAL</div>${navs
      .filter((n) => !managementNavs.includes(n[0]))
      .filter((n) => allowed(n[0]))
      .map(nav)
      .join(
        ''
      )}<div class="sidebarfooter"><b><span class="dot"></span> Portal de gestão</b><span>Uma gestão conectada à cidade.</span><button class="nav" style="padding-left:0;margin-top:15px" onclick="logout()">${icon(
      'logout'
    )} Sair do portal</button></div></aside><main class="main"><header><div class="crumb"><button class="mobilemenu iconbtn" aria-label="Abrir menu" onclick="$('#sidebar').classList.toggle('open')">${icon(
      'menu'
    )}</button><span>Portal SECAP</span><span> / </span><b>${esc(
      navs.find((n) => n[0] === tab)?.[1]
    )}</b>${
      projectId ? '<span> / </span><b>Detalhes do projeto</b>' : ''
    }</div><div class="headright"><span class="version">SECAP · Gestão integrada</span><button class="iconbtn" aria-label="Ver próximos prazos" onclick="go('calendar')">${icon(
      'bell'
    )}</button><div class="user signed-in-profile"><button class="header-avatar-button" type="button" onclick="openAvatarModal()" aria-label="Personalizar avatar de ${esc(u.name)}">${avatarMarkup(u, 'header-profile-avatar')}</button><button class="header-profile-details" type="button" onclick="go('profile')" aria-label="Abrir meu perfil"><b>${esc(u.name)}</b><small>${esc(u.role)} ${icon('down')}</small></button></div></div></header><div class="content">${page()}<footer class="pagefooter"><span>© 2026 Prefeitura de Goiânia · SECAP</span><span>Dados salvos no servidor</span></footer></div></main></div>`;
  if (tab === 'admin' && isSysAdmin()) loadAccountRequests();
}

// Menu "Projetos" em formato de pasta: ao clicar, abre os projetos do usuário como sub-itens.
// null = automático (aberta enquanto o usuário está em Projetos); true/false = escolha manual.
let projectsMenuOpen = null;
const isProjectsMenuOpen = () =>
  projectsMenuOpen === null ? tab === 'projects' : projectsMenuOpen;

function toggleProjectsMenu() {
  if (tab === 'projects' && !projectId) {
    // Já está na lista de projetos: o clique só abre/recolhe a pasta.
    projectsMenuOpen = !isProjectsMenuOpen();
    render();
    return;
  }
  projectsMenuOpen = true;
  go('projects');
}

function projectsSubmenu() {
  const ps = visible();
  const items = ps
    .map((p) => {
      const active = tab === 'projects' && projectId === p.id;
      const count = p.externalUrl ? '' : `<small>${p.records.length}</small>`;
      return `<button type="button" class="subnav ${active ? 'active' : ''}" style="--pc:${esc(
        p.color || '#f37021'
      )}" title="${esc(p.name)}" ${active ? 'aria-current="page"' : ''} onclick="openProject('${esc(
        p.id
      )}')"><i class="subnav-dot" aria-hidden="true"></i><span>${esc(p.name)}</span>${
        p.externalUrl ? `<span class="subnav-ext" aria-hidden="true">${icon('link')}</span>` : count
      }</button>`;
    })
    .join('');
  return `<div class="subnav-list" id="projectsSubmenu" role="group" aria-label="Projetos">${
    items || '<span class="subnav-empty">Nenhum projeto disponível</span>'
  }</div>`;
}

function nav([id, n, i]) {
  if (id === 'projects') {
    const open = isProjectsMenuOpen();
    return `<div class="nav-group ${open ? 'open' : ''}"><button class="nav nav-folder ${
      tab === 'projects' && !projectId ? 'active' : ''
    } ${tab === 'projects' ? 'in-section' : ''}" aria-expanded="${open}" aria-controls="projectsSubmenu" onclick="toggleProjectsMenu()">${icon(
      i
    )}<span>${n}</span><em>${visible().length}</em><b class="nav-chevron" aria-hidden="true">${icon(
      'down'
    )}</b></button>${open ? projectsSubmenu() : ''}</div>`;
  }
  return `<button class="nav ${tab === id ? 'active' : ''}" onclick="${
    id === 'solicitacoes' ? 'openSolicitacoes()' : `go('${id}')`
  }">${icon(i)}<span>${n}</span>${
    id === 'admin' && accessPending() ? `<em>${accessPending()}</em>` : ''
  }</button>`;
}

function head(k, title, sub, actions = '') {
  return `<div class="pagehead"><div><div class="eyebrow">${k}</div><h1>${title}</h1><p class="subtitle">${sub}</p></div><div class="actions">${actions}</div></div>`;
}

function btn(label, fn, ic = 'plus', cls = '') {
  return `<button class="btn ${cls}" onclick="${fn}">${icon(ic)}${label}</button>`;
}

function filters(extra = '') {
  return `<div class="filters"><div class="search">${icon(
    'search'
  )}<input aria-label="Buscar" placeholder="Buscar projeto, obra ou responsável..." value="${esc(
    query
  )}" oninput="updateQuery(this.value)"></div><select aria-label="Filtrar projeto" onchange="filterProject=this.value;render()"><option value="">Todos os projetos</option>${visible()
    .map(
      (p) =>
        `<option value="${p.id}" ${filterProject === p.id ? 'selected' : ''}>${esc(
          p.name
        )}</option>`
    )
    .join(
      ''
    )}</select><select aria-label="Filtrar status" onchange="filterStatus=this.value;render()"><option value="">Todos os status</option>${[
    'Planejamento',
    'Em andamento',
    'Em atenção',
    'Concluído',
  ]
    .map((s) => `<option ${filterStatus === s ? 'selected' : ''}>${s}</option>`)
    .join('')}</select>${extra}<span class="right">${icon('clock')} Atualizado agora</span></div>`;
}

// Variável para controlar o tempo de espera do debounce

function updateQuery(val) {
  query = val;
  // Guarda qual campo de busca estava ativo para devolver o foco após re-renderizar
  const active = document.activeElement;
  const label = active && active.tagName === 'INPUT' ? active.getAttribute('aria-label') : null;
  clearTimeout(searchDebounceTimer);
  // Aguarda 250ms após a última tecla antes de re-renderizar
  searchDebounceTimer = setTimeout(() => {
    render();
    if (!label) return;
    const input = [...document.querySelectorAll('input[aria-label]')].find(
      (i) => i.getAttribute('aria-label') === label
    );
    if (input) {
      input.focus();
      const length = input.value.length;
      input.setSelectionRange(length, length);
    }
  }, 250);
}

function stat(label, value, foot, ic, fn = '', warn = false) {
  return `<button class="stat" ${
    fn ? `onclick="${fn}"` : ''
  }><div class="top">${label}${icon(ic)}</div><div class="number">${value}</div><div class="foot ${
    warn ? 'warn' : ''
  }">${foot}</div></button>`;
}

function stats(rs) {
  return `<div class="stats">${stat(
    'PROJETOS ATIVOS',
    visible().filter((p) => p.records.some((r) => r.status !== 'Concluído')).length,
    '<b>Visão integrada</b> de todos os projetos',
    'folder',
    "go('projects')"
  )}${stat(
    'OBRAS EM ANDAMENTO',
    rs.filter((r) => statusIs(r, 'Em andamento')).length,
    `${rs.length} obras na carteira`,
    'kanban',
    "filterStatus='Em andamento';tab='kanban';render()"
  )}${stat(
    'INVESTIMENTO PREVISTO',
    compact(sum(investRows(rs), 'valor')),
    `${compact(sum(investRows(rs), 'executado'))} executados · sem canceladas`,
    'money',
    "go('bi')"
  )}${stat(
    'PONTOS DE ATENÇÃO',
    rs.filter((r) => late(r) || r.status === 'Em atenção').length,
    `<b>${rs.filter(late).length} prazo(s) vencido(s)</b> · Acompanhar`,
    'alert',
    "filterStatus='Em atenção';tab='kanban';render()",
    true
  )}</div>`;
}

function chart(rs) {
  const ss = ['Planejamento', 'Em andamento', 'Em atenção', 'Concluído'],
    colors = ['#91a9b7', '#003856', '#f36e22', '#268c48'],
    max = Math.max(1, ...ss.map((s) => rs.filter((r) => r.status === s).length));
  return `<div class="bars">${ss
    .map((s, i) => {
      const n = rs.filter((r) => r.status === s).length;
      return `<button class="bargroup" onclick="filterStatus='${s}';tab='kanban';render()" aria-label="Filtrar ${s}"><b>${n}</b><div class="bar" style="height:${
        (n / max) * 105
      }px;background:${colors[i]}"></div></button>`;
    })
    .join('')}</div><div class="barlabels">${ss
    .map((s) => `<span>${s}</span>`)
    .join(
      ''
    )}</div><div class="legend"><span><i></i>Obras por situação</span><span>Clique para acompanhar</span></div>`;
}

// Quantidade de linhas exibidas por vez (evita renderizar milhares de células de uma só vez)
let tableLimit = 50;
function showMoreRows() {
  tableLimit += 50;
  render();
}

function table(rs, limited = false) {
  // Recupera todas as colunas do projeto atual ou consolida dos projetos visíveis
  const currentProject = projectId ? visible().find((p) => p.id === projectId) : null;
  const allFields = currentProject
    ? currentProject.fields
    : [
        ...new Map(
          visible()
            .flatMap((p) => p.fields)
            .map((f) => [f.id, f])
        ).values(),
      ];

  if (!rs.length) {
    return empty(
      'Nenhuma obra encontrada',
      'Cadastre uma obra no projeto ou importe uma planilha.'
    );
  }

  return `
    <div class="tablewrap">
      <table>
        <thead>
          <tr>
            <th>Obra / Projeto</th>
            ${allFields
              .filter((f) => f.id !== 'nome')
              .map((f) => `<th>${esc(f.name)}</th>`)
              .join('')}
            <th style="text-align:right">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${rs
            .slice(0, limited ? 5 : tableLimit)
            .map(
              (r) => `
            <tr>
              <td>
                <button style="text-align:left;padding:0;background:none;border:none;cursor:pointer" onclick="editRecord('${r.project.id}','${r.id}')">
                  <strong>${esc(r.nome || 'Registro')}</strong>
                  <div class="desc">${esc(r.project.name)} · ${esc(r.orgao || 'SECAP')}</div>
                </button>
              </td>
              ${allFields
                .filter((f) => f.id !== 'nome')
                .map((f) => {
                  const val = r[f.id];
                  if (f.type === 'date') return `<td>${date(val)}</td>`;
                  if (f.type === 'currency')
                    return `<td>${val !== '' && val != null ? money(val) : '—'}</td>`;
                  if (f.id === 'status') return `<td>${badge(val)}</td>`;
                  if (f.id === 'progresso')
                    return `<td><div class="pr"><div class="progress"><i style="width:${Math.min(100, Math.max(0, Number(val) || 0))}%"></i></div>${val === '' || val == null ? '—' : (Number(val) || 0) + '%'}</div></td>`;
                  return `<td title="${esc(val || '')}">${esc(val || '—')}</td>`;
                })
                .join('')}
              <td style="text-align:right">
                <button class="iconbtn" title="Abrir obra" aria-label="Abrir obra" onclick="editRecord('${r.project.id}','${r.id}')">
                  ${icon('arrow')}
                </button>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <div class="tablefoot">
      <span>${limited ? Math.min(5, rs.length) : Math.min(tableLimit, rs.length)} de ${rs.length} obras</span>
      ${
        !limited && rs.length > tableLimit
          ? `<button class="textbtn" onclick="showMoreRows()">Mostrar mais ${Math.min(50, rs.length - tableLimit)} obras</button>`
          : '<span>Use a barra de rolagem para navegar pelas colunas e registros</span>'
      }
    </div>
  `;
}
// Abre os detalhes da obra em tela cheia
function editRecord(pid, rid = '') {
  const p = visible().find((p) => p.id === pid);
  if (!p) return;

  const r = p.records.find((r) => r.id === rid);
  const edit = canEdit(p);

  // Se for cadastro de nova obra (sem registro existente), abre o formulário de inserção
  if (!r) {
    openRecordForm(pid, rid);
    return;
  }

  // Se já houver uma tela cheia aberta, remove para evitar duplicação
  closeFullscreenDetail();

  const fields = p.fields;

  // Cria a camada de tela cheia injetada diretamente no body
  const detailContainer = document.createElement('div');
  detailContainer.id = 'fullscreenDetailView';
  detailContainer.className = 'fullscreen-detail-page';

  detailContainer.innerHTML = `
    <header class="fullscreen-header">
      <div style="display:flex; align-items:center; gap:16px;">
        <button class="btn" type="button" onclick="closeFullscreenDetail()">${icon('arrow')} Voltar às obras</button>
        <div>
          <span class="eyebrow">${esc(p.name)}</span>
          <h1 class="obra-detail-title" title="${esc(r.nome || Object.values(r)[1] || 'Registro')}">${esc(r.nome || Object.values(r)[1] || 'Registro')}</h1>
        </div>
      </div>
      <div class="actions" style="display:flex; gap:10px;">
        ${edit ? `<button class="btn primary" type="button" onclick="closeFullscreenDetail(); openRecordForm('${pid}','${rid}')">${icon('edit')} Editar dados</button>` : ''}
        <button class="iconbtn" type="button" onclick="closeFullscreenDetail()" title="Fechar">${icon('close')}</button>
      </div>
    </header>

    <div class="fullscreen-content">
      <!-- Indicadores principais -->
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

      <!-- Ficha de dados detalhados -->
      <h2 style="font-size: 16px; color: #334155; margin-bottom: 16px; font-weight:600;">Ficha completa da obra</h2>
      <div class="detail-grid">
        ${fields
          .map((f) => {
            const val = r[f.id];
            let displayVal = esc(val ?? '—');
            if (f.type === 'date') displayVal = date(val);
            if (f.type === 'currency') displayVal = val !== '' && val != null ? money(val) : '—';

            return `
            <div class="detail-card">
              <label>${esc(f.name)}</label>
              <div class="val">${displayVal || '—'}</div>
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
  `;

  document.body.appendChild(detailContainer);
}

// Modal exclusivo para inserção/edição dos campos
function openRecordForm(pid, rid = '') {
  const p = visible().find((p) => p.id === pid);
  if (!p) return;
  const r = p.records.find((r) => r.id === rid);
  const edit = canEdit(p);

  modal(
    r ? 'Editar obra' : 'Cadastrar nova obra',
    `<p class="subtitle" style="margin-bottom:20px">${esc(p.name)}</p>
     <form id="recordForm" onsubmit="event.preventDefault();saveRecord('${pid}','${rid}')">
       ${p.fields.map((f) => inputField(f, r?.[f.id], !edit)).join('')}
     </form>`,
    (edit && r ? btn('Excluir', `deleteRecord('${pid}','${rid}')`, 'trash') : '') +
      btn('Cancelar', r ? `editRecord('${pid}','${rid}')` : 'closeModal()', 'close') +
      (edit
        ? `<button class="btn primary" type="submit" form="recordForm">${icon('check')} Salvar alterações</button>`
        : '')
  );
}

function dashboard() {
  const projects = typeof visible === 'function' ? visible() : db.projects || [];

  // 1. Métricas principais (Apenas Projetos Ativos e Pontos de Atenção)
  const activeProjectsCount = projects.length;

  // Pontos de atenção calculados passando r (registro) e p (projeto) para isFinished(r, p)
  let pointsOfAttention = 0;

  projects.forEach((p) => {
    (p.records || []).forEach((r) => {
      const status = String(r.status || '').toLowerCase();
      const isParalyzed = status.includes('paralisad');

      // Verifica se está atrasado utilizando o projeto p correspondente
      const isFinishedRecord = typeof isFinished === 'function' ? isFinished(r, p) : false;
      const isDelayed =
        r.prazo && typeof daysLeft === 'function' && daysLeft(r.prazo) < 0 && !isFinishedRecord;
      const noOwner = !r.responsavel || String(r.responsavel).trim() === '';

      if (isParalyzed || isDelayed || noOwner) {
        pointsOfAttention++;
      }
    });
  });

  // 2. Renderização diferida do gráfico de barras
  setTimeout(() => renderProjectsBarChart(projects), 100);

  return `
    <div class="head">
      <div>
        <h1>Visão geral</h1>
      </div>
    </div>

    <!-- KPIs: Projetos Ativos e Pontos de Atenção Clicáveis -->
    <div class="kpi-grid-container" style="display: grid; grid-template-columns: repeat(2, minmax(280px, 420px)); gap: 20px; margin-bottom: 24px;">
      
      <!-- KPI 1: Projetos na Carteira -->
      <div class="stat kpi-card"
           role="button"
           tabindex="0"
           onclick="openDashboardKpi('projects')"
           onkeydown="if(event.key==='Enter'||event.key===' ')openDashboardKpi('projects')"
           style="cursor: pointer;"
           title="Clique para ver os projetos">
        <div class="kpi-header">
          <span class="top">${typeof icon === 'function' ? icon('folder') : ''} PROJETOS NA CARTEIRA</span>
          <span class="kpi-link">Ver projetos ${typeof icon === 'function' ? icon('arrow') : '→'}</span>
        </div>
        <div class="kpi-body">
          <span class="number">${activeProjectsCount}</span>
          <span class="kpi-subtext">Pastas de projetos disponíveis</span>
        </div>
      </div>

      <!-- KPI 2: Pontos de Atenção -->
      <div class="stat kpi-card warning"
           role="button"
           tabindex="0"
           onclick="openDashboardKpi('attention')"
           onkeydown="if(event.key==='Enter'||event.key===' ')openDashboardKpi('attention')"
           style="cursor: pointer;"
           title="Clique para ver as obras com atenção necessária">
        <div class="kpi-header">
          <span class="top" style="color: #c93636;">${typeof icon === 'function' ? icon('alert') : ''} PONTOS DE ATENÇÃO</span>
          <span class="kpi-link" style="color: #c93636;">Ver detalhes ${typeof icon === 'function' ? icon('arrow') : '→'}</span>
        </div>
        <div class="kpi-body">
          <span class="number" style="color: #c93636;">${pointsOfAttention}</span>
          <span class="kpi-subtext">Obras paralisadas, atrasadas ou sem responsável</span>
        </div>
      </div>

    </div>

    <!-- Gráfico de Barras: Comparativo de Projetos por Quantidade de Obras -->
    <section class="panel">
      <div class="panelhead">
        <div>
          <h2>Quantidade de obras por projeto</h2>
          <small>Comparativo do volume de iniciativas em cada pasta de projeto</small>
        </div>
      </div>
      <div class="panelbody">
        <div id="projectsBarChart" style="width: 100%; height: 380px;"></div>
      </div>
    </section>
  `;
}

// Abre os detalhes associados aos KPIs da visão geral.
function openDashboardKpi(type) {
  const projects = typeof visible === 'function' ? visible() : db.projects || [];
  if (type === 'projects') {
    const body = projects.length
      ? `<div class="kpi-detail-list">${projects
          .map(
            (p) => `
      <button class="kpi-detail-row" type="button" onclick="closeModal();go('projects','${p.id}')">
        <span class="kpi-detail-icon">${icon('folder')}</span>
        <span class="kpi-detail-main"><b>${esc(p.name || 'Projeto sem nome')}</b><small>${(p.records || []).length} obras vinculadas</small></span>
        <span class="kpi-detail-value">${avg(p.records)}% <small>concluído</small></span>
        ${icon('arrow')}
      </button>`
          )
          .join('')}</div>`
      : '<p class="kpi-empty">Nenhum projeto disponível.</p>';
    modal('Projetos na carteira', body, btn('Fechar', 'closeModal()', 'close'));
    return;
  }

  const attention = [];
  projects.forEach((p) =>
    (p.records || []).forEach((r) => {
      const status = String(r.status || '').toLowerCase();
      const paralyzed = status.includes('paralisad');
      const finished = typeof isFinished === 'function' ? isFinished(r, p) : false;
      const delayed = !!(
        r.prazo &&
        typeof daysLeft === 'function' &&
        daysLeft(r.prazo) < 0 &&
        !finished
      );
      const noOwner = !r.responsavel || String(r.responsavel).trim() === '';
      if (paralyzed || delayed || noOwner) {
        const reasons = [
          paralyzed ? 'Paralisada' : '',
          delayed ? 'Prazo vencido' : '',
          noOwner ? 'Sem responsável' : '',
        ].filter(Boolean);
        attention.push({ p, r, reasons });
      }
    })
  );
  const body = attention.length
    ? `<div class="kpi-detail-list">${attention
        .map(
          ({ p, r, reasons }) => `
    <button class="kpi-detail-row attention-row" type="button" onclick="closeModal();go('projects','${p.id}')">
      <span class="kpi-detail-icon">${icon('alert')}</span>
      <span class="kpi-detail-main"><b>${esc(r.nome || r.obra || r.name || 'Obra sem identificação')}</b><small>${esc(p.name)} · ${esc(r.responsavel || 'Sem responsável')}</small><em>${reasons.join(' · ')}</em></span>
      <span class="kpi-detail-value">${esc(r.status || '—')}</span>
      ${icon('arrow')}
    </button>`
        )
        .join('')}</div>`
    : '<p class="kpi-empty">Nenhum ponto de atenção identificado. Ótimo trabalho!</p>';
  modal('Pontos de atenção', body, btn('Fechar', 'closeModal()', 'close'));
}

// Função para renderizar o gráfico de barras comparativo via ECharts
function renderProjectsBarChart(projects) {
  const chartEl = document.getElementById('projectsBarChart');
  if (!chartEl || typeof echarts === 'undefined') return;

  let chart = echarts.getInstanceByDom(chartEl);
  if (!chart) {
    chart = echarts.init(chartEl);
  }

  const projectNames = projects.map((p) => p.name || 'Sem nome');
  const worksCount = projects.map((p) => (p.records || []).length);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: projectNames,
      axisLabel: {
        interval: 0,
        rotate: projectNames.some((n) => n.length > 15) ? 20 : 0,
        color: '#475569',
        fontSize: 12,
      },
    },
    yAxis: {
      type: 'value',
      name: 'Qtd. de Obras',
      minInterval: 1,
      axisLabel: { color: '#475569' },
    },
    series: [
      {
        name: 'Quantidade de Obras',
        type: 'bar',
        barWidth: '40%',
        data: worksCount,
        itemStyle: {
          color: '#f37021', // Laranja oficial SECAP
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          fontWeight: 'bold',
          color: '#003856',
        },
      },
    ],
  };

  chart.setOption(option);
  chart.off('click');
  chart.on('click', (params) => {
    if (params && Number.isInteger(params.dataIndex) && projects[params.dataIndex]) {
      go('projects', projects[params.dataIndex].id);
    }
  });
}
// Responsáveis do projeto: contas de usuários escolhidas pelo botão "+".
// Fica em p.responsibles = [{ id, name, email }]. Os nomes digitados nas obras
// (campo "Responsável") e o responsável antigo da pasta não aparecem mais aqui.
function projectResponsibleList(p) {
  return Array.isArray(p?.responsibles) ? p.responsibles.filter((u) => u && (u.email || u.id)) : [];
}
function projectResponsibles(p) {
  const list = projectResponsibleList(p);
  // Somente administradores definem os responsáveis do projeto.
  const editable = isSysAdmin();
  const MAX = 3;
  const chips = list
    .slice(0, MAX)
    .map((u) => {
      const name = u.name || u.email;
      return `<span class="presp-chip" title="${esc(name)}${u.email && u.email !== name ? ' · ' + esc(u.email) : ''}"><i aria-hidden="true">${esc(initials(name))}</i>${esc(name)}</span>`;
    })
    .join('');
  const more =
    list.length > MAX
      ? `<span class="presp-more" title="${esc(
          list
            .slice(MAX)
            .map((u) => u.name || u.email)
            .join(', ')
        )}">+${list.length - MAX}</span>`
      : '';
  // Com responsáveis já definidos, o botão vira "editar": é nele que se adiciona e se remove.
  const addLabel = list.length ? 'Adicionar ou remover responsáveis' : 'Adicionar responsáveis';
  const add = editable
    ? `<button type="button" class="presp-add${list.length ? ' presp-edit' : ''}" title="${addLabel}" aria-label="${addLabel} do projeto ${esc(p.name)}" onclick="event.stopPropagation();openProjectResponsibles('${esc(p.id)}')" onkeydown="event.stopPropagation()">${list.length ? icon('edit') : '+'}</button>`
    : '';
  const empty = list.length ? '' : '<span class="presp-empty">Sem responsável</span>';
  return `<div class="presp"><small>Responsáveis</small><div class="presp-list">${chips}${more}${empty}${add}</div></div>`;
}

let responsiblesPicker = null;
let responsiblesPickerTimer = null;

function openProjectResponsibles(pid) {
  const p = db.projects.find((x) => String(x.id) === String(pid));
  if (!p || !isSysAdmin()) return;
  responsiblesPicker = {
    pid: String(pid),
    selected: new Map(
      projectResponsibleList(p).map((u) => [String(u.email || u.id).toLowerCase(), u])
    ),
    users: [],
    query: '',
    offset: 0,
    hasMore: false,
    loading: false,
    error: '',
    request: 0,
  };
  modal(
    'Responsáveis do projeto',
    `<div class="resp-picker">
       <p class="subtitle">${esc(p.name)} · marque as contas responsáveis por este projeto. Para retirar alguém, clique no × ao lado do nome (ou desmarque na lista) e depois em <b>Salvar responsáveis</b>.</p>
       <div class="resp-selected" id="respSelected" aria-live="polite"></div>
       <div class="field">
         <label for="respSearch">Buscar usuário</label>
         <input id="respSearch" type="search" maxlength="100" placeholder="Nome ou e-mail" autocomplete="off" oninput="searchProjectResponsibles(this.value)">
       </div>
       <div class="resp-options" id="respOptions" role="group" aria-label="Contas de usuários"></div>
     </div>`,
    btn('Cancelar', 'closeModal()', 'close') +
      btn('Salvar responsáveis', 'saveProjectResponsibles()', 'check', 'primary')
  );
  renderProjectResponsibles();
  loadProjectResponsibles(false);
  setTimeout(() => document.getElementById('respSearch')?.focus(), 50);
}

function responsibleKey(u) {
  return String(u.email || u.id || '').toLowerCase();
}

function renderProjectResponsibles() {
  const state = responsiblesPicker;
  const sel = document.getElementById('respSelected');
  const opts = document.getElementById('respOptions');
  if (!state || !sel || !opts) return;
  const chosen = [...state.selected.values()];
  sel.innerHTML = chosen.length
    ? chosen
        .map(
          (u, i) =>
            `<span class="presp-chip"><i aria-hidden="true">${esc(initials(u.name || u.email))}</i>${esc(u.name || u.email)}<button type="button" class="resp-remove" title="Remover" aria-label="Remover ${esc(u.name || u.email)}" onclick="removeProjectResponsible(${i})">${icon('close')}</button></span>`
        )
        .join('')
    : '<span class="presp-empty">Nenhum responsável selecionado.</span>';
  if (state.error) {
    opts.innerHTML = `<p class="resp-error" role="alert">Não foi possível carregar os usuários. ${esc(state.error)}</p><button class="btn" type="button" onclick="loadProjectResponsibles(false)">Tentar novamente</button>`;
    return;
  }
  const rows = state.users
    .map((u) => {
      const key = responsibleKey(u);
      const on = state.selected.has(key);
      return `<label class="resp-option${on ? ' is-on' : ''}"><input type="checkbox" ${on ? 'checked' : ''} onchange="toggleProjectResponsible('${esc(String(u.id))}', this.checked)"><span class="presp-chip-ico" aria-hidden="true">${esc(initials(u.name || u.email))}</span><span><b>${esc(u.name || u.email)}</b><small>${esc(u.email || '')}</small></span></label>`;
    })
    .join('');
  opts.innerHTML =
    (rows || (state.loading ? '' : '<p class="presp-empty">Nenhum usuário encontrado.</p>')) +
    (state.loading ? '<p class="resp-loading" role="status">Carregando usuários…</p>' : '') +
    (state.hasMore && !state.loading
      ? `<button class="textbtn" type="button" onclick="loadProjectResponsibles(true)">Carregar mais usuários</button>`
      : '');
}

function toggleProjectResponsible(id, on) {
  const state = responsiblesPicker;
  if (!state) return;
  const u = state.users.find((x) => String(x.id) === String(id));
  if (!u) return;
  if (on)
    state.selected.set(responsibleKey(u), {
      id: u.id,
      name: u.name || u.email,
      email: u.email || '',
    });
  else state.selected.delete(responsibleKey(u));
  renderProjectResponsibles();
}

function removeProjectResponsible(index) {
  const state = responsiblesPicker;
  if (!state) return;
  const key = [...state.selected.keys()][index];
  state.selected.delete(key);
  renderProjectResponsibles();
}

function searchProjectResponsibles(value) {
  const state = responsiblesPicker;
  if (!state) return;
  state.query = String(value || '').trim();
  state.request++;
  clearTimeout(responsiblesPickerTimer);
  responsiblesPickerTimer = setTimeout(() => {
    if (responsiblesPicker === state) loadProjectResponsibles(false);
  }, 220);
}

// Mesma lista de contas usada na agenda (participantes de reunião).
async function loadProjectResponsibles(more = false) {
  const state = responsiblesPicker;
  if (!state || !document.getElementById('respOptions')) return;
  const request = ++state.request;
  if (!more) {
    state.offset = 0;
    state.users = [];
  }
  state.loading = true;
  state.error = '';
  renderProjectResponsibles();
  try {
    if (!window.sb) throw new Error('Conexão ao servidor indisponível.');
    let result = await window.sb.rpc('secap_meeting_users', {
      p_search: state.query,
      p_offset: state.offset,
    });
    if (
      result.error &&
      (result.error.code === 'PGRST202' || /schema cache/.test(result.error.message || ''))
    ) {
      if (!isSysAdmin())
        throw new Error(
          'A lista de usuários ainda não foi instalada neste banco. Solicite ao administrador aplicar supabase/security/meeting_participants.sql.'
        );
      const term = state.query.replace(/[%,().]/g, '');
      let directory = window.sb
        .from('profiles')
        .select('id,name,email')
        .in('role', ['administrador', 'usuario'])
        .order('name')
        .order('id');
      if (term) directory = directory.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
      const fallback = await directory.range(state.offset, state.offset + 50);
      if (fallback.error) throw fallback.error;
      result = {
        data: {
          users: (fallback.data || []).slice(0, 50),
          hasMore: (fallback.data || []).length > 50,
        },
      };
    }
    if (state !== responsiblesPicker || request !== state.request) return;
    if (result.error) throw result.error;
    if (!Array.isArray(result.data?.users)) throw new Error('Lista de usuários inválida.');
    for (const u of result.data.users) {
      if (!u || !u.email) continue;
      state.users.push({ id: u.id, name: u.name || u.email, email: u.email });
    }
    state.offset += result.data.users.length;
    state.hasMore = !!result.data.hasMore;
  } catch (error) {
    if (state !== responsiblesPicker || request !== state.request) return;
    state.error = String(error?.message || error);
    state.hasMore = false;
  } finally {
    if (state === responsiblesPicker && request === state.request) state.loading = false;
  }
  renderProjectResponsibles();
}

function saveProjectResponsibles() {
  const state = responsiblesPicker;
  const p = state && db.projects.find((x) => String(x.id) === state.pid);
  if (!p || !isSysAdmin()) return;
  const before = projectResponsibleList(p)
    .map((u) => u.name || u.email)
    .join(', ');
  p.responsibles = [...state.selected.values()].map((u) => ({
    id: u.id,
    name: u.name || u.email,
    email: u.email || '',
  }));
  const after = p.responsibles.map((u) => u.name || u.email).join(', ');
  responsiblesPicker = null;
  closeModal();
  if (before !== after) {
    persist(
      'Atualizou responsáveis do projeto',
      p,
      before || 'Nenhum',
      after || 'Nenhum',
      'Responsáveis'
    );
    notify(
      p.responsibles.length
        ? `${p.responsibles.length} responsável(is) definido(s) para ${p.name}.`
        : `Responsáveis removidos de ${p.name}.`,
      'success'
    );
  }
  render();
}
let draggedProjectId = '';

function projectDragStart(e, pid) {
  if (!canManage()) return;
  draggedProjectId = pid;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', pid);
  const el = e.currentTarget;
  setTimeout(() => el.classList.add('project-dragging'), 0);
}

function projectDragEnd(el) {
  draggedProjectId = '';
  el.classList.remove('project-dragging');
  document
    .querySelectorAll('.project.project-dragover')
    .forEach((card) => card.classList.remove('project-dragover'));
}

function projectDragOver(e, pid) {
  if (!canManage() || !draggedProjectId || draggedProjectId === pid) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('project-dragover');
}

function projectDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.classList.remove('project-dragover');
  }
}

function projectDrop(e, targetPid) {
  e.preventDefault();
  e.currentTarget.classList.remove('project-dragover');
  if (!canManage()) return notify('Apenas administradores podem reordenar os projetos.');

  const sourcePid = draggedProjectId || e.dataTransfer.getData('text/plain');
  if (!sourcePid || sourcePid === targetPid) return;

  const fromIndex = db.projects.findIndex((p) => p.id === sourcePid);
  const toIndex = db.projects.findIndex((p) => p.id === targetPid);
  if (fromIndex < 0 || toIndex < 0) return;

  const [movedProject] = db.projects.splice(fromIndex, 1);
  db.projects.splice(toIndex, 0, movedProject);

  // Registra e salva a nova ordem no servidor (queueSave)
  persist('Reordenou projetos', movedProject, `Posição ${fromIndex + 1}`, `Posição ${toIndex + 1}`);
  render();
  notify('Ordem dos projetos salva.');
}
function projects() {
  if (projectId) return projectView();
  const ps = visible().filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const allowReorder = canManage() && !query.trim() && ps.length > 1;

  return (
    head(
      'ORGANIZAÇÃO DA CARTEIRA',
      'Projetos',
      'Organize em pastas. Personalize os campos. Acompanhe cada obra.',
      (canManage() ? btn('Novo projeto', 'editProject()', 'plus', 'primary') : '') +
        btn('Importar', 'openImport()', 'upload') +
        btn('Exportar', 'openExport()', 'download')
    ) +
    `<div class="filters"><div class="search">${icon(
      'search'
    )}<input aria-label="Buscar projetos" placeholder="Encontrar um projeto..." value="${esc(
      query
    )}" oninput="updateQuery(this.value)"></div><span class="right">${
      allowReorder ? 'Arraste os cartões para reordenar · ' : ''
    }${ps.length} projetos disponíveis</span></div><div class="cards">${ps
      .map(
        (p) =>
          `<article class="project ${allowReorder ? 'is-draggable' : ''}" style="--pc:${
            p.color || '#003856'
          }" tabindex="0" role="button" aria-label="Abrir ${esc(p.name)}" ${
            allowReorder
              ? `draggable="true" ondragstart="projectDragStart(event,'${p.id}')" ondragend="projectDragEnd(this)" ondragover="projectDragOver(event,'${p.id}')" ondragleave="projectDragLeave(event)" ondrop="projectDrop(event,'${p.id}')"`
              : ''
          } onclick="openProject('${p.id}')" onkeydown="if(event.key==='Enter')openProject('${
            p.id
          }')"><div class="pbody"><div class="ptop"><span class="folder" style="color:${
            p.color
          };background:${p.color}12">${icon('folder')}</span><div style="display:flex;align-items:center;gap:6px">${
            allowReorder
              ? `<span class="project-drag-handle" title="Arraste para reordenar" aria-hidden="true">⋮⋮</span>`
              : ''
          }${
            canEdit(p)
              ? `<button class="iconbtn" title="Editar projeto e campos" aria-label="Editar ${esc(
                  p.name
                )}" onclick="event.stopPropagation();editProject('${p.id}')">${icon(
                  'edit'
                )}</button>`
              : badge('Leitura')
          }</div></div><h3>${esc(p.name)}</h3>${
            p.externalUrl ? '<span class="badge">Link externo · Nova aba</span>' : ''
          }${
            p.sheetSync?.planilhaId
              ? `<span class="badge" title="${p.sheetSync.ativo ? 'As mudanças do portal são gravadas na planilha do link' : 'Sincronia pausada'}">Planilha Google · ${p.sheetSync.ativo ? 'sincronizada' : 'pausada'}</span>`
              : ''
          }<p>${esc(p.description)}</p>${
            p.externalUrl
              ? `<div class="pmeta"><span>${icon('link')} ${esc(
                  externalHost(p.externalUrl)
                )}</span><b>Abrir página</b></div>`
              : `<div class="pmeta"><span>${p.records.length} obras vinculadas</span></div>${projectResponsibles(
                  p
                )}`
          }</div><div class="pfooter"><span>${p.externalUrl ? esc(p.owner) : ''}</span><span>${
            p.externalUrl ? '' : compact(sum(p.records, 'valor')) + ' '
          }${icon('arrow')}</span></div></article>`
      )
      .join('')}</div>${
      ps.length
        ? ''
        : empty(
            'Sua carteira começa aqui',
            'Crie seu primeiro projeto para organizar obras e prazos.'
          ) +
          `<div class="empty-actions">${btn(
            'Novo projeto',
            'editProject()',
            'plus',
            'primary'
          )}${btn('Importar planilha', 'openImport()', 'upload')}</div>`
    }`
  );
}
function matchesCustomFilters(r, fields) {
  if (!customProjectFilters.length) return true;
  return customProjectFilters.every((flt) => {
    if (!flt.fieldId) return true;
    const f = fields.find((x) => x.id === flt.fieldId);
    if (!f) return true;
    const raw = r[flt.fieldId];

    // Filtro por vazio / preenchido
    if (flt.operator === 'empty') return raw === '' || raw == null;
    if (flt.operator === 'not_empty') return raw !== '' && raw != null;

    if (f.type === 'date') {
      const val = String(raw || '');
      if (!val) return false;
      if (flt.value && val < flt.value) return false;
      if (flt.valueTo && val > flt.valueTo) return false;
      return true;
    }

    if (['number', 'currency'].includes(f.type)) {
      if (raw === '' || raw == null) return false;
      const num = Number(raw);
      if (!Number.isFinite(num)) return false;
      if (flt.value !== '' && flt.value != null && num < Number(flt.value)) return false;
      if (flt.valueTo !== '' && flt.valueTo != null && num > Number(flt.valueTo)) return false;
      return true;
    }

    // Texto, select, responsável, boolean
    const needle = String(flt.value || '')
      .trim()
      .toLowerCase();
    if (!needle) return true;
    const hay = String(raw ?? '')
      .trim()
      .toLowerCase();
    return flt.operator === 'equals' ? hay === needle : hay.includes(needle);
  });
}

function openAddCustomFilter(pid) {
  const p = visible().find((x) => x.id === pid);
  if (!p) return;

  const sortedFields = [...p.fields].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const firstField =
    sortedFields.find((f) => /orgao|órgão|status|etapa|prioridade/i.test(f.name)) ||
    sortedFields[0];

  modal(
    'Adicionar filtro personalizado',
    `<form id="customFilterForm" onsubmit="event.preventDefault();applyCustomFilter('${pid}')">
      <div class="field">
        <label>Campo da obra *</label>
        <select name="fieldId" id="cfFieldSelect" onchange="updateCustomFilterInput('${pid}')">
          ${sortedFields
            .map(
              (f) =>
                `<option value="${esc(f.id)}" ${f.id === firstField?.id ? 'selected' : ''}>${esc(f.name)}</option>`
            )
            .join('')}
        </select>
      </div>
      <div id="cfDynamicInputs"></div>
    </form>`,
    btn('Cancelar', 'closeModal()', 'close') +
      `<button class="btn primary" type="submit" form="customFilterForm">${icon('check')} Aplicar filtro</button>`
  );
  updateCustomFilterInput(pid);
}

function updateCustomFilterInput(pid) {
  const p = visible().find((x) => x.id === pid);
  const fieldId = $('#cfFieldSelect')?.value;
  const container = $('#cfDynamicInputs');
  if (!p || !fieldId || !container) return;

  const f = p.fields.find((x) => x.id === fieldId);
  if (!f) return;

  if (f.type === 'date') {
    container.innerHTML = `
      <div class="twocol">
        <div class="field"><label>De (data inicial)</label><input type="date" name="value"></div>
        <div class="field"><label>Até (data final)</label><input type="date" name="valueTo"></div>
      </div>
      <small class="subtitle">Deixe um dos campos em branco para filtrar apenas a partir de ou até uma data.</small>`;
    return;
  }

  if (['number', 'currency'].includes(f.type)) {
    container.innerHTML = `
      <div class="twocol">
        <div class="field"><label>Valor mínimo</label><input type="number" step="any" name="value" placeholder="Ex.: 0"></div>
        <div class="field"><label>Valor máximo</label><input type="number" step="any" name="valueTo" placeholder="Ex.: 1000000"></div>
      </div>`;
    return;
  }

  // Extrai os valores únicos já preenchidos nas obras deste projeto para facilitar a seleção
  const uniqueValues = [
    ...new Set(p.records.map((r) => String(r[f.id] ?? '').trim()).filter((v) => v !== '')),
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const optionsList = Array.isArray(f.options) && f.options.length ? f.options : uniqueValues;

  if (optionsList.length > 0 && optionsList.length <= 60) {
    container.innerHTML = `
      <input type="hidden" name="operator" value="equals">
      <div class="field">
        <label>Valor para "${esc(f.name)}" *</label>
        <select name="value" required>
          <option value="">Selecione uma opção...</option>
          ${optionsList.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('')}
        </select>
      </div>`;
  } else {
    container.innerHTML = `
      <div class="field">
        <label>Condição</label>
        <select name="operator">
          <option value="contains">Contém o texto</option>
          <option value="equals">É exatamente igual a</option>
          <option value="empty">Está em branco / não informado</option>
          <option value="not_empty">Está preenchido</option>
        </select>
      </div>
      <div class="field">
        <label>Texto a filtrar</label>
        <input type="text" name="value" placeholder="Digite o termo para filtrar...">
      </div>`;
  }
}

function applyCustomFilter(pid) {
  const form = $('#customFilterForm');
  if (!form) return;
  const d = new FormData(form);
  const fieldId = String(d.get('fieldId') || '');
  const operator = String(d.get('operator') || 'contains');
  const value = String(d.get('value') ?? '').trim();
  const valueTo = String(d.get('valueTo') ?? '').trim();

  if (!['empty', 'not_empty'].includes(operator) && !value && !valueTo) {
    return notify('Informe um valor para aplicar o filtro.');
  }

  customProjectFilters.push({
    id: uid(),
    fieldId,
    operator,
    value,
    valueTo,
  });

  tableLimit = 50;
  closeModal();
  render();
}

function removeCustomFilter(filterId) {
  customProjectFilters = customProjectFilters.filter((f) => f.id !== filterId);
  tableLimit = 50;
  render();
}

function clearCustomFilters() {
  customProjectFilters = [];
  tableLimit = 50;
  render();
}

function renderCustomFilterChips(p) {
  if (!customProjectFilters.length) return '';
  return `<div class="custom-filter-bar" role="region" aria-label="Filtros ativos">
    <span class="custom-filter-label">Filtros ativos:</span>
    ${customProjectFilters
      .map((flt) => {
        const f = p.fields.find((x) => x.id === flt.fieldId);
        const fname = f ? f.name : flt.fieldId;
        let desc = '';
        if (flt.operator === 'empty') desc = 'Em branco';
        else if (flt.operator === 'not_empty') desc = 'Preenchido';
        else if (f?.type === 'date') {
          desc = [
            flt.value ? `de ${date(flt.value)}` : '',
            flt.valueTo ? `até ${date(flt.valueTo)}` : '',
          ]
            .filter(Boolean)
            .join(' ');
        } else if (['number', 'currency'].includes(f?.type)) {
          const fmtVal = (v) => (f.type === 'currency' ? money(v) : v);
          desc = [
            flt.value !== '' ? `mín. ${fmtVal(flt.value)}` : '',
            flt.valueTo !== '' ? `máx. ${fmtVal(flt.valueTo)}` : '',
          ]
            .filter(Boolean)
            .join(' · ');
        } else {
          desc = flt.value;
        }
        return `<span class="custom-filter-chip">
          <small>${esc(fname)}:</small> <b>${esc(desc)}</b>
          <button type="button" aria-label="Remover filtro ${esc(fname)}" onclick="removeCustomFilter('${flt.id}')">${icon('close')}</button>
        </span>`;
      })
      .join('')}
    <button type="button" class="textbtn" onclick="clearCustomFilters()">Limpar filtros</button>
  </div>`;
}

function customFilterStorageKey(pid = projectId) {
  const userKey = (window.SECAP_EMAIL || me()?.email || session || 'guest').toLowerCase();
  return `secap_filters_${userKey}_${pid}`;
}

function loadUserProjectFilters(pid = projectId) {
  if (!pid) return [];
  try {
    const raw = localStorage.getItem(customFilterStorageKey(pid));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const allowedOps = new Set(['contains', 'equals', 'empty', 'not_empty']);
    return parsed
      .filter((item) => item && typeof item.fieldId === 'string')
      .map((item) => ({
        id: String(item.id || uid()),
        fieldId: String(item.fieldId),
        operator: allowedOps.has(item.operator) ? item.operator : 'contains',
        value: String(item.value ?? '').slice(0, 200),
        valueTo: String(item.valueTo ?? '').slice(0, 200),
      }));
  } catch {
    return [];
  }
}

function saveUserProjectFilters(pid = projectId) {
  if (!pid) return;
  try {
    if (customProjectFilters.length) {
      localStorage.setItem(customFilterStorageKey(pid), JSON.stringify(customProjectFilters));
    } else {
      localStorage.removeItem(customFilterStorageKey(pid));
    }
  } catch {}
}

function matchesCustomFilters(r, fields) {
  if (!customProjectFilters.length) return true;
  return customProjectFilters.every((flt) => {
    if (!flt.fieldId) return true;
    const f = fields.find((x) => x.id === flt.fieldId);
    if (!f) return true;
    const raw = r[flt.fieldId];

    if (flt.operator === 'empty') return raw === '' || raw == null;
    if (flt.operator === 'not_empty') return raw !== '' && raw != null;

    if (f.type === 'date') {
      const val = String(raw || '');
      if (!val) return false;
      if (flt.value && val < flt.value) return false;
      if (flt.valueTo && val > flt.valueTo) return false;
      return true;
    }

    if (['number', 'currency'].includes(f.type)) {
      if (raw === '' || raw == null) return false;
      const num = Number(raw);
      if (!Number.isFinite(num)) return false;
      if (flt.value !== '' && flt.value != null && num < Number(flt.value)) return false;
      if (flt.valueTo !== '' && flt.valueTo != null && num > Number(flt.valueTo)) return false;
      return true;
    }

    const needle = String(flt.value || '')
      .trim()
      .toLowerCase();
    if (!needle) return true;
    const hay = String(raw ?? '')
      .trim()
      .toLowerCase();
    return flt.operator === 'equals' ? hay === needle : hay.includes(needle);
  });
}

function openAddCustomFilter(pid) {
  const p = visible().find((x) => x.id === pid);
  if (!p) return;

  const sortedFields = [...p.fields].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const firstField =
    sortedFields.find((f) => /orgao|órgão|status|etapa|prioridade/i.test(f.name)) ||
    sortedFields[0];

  modal(
    'Adicionar filtro personalizado',
    `<form id="customFilterForm" onsubmit="event.preventDefault();applyCustomFilter('${pid}')">
      <div class="field">
        <label>Campo da obra *</label>
        <select name="fieldId" id="cfFieldSelect" onchange="updateCustomFilterInput('${pid}')">
          ${sortedFields
            .map(
              (f) =>
                `<option value="${esc(f.id)}" ${f.id === firstField?.id ? 'selected' : ''}>${esc(f.name)}</option>`
            )
            .join('')}
        </select>
      </div>
      <div id="cfDynamicInputs"></div>
    </form>`,
    btn('Cancelar', 'closeModal()', 'close') +
      `<button class="btn primary" type="submit" form="customFilterForm">${icon('check')} Aplicar filtro</button>`
  );
  updateCustomFilterInput(pid);
}

function updateCustomFilterInput(pid) {
  const p = visible().find((x) => x.id === pid);
  const fieldId = $('#cfFieldSelect')?.value;
  const container = $('#cfDynamicInputs');
  if (!p || !fieldId || !container) return;

  const f = p.fields.find((x) => x.id === fieldId);
  if (!f) return;

  if (f.type === 'date') {
    container.innerHTML = `
      <div class="twocol">
        <div class="field"><label>De (data inicial)</label><input type="date" name="value"></div>
        <div class="field"><label>Até (data final)</label><input type="date" name="valueTo"></div>
      </div>
      <small class="subtitle">Deixe um dos campos em branco para filtrar apenas a partir de ou até uma data.</small>`;
    return;
  }

  if (['number', 'currency'].includes(f.type)) {
    container.innerHTML = `
      <div class="twocol">
        <div class="field"><label>Valor mínimo</label><input type="number" step="any" name="value" placeholder="Ex.: 0"></div>
        <div class="field"><label>Valor máximo</label><input type="number" step="any" name="valueTo" placeholder="Ex.: 1000000"></div>
      </div>`;
    return;
  }

  const uniqueValues = [
    ...new Set(p.records.map((r) => String(r[f.id] ?? '').trim()).filter((v) => v !== '')),
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const optionsList = Array.isArray(f.options) && f.options.length ? f.options : uniqueValues;

  if (optionsList.length > 0 && optionsList.length <= 60) {
    container.innerHTML = `
      <input type="hidden" name="operator" value="equals">
      <div class="field">
        <label>Valor para "${esc(f.name)}" *</label>
        <select name="value" required>
          <option value="">Selecione uma opção...</option>
          ${optionsList.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('')}
        </select>
      </div>`;
  } else {
    container.innerHTML = `
      <div class="field">
        <label>Condição</label>
        <select name="operator">
          <option value="contains">Contém o texto</option>
          <option value="equals">É exatamente igual a</option>
          <option value="empty">Está em branco / não informado</option>
          <option value="not_empty">Está preenchido</option>
        </select>
      </div>
      <div class="field">
        <label>Texto a filtrar</label>
        <input type="text" name="value" placeholder="Digite o termo para filtrar...">
      </div>`;
  }
}

function applyCustomFilter(pid) {
  const form = $('#customFilterForm');
  if (!form) return;
  const d = new FormData(form);
  const fieldId = String(d.get('fieldId') || '');
  const operator = String(d.get('operator') || 'contains');
  const value = String(d.get('value') ?? '').trim();
  const valueTo = String(d.get('valueTo') ?? '').trim();

  if (!['empty', 'not_empty'].includes(operator) && !value && !valueTo) {
    return notify('Informe um valor para aplicar o filtro.');
  }

  customProjectFilters.push({ id: uid(), fieldId, operator, value, valueTo });
  saveUserProjectFilters(pid);
  tableLimit = 50;
  closeModal();
  render();
}

function removeCustomFilter(filterId) {
  customProjectFilters = customProjectFilters.filter((f) => f.id !== filterId);
  saveUserProjectFilters(projectId);
  tableLimit = 50;
  render();
}

function clearCustomFilters() {
  customProjectFilters = [];
  saveUserProjectFilters(projectId);
  tableLimit = 50;
  render();
}

function renderCustomFilterChips(p) {
  if (!customProjectFilters.length) return '';
  return `<div class="custom-filter-bar" role="region" aria-label="Filtros ativos">
    <span class="custom-filter-label">Filtros ativos:</span>
    ${customProjectFilters
      .map((flt) => {
        const f = p.fields.find((x) => x.id === flt.fieldId);
        const fname = f ? f.name : flt.fieldId;
        let desc = '';
        if (flt.operator === 'empty') desc = 'Em branco';
        else if (flt.operator === 'not_empty') desc = 'Preenchido';
        else if (f?.type === 'date') {
          desc = [
            flt.value ? `de ${date(flt.value)}` : '',
            flt.valueTo ? `até ${date(flt.valueTo)}` : '',
          ]
            .filter(Boolean)
            .join(' ');
        } else if (['number', 'currency'].includes(f?.type)) {
          const fmtVal = (v) => (f.type === 'currency' ? money(v) : v);
          desc = [
            flt.value !== '' ? `mín. ${fmtVal(flt.value)}` : '',
            flt.valueTo !== '' ? `máx. ${fmtVal(flt.valueTo)}` : '',
          ]
            .filter(Boolean)
            .join(' · ');
        } else {
          desc = flt.value;
        }
        return `<span class="custom-filter-chip">
          <small>${esc(fname)}:</small> <b>${esc(desc)}</b>
          <button type="button" aria-label="Remover filtro ${esc(fname)}" onclick="removeCustomFilter('${flt.id}')">${icon('close')}</button>
        </span>`;
      })
      .join('')}
    <button type="button" class="textbtn" onclick="clearCustomFilters()">Limpar filtros</button>
  </div>`;
}

function projectView() {
  const p = visible().find((p) => p.id === projectId);
  if (!p) return empty('Projeto indisponível', 'Seu perfil não tem acesso a esta pasta.');
  const rs = p.records
    .map((r) => ({ ...r, project: p }))
    .filter((r) => matchesQuery(r) && matchesCustomFilters(r, p.fields))
    .sort((a, b) => overviewCompareId(a, b, p));

  const hasFilters = Boolean(query || customProjectFilters.length);

  return (
    `<button class="project-return" onclick="go('projects')">← Todos os projetos</button>` +
    head(
      'PASTA DE PROJETO',
      esc(p.name),
      esc(p.description),
      btn('Exportar', `openExport('${p.id}')`, 'download') +
        (isSysAdmin() && canEdit(p) ? btn('Importar', `openImport('${p.id}')`, 'upload') : '') +
        btn('Configurar seções e campos', `editFields('${p.id}')`, 'edit') +
        (canEdit(p) ? btn('Nova obra', `editRecord('${p.id}')`, 'plus', 'primary') : '')
    ) +
    `<div class="stats">${stat(
      'OBRAS CADASTRADAS',
      hasFilters ? `${rs.length} de ${p.records.length}` : p.records.length,
      hasFilters ? 'Filtradas na seleção atual' : 'Informações desta pasta',
      'folder'
    )}${stat(
      'AVANÇO MÉDIO',
      projectProgressText(rs, p),
      'Progresso físico informado',
      'chart'
    )}${stat(
      'INVESTIMENTO',
      projectBudgetText(rs, p),
      'Valor previsto nas obras (sem canceladas)',
      'money'
    )}${stat(
      'CONCLUÍDAS',
      rs.filter((r) => projectStatusIs(r, p, 'Concluído')).length,
      'Entregas registradas',
      'check'
    )}</div><div class="filters"><div class="search">${icon(
      'search'
    )}<input aria-label="Buscar obras" placeholder="Buscar nesta pasta..." value="${esc(
      query
    )}" oninput="updateQuery(this.value)"></div><button type="button" class="btn" onclick="openAddCustomFilter('${
      p.id
    }')">${icon('plus')} Adicionar filtro${
      customProjectFilters.length ? ` (${customProjectFilters.length})` : ''
    }</button><span class="right">${p.fields.length} campos personalizados · Responsável: ${esc(
      p.owner
    )}</span></div>${renderCustomFilterChips(p)}<section class="panel project-frame" style="--pc:${p.color || '#003856'}"><div class="panelhead"><h2>Obras e registros</h2><span class="badge">${
      canEdit(p) ? 'Edição permitida' : 'Somente leitura'
    }</span></div>${
      rs.length
        ? table(rs)
        : hasFilters
          ? `<div class="empty">${icon('search')}<h3>Nenhuma obra corresponde aos filtros</h3><p>Ajuste ou remova os filtros aplicados para visualizar os registros.</p><div class="empty-actions"><button class="btn" type="button" onclick="query='';clearCustomFilters()">Limpar busca e filtros</button></div></div>`
          : `<div class="empty enhanced-empty">${icon(
              'sheet'
            )}<h3>Este projeto ainda não tem obras</h3><p>Adicione os registros manualmente ou importe uma planilha existente para começar a acompanhar resultados.</p><div class="empty-actions">${
              canEdit(p)
                ? btn('Preencher manualmente', `editRecord('${p.id}')`, 'plus', 'primary')
                : ''
            }${canEdit(p) ? btn('Importar planilha local', `openImport('${p.id}')`, 'upload') : ''}${
              canEdit(p)
                ? btn('Importar via Google Drive', `openImport('${p.id}','drive')`, 'sheet')
                : ''
            }</div></div>`
    }</section>`
  );
}
// Variável global para armazenar o timer do debounce
let searchDebounceTimer = null;

// Função otimizada para lidar com a digitação na busca
function handleSearchInput(e) {
  const value = e.target.value;
  query = value;

  // Cancela a execução anterior se o usuário continuar digitando
  clearTimeout(searchDebounceTimer);

  // Aguarda 250ms após a última tecla antes de re-renderizar a tela
  searchDebounceTimer = setTimeout(() => {
    render();

    // Mantém o foco no campo de busca e o cursor no final do texto
    const searchInput =
      document.querySelector('input[aria-label="Buscar nesta pasta..."]') ||
      document.querySelector('input[placeholder*="Buscar"]');
    if (searchInput) {
      searchInput.focus();
      searchInput.setSelectionRange(value.length, value.length);
    }
  }, 250);
}

const KANBAN_DOTS = ['#91a9b7', '#003856', '#f36e22', '#268c48'];
const PROJECT_STAGES = ['Planejamento', 'Em andamento', 'Em atenção', 'Concluído'];

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

// Etapa do projeto: a definida manualmente (arrastando o cartão) ou, se não houver,
// a deduzida das obras (atrasada/em atenção > em andamento > concluído > planejamento).
function projectStage(p) {
  if (PROJECT_STAGES.includes(p.stage)) return p.stage;
  const rs = p.records || [];
  if (!rs.length) return 'Planejamento';
  if (rs.some((r) => r.status === 'Em atenção' || late(r))) return 'Em atenção';
  if (rs.every((r) => r.status === 'Concluído')) return 'Concluído';
  if (rs.some((r) => r.status === 'Em andamento' || r.status === 'Concluído'))
    return 'Em andamento';
  return 'Planejamento';
}

function projectMatches(p) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    [p.name, p.description, p.owner].some((v) =>
      String(v || '')
        .toLowerCase()
        .includes(q)
    ) || (p.records || []).some((r) => matchesQuery(r))
  );
}

// Cartão de projeto no estilo Trello
// Cards informativos: não representam etapas nem alteram o status dos projetos.
function kanbanCard(p) {
  const color = p.color || '#003856',
    rs = p.records || [],
    withPct = rs.filter((r) => r.progresso !== '' && r.progresso != null),
    pct = withPct.length ? avg(withPct) : null;
  return `<article class="kanban tcard" style="border-top:4px solid ${color}">
    <button class="tcard-title" onclick="go('projects','${p.id}')"><h3>${esc(p.name)}</h3></button>
    <p class="tcard-next">${esc(p.description || 'Sem descrição')}</p>
    ${
      pct != null
        ? `<div class="pr"><div class="progress"><i style="width:${Math.min(100, pct)}%;background:${color}"></i></div>${pct}%</div>`
        : ''
    }
    <div class="tcard-foot">
      <span class="tcard-chip" title="Obras vinculadas">${icon('folder')}${rs.length} ${rs.length === 1 ? 'obra' : 'obras'}</span>
      <span class="tcard-spacer"></span>
      <span class="tcard-avatar" title="${esc(p.owner || 'Sem responsável')}">${esc(initials(p.owner))}</span>
    </div>
  </article>`;
}

function kanban() {
  const ps = visible()
    .filter((p) => !filterProject || p.id === filterProject)
    .filter(projectMatches);
  return (
    head(
      'VISUALIZAÇÃO DOS PROJETOS',
      'Acompanhamento',
      'Visualize os projetos em cards informativos, sem classificação por status.',
      btn('Ver projetos', "go('projects')", 'folder')
    ) +
    `<div class="filters">
      <div class="search">${icon('search')}<input aria-label="Buscar" placeholder="Buscar projeto, obra ou responsável..." value="${esc(query)}" oninput="updateQuery(this.value)"></div>
      <select aria-label="Filtrar projeto" onchange="filterProject=this.value;render()">
        <option value="">Todos os projetos</option>
        ${visible()
          .map(
            (p) =>
              `<option value="${p.id}" ${filterProject === p.id ? 'selected' : ''}>${esc(p.name)}</option>`
          )
          .join('')}
      </select>
      <span class="right">${icon('folder')} ${ps.length} ${ps.length === 1 ? 'projeto' : 'projetos'}</span>
    </div>
    <div class="board trello-board" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr));align-items:start">
      ${ps.map(kanbanCard).join('') || empty('Nenhum projeto', 'Crie um projeto para visualizar os cards nesta área.')}
    </div>`
  );
}

// Permissão por campo definida pelo administrador (Administração > Permissões por campo).
// Sem fid: pergunta se o usuário tem ao menos um campo liberado no projeto.
function memberFieldAllowed(pid, fid) {
  if (typeof getAllowedFieldsForCurrentUser !== 'function') return isSysAdmin();
  const allowed = getAllowedFieldsForCurrentUser(pid);
  if (allowed === null) return true;
  return fid == null ? allowed.length > 0 : allowed.includes(String(fid));
}

function moveRecord(pid, rid, val) {
  const p = db.projects.find((p) => p.id === pid);
  if (!p || !canEdit(p)) return notify('Edição não permitida.');
  const f = p.fields.find((f) => f.id === kanbanField);
  if (!f?.options.includes(val)) return notify('Essa opção não existe neste projeto.');
  if (!memberFieldAllowed(pid, kanbanField))
    return notify(
      `Você não tem permissão para alterar o campo "${f.name}" neste projeto.`,
      'error'
    );
  const r = p.records.find((r) => r.id === rid),
    before = r[kanbanField];
  r[kanbanField] = val;
  persist(`Alterou ${f.name}`, p, before, val, f.name, !!window.SECAP_OBRAS_BACKEND);
  if (window.SECAP_OBRAS_BACKEND) {
    window.SECAP_OBRAS_BACKEND.saveObra(p.id, r);
  }
  render();
  notify('Etapa atualizada em todo o portal.');
}

function dropRecord(e, val) {
  e.preventDefault();
  const [p, r] = e.dataTransfer.getData('text/plain').split('|');
  moveRecord(p, r, val);
}

function bi() {
  const rs = records(),
    total = sum(rs, 'valor'),
    exec = sum(rs, 'executado');
  return (
    head(
      'INTELIGÊNCIA DA GESTÃO',
      'BI/Painéis',
      'Transforme os dados dos projetos em decisões.',
      btn('Exportar dados', 'exportCSV()', 'download')
    ) +
    filters() +
    stats(rs) +
    `<div class="grid"><section class="panel"><div class="panelhead"><div><h2>Investimento por projeto</h2><small>Previsto e executado · valores informados nos registros</small></div></div><div class="panelbody">${visible()
      .filter((p) => !filterProject || p.id === filterProject)
      .map((p) => {
        const r = rs.filter((r) => r.project.id === p.id),
          v = sum(r, 'valor'),
          e = sum(r, 'executado');
        return `<div style="margin:12px 0 28px"><div class="chartrow"><b>${esc(
          p.name
        )}</b><span>${compact(
          v
        )}</span></div><div class="progress" style="height:17px;background:#e5edf1"><i style="width:${
          total ? (v / total) * 100 : 0
        }%;background:var(--navy)"></i></div><div class="progress" style="height:7px;margin-top:5px;background:transparent"><i style="width:${
          total ? (e / total) * 100 : 0
        }%;background:var(--cyan)"></i></div><small style="font-size:9px;color:var(--muted)">${compact(
          e
        )} executados · ${v ? Math.round((e / v) * 100) : 0}% financeiro</small></div>`;
      })
      .join(
        ''
      )}<div class="legend"><span><i></i>Previsto</span><span><i style="background:var(--cyan)"></i>Executado</span></div></div></section><section class="panel"><div class="panelhead"><h2>Execução financeira da carteira</h2></div><div class="panelbody"><div class="donut" style="background:conic-gradient(var(--navy) ${
      total ? Math.min(100, (exec / total) * 100) : 0
    }%,#eaf0f2 0)"><div class="donutvalue">${
      total ? Math.round((exec / total) * 100) : 0
    }%<small>do valor previsto</small></div></div><div class="chartrow"><span>Executado</span><b>${compact(
      exec
    )}</b></div><div class="chartrow"><span>Saldo previsto</span><b>${compact(
      total - exec
    )}</b></div><p class="subtitle">${avg(
      rs
    )}% de avanço físico médio · média simples das obras.</p></div></section></div><div class="grid"><section class="panel"><div class="panelhead"><h2>Obras por situação</h2></div><div class="panelbody">${chart(
      rs
    )}</div></section><section class="panel"><div class="panelhead"><h2>Indicadores personalizados</h2></div><div class="panelbody"><p class="subtitle">Campos numéricos criados nos projetos também viram indicadores.</p>${
      [
        ...new Map(
          visible()
            .flatMap((p) =>
              p.fields.filter(
                (f) =>
                  ['number', 'currency'].includes(f.type) &&
                  !['valor', 'executado', 'progresso'].includes(f.id)
              )
            )
            .map((f) => [f.id, f])
        ).values(),
      ]
        .map(
          (f) =>
            `<div class="chartrow"><span>${esc(f.name)}</span><b>${
              f.type === 'currency' ? money(sum(rs, f.id)) : sum(rs, f.id).toLocaleString('pt-BR')
            }</b></div>`
        )
        .join('') ||
      '<div class="empty" style="padding:30px">Personalize os campos de um projeto para ampliar esta análise.</div>'
    }</div></section></div>`
  );
}

function events() {
  return records()
    .flatMap((r) =>
      r.project.fields
        .filter((f) => f.type === 'date' && r[f.id])
        .map((f) => ({
          date: r[f.id],
          title: r.nome || 'Registro',
          field: f.name,
          r,
        }))
    )
    .concat(
      db.terms
        .filter(
          (t) =>
            visible().some((p) => p.id === t.project) &&
            t.deadline &&
            (!filterProject || t.project === filterProject) &&
            (!query || JSON.stringify(t).toLowerCase().includes(query.toLowerCase()))
        )
        .map((t) => ({
          date: t.deadline,
          title: t.number + ' · ' + t.name,
          field: 'Fim da vigência',
          term: t.id,
          r: {
            id: t.id,
            project: db.projects.find((p) => p.id === t.project),
            prazo: t.deadline,
            status: t.status,
          },
        }))
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calendar() {
  const ev = events(),
    days = new Date(year, month + 1, 0).getDate(),
    offset = new Date(year, month, 1).getDay(),
    name = new Date(year, month).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
  return (
    head(
      'AGENDA CONECTADA',
      'Calendário',
      'Todo campo de data vira um prazo aqui. Sem cadastrar duas vezes.',
      btn('Hoje', 'calendarToday()', 'calendar')
    ) +
    filters() +
    `<section class="panel"><div class="panelhead"><h2 style="text-transform:capitalize">${name}</h2><div class="actions">${btn(
      'Anterior',
      'changeMonth(-1)',
      'calendar'
    )}${btn('Próximo', 'changeMonth(1)', 'arrow')}</div></div><div class="calgrid">${[
      'Dom',
      'Seg',
      'Ter',
      'Qua',
      'Qui',
      'Sex',
      'Sáb',
    ]
      .map((d) => `<div class="weekday">${d}</div>`)
      .join('')}${Array.from(
      { length: offset },
      () => '<div class="day" style="background:#fafbfb"></div>'
    ).join('')}${Array.from({ length: days }, (_, i) => {
      const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      return `<div class="day ${d === today() ? 'today' : ''}"><b>${i + 1}</b>${ev
        .filter((e) => e.date === d)
        .map(
          (e) =>
            `<button class="event ${
              late(e.r) ? 'orange' : ''
            }" title="${esc(e.field + ': ' + e.title)}" onclick="${
              e.term ? `editTerm('${e.term}')` : `editRecord('${e.r.project.id}','${e.r.id}')`
            }">${esc(e.title)}</button>`
        )
        .join('')}</div>`;
    }).join(
      ''
    )}</div></section><section class="panel" style="margin-top:22px"><div class="panelhead"><h2>Prazos do mês</h2><small>${
      ev.filter((e) => e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length
    } eventos vinculados</small></div>${
      ev
        .filter((e) => e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
        .map(
          (e) =>
            `<button class="attention" style="width:100%;text-align:left" onclick="${
              e.term ? `editTerm('${e.term}')` : `editRecord('${e.r.project.id}','${e.r.id}')`
            }"><span class="alerticon">${icon(
              'calendar'
            )}</span><div><h3>${date(e.date)} · ${esc(e.title)}</h3><p>${esc(
              e.field
            )} · ${esc(e.r.project.name)}</p></div></button>`
        )
        .join('') ||
      empty('Sem prazos neste mês', 'As datas dos projetos aparecerão automaticamente aqui.')
    }</section>`
  );
}

function changeMonth(n) {
  month += n;
  if (month > 11) {
    month = 0;
    year++;
  }
  if (month < 0) {
    month = 11;
    year--;
  }
  render();
}

function calendarToday() {
  const d = new Date();
  month = d.getMonth();
  year = d.getFullYear();
  render();
}

function terms() {
  const ts = db.terms.filter((t) => visible().some((p) => p.id === t.project));
  return (
    head(
      'INSTRUMENTOS E COMPROMISSOS',
      'Termos de compromisso',
      'Acompanhe vigências, parceiros e providências vinculadas aos projetos.',
      canManage() ? btn('Novo termo', 'editTerm()', 'plus', 'primary') : ''
    ) +
    `<div class="banner">${icon(
      'file'
    )}<span>Os termos ficam em uma área própria e são vinculados a uma pasta de projeto. Cadastre vigência, valor e a próxima providência.</span></div><section class="panel"><div class="tablewrap"><table><thead><tr><th>Termo / objeto</th><th>Projeto vinculado</th><th>Situação</th><th>Valor</th><th>Vigência</th><th></th></tr></thead><tbody>${ts
      .map(
        (t) =>
          `<tr><td><strong>${esc(t.number)}</strong><div class="desc">${esc(
            t.name
          )}</div></td><td>${esc(
            db.projects.find((p) => p.id === t.project)?.name
          )}</td><td>${badge(t.status)}</td><td>${compact(t.value)}</td><td>${date(
            t.deadline
          )}</td><td><button class="iconbtn" aria-label="Abrir termo" onclick="editTerm('${
            t.id
          }')">${icon('arrow')}</button></td></tr>`
      )
      .join('')}</tbody></table></div>${
      ts.length
        ? ''
        : empty('Nenhum termo vinculado', 'Adicione um termo para acompanhar os compromissos.')
    }</section><section class="panel" style="margin-top:22px"><div class="panelhead"><h2>Próximas providências dos termos</h2></div>${ts
      .map(
        (t) =>
          `<div class="attention"><span class="alerticon">${icon(
            'file'
          )}</span><div><h3>${esc(t.number)} · ${esc(t.name)}</h3><p>${esc(
            t.next
          )}</p><small class="subtitle">Parceiro: ${esc(t.partner)}</small></div></div>`
      )
      .join('')}</section>`
  );
}

function notes() {
  const ns = db.notes.filter((n) => n.user === session);
  return (
    head(
      'ESPAÇO PESSOAL',
      'Minhas anotações',
      'Suas ideias, lembretes e pontos de reunião em um só lugar.',
      btn('Nova anotação', 'editNote()', 'plus', 'primary')
    ) +
    `<div class="banner">${icon(
      'shield'
    )}<span>Anotações do administrador deste portal.</span></div><div class="notegrid">${ns
      .map(
        (n) =>
          `<article class="note"><div class="ptop"><h3>${esc(
            n.title
          )}</h3><button class="iconbtn" aria-label="Editar anotação" onclick="editNote('${
            n.id
          }')">${icon('edit')}</button></div><p>${esc(n.text)}</p><small>Atualizada em ${new Date(
            n.at
          ).toLocaleString('pt-BR')}</small></article>`
      )
      .join('')}</div>${
      ns.length
        ? ''
        : empty(
            'Um espaço para suas ideias',
            'Crie uma anotação para sua próxima reunião ou visita técnica.'
          )
    }`
  );
}

let auditLoaded = false,
  auditLoading = false,
  auditRows = [],
  auditError = '';
let auditScope = 'projects',
  auditDetailRecoveryRows = [];
let auditView = 'recent',
  auditDateMode = 'all',
  auditStart = '',
  auditEnd = '',
  auditRecovering = false;
let auditPage = 0,
  auditCursors = [null],
  auditNextCursor = null,
  auditHasMore = false;
let auditPeriodStart = '',
  auditPeriodEnd = '',
  auditAvailableStart = '',
  auditAvailableEnd = '',
  auditArchiveEnd = '',
  auditRequest = 0;
function resetAuditPages() {
  auditPage = 0;
  auditCursors = [null];
  auditNextCursor = null;
  auditLoaded = false;
}
async function loadAuditLogs() {
  if (!isSysAdmin()) return;
  const request = ++auditRequest,
    cursor = auditCursors[auditPage];
  auditLoading = true;
  auditError = '';
  auditRows = [];
  const args = {
    p_view: auditView,
    p_scope: auditScope,
    p_start: auditDateMode === 'selected' ? auditStart : null,
    p_end: auditDateMode === 'selected' ? auditEnd : null,
    p_before_at: cursor?.at || null,
    p_before_id: cursor?.id || null,
    p_archive_end: auditView === 'archive' ? auditArchiveEnd || null : null,
  };
  if (tab === 'history') render();
  try {
    if (!window.sb) throw new Error('Conexão ao servidor indisponível.');
    if (typeof saveChain !== 'undefined') await saveChain;
    if (request !== auditRequest) return;
    const result = await window.sb.rpc('secap_audit_page_scoped', args);
    if (request !== auditRequest || !isSysAdmin()) return;
    if (result.error) throw result.error;
    if (!Array.isArray(result.data?.rows)) throw new Error('Resposta de auditoria inválida.');
    auditRows = result.data.rows;
    auditHasMore = !!result.data.hasMore;
    auditNextCursor = result.data.nextCursor;
    auditPeriodStart = result.data.periodStart || '';
    auditPeriodEnd = result.data.periodEnd || '';
    auditAvailableStart = result.data.availableStart || '';
    auditAvailableEnd = result.data.availableEnd || '';
    auditAvailableDates = Array.isArray(result.data.availableDates)
      ? result.data.availableDates
      : [];
    auditPicker = '';
  } catch (error) {
    if (request !== auditRequest) return;
    auditRows = [];
    auditHasMore = false;
    auditError =
      'Não foi possível consultar a auditoria. Verifique a conexão e aplique supabase/security/agenda_audit_update.sql. Detalhe: ' +
      String(error?.message || error);
  } finally {
    if (request === auditRequest) {
      auditLoading = false;
      auditLoaded = true;
      if (tab === 'history' && isSysAdmin()) render();
    }
  }
}
function refreshAuditLogs() {
  resetAuditPages();
  return loadAuditLogs();
}
function changeAuditPage(direction) {
  if (auditLoading) return;
  if (direction > 0 && auditHasMore) {
    auditCursors[auditPage + 1] = auditNextCursor;
    auditPage++;
  } else if (direction < 0 && auditPage > 0) auditPage--;
  else return;
  auditLoaded = false;
  loadAuditLogs();
}
function auditValue(value) {
  if (value === undefined || value === null || value === '') return '—';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
// Criação/exclusão de obra guardam a obra inteira; na tabela mostra um resumo.
function auditObraValue(entry, value) {
  if (entry && entry.eventId && !entry.fieldId && value && typeof value === 'object')
    return `Dados da obra (${Object.keys(value).length} campos)`;
  return auditValue(value);
}
function auditShortDate(value, year = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '—';
  const [y, m, d] = value.split('-');
  return `${d}/${m}${year ? '/' + y : ''}`;
}
function auditRangeLabel(start, end) {
  const differentYear = start?.slice(0, 4) !== end?.slice(0, 4);
  return `${auditShortDate(start, differentYear)} – ${auditShortDate(end, differentYear)}`;
}
function setAuditScope(scope) {
  if (!isSysAdmin()) return;
  auditScope = scope === 'bi' ? 'bi' : 'projects';
  setAuditView('recent');
}
function setAuditView(view) {
  if (!isSysAdmin()) return;
  auditView = view === 'archive' ? 'archive' : 'recent';
  auditArchiveEnd = '';
  auditStart = '';
  auditEnd = '';
  auditDateMode = 'all';
  auditPeriodStart = '';
  auditPeriodEnd = '';
  auditAvailableStart = '';
  auditAvailableEnd = '';
  resetAuditPages();
  loadAuditLogs();
}
function shiftAuditArchive(direction) {
  if (auditView !== 'archive' || !auditPeriodEnd || auditLoading) return;
  const day = new Date(auditPeriodEnd + 'T12:00:00Z');
  day.setUTCDate(day.getUTCDate() + 40 * direction);
  auditArchiveEnd = day.toISOString().slice(0, 10);
  auditStart = '';
  auditEnd = '';
  auditDateMode = 'all';
  resetAuditPages();
  loadAuditLogs();
}
function applyAuditDates(form) {
  const data = new FormData(form),
    start = String(data.get('start') || ''),
    end = String(data.get('end') || '');
  if (
    !start ||
    !end ||
    start > end ||
    start < auditPeriodStart ||
    end > auditPeriodEnd ||
    !auditAvailableDates.includes(start) ||
    !auditAvailableDates.includes(end)
  )
    return notify('Selecione datas válidas dentro do período exibido.', 'error');
  auditStart = start;
  auditEnd = end;
  auditDateMode = 'selected';
  resetAuditPages();
  loadAuditLogs();
}
function showAllAuditDates() {
  auditDateMode = 'all';
  auditStart = '';
  auditEnd = '';
  resetAuditPages();
  loadAuditLogs();
}
let auditAvailableDates = [],
  auditPicker = '',
  auditPickerMonth = '';
function auditDateControl(field, label, value) {
  return `<div class="field audit-calendar-field"><label>${label}</label><input type="hidden" id="${field}" name="${field === 'auditStart' ? 'start' : 'end'}" value="${esc(value)}"><button class="audit-date-trigger" type="button" aria-label="${label}" aria-haspopup="dialog" aria-expanded="${auditPicker === field}" onclick="toggleAuditCalendar('${field}')"><span id="${field}Display">${value ? auditShortDate(value, true) : 'dd/mm/aaaa'}</span>${icon('calendar')}</button><div id="${field}Calendar" class="audit-calendar-host"></div></div>`;
}
function toggleAuditCalendar(field) {
  if (auditLoading) return;
  const old = auditPicker;
  document.querySelectorAll('.audit-calendar-host').forEach((el) => (el.innerHTML = ''));
  document
    .querySelectorAll('.audit-date-trigger')
    .forEach((el) => el.setAttribute('aria-expanded', 'false'));
  if (old === field) {
    auditPicker = '';
    return;
  }
  auditPicker = field;
  const value =
    document.getElementById(field)?.value ||
    (field === 'auditStart' ? auditAvailableStart : auditAvailableEnd) ||
    auditPeriodStart;
  auditPickerMonth = value.slice(0, 7);
  renderAuditCalendar();
}
function renderAuditCalendar() {
  const host = document.getElementById(auditPicker + 'Calendar');
  if (!host) return;
  const [year, month] = auditPickerMonth.split('-').map(Number),
    first = new Date(Date.UTC(year, month - 1, 1, 12));
  if (Number.isNaN(first.getTime())) return;
  const days = new Date(Date.UTC(year, month, 0, 12)).getUTCDate(),
    offset = first.getUTCDay();
  const available = new Set(auditAvailableDates),
    selected = document.getElementById(auditPicker)?.value || '';
  const prev = auditPickerMonth <= auditPeriodStart.slice(0, 7),
    next = auditPickerMonth >= auditPeriodEnd.slice(0, 7);
  host.innerHTML = `<div class="audit-calendar" role="dialog" aria-label="Selecionar ${auditPicker === 'auditStart' ? 'data inicial' : 'data final'}" onkeydown="if(event.key==='Escape')closeAuditCalendar()"><div class="audit-calendar-head"><button type="button" aria-label="Mês anterior" ${prev ? 'disabled' : ''} onclick="moveAuditCalendar(-1)">‹</button><strong>${esc(first.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }))}</strong><button type="button" aria-label="Próximo mês" ${next ? 'disabled' : ''} onclick="moveAuditCalendar(1)">›</button></div><div class="audit-calendar-week">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((x) => `<span>${x}</span>`).join('')}</div><div class="audit-calendar-days">${'<span></span>'.repeat(offset)}${Array.from(
    { length: days },
    (_, i) => {
      const day = `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      const enabled = day >= auditPeriodStart && day <= auditPeriodEnd && available.has(day);
      return `<button type="button" class="${selected === day ? 'is-selected' : ''}" aria-label="${auditShortDate(day, true)}" ${enabled ? '' : 'disabled'} ${selected === day ? 'aria-pressed="true"' : ''} onclick="selectAuditDate('${day}')">${i + 1}</button>`;
    }
  ).join(
    ''
  )}</div><button class="audit-calendar-close" type="button" onclick="closeAuditCalendar()">Fechar</button></div>`;
  host.previousElementSibling?.setAttribute('aria-expanded', 'true');
}
function moveAuditCalendar(delta) {
  const [year, month] = auditPickerMonth.split('-').map(Number),
    d = new Date(Date.UTC(year, month - 1 + delta, 1, 12));
  const next = d.toISOString().slice(0, 7);
  if (next < auditPeriodStart.slice(0, 7) || next > auditPeriodEnd.slice(0, 7)) return;
  auditPickerMonth = next;
  renderAuditCalendar();
}
function selectAuditDate(day) {
  if (!auditAvailableDates.includes(day) || day < auditPeriodStart || day > auditPeriodEnd) return;
  const field = auditPicker,
    input = document.getElementById(field),
    display = document.getElementById(field + 'Display');
  if (input) input.value = day;
  if (display) display.textContent = auditShortDate(day, true);
  closeAuditCalendar();
  document.getElementById(field)?.nextElementSibling?.focus();
}
function closeAuditCalendar() {
  document.querySelectorAll('.audit-calendar-host').forEach((el) => (el.innerHTML = ''));
  document
    .querySelectorAll('.audit-date-trigger')
    .forEach((el) => el.setAttribute('aria-expanded', 'false'));
  auditPicker = '';
}
document.addEventListener('click', (e) => {
  if (auditPicker && !e.target.closest('.audit-calendar-field')) closeAuditCalendar();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && auditPicker) closeAuditCalendar();
});

function requestAuditRecovery(eventId) {
  if (!isSysAdmin() || auditRecovering) return;
  const l = [...auditRows, ...auditDetailRecoveryRows].find((l) => l.eventId === eventId);
  if (!l?.recoverable || l.recovered)
    return notify('Esta alteração não pode ser recuperada automaticamente.', 'error');
  modal(
    'Recuperar informação anterior',
    `<div class="audit-recovery-summary"><p>Você está prestes a substituir o valor atual pelo valor anterior do campo indicado.</p>
    <p><b>Projeto:</b> ${esc(l.projectName)}<br><b>Obra:</b> ${esc(l.recordName || l.recordId)}<br><b>Campo:</b> ${esc(l.field)}</p>
    <div><b>Valor atual registrado:</b><p>${esc(auditValue(l.after))}</p></div>
    <div><b>Valor que será recuperado:</b><p>${esc(auditValue(l.before))}</p></div>
    <p>A recuperação identificará seu usuário na auditoria e manterá a alteração original no histórico.</p></div>`,
    btn('Cancelar', 'closeModal()', 'close') +
      btn(
        'Concordo em voltar',
        `confirmAuditRecovery('${esc(eventId)}',this)`,
        'history',
        'primary'
      )
  );
}
async function confirmAuditRecovery(eventId, button) {
  if (!isSysAdmin() || auditRecovering) return;
  auditRecovering = true;
  if (button) {
    button.disabled = true;
    button.textContent = 'Recuperando…';
  }
  try {
    if (!window.sb) throw new Error('Conexão indisponível.');
    if (typeof saveChain !== 'undefined') await saveChain;
    const result = await window.sb.rpc('secap_recover_audit', {
      event_id: eventId,
      agreement: true,
    });
    if (result.error) throw result.error;
    if (!result.data?.ok || !result.data.obra)
      throw new Error('O servidor não confirmou a recuperação.');
    const row = result.data.obra;
    const p = db.projects.find((p) => p.id === row.project_id);
    if (p) {
      const i = p.records.findIndex((r) => String(r.id) === String(row.id));
      const restored = window.SECAP_OBRAS_BACKEND.obraRowToRecord(row);
      if (i >= 0) p.records[i] = restored;
    }
    closeModal();
    resetAuditPages();
    await loadAuditLogs();
    notify('Informação anterior recuperada. A recuperação foi registrada na auditoria.', 'success');
  } catch (error) {
    notify('Não foi possível recuperar: ' + String(error?.message || error), 'error');
    if (button) {
      button.disabled = false;
      button.textContent = 'Concordo em voltar';
    }
  } finally {
    auditRecovering = false;
  }
}
function isAuditBatch(entry) {
  return /^Edição em lote de obras/.test(entry.action || '');
}
function auditBILabel(entry) {
  if (entry.source === 'bi' || /\bBI\b/i.test(entry.action || '')) return 'Sim';
  if (entry.source === 'projects' || entry.eventId || isAuditBatch(entry)) return 'Não';
  return '—';
}
// Justificativas por obra chegam como "[Obra] texto | [Obra 2] texto".
function auditObraReasons(reason) {
  const text = String(reason || '');
  if (!text.startsWith('[')) return null;
  const map = new Map();
  for (const m of text.matchAll(/\[([^\]]+)\] ([\s\S]*?)(?= \| \[|$)/g)) map.set(m[1], m[2]);
  return map.size ? map : null;
}
function auditReason(entry) {
  const reason =
    entry.details?.reason ||
    (isAuditBatch(entry)
      ? String(entry.after || '').match(/Justificativa: ([\s\S]*?)(?: \| Alterações:|$)/)?.[1]
      : '');
  if (!reason) return '—';
  // Registro de uma obra só: mostra apenas a justificativa daquela obra.
  const byObra = !isAuditBatch(entry) && entry.recordName ? auditObraReasons(reason) : null;
  return byObra ? byObra.get(entry.recordName) || 'Não informada' : reason;
}
// Revisão das obras (Alteração feita / Sem alteração) registrada ao concluir a edição.
function auditReviewHtml(entry) {
  const review = Array.isArray(entry.details?.review) ? entry.details.review : null;
  const checklist = entry.details?.checklist || [];
  if (!review) {
    if (!checklist.length) return '';
    const isReview = checklist.some((c) =>
      /^(Alteração feita|Sem alteração|Sem marcação):/.test(c)
    );
    return `<p><strong>${isReview ? 'Revisão das obras' : 'Tipo de mudança'}:</strong> ${esc(checklist.join('; '))}</p>`;
  }
  const changed = review.filter((r) => r.status === 'alterada').length;
  return `<h4>Revisão das obras</h4>
    <div class="obra-review-legend" aria-label="Legenda da revisão das obras">
      <span class="orl-item is-changed"><i aria-hidden="true">✓</i><span><strong>Alteração feita</strong> · ${changed} obra(s)</span></span>
      <span class="orl-item is-unchanged"><i aria-hidden="true">✓</i><span><strong>Sem alteração</strong> · ${review.filter((r) => r.status === 'sem_alteracao').length} obra(s)</span></span>${review.some((r) => r.status === 'sem_marcacao') ? `<span class="orl-item"><span><strong>Sem marcação</strong> · ${review.filter((r) => r.status === 'sem_marcacao').length} obra(s)</span></span>` : ''}
      <span class="orl-item is-note">${icon('note')}<span><strong>Justificativa</strong> · opcional, por obra</span></span>
    </div>
    <table class="audit-details-table audit-review-table"><thead><tr><th>Obra</th><th>Situação</th><th>Justificativa</th></tr></thead><tbody>${review
      .map((r) => {
        const on = r.status === 'alterada';
        const none = r.status === 'sem_marcacao';
        return `<tr><td>${esc(r.recordName || r.recordId || '—')}</td><td><span class="audit-review-status ${on ? 'is-changed' : 'is-unchanged'}">${none ? '' : '<i aria-hidden="true">✓</i>'}${on ? 'Alteração feita' : none ? 'Sem marcação' : 'Sem alteração'}</span></td><td>${esc(r.justification || 'Não informada')}</td></tr>`;
      })
      .join('')}</tbody></table>`;
}
function auditDetailChanges(entry) {
  if (Array.isArray(entry.details?.changes)) return entry.details.changes;
  if (!isAuditBatch(entry))
    return [
      {
        recordName: entry.recordName || '',
        action: entry.action,
        field: entry.field || '—',
        before: entry.before,
        after: entry.after,
      },
    ];
  // Compatibilidade com os resumos antigos; preserva o texto quando não há estrutura segura.
  const parse = (text) => {
    const result = [];
    for (const part of String(text || '').split(' | ')) {
      const match = part.match(/^\[([^\]]+)\] ([\s\S]*)$/);
      if (!match) continue;
      for (const field of match[2].split('; ')) {
        const at = field.indexOf(': ');
        if (at >= 0)
          result.push({
            recordName: match[1],
            field: field.slice(0, at),
            value: field.slice(at + 2),
          });
      }
    }
    return result;
  };
  const before = parse(entry.before),
    after = parse(
      String(entry.after || '')
        .split(' | Alterações: ')
        .slice(1)
        .join(' | Alterações: ')
    );
  if (
    before.length &&
    before.length === after.length &&
    before.every((v, i) => v.recordName === after[i].recordName && v.field === after[i].field)
  )
    return before.map((v, i) => ({
      recordName: v.recordName,
      action: 'Alterou campo',
      field: v.field,
      before: v.value,
      after: after[i].value,
    }));
  return [];
}
async function openAuditDetails(index) {
  if (!isSysAdmin()) return;
  const entry = auditRows[index];
  if (!entry) return;
  const changes = auditDetailChanges(entry);
  auditDetailRecoveryRows = [];
  const detailToken = String(Date.now()) + Math.random();
  modal(
    'Detalhes da alteração',
    `<div class="audit-detail-content" data-audit-detail="${detailToken}"><p><strong>Data e hora:</strong> ${esc(new Date(entry.at).toLocaleString('pt-BR'))}</p><p><strong>Ação:</strong> ${esc(entry.action || '—')}</p><p><strong>Responsável:</strong> ${esc(entry.who || 'Não informado')}</p>${Array.isArray(entry.details?.review) ? '' : `<p><strong>Justificativa:</strong> ${esc(auditReason(entry))}</p>`}${auditReviewHtml(entry)}${changes.length ? `<table class="audit-details-table"><thead><tr><th>Obra</th><th>Ação</th><th>Campo</th><th>Registro anterior</th><th>Registro atualizado</th><th>Recuperação</th></tr></thead><tbody>${changes.map((c, changeIndex) => `<tr><td>${esc(c.recordName || entry.recordName || '—')}</td><td>${esc(c.action || 'Alterou campo')}</td><td>${esc(c.field || '—')}</td><td>${esc(auditValue(c.before))}</td><td>${esc(auditValue(c.after))}</td><td data-detail-recovery="${changeIndex}">${entry.eventId && entry.recoverable && entry.fieldId && !entry.recovered ? btn('Recuperar', `requestAuditRecovery('${esc(entry.eventId)}')`, 'history') : entry.recovered ? 'Recuperado' : isAuditBatch(entry) && entry.details?.changes ? 'Consultando…' : 'Indisponível'}</td></tr>`).join('')}</tbody></table>` : `<p>Registro antigo sem detalhamento estruturado. Conteúdo original preservado:</p><h4>Registro anterior</h4><pre>${esc(auditValue(entry.before))}</pre><h4>Registro atualizado</h4><pre>${esc(auditValue(entry.after))}</pre>`}</div>`,
    btn('Fechar', 'closeModal()', 'close')
  );
  if (isAuditBatch(entry) && entry.details?.changes && window.sb) {
    try {
      const response = await window.sb.rpc('secap_audit_detail_events', { p_log_id: entry.id });
      if (document.querySelector('[data-audit-detail]')?.dataset.auditDetail !== detailToken)
        return;
      if (response.error) throw response.error;
      auditDetailRecoveryRows = Array.isArray(response.data) ? response.data : [];
      for (let i = 0; i < changes.length; i++) {
        const cell = document.querySelector(`[data-detail-recovery="${i}"]`),
          event = auditDetailRecoveryRows.find((e) => e.changeIndex === i);
        if (cell)
          cell.innerHTML = event?.recoverable
            ? btn('Recuperar', `requestAuditRecovery('${esc(event.eventId)}')`, 'history')
            : 'Indisponível';
      }
    } catch (error) {
      if (document.querySelector('[data-audit-detail]')?.dataset.auditDetail !== detailToken)
        return;
      document.querySelectorAll('[data-detail-recovery]').forEach((cell) => {
        cell.textContent = 'Indisponível';
        cell.title = 'Não foi possível consultar um registro seguro para recuperação.';
      });
    }
  }
}
function history() {
  if (!isSysAdmin())
    return empty('Acesso restrito', 'Auditoria disponível apenas para administradores.');
  if (!auditLoaded && !auditLoading) queueMicrotask(loadAuditLogs);
  const logs = auditRows,
    archived = auditView === 'archive';
  return (
    head(
      'AUDITORIA DO SISTEMA',
      auditScope === 'bi' ? 'Histórico de BI' : 'Registros de alteração',
      'Saiba quem alterou, quando alterou e o que mudou.',
      btn(
        archived ? 'Registros recentes' : 'Histórico arquivado',
        `setAuditView('${archived ? 'recent' : 'archive'}')`,
        'folder'
      ) +
        btn(
          auditScope === 'bi' ? 'Auditoria de obras' : 'Histórico de BI',
          `setAuditScope('${auditScope === 'bi' ? 'projects' : 'bi'}')`,
          'chart'
        ) +
        btn('Baixar relatório', "openReportExport('audit')", 'download') +
        btn('Atualizar', 'refreshAuditLogs()', 'history')
    ) +
    `<section class="panel audit-date-panel"><div class="panelbody audit-filter-row">
    <div class="audit-period-summary"><h2>${archived ? 'Histórico arquivado' : 'Registros recentes'}</h2>
    <p class="subtitle">${auditAvailableStart ? `Datas com registros: ${esc(auditShortDate(auditAvailableStart, true))} – ${esc(auditShortDate(auditAvailableEnd, true))}` : 'Nenhum registro neste período.'}</p>
    ${archived ? `<div class="actions audit-period-actions"><button class="textbtn" ${auditLoading ? 'disabled' : ''} onclick="shiftAuditArchive(-1)">← 40 dias anteriores</button><button class="textbtn" ${auditLoading ? 'disabled' : ''} onclick="shiftAuditArchive(1)">40 dias seguintes →</button></div>` : ''}</div>
    <div class="audit-date-controls"><form class="audit-date-form" onsubmit="event.preventDefault();applyAuditDates(this)">
    ${auditDateControl('auditStart', 'Data inicial', auditStart)}${auditDateControl('auditEnd', 'Data final', auditEnd)}
    <button class="btn primary" type="submit" ${auditLoading ? 'disabled' : ''}>Ver datas selecionadas</button><button class="btn" type="button" onclick="showAllAuditDates()" ${auditLoading ? 'disabled' : ''}>Ver tudo</button>
    </form></div></div></section>
    ${!window.SECAP_PROFILE_NAME || String(window.SECAP_PROFILE_NAME).includes('@') ? `<div class="banner" role="status"><span>O nome da sua conta ainda não está preenchido no servidor.</span>${btn('Preencher meu nome', "go('profile')", 'user')}</div>` : ''}
    ${auditError ? `<div class="banner" role="alert">${esc(auditError)}</div>` : ''}
    ${auditLoading || !auditLoaded ? '<p role="status">Consultando registros…</p>' : ''}
    <section class="panel audit-panel"><div class="tablewrap"><table aria-label="Registros de alteração"><thead><tr>
    <th>Data e Hora</th><th>Usuário/<wbr>Responsável</th><th>Ação</th><th>Qual Projeto</th><th>Campo</th><th>Registro Anterior</th><th>Registro Atualizado</th><th>Justificativa</th><th>Recuperação</th>
    </tr></thead><tbody>${logs
      .map((l, auditIndex) => {
        const project = db.projects.find((p) => p.id === l.project);
        const single =
          isAuditBatch(l) && auditDetailChanges(l).length === 1 ? auditDetailChanges(l)[0] : null;
        const multiple = isAuditBatch(l) && !single;
        const field =
          single?.field || l.field || (l.action?.startsWith('Alterou ') ? l.action.slice(8) : '—');
        const projectName =
          l.projectName || project?.name || (l.project ? l.where || l.project : '—');
        const at = new Date(l.at);
        const recovery = l.recovered
          ? '<span>Recuperado</span>'
          : l.eventId && l.recoverable && l.fieldId
            ? btn('Recuperar', `requestAuditRecovery('${esc(l.eventId)}')`, 'history')
            : '<span title="Este registro não possui identificação segura da obra e do campo para recuperação automática.">Indisponível</span>';
        return `<tr><td>${esc(Number.isNaN(at.getTime()) ? '—' : at.toLocaleString('pt-BR'))}</td><td>${esc(l.who || 'Não informado')}</td><td><button type="button" class="textbtn audit-action" onclick="openAuditDetails(${auditIndex})">${esc(l.action || '—')}</button>${l.recoveredFrom ? `<div class="desc">Recuperação do registro ${esc(l.recoveredFrom)}</div>` : ''}</td><td>${esc(projectName)}${l.recordName ? `<div class="desc">${esc(l.recordName)}</div>` : ''}</td><td>${esc(multiple ? '—' : field)}</td><td>${esc(multiple ? '—' : single ? auditValue(single.before) : auditObraValue(l, l.before))}</td><td>${esc(multiple ? '—' : single ? auditValue(single.after) : auditObraValue(l, l.after))}</td><td class="audit-reason">${esc(auditReason(l))}</td><td>${recovery}</td></tr>`;
      })
      .join(
        ''
      )}</tbody></table></div>${logs.length ? '' : empty('Nenhuma alteração neste período', 'Escolha outro intervalo ou consulte o histórico arquivado.')}<div class="audit-pagination"><button class="btn" ${auditLoading || auditPage === 0 ? 'disabled' : ''} onclick="changeAuditPage(-1)">← Anterior</button><span>Página ${auditPage + 1}</span><button class="btn" ${auditLoading || !auditHasMore ? 'disabled' : ''} onclick="changeAuditPage(1)">Próxima →</button></div></section>`
  );
}

function profile() {
  const u = me();
  return (
    head('SUA CONTA', 'Meu perfil', 'Informações do administrador.') +
    `<section class="panel"><div class="panelhead"><h2>Informações pessoais</h2></div><form onsubmit="event.preventDefault();saveProfile(this)"><div class="panelbody"><div class="field"><label>Nome completo</label><input name="name" value="${esc(
      u.name
    )}" required></div><div class="field"><label>E-mail</label><input value="${esc(
      window.SECAP_EMAIL || u.email
    )}" disabled></div>${btn(
      'Salvar informações',
      'this.form.requestSubmit()',
      'check',
      'primary'
    )}</div></form></section>`
  );
}

function switchProfile() {
  return false;
}

let profileSaving = false;
async function saveProfile(form) {
  if (profileSaving || !me()) return;
  const name = String(new FormData(form).get('name') || '').trim();
  if (!name || name.length > 120)
    return notify('Informe seu nome com até 120 caracteres.', 'error');
  const button = form.querySelector('button');
  profileSaving = true;
  if (button) button.disabled = true;
  try {
    if (!window.sb) throw new Error('Conexão ao servidor indisponível.');
    const result = await window.sb.rpc('secap_update_my_name', { new_name: name });
    if (result.error) throw result.error;
    if (result.data?.name !== name) throw new Error('O servidor não confirmou seu nome.');
    const old = me().name;
    me().name = name;
    window.SECAP_PROFILE_NAME = name;
    if (window.SECAP_MEMBER) window.SECAP_MEMBER.name = name;
    await persist('Atualizou o perfil', 'Meu perfil', old, name);
    auditLoaded = false;
    render();
    notify('Nome salvo na sua conta e atualizado na auditoria.', 'success');
  } catch (error) {
    notify('Não foi possível salvar seu nome: ' + String(error?.message || error), 'error');
  } finally {
    profileSaving = false;
    if (button) button.disabled = false;
  }
}

function admin() {
  if (!isSysAdmin())
    return empty('Acesso restrito', 'Somente o administrador pode aprovar ou recusar acessos.');
  return (
    head(
      'ADMINISTRAÇÃO',
      'Administração',
      'Aprove ou recuse o acesso ao sistema de quem se cadastrou no SECAP.'
    ) +
    `<section class="panel access-panel"><div class="panelhead"><h2>Acesso ao sistema</h2><button class="btn" type="button" onclick="loadAccountRequests()">${icon('history')} Atualizar</button></div><div class="panelbody" id="accountRequests"><p class="subtitle">Consultando os cadastros…</p></div></section>`
  );
}

let accountRequestsCache = [];
let accountRequestsFilter = 'Pendente';
let accountRequestsSearch = '';

const accessNorm = (value) =>
  String(value || '')
    .trim()
    .toLocaleLowerCase('pt-BR');
const accessPending = () =>
  (Array.isArray(accountRequestsCache) ? accountRequestsCache : []).filter(
    (item) => accessNorm(item.status) === 'pendente'
  ).length;

function updateAccessNavBadge() {
  const button = document.querySelector('.sidebar .nav[onclick="go(\'admin\')"]');
  if (!button) return;
  button.querySelector('em')?.remove();
  const total = accessPending();
  if (total) button.insertAdjacentHTML('beforeend', `<em>${total}</em>`);
}

// Seletor "Somente visualizar / Visualizar e editar" das obras de cada usuário aprovado.
function obrasAccessControl(item) {
  const id = Number(item.id);
  const current = item.obras_access === 'editar' ? 'editar' : 'visualizar';
  const option = (value, label) =>
    `<option value="${value}" ${current === value ? 'selected' : ''}>${label}</option>`;
  return `<label class="access-perm ${current === 'editar' ? 'is-edit' : 'is-view'}">
    <small>Acesso às obras</small>
    <select data-request="${id}" aria-label="Acesso às obras de ${esc(item.name || item.email || 'usuário')}" onchange="setObrasAccess(${id}, this.value)">
      ${option('visualizar', 'Somente visualizar')}${option('editar', 'Visualizar e editar')}
    </select>
  </label>`;
}

// Botão de promover/rebaixar. A própria conta não pode se alterar (o banco também recusa).
function roleControl(item) {
  const id = Number(item.id);
  const mine =
    String(item.email || '').toLowerCase() === String(window.SECAP_EMAIL || '').toLowerCase();
  if (item.profile_role === 'administrador') {
    return mine
      ? '<span class="role-note">Sua conta</span>'
      : `<button type="button" class="btn sm role-btn is-demote" onclick="openUserRole(${id}, 'usuario')">Remover administração</button>`;
  }
  return `<button type="button" class="btn sm role-btn is-promote" onclick="openUserRole(${id}, 'administrador')">Tornar administrador</button>`;
}

function renderAccountRequests() {
  const root = document.getElementById('accountRequests');
  if (!root) return;

  const requests = Array.isArray(accountRequestsCache) ? accountRequestsCache : [];
  const counts = requests.reduce(
    (acc, item) => {
      const status = accessNorm(item.status);
      if (status === 'pendente') acc.pending += 1;
      else if (status === 'aprovada') acc.approved += 1;
      else if (status === 'recusada') acc.rejected += 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 }
  );
  updateAccessNavBadge();

  const query = accessNorm(accountRequestsSearch);
  const filtered = requests.filter((item) => {
    const status = accessNorm(item.status);
    const matchesStatus =
      accountRequestsFilter === 'Todas' || status === accessNorm(accountRequestsFilter);
    const haystack = [item.name, item.email, item.job_title].map(accessNorm).join(' ');
    return matchesStatus && (!query || haystack.includes(query));
  });

  const approvedUsers = requests.filter(
    (item) => accessNorm(item.status) === 'aprovada' && item.profile_role === 'usuario'
  );
  const canEditCount = approvedUsers.filter((item) => item.obras_access === 'editar').length;
  const adminCount = requests.filter(
    (item) => accessNorm(item.status) === 'aprovada' && item.profile_role === 'administrador'
  ).length;
  const approvedSummary =
    (approvedUsers.length
      ? `${canEditCount} editam · ${approvedUsers.length - canEditCount} só visualizam`
      : 'Acesso aprovado') + (adminCount ? ` · ${adminCount} administrador(es)` : '');

  const dateLabel = (value) => {
    if (!value) return '—';
    // SQLite local guarda epoch em segundos; Supabase devolve timestamp ISO.
    const numeric = typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value));
    const date = new Date(numeric ? Number(value) * (Number(value) < 1e12 ? 1000 : 1) : value);
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  const filters = [
    ['Pendente', 'Aguardando', counts.pending],
    ['Aprovada', 'Aprovados', counts.approved],
    ['Recusada', 'Recusados', counts.rejected],
    ['Todas', 'Todos', requests.length],
  ];
  const filterButton = ([key, label, count]) => {
    const active = accountRequestsFilter === key;
    return `<button type="button" class="access-filter ${active ? 'active' : ''}" aria-pressed="${active}" onclick="setAccountRequestsFilter('${key}')">${label}<span>${count}</span></button>`;
  };

  const rows = filtered
    .map((item) => {
      const status = accessNorm(item.status);
      const pending = status === 'pendente';
      const cls =
        status === 'aprovada' ? 'approved' : status === 'recusada' ? 'rejected' : 'pending';
      const label =
        status === 'aprovada' ? 'Aprovado' : status === 'recusada' ? 'Recusado' : 'Aguardando';
      const initials = String(item.name || '?')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] || '')
        .join('')
        .toUpperCase();
      return `<article class="access-request ${pending ? 'is-pending' : ''}">
      <div class="access-avatar" aria-hidden="true">${esc(initials || '?')}</div>
      <div class="access-person"><strong>${esc(item.name || 'Nome não informado')}</strong><span>${esc(item.email || 'E-mail não informado')}</span></div>
      <div class="access-role"><small>Cargo</small><span>${esc(item.job_title || 'Não informado')}</span></div>
      <div class="access-date"><small>Cadastro em</small><span>${dateLabel(item.created_at)}</span></div>
      <div><span class="access-status ${cls}">${label}</span></div>
      <div class="access-actions">${
        pending
          ? `<button type="button" class="btn primary sm" onclick="handleAccountRequestAction(${Number(item.id)}, 'approve')">Aprovar</button><button type="button" class="btn danger sm" onclick="handleAccountRequestAction(${Number(item.id)}, 'reject')">Recusar</button>`
          : status === 'aprovada' && item.profile_role === 'usuario'
            ? `<div class="access-controls-pair">${obrasAccessControl(item)}${projectAccessControl(item)}${roleControl(item)}</div>`
            : status === 'aprovada' && item.profile_role === 'administrador'
              ? `<div class="access-controls-pair"><span class="role-badge">Administrador</span>${roleControl(item)}</div>`
              : ''
      }</div>
    </article>`;
    })
    .join('');

  const emptyText = requests.length
    ? ['Nenhum cadastro neste filtro', 'Altere o filtro ou a busca para ver outras pessoas.']
    : [
        'Nenhum cadastro por enquanto',
        'Quando alguém se cadastrar na tela de login, aparecerá aqui para você decidir o acesso.',
      ];

  root.innerHTML = `
    <div class="access-summary">
      <div class="access-summary-card"><span>Aguardando decisão</span><strong class="pending">${counts.pending}</strong><small>Precisam da sua análise</small></div>
      <div class="access-summary-card"><span>Aprovados</span><strong class="approved">${counts.approved}</strong><small>${approvedSummary}</small></div>
      <div class="access-summary-card"><span>Recusados</span><strong class="rejected">${counts.rejected}</strong><small>Acesso recusado</small></div>
    </div>
    <div class="access-toolbar">
      <div class="access-filters" role="group" aria-label="Filtrar por situação">${filters.map(filterButton).join('')}</div>
      <label class="access-search"><span class="sr-only">Buscar pessoa</span>
        <input type="search" value="${esc(accountRequestsSearch)}" placeholder="Buscar por nome, e-mail ou cargo" oninput="setAccountRequestsSearch(this.value)">
      </label>
    </div>
    ${
      filtered.length
        ? `<div class="access-request-list">${rows}</div>`
        : `<div class="access-empty"><div class="access-empty-icon">${icon('user')}</div><strong>${emptyText[0]}</strong><p>${emptyText[1]}</p></div>`
    }`;
}

function setAccountRequestsFilter(filter) {
  accountRequestsFilter = ['Pendente', 'Aprovada', 'Recusada', 'Todas'].includes(filter)
    ? filter
    : 'Pendente';
  renderAccountRequests();
}

function setAccountRequestsSearch(value) {
  accountRequestsSearch = String(value || '');
  renderAccountRequests();
  const input = document.querySelector('#accountRequests .access-search input');
  if (input) {
    input.focus();
    input.setSelectionRange(accountRequestsSearch.length, accountRequestsSearch.length);
  }
}

async function loadAccountRequests() {
  const root = document.getElementById('accountRequests');
  if (!root) return;
  root.innerHTML =
    '<div class="access-loading"><span class="spinner"></span><span>Consultando os cadastros…</span></div>';
  try {
    const response = await fetch('/api/account-requests', {
      headers: { Accept: 'application/json' },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Não foi possível consultar os cadastros.');
    accountRequestsCache = Array.isArray(result.requests) ? result.requests : [];
    renderAccountRequests();
  } catch (error) {
    root.innerHTML = `<div class="access-error"><strong>Não foi possível carregar os cadastros.</strong><p>${esc(error.message || 'Verifique sua conexão e tente novamente.')}</p><button class="btn" type="button" onclick="loadAccountRequests()">Tentar novamente</button></div>`;
  }
}
window.loadAccountRequests = loadAccountRequests;

function page() {
  return {
    dashboard,
    projects,
    kanban,
    bi,
    calendar,
    terms,
    notes,
    history,
    profile,
    admin,
  }[tab]();
}

function empty(t, p) {
  return `<div class="empty">${icon('folder')}<h3>${t}</h3><p>${p}</p></div>`;
}

function modal(title, body, footer = '') {
  const root = $('#modal');
  root.innerHTML = `<div class="overlay" onclick="if(event.target===this)closeModal()"><section class="dialog" role="dialog" aria-modal="true" aria-label="${esc(
    title
  )}"><div class="dialoghead"><h2>${title}</h2><button class="iconbtn" aria-label="Fechar" onclick="closeModal()">${icon(
    'close'
  )}</button></div><div class="dialogbody">${body}</div>${
    footer ? `<div class="dialogfoot">${footer}</div>` : ''
  }</section></div>`;
  root.querySelector('input,textarea,select,button')?.focus();
}

function closeModal() {
  $('#modal').innerHTML = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

function editProject(id = '') {
  const p = db.projects.find((p) => p.id === id);
  if ((p && !canEdit(p)) || (!p && !canManage())) return;

  const isExternal = Boolean(p?.externalUrl);
  modal(
    p ? 'Editar projeto' : 'Criar um novo projeto',
    `<form id="projectForm" onsubmit="event.preventDefault();saveProject('${id}')">
      <div class="field">
        <label>Tipo de projeto *</label>
        <select name="projectMode" id="projectMode" onchange="toggleProjectMode()" required>
          <option value="internal" ${!isExternal ? 'selected' : ''}>Projeto interno — gerenciar obras no SECAP</option>
          <option value="external" ${isExternal ? 'selected' : ''}>Sistema externo — acessar por link</option>
        </select>
        <small>Use projeto interno para cadastrar obras no portal ou sistema externo para acessar outra aplicação.</small>
      </div>
      <div class="field">
        <label>Nome do projeto *</label>
        <input name="name" required placeholder="Ex.: Revitalização de praças" value="${esc(p?.name || '')}">
      </div>
      <div class="field">
        <label>Descrição</label>
        <textarea name="description" rows="3" placeholder="Qual é o objetivo deste projeto?">${esc(p?.description || '')}</textarea>
      </div>
      <div class="field" id="externalUrlField" style="display:${isExternal ? 'block' : 'none'}">
        <label>Link do sistema externo *</label>
        <input name="externalUrl" type="url" placeholder="https://sistema.exemplo.gov.br" value="${esc(p?.externalUrl || '')}" ${isExternal ? 'required' : ''}>
        <small>O sistema será aberto em uma nova aba. Informe o endereço completo, começando com https:// ou http://.</small>
      </div>
      <div id="internalProjectFields" style="display:${isExternal ? 'none' : 'block'}">
        <div class="twocol">
          <div class="field">
            <label>Responsável *</label>
            <input name="owner" ${!isExternal ? 'required' : ''} value="${esc(p?.owner || me().name)}">
          </div>
          <div class="field">
            <label>Cor de identificação</label>
            <input name="color" type="color" value="${p?.color || '#003856'}" style="height:40px">
          </div>
        </div>
        ${
          !p || !isExternal
            ? `<div class="field" id="templateField">
          <label>Começar com um modelo</label>
          <select name="template">
            <option value="base">Projeto e obras — campos essenciais</option>
            <option value="term">Termo de compromisso</option>
            <option value="blank">Em branco — apenas nome do registro</option>
          </select>
          <small>Depois você pode adicionar ou ajustar quantos campos precisar.</small>
        </div>`
            : ''
        }
      </div>
    </form>`,
    (p && canManage() ? btn('Excluir projeto', `deleteProject('${p.id}')`, 'trash') : '') +
      (p && !isExternal
        ? btn('Personalizar campos', `closeModal();editFields('${p.id}')`, 'edit')
        : '') +
      btn('Cancelar', 'closeModal()', 'close') +
      `<button class="btn primary" form="projectForm" type="submit">${icon('check')} ${p ? 'Salvar alterações' : 'Criar projeto'}</button>`
  );
}

function toggleProjectMode() {
  const form = $('#projectForm');
  if (!form) return;
  const external = form.elements.projectMode.value === 'external';
  $('#externalUrlField').style.display = external ? 'block' : 'none';
  $('#internalProjectFields').style.display = external ? 'none' : 'block';
  form.elements.externalUrl.required = external;
  form.elements.owner.required = !external;
}

function externalHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (_) {
    return url;
  }
}

function openProject(id) {
  const p = db.projects.find((item) => item.id === id);
  if (!p) return;
  if (p.externalUrl) {
    let target;
    try {
      target = new URL(p.externalUrl);
    } catch (_) {
      notify('O link deste sistema externo é inválido.');
      return;
    }
    if (!['http:', 'https:'].includes(target.protocol)) {
      notify('O link deve começar com http:// ou https://.');
      return;
    }
    window.open(target.href, '_blank', 'noopener,noreferrer');
    return;
  }
  go('projects', id);
}
function deleteProject(pid) {
  const p = db.projects.find((p) => p.id === pid);
  if (!p || !canManage()) return;

  modal(
    'Excluir este projeto?',
    `<p>O projeto <strong>${esc(
      p.name
    )}</strong> e todas as suas <strong>${p.records.length} obra(s) vinculada(s)</strong> serão removidos permanentemente do portal.</p>`,
    btn('Cancelar', `editProject('${pid}')`, 'close') +
      btn('Confirmar exclusão', `confirmDeleteProject('${pid}')`, 'trash', 'primary')
  );
}
async function confirmDeleteProject(pid) {
  const p = db.projects.find((p) => p.id === pid);
  if (!p || !canManage()) return;

  // Primeiro o banco (obras e planilhas do projeto); se recusar, o projeto permanece.
  if (window.SECAP_OBRAS_BACKEND) {
    const result = await window.SECAP_OBRAS_BACKEND.deleteProjectObras(pid);
    if (!result.ok) {
      closeModal();
      notify(`Não foi possível excluir as obras do projeto: ${result.error}`);
      return;
    }
  }

  db.projects = db.projects.filter((x) => x.id !== pid);

  // Limpa também a seleção se o usuário estiver dentro da pasta excluída
  if (projectId === pid) {
    projectId = '';
  }

  persist('Excluiu projeto', p, p.name, 'Removido');
  closeModal();
  go('projects');
  notify('Projeto excluído com sucesso.');
}

function saveProject(id) {
  const form = $('#projectForm');
  const f = new FormData(form);
  const p = db.projects.find((p) => p.id === id);
  const name = String(f.get('name') || '').trim();
  if (!name) return;

  const mode = f.get('projectMode') || 'internal';
  const description = String(f.get('description') || '').trim();

  if (mode === 'external') {
    const rawUrl = String(f.get('externalUrl') || '').trim();
    let externalUrl;
    try {
      const parsed = new URL(rawUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Protocolo inválido');
      externalUrl = parsed.href;
    } catch (_) {
      notify('Informe um link válido, iniciado por https:// ou http://.');
      form.elements.externalUrl.focus();
      return;
    }

    const values = {
      name,
      description,
      externalUrl,
      owner: String(f.get('owner') || '').trim(),
      color: String(f.get('color') || '#003856'),
      isExternal: true,
      fields: p?.fields || [],
      records: p?.records || [],
    };
    if (p) {
      const before = p.name;
      Object.assign(p, values);
      persist('Editou projeto externo', p, before, name);
    } else {
      const np = { id: uid(), ...values, fields: [], records: [] };
      db.projects.push(np);
      persist('Criou projeto externo', np, '', name);
    }
  } else {
    const values = {
      name,
      description,
      owner: String(f.get('owner') || '').trim(),
      color: String(f.get('color') || '#003856'),
      externalUrl: '',
      isExternal: false,
    };
    if (p) {
      const before = p.name;
      if (p.externalUrl && (!Array.isArray(p.fields) || !p.fields.length)) p.fields = baseFields();
      Object.assign(p, values);
      persist('Editou projeto', p, before, name);
    } else {
      const fields = f.get('template') === 'blank' ? [baseFields()[0]] : baseFields();
      if (f.get('template') === 'term')
        fields.push(
          { id: 'instrumento', name: 'Número do termo', type: 'text' },
          { id: 'parceiro', name: 'Instituição parceira', type: 'text' }
        );
      const np = { id: uid(), ...values, fields, records: [] };
      db.projects.push(np);
      persist('Criou projeto', np, '', name);
    }
  }
  closeModal();
  render();
  notify(
    mode === 'external'
      ? 'Sistema externo cadastrado com sucesso.'
      : 'Projeto salvo. Os painéis já estão conectados.'
  );
}

const typeNames = {
  text: 'Texto curto',
  long: 'Texto longo',
  number: 'Número',
  currency: 'Valor em R$',
  date: 'Data',
  select: 'Lista de opções',
  boolean: 'Sim / Não',
  link: 'Link',
  responsible: 'Responsável',
};

function editFields(pid) {
  if (!isSysAdmin()) {
    notify('Apenas administradores podem personalizar os campos do projeto.', 'error');
    return;
  }
  const p = db.projects.find((p) => p.id === pid);
  if (!canEdit(p)) return;
  modal(
    'Personalizar campos',
    `<p class="subtitle">${esc(
      p.name
    )} · Os campos definem as informações de cada obra.</p><div style="margin:15px 0">${p.fields
      .map(
        (f) =>
          `<div class="fieldrow"><span><b>${esc(f.name)}</b><br><small>${
            typeNames[f.type]
          }${f.required ? ' · Obrigatório' : ''}${
            f.type === 'date' ? ' · Conectado ao calendário' : ''
          }</small></span><button class="iconbtn" aria-label="Editar campo" onclick="fieldForm('${pid}','${
            f.id
          }')">${icon('edit')}</button>${
            ![
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
            ].includes(f.id)
              ? `<button class="iconbtn" aria-label="Excluir campo" onclick="removeField('${pid}','${f.id}')">${icon(
                  'trash'
                )}</button>`
              : ''
          }</div>`
      )
      .join('')}</div>`,
    btn('Adicionar campo', `fieldForm('${pid}')`, 'plus', 'primary') +
      btn('Concluir', 'closeModal()', 'check')
  );
}

function fieldForm(pid, fid = '') {
  if (!isSysAdmin()) {
    notify('Apenas administradores podem personalizar os campos do projeto.', 'error');
    return;
  }
  const p = db.projects.find((p) => p.id === pid),
    f = p.fields.find((f) => f.id === fid);
  modal(
    f ? 'Editar campo' : 'Adicionar campo',
    `<form id="fieldForm" onsubmit="event.preventDefault();saveField('${pid}','${fid}')"><div class="field"><label>Nome do campo *</label><input required name="name" value="${esc(
      f?.name || ''
    )}" placeholder="Ex.: Região, vistoria ou valor do convênio"></div><div class="field"><label>Tipo de informação</label><select name="type" ${
      f ? 'disabled' : ''
    } onchange="$('#optionsArea').style.display=this.value==='select'?'block':'none'">${Object.entries(
      typeNames
    )
      .map(([k, v]) => `<option value="${k}" ${f?.type === k ? 'selected' : ''}>${v}</option>`)
      .join('')}</select></div><div class="field" id="optionsArea" style="display:${
      f?.type === 'select' ? 'block' : 'none'
    }"><label>Opções da lista (separadas por vírgula)</label><textarea name="options" rows="3" placeholder="Planejamento, Execução, Concluído">${esc(
      f?.options?.join(', ') || ''
    )}</textarea><small>As listas ficam disponíveis para agrupar o Kanban automaticamente.</small></div><div class="field"><label>Ajuda para quem preenche</label><input name="help" value="${esc(
      f?.help || ''
    )}" placeholder="Explique de forma simples o que informar aqui."></div><label><input name="required" type="checkbox" ${
      f?.required ? 'checked' : ''
    }> Preenchimento obrigatório</label></form>`,
    btn('Voltar', `editFields('${pid}')`, 'arrow') +
      `<button class="btn primary" type="submit" form="fieldForm">Salvar campo</button>`
  );
}

function saveField(pid, fid) {
  if (!isSysAdmin()) {
    notify('Apenas administradores podem personalizar os campos do projeto.', 'error');
    return;
  }
  const p = db.projects.find((p) => p.id === pid);
  if (!canEdit(p)) return;
  const data = new FormData($('#fieldForm')),
    old = p.fields.find((f) => f.id === fid),
    type = old?.type || data.get('type'),
    options = [
      ...new Set(
        String(data.get('options') || '')
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
      ),
    ];
  if (type === 'select' && !options.length) return notify('Adicione pelo menos uma opção à lista.');
  const f = {
    id: fid || 'f_' + uid(),
    name: data.get('name').trim(),
    type,
    options: type === 'select' ? options : undefined,
    help: data.get('help'),
    required: data.has('required'),
  };
  if (!f.name) return;
  const before = old?.name || '';
  if (old) Object.assign(old, f);
  else p.fields.push(f);
  persist('Personalizou campo', p, before, f.name, f.name);
  editFields(pid);
  render();
  notify('Campo salvo e conectado às obras.');
}

function removeField(pid, fid) {
  if (!isSysAdmin()) {
    notify('Apenas administradores podem personalizar os campos do projeto.', 'error');
    return;
  }
  const p = db.projects.find((p) => p.id === pid);
  if (!canEdit(p)) return;
  modal(
    'Excluir campo?',
    `<p>Os valores preenchidos neste campo também serão removidos dos registros do projeto.</p>`,
    btn('Cancelar', `editFields('${pid}')`, 'close') +
      btn('Excluir campo', `confirmRemoveField('${pid}','${fid}')`, 'trash', 'primary')
  );
}

function confirmRemoveField(pid, fid) {
  const p = db.projects.find((p) => p.id === pid);
  if (!canEdit(p)) return;
  const f = p.fields.find((f) => f.id === fid);
  p.fields = p.fields.filter((f) => f.id !== fid);
  p.records.forEach((r) => delete r[fid]);
  persist('Removeu campo', p, f.name, 'Removido', f.name);
  editFields(pid);
  render();
}

function inputField(f, value, disabled) {
  const currentValue = value === null || value === undefined ? '' : String(value);
  const attrs = `aria-label="${esc(f.name)}" name="${f.id}" data-original-value="${esc(currentValue)}" ${f.required ? 'required' : ''} ${disabled ? 'disabled' : ''}`;
  let input;

  if (f.type === 'long') {
    input = `<textarea ${attrs} rows="3">${esc(currentValue)}</textarea>`;
  } else if (f.type === 'select') {
    const options = Array.isArray(f.options) ? [...f.options] : [];
    if (currentValue !== '' && !options.some((option) => String(option) === currentValue))
      options.unshift(currentValue);
    input = `<select ${attrs}><option value="">Selecione...</option>${options
      .map(
        (option) =>
          `<option value="${esc(option)}" ${currentValue === String(option) ? 'selected' : ''}>${esc(option)}</option>`
      )
      .join('')}</select>`;
  } else if (f.type === 'boolean') {
    input = `<select ${attrs}><option value="">Selecione...</option>${currentValue && !['Sim', 'Não'].includes(currentValue) ? `<option value="${esc(currentValue)}" selected>${esc(currentValue)}</option>` : ''}<option value="Sim" ${currentValue === 'Sim' ? 'selected' : ''}>Sim</option><option value="Não" ${currentValue === 'Não' ? 'selected' : ''}>Não</option></select>`;
  } else if (f.type === 'currency') {
    // Campo visível em R$ (1.519.076,06); o campo escondido com o mesmo nome guarda o número
    // puro (1519076.06), que é o que a gravação e a detecção de alterações leem.
    const shown = currencyInputText(currentValue);
    input = `<div class="currency-field"><span class="currency-prefix" aria-hidden="true">R$</span><input type="text" class="currency-input" inputmode="decimal" autocomplete="off" aria-label="${esc(f.name)}" data-currency-for="${esc(f.id)}" value="${esc(shown)}" placeholder="0,00" ${f.required ? 'required' : ''} ${disabled ? 'disabled' : ''}></div><input type="hidden" name="${f.id}" data-original-value="${esc(currentValue)}" value="${esc(currentValue)}" ${disabled ? 'disabled' : ''}>`;
  } else {
    const inputType =
      { date: 'date', number: 'number', currency: 'number', link: 'url' }[f.type] || 'text';
    const numeric = ['number', 'currency'].includes(f.type);
    input = `<input ${attrs} type="${inputType}" ${numeric ? 'step="any" inputmode="decimal"' : ''} ${f.id === 'progresso' ? 'min="0" max="100"' : ''} value="${esc(currentValue)}">`;
  }

  const help = f.help
    ? `<small>${esc(f.help)}</small>`
    : f.type === 'date'
      ? '<small>Aparece automaticamente no calendário.</small>'
      : f.type === 'currency'
        ? '<small>Digite só os números: os centavos entram primeiro (ex.: 125050 = 1.250,50).</small>'
        : '';
  return `<div class="field"><label>${esc(f.name)}${f.required ? ' *' : ''}</label>${input}${help}</div>`;
}

// ---- Campos em R$ -------------------------------------------------------------
// Número puro (1519076.06 ou "1519076,06") -> texto "1.519.076,06". Vazio continua vazio;
// texto que não é número é mostrado como está (dado antigo da planilha, por exemplo).
function currencyInputText(raw) {
  if (raw === '' || raw == null) return '';
  const n = parseCurrencyInput(String(raw));
  return n === null
    ? String(raw)
    : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
// Texto digitado -> número (ou null se não der para entender). Aceita "1.519.076,06",
// "1519076,06", "1519076.06", "R$ 1.519.076" e "-200,00".
function parseCurrencyInput(text) {
  let s = String(text ?? '').replace(/R\$|\s| /g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); // só pontos de milhar
  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function currencyHiddenFor(el) {
  const form = el.form || el.closest('form') || document;
  return [...form.querySelectorAll('input[type="hidden"]')].find((h) => h.name === el.dataset.currencyFor);
}
// Máscara de valor, como em app de banco: ao digitar, os números entram pelos centavos
// (1 → 0,01 · 12 → 0,12 · 12212 → 122,12 · 1221200 → 12.212,00). Apagar tira o último dígito.
// Colar (ou preencher automaticamente) um valor pronto, como "1.519.076,06" ou "2500", mantém
// o valor colado. Um "-" em qualquer posição deixa o valor negativo.
const CURRENCY_MAX_DIGITS = 15;
function currencyFormat(n) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function currencyMaskValue(text) {
  const digits = String(text ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, CURRENCY_MAX_DIGITS);
  if (!digits || /^0*$/.test(digits)) return digits ? 0 : null;
  const n = Number(digits) / 100;
  return String(text).includes('-') ? -n : n;
}
document.addEventListener('input', (e) => {
  const el = e.target;
  if (!el.matches?.('.currency-input') || el.readOnly) return;
  const hidden = currencyHiddenFor(el);
  if (!hidden) return;
  const typed = typeof e.inputType === 'string' && !['insertFromPaste', 'insertFromDrop', 'insertReplacementText'].includes(e.inputType);
  let n = typed ? undefined : parseCurrencyInput(el.value);
  if (n === undefined || n === null) n = currencyMaskValue(el.value);
  el.value = n === null ? '' : currencyFormat(n);
  if (document.activeElement === el) el.setSelectionRange(el.value.length, el.value.length);
  el.setAttribute('aria-invalid', 'false');
  el.setCustomValidity('');
  // Sem alteração real, mantém o texto original (evita marcar "alterado" à toa).
  const original = hidden.dataset.originalValue ?? '';
  const same = n === null ? original === '' : original !== '' && parseCurrencyInput(original) === n;
  hidden.value = same ? original : n === null ? '' : String(n);
  hidden.dispatchEvent(new Event('input', { bubbles: true }));
  hidden.dispatchEvent(new Event('change', { bubbles: true }));
});
document.addEventListener(
  'blur',
  (e) => {
    const el = e.target;
    if (!el.matches?.('.currency-input') || el.getAttribute('aria-invalid') === 'true') return;
    const n = parseCurrencyInput(el.value);
    if (n !== null) el.value = n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  true
);

// Abre os detalhes da obra em modo tela cheia real
function editRecord(pid, rid = '') {
  const p = visible().find((p) => p.id === pid);
  if (!p) return;

  const r = p.records.find((r) => r.id === rid);
  const edit = canEdit(p);

  // Se for uma nova obra, abre a janela de formulário
  if (!r) {
    openRecordForm(pid, rid);
    return;
  }

  // Remove qualquer painel de detalhes anterior se existir
  const existingView = document.getElementById('fullscreenDetailView');
  if (existingView) existingView.remove();

  const fields = p.fields;

  // Cria a camada de tela cheia anexada diretamente ao body
  const detailContainer = document.createElement('div');
  detailContainer.id = 'fullscreenDetailView';
  detailContainer.className = 'fullscreen-detail-page';

  detailContainer.innerHTML = `
    <header class="fullscreen-header">
      <div style="display:flex; align-items:center; gap:16px;">
        <button class="btn" onclick="closeFullscreenDetail()">${icon('arrow')} Voltar às obras</button>
        <div>
          <span class="eyebrow">${esc(p.name)}</span>
          <h1 class="obra-detail-title" title="${esc(r.nome || 'Registro')}">${esc(r.nome || 'Registro')}</h1>
        </div>
      </div>
      <div class="actions" style="display:flex; gap:10px;">
        ${edit ? `<button class="btn primary" onclick="closeFullscreenDetail(); openRecordForm('${pid}','${rid}')">${icon('edit')} Editar dados</button>` : ''}
        <button class="iconbtn" onclick="closeFullscreenDetail()" title="Fechar">${icon('close')}</button>
      </div>
    </header>

    <div class="fullscreen-content">
      <!-- Indicadores principais -->
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

      <!-- Ficha de dados detalhados -->
      <h2 style="font-size: 16px; color: #334155; margin-bottom: 16px;">Ficha completa da obra</h2>
      <div class="detail-grid">
        ${fields
          .map((f) => {
            const val = r[f.id];
            let displayVal = esc(val ?? '—');
            if (f.type === 'date') displayVal = date(val);
            if (f.type === 'currency') displayVal = val !== '' && val != null ? money(val) : '—';

            return `
            <div class="detail-card">
              <label>${esc(f.name)}</label>
              <div class="val">${displayVal || '—'}</div>
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
  `;

  document.body.appendChild(detailContainer);
}

// Fecha a tela cheia de detalhes
function closeFullscreenDetail() {
  const el = document.getElementById('fullscreenDetailView');
  if (el) el.remove();
}

function saveRecord(pid, rid) {
  const p = db.projects.find((p) => p.id === pid);
  if (!canEdit(p)) return;

  const allowed =
    typeof getAllowedFieldsForCurrentUser === 'function'
      ? getAllowedFieldsForCurrentUser(p.id)
      : isSysAdmin()
        ? null
        : [];

  if (allowed !== null && (!Array.isArray(allowed) || allowed.length === 0)) {
    return notify('Você não possui campos liberados para edição neste projeto.');
  }

  const data = new FormData($('#recordForm')),
    r = p.records.find((r) => r.id === rid),
    values = {};

  for (const f of p.fields) {
    const isFieldAllowed = allowed === null || allowed.includes(f.id);

    // Se o campo estiver bloqueado para este usuário:
    // - Na edição (r existe), preserva o valor original do banco (evita apagar dado de input disabled ou burlado)
    // - Na criação de novo registro, grava vazio
    if (!isFieldAllowed) {
      values[f.id] = r ? (r[f.id] ?? '') : '';
      continue;
    }

    const value = data.get(f.id);
    values[f.id] = ['currency', 'number'].includes(f.type)
      ? value === '' || value === null
        ? ''
        : Number(value)
      : String(value || '').trim();
  }

  if (!p.fields.some((f) => f.id === 'responsavel') && data.has('responsavel') && isSysAdmin())
    values.responsavel = String(data.get('responsavel') || '').trim();
  if (r) {
    const changes = [
      ...p.fields,
      ...(!p.fields.some((f) => f.id === 'responsavel') && Object.hasOwn(values, 'responsavel')
        ? [{ id: 'responsavel', name: 'Responsável' }]
        : []),
    ].filter(
      (f) =>
        (allowed === null || allowed.includes(f.id)) &&
        String(r[f.id] ?? '') !== String(values[f.id] ?? '')
    );

    changes.forEach((f) => {
      const old = r[f.id];
      r[f.id] = values[f.id];
      persist(`Alterou ${f.name}`, p, old, values[f.id], f.name, !!window.SECAP_OBRAS_BACKEND);
    });

    if (window.SECAP_OBRAS_BACKEND && changes.length > 0) {
      window.SECAP_OBRAS_BACKEND.saveObra(p.id, r);
    }
  } else {
    const newRecord = { id: uid(), ...values };
    p.records.push(newRecord);
    // Com o servidor ativo, a criação é registrada pela auditoria do banco (evita duplicar).
    persist('Cadastrou obra', p, '', values.nome, '', !!window.SECAP_OBRAS_BACKEND);
    if (window.SECAP_OBRAS_BACKEND) {
      window.SECAP_OBRAS_BACKEND.saveObra(p.id, newRecord);
    }
  }

  closeModal();
  render();
  notify('Obra salva. Calendário, Kanban e BI atualizados.');
}

function deleteRecord(pid, rid) {
  if (!memberFieldAllowed(pid))
    return notify('Você não possui campos liberados para editar este projeto.', 'error');
  modal(
    'Excluir esta obra?',
    `<p>A obra será removida do portal e de todos os painéis conectados.</p>`,
    btn('Cancelar', `editRecord('${pid}','${rid}')`, 'close') +
      btn('Confirmar exclusão', `confirmDeleteRecord('${pid}','${rid}')`, 'trash', 'primary')
  );
}

async function confirmDeleteRecord(pid, rid) {
  const p = db.projects.find((p) => p.id === pid);
  if (!p || !canEdit(p) || !memberFieldAllowed(pid)) return;
  const r = p.records.find((r) => r.id === rid);
  // Primeiro o banco: só tira a obra da tela se a exclusão realmente foi aceita.
  if (window.SECAP_OBRAS_BACKEND) {
    const result = await window.SECAP_OBRAS_BACKEND.deleteObra(rid);
    if (!result.ok) {
      closeModal();
      notify(`Não foi possível excluir a obra: ${result.error}`);
      return;
    }
  }
  p.records = p.records.filter((x) => x.id !== rid);
  persist('Excluiu obra', p, r?.nome || '', 'Removida', '', !!window.SECAP_OBRAS_BACKEND);
  closeModal();
  render();
  notify('Obra excluída.');
}

function editNote(id = '') {
  const n = db.notes.find((n) => n.id === id && n.user === session);
  modal(
    n ? 'Editar anotação' : 'Nova anotação',
    `<form id="noteForm" onsubmit="event.preventDefault();saveNote('${id}')"><div class="field"><label>Título *</label><input required name="title" value="${esc(
      n?.title || ''
    )}"></div><div class="field"><label>Anotação *</label><textarea required name="text" rows="8" placeholder="O que você quer registrar?">${esc(
      n?.text || ''
    )}</textarea></div></form>`,
    (n ? btn('Excluir', `deleteNote('${id}')`, 'trash') : '') +
      btn('Cancelar', 'closeModal()', 'close') +
      `<button class="btn primary" form="noteForm" type="submit">Salvar anotação</button>`
  );
}

function saveNote(id) {
  const data = new FormData($('#noteForm')),
    n = db.notes.find((n) => n.id === id && n.user === session),
    values = {
      title: data.get('title').trim(),
      text: data.get('text').trim(),
      at: new Date().toISOString(),
    };
  if (n) Object.assign(n, values);
  else db.notes.push({ id: uid(), user: session, ...values });
  persist();
  closeModal();
  render();
  notify('Anotação salva no seu perfil.');
}

function deleteNote(id) {
  db.notes = db.notes.filter((n) => !(n.id === id && n.user === session));
  persist();
  closeModal();
  render();
}

function editTerm(id = '') {
  const t = db.terms.find((t) => t.id === id),
    edit = canManage() || (t && canEdit(db.projects.find((p) => p.id === t.project)));
  if (!t && !edit) return;
  modal(
    t ? 'Detalhes do termo' : 'Cadastrar termo de compromisso',
    `<form id="termForm" onsubmit="event.preventDefault();saveTerm('${id}')"><div class="twocol">${inputField(
      { id: 'number', name: 'Número do termo', type: 'text', required: true },
      t?.number,
      !edit
    )}${inputField(
      { id: 'deadline', name: 'Fim da vigência', type: 'date' },
      t?.deadline,
      !edit
    )}</div>${inputField(
      { id: 'name', name: 'Objeto', type: 'text', required: true },
      t?.name,
      !edit
    )}<div class="field"><label>Projeto vinculado *</label><select name="project" required ${
      !edit ? 'disabled' : ''
    }>${visible()
      .filter((p) => !edit || canEdit(p))
      .map(
        (p) =>
          `<option value="${p.id}" ${t?.project === p.id ? 'selected' : ''}>${esc(p.name)}</option>`
      )
      .join('')}</select></div>${inputField(
      { id: 'partner', name: 'Instituição parceira', type: 'text' },
      t?.partner,
      !edit
    )}${inputField(
      { id: 'value', name: 'Valor do termo (R$)', type: 'currency' },
      t?.value,
      !edit
    )}${inputField(
      {
        id: 'status',
        name: 'Situação',
        type: 'select',
        options: ['Em formalização', 'Em acompanhamento', 'Prestação de contas', 'Concluído'],
      },
      t?.status || 'Em formalização',
      !edit
    )}${inputField(
      { id: 'next', name: 'Próxima providência', type: 'long' },
      t?.next,
      !edit
    )}</form>`,
    btn('Fechar', 'closeModal()', 'close') +
      (edit
        ? `<button class="btn primary" form="termForm" type="submit">Salvar termo</button>`
        : '')
  );
}

function saveTerm(id) {
  const d = new FormData($('#termForm')),
    p = db.projects.find((p) => p.id === d.get('project'));
  if (!p || !canEdit(p)) return notify('Selecione um projeto com permissão de edição.');
  const old = db.terms.find((t) => t.id === id);
  if (old && !visible().some((p) => p.id === old.project)) return;
  const v = Object.fromEntries(d);
  v.value = Number(v.value) || 0;
  if (old) Object.assign(old, v);
  else db.terms.push({ id: uid(), ...v });
  persist(old ? 'Editou termo' : 'Criou termo', p, '', v.number);
  closeModal();
  render();
  notify('Termo vinculado ao projeto.');
}

function editUser(id = '') {
  if (me().role !== 'Administrador') return;
  const u = db.users.find((u) => u.id === id);
  modal(
    'Gerenciar usuário e permissões',
    `<form id="userForm" onsubmit="event.preventDefault();saveUser('${id}')"><div class="field"><label>Nome *</label><input required name="name" value="${esc(
      u?.name || ''
    )}"></div><div class="field"><label>E-mail *</label><input type="email" required name="email" value="${esc(
      u?.email || ''
    )}"></div><div class="twocol"><div class="field"><label>Perfil</label><select name="role" ${
      id === session ? 'disabled' : ''
    }>${['Administrador', 'Secretaria', 'Servidor']
      .map((r) => `<option ${u?.role === r ? 'selected' : ''}>${r}</option>`)
      .join('')}</select></div><div class="field"><label>Situação</label><select name="status" ${
      id === session ? 'disabled' : ''
    }>${['Pendente', 'Ativo', 'Recusado', 'Inativo']
      .map((s) => `<option ${u?.status === s ? 'selected' : ''}>${s}</option>`)
      .join(
        ''
      )}</select></div></div><label style="margin-bottom:14px">Projetos liberados (perfil Servidor)</label>${db.projects
      .map(
        (p) =>
          `<div class="permissions-row"><label>${esc(
            p.name
          )}</label><select name="permission_${p.id}" aria-label="Permissão em ${esc(p.name)}">${[
            ['none', 'Sem acesso'],
            ['read', 'Somente leitura'],
            ['edit', 'Leitura e edição'],
          ]
            .map(
              ([k, v]) =>
                `<option value="${k}" ${
                  (u?.permissions?.[p.id] ||
                    (u?.projects.includes(p.id) ? (u?.edit ? 'edit' : 'read') : 'none')) === k
                    ? 'selected'
                    : ''
                }>${v}</option>`
            )
            .join('')}</select></div>`
      )
      .join('')}<label style="margin-top:20px"><input name="edit" type="checkbox" ${
      u?.edit ? 'checked' : ''
    }> Permitir edição nos projetos liberados</label><label style="margin-top:22px">Abas liberadas</label><p class="subtitle">Meu perfil e Minhas anotações ficam disponíveis para todos.</p><div class="twocol" style="margin-top:12px">${navs
      .filter((n) => !['profile', 'notes', 'admin'].includes(n[0]))
      .map(
        ([id, n]) =>
          `<label style="font-weight:400"><input name="tabs" type="checkbox" value="${id}" ${
            u?.tabs.includes(id) ? 'checked' : ''
          }> ${n}</label>`
      )
      .join('')}</div></form>`,
    btn('Cancelar', 'closeModal()', 'close') +
      `<button class="btn primary" form="userForm" type="submit">Salvar permissões</button>`
  );
}

function saveUser(id) {
  if (me().role !== 'Administrador') return;
  const d = new FormData($('#userForm')),
    old = db.users.find((u) => u.id === id),
    v = {
      name: d.get('name').trim(),
      email: d.get('email').trim(),
      role: id === session ? old.role : d.get('role'),
      status: id === session ? old.status : d.get('status'),
      projects: db.projects.filter((p) => d.get('permission_' + p.id) !== 'none').map((p) => p.id),
      permissions: Object.fromEntries(db.projects.map((p) => [p.id, d.get('permission_' + p.id)])),
      edit: d.has('edit'),
      tabs: [...new Set([...d.getAll('tabs'), 'notes'])],
    };
  if (db.users.some((u) => u.email.toLowerCase() === v.email.toLowerCase() && u.id !== id))
    return notify('Já existe um usuário com este e-mail.');
  const before = old ? `${old.role} · ${old.status} · ${old.projects.length} projetos` : '';
  if (old) Object.assign(old, v);
  else db.users.push({ id: uid(), ...v });
  persist(
    'Atualizou acesso',
    'Administração',
    before,
    `${v.name}: ${v.role} · ${v.status} · ${v.projects.length} projetos`
  );
  closeModal();
  render();
  notify('Cadastro atualizado.');
}

function requestAccess() {}
function submitRequest() {}

function openImport(pid = '', mode = '') {
  if (!db.projects.length) {
    notify('Crie um projeto antes de importar obras.');
    editProject();
    return;
  }
  const p = pid ? db.projects.find((x) => x.id === pid) : null;
  modal(
    'Importar obras',
    `<p class="subtitle">Escolha a origem dos dados. Cada obra receberá um identificador exclusivo.</p><div class="import-tabs"><button class="import-tab active" type="button" onclick="setImportMode('local')">${icon(
      'upload'
    )} Planilha local</button><button class="import-tab" type="button" onclick="setImportMode('drive')">${icon(
      'sheet'
    )} Google Drive</button></div><div class="field"><label>Projeto de destino *</label><select id="importProject">${db.projects
      .filter((x) => canEdit(x))
      .map(
        (x) => `<option value="${x.id}" ${p?.id === x.id ? 'selected' : ''}>${esc(x.name)}</option>`
      )
      .join(
        ''
      )}</select></div><div id="importLocal" class="field"><label>Planilha Excel (.xlsx, .xls) ou CSV</label><input id="importFile" type="file" accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"><small>Use a primeira linha como cabeçalho. Suporta arquivos Excel e CSV.</small></div><div id="importDrive" class="field" style="display:none"><label>Link público do Google Sheets ou Drive</label><input id="driveUrl" type="url" placeholder="https://docs.google.com/spreadsheets/d/.../edit"><small>A planilha precisa estar compartilhada como “qualquer pessoa com o link”. Arquivos privados não podem ser importados.</small></div><div id="importProgress" class="import-progress" style="display:none"><span class="spinner"></span><span id="importProgressText">Processando dados…</span><div class="progress"><i></i></div></div>`,
    btn('Cancelar', 'closeModal()', 'close') +
      `<button class="btn primary" type="button" onclick="runImport()">${icon(
        'upload'
      )} Importar dados</button>`
  );
  if (mode === 'drive') setImportMode('drive');
}

function setImportMode(mode) {
  const local = $('#importLocal'),
    drive = $('#importDrive');
  if (!local || !drive) return;
  local.style.display = mode === 'local' ? 'block' : 'none';
  drive.style.display = mode === 'drive' ? 'block' : 'none';
  document
    .querySelectorAll('.import-tab')
    .forEach((b, i) => b.classList.toggle('active', (mode === 'local' ? 0 : 1) === i));
}
// Função auxiliar para converter DD/MM/AAAA para YYYY-MM-DD
function parseBrazilianDate(value) {
  return spreadsheetDate(value);
}

function parseCSV(text) {
  const first = text.split(/\r?\n/)[0] || '',
    semi = (first.match(/;/g) || []).length,
    comma = (first.match(/,/g) || []).length,
    delimiter = semi > comma ? ';' : ',';
  const rows = [];
  let row = [],
    cell = '',
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' && quoted && text[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (c === '"') quoted = !quoted;
    else if (c === delimiter && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell.trim());
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  row.push(cell.trim());
  if (row.some((v) => v !== '')) rows.push(row);
  return rows;
}

function driveCsvUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw Error('O link informado não é uma URL válida.');
  }
  if (!['docs.google.com', 'drive.google.com'].includes(u.hostname))
    throw Error('Use um link do Google Sheets ou Google Drive.');
  let m = u.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv`;
  m = u.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
  throw Error(
    'Formato de link não reconhecido. Copie o link de compartilhamento da planilha ou arquivo.'
  );
}
function detectFieldType(sampleValues) {
  const clean = sampleValues.filter((v) => v !== '' && v != null);
  if (!clean.length) return 'text';

  const isCurrency = clean.some((v) => /R\$|^\d{1,3}(\.\d{3})*,\d{2}$/.test(String(v).trim()));
  if (isCurrency) return 'currency';

  const isDate = clean.some((v) => /^\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}$/.test(String(v).trim()));
  if (isDate) return 'date';

  const isNumeric = clean.every(
    (v) => !isNaN(Number(String(v).replace(/\./g, '').replace(',', '.')))
  );
  if (isNumeric) return 'number';

  return 'text';
}

let importReview = null;
function planRecordImport(existing, incoming, keys) {
  const fields = [...new Set(keys.filter((k) => k !== 'id'))].sort();
  const signature = (r) =>
    JSON.stringify(
      fields.map((k) => {
        const v = r[k];
        return v == null ? '' : String(v).trim();
      })
    );
  const available = new Map();
  existing.forEach((r) => {
    const key = signature(r);
    available.set(key, (available.get(key) || 0) + 1);
  });
  let matched = 0;
  const added = [];
  for (const r of incoming) {
    const key = signature(r),
      n = available.get(key) || 0;
    if (n) {
      matched++;
      available.set(key, n - 1);
    } else added.push(r);
  }
  return { added, existing: matched };
}
async function applyReviewedImport() {
  const draft = importReview,
    p = draft && db.projects.find((p) => p.id === draft.projectId);
  if (!p || !canEdit(p)) {
    notify('Projeto indisponível ou sem permissão.');
    return;
  }
  const button = document.querySelector('#modal .dialogfoot .btn.primary');
  if (button) button.disabled = true;

  // Registra a planilha de origem em cada obra importada
  for (const r of draft.records || []) {
    r.nome_planilha = draft.nomePlanilha || '';
    r.planilha_id = draft.planilhaId || '';
  }

  if (window.SECAP_OBRAS_BACKEND && draft.records?.length) {
    const backend = window.SECAP_OBRAS_BACKEND;
    // 1. A planilha precisa existir antes das obras (obras.planilha_id é chave estrangeira).
    const planilha = await backend.registerPlanilha({
      id: draft.planilhaId,
      nome_arquivo: draft.nomePlanilha || 'Planilha Importada',
      project_id: p.id,
      total_obras: draft.records.length,
      importado_por: me()?.name || 'Usuário',
    });
    if (!planilha.ok) {
      if (button) button.disabled = false;
      notify(`A importação não foi concluída: ${planilha.error}`);
      return;
    }
    // 2. Só depois salva as obras; se falhar, desfaz o registro da planilha.
    const obras = await backend.batchSave(p.id, draft.records);
    if (!obras.ok) {
      await backend.deletePlanilha(draft.planilhaId);
      if (button) button.disabled = false;
      notify(`A importação não foi concluída: ${obras.error}`);
      return;
    }
  }

  for (const field of draft.fields || []) {
    if (!p.fields.some((f) => f.id === field.id)) p.fields.push(field);
  }
  // Sincronia com a planilha do link: o servidor (sheet_sync.py) lê project.sheetSync e,
  // a cada ciclo, grava na planilha o que mudou no portal e traz o que mudou na planilha.
  const keepSynced = draft.sheetLink?.campoId && document.getElementById('importSheetSync')?.checked;
  if (keepSynced)
    p.sheetSync = {
      ativo: true,
      planilhaId: draft.sheetLink.planilhaId,
      url: draft.sheetLink.url,
      aba: '',
      campoId: draft.sheetLink.campoId,
      conectadoEm: new Date().toISOString(),
      conectadoPor: me()?.name || '',
    };
  if (!draft.records?.length) {
    if (!keepSynced) return closeModal();
    persist('Conectou planilha', p, '', `Sincronia com a planilha "${draft.nomePlanilha || 'Google Sheets'}"`);
    importReview = null;
    closeModal();
    render();
    notify('Planilha conectada: as mudanças do portal passam a ser gravadas nela a cada poucos minutos.');
    return;
  }
  p.records.push(...draft.records);
  persist(
    'Importou obras',
    p,
    '',
    `${draft.records.length} adicionadas da planilha "${draft.nomePlanilha || 'Planilha'}"; ${draft.existing} já cadastradas; ${draft.read} linhas lidas`
  );

  importReview = null;
  closeModal();
  render();
  notify(
    `${draft.records.length} registro(s) adicionado(s) da planilha "${draft.nomePlanilha || 'Planilha'}". Total da pasta: ${p.records.length}.`
  );
}
async function runImport() {
  const target = $('#importProject')?.value,
    storedProject = db.projects.find((x) => x.id === target),
    p = storedProject ? structuredClone(storedProject) : null;
  if (!p || !canEdit(p)) {
    notify('Selecione um projeto com permissão de edição.');
    return;
  }
  const drive = $('#importDrive')?.style.display !== 'none',
    progress = $('#importProgress');
  let text = '';
  try {
    progress.style.display = 'flex';
    $('#importProgressText').textContent = 'Lendo arquivo…';
    let rows,
      nomePlanilha = 'Planilha Importada',
      sheetLink = null;
    if (drive) {
      const url = driveCsvUrl($('#driveUrl').value.trim());
      // Só planilhas do Google Sheets podem receber de volta as mudanças do portal (arquivo .xlsx no Drive não).
      const sheetMatch = $('#driveUrl').value.trim().match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      if (sheetMatch) sheetLink = { planilhaId: sheetMatch[1], url: $('#driveUrl').value.trim() };
      nomePlanilha = 'Google Sheets (' + new Date().toLocaleDateString('pt-BR') + ')';
      $('#importProgressText').textContent = 'Conectando ao Google Drive…';
      const response = await fetch(url);
      if (!response.ok)
        throw Error(
          response.status === 403 || response.status === 404
            ? 'Não foi possível acessar. Verifique se o arquivo está público.'
            : 'Falha ao baixar a planilha do Google Drive.'
        );
      text = await response.text();
      if (/<!doctype html|<html/i.test(text))
        throw Error('O Google Drive retornou uma página de acesso. Deixe a planilha pública.');
      rows = parseCSV(text.replace(/^\uFEFF/, ''));
    } else {
      const file = $('#importFile')?.files?.[0];
      if (!file) throw Error('Selecione uma planilha Excel (.xlsx, .xls) ou CSV para continuar.');
      nomePlanilha = file.name || 'Planilha Importada';
      const isExcel = /\.(xlsx|xls)$/i.test(file.name);
      if (isExcel && window.XLSX) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      } else {
        text = await file.text();
        rows = parseCSV(text.replace(/^\uFEFF/, ''));
      }
    }
    $('#importProgressText').textContent = 'Validando e organizando registros…';
    if (!rows || rows.length < 2) throw Error('A planilha não contém registros para importar.');

    while (rows.length && !rows[0].some((v) => String(v ?? '').trim())) rows.shift();
    if (rows.length < 2) throw Error('A planilha não contém registros para importar.');
    const rawHeaders = rows.shift().map((h) => String(h ?? '').trim());
    if (!rawHeaders.length) throw Error('Planilha sem cabeçalhos válidos.');

    // Mapeamento de aliases padrão para alinhamento com campos nativos
    const sysAliases = {
      nome: [
        'nome',
        'nomedaobra',
        'nomedoprojeto',
        'obra',
        'titulo',
        'empreendimento',
        'descricao',
        'denominacao',
      ],
      status: ['status', 'statusdoprojeto', 'statusdaobra', 'situacao', 'posicao', 'fase'],
      etapa: ['etapa', 'macroetapa'],
      valor: [
        'valor',
        'investimento',
        'investimentoprevisto',
        'orcamento',
        'valorestimadoexecucaoprojeto',
        'valorestimadoexecucaoobra',
      ],
      executado: ['executado', 'valorexecutado', 'gasto', 'pago'],
      prazo: ['prazo', 'prazodeentrega', 'dataentrega', 'prazodaproximaprovidencia', 'previsao'],
      responsavel: ['responsavel', 'gestor', 'fiscal'],
      progresso: ['progresso', 'avancofisico', 'avanco', 'execucao', 'percentualexecucao'],
      proxima: ['proxima', 'proximaprovidencia', 'providencia', 'acao'],
      orgao: ['orgao', 'secretaria', 'unidade'],
    };

    // 1. Identificar ou criar dinamicamente os campos no projeto
    const fieldMapping = []; // { colIndex, fieldId, fieldType }

    rawHeaders.forEach((header, index) => {
      const normHeader = header
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
      if (!normHeader) return;

      // Verifica se a coluna encaixa em um campo já existente no projeto
      let existingField = p.fields.find((f) => {
        const normName = f.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '');
        const aliases = sysAliases[f.id] || [];
        return f.id === normHeader || normName === normHeader || aliases.includes(normHeader);
      });

      // Se não existir o campo no projeto, cria um novo campo automaticamente com base nos dados da coluna
      if (!existingField) {
        const samples = rows.map((r) => r[index]);
        const detectedType = /^(inicio|fim|termino)(da)?vigencia$/.test(normHeader) ? 'date' : detectFieldType(samples);
        const newFieldId = 'f_' + normHeader + '_' + uid().slice(0, 4);

        existingField = {
          id: newFieldId,
          name: header,
          type: detectedType,
          required: false,
        };
        // Seção automática (Localização, Prazos e marcos, Financeiro...) pelo nome e tipo da coluna.
        if (typeof autoFieldGroup === 'function') existingField.group = autoFieldGroup(existingField);
        p.fields.push(existingField);
      }

      fieldMapping.push({
        colIndex: index,
        fieldId: existingField.id,
        fieldType: existingField.type,
        headerNorm: normHeader,
      });
    });

    // 2. Determinar qual coluna é a principal ("Nome da obra")
    const nameMapping = importNameColumn(fieldMapping, rows);
    if (!nameMapping) throw Error('Não foi possível identificar uma coluna descritiva para o nome da obra. Inclua um cabeçalho Nome ou Obra.');

    const imported = [];
    let skippedRows = 0;
    for (const cells of rows) {
      // O Excel pode manter linhas vazias no intervalo usado apenas por formatação.
      // Essas linhas não devem virar registros "Registro Sem Nome".
      const hasAnyValue =
        Array.isArray(cells) &&
        cells.some((value) => value !== null && value !== undefined && String(value).trim() !== '');
      if (!hasAnyValue) {
        skippedRows++;
        continue;
      }

      const record = { id: uid() };

      for (const { colIndex, fieldId, fieldType } of fieldMapping) {
        let rawVal = cells[colIndex] ?? '';

        if (fieldType === 'date') {
          rawVal = parseBrazilianDate(rawVal);
        } else if (['currency', 'number'].includes(fieldType) && rawVal !== '') {
          let numStr = String(rawVal)
            .replace(/R\$\s?/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim();
          let parsedNum = Number(numStr);
          rawVal = Number.isFinite(parsedNum) ? parsedNum : '';
        } else {
          rawVal = String(rawVal).trim();
        }

        record[fieldId] = rawVal;
      }

      // Não usa outra coluna para inventar nome em linhas com título vazio.
      record.nome = String(cells[nameMapping.colIndex] ?? '').trim();
      if (!String(record.status ?? '').trim()) record.status = 'Ainda não definido';

      if (record.nome) {
        imported.push(record);
      } else {
        skippedRows++;
      }
    }

    if (!imported.length) throw Error('Nenhuma obra válida foi encontrada.');

    const report = planRecordImport(
      p.records,
      imported,
      fieldMapping.map((m) => m.fieldId)
    );
    const sameNames = new Map();
    [...p.records, ...report.added].forEach((r) => {
      const name = String(r.nome || '')
        .trim()
        .toLocaleLowerCase('pt-BR');
      sameNames.set(name, (sameNames.get(name) || 0) + 1);
    });
    const repeatedNames = [...sameNames.values()].filter((n) => n > 1).length;
    const planilhaId = uid();
    if (sheetLink) {
      const idField = p.fields.find(
        (f) => f.id === 'codigo' || ['id', 'codigo', 'cod', 'codigodaobra', 'iddaobra', 'idobra'].includes(importHeaderKey(f.name))
      );
      sheetLink.campoId = idField && fieldMapping.some((m) => m.fieldId === idField.id) ? idField.id : '';
      sheetLink.campoNome = idField?.name || '';
    }
    importReview = {
      sheetLink,
      projectId: p.id,
      fields: p.fields,
      records: report.added,
      read: imported.length,
      existing: report.existing,
      planilhaId,
      nomePlanilha,
    };
    modal(
      'Conferir importação',
      `<div class="import-count-summary">
        <p>Planilha: <b>${esc(nomePlanilha)}</b></p>
        <p><b>${imported.length}</b> linhas válidas identificadas.</p>
        ${skippedRows ? `<p><b>${skippedRows}</b> linha(s) vazia(s) ou sem nome de obra foram ignoradas.</p>` : ''}
        <p><b>${report.added.length}</b> registros serão adicionados; <b>${report.existing}</b> já estão cadastrados com os mesmos valores nas colunas importadas.</p>
        <p>Total nesta pasta após confirmar: <b>${p.records.length + report.added.length}</b> registros.</p>
        ${repeatedNames ? `<p>${repeatedNames} nome(s) aparecem em mais de um registro. Obras com o mesmo nome são preservadas quando os demais dados diferem ou quando aparecem em linhas distintas na primeira importação. Confira IDs e vínculos antes de confirmar.</p>` : ''}
        <p>Nenhuma obra existente será excluída ou substituída.</p>
      </div>${importSheetSyncBox(sheetLink)}`,
      btn('Cancelar', 'importReview=null;closeModal()', 'close') +
        (report.added.length
          ? btn('Confirmar importação', 'applyReviewedImport()', 'check', 'primary')
          : sheetLink?.campoId
            ? btn('Só conectar a planilha', 'applyReviewedImport()', 'link', 'primary')
            : btn('Fechar', 'importReview=null;closeModal()', 'close'))
    );
    if (sheetLink?.campoId) loadSheetSyncAccount();
  } catch (err) {
    progress.style.display = 'none';
    notify(err.message || 'Não foi possível importar os dados.');
  }
}
// Quadro da importação por link: manter portal e planilha sincronizados.
function importSheetSyncBox(link) {
  if (!link) return '';
  if (!link.campoId)
    return `<div class="summary-strip"><p><strong>Sincronia com a planilha indisponível:</strong> a planilha precisa de uma coluna <b>ID</b> (código único de cada obra) para o portal saber qual linha atualizar. Inclua essa coluna e importe novamente para ativar.</p></div>`;
  return `<div class="summary-strip" style="text-align:left">
    <label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" id="importSheetSync" checked>
      <span><strong>Manter portal e planilha sincronizados</strong><br>
      O que for alterado no portal será gravado nesta planilha (e o que mudar na planilha volta para o portal) a cada poucos minutos. As linhas são ligadas pela coluna <b>${esc(link.campoNome || 'ID')}</b>. Células com fórmula na planilha nunca são sobrescritas, e exclusões não são propagadas.</span></label>
    <p style="margin:10px 0 0"><strong>Obrigatório:</strong> no Google Sheets, clique em <em>Compartilhar</em> e adicione como <b>Editor</b> o e-mail <code id="sheetSyncAccount">carregando…</code>. Sem isso o portal consegue ler, mas não gravar na planilha.</p>
  </div>`;
}
async function loadSheetSyncAccount() {
  const el = () => document.getElementById('sheetSyncAccount');
  try {
    const r = await fetch('/api/sheet-sync?conta=1', { cache: 'no-store' });
    const data = r.ok ? await r.json() : {};
    if (el()) el().textContent = data.conta_servico || 'não configurado no servidor: peça ao administrador o e-mail da conta de serviço do Google';
  } catch (e) {
    if (el()) el().textContent = 'não foi possível consultar o servidor: peça ao administrador o e-mail da conta de serviço do Google';
  }
}
// ----------------------------------------------------------------- sincronia com a planilha do projeto
// Estado da conexão, pausar/retomar e desconectar. Quem grava na planilha é o servidor (sheet_sync.py).
function sheetSyncProject(pid) {return db.projects.find((x) => x.id === pid);}
function openSheetSyncPanel(pid) {
  const p = sheetSyncProject(pid), s = p?.sheetSync;
  if (!s) return;
  const can = canEdit(p), idField = (p.fields || []).find((f) => f.id === s.campoId);
  const when = s.conectadoEm ? new Date(s.conectadoEm).toLocaleString('pt-BR') : '';
  modal(
    'Sincronia com a planilha',
    `<div class="summary-strip" style="text-align:left;border-left:4px solid ${s.ativo ? '#268c48' : '#d97706'}"><p><strong>${s.ativo ? 'Ativa' : 'Pausada'}</strong> · ${s.ativo ? 'o portal e a planilha são sincronizados a cada poucos minutos.' : 'nada é gravado em nenhum dos lados até retomar.'}</p></div>
    <p><b>Projeto:</b> ${esc(p.name)}</p>
    <p><b>Planilha:</b> <a href="https://docs.google.com/spreadsheets/d/${encodeURIComponent(s.planilhaId)}/edit" target="_blank" rel="noopener noreferrer">Abrir no Google Sheets</a></p>
    <p><b>Coluna que liga as linhas às obras:</b> ${idField ? esc(idField.name) : '<span style="color:#c93636">campo não encontrado no projeto: a sincronia não funciona até conectar de novo</span>'}</p>
    ${when ? `<p><b>Conectada em:</b> ${esc(when)}${s.conectadoPor ? ` por ${esc(s.conectadoPor)}` : ''}</p>` : ''}
    <div class="simple-preview" id="sheetSyncLive" aria-live="polite"><small>ÚLTIMA SINCRONIA</small><p>Consultando…</p></div>
    <p><b>A planilha precisa estar compartilhada como Editor com:</b> <code id="sheetSyncAccount">carregando…</code></p>
    <p class="subtitle">Mudam nos dois sentidos: o que for alterado no portal vai para a planilha e o contrário. Se a mesma informação mudar nos dois lados, vale o portal. Células com fórmula na planilha nunca são sobrescritas, e exclusões não são propagadas.</p>`,
    btn('Fechar', 'closeModal()', 'close') +
      (can
        ? btn('Desconectar', `confirmDisconnectSheet('${esc(pid)}')`, 'trash') +
          btn(s.ativo ? 'Pausar sincronia' : 'Retomar sincronia', `toggleSheetSync('${esc(pid)}')`, s.ativo ? 'close' : 'check', 'primary')
        : '')
  );
  loadSheetSyncAccount();
  loadSheetSyncStatus(pid);
}
async function loadSheetSyncStatus(pid) {
  const box = () => document.getElementById('sheetSyncLive');
  const show = (html) => box() && (box().innerHTML = `<small>ÚLTIMA SINCRONIA</small>${html}`);
  try {
    const r = await fetch('/api/sheet-sync/status', { cache: 'no-store' });
    const data = r.ok ? await r.json() : null;
    const item = data?.projetos?.[pid];
    if (!item)
      return show(
        data?.ativo
          ? '<p>Este projeto ainda não passou por um ciclo de sincronia. Aguarde alguns minutos.</p>'
          : '<p>O estado só aparece quando o portal roda no servidor local com a sincronia ligada. Na nuvem, o resultado fica no registro do servidor (Vercel).</p>'
      );
    const count = (v) => (Array.isArray(v) ? v.length : Number(v) || 0);
    const at = data.ultima_execucao ? new Date(data.ultima_execucao).toLocaleString('pt-BR') : '';
    if (item.erro) return show(`<p style="color:#c93636"><b>Erro${at ? ` em ${esc(at)}` : ''}:</b> ${esc(item.erro)}</p>`);
    show(`<p>${at ? `Em ${esc(at)}: ` : ''}portal → planilha <b>${count(item.portal_para_planilha)}</b> · planilha → portal <b>${count(item.planilha_para_portal)}</b> · linhas novas na planilha <b>${count(item.linhas_criadas_na_planilha)}</b> · obras novas no portal <b>${count(item.obras_criadas_no_portal)}</b> · conflitos <b>${count(item.conflitos)}</b></p>${count(item.avisos) ? `<p>${count(item.avisos)} aviso(s): ${esc((item.avisos || []).slice(0, 3).join(' · '))}</p>` : ''}`);
  } catch (e) {
    show('<p>Não foi possível consultar o servidor agora.</p>');
  }
}
function toggleSheetSync(pid) {
  const p = sheetSyncProject(pid);
  if (!p?.sheetSync || !canEdit(p)) return;
  p.sheetSync.ativo = !p.sheetSync.ativo;
  persist(p.sheetSync.ativo ? 'Retomou sincronia da planilha' : 'Pausou sincronia da planilha', p, '', p.sheetSync.url || p.sheetSync.planilhaId);
  render();
  openSheetSyncPanel(pid);
  notify(p.sheetSync.ativo ? 'Sincronia retomada.' : 'Sincronia pausada: nada é gravado até retomar.');
}
function confirmDisconnectSheet(pid) {
  const p = sheetSyncProject(pid);
  if (!p?.sheetSync) return;
  modal(
    'Desconectar a planilha?',
    `<p>O projeto <strong>${esc(p.name)}</strong> deixa de ser sincronizado com a planilha.</p><p class="subtitle">As obras do portal e os dados da planilha continuam como estão: nada é apagado. Para conectar de novo, importe pelo link da planilha e marque a opção de manter sincronizado.</p>`,
    btn('Cancelar', `openSheetSyncPanel('${esc(pid)}')`, 'arrow') + btn('Desconectar', `disconnectSheet('${esc(pid)}')`, 'trash', 'primary')
  );
}
function disconnectSheet(pid) {
  const p = sheetSyncProject(pid);
  if (!p?.sheetSync || !canEdit(p)) return;
  const link = p.sheetSync.url || p.sheetSync.planilhaId;
  delete p.sheetSync;
  persist('Desconectou planilha', p, link, '');
  closeModal();
  render();
  notify('Planilha desconectada. Nenhum dado foi apagado.');
}
// No "Editar projeto": quadro com o estado da sincronia e atalho para gerenciar.
const editProjectBeforeSheetSync = editProject;
editProject = function (id = '') {
  editProjectBeforeSheetSync(id);
  const p = id && sheetSyncProject(id), s = p?.sheetSync, form = document.getElementById('projectForm');
  if (!s || !form) return;
  form.insertAdjacentHTML(
    'afterbegin',
    `<div class="summary-strip" style="text-align:left;margin-bottom:16px;border-left:4px solid ${s.ativo ? '#268c48' : '#d97706'}"><p style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;width:100%"><span><strong>Planilha Google ${s.ativo ? 'sincronizada' : 'conectada (pausada)'}</strong><br><small>As mudanças do portal ${s.ativo ? 'são gravadas' : 'não estão sendo gravadas'} na planilha do link.</small></span><button type="button" class="btn secondary small" onclick="openSheetSyncPanel('${esc(id)}')">Ver sincronia</button></p></div>`
  );
};
function openExternalLinkModal() {
  if (me()?.role !== 'Administrador') return;
  modal(
    'Novo projeto · Link externo',
    `<form id="externalLinkForm" onsubmit="event.preventDefault();saveExternalLinkProject()">
      <p class="subtitle">Crie um card que abre uma página externa, dashboard ou documento em uma nova aba ao ser clicado.</p>
      <div class="field">
        <label>Nome do card *</label>
        <input name="name" required placeholder="Ex.: Painel Power BI — Obras">
      </div>
      <div class="field">
        <label>Endereço da página (URL) *</label>
        <input name="externalUrl" type="text" inputmode="url" required placeholder="https://sistema.exemplo.gov.br">
        <small>Se esquecer o https://, ele será adicionado automaticamente.</small>
      </div>
      <div class="field">
        <label>Descrição</label>
        <textarea name="description" rows="2" placeholder="Para que serve este link?"></textarea>
      </div>
      <div class="twocol">
        <div class="field">
          <label>Responsável *</label>
          <input name="owner" required value="${esc(me().name)}">
        </div>
        <div class="field">
          <label>Cor do card</label>
          <input name="color" type="color" value="#0066cc" style="height:43px">
        </div>
      </div>
    </form>`,
    btn('Escolher outro tipo', 'editProject()', 'arrow') +
      `<button class="btn primary" form="externalLinkForm" type="submit">${icon('check')} Criar card com link</button>`
  );
}

function normalizeExternalUrl(raw) {
  let value = String(raw || '').trim();
  if (!value) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = 'https://' + value;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') return null;
    return parsed.href;
  } catch (_) {
    return null;
  }
}

function saveExternalLinkProject() {
  if (me()?.role !== 'Administrador') return;
  const form = $('#externalLinkForm');
  if (!form) return;
  const f = new FormData(form);
  const name = String(f.get('name') || '').trim();
  const owner = String(f.get('owner') || '').trim() || me().name;
  const externalUrl = normalizeExternalUrl(f.get('externalUrl'));
  if (!name) return;
  if (!externalUrl) {
    notify('Informe um link válido, como https://sistema.exemplo.gov.br');
    form.elements.externalUrl.focus();
    return;
  }
  const np = {
    id: uid(),
    name,
    description: String(f.get('description') || '').trim(),
    owner,
    color: String(f.get('color') || '#0066cc'),
    externalUrl,
    isExternal: true,
    fields: [],
    records: [],
  };
  db.projects.push(np);
  persist('Criou projeto externo', np, '', name);
  closeModal();
  go('projects');
  notify('Card com link criado. Clique nele para abrir a página em nova aba.');
}

function openExport(pid = '') {
  const projects = visible().filter((p) => !pid || p.id === pid),
    recordsToExport = (
      pid ? projects.flatMap((p) => p.records.map((r) => ({ ...r, project: p }))) : records()
    ).filter((r) => (!filterStatus || r.status === filterStatus) && matchesQuery(r));
  const fields = [...new Map(projects.flatMap((p) => p.fields).map((f) => [f.id, f])).values()];
  modal(
    'Exportar dados',
    `<p class="subtitle">${
      recordsToExport.length
    } obra(s) no conjunto selecionado. Escolha o formato e as colunas do arquivo.</p><div class="field"><label>Formato do arquivo</label><select id="exportFormat"><option value="xlsx">Excel (.xlsx)</option><option value="csv">CSV (.csv)</option></select></div><div class="field"><label>Colunas incluídas</label><div class="export-columns">${fields
      .map(
        (f) =>
          `<label><input type="checkbox" name="exportField" value="${esc(
            f.id
          )}" checked> ${esc(f.name)}</label>`
      )
      .join('')}</div></div>`,
    btn('Cancelar', 'closeModal()', 'close') +
      `<button class="btn primary" type="button" onclick="performExport('${pid}')">${icon(
        'download'
      )} Exportar arquivo</button>`
  );
}

function performExport(pid = '') {
  const ps = visible().filter((p) => !pid || p.id === pid),
    rs = (pid ? ps.flatMap((p) => p.records.map((r) => ({ ...r, project: p }))) : records()).filter(
      (r) => (!filterStatus || r.status === filterStatus) && matchesQuery(r)
    );
  const selected = [...document.querySelectorAll('input[name="exportField"]:checked')].map(
      (x) => x.value
    ),
    fields = [...new Map(ps.flatMap((p) => p.fields).map((f) => [f.id, f])).values()].filter((f) =>
      selected.includes(f.id)
    );
  if (!fields.length) {
    notify('Selecione pelo menos uma coluna.');
    return;
  }
  const data = rs.map((r) => ({
    Projeto: r.project?.name || '',
    ...Object.fromEntries(fields.map((f) => [f.name, r[f.id] ?? ''])),
  }));
  const format = $('#exportFormat').value;
  const safe = (v) => String(v ?? '').replace(/[=+@]/g, "'$&");
  if (format === 'csv') {
    const headers = Object.keys(data[0] || { Projeto: '' }),
      q = (v) => '"' + safe(v).replace(/"/g, '""') + '"',
      csv =
        '\ufeff' +
        [headers, ...data.map((r) => headers.map((h) => r[h]))]
          .map((row) => row.map(q).join(';'))
          .join('\r\n');
    downloadBlob(csv, 'secap-projetos-obras.csv', 'text/csv;charset=utf-8');
  } else if (window.XLSX) {
    const ws = XLSX.utils.json_to_sheet(data),
      wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Obras');
    XLSX.writeFile(wb, 'secap-projetos-obras.xlsx');
  } else {
    notify('Biblioteca Excel indisponível. Escolha CSV ou tente novamente com conexão.');
    return;
  }
  closeModal();
  notify(`Exportação ${format.toUpperCase()} concluída.`);
}

function downloadBlob(content, name, type) {
  const a = document.createElement('a'),
    url = URL.createObjectURL(new Blob([content], { type }));
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportCSV(pid = '') {
  openExport(pid);
}

let logoutPending = false;
async function logout() {
  if (logoutPending) return;
  logoutPending = true;
  try {
    await saveChain;
    if (saveFailed)
      throw new Error('Existem alterações que não foram salvas. Tente salvar antes de sair.');
    const response = await fetch('/api/logout', { method: 'POST' });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || 'Não foi possível encerrar a sessão. Tente novamente.');
    }
    window.SECAP_AUTH = false;
    window.SECAP_STATE = null;
    window.SECAP_EMAIL = '';
    session = '';
    authView = 'login';
    tab = 'dashboard';
    projectId = '';
    query = '';
    closeModal();
    render();
    location.reload();
  } catch (error) {
    notify(error.message || 'Falha de conexão ao sair. Tente novamente.');
  } finally {
    logoutPending = false;
  }
}

render();
