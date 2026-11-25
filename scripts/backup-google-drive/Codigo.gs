/**
 * Conecta SECAP — Exportação automática dos projetos para o Google Drive
 * ---------------------------------------------------------------------
 * Roda na sua conta Google (Google Apps Script).
 *
 *   • Projeto novo no portal  → em até 15 minutos é criada uma planilha Google
 *     com o NOME DO PROJETO na pasta "Conecta SECAP - Projetos".
 *   • Alteração no portal (campos, linhas, marcos…) → a MESMA planilha é atualizada.
 *     Nunca cria cópia: o vínculo projeto → arquivo é guardado pelo ID do projeto,
 *     então renomear o projeto só renomeia a planilha.
 *   • Toda semana a exportação roda completa, mesmo sem alterações, e atualiza
 *     também um arquivo JSON com o backup integral (serve para restaurar o sistema).
 *
 * Abas de cada planilha:
 *   Registros — todas as linhas do projeto, uma coluna por campo
 *   Campos    — os campos do projeto (nome, tipo, opções)
 *   Marcos    — fases e marcos do projeto
 *   Projeto   — informações gerais e data da última exportação
 *
 * Instalação: veja LEIA-ME.md nesta mesma pasta.
 */

const CONFIG = {
  PASTA: 'Conecta SECAP - Projetos',
  ARQUIVO_JSON: 'conecta-secap-backup-completo.json',
  VERIFICAR_A_CADA_MINUTOS: 15,           // 1, 5, 10, 15 ou 30
  DIA_COMPLETO: ScriptApp.WeekDay.MONDAY, // exportação completa semanal
  HORA_COMPLETO: 3,
  LIMITE_CELULA: 49000,                   // Google Sheets aceita até 50.000 caracteres por célula
  FUSO: 'America/Sao_Paulo',
};

// Colunas próprias da tabela public.obras (o resto fica em obras.dados).
const COLUNAS_PADRAO = ['nome', 'status', 'valor', 'executado', 'prazo', 'responsavel', 'progresso', 'proxima', 'orgao'];
// Dados técnicos que não viram coluna.
const IGNORAR_EM_DADOS = ['id', 'project_id', 'created_at', 'updated_at'];

/* ============================================================ gatilhos */

/** Rode UMA vez para ligar tudo (verificação frequente + exportação semanal). */
function instalarAgendamento() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('verificarAlteracoes').timeBased().everyMinutes(CONFIG.VERIFICAR_A_CADA_MINUTOS).create();
  ScriptApp.newTrigger('exportarTudo').timeBased().onWeekDay(CONFIG.DIA_COMPLETO).atHour(CONFIG.HORA_COMPLETO).create();
  console.log('Agendamento instalado.');
}

/** Chamado a cada poucos minutos: só exporta se algo mudou no portal (é leve). */
function verificarAlteracoes() {
  const api = supabase_();
  const assinatura = assinaturaAtual_(api);
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('ULTIMA_ASSINATURA') === assinatura) return; // nada mudou
  exportar_(api, false);
  props.setProperty('ULTIMA_ASSINATURA', assinatura);
}

/** Exportação completa (semanal ou manual). */
function exportarTudo() {
  const api = supabase_();
  exportar_(api, true);
  PropertiesService.getScriptProperties().setProperty('ULTIMA_ASSINATURA', assinaturaAtual_(api));
}

/* ============================================================ exportação */

function exportar_(api, completo) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30 * 1000)) return; // outra exportação em andamento

  const agora = new Date();
  const log = [];
  try {
    const estado = api.get('app_state?id=eq.1&select=body');
    const body = (estado[0] && estado[0].body) || {};
    const projetos = Array.isArray(body.projects) ? body.projects : [];
    const obras = api.getAll('obras?select=*&order=project_id,id');

    const porProjeto = {};
    obras.forEach((o) => (porProjeto[o.project_id] = porProjeto[o.project_id] || []).push(o));

    const props = PropertiesService.getScriptProperties();
    const pasta = pasta_();
    projetos.forEach((p) => {
      try {
        const linhas = porProjeto[p.id] || [];
        // Só regrava a planilha do projeto que mudou (ou todas, na exportação completa).
        const marca = hash_(JSON.stringify([p, linhas]));
        const chaveMarca = 'MARCA_' + p.id;
        if (!completo && props.getProperty(chaveMarca) === marca && props.getProperty('ARQ_' + p.id)) return;
        salvarProjeto_(pasta, p, linhas, agora);
        props.setProperty(chaveMarca, marca);
        log.push('OK  ' + p.name + ' (' + linhas.length + ' registros)');
      } catch (e) {
        log.push('ERRO ' + (p && p.name) + ': ' + e.message);
      }
    });

    if (completo) {
      salvarJson_(pasta, { gerado_em: agora.toISOString(), app_state: body, obras: obras });
      log.push('OK  backup completo JSON (' + obras.length + ' registros)');
    }
  } catch (e) {
    log.push('ERRO GERAL: ' + e.message);
  } finally {
    lock.releaseLock();
  }

  if (log.length) console.log(log.join('\n'));
  if (log.some((l) => l.indexOf('ERRO') === 0)) avisarErro_(log);
}

/* ============================================================ planilha do projeto */

function salvarProjeto_(pasta, projeto, obras, quando) {
  const ss = planilhaDoProjeto_(pasta, projeto);
  const campos = Array.isArray(projeto.fields) ? projeto.fields : [];

  // Colunas = campos do projeto + qualquer dado extra que exista nas linhas.
  const colunas = campos.map((f) => ({ id: f.id, nome: f.name || f.id }));
  const conhecidos = {};
  colunas.forEach((c) => (conhecidos[c.id] = true));
  obras.forEach((o) =>
    Object.keys(o.dados || {}).forEach((k) => {
      if (!conhecidos[k] && IGNORAR_EM_DADOS.indexOf(k) < 0) {
        conhecidos[k] = true;
        colunas.push({ id: k, nome: k });
      }
    })
  );

  escreverAba_(ss, 'Registros', [
    ['ID'].concat(colunas.map((c) => c.nome)).concat(['Criado em', 'Atualizado em']),
  ].concat(
    obras.map((o) =>
      [o.id]
        .concat(colunas.map((c) => valorDoCampo_(o, c.id)))
        .concat([dataHora_(o.created_at), dataHora_(o.updated_at)])
        .map(celula_)
    )
  ));

  escreverAba_(ss, 'Campos', [['Campo', 'ID', 'Tipo', 'Opções']].concat(
    campos.map((f) => [f.name, f.id, f.type, Array.isArray(f.options) ? f.options.join(', ') : f.options].map(celula_))
  ));

  const marcos = [];
  (Array.isArray(projeto.milestones) ? projeto.milestones : []).forEach((fase) =>
    (fase.items || []).forEach((m) =>
      marcos.push([fase.title, m.title, m.status, m.progress, m.ownerName || m.ownerId, m.due || m.date].map(celula_))
    )
  );
  escreverAba_(ss, 'Marcos', [['Fase', 'Marco', 'Status', 'Progresso (%)', 'Responsável', 'Data']].concat(marcos));

  escreverAba_(ss, 'Projeto', [
    ['Informação', 'Valor'],
    ['Projeto', celula_(projeto.name)],
    ['Descrição', celula_(projeto.description)],
    ['Etapa', celula_(projeto.stage)],
    ['Link externo', celula_(projeto.externalUrl)],
    ['Quantidade de registros', obras.length],
    ['Quantidade de campos', campos.length],
    ['ID do projeto', celula_(projeto.id)],
    ['Última exportação', Utilities.formatDate(quando, CONFIG.FUSO, 'dd/MM/yyyy HH:mm')],
  ]);

  const padrao = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (padrao && ss.getSheets().length > 1) ss.deleteSheet(padrao);
}

/** Encontra a planilha do projeto (pelo ID guardado) ou cria uma — nunca duplica. */
function planilhaDoProjeto_(pasta, projeto) {
  const props = PropertiesService.getScriptProperties();
  const chave = 'ARQ_' + projeto.id;
  const nome = String(projeto.name || 'Projeto sem nome').slice(0, 200);
  const id = props.getProperty(chave);

  if (id) {
    try {
      const arquivo = DriveApp.getFileById(id);
      if (!arquivo.isTrashed()) {
        if (arquivo.getName() !== nome) arquivo.setName(nome); // projeto renomeado no portal
        return SpreadsheetApp.openById(id);
      }
    } catch (e) {
      /* arquivo apagado — cria outro abaixo */
    }
  }

  const existentes = pasta.getFilesByName(nome);
  let ss;
  if (existentes.hasNext()) {
    ss = SpreadsheetApp.openById(existentes.next().getId());
  } else {
    ss = SpreadsheetApp.create(nome);
    DriveApp.getFileById(ss.getId()).moveTo(pasta);
  }
  props.setProperty(chave, ss.getId());
  return ss;
}

function escreverAba_(ss, nome, linhas) {
  const aba = ss.getSheetByName(nome) || ss.insertSheet(nome);
  aba.clear();
  const largura = Math.max.apply(null, linhas.map((l) => l.length));
  const matriz = linhas.map((l) => l.concat(Array(largura - l.length).fill('')));
  aba.getRange(1, 1, matriz.length, largura).setValues(matriz);
  aba.getRange(1, 1, 1, largura).setFontWeight('bold').setBackground('#002F47').setFontColor('#FFFFFF');
  aba.setFrozenRows(1);
}

function valorDoCampo_(obra, campoId) {
  if (COLUNAS_PADRAO.indexOf(campoId) >= 0) return obra[campoId];
  return obra.dados ? obra.dados[campoId] : '';
}

function dataHora_(iso) {
  return iso ? Utilities.formatDate(new Date(iso), CONFIG.FUSO, 'dd/MM/yyyy HH:mm') : '';
}

/** Converte o valor para célula com segurança (texto nunca vira fórmula). */
function celula_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  let s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s.length > CONFIG.LIMITE_CELULA ? s.slice(0, CONFIG.LIMITE_CELULA) + '…' : s;
}

/* ============================================================ detecção de alterações */

function assinaturaAtual_(api) {
  const estado = api.get('app_state?id=eq.1&select=updated_at');
  const obras = api.getAll('obras?select=id,updated_at&order=id');
  return hash_(JSON.stringify([estado, obras]));
}

function hash_(texto) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texto, Utilities.Charset.UTF_8));
}

/* ============================================================ JSON e pasta */

function salvarJson_(pasta, dados) {
  const conteudo = JSON.stringify(dados);
  const arquivos = pasta.getFilesByName(CONFIG.ARQUIVO_JSON);
  if (arquivos.hasNext()) arquivos.next().setContent(conteudo);
  else pasta.createFile(CONFIG.ARQUIVO_JSON, conteudo, 'application/json');
}

function pasta_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('PASTA_ID');
  if (id) {
    try {
      const p = DriveApp.getFolderById(id);
      if (!p.isTrashed()) return p;
    } catch (e) {
      /* pasta apagada — recria */
    }
  }
  const nova = DriveApp.createFolder(CONFIG.PASTA);
  props.setProperty('PASTA_ID', nova.getId());
  return nova;
}

/* ============================================================ Supabase */

function supabase_() {
  const props = PropertiesService.getScriptProperties();
  const url = (props.getProperty('SUPABASE_URL') || '').replace(/\/+$/, '');
  const chave = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !chave) throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas Propriedades do script.');
  const headers = { apikey: chave, Authorization: 'Bearer ' + chave };

  function get(caminho, extra) {
    const r = UrlFetchApp.fetch(url + '/rest/v1/' + caminho, {
      headers: Object.assign({}, headers, extra || {}),
      muteHttpExceptions: true,
    });
    if (r.getResponseCode() >= 300) throw new Error('Supabase ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 300));
    return JSON.parse(r.getContentText() || '[]');
  }
  function getAll(caminho) {
    const tudo = [];
    for (let inicio = 0; ; inicio += 1000) {
      const pagina = get(caminho, { Range: inicio + '-' + (inicio + 999), 'Range-Unit': 'items' });
      tudo.push.apply(tudo, pagina);
      if (pagina.length < 1000) return tudo;
    }
  }
  return { get: get, getAll: getAll };
}

function avisarErro_(log) {
  MailApp.sendEmail(
    Session.getEffectiveUser().getEmail(),
    'Conecta SECAP — falha na exportação para o Drive',
    'A exportação terminou com erros:\n\n' + log.join('\n')
  );
}
