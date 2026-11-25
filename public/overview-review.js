/* Visão geral e criação guiada. Somente leitura dos registros; configurações usam o layout existente. */
function overviewKey(v) { return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR'); }
function overviewNumber(value) { return value==null||String(value).trim()===''?null:visualNumber(value); }
// Critérios de conferência definidos pela pessoa (preferência pessoal salva neste navegador).
// Além dos limites, ela escreve as próprias regras: campo + condição + valor + mensagem.
// args: none = sem valor; one = compara com valor fixo ou outro campo; range = entre dois valores/campos;
//       pct = N% de um valor/campo; days = número de dias; list = lista separada por ;
const OVERVIEW_RULE_OPS={
  lt:{label:'menor que',args:'one'},lte:{label:'menor ou igual a',args:'one'},gt:{label:'maior que',args:'one'},gte:{label:'maior ou igual a',args:'one'},
  eq:{label:'igual a',args:'one'},neq:{label:'diferente de',args:'one'},
  between:{label:'está entre',args:'range'},notbetween:{label:'está fora do intervalo',args:'range'},
  pctgt:{label:'maior que N% de',args:'pct'},pctlt:{label:'menor que N% de',args:'pct'},diffpct:{label:'difere mais de N% de',args:'pct'},
  contains:{label:'contém o texto',args:'one'},notcontains:{label:'não contém o texto',args:'one'},startswith:{label:'começa com',args:'one'},endswith:{label:'termina com',args:'one'},
  inlist:{label:'é um destes (lista)',args:'list'},notinlist:{label:'não é nenhum destes (lista)',args:'list'},
  empty:{label:'está vazio',args:'none'},notempty:{label:'está preenchido',args:'none'},
  negative:{label:'é negativo',args:'none'},zero:{label:'é igual a zero',args:'none'},notnumber:{label:'não é um número válido',args:'none'},notdate:{label:'não é uma data válida',args:'none'},
  beforetoday:{label:'é data anterior a hoje',args:'none'},aftertoday:{label:'é data posterior a hoje',args:'none'},
  withindays:{label:'vence nos próximos N dias',args:'days'},olderthandays:{label:'passou há mais de N dias',args:'days'},
};
const OVERVIEW_RULE_KINDS={money:'Valores a conferir',date:'Datas a conferir',progress:'Percentuais a conferir'};
function overviewReviewKey(pid='') {return 'secap-review:'+String(session||'guest')+(pid?':'+pid:'');}
function overviewHasOwnCriteria(pid) {try{return !!pid&&localStorage.getItem(overviewReviewKey(pid))!==null;}catch(e){return false;}}
// pid vazio = padrão para todos os projetos; com pid, usa os critérios próprios do projeto ou, se não houver, o padrão.
function overviewSettings(pid='') {
  const defaults={minYear:2000,maxYear:new Date().getFullYear()+30,outlierFactor:10,maxAmount:null,minAmount:null,allowNegative:false,flagZero:false,checkSpentOverBudget:true,checkEndBeforeStart:true,checkOutliers:true,progressMin:0,progressMax:100,rules:[],notes:''};
  try { const s=JSON.parse((pid&&localStorage.getItem(overviewReviewKey(pid)))||localStorage.getItem(overviewReviewKey())||'null');
    const num=v=>v===''||v==null||!Number.isFinite(Number(v))?null:Number(v),bool=(v,d)=>typeof v==='boolean'?v:d;
    if(s) return {...defaults,minYear:Math.max(1900,Math.min(2099,Number(s.minYear)||defaults.minYear)),maxYear:Math.max(2000,Math.min(2200,Number(s.maxYear)||defaults.maxYear)),outlierFactor:Math.max(2,Math.min(100,Number(s.outlierFactor)||10)),maxAmount:s.maxAmount>0?Number(s.maxAmount):null,
      minAmount:num(s.minAmount),allowNegative:bool(s.allowNegative,false),flagZero:bool(s.flagZero,false),checkSpentOverBudget:bool(s.checkSpentOverBudget,true),checkEndBeforeStart:bool(s.checkEndBeforeStart,true),checkOutliers:bool(s.checkOutliers,true),
      progressMin:num(s.progressMin)??0,progressMax:num(s.progressMax)??100,rules:Array.isArray(s.rules)?s.rules.filter(r=>r&&r.field&&OVERVIEW_RULE_OPS[r.op]).map(overviewNormalizeRule):[],notes:String(s.notes||'')};
  } catch(e) {} return defaults;
}
// Regra salva -> formato atual (regras antigas tinham só campo, condição e valor fixo).
function overviewNormalizeRule(r) {
  const cond=c=>({field:String(c?.field||'').trim(),op:OVERVIEW_RULE_OPS[c?.op]?c.op:'lt',target:c?.target==='field'?'field':'value',value:String(c?.value??'').trim(),value2:String(c?.value2??'').trim()});
  return {...cond(r),kindAuto:r?.kindAuto===true,kind:OVERVIEW_RULE_KINDS[r?.kind]?r.kind:'money',message:String(r?.message||'').trim(),when:r?.when&&r.when.field?cond(r.when):null};
}
// Campo com este nome em algum projeto visível (para validar e sugerir a categoria da regra).
function overviewAnyField(name,pid=overviewReviewProject) {const k=overviewKey(name);if(!k)return null;for(const p of visible().filter(x=>!pid||x.id===pid)){const f=(p.fields||[]).find(x=>overviewKey(x.name)===k);if(f)return f;}return null;}
function overviewGuessKind(name) {
  const f=overviewAnyField(name);if(!f)return 'money';
  if(f.type==='date')return 'date';
  if(f.type==='percent'||/avanco|progresso|percentual/.test(importHeaderKey(f.name)))return 'progress';
  return 'money';
}
function overviewRuleField(p,name) {return (p?.fields||[]).find(f=>overviewKey(f.name)===overviewKey(name))||null;}
function overviewToday(offsetDays=0) {const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offsetDays);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
// Condição em uma obra: true / false, ou null quando um campo usado não existe no projeto (regra não se aplica).
function overviewCondHit(c,p,r) {
  const field=overviewRuleField(p,c.field);if(!field)return null;
  const meta=OVERVIEW_RULE_OPS[c.op]||{args:'one'},raw=String(r[field.id]??'').trim();
  // Lado direito: valor fixo ou valor de outro campo da mesma obra.
  const side=x=>{if(c.target!=='field'||!['one','range','pct'].includes(meta.args))return {raw:String(x??'').trim(),type:''};const f=overviewRuleField(p,x);return f?{raw:String(r[f.id]??'').trim(),type:f.type}:null;};
  const isDate=t=>field.type==='date'||t==='date';
  const asDate=v=>overviewKey(v)==='hoje'?overviewToday():spreadsheetDate(v)||null;
  const pair=(b,type)=>{if(isDate(type)){const x=asDate(raw),y=asDate(b);return x&&y?[x,y]:null;}const x=overviewNumber(raw),y=overviewNumber(b);return x!==null&&y!==null?[x,y]:null;};
  switch(c.op) {
    case 'empty':return !raw;
    case 'notempty':return !!raw;
    case 'negative':{const n=overviewNumber(raw);return n!==null&&n<0;}
    case 'zero':{const n=overviewNumber(raw);return n!==null&&n===0;}
    case 'notnumber':return !!raw&&overviewNumber(raw)===null;
    case 'notdate':return !!raw&&!spreadsheetDate(raw);
    case 'beforetoday':{const x=spreadsheetDate(raw);return !!x&&x<overviewToday();}
    case 'aftertoday':{const x=spreadsheetDate(raw);return !!x&&x>overviewToday();}
    case 'withindays':{const x=spreadsheetDate(raw),n=Number(c.value);return !!x&&Number.isFinite(n)&&x>=overviewToday()&&x<=overviewToday(n);}
    case 'olderthandays':{const x=spreadsheetDate(raw),n=Number(c.value);return !!x&&Number.isFinite(n)&&x<overviewToday(-n);}
    case 'inlist':case 'notinlist':{if(!raw)return false;const list=String(c.value).split(';').map(overviewKey).filter(Boolean),has=list.includes(overviewKey(raw));return c.op==='inlist'?has:!has;}
  }
  if(!raw)return false;
  if(meta.args==='range'){const a=side(c.value),b=side(c.value2);if(!a||!b)return null;const lo=pair(a.raw,a.type),hi=pair(b.raw,b.type);if(!lo||!hi)return false;const min=lo[1]<=hi[1]?lo[1]:hi[1],max=lo[1]<=hi[1]?hi[1]:lo[1],inside=lo[0]>=min&&lo[0]<=max;return c.op==='between'?inside:!inside;}
  const b=side(c.value);if(!b)return null;
  if(meta.args==='pct'){const x=overviewNumber(raw),y=overviewNumber(b.raw),n=Number(String(c.value2).replace(',','.'));if(x===null||y===null||!Number.isFinite(n))return false;const ref=y*n/100;
    if(c.op==='pctgt')return x>ref;if(c.op==='pctlt')return x<ref;return y===0?x!==0:Math.abs(x-y)/Math.abs(y)*100>n;}
  if(['contains','notcontains','startswith','endswith'].includes(c.op)){const x=overviewKey(raw),y=overviewKey(b.raw);if(!y)return false;
    return c.op==='contains'?x.includes(y):c.op==='notcontains'?!x.includes(y):c.op==='startswith'?x.startsWith(y):x.endsWith(y);}
  const v=pair(b.raw,b.type);
  if(!v){if(!b.raw)return false;if(c.op==='eq')return overviewKey(raw)===overviewKey(b.raw);if(c.op==='neq')return overviewKey(raw)!==overviewKey(b.raw);return false;}
  const [x,y]=v;return {lt:x<y,lte:x<=y,gt:x>y,gte:x>=y,eq:x===y,neq:x!==y}[c.op]||false;
}
// Texto da condição para a mensagem padrão.
function overviewCondText(c) {
  const meta=OVERVIEW_RULE_OPS[c.op]||{label:c.op,args:'one'},ref=x=>c.target==='field'?`[${x}]`:x;
  if(meta.args==='none')return `${c.field} ${meta.label}`;
  if(meta.args==='range')return `${c.field} ${meta.label} ${ref(c.value)} e ${ref(c.value2)}`;
  if(meta.args==='pct')return `${c.field} ${meta.label.replace('N%',c.value2+'%')} ${ref(c.value)}`;
  if(meta.args==='days')return `${c.field} ${meta.label.replace('N',c.value)}`;
  return `${c.field} ${meta.label} ${ref(c.value)}`;
}
function overviewRuleHit(rule,p,r) {
  const main=overviewCondHit(rule,p,r);if(!main)return false;
  if(rule.when){const extra=overviewCondHit(rule.when,p,r);if(!extra)return false;}
  return true;
}
function overviewDate(value, settings=overviewSettings()) {
  const raw=String(value??'').trim();if(!raw)return {date:'',valid:false,missing:true,reason:''};
  const date=spreadsheetDate(raw);
  if(!date)return {date:'',valid:false,missing:false,reason:'Data inválida ou formato não reconhecido'};
  const year=Number(date.slice(0,4));
  if(year<settings.minYear||year>settings.maxYear)return {date,valid:false,missing:false,reason:`Ano ${year} fora da faixa de conferência (${settings.minYear}–${settings.maxYear})`};
  return {date,valid:true,missing:false,reason:''};
}
function overviewDeadline(r,p,settings=overviewSettings(p?.id)) { const f=biField(p,'deadline');return {...overviewDate(f?r[f.id]:'',settings),field:f}; }
function overviewIdField(p) {return p?.fields?.find(f=>importHeaderKey(f.name)==='id')||p?.fields?.find(f=>f.id==='codigo');}
function overviewCompareId(a,b,p) {
  const f=overviewIdField(p);if(!f)return 0;
  const x=String(a[f.id]??'').trim(),y=String(b[f.id]??'').trim();
  if(!x||!y)return x?-1:y?1:0;
  return x.localeCompare(y,'pt-BR',{numeric:true,sensitivity:'base'});
}
function overviewReview(projects) {
  const issues=[],mapping=[],items=[];
  const add=(p,r,f,kind,reason,value)=>issues.push({p,r,field:f?.name||'Registro',kind,reason,value:String(value??'')});
  for(const p of projects) {
    const settings=overviewSettings(p.id);
    const budget=biField(p,'budget'),spent=biField(p,'spent'),progress=biField(p,'progress'),deadline=biField(p,'deadline'),start=biField(p,'startDate')||biDateField(p,'startDate');
    mapping.push({p,budget,spent,deadline,start});
    const dates=(p.fields||[]).filter(f=>f.type==='date'||(/vigencia|data.*(inicio|fim|entrega)|prazo.*(entrega|final|conclusao)/.test(importHeaderKey(f.name))&&!/dias|meses|duracao/.test(importHeaderKey(f.name))));
    const moneyFields=(p.fields||[]).filter(f=>f.type==='currency'||[budget?.id,spent?.id].includes(f.id)||/^(valor|orcamento|investimento|contrapartida|repasse|executado|captado)/.test(importHeaderKey(f.name)));
    const medians=new Map(),customRules=settings.rules.map(rule=>({rule,field:overviewRuleField(p,rule.field)})).filter(x=>x.field);
    for(const f of moneyFields) {
      const values=(p.records||[]).map(r=>overviewNumber(r[f.id])).filter(n=>n!==null&&n>0).sort((a,b)=>a-b);
      medians.set(f.id,values.length>=5?(values[Math.floor((values.length-1)/2)]+values[Math.ceil((values.length-1)/2)])/2:null);
    }
    for(const r of p.records||[]) {
      const d=overviewDeadline(r,p,settings),pv=budget?overviewNumber(r[budget.id]):null,sv=spent?overviewNumber(r[spent.id]):null;
      const status=typeof workSituation==='function'?workSituation(r,p):canonicalStatus(val(r,p,'status'));
      items.push({p,r,date:d,budget:pv,spent:sv,status,finished:isFinished(r,p),cancelled:/cancel/i.test(status)});
      for(const f of dates) {const v=r[f.id],check=overviewDate(v,settings);if(!check.missing&&!check.valid)add(p,r,f,'date',check.reason,v);}
      if(deadline&&!dates.some(f=>f.id===deadline.id)&&!d.valid&&!d.missing)add(p,r,deadline,'date',d.reason,r[deadline.id]);
      if(settings.checkEndBeforeStart&&start&&deadline) {const a=overviewDate(r[start.id],settings),b=overviewDate(r[deadline.id],settings);if(a.valid&&b.valid&&a.date>b.date)add(p,r,deadline,'date','Data final anterior à data inicial',r[deadline.id]);}
      for(const f of moneyFields) {
        const raw=r[f.id];if(raw==null||String(raw).trim()==='')continue;
        const value=overviewNumber(raw),median=medians.get(f.id);
        if(value===null)add(p,r,f,'money','Valor financeiro não reconhecido como número',raw);
        else if(value<0&&!settings.allowNegative)add(p,r,f,'money','Valor financeiro negativo (não permitido pelos seus critérios)',raw);
        else if(settings.minAmount!==null&&value<settings.minAmount)add(p,r,f,'money',`Abaixo do valor mínimo permitido: ${money(settings.minAmount)}`,raw);
        else if(settings.maxAmount&&value>settings.maxAmount)add(p,r,f,'money',`Acima do limite de conferência: ${money(settings.maxAmount)}`,raw);
        else if(value===0&&settings.flagZero)add(p,r,f,'money','Valor igual a zero (marcado para conferir pelos seus critérios)',raw);
        else if(settings.checkOutliers&&median&&value>median*settings.outlierFactor)add(p,r,f,'money',`Valor acima de ${settings.outlierFactor} vezes a mediana desta coluna no projeto; pode ser legítimo`,raw);
      }
      if(settings.checkSpentOverBudget&&pv!==null&&sv!==null&&pv>=0&&sv>pv)add(p,r,spent,'money','Valor executado maior que o previsto: conferir campos e valores',r[spent.id]);
      if(progress&&String(r[progress.id]??'').trim()) {const value=overviewNumber(r[progress.id]);if(value!==null&&(value<settings.progressMin||value>settings.progressMax))add(p,r,progress,'progress',`Percentual fora da faixa de ${settings.progressMin} a ${settings.progressMax}%`,r[progress.id]);}
      for(const {rule,field} of customRules) if(overviewRuleHit(rule,p,r))add(p,r,field,rule.kind,rule.message||`Regra: ${overviewCondText(rule)}${rule.when?` (quando ${overviewCondText(rule.when)})`:''}`,r[field.id]);
    }
  }
  return {issues,items,mapping,works:new Set(issues.map(i=>i.p.id+'|'+i.r.id)).size};
}
function overviewReviewPanel(projects) {
  const settings=overviewSettings(),report=overviewReview(projects),counts=k=>report.issues.filter(i=>i.kind===k).length,missing=report.mapping.filter(x=>!x.budget||!x.deadline).length;
  return `<section class="panel overview-review-panel"><div class="panelhead"><div><span class="overview-eyebrow">CONFERÊNCIA DOS DADOS</span><h2>Antes de apresentar os números</h2><small>Alertas para revisão humana. Nenhum registro é corrigido ou excluído automaticamente.${(()=>{const n=projects.filter(p=>overviewHasOwnCriteria(p.id)).length;return n?` ${n} projeto(s) com critérios próprios; as legendas abaixo mostram o padrão.`:'';})()}</small></div><button class="btn" onclick="openOverviewReviewSettings()">Critérios de conferência</button></div><div class="overview-review-grid"><button onclick="openOverviewReview('date')"><span>Datas a conferir</span><strong>${counts('date')}</strong><small>Anos fora de ${settings.minYear}–${settings.maxYear}${settings.checkEndBeforeStart?' e finais anteriores ao início':''}</small></button><button onclick="openOverviewReview('money')"><span>Valores a conferir</span><strong>${counts('money')}</strong><small>${settings.allowNegative?'Negativos permitidos':'Negativos'}, diferenças e valores fora dos seus critérios${settings.rules.length?` · ${settings.rules.length} regra(s) sua(s)`:''}</small></button><button onclick="openOverviewReview('progress')"><span>Percentuais a conferir</span><strong>${counts('progress')}</strong><small>Avanços fora da faixa de ${settings.progressMin} a ${settings.progressMax}%</small></button><button onclick="openOverviewAssociations()"><span>Associações pendentes</span><strong>${missing}</strong><small>Projetos sem coluna de valor previsto ou prazo associada</small></button></div><div class="overview-review-foot"><span>${report.works?`${report.works} obra(s) com ${report.issues.length} apontamento(s) para conferir · os cartões contam apontamentos, e uma obra pode ter mais de um`:'Nenhum alerta pelos critérios atuais; isso não substitui a conferência da origem.'}</span><button class="textbtn" onclick="openOverviewReview('all')">Ver a conferência completa →</button></div></section>`;
}
// Colunas que cada projeto usa como valor previsto, executado e prazo (a origem dos totais padrão).
function openOverviewAssociations() {
  const report=overviewReview(visible()),pending=x=>!x.budget||!x.deadline;
  const list=[...report.mapping].sort((a,b)=>pending(b)-pending(a));
  modal('Associações de colunas por projeto',`<p>Cada projeto usa uma coluna para o valor previsto, o executado e o prazo. Sem associação, a informação não entra nos totais padrão nem na conferência de prazos.</p>${list.map(x=>`<article class="overview-mapping"${pending(x)?' style="border-left:4px solid #c93636"':''}><div><b>${esc(x.p.name)}</b>${pending(x)?' <span class="badge">Pendente</span>':''}<p>Valor previsto: <strong>${esc(x.budget?.name||'Não associado')}</strong></p><p>Valor executado: <strong>${esc(x.spent?.name||'Não associado')}</strong></p><p>Prazo: <strong>${esc(x.deadline?.name||'Não associado')}</strong></p></div><button class="btn" onclick="configureBI('${esc(x.p.id)}')">Associar colunas</button></article>`).join('')||'<p>Nenhum projeto nesta visão.</p>'}`,btn('Fechar','closeModal()','close'));
}
function openOverviewReview(kind='all',project='@visible') {
  const report=overviewReview(visible().filter(p=>project==='@visible'||p.id===project)),list=report.issues.filter(i=>kind==='all'||i.kind===kind);
  const scope=visible().filter(p=>project==='@visible'||p.id===project),notes=[...(scope.some(p=>!overviewHasOwnCriteria(p.id))&&overviewSettings().notes?[['Padrão para todos os projetos',overviewSettings().notes]]:[]),...scope.filter(p=>overviewHasOwnCriteria(p.id)&&overviewSettings(p.id).notes).map(p=>[p.name,overviewSettings(p.id).notes])];
  modal('Conferência dos dados',`<p class="subtitle">${list.length} apontamento(s). Os valores abaixo são os registros originais, sem correção automática.</p>${notes.length?`<div class="simple-preview"><small>SUAS ESPECIFICAÇÕES</small>${notes.map(([name,text])=>`<p style="white-space:pre-wrap"><b>${esc(name)}:</b> ${esc(text)}</p>`).join('')}</div>`:''}<div class="overview-review-list">${list.map((i,n)=>`<article><div><b>${esc(recordTitle(i.r,i.p))}</b><small>${esc(i.p.name)} · ${esc(i.field)}</small><p>${esc(i.reason)}</p><code>${esc(i.value)}</code></div><button class="btn" onclick="openOverviewReviewWork(${n},'${kind}','${esc(project)}')">Abrir obra</button></article>`).join('')||'<p>Nenhum apontamento nesta categoria pelos critérios atuais.</p>'}</div>`,btn('Fechar','closeModal()','close'));
}
function openOverviewReviewWork(index,kind,project='@visible') {const i=overviewReview(visible().filter(p=>project==='@visible'||p.id===project)).issues.filter(i=>kind==='all'||i.kind===kind)[index];if(i){closeModal();editRecord(i.p.id,i.r.id);}}
// Redesenha o modal mantendo a posição da rolagem e o campo em foco (modal() volta ao topo).
function overviewRerender(fn) {
  const root=document.getElementById('modal'),boxes=()=>[...(root?.querySelectorAll('.dialogbody,.dialog,.overlay')||[])];
  const before=boxes().map(e=>e.scrollTop),name=document.activeElement?.getAttribute?.('name');
  fn();
  boxes().forEach((e,i)=>{e.scrollTop=before[i]||0;});
  if(name){const el=root?.querySelector(`[name="${CSS.escape(name)}"]`);if(el)el.focus({preventScroll:true});else document.activeElement?.blur?.();}else document.activeElement?.blur?.();
}
let overviewReviewDraft=null;
let overviewReviewProject='';
function openOverviewReviewSettings() {
  overviewReviewDraft=null;const list=visible();
  modal('Critérios de conferência',`<form id="overviewReviewPick" onsubmit="event.preventDefault();openOverviewReviewProject(new FormData(this).get('project'))"><p>Cada projeto pode ter regras diferentes. Escolha de qual projeto quer ver ou definir os critérios.</p>
<label class="overview-mapping" style="cursor:pointer;justify-content:flex-start;margin-bottom:8px"><input type="radio" name="project" value="" ${overviewReviewProject?'':'checked'}><span><b>Padrão para todos os projetos</b><small style="display:block;color:#58798e">Vale para os projetos que não têm critérios próprios.</small></span></label>
${list.map(p=>{const own=overviewHasOwnCriteria(p.id),n=overviewSettings(p.id).rules.length;return `<label class="overview-mapping" style="cursor:pointer;justify-content:flex-start;margin-bottom:8px"><input type="radio" name="project" value="${esc(p.id)}" ${overviewReviewProject===p.id?'checked':''}><span><b>${esc(p.name)}</b><small style="display:block;color:${own?'#b45309':'#58798e'}">${own?`Critérios próprios · ${n} regra(s)`:'Usa o padrão'}</small></span></label>`;}).join('')}</form>`,
    btn('Fechar','closeModal()','close')+'<button class="btn primary" type="submit" form="overviewReviewPick">Ver critérios</button>');
}
function openOverviewReviewProject(pid) {
  overviewReviewProject=pid&&visible().some(p=>p.id===pid)?pid:'';
  overviewReviewDraft=structuredClone(overviewSettings(overviewReviewProject));renderOverviewReviewSettings();
}
function resetOverviewReviewProject() {
  const pid=overviewReviewProject;if(!pid)return;try{localStorage.removeItem(overviewReviewKey(pid));}catch(e){}
  overviewReviewDraft=null;render();openOverviewReviewSettings();notify('O projeto voltou a usar os critérios padrão.');
}
// Lê o formulário para o rascunho (sem salvar).
function readOverviewReviewSettings() {
  const f=document.getElementById('overviewReviewForm');if(!f||!overviewReviewDraft)return overviewReviewDraft;
  const d=new FormData(f),num=k=>{const v=String(d.get(k)??'').trim();return v===''?null:Number(v);},on=k=>d.get(k)==='on';
  Object.assign(overviewReviewDraft,{minYear:num('minYear'),maxYear:num('maxYear'),outlierFactor:num('outlierFactor'),maxAmount:num('maxAmount'),minAmount:num('minAmount'),allowNegative:on('allowNegative'),flagZero:on('flagZero'),checkSpentOverBudget:on('checkSpentOverBudget'),checkEndBeforeStart:on('checkEndBeforeStart'),checkOutliers:on('checkOutliers'),progressMin:num('progressMin'),progressMax:num('progressMax'),notes:String(d.get('notes')||''),
    rules:overviewReviewDraft.rules.map((old,i)=>{const g=k=>d.has(`r${i}_${k}`)?String(d.get(`r${i}_${k}`)??'').trim():undefined,cond=(pre,prev)=>{const c={field:g(pre+'field')??'',op:g(pre+'op')||'lt',target:g(pre+'target')||'value',value:g(pre+'value')??'',value2:g(pre+'value2')??''};if(prev&&(prev.target||'value')!==c.target){c.value='';if((OVERVIEW_RULE_OPS[c.op]||{}).args==='range')c.value2='';}return c;};
      const main=cond('',old),kindAuto=g('kindAuto')==='1';
      return {...main,kindAuto,kind:kindAuto?overviewGuessKind(main.field):g('kind')||'money',message:g('message')??'',when:d.get(`r${i}_hasWhen`)==='on'?cond('w_',old.when):null};})});
  return overviewReviewDraft;
}
function addOverviewReviewRule() {readOverviewReviewSettings();overviewReviewDraft.rules.push(overviewNormalizeRule({op:'lt',kind:'money',kindAuto:true}));overviewRerender(renderOverviewReviewSettings);document.getElementById('overviewReviewRule'+(overviewReviewDraft.rules.length-1))?.scrollIntoView({block:'nearest'});}
function removeOverviewReviewRule(i) {readOverviewReviewSettings();overviewReviewDraft.rules.splice(i,1);overviewRerender(renderOverviewReviewSettings);}
function refreshOverviewReviewSettings() {readOverviewReviewSettings();overviewRerender(renderOverviewReviewSettings);}
function renderOverviewReviewSettings() {
  const s=overviewReviewDraft;if(!s)return;
  const scope=visible().filter(p=>!overviewReviewProject||p.id===overviewReviewProject),proj=overviewReviewProject?scope[0]:null;
  const fieldMeta=[...new Map(scope.flatMap(p=>p.fields||[]).filter(f=>f.id!=='nome').map(f=>[overviewKey(f.name),f])).values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')),names=fieldMeta.map(f=>f.name);
  const typeName={currency:'moeda',number:'número',percent:'%',date:'data',select:'lista',text:'texto',long:'texto',link:'link'};
  const fieldSelect=(name,val,refresh)=>{const known=fieldMeta.some(f=>overviewKey(f.name)===overviewKey(val));return `<select name="${name}"${refresh?' onchange="refreshOverviewReviewSettings()"':''}><option value="">Selecione um campo…</option>${fieldMeta.map(f=>`<option value="${esc(f.name)}" ${overviewKey(f.name)===overviewKey(val)?'selected':''}>${esc(f.name)} · ${typeName[f.type]||f.type||'texto'}</option>`).join('')}${val&&!known?`<option value="${esc(val)}" selected>${esc(val)} (não encontrado)</option>`:''}</select>`;};
  // Quantas obras a regra encontra agora (ajuda a conferir se ela faz o que a pessoa quer).
  const hits=r=>{const rule=overviewNormalizeRule(r);if(!rule.field)return null;let n=0,total=0;for(const p of scope){if(!overviewRuleField(p,rule.field))continue;for(const rec of p.records||[]){total++;if(overviewRuleHit(rule,p,rec))n++;}}return {n,total};};
  const check=(name,label,help='')=>`<label style="display:flex;gap:8px;align-items:flex-start;margin:6px 0"><input type="checkbox" name="${name}" ${s[name]?'checked':''}><span>${label}${help?`<small style="display:block;color:#58798e">${help}</small>`:''}</span></label>`;
  const v=x=>x==null?'':esc(String(x));
  const condRow=(c,i,pre)=>{const meta=OVERVIEW_RULE_OPS[c.op]||{args:'one'},n=k=>`r${i}_${pre}${k}`,canField=['one','range','pct'].includes(meta.args),isField=canField&&c.target==='field';
    const valueLabel=meta.args==='range'?'De':meta.args==='pct'?(isField?'Campo de referência':'Valor de referência'):meta.args==='days'?'Dias':meta.args==='list'?'Valores (separe com ;)':isField?'Outro campo':'Valor';
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;align-items:end"><div class="field" style="margin:0"><label>${pre?'Campo':'Campo verificado'}</label>${fieldSelect(n('field'),c.field,true)}</div><div class="field" style="margin:0"><label>Condição</label><select name="${n('op')}" onchange="refreshOverviewReviewSettings()">${Object.entries(OVERVIEW_RULE_OPS).map(([k,o])=>`<option value="${k}" ${c.op===k?'selected':''}>${o.label}</option>`).join('')}</select></div>${canField?`<div class="field" style="margin:0"><label>Comparar com</label><select name="${n('target')}" onchange="refreshOverviewReviewSettings()"><option value="value" ${!isField?'selected':''}>Um valor fixo</option><option value="field" ${isField?'selected':''}>Outro campo da obra</option></select></div>`:''}${meta.args!=='none'?`<div class="field" style="margin:0"><label>${valueLabel}</label>${isField?fieldSelect(n('value'),c.value,true):`<input name="${n('value')}" value="${v(c.value)}" placeholder="${meta.args==='days'?'Ex.: 30':meta.args==='list'?'Ex.: Paralisada; Cancelada':'Ex.: 0, 31/12/2026 ou hoje'}" onchange="refreshOverviewReviewSettings()">`}</div>`:''}${meta.args==='range'?`<div class="field" style="margin:0"><label>Até</label>${isField?fieldSelect(n('value2'),c.value2,true):`<input name="${n('value2')}" value="${v(c.value2)}" placeholder="Ex.: 100" onchange="refreshOverviewReviewSettings()">`}</div>`:''}${meta.args==='pct'?`<div class="field" style="margin:0"><label>N (%)</label><input name="${n('value2')}" type="number" step="0.1" value="${v(c.value2)}" placeholder="Ex.: 90" onchange="refreshOverviewReviewSettings()"></div>`:''}</div>`;};
  const rule=(r,i)=>{const h=hits(r),sentence=r.field?overviewCondText(overviewNormalizeRule(r))+(r.when&&r.when.field?` · quando ${overviewCondText(overviewNormalizeRule(r.when))}`:''):'Escolha o campo que será verificado';return `<div id="overviewReviewRule${i}" style="border:1px solid #dce6ec;border-left:4px solid #003856;border-radius:9px;padding:12px;margin-bottom:12px;background:#fbfdfe"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px"><div style="min-width:0"><b>Regra ${i+1}</b><div style="font-size:13px;color:#0f172a;margin-top:2px">${esc(sentence)}</div>${h?`<small style="color:${h.n?'#b45309':'#58798e'}">Encontra agora ${h.n} de ${h.total} obra(s)</small>`:''}</div><button type="button" class="iconbtn" title="Remover regra" onclick="removeOverviewReviewRule(${i})">${icon('trash')}</button></div>${condRow(r,i,'')}<label style="display:flex;gap:8px;align-items:center;margin:10px 0 6px"><input type="checkbox" name="r${i}_hasWhen" ${r.when?'checked':''} onchange="refreshOverviewReviewSettings()"><span>Aplicar só quando outra condição também for verdadeira (opcional)</span></label>${r.when?`<div style="border-left:3px solid #f37021;padding-left:10px">${condRow(r.when,i,'w_')}</div>`:''}<div style="display:grid;grid-template-columns:1fr 2fr;gap:8px;margin-top:8px"><div class="field" style="margin:0"><label>Mostrar em${r.kindAuto?' <small style="color:#58798e">(sugerido pelo tipo do campo)</small>':''}</label><input type="hidden" name="r${i}_kindAuto" value="${r.kindAuto?'1':'0'}"><select name="r${i}_kind" onchange="this.form.elements['r${i}_kindAuto'].value='0'">${Object.entries(OVERVIEW_RULE_KINDS).map(([k,l])=>`<option value="${k}" ${r.kind===k?'selected':''}>${l}</option>`).join('')}</select></div><div class="field" style="margin:0"><label>Mensagem para quem for conferir (opcional)</label><input name="r${i}_message" value="${v(r.message)}" maxlength="200" placeholder="Ex.: Executado não pode passar do valor do convênio"></div></div></div>`;};
  const own=proj&&overviewHasOwnCriteria(proj.id);
  modal(proj?`Critérios · ${esc(proj.name)}`:'Critérios · padrão para todos',`<form id="overviewReviewForm" onsubmit="event.preventDefault();saveOverviewReviewSettings()"><div class="simple-preview" style="margin-bottom:14px"><small>${proj?'PROJETO':'PADRÃO'}</small><p><b>${esc(proj?proj.name:'Todos os projetos sem critérios próprios')}</b></p><p>${proj?(own?'Este projeto tem critérios próprios: o padrão não vale para ele.':'Este projeto usa o padrão. Ao salvar aqui, ele passa a ter critérios próprios.'):'Projetos com critérios próprios não usam este padrão.'}</p></div><p>Defina o que é permitido nos seus dados. Os critérios apenas selecionam o que conferir: não declaram erro e não alteram as obras.</p>
<fieldset class="simple-values" style="display:block"><legend>Valores financeiros</legend>${check('allowNegative','Permitir valores negativos','Ex.: estornos, glosas ou devoluções. Desmarcado, todo valor negativo vai para a conferência.')}${check('flagZero','Conferir valores iguais a zero')}${check('checkSpentOverBudget','Conferir quando o valor executado for maior que o previsto')}${check('checkOutliers','Conferir valores atípicos (muito acima da mediana da coluna)')}
<div class="twocol"><div class="field"><label>Valor mínimo permitido (R$, opcional)</label><input name="minAmount" type="number" step="0.01" value="${v(s.minAmount)}" placeholder="Vazio: sem mínimo"></div><div class="field"><label>Valor máximo permitido (R$, opcional)</label><input name="maxAmount" type="number" min="0" step="0.01" value="${v(s.maxAmount)}" placeholder="Vazio: sem máximo"></div></div>
<div class="field"><label>Valor atípico: quantas vezes a mediana da coluna?</label><input name="outlierFactor" type="number" min="2" max="100" value="${v(s.outlierFactor)}"><small>Compara a mesma coluna no mesmo projeto, com pelo menos 5 valores positivos.</small></div></fieldset>
<fieldset class="simple-values" style="display:block"><legend>Datas</legend><div class="twocol"><div class="field"><label>Ano mínimo aceito</label><input name="minYear" type="number" min="1900" max="2099" value="${v(s.minYear)}" required></div><div class="field"><label>Ano máximo aceito</label><input name="maxYear" type="number" min="2000" max="2200" value="${v(s.maxYear)}" required></div></div>${check('checkEndBeforeStart','Conferir quando a data final for anterior à data inicial')}</fieldset>
<fieldset class="simple-values" style="display:block"><legend>Percentuais (avanço físico)</legend><div class="twocol"><div class="field"><label>Percentual mínimo aceito</label><input name="progressMin" type="number" step="0.1" value="${v(s.progressMin)}"></div><div class="field"><label>Percentual máximo aceito</label><input name="progressMax" type="number" step="0.1" value="${v(s.progressMax)}"></div></div></fieldset>
<fieldset class="simple-values" style="display:block"><legend>Suas regras (escreva as especificações que deseja)</legend><p class="subtitle" style="margin-top:0">${proj?'Cada regra vale só para este projeto.':'Cada regra vale para o campo de mesmo nome em todos os projetos sem critérios próprios.'} Compare com um valor fixo ou com outro campo da obra (não é obrigatório usar 2 campos). Exemplos: <em>Valor Executado · maior que · outro campo [Valor Global]</em>; <em>Valor Executado · maior que N% de · [Valor Global] · 90</em>; <em>Prazo · é data anterior a hoje</em>, só quando <em>Status · diferente de · Concluída</em>; <em>Fonte de recurso · está vazio</em>. Em datas, escreva <em>hoje</em> para usar a data atual.</p>${s.rules.map(rule).join('')||'<p class="subtitle">Nenhuma regra escrita.</p>'}<button type="button" class="btn small" onclick="addOverviewReviewRule()">${icon('plus')} Adicionar regra</button></fieldset>
<div class="field"><label>Observações e especificações (aparecem na conferência completa)</label><textarea name="notes" rows="3" maxlength="2000" placeholder="Ex.: Valores negativos só são aceitos em glosas do convênio X. Conferir obras com repasse acima de R$ 10 milhões.">${esc(s.notes||'')}</textarea></div>
<p class="subtitle">Preferência pessoal salva neste navegador.</p></form>`,btn('Trocar projeto','overviewReviewDraft=null;openOverviewReviewSettings()','arrow')+(own?btn('Voltar a usar o padrão','resetOverviewReviewProject()','close'):'')+'<button class="btn primary" type="submit" form="overviewReviewForm">Salvar critérios</button>');
}
function saveOverviewReviewSettings() {
  const s=readOverviewReviewSettings();if(!s)return;
  if(s.minYear===null||s.maxYear===null||s.minYear>s.maxYear)return notify('O ano mínimo deve ser menor ou igual ao máximo.');
  if(s.progressMin!==null&&s.progressMax!==null&&s.progressMin>s.progressMax)return notify('O percentual mínimo deve ser menor ou igual ao máximo.');
  if(s.minAmount!==null&&s.maxAmount!==null&&s.minAmount>s.maxAmount)return notify('O valor mínimo deve ser menor ou igual ao máximo.');
  s.rules=s.rules.filter(r=>r.field||r.value||r.message);
  const condBad=c=>{const a=(OVERVIEW_RULE_OPS[c.op]||{}).args;return !c.field||(a&&a!=='none'&&!c.value)||((a==='range'||a==='pct')&&!c.value2)||(a==='days'&&!Number.isFinite(Number(c.value)));};
  const bad=s.rules.find(r=>condBad(r)||(r.when&&condBad(r.when)));
  if(bad)return notify('Em cada regra, informe o campo e o valor da condição.');
  const names=c=>[c.field,...(c.target==='field'&&['one','range','pct'].includes((OVERVIEW_RULE_OPS[c.op]||{}).args)?[c.value,...((OVERVIEW_RULE_OPS[c.op]||{}).args==='range'?[c.value2]:[])]:[])];
  for(const [i,r] of s.rules.entries())for(const name of [...names(r),...(r.when?names(r.when):[])])
    if(!overviewAnyField(name))return notify(`Regra ${i+1}: o campo "${name}" não existe ${overviewReviewProject?'neste projeto':'em nenhum projeto que você acessa'}. Escolha um campo da lista.`);
  try{localStorage.setItem(overviewReviewKey(overviewReviewProject),JSON.stringify(s));}catch(e){return notify('Não foi possível salvar os critérios neste navegador.');}
  const name=overviewReviewProject?visible().find(p=>p.id===overviewReviewProject)?.name:'';
  overviewReviewDraft=null;closeModal();render();notify(name?`Critérios do projeto ${name} salvos.`:'Critérios padrão salvos.');
}
// Financeiro da visão geral: "Editar dados" (em "Ver colunas de origem") escolhe UM projeto, os campos
// financeiros (cada campo vira um cartão separado), o cálculo entre as obras (soma, média...) e, se a
// pessoa quiser, um cartão que cruza os campos (soma, subtração, média, percentual ou fórmula própria).
// Preferência pessoal salva neste navegador; os registros das obras não são alterados.
const OVERVIEW_FIN_AGGS={sum:'Soma',avg:'Média aritmética',median:'Mediana',max:'Maior valor',min:'Menor valor',count:'Quantidade de obras com valor'};
const OVERVIEW_FIN_COMBOS={none:'Não cruzar: só os campos separados',sum:'Somar os campos escolhidos',subtract:'Subtrair: primeiro campo menos os demais',avg:'Média dos campos escolhidos',percent:'Percentual: primeiro ÷ segundo × 100',formula:'Fórmula própria'};
// Lista de "dados financeiros": cada item tem um projeto, os campos, o cálculo e o cruzamento opcional.
function overviewFinanceKey() {return 'secap-overview-finance-list:'+String(session||'guest');}
function overviewFinanceList() {
  try {
    let list=JSON.parse(localStorage.getItem(overviewFinanceKey())||'null');
    if(!Array.isArray(list)){const old=JSON.parse(localStorage.getItem('secap-overview-finance-view:'+String(session||'guest'))||'null');list=old&&old.project?[{...old,id:'fin_'+Date.now().toString(36)}]:[];}
    return list.filter(c=>c&&c.id&&c.project&&Array.isArray(c.fields));
  } catch(e) {return [];}
}
function saveOverviewFinanceList(list) {
  try {localStorage.setItem(overviewFinanceKey(),JSON.stringify(list));localStorage.removeItem('secap-overview-finance-view:'+String(session||'guest'));return true;} catch(e) {notify('Não foi possível salvar a escolha neste navegador.');return false;}
}
function overviewFinanceFields(p) {
  return (p?.fields||[]).filter(f=>['currency','number','percent'].includes(f.type)||(/^(valor|orcamento|investimento|contrapartida|repasse|executado|captado|saldo|custo|pago|empenh|liquid)/.test(importHeaderKey(f.name))&&!['date','link'].includes(f.type)));
}
function overviewFinanceFieldName(p,id) {return (p?.fields||[]).find(f=>String(f.id)===String(id))?.name||id;}
function overviewFinanceAggregate(values,agg) {
  if(!values.length)return null;
  if(agg==='count')return values.length;
  if(agg==='avg')return values.reduce((a,v)=>a+v,0)/values.length;
  if(agg==='max')return Math.max(...values);
  if(agg==='min')return Math.min(...values);
  if(agg==='median'){const s=[...values].sort((a,b)=>a-b),m=(s.length-1)/2;return (s[Math.floor(m)]+s[Math.ceil(m)])/2;}
  return values.reduce((a,v)=>a+v,0);
}
// Valor cruzado de uma obra; null quando nenhum campo usado está preenchido (ausente não vira zero).
function overviewFinanceCombo(p,r,c) {
  if(c.combo==='formula') {
    if(!c.ast||typeof finEval!=='function')return null;
    const refs=[...finRefs(c.ast)];if(refs.length&&refs.every(id=>String(r[id]??'').trim()===''))return null;
    const get=id=>{const f=(p.fields||[]).find(x=>String(x.id)===String(id));if(f?.type==='date')return r[id];const n=overviewNumber(r[id]);return n===null?'':n;};
    const v=finEval(c.ast,get);return v===null||!Number.isFinite(v)?null:v;
  }
  const values=c.fields.map(id=>overviewNumber(r[id]));if(values.every(v=>v===null))return null;
  const filled=values.filter(v=>v!==null);
  if(c.combo==='sum')return filled.reduce((a,v)=>a+v,0);
  if(c.combo==='avg')return filled.reduce((a,v)=>a+v,0)/filled.length;
  if(c.combo==='subtract')return (values[0]??0)-values.slice(1).reduce((a,v)=>a+(v??0),0);
  if(c.combo==='percent')return values[0]!==null&&values[1]?values[0]/values[1]*100:null;
  return null;
}
function overviewFinanceComboLabel(p,c) {
  if(c.label)return c.label;const names=c.fields.map(id=>overviewFinanceFieldName(p,id));
  if(c.combo==='sum')return 'Soma: '+names.join(' + ');
  if(c.combo==='subtract')return names.join(' − ');
  if(c.combo==='avg')return 'Média: '+names.join(', ');
  if(c.combo==='percent')return `${names[0]} ÷ ${names[1]} (%)`;
  if(c.combo==='formula')return 'Fórmula: '+(c.ast&&typeof finFormat==='function'?finFormat(p,c.ast):c.formula||'');
  return '';
}
// Cartões do projeto escolhido: um por campo e, se houver, o cartão cruzado.
function overviewFinanceCards(p,c) {
  const items=overviewReview([p]).items.filter(i=>!i.cancelled&&(!Array.isArray(c.works)||c.works.includes(String(i.r.id))));
  const fmt=(v,percent)=>v===null?'Não informado':c.agg==='count'?`${v} obra(s)`:percent?v.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':money(v);
  const card=(label,values,percent,crossed)=>({label,crossed,agg:c.agg||'sum',value:fmt(overviewFinanceAggregate(values,c.agg),percent),project:p.name,note:`${values.length} de ${items.length} obras com valor informado · ${OVERVIEW_FIN_AGGS[c.agg]||'Soma'}`});
  const cards=c.fields.filter(id=>(p.fields||[]).some(f=>String(f.id)===String(id))).map(id=>{const f=p.fields.find(x=>String(x.id)===String(id));return card(f.name,items.map(i=>overviewNumber(i.r[id])).filter(v=>v!==null),f.type==='percent',false);});
  if(c.combo&&c.combo!=='none')cards.push(card(overviewFinanceComboLabel(p,c),items.map(i=>overviewFinanceCombo(p,i.r,c)).filter(v=>v!==null),c.combo==='percent',true));
  return {cards,total:items.length};
}
function overviewFinanceTitle(c) {
  const p=visible().find(x=>x.id===c.project);if(!p)return 'Projeto indisponível';
  return `${p.name} · ${c.fields.map(id=>overviewFinanceFieldName(p,id)).join(', ')}${c.combo&&c.combo!=='none'?' · '+overviewFinanceComboLabel(p,c):''}`;
}
function overviewFinanceSummary(c) {
  const p=visible().find(x=>x.id===c.project);if(!p)return '';
  return `<article class="overview-mapping"><div><b>${esc(p.name)}</b><p>Campos: <strong>${esc(c.fields.map(id=>overviewFinanceFieldName(p,id)).join(', '))}</strong></p><p>Cálculo entre as obras: <strong>${esc(OVERVIEW_FIN_AGGS[c.agg]||'Soma')}</strong>${c.combo&&c.combo!=='none'?` · Cruzamento: <strong>${esc(overviewFinanceComboLabel(p,c))}</strong>`:''}</p><p>Obras: <strong>${Array.isArray(c.works)?`${c.works.length} escolhida(s)`:'Todas as obras não canceladas'}</strong></p></div></article>`;
}
function openOverviewMappings() {
  const list=overviewFinanceList().filter(c=>visible().some(p=>p.id===c.project));
  modal('Configurar financeiro',`<p>Dados financeiros mostrados no contêiner <strong>Financeiro com origem identificada</strong>. Use <strong>+ Adicionar</strong> para escolher um projeto, os campos financeiros e o cálculo; use <strong>Editar dados</strong> para alterar ou excluir um dado já adicionado.</p>${list.map(overviewFinanceSummary).join('')||'<p class="subtitle">Nenhum dado financeiro adicionado. Enquanto isso, o contêiner mostra o valor previsto e o executado padrão de cada projeto.</p>'}`,
    (list.length?btn('Restaurar padrão','confirmOverviewFinance()','arrow'):'')+btn('Adicionar','openOverviewFinanceEditor()','plus')+(list.length?btn('Editar dados','openOverviewFinancePick()','edit','primary'):'')+btn('Fechar','closeModal()','close'));
}
// "Editar dados": primeiro escolhe qual dado editar (ou excluir).
function openOverviewFinancePick() {
  const list=overviewFinanceList().filter(c=>visible().some(p=>p.id===c.project));if(!list.length)return openOverviewFinanceEditor();
  modal('Qual dado quer editar?',`<form id="overviewFinancePick" onsubmit="event.preventDefault();openOverviewFinanceEditor(new FormData(this).get('item'))">${list.map((c,i)=>`<label class="overview-mapping" style="cursor:pointer;justify-content:flex-start;margin-bottom:8px"><input type="radio" name="item" value="${esc(c.id)}" ${i===0?'checked':''}><span>${esc(overviewFinanceTitle(c))}</span></label>`).join('')}</form>`,
    btn('Voltar','openOverviewMappings()','arrow')+btn('Excluir','confirmOverviewFinance(new FormData(document.getElementById(\'overviewFinancePick\')).get(\'item\'))','trash')+'<button class="btn primary" type="submit" form="overviewFinancePick">Editar</button>');
}
// Confirma antes de apagar: um dado (id) ou todos (sem id = restaurar padrão).
function confirmOverviewFinance(id='') {
  const item=id?overviewFinanceList().find(c=>c.id===id):null;if(id&&!item)return;
  modal(id?'Excluir dado financeiro?':'Restaurar o padrão?',`<p>${id?`O dado <strong>${esc(overviewFinanceTitle(item))}</strong> sai do contêiner financeiro.`:'Todos os dados financeiros adicionados serão apagados e o contêiner volta a mostrar o valor previsto e o executado padrão.'}</p><p class="subtitle">Isso não pode ser desfeito. As obras não são alteradas.</p>`,
    btn('Cancelar',id?'openOverviewFinancePick()':'openOverviewMappings()','arrow')+btn(id?'Excluir':'Restaurar padrão',id?`removeOverviewFinanceItem('${esc(id)}')`:'resetOverviewFinanceEditor()','trash','primary'));
}
function removeOverviewFinanceItem(id) {
  if(!id)return;const list=overviewFinanceList().filter(c=>c.id!==id);if(!saveOverviewFinanceList(list))return;
  render();openOverviewMappings();notify('Dado financeiro excluído.');
}
let overviewFinanceDraft=null;
function openOverviewFinanceEditor(id='') {
  const c=id?overviewFinanceList().find(x=>x.id===id):null,p=c&&visible().find(x=>x.id===c.project);
  overviewFinanceDraft=p?{id:c.id,project:p.id,fields:c.fields.map(String),agg:c.agg||'sum',combo:c.combo||'none',formula:c.ast&&typeof finFormat==='function'?finFormat(p,c.ast):c.formula||'',label:c.label||'',allWorks:!Array.isArray(c.works),works:new Set((c.works||[]).map(String)),search:''}
    :{id:'',project:'',fields:[],agg:'sum',combo:'none',formula:'',label:'',allWorks:true,works:new Set(),search:''};
  renderOverviewFinanceEditor();
}
function readOverviewFinanceEditor() {
  const f=document.getElementById('overviewFinanceForm'),d=overviewFinanceDraft;if(!f||!d)return;
  const data=new FormData(f),project=String(data.get('project')||'');
  if(project!==d.project){Object.assign(d,{project,fields:[],combo:'none',formula:'',label:'',allWorks:true,works:new Set(),search:''});return;}
  if(f.querySelector('[name="field"]'))d.fields=data.getAll('field').map(String);
  if(data.has('agg'))d.agg=String(data.get('agg'));
  if(data.has('combo'))d.combo=String(data.get('combo'));
  if(data.has('formula'))d.formula=String(data.get('formula')||'');
  if(data.has('label'))d.label=String(data.get('label')||'').trim();
  if(data.has('worksMode'))d.allWorks=data.get('worksMode')!=='selected';
  if(f.querySelector('[name="work"]'))d.works=new Set(data.getAll('work').map(String));
  d.search=String(data.get('workSearch')||'');
}
function updateOverviewFinanceEditor() {readOverviewFinanceEditor();overviewRerender(renderOverviewFinanceEditor);}
function overviewFinanceSelectWorks() {
  const d=overviewFinanceDraft;if(d&&!d.works.size)d.works=new Set((visible().find(x=>x.id===d.project)?.records||[]).map(r=>String(r.id)));updateOverviewFinanceEditor();
}
function overviewFinanceFilterWorks(input) {
  const q=overviewKey(input.value);document.querySelectorAll('#overviewFinanceForm .ofin-work').forEach(el=>{el.style.display=!q||el.dataset.search.includes(q)?'flex':'none';});
}
function overviewFinanceMarkWorks(value) {
  document.querySelectorAll('#overviewFinanceForm .ofin-work').forEach(el=>{if(el.style.display!=='none')el.querySelector('input').checked=value;});
}
function overviewFinanceInsert(name) {
  const t=document.querySelector('#overviewFinanceForm textarea[name="formula"]');if(!t)return;
  const at=t.selectionStart??t.value.length,text=`[${name}]`;t.value=t.value.slice(0,at)+text+t.value.slice(t.selectionEnd??at);t.focus();t.selectionStart=t.selectionEnd=at+text.length;
}
// Configuração validada a partir do rascunho; lança erro com a mensagem para o usuário.
function overviewFinanceDraftConfig(d=overviewFinanceDraft) {
  const p=visible().find(x=>x.id===d.project);if(!p)throw new Error('Selecione um projeto.');
  if(!d.fields.length)throw new Error('Marque pelo menos um campo financeiro.');
  const c={id:d.id||'fin_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),project:p.id,fields:[...d.fields],agg:OVERVIEW_FIN_AGGS[d.agg]?d.agg:'sum',combo:OVERVIEW_FIN_COMBOS[d.combo]?d.combo:'none',label:d.label,works:d.allWorks?null:[...d.works]};
  if(['sum','subtract','avg','percent'].includes(c.combo)&&c.fields.length<2)throw new Error('Para cruzar os dados, marque pelo menos 2 campos.');
  if(c.combo==='formula'){if(typeof finParse!=='function')throw new Error('Fórmulas indisponíveis nesta página.');try{c.ast=finParse(p,d.formula);c.formula=d.formula;}catch(e){throw new Error('Fórmula: '+e.message);}}
  if(c.agg==='sum'&&c.combo==='percent')throw new Error('Somar percentuais de várias obras não faz sentido. Para o cruzamento "Percentual", escolha média, mediana, maior ou menor valor.');
  if(c.agg==='sum'&&c.fields.some(id=>p.fields.find(f=>String(f.id)===String(id))?.type==='percent'))throw new Error('Há campo de percentual marcado: somar percentuais de várias obras não faz sentido. Escolha média, mediana, maior ou menor valor.');
  if(!d.allWorks&&!d.works.size)throw new Error('Marque pelo menos uma obra ou escolha "Todas as obras".');
  return {p,c};
}
function renderOverviewFinanceEditor() {
  const d=overviewFinanceDraft;if(!d)return;const p=visible().find(x=>x.id===d.project);
  let body=`<form id="overviewFinanceForm" onsubmit="event.preventDefault();saveOverviewFinanceEditor()"><p class="simple-intro">Monte o contêiner <strong>Financeiro com origem identificada</strong>. A prévia mostra o resultado antes de salvar.</p><div class="field"><label>1. Qual projeto quer selecionar? (apenas um)</label><select name="project" onchange="updateOverviewFinanceEditor()"><option value="">Selecione um projeto</option>${visible().map(x=>`<option value="${esc(x.id)}" ${x.id===d.project?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>`;
  if(p) {
    const numbers=overviewFinanceFields(p),records=p.records||[];
    body+=`<fieldset class="simple-values" style="display:block"><legend>2. Quais campos financeiros quer visualizar? (pode marcar mais de um; cada um aparece separado)</legend><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:4px">${numbers.map(f=>`<label><input type="checkbox" name="field" value="${esc(f.id)}" ${d.fields.includes(String(f.id))?'checked':''} onchange="updateOverviewFinanceEditor()"><span>${esc(f.name)}</span></label>`).join('')||'<p>Nenhum campo financeiro neste projeto.</p>'}</div></fieldset>`;
    body+=`<div class="twocol"><div class="field"><label>3. Como calcular entre as obras?</label><select name="agg" onchange="updateOverviewFinanceEditor()">${Object.entries(OVERVIEW_FIN_AGGS).map(([k,v])=>`<option value="${k}" ${d.agg===k?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>4. Cruzar os campos? (opcional)</label><select name="combo" onchange="updateOverviewFinanceEditor()">${Object.entries(OVERVIEW_FIN_COMBOS).map(([k,v])=>`<option value="${k}" ${d.combo===k?'selected':''}>${v}</option>`).join('')}</select></div></div>`;
    if(d.combo==='formula')body+=`<div class="field"><label>Sua fórmula (calculada em cada obra)</label><textarea name="formula" rows="2" placeholder="Ex.: [VALOR TOTAL] - [Valor Executado]   ou   SOMA([Repasse]; [Contrapartida])" onchange="updateOverviewFinanceEditor()">${esc(d.formula)}</textarea><small>Campos entre colchetes. Use + - * /, parênteses, SOMA, SE, MÁXIMO, MÍNIMO e ARRED (argumentos separados por ;). Clique em um campo para inserir:</small><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${numbers.map(f=>`<button type="button" class="btn small" data-name="${esc(f.name)}" onclick="overviewFinanceInsert(this.dataset.name)">${esc(f.name)}</button>`).join('')}</div></div>`;
    if(d.combo!=='none')body+=`<div class="field"><label>Nome do cartão cruzado (opcional)</label><input name="label" value="${esc(d.label)}" maxlength="80" placeholder="Ex.: Saldo a executar" onchange="updateOverviewFinanceEditor()"></div>`;
    const works=d.allWorks?'':`<div class="field" style="margin-top:8px"><input name="workSearch" value="${esc(d.search)}" placeholder="Buscar obra pelo nome" oninput="overviewFinanceFilterWorks(this)"><div style="display:flex;gap:6px;margin:6px 0;flex-wrap:wrap"><button type="button" class="btn small" onclick="overviewFinanceMarkWorks(true)">Marcar visíveis</button><button type="button" class="btn small" onclick="overviewFinanceMarkWorks(false)">Desmarcar visíveis</button><button type="button" class="btn small" onclick="updateOverviewFinanceEditor()">Atualizar prévia</button></div><div style="max-height:200px;overflow:auto;border:1px solid #e2e8f0;border-radius:8px;padding:6px">${records.map(r=>{const title=recordTitle(r,p),key=overviewKey(title);return `<label class="ofin-work" data-search="${esc(key)}" style="display:${d.search&&!key.includes(overviewKey(d.search))?'none':'flex'};gap:8px;padding:3px 0"><input type="checkbox" name="work" value="${esc(r.id)}" ${d.works.has(String(r.id))?'checked':''}><span>${esc(title)}</span></label>`;}).join('')||'<p>Nenhuma obra neste projeto.</p>'}</div></div>`;
    body+=`<details class="simple-mappings" ${d.allWorks?'':'open'}><summary>Quais obras entram? (opcional · padrão: todas)</summary><label><input type="radio" name="worksMode" value="all" ${d.allWorks?'checked':''} onchange="updateOverviewFinanceEditor()"><span>Todas as obras do projeto (${records.length})</span></label><label><input type="radio" name="worksMode" value="selected" ${d.allWorks?'':'checked'} onchange="overviewFinanceSelectWorks()"><span>Somente as obras que eu escolher${d.allWorks?'':` (${d.works.size} marcadas)`}</span></label>${works}</details>`;
    let preview;try{const {c}=overviewFinanceDraftConfig(d),view=overviewFinanceCards(p,c);preview=`<small>PRÉVIA DO CONTÊINER FINANCEIRO · ${esc(p.name)}</small>${view.cards.map(x=>`<p><b>${esc(x.label)}:</b> ${esc(x.value)} <span style="color:#58798e">(${esc(x.note)})</span></p>`).join('')}<p>Obras canceladas não entram no cálculo.</p>`;}catch(e){preview=`<small>CONFIRA</small><p>${esc(e.message)}</p>`;}
    body+=`<div class="simple-preview" aria-live="polite">${preview}</div>`;
  }
  body+=`<p class="subtitle">Preferência pessoal salva neste navegador. Os dados das obras não são alterados.</p></form>`;
  modal(d.id?'Editar dado financeiro':'Adicionar dado financeiro',body,btn('Voltar','overviewFinanceDraft=null;openOverviewMappings()','arrow')+'<button class="btn primary" type="submit" form="overviewFinanceForm">Salvar</button>');
}
function saveOverviewFinanceEditor() {
  readOverviewFinanceEditor();if(!overviewFinanceDraft)return;
  let c;try{c=overviewFinanceDraftConfig().c;}catch(e){return notify(e.message);}
  const list=overviewFinanceList(),at=list.findIndex(x=>x.id===c.id);if(at>=0)list[at]=c;else list.push(c);
  if(!saveOverviewFinanceList(list))return;overviewFinanceDraft=null;render();openOverviewMappings();notify(at>=0?'Dado financeiro atualizado.':'Dado financeiro adicionado.');
}
function resetOverviewFinanceEditor() {
  if(!saveOverviewFinanceList([]))return;overviewFinanceDraft=null;render();openOverviewMappings();notify('Contêiner financeiro voltou ao padrão.');
}
function overviewFinancePanel(projects) {
  const all=overviewFinanceList(),list=all.filter(c=>projects.some(p=>p.id===c.project));
  const head=(sub)=>`<div class="panelhead"><div><h2>Financeiro com origem identificada</h2><small>${sub}</small></div><button class="textbtn" onclick="openOverviewMappings()">Configurar financeiro</button></div>`;
  if(list.length) {
    const cards=list.flatMap(c=>overviewFinanceCards(projects.find(p=>p.id===c.project),c).cards);
    return `<section class="panel overview-finance-panel">${head('Obras não canceladas de cada projeto escolhido. Valores atípicos permanecem até revisão.')}<div class="overview-finance-grid ofin-three">${cards.map(x=>`<div${x.crossed?' style="border-left:3px solid #f37021;padding-left:14px"':''}><small>${esc(x.label)}${x.agg!=='sum'?` · <em>${esc((OVERVIEW_FIN_AGGS[x.agg]||'').toLocaleLowerCase('pt-BR'))}</em>`:''}</small><strong>${esc(x.value)}</strong><span><b>${esc(x.project)}</b></span></div>`).join('')}</div></section>`;
  }
  const c=all.length,report=overviewReview(projects),active=report.items.filter(i=>!i.cancelled),b=active.filter(i=>i.budget!==null),s=active.filter(i=>i.spent!==null);
  const amount=items=>items.length?money(items.reduce((a,i)=>a+i.value,0)):'Não informado';
  return `<section class="panel overview-finance-panel">${head(`Obras não canceladas. Valores atípicos permanecem no total até revisão.${c?' Os projetos dos dados financeiros adicionados não estão nesta visão; mostrando o padrão.':''}`)}<div class="overview-finance-grid"><div><small>Valor previsto</small><strong>${amount(b.map(i=>({value:i.budget})))}</strong><span>${b.length} de ${active.length} obras com valor informado</span></div><div><small>Valor executado</small><strong>${amount(s.map(i=>({value:i.spent})))}</strong><span>${s.length} de ${active.length} obras com valor informado</span></div></div></section>`;
}
// Cor da barra: cores muito claras da paleta (ex.: "Não iniciado" #F2F2F2) somem no fundo da trilha;
// nesses casos a barra usa um cinza visível. A paleta das etiquetas não muda.
function overviewBarColor(name) {
  const c=statusColor(name);if(!/^#[a-f0-9]{6}$/i.test(c))return '#7694a5';
  const [r,g,b]=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255);
  return 0.2126*r+0.7152*g+0.0722*b>0.8?'#b8c4ce':c;
}
function overviewStatusPanel(all) {
  const counts=new Map();for(const i of all){const name=i.status||'Não informado';counts.set(name,(counts.get(name)||0)+1);}
  // Status do quadro de Acompanhamento: uma etapa acrescentada lá também aparece aqui (mesmo com 0 obras).
  if(typeof workflowSettings==='function')for(const b of workflowSettings().boards||[])for(const stage of b.stages||[]){const name=typeof workStageStatus==='function'?workStageStatus(stage):canonicalStatus(stage);if(name&&name!=='Ainda não definido'&&!counts.has(name))counts.set(name,0);}
  const values=[...counts].sort((a,b)=>b[1]-a[1]),max=Math.max(1,...values.map(x=>x[1]));
  return `<section class="panel balanced-status overview-status-panel"><div class="panelhead"><div><h2>Situação das obras</h2><small>Quantidade por situação. Clique para consultar as obras.</small></div></div><div class="panelbody">${values.map(([name,count])=>`<button class="overview-status-row" data-status="${esc(name)}" onclick="dashStatusWorks(this.dataset.status)"><span>${esc(name)}</span><span class="overview-status-track"><i style="width:${count/max*100}%;background:${overviewBarColor(name)}"></i></span><b>${count}</b></button>`).join('')||'<p>Nenhuma obra nesta seleção.</p>'}<small class="overview-status-total">${all.length} obras nesta visão · nenhuma situação omitida</small></div></section>`;
}
// Campos de mesmo nome em projetos diferentes: os IDs originais são preservados.
function overviewCommonColumns(projects) {
  if(!projects.length)return [];
  const result=[];for(const f of projects[0].fields||[]) {
    if(f.id==='nome')continue;const key=importHeaderKey(f.name);if(!key||result.some(x=>x.key===key))continue;
    const equivalents=projects.map(p=>(p.fields||[]).find(x=>importHeaderKey(x.name)===key));
    const numeric=t=>['currency','number','percent'].includes(t);
    const financial=/^(valor|orcamento|investimento|contrapartida|repasse|executado|captado)/.test(key);
    if(equivalents.every(x=>x&&(x.type===f.type||(numeric(x.type)&&numeric(f.type))||(financial&&[f.type,x.type].every(t=>['text','currency','number'].includes(t))))))result.push({key,id:'__common_'+layoutHash(key),name:f.name+' · comum aos projetos',type:financial?'currency':f.type,mappings:Object.fromEntries(projects.map((p,i)=>[p.id,equivalents[i].id]))});
  }return result;
}
const sourceBeforeOverviewReview=sourceForContainer;
sourceForContainer=function(b) {
  const source=sourceBeforeOverviewReview(b);if(!source)return source;
  const projects=visible().filter(p=>!b.project||b.project==='@visible'||b.project===p.id),common=overviewCommonColumns(projects);
  if(!b.project||b.project==='@visible') {
    source.p.fields=[...source.p.fields,...common.filter(c=>!source.p.fields.some(f=>f.id===c.id)).map(({mappings,key,...f})=>f)];
    source.rows=source.rows.map(r=>({...r,...Object.fromEntries(common.map(c=>[c.id,r[c.mappings[r.__sourceProject]]]))}));
  }
  if(b.sourceMappings) {
    source.p.fields=[...source.p.fields,{id:'__wizardValue',name:b.sourceLabel||'Valor financeiro escolhido',type:'currency'}];
    source.rows=source.rows.map(r=>({...r,__wizardValue:overviewNumber(r[b.sourceMappings[r.__sourceProject]])}));
  }
  if(b.quickKind==='status')source.rows=source.rows.map(r=>({...r,__situacao:canonicalStatus(r.__situacao)}));
  if(b.quickKind==='deadlines')source.rows=source.rows.map(r=>({...r,__prazo:overviewDate(r.__prazo).valid?overviewDate(r.__prazo).date:''}));
  return source;
};
const metricFilterBeforeOverviewReview=metricFilterRows;
metricFilterRows=function(rows,m) {if(!m?.filterNormalized)return metricFilterBeforeOverviewReview(rows,m);const selected=new Set((m.filterValues||[]).map(overviewKey));return !m.filterField||!selected.size?rows:rows.filter(r=>selected.has(overviewKey(metricValueLabel(r[m.filterField]))));};
let simpleContainerDraft=null;
function openSimpleContainer(id='',builtinDraft=null) {
  const found=id?findPageBlock(getPageLayout().blocks,id):null,b=builtinDraft||found?.block;
  simpleContainerDraft={id:b?.id||'',scope:currentLayoutScope(),mode:layoutMode,original:b?structuredClone(b):null,
    title:b?.title||'',kind:b?.quickKind||(/avanco|progresso/.test(importHeaderKey(b?.title))?'progress':/invest|finance|valor|orcam/.test(importHeaderKey(b?.title))?'finance':/prazo|entrega|vigencia/.test(importHeaderKey(b?.title))?'deadlines':/cadastr|total|quantidade/.test(importHeaderKey(b?.title))?'count':'status'),project:b?.project||layoutProject()?.id||'@visible',
    field:b?.quickField||'__situacao',values:b?.metric?.filterValues||[],agg:b?.metric?.agg||'sum',sourceMappings:b?.sourceMappings||{}};
  if(!b?.quickField)simpleContainerDraft.field=simpleContainerDraft.kind==='finance'?'__valor':simpleContainerDraft.kind==='progress'?'__avanco':'__situacao';
  renderSimpleContainer();
}
function simpleSource(d=simpleContainerDraft) {return sourceForContainer({project:d.project,followFilters:true,quickKind:d.kind});}
function readSimpleContainer() {
  const f=document.getElementById('simpleContainerForm');if(!f||!simpleContainerDraft)return;
  const data=new FormData(f),d=simpleContainerDraft,project=data.get('project')||'@visible';
  const sourceChanged=project!==d.project||(data.has('field')&&data.get('field')!==d.field)||data.get('kind')!==d.kind;
  if(project!==d.project){d.sourceMappings={};d.values=[];}d.project=project;
  if(data.get('kind')!==d.kind){d.values=[];d.field=data.get('kind')==='finance'?'__valor':data.get('kind')==='progress'?'__avanco':'__situacao';d.sourceMappings={};}d.kind=data.get('kind')||'status';
  d.title=String(data.get('title')||'');d.agg=data.get('agg')||'sum';
  if(data.has('field')&&data.get('field')!==d.field){d.field=data.get('field');d.values=[];d.sourceMappings={};}else if(data.has('filterValues'))d.values=data.getAll('filterValues');else if(d.kind==='status')d.values=[];
  for(const [key,value]of data)if(!sourceChanged&&key.startsWith('map:'))d.sourceMappings[key.slice(4)]=value;
}
function updateSimpleContainer(){readSimpleContainer();renderSimpleContainer();}
function renderSimpleContainer() {
  const d=simpleContainerDraft,source=simpleSource(),p=source?.p,rows=source?.rows||[],projects=visible().filter(p=>d.project==='@visible'||p.id===d.project);
  let body=`<form id="simpleContainerForm" onsubmit="event.preventDefault();saveSimpleContainer()"><p class="simple-intro">Escolha o que quer acompanhar. A prévia mostra o resultado antes de salvar.</p><div class="twocol"><div class="field"><label>1. O que você quer ver?</label><select name="kind" onchange="updateSimpleContainer()">${[['status','Obras em uma situação'],['finance','Um valor financeiro'],['count','Quantidade de obras'],['progress','Avanço médio / percentual'],['deadlines','Prazos e entregas'],['quality','Dados que precisam de conferência']].map(([id,label])=>`<option value="${id}" ${d.kind===id?'selected':''}>${label}</option>`).join('')}</select></div><div class="field"><label>2. De onde vêm os dados?</label><select name="project" onchange="updateSimpleContainer()"><option value="@visible" ${d.project==='@visible'?'selected':''}>Todos os projetos que posso acessar</option>${visible().map(p=>`<option value="${esc(p.id)}" ${d.project===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div></div>`;
  if(d.kind==='status') {
    const fields=(p?.fields||[]).filter(f=>!['currency','number','date','percent','link','long'].includes(f.type));
    body+=`<div class="field"><label>3. Qual informação?</label><select name="field" onchange="updateSimpleContainer()">${fields.map(f=>`<option value="${esc(f.id)}" ${f.id===d.field?'selected':''}>${esc(f.name)}</option>`).join('')}</select></div>`;
    if(!fields.some(f=>f.id===d.field))d.field=fields[0]?.id||'';
    const counts=new Map();for(const r of rows){const value=metricValueLabel(r[d.field]),key=overviewKey(value);if(!counts.has(key))counts.set(key,{value,count:0});counts.get(key).count++;}
    body+=`<fieldset class="simple-values"><legend>4. Qual situação deve aparecer no cartão?</legend>${[...counts.values()].sort((a,b)=>b.count-a.count).map(x=>`<label><input name="filterValues" type="checkbox" value="${esc(x.value)}" ${d.values.some(v=>overviewKey(v)===overviewKey(x.value))?'checked':''} onchange="updateSimpleContainer()"><span>${esc(x.value)}</span><b>${x.count}</b></label>`).join('')||'<p>Nenhum valor encontrado para esse campo.</p>'}</fieldset>`;
  }
  if(d.kind==='finance') {
    const numbers=(p?.fields||[]).filter(f=>['currency','number','percent'].includes(f.type)&&!['__avanco'].includes(f.id));if(!numbers.some(f=>f.id===d.field))d.field=numbers[0]?.id||'';
    body+=`<div class="twocol"><div class="field"><label>3. Qual valor financeiro?</label><select name="field" onchange="updateSimpleContainer()">${numbers.map(f=>`<option value="${esc(f.id)}" ${f.id===d.field?'selected':''}>${esc(f.name)}</option>`).join('')}</select></div><div class="field"><label>Como calcular?</label><select name="agg" onchange="updateSimpleContainer()"><option value="sum" ${d.agg==='sum'?'selected':''}>Somar os valores</option><option value="avg" ${d.agg==='avg'?'selected':''}>Mostrar a média</option></select></div></div><details class="simple-mappings" open><summary>Confira a coluna usada em cada projeto</summary><p>Você pode escolher colunas com nomes diferentes. Apenas uma coluna será usada em cada projeto.</p>`;
    const common=overviewCommonColumns(projects).find(f=>f.id===d.field);
    for(const project of projects) {
      if(!(project.id in d.sourceMappings))d.sourceMappings[project.id]=d.field==='__valor'?fieldKey(project,'budget'):d.field==='__executado'?fieldKey(project,'spent'):common?.mappings[project.id]||(project.fields.some(f=>f.id===d.field)?d.field:'');
      const numeric=project.fields.filter(f=>['currency','number','percent'].includes(f.type)||(/^(valor|orcamento|investimento|contrapartida|repasse|executado|captado)/.test(importHeaderKey(f.name))&&!['date','link'].includes(f.type)));
      body+=`<div class="field"><label>${esc(project.name)}</label><select name="map:${esc(project.id)}" onchange="updateSimpleContainer()"><option value="">Não associado — não somar este projeto</option>${numeric.map(f=>`<option value="${esc(f.id)}" ${d.sourceMappings[project.id]===f.id?'selected':''}>${esc(f.name)}</option>`).join('')}</select></div>`;
    }body+='</details>';
  }
  if(d.kind==='progress') {
    const fields=(p?.fields||[]).filter(f=>['number','percent'].includes(f.type));
    if(!fields.some(f=>f.id===d.field))d.field=fields[0]?.id||'';
    body+=`<div class="field"><label>3. Qual campo de percentual?</label><select name="field" onchange="updateSimpleContainer()">${fields.map(f=>`<option value="${esc(f.id)}" ${f.id===d.field?'selected':''}>${esc(f.name)}</option>`).join('')}</select><small>Mostra a média dos percentuais informados, sem preencher campos vazios.</small></div>`;
  }
  const preview=simpleContainerPreview(d,source);
  body+=`<div class="simple-preview" aria-live="polite"><small>PRÉVIA DO SEU CONTÊINER</small><strong>${esc(preview.value)}</strong><p>${esc(preview.note)}</p></div><div class="field"><label>Nome do cartão (opcional)</label><input name="title" value="${esc(d.title)}" placeholder="${esc(preview.title)}"></div></form>`;
  modal(d.id?'Editar contêiner':'Adicionar contêiner · escolha e confira',body,btn('Mais opções','openAdvancedSimpleContainer()','edit')+btn('Cancelar','simpleContainerDraft=null;closeModal()','close')+'<button class="btn primary" type="submit" form="simpleContainerForm">Salvar contêiner</button>');
}
function simpleContainerPreview(d,source=simpleSource(d)) {
  const rows=source?.rows||[];
  if(d.kind==='status') {const list=metricFilterRows(rows,{filterField:d.field,filterValues:d.values,filterNormalized:true});return {value:d.values.length?String(list.length):'Escolha uma situação',note:`${d.values.join(' ou ')||'Selecione o valor acima'} · ${rows.length} obras disponíveis`,title:d.values.length?d.values.join(' / '):'Obras por situação'};}
  if(d.kind==='finance') {const selected=rows.map(r=>({value:overviewNumber(r[d.sourceMappings[r.__sourceProject]])})).filter(r=>r.value!==null),total=selected.length?selected.reduce((a,r)=>a+r.value,0)/(d.agg==='avg'?selected.length:1):null;return {value:total===null?'Sem valores associados':money(total),note:`${selected.length} de ${rows.length} obras com valor informado. Ausentes não viram zero.`,title:source?.p.fields.find(f=>f.id===d.field)?.name||'Financeiro'};}
  if(d.kind==='progress'){const values=rows.map(r=>overviewNumber(r[d.field])).filter(v=>v!==null);return {value:values.length?(values.reduce((a,v)=>a+v,0)/values.length).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'Sem percentual informado',note:`${values.length} de ${rows.length} obras com percentual informado.`,title:'Avanço médio'};}
  if(d.kind==='quality'){const report=overviewReview(visible().filter(p=>d.project==='@visible'||p.id===d.project));return {value:String(report.works),note:'Obras com datas, valores ou percentuais para conferir.',title:'Dados para conferir'};}
  if(d.kind==='deadlines')return {value:String(rows.filter(r=>overviewDate(r.__prazo).valid).length),note:'Obras com prazo válido; datas suspeitas ficam na conferência.',title:'Prazos e entregas'};
  return {value:String(rows.length),note:'Somente obras dos projetos liberados para o seu perfil.',title:'Quantidade de obras'};
}
function saveSimpleContainer() {
  readSimpleContainer();const d=simpleContainerDraft;if(!d)return;
  const source=simpleSource(),preview=simpleContainerPreview(d,source);
  if(d.kind==='status'&&!d.values.length)return notify('Escolha pelo menos uma situação para o cartão.');
  if(d.kind==='finance'&&!Object.values(d.sourceMappings).some(Boolean))return notify('Associe uma coluna financeira em pelo menos um projeto.');
  const b={...newPageBlock('metric'),...(d.original||{}),type:d.kind==='deadlines'?'deadlines':'metric',quickKind:d.kind,quickField:d.field,title:d.title.trim()||preview.title,project:d.project,followFilters:true,description:d.kind==='finance'?'Colunas escolhidas por projeto':d.kind==='progress'?'Média dos percentuais informados':'',width:d.original?.width||3,metric:{field:d.kind==='finance'?'__wizardValue':d.kind==='progress'?d.field:'@records',agg:d.kind==='finance'?d.agg:d.kind==='progress'?'avg':'count',format:d.kind==='finance'?'currency':d.kind==='progress'?'percent':'number',...(d.kind==='status'?{filterField:d.field,filterValues:d.values,filterNormalized:true}:{})}};
  if(d.original?.builtin)b.customized=true;
  if(d.kind==='finance'){b.sourceMappings={...d.sourceMappings};b.sourceLabel=preview.title;}else delete b.sourceMappings;
  if(d.kind==='deadlines'){b.model={...defaultContainerModel(source.p),date:'__prazo',primary:'__valor'};b.width=d.original?.width||6;}
  const layout=getPageLayout(d.scope,d.mode),found=d.id?findPageBlock(layout.blocks,d.id):null;
  if(found)Object.assign(found.block,b);else layout.blocks.push(b);
  if(savePageLayout(layout,'Configurou contêiner guiado',d.scope,d.mode)){simpleContainerDraft=null;closeModal();render();notify('Contêiner salvo. Você pode editar ou mover quando quiser.');}
}
function openAdvancedSimpleContainer() {readSimpleContainer();const d=simpleContainerDraft;simpleContainerDraft=null;editPageContainerBeforeSimple(d?.id||'');if(containerDraft?.block){delete containerDraft.block.quickKind;delete containerDraft.block.quickField;}}
const layoutControlsBeforeSimple=layoutControls;
layoutControls=function(){return layoutControlsBeforeSimple().replace('onclick="editPageContainer()"','onclick="openSimpleContainer()"');};
const editPageContainerBeforeSimple=editPageContainer;
editPageContainer=function(id='',parentId=''){const b=id?findPageBlock(getPageLayout().blocks,id)?.block:null;if(b?.quickKind&&!parentId)return openSimpleContainer(id);return editPageContainerBeforeSimple(id,parentId);};
const customizeBuiltinBeforeSimple=customizeBuiltinContainerDraft;
customizeBuiltinContainerDraft=function(){if(!containerDraft)return;readContainerForm();const d=containerDraft;containerDraft=null;openSimpleContainer(d.id,d.block);};
const renderCustomContainerBeforeSimple=renderCustomContainer;
renderCustomContainer=function(b,depth=0) {
  if(b.quickKind==='quality'){const report=overviewReview(visible().filter(p=>b.project==='@visible'||p.id===b.project));return `<article class="visual-kpi container-metric" role="button" tabindex="0" onclick="openOverviewReview('all','${esc(b.project||'@visible')}')" onkeydown="if(event.key==='Enter')openOverviewReview('all','${esc(b.project||'@visible')}')"><div class="visual-kpi-head"><span>${esc(b.title)}</span>${icon('shield')}</div><strong>${report.works}</strong><small>Obras com apontamentos para conferir</small></article>`;}
  let html=renderCustomContainerBeforeSimple(b,depth);
  if(b.quickKind==='finance'){const s=sourceForContainer(b),v=s?aggregateVisual(s.rows,'__wizardValue',b.metric.agg):null;html=html.replace('</article>',`<span class="simple-exact-value">${esc(v===null?'Sem valor informado':money(v))}${s?`<br>${s.rows.filter(r=>r.__wizardValue!==null).length} de ${s.rows.length} obras com valor informado`:''}</span></article>`);}
  return html;
};
