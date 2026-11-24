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
    andamento:'Em andamento', emandamento:'Em andamento', emexecucao:'Em andamento',
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
