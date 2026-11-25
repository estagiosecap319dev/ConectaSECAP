/* Modelos configuráveis; mantêm os dados de origem e as permissões existentes. */
const containerModelTypes = ['comparison','ranking','distribution','funding','deadlines'];
Object.assign(containerTypes, {
  comparison:'Comparação de dois indicadores', ranking:'Ranking / maiores valores',
  distribution:'Distribuição por campo', funding:'Origem e captação', deadlines:'Vigência e janelas de prazo'
});
function defaultContainerModel(p) {
  const numbers=(p?.fields||[]).filter(f=>['number','currency'].includes(f.type));
  return {primary:fieldKey(p||{fields:[]},'budget')||numbers[0]?.id||'',
    secondary:fieldKey(p||{fields:[]},'spent')||numbers[1]?.id||'',
    group:fieldKey(p||{fields:[]},'stage')||(p?.fields||[]).find(f=>f.type==='select')?.id||'',
    date:fieldKey(p||{fields:[]},'deadline')||'',start:biDateField(p||{fields:[]},'startDate')?.id||'',agg:'sum',format:'currency',limit:10};
}
function customizeBuiltinContainerDraft() {
  if(!containerDraft)return;
  readContainerForm();
  const b=containerDraft.block,p=layoutProject()||visible()[0],defaults=newPageBlock('metric');
  b.project=layoutProject()?.id||(visible().length===1?visible()[0].id:'@visible');b.followFilters=true;b.customized=true;
  b.metric||=defaults.metric;b.chart||=defaults.chart;b.fields||=defaults.fields;
  b.model=defaultContainerModel(p);b.color||='#003856';
  const title=importHeaderKey(b.title);
  b.type=/fisico|compar/.test(title)?'comparison':/maiores|ranking/.test(title)?'ranking':/origem|captacao/.test(title)?'funding':/janela|linha.*entrega/.test(title)?'deadlines':/por.*etapa|distribu|investimento.*etapa/.test(title)?'distribution':'metric';
  if(b.type==='metric') {
    const candidates=(p?.fields||[]).filter(f=>['number','currency'].includes(f.type));
    const match=candidates.find(f=>importHeaderKey(f.name)===title)||candidates.find(f=>title.includes(importHeaderKey(f.name)));
    b.metric={field:match?.id||'@records',agg:match?'sum':'count',format:match?.type==='currency'?'currency':'number'};
    const situation=[[/andamento|execu/,'Em andamento'],[/conclu/,'Concluído'],[/planeja/,'Em planejamento'],[/paralis/,'Paralisado'],[/cancel/,'Cancelado']].find(([re])=>re.test(title));
    if(situation&&!match)Object.assign(b.metric,{filterField:'__situacao',filterValues:[situation[1]]});
  }
  renderContainerModal();
}
function restoreBuiltinContainerDraft(){if(!containerDraft)return;readContainerForm();containerDraft.block.customized=false;renderContainerModal()}
function readContainerModel(b,d) {
  if(!containerModelTypes.includes(b.type)||!d.has('modelPrimary'))return;
  b.model={primary:d.get('modelPrimary')||'',secondary:d.get('modelSecondary')||'',group:d.get('modelGroup')||'',date:d.get('modelDate')||'',start:d.get('modelStart')||'',agg:d.get('modelAgg')||'sum',format:d.get('modelFormat')||'number',limit:Math.max(1,Math.min(50,Number(d.get('modelLimit'))||10))};
}
function containerModelFields(b,p) {
  if(!containerModelTypes.includes(b.type)||!p||(b.builtin&&!b.customized))return '';
  const m={...defaultContainerModel(p),...b.model};
  const select=(name,label,value,test=()=>true)=>`<div class="field"><label>${label}</label><select name="${name}"><option value="">Não associado</option>${p.fields.filter(test).map(f=>`<option value="${esc(f.id)}" ${f.id===value?'selected':''}>${esc(f.name)}</option>`).join('')}</select></div>`;
  let html='<fieldset class="typography-editor"><legend>Campos usados neste modelo</legend>';
  const numeric=f=>['number','currency'].includes(f.type),isDate=f=>f.type==='date'||/vigencia|prazo|data/.test(importHeaderKey(f.name));
  html+=select('modelPrimary','Coluna principal / valor',m.primary,numeric);
  if(b.type==='comparison')html+=select('modelSecondary','Segunda coluna para comparar',m.secondary,numeric);
  if(['distribution','funding'].includes(b.type))html+=select('modelGroup','Agrupar por / fonte dos recursos',m.group,f=>!['link'].includes(f.type));
  if(b.type==='deadlines')html+=select('modelDate','Data final / vencimento',m.date,isDate)+select('modelStart','Data inicial (opcional)',m.start,isDate);
  html+=`<div class="twocol"><div class="field"><label>Cálculo dos valores</label><select name="modelAgg">${['sum','avg','count','min','max'].map(k=>`<option value="${k}" ${m.agg===k?'selected':''}>${aggregationNames[k]||k}</option>`).join('')}</select></div><div class="field"><label>Formato</label><select name="modelFormat">${[['number','Número'],['currency','R$'],['percent','Percentual']].map(([k,n])=>`<option value="${k}" ${m.format===k?'selected':''}>${n}</option>`).join('')}</select></div></div><div class="field"><label>Quantidade de registros / grupos exibidos</label><input type="number" name="modelLimit" min="1" max="50" value="${m.limit}"></div><small>Os campos selecionados alteram apenas este contêiner. Não modificam os dados ou os demais blocos do BI.</small></fieldset>`;
  return html;
}
const renderContainerBeforeModels=renderCustomContainer;
renderCustomContainer=function(b,depth=0) {
  if(!containerModelTypes.includes(b.type))return renderContainerBeforeModels(b,depth);
  const source=sourceForContainer(b);
  if(!source)return renderContainerBeforeModels({...b,type:'list'},depth);
  const {p,rows}=source,m={...defaultContainerModel(p),...b.model},field=id=>p.fields.find(f=>f.id===id),fmt=value=>formatVisual(value,m.format),calc=rs=>aggregateVisual(rs,m.primary,m.agg);
  let body='';
  if(b.type==='comparison')body=`<div class="container-model-pair">${[m.primary,m.secondary].map(id=>`<div><small>${esc(field(id)?.name||'Escolha uma coluna')}</small><strong>${field(id)?fmt(aggregateVisual(rows,id,m.agg)):'—'}</strong></div>`).join('')}</div>`;
  else if(b.type==='ranking') {
    const ranked=rows.filter(r=>r[m.primary]!==''&&r[m.primary]!=null&&Number.isFinite(Number(r[m.primary]))).sort((a,b)=>Number(b[m.primary])-Number(a[m.primary])).slice(0,m.limit),max=Math.max(1,...ranked.map(r=>Number(r[m.primary])));
    body=field(m.primary)?ranked.map(r=>`<div class="container-model-row"><span>${esc(recordTitle(r,p))}</span><div class="container-model-bar"><i style="width:${Math.max(0,Number(r[m.primary])/max*100)}%"></i></div><b>${fmt(Number(r[m.primary]))}</b></div>`).join(''):'';
  } else if(b.type==='deadlines') {
    const dated=rows.map(r=>({r,date:spreadsheetDate(r[m.date])})).filter(x=>x.date),todayDate=today();
    body=`<div class="container-model-windows">${[['Com prazo',dated.length],['Vencidos',dated.filter(x=>x.date<todayDate&&!isFinished(x.r,p)).length],['Próximos 30 dias',dated.filter(x=>daysLeft(x.date)>=0&&daysLeft(x.date)<=30&&!isFinished(x.r,p)).length]].map(([label,value])=>`<div><small>${label}</small><strong>${value}</strong></div>`).join('')}</div>${dated.sort((a,b)=>a.date.localeCompare(b.date)).slice(0,m.limit).map(x=>`<div class="container-model-date"><span>${esc(recordTitle(x.r,p))}${spreadsheetDate(x.r[m.start])?`<small>Início: ${esc(date(spreadsheetDate(x.r[m.start])))}</small>`:''}</span><b>${esc(date(x.date))}</b></div>`).join('')}`;
  } else {
    const grouped=new Map();
    if(field(m.group))for(const r of rows){const label=String(r[m.group]||'Não informado').trim(),key=label.toLocaleLowerCase('pt-BR');if(!grouped.has(key))grouped.set(key,{label,rows:[]});grouped.get(key).rows.push(r)}
    const groups=[...grouped.values()].map(g=>({...g,value:m.agg==='count'?g.rows.length:calc(g.rows)})).sort((a,b)=>(Number(b.value)||0)-(Number(a.value)||0)).slice(0,m.limit),max=Math.max(1,...groups.map(g=>Number(g.value)||0));
    if(b.type==='funding'&&field(m.primary))body=`<div class="container-model-summary">${fmt(calc(rows))}</div><p>${esc(field(m.primary).name)}</p>`;
    body+=groups.map(g=>`<div class="container-model-row"><span>${esc(g.label)}</span><div class="container-model-bar"><i style="width:${Math.max(0,(Number(g.value)||0)/max*100)}%"></i></div><b>${fmt(g.value)}</b></div>`).join('');
  }
  return `<section class="panel"><div class="panelhead"><div><h2>${esc(b.alias||b.title)}</h2><small>${esc(b.description||containerSourceLabel(b))}</small></div></div><div class="panelbody">${body||empty('Selecione os campos deste contêiner','Edite este bloco e associe as colunas que deseja analisar.')}</div></section>`;
};
