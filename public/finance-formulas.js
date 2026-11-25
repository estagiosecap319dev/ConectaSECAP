/* ============================================================================
   SECAP · FÓRMULAS FINANCEIRAS CONFIGURÁVEIS
   O administrador escolhe, em cada projeto, o campo de resultado e a fórmula:
   uma operação pronta (somar, subtrair, multiplicar, dividir, percentual) com os
   campos marcados, ou uma expressão livre no estilo da planilha.
   As fórmulas ficam em project.financeFormulas, já em ordem de cálculo, cada uma
   com a árvore da conta ("ast"). O banco (supabase/security/financial_formulas.sql)
   lê essa mesma árvore e grava o resultado; aqui o formulário mostra o cálculo na hora.

   Regras iguais às da planilha (Google Sheets):
   - SOMA ignora texto e vazio;
   - numa conta, vazio vale 0 e texto dá erro;
   - erro (inclusive divisão por zero) deixa o resultado vazio (como IFERROR(...;""));
   - um resultado vazio vale 0 quando entra em outra conta.
   ============================================================================ */

const FIN_MAX_FORMULAS = 100;
const FIN_MAX_DEPTH = 40;

// ---------------------------------------------------------------- valores
function finSumArg(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const s = String(v ?? '').trim();
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : 0;
}
function finCalcArg(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v ?? '').trim();
  if (!s) return 0;
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
}
// Data -> número de série do Sheets (dias desde 30/12/1899); vazio = 0; texto = erro.
function finDateArg(v) {
  const s = String(v ?? '').trim();
  if (!s) return 0;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return Number.isNaN(t) ? null : Math.round((t - Date.UTC(1899, 11, 30)) / 86400000);
}
const finSerial = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000);
function finRound(n, places = 2) {
  const f = 10 ** places;
  return (Math.sign(n) * Math.round(Math.abs(n) * f + 1e-9)) / f;
}

// ---------------------------------------------------------------- avaliação da árvore
// Nós: {t:'num',v} {t:'ref',f} {t:'sum',f:[ids]} {t:'op',o:'+-*/',a,b} {t:'neg',a}
//      {t:'cmp',o:'= <> < > <= >=',a,b} {t:'if',c,a,b} {t:'fn',n:'max|min|round',args}
//      {t:'split',y:ano,v:campoValor,s:campoInicio,d:campoDias}   (RATEIO_ANO)
function finEval(node, get, depth = 0) {
  if (!node || depth > FIN_MAX_DEPTH) return null;
  const ev = (x) => finEval(x, get, depth + 1);
  switch (node.t) {
    case 'num':
      return Number.isFinite(node.v) ? node.v : null;
    case 'ref':
      return finCalcArg(get(node.f));
    case 'sum':
      return (node.f || []).reduce((a, id) => a + finSumArg(get(id)), 0);
    case 'neg': {
      const a = ev(node.a);
      return a === null ? null : -a;
    }
    case 'op': {
      const a = ev(node.a), b = ev(node.b);
      if (a === null || b === null) return null;
      if (node.o === '+') return a + b;
      if (node.o === '-') return a - b;
      if (node.o === '*') return a * b;
      if (node.o === '/') return b === 0 ? null : a / b;
      return null;
    }
    case 'cmp': {
      const a = ev(node.a), b = ev(node.b);
      if (a === null || b === null) return null;
      const r = { '=': a === b, '<>': a !== b, '<': a < b, '>': a > b, '<=': a <= b, '>=': a >= b }[node.o];
      return r === undefined ? null : r ? 1 : 0;
    }
    case 'if': {
      const c = ev(node.c);
      if (c === null) return null;
      return c !== 0 ? ev(node.a) : ev(node.b);
    }
    case 'fn': {
      const args = (node.args || []).map(ev);
      if (args.some((x) => x === null) || !args.length) return null;
      if (node.n === 'max') return Math.max(...args);
      if (node.n === 'min') return Math.min(...args);
      if (node.n === 'round') return finRound(args[0], Math.max(0, Math.min(10, Math.trunc(args[1] ?? 0))));
      return null;
    }
    case 'split': {
      const q = finCalcArg(get(node.v)), z = finDateArg(get(node.s)), aa = finCalcArg(get(node.d));
      const y = Number(node.y);
      if (q === null || z === null || aa === null || aa === 0 || !Number.isInteger(y)) return null;
      const days = Math.max(0, Math.min(z + aa - 1, finSerial(y, 12, 31)) - Math.max(z, finSerial(y, 1, 1)) + 1);
      return finRound(days * (q / aa), 2);
    }
    default:
      return null;
  }
}

// Aplica as fórmulas do projeto. get(id) lê o valor atual; devolve {campo: número ou ''}.
function financeCompute(p, get) {
  const out = {};
  const read = (id) => (Object.prototype.hasOwnProperty.call(out, id) ? out[id] : get(id));
  for (const f of financeFormulasOf(p)) {
    const v = finEval(f.ast, read);
    out[f.target] = v === null || !Number.isFinite(v) ? '' : finRound(v, 2);
  }
  return out;
}
function financeFormulasOf(p) {
  return Array.isArray(p?.financeFormulas) ? p.financeFormulas.filter((f) => f && f.target && f.ast) : [];
}
function financeTargets(p) {
  return new Set(financeFormulasOf(p).map((f) => String(f.target)));
}

// ---------------------------------------------------------------- expressão livre
// Ex.: SE([Valor com solicitação] = 0; RATEIO_ANO(2026; [Valor]; [Início]; [Dias]); SOMA([A]; [B]))
// Campos entre colchetes, pelo nome. Números com vírgula ou ponto decimal. Argumentos separados por ;
const FIN_FUNCS = {
  SOMA: 'sum', SUM: 'sum', SE: 'if', IF: 'if', MAXIMO: 'max', MAX: 'max', MINIMO: 'min', MIN: 'min',
  ARRED: 'round', ARREDONDAR: 'round', ROUND: 'round', RATEIOANO: 'split',
};
function finKey(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
function finFieldByName(p, name) {
  const key = finKey(name);
  const fields = p?.fields || [];
  return fields.find((f) => String(f.id) === String(name).trim()) || fields.find((f) => finKey(f.name) === key) || null;
}
function finTokenize(text) {
  const tokens = [];
  const s = String(text ?? '');
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '[') {
      const j = s.indexOf(']', i);
      if (j < 0) throw new Error('Falta fechar o colchete ] de um campo.');
      tokens.push({ k: 'field', v: s.slice(i + 1, j).trim(), at: i });
      i = j + 1; continue;
    }
    const num = /^\d+(?:[.,]\d+)?/.exec(s.slice(i));
    if (num) { tokens.push({ k: 'num', v: Number(num[0].replace(',', '.')), at: i }); i += num[0].length; continue; }
    const word = /^[A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ_0-9]*/.exec(s.slice(i));
    if (word) { tokens.push({ k: 'word', v: word[0], at: i }); i += word[0].length; continue; }
    const two = s.slice(i, i + 2);
    if (['<>', '<=', '>='].includes(two)) { tokens.push({ k: 'op', v: two, at: i }); i += 2; continue; }
    if ('+-*/×÷=<>();'.includes(c)) {
      const v = c === '×' ? '*' : c === '÷' ? '/' : c;
      tokens.push({ k: '()'.includes(c) || c === ';' ? c : 'op', v, at: i });
      i++; continue;
    }
    throw new Error(`Caractere não reconhecido: "${c}".`);
  }
  return tokens;
}
// Gramática: cmp := add (('='|'<>'|'<'|'>'|'<='|'>=') add)?; add := mul (('+'|'-') mul)*;
//            mul := unary (('*'|'/') unary)*; unary := '-' unary | primary
function finParse(p, text) {
  const tokens = finTokenize(text);
  if (!tokens.length) throw new Error('Escreva a fórmula.');
  let i = 0;
  const peek = () => tokens[i];
  const take = (k, v) => {
    const t = tokens[i];
    if (!t || t.k !== k || (v !== undefined && t.v !== v)) return null;
    i++;
    return t;
  };
  const expect = (k, v, msg) => take(k, v) || (() => { throw new Error(msg); })();
  const fieldId = (name) => {
    const f = finFieldByName(p, name);
    if (!f) throw new Error(`Campo não encontrado: [${name}].`);
    return String(f.id);
  };
  function primary() {
    const t = peek();
    if (!t) throw new Error('A fórmula terminou antes do esperado.');
    if (take('num')) return { t: 'num', v: t.v };
    if (take('field')) return { t: 'ref', f: fieldId(t.v) };
    if (take('(')) {
      const e = cmp();
      expect(')', undefined, 'Falta fechar um parêntese ).');
      return e;
    }
    if (take('word')) {
      const fn = FIN_FUNCS[finKey(t.v).toUpperCase()];
      if (!fn) throw new Error(`Função desconhecida: ${t.v}. Use SOMA, SE, MÁXIMO, MÍNIMO, ARRED ou RATEIO_ANO.`);
      expect('(', undefined, `Depois de ${t.v} abra parênteses.`);
      const args = [];
      if (!take(')')) {
        do args.push(fn === 'sum' && peek()?.k === 'field' ? { field: take('field').v } : cmp());
        while (take(';'));
        expect(')', undefined, `Falta fechar o parêntese de ${t.v}.`);
      }
      if (fn === 'sum') {
        if (!args.length || args.some((a) => !a.field)) throw new Error('SOMA aceita apenas campos: SOMA([Campo A]; [Campo B]).');
        return { t: 'sum', f: args.map((a) => fieldId(a.field)) };
      }
      if (fn === 'if') {
        if (args.length !== 3) throw new Error('SE precisa de 3 partes: SE(condição; se verdadeiro; se falso).');
        return { t: 'if', c: args[0], a: args[1], b: args[2] };
      }
      if (fn === 'round') {
        if (args.length < 1 || args.length > 2) throw new Error('ARRED precisa de 1 ou 2 partes: ARRED(valor; casas).');
        return { t: 'fn', n: 'round', args };
      }
      if (fn === 'split') {
        const raw = args;
        if (raw.length !== 4 || raw[0].t !== 'num' || raw.slice(1).some((a) => a.t !== 'ref'))
          throw new Error('RATEIO_ANO precisa de: RATEIO_ANO(ano; [Valor]; [Data de início]; [Dias]).');
        return { t: 'split', y: raw[0].v, v: raw[1].f, s: raw[2].f, d: raw[3].f };
      }
      if (!args.length) throw new Error(`${t.v} precisa de pelo menos um valor.`);
      return { t: 'fn', n: fn, args };
    }
    throw new Error(`Esperado um valor, campo ou função, mas veio "${t.v}".`);
  }
  function unary() {
    if (take('op', '-')) return { t: 'neg', a: unary() };
    if (take('op', '+')) return unary();
    return primary();
  }
  function mul() {
    let a = unary();
    for (let t; (t = peek()) && t.k === 'op' && ['*', '/'].includes(t.v); ) {
      i++;
      a = { t: 'op', o: t.v, a, b: unary() };
    }
    return a;
  }
  function add() {
    let a = mul();
    for (let t; (t = peek()) && t.k === 'op' && ['+', '-'].includes(t.v); ) {
      i++;
      a = { t: 'op', o: t.v, a, b: mul() };
    }
    return a;
  }
  function cmp() {
    const a = add();
    const t = peek();
    if (t && t.k === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(t.v)) {
      i++;
      return { t: 'cmp', o: t.v, a, b: add() };
    }
    return a;
  }
  const ast = cmp();
  if (i < tokens.length) throw new Error(`Sobrou "${tokens[i].v}" no fim da fórmula.`);
  return ast;
}
// Árvore -> texto com nomes dos campos (para mostrar e editar).
function finFormat(p, n) {
  const name = (id) => `[${(p?.fields || []).find((f) => String(f.id) === String(id))?.name || id}]`;
  const num = (v) => String(v).replace('.', ',');
  const fmt = (x) => finFormat(p, x);
  switch (n?.t) {
    case 'num': return num(n.v);
    case 'ref': return name(n.f);
    case 'sum': return `SOMA(${n.f.map(name).join('; ')})`;
    case 'neg': return `-${fmt(n.a)}`;
    case 'op': return `(${fmt(n.a)} ${n.o === '*' ? '×' : n.o === '/' ? '÷' : n.o} ${fmt(n.b)})`;
    case 'cmp': return `${fmt(n.a)} ${n.o} ${fmt(n.b)}`;
    case 'if': return `SE(${fmt(n.c)}; ${fmt(n.a)}; ${fmt(n.b)})`;
    case 'fn': return `${{ max: 'MÁXIMO', min: 'MÍNIMO', round: 'ARRED' }[n.n]}(${n.args.map(fmt).join('; ')})`;
    case 'split': return `RATEIO_ANO(${n.y}; ${name(n.v)}; ${name(n.s)}; ${name(n.d)})`;
    default: return '';
  }
}
function finRefs(n, acc = new Set()) {
  if (!n) return acc;
  if (n.t === 'ref') acc.add(String(n.f));
  if (n.t === 'sum') n.f.forEach((f) => acc.add(String(f)));
  if (n.t === 'split') [n.v, n.s, n.d].forEach((f) => acc.add(String(f)));
  ['a', 'b', 'c'].forEach((k) => n[k] && finRefs(n[k], acc));
  (n.args || []).forEach((x) => finRefs(x, acc));
  return acc;
}

// Operações prontas -> árvore.
const FIN_KINDS = {
  sum: 'Somar os campos',
  subtract: 'Subtrair: primeiro campo menos os demais',
  multiply: 'Multiplicar os campos',
  divide: 'Dividir: primeiro campo ÷ segundo',
  percent: 'Percentual: primeiro campo ÷ segundo × 100',
  expression: 'Expressão livre (como na planilha)',
};
function finBuildAst(p, f) {
  const ids = (f.fields || []).map(String).filter((id) => (p.fields || []).some((x) => String(x.id) === id));
  const ref = (id) => ({ t: 'ref', f: id });
  if (f.kind === 'expression') return finParse(p, f.text);
  if (f.kind === 'sum') {
    if (ids.length < 1) throw new Error('Marque pelo menos um campo para somar.');
    return { t: 'sum', f: ids };
  }
  if (ids.length < 2) throw new Error('Escolha pelo menos dois campos.');
  if (f.kind === 'subtract') return ids.slice(1).reduce((a, id) => ({ t: 'op', o: '-', a, b: ref(id) }), ref(ids[0]));
  if (f.kind === 'multiply') return ids.slice(1).reduce((a, id) => ({ t: 'op', o: '*', a, b: ref(id) }), ref(ids[0]));
  if (f.kind === 'divide') return { t: 'op', o: '/', a: ref(ids[0]), b: ref(ids[1]) };
  if (f.kind === 'percent')
    return { t: 'op', o: '*', a: { t: 'op', o: '/', a: ref(ids[0]), b: ref(ids[1]) }, b: { t: 'num', v: 100 } };
  throw new Error('Escolha a operação.');
}
// Ordena para que uma fórmula que usa o resultado de outra venha depois dela; recusa ciclos.
function finOrder(list) {
  const byTarget = new Map(list.map((f) => [String(f.target), f]));
  const done = new Set(), visiting = new Set(), out = [];
  const visit = (f) => {
    const t = String(f.target);
    if (done.has(t)) return;
    if (visiting.has(t)) throw new Error(`As fórmulas formam um ciclo: o campo "${t}" depende dele mesmo.`);
    visiting.add(t);
    for (const id of finRefs(f.ast)) if (byTarget.has(id) && id !== t) visit(byTarget.get(id));
    if (finRefs(f.ast).has(t)) throw new Error('Uma fórmula não pode usar o próprio campo de resultado.');
    visiting.delete(t);
    done.add(t);
    out.push(f);
  };
  list.forEach(visit);
  return out;
}

// ---------------------------------------------------------------- modelo da planilha
// As fórmulas da aba PIPELINE, montadas com os campos do projeto (pelo id ou pelo nome).
function financeSheetPreset(p) {
  const has = (id) => (p.fields || []).some((f) => String(f.id) === id);
  const need = ['valor', 'prev_mobilizacao', 'f_previsaoexecucaodias_e9fa', 'federal_total', 'municipal_total', 'outros_total',
    'f_valorcomsolicitacaofinanceira_2010', 'total_2026', 'total_2027', 'total_2028', 'valor_total'];
  for (const src of ['federal', 'municipal', 'outros']) for (const y of [2026, 2027, 2028]) need.push(`${src}_${y}`);
  if (!need.every(has)) return null;
  const AL = 'f_valorcomsolicitacaofinanceira_2010';
  const yearSum = (y) => ({ t: 'sum', f: [`federal_${y}`, `municipal_${y}`, `outros_${y}`] });
  const noRequest = { t: 'cmp', o: '=', a: { t: 'ref', f: AL }, b: { t: 'num', v: 0 } };
  const split = (y) => ({ t: 'split', y, v: 'valor', s: 'prev_mobilizacao', d: 'f_previsaoexecucaodias_e9fa' });
  const minus = (a, b) => ({ t: 'op', o: '-', a, b });
  const mk = (target, ast) => ({ id: 'fin_' + target, target, kind: 'expression', ast, text: finFormat(p, ast), preset: true });
  return [
    mk('federal_total', { t: 'sum', f: ['federal_2026', 'federal_2027', 'federal_2028'] }),
    mk('municipal_total', { t: 'sum', f: ['municipal_2026', 'municipal_2027', 'municipal_2028'] }),
    mk('outros_total', { t: 'sum', f: ['outros_2026', 'outros_2027', 'outros_2028'] }),
    mk(AL, { t: 'sum', f: ['federal_total', 'municipal_total', 'outros_total'] }),
    mk('total_2026', { t: 'if', c: noRequest, a: split(2026), b: yearSum(2026) }),
    mk('total_2027', { t: 'if', c: noRequest, a: split(2027), b: yearSum(2027) }),
    mk('total_2028', {
      t: 'if', c: noRequest,
      a: { t: 'fn', n: 'max', args: [{ t: 'num', v: 0 }, minus(minus({ t: 'ref', f: 'valor' }, { t: 'ref', f: 'total_2026' }), { t: 'ref', f: 'total_2027' })] },
      b: yearSum(2028),
    }),
    mk('valor_total', { t: 'sum', f: ['total_2026', 'total_2027', 'total_2028'] }),
  ];
}

// ---------------------------------------------------------------- formulário da obra
const finInputFieldBefore = inputField;
inputField = function (f, value, disabled) {
  let html = finInputFieldBefore(f, value, disabled);
  const p = (typeof visible === 'function' ? visible() : db.projects || []).find((x) => (x.fields || []).includes(f));
  if (!p || !financeTargets(p).has(String(f?.id))) return html;
  html = html.replace('<div class="field">', '<div class="field" data-fin-computed="1">');
  html = html.replace('class="currency-input"', 'class="currency-input" readonly tabindex="-1"');
  html = html.replace(/(<input [^>]*type="(?:number|text)"[^>]*?)(>)/, (m, a, b) => (/currency-input|type="hidden"/.test(a) ? m : `${a} readonly tabindex="-1"${b}`));
  return html.replace(/<small>[^<]*<\/small><\/div>$/, '<small>Calculado automaticamente pela fórmula do projeto.</small></div>');
};
function financeFormProject(form) {
  const names = new Set([...form.querySelectorAll('[name]')].map((el) => el.name));
  return (typeof visible === 'function' ? visible() : db.projects || []).find(
    (p) => financeFormulasOf(p).length && [...financeTargets(p)].some((t) => names.has(t))
  );
}
function financeRecalcForm(form) {
  if (!form?.querySelector?.('[data-fin-computed]')) return;
  const p = financeFormProject(form);
  if (!p) return;
  const el = (name) => form.querySelector(`[name="${CSS.escape(name)}"]`);
  const result = financeCompute(p, (id) => el(id)?.value ?? '');
  for (const [id, v] of Object.entries(result)) {
    const input = el(id);
    if (!input) continue;
    const raw = v === '' ? '' : String(v);
    const original = input.dataset.originalValue ?? '';
    const same = raw === ''
      ? original.trim() === ''
      : original.trim() !== '' && finCalcArg(original) !== null && finRound(finCalcArg(original)) === v;
    input.value = same ? original : raw;
    const shown = form.querySelector(`.currency-input[data-currency-for="${CSS.escape(id)}"]`);
    if (shown) shown.value = typeof currencyInputText === 'function' ? currencyInputText(input.value) : input.value;
  }
}
['input', 'change'].forEach((type) =>
  document.addEventListener(type, (e) => {
    const form = e.target?.closest?.('form');
    if (form && !e.target.closest('[data-fin-computed]')) financeRecalcForm(form);
  })
);
// Depois de salvar uma obra: o banco já recalculou; atualiza só essa obra na tela.
(function () {
  const backend = window.SECAP_OBRAS_BACKEND;
  if (!backend || typeof backend.saveObra !== 'function' || backend.saveObra.__finFormulas) return;
  const original = backend.saveObra;
  backend.saveObra = async function (projectId, record) {
    const result = await original.apply(this, arguments);
    const p = (db.projects || []).find((x) => String(x.id) === String(projectId));
    if (result?.ok !== false && record && p && financeFormulasOf(p).length) Object.assign(record, financeCompute(p, (id) => record[id]));
    return result;
  };
  backend.saveObra.__finFormulas = true;
})();

// ---------------------------------------------------------------- tela de configuração (administrador)
let finDraft = null;
function finNumericFields(p) {
  return (p?.fields || []).filter((f) => ['currency', 'number'].includes(f.type));
}
function finFieldName(p, id) {
  return (p?.fields || []).find((f) => String(f.id) === String(id))?.name || id;
}
function openFinanceFormulas(pid) {
  if (!isSysAdmin()) return notify('Somente administradores configuram fórmulas.');
  const p = db.projects.find((x) => x.id === pid);
  if (!p) return;
  const list = financeFormulasOf(p);
  const preset = financeSheetPreset(p);
  const rows = list.map((f) => `<article class="fin-formula-row"><div><b>${esc(finFieldName(p, f.target))}</b><code>= ${esc(finFormat(p, f.ast))}</code>${f.preset ? '<small>Modelo da planilha</small>' : ''}</div><div class="fin-formula-actions">${btn('Editar', `editFinanceFormula('${esc(pid)}','${esc(f.id)}')`, 'edit')}${btn('Remover', `removeFinanceFormula('${esc(pid)}','${esc(f.id)}')`, 'trash')}</div></article>`).join('');
  modal(
    'Fórmulas financeiras · ' + esc(p.name),
    `<p class="subtitle">Escolha o campo de resultado e como ele é calculado. O valor é recalculado sempre que uma obra é salva (no portal, pela planilha ou por importação) e aparece como “calculado” no formulário.</p>
     ${rows ? `<div class="fin-formula-list">${rows}</div>` : '<div class="fin-empty">Nenhuma fórmula neste projeto.</div>'}
     <div class="fin-formula-tools">${btn('Nova fórmula', `editFinanceFormula('${esc(pid)}')`, 'plus', 'primary')}${preset ? btn('Aplicar modelo da planilha', `applyFinanceSheetPreset('${esc(pid)}')`, 'sheet') : ''}${list.length ? btn('Recalcular obras agora', `recalcFinanceObras('${esc(pid)}')`, 'history') : ''}</div>
     ${preset ? '<p class="fin-note">O modelo da planilha cria as fórmulas de totais por fonte, valor com solicitação financeira, subtotais 2026/2027/2028 (com o rateio pelos dias de execução) e valor total. Depois de aplicado, cada fórmula pode ser editada ou removida.</p>' : ''}`,
    btn('Fechar', 'closeModal()', 'close')
  );
}
function editFinanceFormula(pid, fid = '') {
  const p = db.projects.find((x) => x.id === pid);
  if (!p || !isSysAdmin()) return;
  const f = financeFormulasOf(p).find((x) => x.id === fid);
  finDraft = {
    pid, id: f?.id || '', target: f?.target || '', kind: f?.kind || 'sum',
    fields: [...(f?.fields || [])], text: f ? (f.kind === 'expression' ? finFormat(p, f.ast) : f.text || '') : '',
  };
  renderFinanceFormulaEditor();
}
function readFinanceFormulaEditor() {
  const form = document.getElementById('finFormulaForm');
  if (!form || !finDraft) return;
  const d = new FormData(form);
  finDraft.target = String(d.get('target') || '');
  const kind = String(d.get('kind') || 'sum');
  if (kind !== finDraft.kind && kind === 'expression' && !finDraft.text && finDraft.fields.length) {
    const p = db.projects.find((x) => x.id === finDraft.pid);
    try { finDraft.text = finFormat(p, finBuildAst(p, finDraft)); } catch (e) { /* sem campos suficientes */ }
  }
  finDraft.kind = kind;
  if (d.has('text')) finDraft.text = String(d.get('text') || '');
  if (kind === 'sum' || kind === 'multiply' || kind === 'subtract') {
    const first = String(d.get('first') || '');
    const rest = d.getAll('fields').map(String).filter((id) => id !== first);
    finDraft.fields = kind === 'subtract' ? (first ? [first, ...rest] : rest) : d.getAll('fields').map(String);
  } else if (kind === 'divide' || kind === 'percent') {
    finDraft.fields = [String(d.get('first') || ''), String(d.get('second') || '')].filter(Boolean);
  }
}
function updateFinanceFormulaEditor() {
  readFinanceFormulaEditor();
  renderFinanceFormulaEditor();
}
function finInsertField(name) {
  const area = document.querySelector('#finFormulaForm textarea[name="text"]');
  if (!area) return;
  const at = area.selectionStart ?? area.value.length;
  area.value = area.value.slice(0, at) + `[${name}]` + area.value.slice(area.selectionEnd ?? at);
  area.focus();
  finDraft.text = area.value;
}
function finPreview(p, draft) {
  let ast;
  try {
    ast = finBuildAst(p, draft);
  } catch (e) {
    return { error: e.message };
  }
  const others = financeFormulasOf(p).filter((f) => f.id !== draft.id);
  try {
    finOrder([...others, { ...draft, id: draft.id || 'novo', ast }]);
  } catch (e) {
    return { error: e.message };
  }
  const sample = (p.records || []).slice(0, 3).map((r) => {
    const values = financeCompute({ financeFormulas: finOrder([...others, { ...draft, id: 'novo', ast }]) }, (id) => r[id]);
    const v = values[draft.target];
    return { name: typeof recordTitle === 'function' ? recordTitle(r, p) : r.nome, value: v === '' ? 'vazio (erro ou sem dados)' : typeof money === 'function' ? Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v };
  });
  return { ast, text: finFormat(p, ast), sample };
}
function renderFinanceFormulaEditor() {
  const d = finDraft;
  const p = db.projects.find((x) => x.id === d.pid);
  const numeric = finNumericFields(p);
  const used = new Set(financeFormulasOf(p).filter((f) => f.id !== d.id).map((f) => String(f.target)));
  const opt = (id, sel) => `<option value="${esc(id)}" ${String(sel) === String(id) ? 'selected' : ''}>${esc(finFieldName(p, id))}</option>`;
  const targets = numeric.filter((f) => !used.has(String(f.id)));
  let body = `<form id="finFormulaForm" onsubmit="event.preventDefault();saveFinanceFormula()">
    <div class="twocol"><div class="field"><label>Campo de resultado</label><select name="target" onchange="updateFinanceFormulaEditor()"><option value="">Escolha o campo...</option>${targets.map((f) => opt(f.id, d.target)).join('')}</select><small>Só campos de valor (R$) ou número. Campos que já têm fórmula não aparecem.</small></div>
    <div class="field"><label>Como calcular</label><select name="kind" onchange="updateFinanceFormulaEditor()">${Object.entries(FIN_KINDS).map(([k, n]) => `<option value="${k}" ${d.kind === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>`;
  const choices = numeric.filter((f) => String(f.id) !== d.target);
  if (d.kind === 'sum' || d.kind === 'multiply') {
    body += `<fieldset class="fin-fields"><legend>Campos ${d.kind === 'sum' ? 'somados' : 'multiplicados'}</legend>${choices.map((f) => `<label><input type="checkbox" name="fields" value="${esc(f.id)}" ${d.fields.includes(String(f.id)) ? 'checked' : ''} onchange="updateFinanceFormulaEditor()"> ${esc(f.name)}</label>`).join('')}</fieldset>`;
  } else if (d.kind === 'subtract') {
    body += `<div class="field"><label>Valor inicial</label><select name="first" onchange="updateFinanceFormulaEditor()"><option value="">Escolha...</option>${choices.map((f) => opt(f.id, d.fields[0])).join('')}</select></div><fieldset class="fin-fields"><legend>Descontar</legend>${choices.filter((f) => String(f.id) !== d.fields[0]).map((f) => `<label><input type="checkbox" name="fields" value="${esc(f.id)}" ${d.fields.slice(1).includes(String(f.id)) ? 'checked' : ''} onchange="updateFinanceFormulaEditor()"> ${esc(f.name)}</label>`).join('')}</fieldset>`;
  } else if (d.kind === 'divide' || d.kind === 'percent') {
    body += `<div class="twocol"><div class="field"><label>${d.kind === 'percent' ? 'Parte' : 'Dividendo'}</label><select name="first" onchange="updateFinanceFormulaEditor()"><option value="">Escolha...</option>${choices.map((f) => opt(f.id, d.fields[0])).join('')}</select></div><div class="field"><label>${d.kind === 'percent' ? 'Total' : 'Divisor'}</label><select name="second" onchange="updateFinanceFormulaEditor()"><option value="">Escolha...</option>${choices.map((f) => opt(f.id, d.fields[1])).join('')}</select></div></div>`;
  } else {
    const all = (p.fields || []).filter((f) => String(f.id) !== d.target && ['currency', 'number', 'date', 'text', 'select'].includes(f.type));
    body += `<div class="field"><label>Fórmula</label><textarea name="text" rows="5" spellcheck="false" placeholder="Ex.: [Recursos Federais 2026.] + [Recursos Municipais 2026]" oninput="finDraft.text=this.value" onchange="updateFinanceFormulaEditor()">${esc(d.text)}</textarea><small>Campos entre colchetes, pelo nome. Use + − × ÷ e parênteses; argumentos de função separados por “;”. Funções: SOMA([A]; [B]), SE(condição; se sim; se não), MÁXIMO(…), MÍNIMO(…), ARRED(valor; casas), RATEIO_ANO(ano; [Valor]; [Data de início]; [Dias]).</small></div>
      <details class="fin-insert"><summary>Inserir um campo</summary><div>${all.map((f) => `<button type="button" class="fin-chip" onclick="finInsertField(this.dataset.name)" data-name="${esc(f.name)}">${esc(f.name)}</button>`).join('')}</div></details>
      <button type="button" class="btn" onclick="updateFinanceFormulaEditor()">Conferir fórmula</button>`;
  }
  const pv = d.target ? finPreview(p, d) : { error: 'Escolha o campo de resultado.' };
  body += pv.error
    ? `<div class="fin-preview is-error" role="alert">${esc(pv.error)}</div>`
    : `<div class="fin-preview"><small>FÓRMULA</small><code>${esc(finFieldName(p, d.target))} = ${esc(pv.text)}</code><small>RESULTADO EM ALGUMAS OBRAS</small><ul>${pv.sample.map((s) => `<li><span>${esc(s.name)}</span><b>${esc(String(s.value))}</b></li>`).join('') || '<li>Nenhuma obra para mostrar.</li>'}</ul></div>`;
  body += '</form>';
  modal(d.id ? 'Editar fórmula' : 'Nova fórmula', body,
    btn('Voltar', `openFinanceFormulas('${esc(d.pid)}')`, 'arrow') + '<button class="btn primary" type="submit" form="finFormulaForm">Salvar fórmula</button>');
}
function saveFinanceFormula() {
  readFinanceFormulaEditor();
  const d = finDraft;
  const p = db.projects.find((x) => x.id === d?.pid);
  if (!p || !isSysAdmin()) return;
  if (!d.target) return notify('Escolha o campo de resultado.');
  let ast;
  try {
    ast = finBuildAst(p, d);
  } catch (e) {
    return notify(e.message);
  }
  const formula = { id: d.id || 'fin_' + (typeof uid === 'function' ? uid() : Date.now()), target: d.target, kind: d.kind, fields: d.kind === 'expression' ? [] : d.fields, text: finFormat(p, ast), ast };
  const others = financeFormulasOf(p).filter((f) => f.id !== formula.id && f.target !== formula.target);
  let ordered;
  try {
    ordered = finOrder([...others, formula]);
  } catch (e) {
    return notify(e.message);
  }
  if (ordered.length > FIN_MAX_FORMULAS) return notify(`Limite de ${FIN_MAX_FORMULAS} fórmulas por projeto.`);
  p.financeFormulas = ordered;
  persist(d.id ? 'Alterou fórmula financeira' : 'Criou fórmula financeira', p, '', `${finFieldName(p, d.target)} = ${formula.text}`, finFieldName(p, d.target));
  finDraft = null;
  openFinanceFormulas(p.id);
  notify('Fórmula salva. Use “Recalcular obras agora” para atualizar as obras existentes.');
}
function removeFinanceFormula(pid, fid) {
  const p = db.projects.find((x) => x.id === pid);
  if (!p || !isSysAdmin()) return;
  const f = financeFormulasOf(p).find((x) => x.id === fid);
  if (!f) return;
  modal('Remover esta fórmula?', `<p>O campo <b>${esc(finFieldName(p, f.target))}</b> volta a ser preenchido à mão (e pela planilha). Os valores já gravados nas obras não são apagados.</p>`,
    btn('Voltar', `openFinanceFormulas('${esc(pid)}')`, 'arrow') + btn('Remover', `confirmRemoveFinanceFormula('${esc(pid)}','${esc(fid)}')`, 'trash', 'primary'));
}
function confirmRemoveFinanceFormula(pid, fid) {
  const p = db.projects.find((x) => x.id === pid);
  if (!p || !isSysAdmin()) return;
  const f = financeFormulasOf(p).find((x) => x.id === fid);
  p.financeFormulas = financeFormulasOf(p).filter((x) => x.id !== fid);
  persist('Removeu fórmula financeira', p, f ? `${finFieldName(p, f.target)} = ${finFormat(p, f.ast)}` : '', '', f ? finFieldName(p, f.target) : '');
  openFinanceFormulas(pid);
}
function applyFinanceSheetPreset(pid) {
  const p = db.projects.find((x) => x.id === pid);
  if (!p || !isSysAdmin()) return;
  const preset = financeSheetPreset(p);
  if (!preset) return notify('Este projeto não tem os campos usados pelas fórmulas da planilha.');
  const replaced = financeFormulasOf(p).filter((f) => preset.some((x) => x.target === f.target));
  const keep = financeFormulasOf(p).filter((f) => !preset.some((x) => x.target === f.target));
  try {
    p.financeFormulas = finOrder([...keep, ...preset]);
  } catch (e) {
    return notify(e.message);
  }
  persist('Aplicou modelo de fórmulas da planilha', p, replaced.length ? `${replaced.length} fórmula(s) substituída(s)` : '', `${preset.length} fórmulas`, 'Fórmulas financeiras');
  openFinanceFormulas(pid);
  notify('Modelo aplicado. Use “Recalcular obras agora” para atualizar as obras existentes.');
}
async function recalcFinanceObras(pid) {
  const p = db.projects.find((x) => x.id === pid);
  if (!p || !isSysAdmin()) return;
  const sb = window.sb;
  if (!sb?.rpc) return notify('Recálculo disponível apenas com o banco conectado.');
  if (typeof saveChain !== 'undefined') await saveChain; // garante que as fórmulas já foram gravadas
  const { data, error } = await sb.rpc('secap_financial_recalc', { p_project: String(pid) });
  if (error) return notify('Não foi possível recalcular: ' + error.message);
  for (const r of p.records || []) Object.assign(r, financeCompute(p, (id) => r[id]));
  render();
  notify(`${Number(data) || 0} obra(s) recalculada(s).`);
}

// Botão "Fórmulas financeiras" ao lado de "Configurar seções e campos" (somente administradores).
const finHeadBefore = head;
head = function (k, title, sub, actions = '') {
  if (isSysAdmin?.() && typeof actions === 'string' && actions.includes('editFields(')) {
    const pid = /editFields\('([^']+)'\)/.exec(actions)?.[1];
    if (pid) actions += btn('Fórmulas financeiras', `openFinanceFormulas('${pid}')`, 'money');
  }
  return finHeadBefore(k, title, sub, actions);
};
