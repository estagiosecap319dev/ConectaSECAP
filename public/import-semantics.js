/* Identificação semântica compartilhada pela importação de arquivos e Google Sheets. */
function importHeaderKey(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
function importNameColumn(mapping, rows) {
  for (const header of ['nomedaobra', 'nomedoprojeto', 'obra', 'nome', 'titulo', 'empreendimento', 'denominacao']) {
    const match = mapping.find((m) => m.headerNorm === header);
    if (match) return match;
  }
  const excluded = /observa|status|situacao|providencia|justifica|comentario|anotac|historico|processo|instrumento|contrato|responsavel|gestor|fiscal|secretaria|orgao|ministerio|recurso|prazo|data|valor|cnpj|cpf|email|telefone|macroetapa/;
  const candidates = mapping.filter((m) => ['text', 'long'].includes(m.fieldType) &&
    !excluded.test(m.headerNorm) && !['id','codigo','item','n','nr','seq'].includes(m.headerNorm))
    .map((m) => {
      const values = rows.map((r) => String(r[m.colIndex] ?? '').trim()).filter(Boolean);
      const texts = values.filter((v) => /[a-zÀ-ÿ]/i.test(v) && v.split(/\s+/).length >= 3);
      // A mediana evita que uma única célula enorme decida por toda a coluna.
      const lengths = texts.map((v) => v.length).sort((a,b) => a-b);
      const median = lengths[Math.floor(lengths.length / 2)] || 0;
      return { m, score: median * (texts.length / Math.max(values.length, 1)) };
    }).filter((v) => v.score >= 15).sort((a,b) => b.score-a.score);
  return candidates[0]?.m || null;
}
function recognizedWorkStatus(value) {
  const key = importHeaderKey(String(value ?? '').replace(/^\s*\d+\s*[-–—.:]\s*/, ''));
  const values = {
    planejamento:'Em planejamento', emplanejamento:'Em planejamento',
    andamento:'Em andamento', emandamento:'Em andamento', emexecucao:'Em andamento', execucao:'Em andamento', obraemexecucao:'Em andamento', emobras:'Em andamento',
    concluido:'Concluído', concluida:'Concluído', finalizado:'Concluído', finalizada:'Concluído',
    iniciado:'Iniciado', iniciada:'Iniciado', naoiniciado:'Não iniciado', naoiniciada:'Não iniciado',
    cancelado:'Cancelado', cancelada:'Cancelado', paralisado:'Paralisado', paralisada:'Paralisado',
    ematencao:'Ponto de Atenção', pontodeatencao:'Ponto de Atenção', atrasado:'Atrasado', atrasada:'Atrasado'
  };
  return values[key] || null;
}
function workStatusSource(r, p) {
  const status = obraStatusKey(p);
  if (recognizedWorkStatus(r[status])) return { key: status, value: r[status] };
  if (status !== 'status' && recognizedWorkStatus(r.status)) return { key: 'status', value: r.status };
  const stage = fieldKey(p, 'stage') || p.fields.find((f) => ['macroetapa','etapa'].includes(importHeaderKey(f.name)))?.id;
  if (stage && recognizedWorkStatus(r[stage])) return { key: stage, value: r[stage] };
  return { key: status, value: 'Ainda não definido' };
}
// Situação da obra para painéis gerais. Regra por projeto (uma lista OU a outra, nunca as duas):
// 1) Se o projeto usa as situações de status, só elas valem;
// 2) senão, se usa as etapas (Em estruturação ... Execução), só elas valem.
// Qualquer outro valor fica como "Não informado".
const WORK_STATUS_LABELS = ['Não iniciado', 'Em planejamento', 'Em andamento', 'Atrasado', 'Ponto de Atenção', 'Concluído', 'Cancelado'];
const WORK_STAGE_LABELS = ['Em estruturação', 'Planejamento', 'Preparatório para Contratação', 'Contratação', 'Mobilização', 'Execução'];
const workStageKeys = {
  emestruturacao: 'Em estruturação', estruturacao: 'Em estruturação',
  planejamento: 'Planejamento', emplanejamento: 'Planejamento',
  preparatorioparacontratacao: 'Preparatório para Contratação', preparatorio: 'Preparatório para Contratação',
  contratacao: 'Contratação', emcontratacao: 'Contratação',
  mobilizacao: 'Mobilização', emmobilizacao: 'Mobilização',
  execucao: 'Execução', emexecucao: 'Execução',
};
function workStatusLabel(v) {
  if (v == null || String(v).trim() === '') return '';
  const c = canonicalStatus(v);
  return WORK_STATUS_LABELS.includes(c) ? c : '';
}
function workStageLabel(v) {
  return workStageKeys[importHeaderKey(String(v ?? '').replace(/^\s*\d+\s*[-–—.:]\s*/, ''))] || '';
}
function workStageKey(p) {
  return fieldKey(p, 'stage') || p.fields.find((f) => ['macroetapa', 'etapa', 'fase'].includes(importHeaderKey(f.name)))?.id || '';
}
const workSituationModeCache = new WeakMap();
function workSituationMode(p) {
  const rs = p.records || [];
  const hit = workSituationModeCache.get(rs);
  if (hit && hit.n === rs.length) return hit;
  const stageKey = workStageKey(p);
  // Coluna de status: a associada no BI ou as colunas chamadas Status/Situação (nunca a etapa).
  // Vale a que tiver mais valores da lista de status; ela precisa ter pelo menos 30% deles.
  const ids = [...new Set([p.biMapping?.status, ...p.fields.filter((f) => /status|situacao/.test(importHeaderKey(f.name))).map((f) => f.id)])]
    .filter((id) => id && id !== stageKey && p.fields.some((f) => f.id === id));
  let statusKey = '', best = 0;
  for (const id of ids) {
    const filled = rs.filter((r) => String(r[id] ?? '').trim());
    const hits = filled.filter((r) => workStatusLabel(r[id])).length;
    if (hits && hits / filled.length >= 0.3 && hits > best) { best = hits; statusKey = id; }
  }
  const mode = statusKey ? 'status' : stageKey && rs.some((r) => workStageLabel(r[stageKey])) ? 'stage' : 'status';
  const out = { n: rs.length, mode, statusKey, stageKey };
  workSituationModeCache.set(rs, out);
  return out;
}
function workSituation(r, p) {
  const m = workSituationMode(p);
  const label = m.mode === 'stage' ? workStageLabel(r[m.stageKey]) : workStatusLabel(r[m.statusKey]);
  return label || 'Não informado';
}
