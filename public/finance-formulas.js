/* ============================================================================
   SECAP · FÓRMULAS DO MÓDULO FINANCEIRO (prévia no formulário da obra)
   Mesmas fórmulas da planilha (aba PIPELINE) e do banco
   (supabase/security/financial_formulas.sql). O banco é quem grava o resultado;
   aqui o formulário só mostra o cálculo na hora, enquanto a pessoa digita.
   ============================================================================ */

const FIN_COMPUTED = [
  'federal_total', 'municipal_total', 'outros_total', 'f_valorcomsolicitacaofinanceira_2010',
  'total_2026', 'total_2027', 'total_2028', 'valor_total',
];
const FIN_INPUTS = [
  'valor', 'prev_mobilizacao', 'f_previsaoexecucaodias_e9fa',
  'federal_2026', 'federal_2027', 'federal_2028', 'municipal_2026', 'municipal_2027', 'municipal_2028',
  'outros_2026', 'outros_2027', 'outros_2028',
];
const FIN_COMPUTED_SET = new Set(FIN_COMPUTED);

// Projeto com os campos das fórmulas (hoje, a pasta de obras sincronizada com a planilha).
function financeFormulasProject(p) {
  const ids = new Set((p?.fields || []).map((f) => String(f.id)));
  return FIN_COMPUTED.every((id) => ids.has(id)) && FIN_INPUTS.every((id) => ids.has(id));
}

// SUM da planilha: número; texto e vazio contam 0.
function finSumArg(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const s = String(v ?? '').trim();
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : 0;
}
// Numa conta: vazio = 0; número; texto = erro (null).
function finCalcArg(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v ?? '').trim();
  if (!s) return 0;
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
}
// Data numa conta: número de série do Sheets (dias desde 30/12/1899); vazio = 0; texto = erro.
function finDateArg(v) {
  const s = String(v ?? '').trim();
  if (!s) return 0;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return Number.isNaN(t) ? null : Math.round((t - Date.UTC(1899, 11, 30)) / 86400000);
}
const finSerial = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000);
const finRound2 = (n) => Math.sign(n) * Math.round(Math.abs(n) * 100 + 1e-9) / 100;

// get(id) devolve o valor atual do campo. Resultado: { campo: número ou '' }.
function financeFormulas(get) {
  const sum3 = (a, b, c) => finSumArg(get(a)) + finSumArg(get(b)) + finSumArg(get(c));
  const fed = sum3('federal_2026', 'federal_2027', 'federal_2028');
  const mun = sum3('municipal_2026', 'municipal_2027', 'municipal_2028');
  const out = sum3('outros_2026', 'outros_2027', 'outros_2028');
  const al = fed + mun + out;
  const q = finCalcArg(get('valor')) ?? 0;
  const z = finDateArg(get('prev_mobilizacao'));
  const aa = finCalcArg(get('f_previsaoexecucaodias_e9fa'));
  const year = (y) => {
    if (al !== 0) return sum3('federal_' + y, 'municipal_' + y, 'outros_' + y);
    if (z === null || aa === null || aa === 0) return null; // IFERROR -> ""
    const days = Math.max(0, Math.min(z + aa - 1, finSerial(y, 12, 31)) - Math.max(z, finSerial(y, 1, 1)) + 1);
    return finRound2(days * (q / aa));
  };
  const t26 = year(2026), t27 = year(2027);
  // No Google Sheets, o "" do IFERROR vale 0 quando entra em outra conta.
  const t28 = al === 0 ? Math.max(0, q - (t26 ?? 0) - (t27 ?? 0)) : sum3('federal_2028', 'municipal_2028', 'outros_2028');
  const out2 = (n) => (n === null ? '' : finRound2(n));
  return {
    federal_total: out2(fed), municipal_total: out2(mun), outros_total: out2(out),
    f_valorcomsolicitacaofinanceira_2010: out2(al),
    total_2026: out2(t26), total_2027: out2(t27), total_2028: out2(t28),
    valor_total: out2((t26 ?? 0) + (t27 ?? 0) + (t28 ?? 0)),
  };
}

// Campos calculados no formulário: sem digitação, com o selo "calculado".
const finInputFieldBefore = inputField;
inputField = function (f, value, disabled) {
  let html = finInputFieldBefore(f, value, disabled);
  if (!FIN_COMPUTED_SET.has(String(f?.id))) return html;
  const p = (typeof visible === 'function' ? visible() : db.projects || []).find((x) => (x.fields || []).includes(f));
  if (!p || !financeFormulasProject(p)) return html;
  html = html.replace('<div class="field">', '<div class="field" data-fin-computed="1">');
  html = html.replace('class="currency-input"', 'class="currency-input" readonly tabindex="-1"');
  return html.replace(/<small>[^<]*<\/small><\/div>$/, '<small>Calculado automaticamente, com a mesma fórmula da planilha.</small></div>');
};

// Recalcula os campos calculados do formulário a partir do que está digitado agora.
function financeRecalcForm(form) {
  if (!form?.querySelector?.('[data-fin-computed]')) return;
  const el = (name) => form.querySelector(`[name="${CSS.escape(name)}"]`);
  const result = financeFormulas((id) => el(id)?.value ?? '');
  for (const [id, v] of Object.entries(result)) {
    const hidden = el(id);
    if (!hidden) continue;
    const raw = v === '' ? '' : String(v);
    const original = hidden.dataset.originalValue ?? '';
    // Mesmo valor que já estava salvo: mantém o texto original (não marca "alterado" à toa).
    const same =
      raw === ''
        ? original.trim() === ''
        : original.trim() !== '' && finCalcArg(original) !== null && finRound2(finCalcArg(original)) === v;
    hidden.value = same ? original : raw;
    const shown = form.querySelector(`.currency-input[data-currency-for="${CSS.escape(id)}"]`);
    if (shown) shown.value = typeof currencyInputText === 'function' ? currencyInputText(hidden.value) : hidden.value;
  }
}
document.addEventListener('input', (e) => {
  const form = e.target?.closest?.('form');
  if (form && !e.target.closest('[data-fin-computed]')) financeRecalcForm(form);
});
document.addEventListener('change', (e) => {
  const form = e.target?.closest?.('form');
  if (form && !e.target.closest('[data-fin-computed]')) financeRecalcForm(form);
});

// Depois de salvar uma obra: o banco já recalculou; atualiza só essa obra na tela com o mesmo
// cálculo (sem gravar nada), para o portal não mostrar o total antigo até recarregar.
(function () {
  const backend = window.SECAP_OBRAS_BACKEND;
  if (!backend || typeof backend.saveObra !== 'function' || backend.saveObra.__finFormulas) return;
  const original = backend.saveObra;
  backend.saveObra = async function (projectId, record) {
    const result = await original.apply(this, arguments);
    const p = (db.projects || []).find((x) => String(x.id) === String(projectId));
    if (result?.ok !== false && record && p && financeFormulasProject(p)) {
      Object.assign(record, financeFormulas((id) => record[id]));
    }
    return result;
  };
  backend.saveObra.__finFormulas = true;
})();
