const APP_SCRIPTS = [
  'server-client.js',
  'vendor/echarts.min.js',
  'vendor/xlsx.full.min.js',
  'import-semantics.js',
  'bi-presentation.js',
  'app.js',
  'upgrade.js',
  'templates.js',
  'visual-builder.js',
  'topic-builder.js',
  'operational.js',
  'container-builder.js',
  'container-models.js',
  'workflow-update.js',
  'avatar-studio.js',
  'status-presentation.js',
  'executive-models.js',
  'executive-overview.js',
  'dashboard-v2.js',
  'records-cards.js',
  'search-suggest.js',
  'field-rename.js',
  'portal.js',
  'weekly-log.js',
  'weekly-notify.js',
  'admin-notifications.js',
  'report-export.js',
  'work-responsibility.js',
  'project-work-selection.js',
  'project-permission-review.js',
  'work-responsible-monitor.js',
  'saving-indicator.js',
  'sidebar-resize.js',
];

function showBootError(message) {
  const app = document.getElementById('app');
  if (!app) return;
  app.replaceChildren();
  const p = document.createElement('p');
  p.style.cssText = 'font-family:sans-serif;padding:24px;max-width:42rem;line-height:1.45';
  p.textContent = message;
  app.appendChild(p);
}

async function loadScripts(sources) {
  for (const src of sources) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar ' + src));
      document.body.appendChild(script);
    });
  }
}

function cloudConfig() {
  const cfg = window.SECAP_SUPABASE || {};
  const url = String(cfg.url || '')
    .trim()
    .replace(/\/$/, '');
  const anonKey = String(cfg.anonKey || '').trim();
  if (!url && !anonKey) return null;
  if (!url || !anonKey) {
    throw new Error('Preencha a URL e a chave anon do Supabase em public/supabase-config.js.');
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('A URL do Supabase é inválida.');
  }
  const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && local)) {
    throw new Error('A URL do Supabase precisa usar HTTPS.');
  }
  const role = jwtRole(anonKey);
  if (role === 'service_role') {
    throw new Error('A chave service_role não pode ir para o navegador. Use a chave anon/public.');
  }
  if (role && role !== 'anon') {
    throw new Error('Use a chave anon/public do projeto Supabase.');
  }
  return { url, anonKey };
}

function jwtRole(key) {
  try {
    const part = key.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json).role || '';
  } catch {
    return '';
  }
}

function jsonResponse(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function newId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function validState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return false;
  return ['projects', 'users', 'notes', 'terms', 'logs'].every((key) => Array.isArray(state[key]));
}

function activeAdminCount(state) {
  return state.users.filter(
    (user) =>
      user && user.id === 'admin' && user.role === 'Administrador' && user.status === 'Ativo'
  ).length;
}

function calendarItem(data) {
  const itemId = String(data.id || '') || newId();
  const day = String(data.date || '');
  const title = String(data.title || '').trim();
  const kind = data.kind;
  const hour = String(data.time || '');
  const description = String(data.description || '');
  const participants = data.participants;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(Date.parse(day + 'T00:00:00'))) return null;
  if (
    !title ||
    title.length > 180 ||
    (kind !== 'personal' && kind !== 'meeting') ||
    description.length > 10000
  ) {
    return null;
  }
  if (hour && !/^\d{2}:\d{2}(:\d{2})?$/.test(hour)) return null;
  if (
    !Array.isArray(participants) ||
    participants.length > 100 ||
    participants.some((item) => typeof item !== 'string' || item.length > 254)
  ) {
    return null;
  }
  return {
    id: itemId,
    date: day,
    title,
    kind,
    time: hour,
    description,
    participants: kind === 'meeting' ? participants : [],
  };
}

async function readBody(init) {
  if (!init || init.body == null || init.body === '') return {};
  if (typeof init.body === 'string') return JSON.parse(init.body);
  return JSON.parse(await new Response(init.body).text());
}

function installApi(sb) {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const raw = typeof input === 'string' ? input : input instanceof Request ? input.url : '';
    let pathname = '';
    let search = '';
    try {
      const url = new URL(raw, location.origin);
      if (url.origin === location.origin && url.pathname.startsWith('/api/')) {
        pathname = url.pathname;
        search = url.search;
      }
    } catch {
      pathname = '';
    }
    if (!pathname) return nativeFetch(input, init);
    try {
      return await handleApi(sb, pathname, init, search);
    } catch (error) {
      const invalid = error instanceof SyntaxError;
      return jsonResponse(invalid ? 400 : 500, {
        error: invalid ? 'JSON inválido.' : error.message || 'Falha ao gravar no Supabase.',
      });
    }
  };
}

async function currentUser(sb) {
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

async function requireAdmin(sb) {
  const user = await currentUser(sb);
  if (!user) return { error: jsonResponse(401, { error: 'Sessão expirada. Entre novamente.' }) };
  const { data, error } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (error) return { error: jsonResponse(500, { error: error.message }) };
  if (!data || data.role !== 'administrador') {
    return { error: jsonResponse(403, { error: 'Acesso restrito ao administrador.' }) };
  }
  return { user };
}

async function requireMember(sb) {
  const user = await currentUser(sb);
  if (!user) return { error: jsonResponse(401, { error: 'Sessão expirada. Entre novamente.' }) };
  const { data, error } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (error) return { error: jsonResponse(500, { error: error.message }) };
  if (!data || !['administrador', 'usuario'].includes(data.role)) {
    return { error: jsonResponse(403, { error: 'Seu acesso ao sistema não está liberado.' }) };
  }
  return { user, role: data.role };
}

function authMessage(error) {
  const text = error?.message || 'Não foi possível autenticar.';
  if (error?.status === 429 || /too many/i.test(text))
    return 'Muitas tentativas. Aguarde cinco minutos.';
  if (/invalid login credentials/i.test(text)) return 'E-mail ou senha incorretos.';
  if (/already registered|already been registered/i.test(text))
    return 'Já existe uma solicitação para este e-mail.';
  if (/password/i.test(text) && /at least|should be/i.test(text)) {
    return 'Informe e-mail e senha de pelo menos 12 caracteres.';
  }
  return text;
}

async function handleApi(sb, path, init, search = '') {
  const method = String(init.method || 'GET').toUpperCase();
  if (method === 'POST' && path !== '/api/logout') {
    const type =
      (init.headers && (init.headers['Content-Type'] || init.headers['content-type'])) || '';
    if (type.split(';')[0] !== 'application/json') return jsonResponse(415, { error: 'Use JSON.' });
  }

  if (path === '/api/register' && method === 'POST')
    return registerAccount(sb, await readBody(init));
  if ((path === '/api/setup' || path === '/api/login') && method === 'POST') {
    return signInAccount(sb, path, await readBody(init));
  }
  if (path === '/api/logout' && method === 'POST') {
    const { error } = await sb.auth.signOut();
    if (error)
      return jsonResponse(503, { error: 'Não foi possível encerrar a sessão. Tente novamente.' });
    return jsonResponse(200, { ok: true });
  }

  const admin = await requireMember(sb);
  if (admin.error) return admin.error;
  const adminOnly =
    path === '/api/restore' || path === '/api/backup' || path.startsWith('/api/account-requests');
  if (adminOnly && admin.role !== 'administrador') {
    return jsonResponse(403, { error: 'Acesso restrito ao administrador.' });
  }

  if (path === '/api/calendar' && method === 'GET') return listCalendar(sb, admin.user.id);
  if (path === '/api/calendar' && method === 'POST')
    return saveCalendar(sb, admin.user.id, await readBody(init));
  if (path === '/api/calendar/delete' && method === 'POST') {
    return deleteCalendar(sb, admin.user.id, await readBody(init));
  }
  if (path === '/api/account-requests' && method === 'GET') return listRequests(sb);
  if (path === '/api/account-requests/action' && method === 'POST') {
    return updateAccountRequest(sb, await readBody(init));
  }
  if (path === '/api/account-requests/project-access' && method === 'POST') {
    const d = await readBody(init);
    if (
      !Number.isSafeInteger(Number(d.id)) ||
      !['all', 'selected'].includes(d.scope) ||
      !Array.isArray(d.project_ids) ||
      d.project_ids.some((x) => typeof x !== 'string')
    )
      return jsonResponse(400, { error: 'Seleção inválida.' });
    const result = await sb.rpc('secap_set_project_access', {
      request_id: Number(d.id),
      scope: d.scope,
      project_ids: d.project_ids,
    });
    if (result.error || !result.data)
      return jsonResponse(400, { error: result.error?.message || 'Usuário não encontrado.' });
    return jsonResponse(200, { ok: true });
  }
  if (path === '/api/account-requests/role' && method === 'POST') {
    const d = await readBody(init);
    const id = Number(d.id);
    if (!Number.isSafeInteger(id) || id < 1 || !['administrador', 'usuario'].includes(d.role)) {
      return jsonResponse(400, { error: 'Usuário ou perfil inválido.' });
    }
    const result = await sb.rpc('secap_set_user_role', { request_id: id, new_role: d.role });
    if (result.error) return jsonResponse(400, { error: result.error.message });
    if (!result.data) {
      return jsonResponse(404, { error: 'Usuário não encontrado ou ainda sem acesso aprovado.' });
    }
    return jsonResponse(200, { ok: true, role: d.role });
  }
  if (path === '/api/account-requests/obras-access' && method === 'POST') {
    return updateObrasAccess(sb, await readBody(init));
  }
  if (path === '/api/obras/save' && method === 'POST') {
    return saveObraApi(sb, await readBody(init), admin.user, admin.role);
  }
  if (path === '/api/obras/batch-save' && method === 'POST') {
    if (admin.role !== 'administrador') {
      return jsonResponse(403, {
        error: 'Somente o administrador pode importar ou atualizar várias obras de uma vez.',
      });
    }
    return batchSaveObrasApi(sb, await readBody(init));
  }
  if (path === '/api/obras/delete' && method === 'POST') {
    return deleteObraApi(sb, await readBody(init));
  }
  if (path === '/api/obras/delete-project' && method === 'POST') {
    return deleteProjectObrasApi(sb, await readBody(init));
  }
  if (path === '/api/planilhas/register' && method === 'POST') {
    return registerPlanilhaApi(sb, admin.user, await readBody(init));
  }
  if (path === '/api/planilhas/delete' && method === 'POST') {
    return deletePlanilhaApi(sb, await readBody(init));
  }
  if (path === '/api/planilhas' && method === 'GET') {
    return listPlanilhasApi(sb, search);
  }
  if (path === '/api/backup' && method === 'GET') return exportBackup(sb, admin.user.id);
  if ((path === '/api/state' || path === '/api/restore') && method === 'POST') {
    return saveState(sb, admin.user.id, path, await readBody(init));
  }
  return jsonResponse(404, { error: 'Rota não encontrada.' });
}

async function registerAccount(sb, data) {
  const name = String(data.name || '').trim();
  const email = String(data.email || '')
    .trim()
    .toLowerCase();
  const password = String(data.password || '');
  const jobTitle = String(data.job_title || '').trim();
  if (
    !name ||
    name.length > 120 ||
    !email.includes('@') ||
    email.length > 254 ||
    !jobTitle ||
    jobTitle.length > 120 ||
    password.length < 12 ||
    password.length > 512
  ) {
    return jsonResponse(400, {
      error: 'Preencha todos os campos. A senha deve ter pelo menos 12 caracteres.',
    });
  }
  const adminEmail = await sb.rpc('email_is_admin', { target: email });
  if (adminEmail.error) return jsonResponse(500, { error: adminEmail.error.message });
  if (adminEmail.data)
    return jsonResponse(409, { error: 'Este e-mail já está cadastrado como administrador.' });

  const signUp = await sb.auth.signUp({
    email,
    password,
    options: { data: { name, job_title: jobTitle } },
  });
  if (signUp.error) {
    const status = /already registered/i.test(signUp.error.message)
      ? 409
      : signUp.error.status || 400;
    return jsonResponse(status, { error: authMessage(signUp.error) });
  }
  if (
    signUp.data.user &&
    Array.isArray(signUp.data.user.identities) &&
    signUp.data.user.identities.length === 0
  ) {
    return jsonResponse(409, { error: 'Já existe uma solicitação para este e-mail.' });
  }
  if (signUp.data.session) {
    const profile = await sb
      .from('profiles')
      .select('role')
      .eq('id', signUp.data.user.id)
      .maybeSingle();
    if (!profile.data || profile.data.role !== 'administrador') await sb.auth.signOut();
  }
  return jsonResponse(201, {
    ok: true,
    message: 'Solicitação enviada. O administrador irá avaliar seu cadastro.',
  });
}

async function signInAccount(sb, path, data) {
  const email = String(data.email || '')
    .trim()
    .toLowerCase();
  const password = String(data.password || '');
  if (password.length > 512) return jsonResponse(400, { error: 'Senha inválida.' });
  const exists = await sb.rpc('admin_exists');
  if (exists.error) return jsonResponse(500, { error: exists.error.message });
  if (path === '/api/setup') {
    if (exists.data) return jsonResponse(409, { error: 'Administrador já configurado.' });
    if (!email.includes('@') || password.length < 12) {
      return jsonResponse(400, { error: 'Informe e-mail e senha de pelo menos 12 caracteres.' });
    }
    const created = await sb.auth.signUp({ email, password });
    if (created.error)
      return jsonResponse(created.error.status || 400, { error: authMessage(created.error) });
    if (
      created.data.user &&
      Array.isArray(created.data.user.identities) &&
      created.data.user.identities.length === 0
    ) {
      return jsonResponse(409, { error: 'Administrador já configurado.' });
    }
    if (!created.data.session) {
      return jsonResponse(400, {
        error:
          'Conta criada. Confirme o e-mail antes de entrar ou desative a confirmação de e-mail no Supabase.',
      });
    }
    return jsonResponse(200, { ok: true });
  }
  const signed = await sb.auth.signInWithPassword({ email, password });
  if (signed.error) return jsonResponse(401, { error: authMessage(signed.error) });
  const profile = await sb
    .from('profiles')
    .select('role')
    .eq('id', signed.data.user.id)
    .maybeSingle();
  if (profile.error) return jsonResponse(500, { error: profile.error.message });
  if (!profile.data || !['administrador', 'usuario'].includes(profile.data.role)) {
    await sb.auth.signOut();
    const refused = profile.data && profile.data.role === 'recusado';
    return jsonResponse(403, {
      error: refused
        ? 'Seu acesso ao sistema foi recusado pelo administrador.'
        : 'Espere o Administrador aceitar seu cadastro para entrar.',
    });
  }
  return jsonResponse(200, { ok: true });
}

async function listCalendar(sb, owner) {
  const { data, error } = await sb.rpc('secap_calendar_list');
  if (error)
    return jsonResponse(500, {
      error:
        'Não foi possível consultar a agenda. Aplique supabase/security/agenda_audit_update.sql no banco do portal. ' +
        error.message,
    });
  return jsonResponse(200, { items: data?.items || [] });
}

async function saveCalendar(sb, owner, data) {
  const item = calendarItem(data);
  if (!item) return jsonResponse(400, { error: 'Confira título, data, horário e participantes.' });
  if (item.kind === 'meeting') {
    const ready = await sb.rpc('secap_calendar_list');
    if (ready.error)
      return jsonResponse(400, {
        error:
          'Para compartilhar a reunião, aplique supabase/security/agenda_audit_update.sql no banco do portal.',
      });
  }
  const { error } = await sb.from('calendar_items').upsert({ id: item.id, owner, body: item });
  if (error) {
    const hidden = error.code === '23505' || error.code === '42501';
    return jsonResponse(hidden ? 403 : 400, {
      error: hidden ? 'Compromisso privado.' : error.message,
    });
  }
  return jsonResponse(200, { ok: true });
}

async function deleteCalendar(sb, owner, data) {
  const itemId = String(data.id || '');
  const { error } = await sb.from('calendar_items').delete().eq('id', itemId).eq('owner', owner);
  if (error) return jsonResponse(400, { error: 'Não foi possível excluir.' });
  return jsonResponse(200, { ok: true });
}

async function listRequests(sb) {
  // A RPC valida o administrador no banco e consulta a tabela sem depender
  // de uma policy SELECT que possa estar desatualizada no ambiente local.
  const { data, error } = await sb.rpc('admin_list_account_requests');
  if (error)
    return jsonResponse(500, { error: `Falha ao consultar os cadastros: ${error.message}` });
  const scopes = await sb.rpc('secap_project_access_list');
  if (scopes.error)
    return jsonResponse(500, {
      error:
        'Aplique supabase/security/project_access.sql para habilitar a seleção de projetos. ' +
        scopes.error.message,
    });
  return jsonResponse(200, {
    requests: (Array.isArray(data) ? data : []).map((item) => ({
      ...item,
      ...(scopes.data || []).find((x) => Number(x.request_id) === Number(item.id)),
    })),
  });
}

async function updateAccountRequest(sb, data) {
  const id = Number(data.id);
  const action = String(data.action || '').trim();
  if (!Number.isSafeInteger(id) || id < 1 || !['approve', 'reject'].includes(action)) {
    return jsonResponse(400, { error: 'ID ou ação inválida.' });
  }

  const { data: updated, error } = await sb.rpc('admin_update_account_request', {
    request_id: id,
    decision: action,
  });
  if (error)
    return jsonResponse(400, { error: `Não foi possível registrar a decisão: ${error.message}` });
  if (!updated) return jsonResponse(404, { error: 'Cadastro não encontrado ou já decidido.' });
  return jsonResponse(200, {
    ok: true,
    message: `Acesso ${action === 'approve' ? 'aprovado' : 'recusado'}.`,
  });
}

async function updateObrasAccess(sb, data) {
  const id = Number(data.id);
  const access = String(data.access || '').trim();
  if (!Number.isSafeInteger(id) || id < 1 || !['visualizar', 'editar'].includes(access)) {
    return jsonResponse(400, { error: 'Usuário ou permissão inválida.' });
  }
  const { data: updated, error } = await sb.rpc('admin_set_obras_access', {
    request_id: id,
    access,
  });
  if (error)
    return jsonResponse(400, { error: `Não foi possível alterar a permissão: ${error.message}` });
  if (!updated) {
    return jsonResponse(404, { error: 'Usuário não encontrado ou ainda sem acesso aprovado.' });
  }
  return jsonResponse(200, { ok: true, access });
}

function obraRowToRecord(row) {
  const custom = row.dados && typeof row.dados === 'object' ? row.dados : {};
  return {
    ...custom,
    id: String(row.id),
    project_id: String(row.project_id || ''),
    nome: String(row.nome || ''),
    status: String(row.status || 'Ainda não definido'),
    valor: row.valor != null ? Number(row.valor) : '',
    executado: row.executado != null ? Number(row.executado) : '',
    prazo: row.prazo ? String(row.prazo) : '',
    responsavel: String(row.responsavel || ''),
    progresso: row.progresso != null ? Number(row.progresso) : '',
    proxima: String(row.proxima || ''),
    orgao: String(row.orgao || ''),
    nome_planilha: String(row.nome_planilha || ''),
    planilha_id: row.planilha_id ? String(row.planilha_id) : '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function recordToObraRow(projectId, record) {
  const standardKeys = new Set([
    'id',
    'project_id',
    'nome',
    'status',
    'valor',
    'executado',
    'prazo',
    'responsavel',
    'progresso',
    'proxima',
    'orgao',
    'nome_planilha',
    'planilha_id',
    'created_at',
    'updated_at',
    'project',
  ]);
  const dados = {};
  for (const k in record) {
    if (!standardKeys.has(k) && typeof record[k] !== 'function') {
      dados[k] = record[k];
    }
  }

  const parseNum = (v) => {
    if (v === '' || v == null) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  const parseDate = (v) => {
    if (!v) return null;
    const s = String(v).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
  };

  return {
    id: String(record.id),
    project_id: String(projectId || record.project_id || ''),
    nome: String(record.nome || ''),
    status: record.status || 'Ainda não definido',
    valor: parseNum(record.valor),
    executado: parseNum(record.executado),
    prazo: parseDate(record.prazo),
    responsavel: String(record.responsavel || ''),
    progresso: parseNum(record.progresso) ?? 0,
    proxima: String(record.proxima || ''),
    orgao: String(record.orgao || ''),
    nome_planilha: String(record.nome_planilha || ''),
    planilha_id: record.planilha_id ? String(record.planilha_id) : null,
    dados,
    updated_at: new Date().toISOString(),
  };
}

async function saveObraApi(sb, data, authUser, authRole) {
  const projectId = String(data.projectId || '');
  const incoming = data.record;
  if (!projectId || !incoming || !incoming.id) {
    return jsonResponse(400, { error: 'Projeto ou registro de obra inválido.' });
  }

  let record = incoming;
  let rowExists = null;
  if (authRole !== 'administrador') {
    // A autorização é conferida no servidor; desabilitar inputs no navegador não é suficiente.
    const { data: stored, error: stateError } = await sb.rpc('secap_read_state');
    if (stateError || !stored) {
      return jsonResponse(500, { error: 'Não foi possível validar as permissões de campos.' });
    }
    const project = (stored.projects || []).find((item) => String(item.id) === projectId);
    if (!project) return jsonResponse(403, { error: 'Você não tem acesso a este projeto.' });

    const profile = await sb.from('profiles').select('email').eq('id', authUser.id).maybeSingle();
    if (profile.error)
      return jsonResponse(500, { error: 'Não foi possível identificar seu usuário.' });
    const email = String(profile.data?.email || authUser.email || '')
      .trim()
      .toLowerCase();
    const rules = stored.fieldPermissions?.[email]?.[projectId];
    const allowed = Array.isArray(rules) ? new Set(rules.map(String)) : new Set();

    if (!allowed.size) {
      return jsonResponse(403, {
        error:
          'Nenhum campo foi liberado para edição neste projeto. Solicite autorização ao administrador.',
      });
    }

    // Em edição, recupera o registro original e só aplica os campos autorizados.
    const existing = await sb.from('obras').select('*').eq('id', String(incoming.id)).maybeSingle();
    if (existing.error) return jsonResponse(500, { error: 'Não foi possível validar a obra.' });
    if (existing.data && String(existing.data.project_id) !== projectId) {
      return jsonResponse(403, { error: 'A obra não pertence a este projeto.' });
    }

    rowExists = Boolean(existing.data);
    const fields = Array.isArray(project.fields) ? project.fields : [];
    const original = existing.data ? obraRowToRecord(existing.data) : { id: String(incoming.id) };
    record = { ...original, id: String(incoming.id) };
    for (const field of fields) {
      const fieldId = String(field.id);
      if (allowed.has(fieldId) && Object.prototype.hasOwnProperty.call(incoming, fieldId)) {
        record[fieldId] = incoming[fieldId];
      }
    }
  }

  // "Responsável pela próxima ação" é opcional (work_responsibility_optional.sql):
  // a obra pode ser salva com o campo vazio.
  const row = recordToObraRow(projectId, record);
  // Obra existente: usa UPDATE puro. Um upsert dispara primeiro o gatilho BEFORE INSERT
  // (tg_op = 'INSERT'), que bloqueia qualquer campo preenchido e não liberado — por isso
  // o usuário recebia "Sem permissão para editar o campo valor" ao editar outro campo.
  let error, written;
  if (rowExists) {
    const { id, project_id, nome_planilha, planilha_id, ...changes } = row;
    ({ error, data: written } = await sb
      .from('obras')
      .update(changes)
      .eq('id', id)
      .select('id')
      .maybeSingle());
  } else {
    ({ error, data: written } = await sb.from('obras').upsert(row).select('id').single());
  }
  if (!error && !written)
    return jsonResponse(403, {
      error: 'O banco não confirmou a gravação. Verifique a permissão de edição desta obra.',
    });
  if (error) {
    return jsonResponse(400, { error: `Erro ao salvar obra no Supabase: ${error.message}` });
  }
  return jsonResponse(200, { ok: true, obra: row });
}

async function batchSaveObrasApi(sb, data) {
  const projectId = data.projectId;
  const records = data.records;
  if (!projectId || !Array.isArray(records)) {
    return jsonResponse(400, { error: 'Lista de obras inválida.' });
  }
  if (!records.length) return jsonResponse(200, { ok: true, count: 0 });
  const rows = records.map((r) => recordToObraRow(projectId, r));
  const { error } = await sb.from('obras').upsert(rows);
  if (error) {
    return jsonResponse(400, { error: `Erro ao importar obras no Supabase: ${error.message}` });
  }
  return jsonResponse(200, { ok: true, count: rows.length });
}

async function deleteObraApi(sb, data) {
  const id = data.id;
  if (!id) return jsonResponse(400, { error: 'ID da obra inválido.' });
  const { data: removed, error } = await sb
    .from('obras')
    .delete()
    .eq('id', String(id))
    .select('id, planilha_id');
  if (error) {
    return jsonResponse(400, { error: `Erro ao excluir obra no Supabase: ${error.message}` });
  }
  if (!removed || !removed.length) {
    // O banco não acusa erro quando a policy (RLS) bloqueia: apenas apaga 0 linhas.
    // Se a obra ainda existe, foi bloqueio de permissão; se não existe, já estava removida.
    const still = await sb.from('obras').select('id').eq('id', String(id)).maybeSingle();
    if (still.error) {
      return jsonResponse(400, { error: `Erro ao conferir a exclusão: ${still.error.message}` });
    }
    if (still.data) {
      return jsonResponse(403, {
        error: 'O banco recusou a exclusão: seu usuário não tem permissão de edição das obras.',
      });
    }
    return jsonResponse(200, { ok: true, removed: 0 });
  }
  // Reforço da trigger do banco: se a planilha de origem ficou sem obras, remove o registro dela.
  for (const planilhaId of new Set(removed.map((row) => row.planilha_id).filter(Boolean))) {
    await dropPlanilhaIfEmpty(sb, planilhaId);
  }
  return jsonResponse(200, { ok: true, removed: removed.length });
}

async function dropPlanilhaIfEmpty(sb, planilhaId) {
  const { count, error } = await sb
    .from('obras')
    .select('id', { count: 'exact', head: true })
    .eq('planilha_id', String(planilhaId));
  if (error || count) return;
  await sb.from('planilhas_importadas').delete().eq('id', String(planilhaId));
}

async function deleteProjectObrasApi(sb, data) {
  const projectId = data.projectId;
  if (!projectId) return jsonResponse(400, { error: 'ID do projeto inválido.' });
  const { error } = await sb.from('obras').delete().eq('project_id', String(projectId));
  if (error) {
    return jsonResponse(400, {
      error: `Erro ao excluir obras do projeto no Supabase: ${error.message}`,
    });
  }
  // Conferência contra bloqueio silencioso de RLS (0 linhas apagadas, sem erro).
  const left = await sb
    .from('obras')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', String(projectId));
  if (left.error) {
    return jsonResponse(400, { error: `Erro ao conferir a exclusão: ${left.error.message}` });
  }
  if (left.count) {
    return jsonResponse(403, {
      error: 'O banco recusou a exclusão: seu usuário não tem permissão de edição das obras.',
    });
  }
  const planilhas = await sb
    .from('planilhas_importadas')
    .delete()
    .eq('project_id', String(projectId));
  if (planilhas.error) {
    return jsonResponse(400, {
      error: `Obras excluídas, mas não foi possível limpar as planilhas do projeto: ${planilhas.error.message}`,
    });
  }
  return jsonResponse(200, { ok: true });
}

async function deletePlanilhaApi(sb, data) {
  const id = String(data.id || '').trim();
  if (!id) return jsonResponse(400, { error: 'ID da planilha inválido.' });
  const { error } = await sb.from('planilhas_importadas').delete().eq('id', id);
  if (error) {
    return jsonResponse(400, { error: `Erro ao excluir planilha no Supabase: ${error.message}` });
  }
  return jsonResponse(200, { ok: true });
}

async function registerPlanilhaApi(sb, user, data) {
  const id = data.id || newId();
  const nome_arquivo = String(data.nome_arquivo || '').trim();
  const project_id = String(data.project_id || '').trim();
  const total_obras = Number(data.total_obras) || 0;
  const importado_por = String(data.importado_por || user?.email || 'Usuário').trim();

  if (!nome_arquivo || !project_id) {
    return jsonResponse(400, { error: 'Nome do arquivo e projeto são obrigatórios.' });
  }

  const row = {
    id,
    nome_arquivo,
    project_id,
    total_obras,
    importado_por,
    importado_por_id: user?.id || null,
    created_at: new Date().toISOString(),
  };

  const { error } = await sb.from('planilhas_importadas').insert(row);
  if (error) {
    return jsonResponse(400, { error: `Erro ao registrar planilha no Supabase: ${error.message}` });
  }
  return jsonResponse(200, { ok: true, planilha: row });
}

async function listPlanilhasApi(sb, search = '') {
  const params = new URLSearchParams(search);
  const projectId = params.get('projectId');
  let q = sb.from('planilhas_importadas').select('*').order('created_at', { ascending: false });
  if (projectId) q = q.eq('project_id', projectId);
  const { data, error } = await q;
  if (error) {
    return jsonResponse(400, { error: `Erro ao listar planilhas: ${error.message}` });
  }
  return jsonResponse(200, { planilhas: data || [] });
}

async function exportBackup(sb, owner) {
  const state = await sb.from('app_state').select('body').eq('id', 1).maybeSingle();
  if (state.error) return jsonResponse(500, { error: state.error.message });
  let fullState = state.data ? state.data.body : null;
  if (fullState && Array.isArray(fullState.projects)) {
    const { data: obrasRows } = await sb
      .from('obras')
      .select('*')
      .order('created_at', { ascending: true });
    if (obrasRows && obrasRows.length) {
      fullState = {
        ...fullState,
        projects: fullState.projects.map((p) => ({
          ...p,
          records: obrasRows.filter((o) => o.project_id === p.id).map(obraRowToRecord),
        })),
      };
    }
  }
  const ownedAgenda = await sb.from('calendar_items').select('body').eq('owner', owner);
  const agenda = ownedAgenda.error
    ? jsonResponse(500, { error: ownedAgenda.error.message })
    : jsonResponse(200, { items: (ownedAgenda.data || []).map((row) => row.body) });
  if (!agenda.ok) return agenda;
  const items = await agenda.json();
}

async function saveState(sb, owner, path, data) {
  // O usuário aprovado existe só na sessão do navegador; nunca entra no estado compartilhado.
  let state =
    data.state && Array.isArray(data.state.users)
      ? { ...data.state, users: data.state.users.filter((user) => !user || user.id !== 'member') }
      : data.state;
  if (window.SECAP_MEMBER && path === '/api/state') {
    const projects = (state?.projects || []).map((p) => ({ ...p, records: [] }));
    const result = await sb.rpc('secap_save_project_state', {
      projects,
      expected_projects: window.SECAP_PROJECTS_BASE || [],
      personal_state: { notes: state.notes || [], logs: state.logs || [] },
    });
    if (result.error) return jsonResponse(409, { error: result.error.message });
    window.SECAP_PROJECTS_BASE = JSON.parse(JSON.stringify(projects));
    return jsonResponse(200, { ok: true });
  }
  if (!validState(state)) return jsonResponse(400, { error: 'Estrutura de dados inválida.' });
  if (activeAdminCount(state) !== 1) {
    return jsonResponse(400, { error: 'O administrador principal deve permanecer ativo.' });
  }

  // IMPORTANTE: Removemos os records das obras de cada projeto antes de salvar no app_state.
  // As obras passam a ser armazenadas exclusivamente na tabela 'public.obras' do Supabase.
  if (state && Array.isArray(state.projects)) {
    state = {
      ...state,
      projects: state.projects.map((p) => ({
        ...p,
        records: [],
      })),
    };
  }

  const agenda = data.private_calendar;
  if (path === '/api/restore' && agenda != null) {
    const validAgenda =
      Array.isArray(agenda) &&
      agenda.every(
        (item) =>
          item &&
          typeof item === 'object' &&
          ['id', 'date', 'title', 'kind', 'participants'].every((key) => key in item)
      );
    if (!validAgenda) return jsonResponse(400, { error: 'Agenda do backup inválida.' });
  }

  const saved = await sb.from('app_state').upsert({ id: 1, body: state });
  if (saved.error) return jsonResponse(400, { error: saved.error.message });
  if (path === '/api/restore' && Array.isArray(agenda)) {
    const removed = await sb.from('calendar_items').delete().eq('owner', owner);
    if (removed.error) return jsonResponse(400, { error: removed.error.message });
    if (agenda.length) {
      const rows = agenda.map((item) => {
        const copy = { ...item, id: newId() };
        return { id: copy.id, owner, body: copy };
      });
      const inserted = await sb.from('calendar_items').insert(rows);
      if (inserted.error) return jsonResponse(400, { error: inserted.error.message });
    }
  }
  return jsonResponse(200, { ok: true });
}

// Atualiza a tela de carregamento do login (loading-screen.js), quando visível.
function loadingStep(message, value) {
  if (window.SECAPLoading && window.SECAPLoading.active()) window.SECAPLoading.step(message, value);
}

async function bootCloud(config) {
  loadingStep('Conectando ao servidor…', 25);
  const { createClient } =
    await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const sb = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  window.sb = sb;
  window.SECAP_CLOUD = true;
  installApi(sb);

  loadingStep('Verificando seu acesso…', 35);
  const existing = await sb.auth.getUser();
  window.SECAP_ACTOR_ID = existing.data?.user?.id || '';
  let email = '';
  let active = false;
  if (existing.data?.user && !existing.error) {
    const profile = await sb
      .from('profiles')
      .select('role,email,name,job_title,obras_access,project_scope,project_ids')
      .eq('id', existing.data.user.id)
      .maybeSingle();
    if (profile.error) throw new Error(profile.error.message);
    if (['administrador', 'usuario'].includes(profile.data?.role)) {
      active = true;
      email = profile.data.email || existing.data.user.email || '';
      window.SECAP_PROFILE_NAME = String(profile.data.name || '').trim();
      if (profile.data.role === 'usuario') {
        window.SECAP_MEMBER = {
          id: 'member',
          name: profile.data.name || email,
          email,
          job_title: profile.data.job_title || 'Usuário',
          obras_access: profile.data.obras_access === 'editar' ? 'editar' : 'visualizar',
          role: 'Administrador',
          status: 'Ativo',
          projects: profile.data.project_ids || [],
          project_scope: profile.data.project_scope,
          tabs: ['dashboard', 'projects', 'kanban', 'bi', 'calendar', 'terms', 'notes', 'history'],
        };
      }
    } else {
      // Conta criada/entrada com Google (ou sessão antiga) ainda sem liberação: avisa na tela de login.
      window.SECAP_ACCESS_NOTICE = {
        kind: profile.data?.role === 'recusado' ? 'refused' : 'pending',
        email: profile.data?.email || existing.data.user.email || '',
      };
      await sb.auth.signOut();
    }
  }
  const setup = await sb.rpc('admin_exists');
  if (setup.error) throw new Error(setup.error.message);
  let state = null;
  if (active) {
    loadingStep('Carregando seus projetos…', 50);
    const stored = await sb.rpc('secap_read_state');
    if (stored.error)
      throw new Error('Aplique supabase/security/project_access.sql. ' + stored.error.message);
    state = stored.data;
    if (!window.SECAP_MEMBER && window.SECAP_PROFILE_NAME && Array.isArray(state?.users)) {
      const currentAdmin = state.users.find((user) => user.id === 'admin');
      if (currentAdmin) currentAdmin.name = window.SECAP_PROFILE_NAME;
    }
    window.SECAP_PROJECTS_BASE = JSON.parse(JSON.stringify(state?.projects || []));

    if (state && Array.isArray(state.projects)) {
      // Inicializa cada projeto com array de obras vazio na memória
      for (const p of state.projects) {
        p.records = [];
      }

      // Carrega as obras da tabela dedicada no Supabase
      loadingStep('Carregando as obras…', 65);
      const { data: obrasRows, error: obrasError } = await sb
        .from('obras')
        .select('*')
        .order('created_at', { ascending: true });

      if (obrasError) {
        console.warn('Aviso ao carregar obras da tabela Supabase:', obrasError.message);
      } else if (obrasRows && obrasRows.length) {
        for (const row of obrasRows) {
          const p = state.projects.find((proj) => proj.id === row.project_id);
          if (p) {
            p.records.push(obraRowToRecord(row));
          }
        }
      }
    }
  }

  // Chamada ao backend que devolve { ok, error } em vez de engolir a falha no console.
  const callObrasApi = async (url, body, label) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = result.error || 'Erro desconhecido.';
        console.error(`${label}:`, error);
        return { ok: false, error };
      }
      return { ok: true, ...result };
    } catch (e) {
      console.error(`${label}:`, e);
      return { ok: false, error: 'Não foi possível conectar ao banco.' };
    }
  };
  const warn = (message) => {
    if (typeof window.notify === 'function') window.notify(message);
  };

  window.SECAP_OBRAS_BACKEND = {
    obraRowToRecord,
    recordToObraRow,
    saveObra: async (projectId, record) => {
      const result = await callObrasApi(
        '/api/obras/save',
        { projectId, record },
        'Falha ao salvar obra no backend'
      );
      if (!result.ok) warn(`A obra não foi salva no banco: ${result.error}`);
      // Mantém a data da última alteração atualizada na tela (Visão geral) sem recarregar.
      else {
        if (record && typeof record === 'object') record.updated_at = new Date().toISOString();
        window.dispatchEvent(new CustomEvent('secap:obra-saved', { detail: { projectId } }));
      }
      return result;
    },
    batchSave: (projectId, records) =>
      callObrasApi(
        '/api/obras/batch-save',
        { projectId, records },
        'Falha ao importar obras no backend'
      ),
    deleteObra: (id) =>
      callObrasApi('/api/obras/delete', { id }, 'Falha ao excluir obra no backend'),
    deleteProjectObras: (projectId) =>
      callObrasApi(
        '/api/obras/delete-project',
        { projectId },
        'Falha ao excluir obras do projeto no backend'
      ),
    registerPlanilha: ({ id, nome_arquivo, project_id, total_obras, importado_por }) =>
      callObrasApi(
        '/api/planilhas/register',
        { id, nome_arquivo, project_id, total_obras, importado_por },
        'Falha ao registrar planilha no backend'
      ),
    deletePlanilha: (id) =>
      callObrasApi('/api/planilhas/delete', { id }, 'Falha ao excluir planilha no backend'),
  };

  window.SECAP_AUTH = active;
  window.SECAP_SETUP = !setup.data;
  window.SECAP_EMAIL = active ? email : '';
  window.SECAP_STATE = state;
}

async function boot() {
  const app = document.getElementById('app');
  if (app) app.textContent = 'Carregando o SECAP…';
  try {
    const config = cloudConfig();
    if (window.SECAP_PREVIEW) {
      await window.prepareSECAPPreview();
    } else if (config) {
      await bootCloud(config);
    } else {
      throw new Error(
        'Configuração do Supabase não encontrada em public/supabase-config.js. Inicie o Supabase CLI local (supabase start).'
      );
    }
    loadingStep('Preparando painéis e indicadores…', 82);
    await loadScripts(APP_SCRIPTS);
    if (window.SECAPLoading) window.SECAPLoading.finish();
  } catch (error) {
    if (window.SECAPLoading) window.SECAPLoading.hide();
    showBootError(error.message || 'Não foi possível iniciar o SECAP.');
  }
}

boot();
