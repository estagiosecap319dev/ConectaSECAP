// Presentation aliases do not rewrite imported records.
function canonicalStatus(value){const raw=String(value??'').trim(),s=raw.replace(/^\d+\s*[-–—.:]\s*/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();if(!s||/nao informado|sem status|ainda nao definido/.test(s))return 'Não informado';if(/^n\s*\/\s*a\.?$|^n\.a\.?$|nao se aplica/.test(s))return 'Não se aplica';if(/nao iniciad|a iniciar/.test(s))return 'Não iniciado';if(/^iniciad/.test(s))return 'Em andamento';if(/pessoal/.test(s))return 'Pessoal';if(/reuniao/.test(s))return 'Reunião';if(/cancelad/.test(s))return 'Cancelado';if(/parali[sz]|suspens/.test(s))return 'Paralisado';if(/conclu|finalizad|entregue/.test(s))return 'Concluído';if(/atrasad|em atraso/.test(s))return 'Atrasado';if(/atencao|critic/.test(s))return 'Ponto de Atenção';if(/planeja/.test(s))return 'Em planejamento';if(/analise/.test(s))return 'Em análise';if(/andamento|execu/.test(s))return 'Em andamento';return raw.replace(/^\d+\s*[-–—.:]\s*/,'')}
const requestedStatusPalette={'Concluído':'#00DE94','Em andamento':'#007EFF','Não iniciado':'#F2F2F2','Atrasado':'#E35336','Ponto de Atenção':'#BE5103','Cancelado':'#000000','Em planejamento':'#FFBF00','Paralisado':'#6B1025','Em análise':'#7C3AED','Não informado':'#94A3B8','Pessoal':'#D946EF','Reunião':'#0E7490'};
const legacyStatusColor=statusColor;
statusColor=function(label,i=0){const key=canonicalStatus(label),custom=workflowSettings().statusPaletteV3?.[key];return validHex(custom)?custom:requestedStatusPalette[key]||legacyStatusColor(label,i)};
const legacyColorLabels=colorLabels;colorLabels=function(){return [...new Set([...Object.keys(requestedStatusPalette),...legacyColorLabels().map(canonicalStatus)])]};
saveStatusColors=function(){if(me()?.role!=='Administrador')return;const colors={};for(const input of document.querySelectorAll('#statusColorsForm input[data-label]'))if(validHex(input.value))colors[canonicalStatus(input.dataset.label)]=input.value;workflowSettings().statusPaletteV3=colors;persist('Personalizou cores por situação','Portal');closeModal();render()};
resetStatusColors=function(){if(me()?.role!=='Administrador')return;delete workflowSettings().statusPaletteV3;persist('Restaurou cores por situação','Portal');closeModal();render()};
function physicalProgress(value){if(value==null||typeof value==='boolean'||String(value).trim()==='')return null;const s=String(value).trim().replace(/%$/,'').trim().replace(',','.');if(!/^\d+(?:\.\d+)?$/.test(s))return null;const n=Number(s);return Number.isFinite(n)&&n>=0&&n<=100?n:null}
const statusAgendaBefore=agendaEvents;
// Obras usam o mesmo status do Acompanhamento (a coluna de status do projeto), e não o campo interno
// "status", que a importação preenche com "Ainda não definido". Termos, projetos e lembretes mantêm o seu.
function agendaEventStatus(e){const r=e.r||{},p=r.project;if(p&&!e.term&&!e.projectOnly&&!e.personal)return workStatusOf(r,p);return canonicalStatus(r.status)}
agendaEvents=function(){return statusAgendaBefore().map(e=>({...e,r:{...e.r,status:agendaEventStatus(e)}}))};
/* Filtro "Todos os status" (Acompanhamento, Calendário, exportação): usa o status real da obra, o mesmo do
   Acompanhamento, e lista só os status que existem nas obras visíveis. "Planejamento" e "Em planejamento"
   são o mesmo status (comparação pela forma padrão). */
function recordRealStatus(r,p){return workStatusOf(r,p||projectOfRecord(r))}
function statusFilterMatch(r,p){return !filterStatus||recordRealStatus(r,p)===closedWorkStatus(filterStatus)||recordRealStatus(r,p)===filterStatus}
function statusFilterOptions(){const seen=new Set();for(const p of visible().filter(p=>!filterProject||p.id===filterProject))for(const r of p.records||[]){const s=recordRealStatus(r,p);if(s)seen.add(s)}
const order=[...WORK_STATUS_LIST,'Fora da lista','Não informado'],rank=s=>order.includes(s)?order.indexOf(s):500;
const list=[...seen].sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b,'pt-BR'));
if(filterStatus&&!list.some(s=>s===filterStatus||s===closedWorkStatus(filterStatus)))list.unshift(filterStatus);return list}
// Recompute time-dependent alerts while the overview is open, never during an edit.
function refreshOverviewIfIdle(){if(!document.hidden&&typeof tab!=='undefined'&&tab==='dashboard'&&!document.querySelector('#modal .dialog')&&!document.activeElement?.matches('input,textarea,select,[contenteditable=true]'))render()}
setInterval(refreshOverviewIfIdle,60000);window.addEventListener('focus',refreshOverviewIfIdle);
/* ===== Status da obra: FONTE ÚNICA e LISTA FECHADA =====
   Todas as telas (Visão geral, Acompanhamento, Calendário, BI, filtros, indicadores) leem o status
   por workStatusOf(). O valor vem da coluna de status do projeto (a mesma que o Acompanhamento grava).
   Valores fora da lista NÃO são apagados: aparecem como "Fora da lista" até alguém escolher um da lista. */
const WORK_STATUS_LIST=['Não iniciado','Em planejamento','Em análise','Em andamento','Ponto de Atenção','Atrasado','Paralisado','Concluído','Cancelado','Não se aplica'];
function closedWorkStatus(v){const raw=String(v??'').trim();if(!raw||/^[-—–.\s]*$/.test(raw))return 'Não informado';const c=canonicalStatus(raw);if(c==='Não informado')return c;return WORK_STATUS_LIST.includes(c)?c:'Fora da lista'}
function workStatusKey(p){return typeof obraStatusKey==='function'?obraStatusKey(p):(fieldKey(p,'status')||'status')}
const workStatusProjectCache=new WeakMap();
function projectOfRecord(r){if(!r||typeof r!=='object')return null;if(r.project&&r.project.fields)return r.project;if(workStatusProjectCache.has(r))return workStatusProjectCache.get(r);const p=(db.projects||[]).find(p=>(p.records||[]).includes(r))||null;workStatusProjectCache.set(r,p);return p}
function workStatusOf(r,p){
  p=p||projectOfRecord(r);
  if(!p)return closedWorkStatus(r?.status);
  const key=workStatusKey(p),own=closedWorkStatus(r?.[key]);
  // Projeto SEM coluna de status (só macroetapa): usa a etapa reconhecida, convertida para a lista.
  if(own==='Não informado'&&!(p.fields||[]).some(f=>f.id===key)){
    const stage=typeof workStageKey==='function'?workStageKey(p):'';
    const fromStage=stage&&typeof recognizedWorkStatus==='function'?recognizedWorkStatus(r?.[stage]):null;
    if(fromStage)return closedWorkStatus(fromStage);
  }
  return own;
}
// Status da lista que existem nas obras de um projeto (para filtros).
function workStatusOptionsFor(p){const seen=new Set((p?.records||[]).map(r=>workStatusOf(r,p)));return [...WORK_STATUS_LIST.filter(s=>seen.has(s)),...['Fora da lista','Não informado'].filter(s=>seen.has(s))]}
// val(r,p,'status') passa a devolver o status da lista em todo o portal.
const valBeforeClosedStatus=val;
val=function(r,p,s){return s==='status'?workStatusOf(r,p):valBeforeClosedStatus(r,p,s)};
// Ficha da obra: o campo de status é sempre uma lista com os valores permitidos.
// Um valor antigo fora da lista continua selecionado (para não ser apagado sem querer), marcado como tal.
function isWorkStatusField(field){return (db.projects||[]).some(p=>workStatusKey(p)===field.id&&(p.fields||[]).some(f=>f===field||f.id===field.id))}
const statusInputBefore=inputField;
inputField=function(field,value,disabled){if(field&&(field.id==='status'||isWorkStatusField(field))&&!['date','number','currency'].includes(field.type)){const current=String(value??'').trim(),closed=closedWorkStatus(current);let options=[...WORK_STATUS_LIST];let chosen=WORK_STATUS_LIST.includes(closed)?closed:current;if(closed==='Fora da lista')options=[current,...options];field={...field,type:'select',options};const html=statusInputBefore(field,chosen,disabled);return closed==='Fora da lista'?html.replace('>'+esc(current)+'</option>','>'+esc(current)+' (fora da lista: escolha um status)</option>'):html}return statusInputBefore(field,value,disabled)};
