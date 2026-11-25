/* Visão geral e criação guiada. Somente leitura dos registros; configurações usam o layout existente. */
function overviewKey(v) { return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR'); }
function overviewNumber(value) { return value==null||String(value).trim()===''?null:visualNumber(value); }
function overviewSettings() {
  const defaults={minYear:2000,maxYear:new Date().getFullYear()+30,outlierFactor:10,maxAmount:null};
  try { const s=JSON.parse(localStorage.getItem('secap-review:'+String(session||'guest'))||'null');
    if(s) return {...defaults,minYear:Math.max(1900,Math.min(2099,Number(s.minYear)||defaults.minYear)),maxYear:Math.max(2000,Math.min(2200,Number(s.maxYear)||defaults.maxYear)),outlierFactor:Math.max(3,Math.min(100,Number(s.outlierFactor)||10)),maxAmount:s.maxAmount>0?Number(s.maxAmount):null};
  } catch(e) {} return defaults;
}
function overviewDate(value, settings=overviewSettings()) {
  const raw=String(value??'').trim();if(!raw)return {date:'',valid:false,missing:true,reason:''};
  const date=spreadsheetDate(raw);
  if(!date)return {date:'',valid:false,missing:false,reason:'Data inválida ou formato não reconhecido'};
  const year=Number(date.slice(0,4));
  if(year<settings.minYear||year>settings.maxYear)return {date,valid:false,missing:false,reason:`Ano ${year} fora da faixa de conferência (${settings.minYear}–${settings.maxYear})`};
  return {date,valid:true,missing:false,reason:''};
}
function overviewDeadline(r,p) { const f=biField(p,'deadline');return {...overviewDate(f?r[f.id]:''),field:f}; }
function overviewIdField(p) {return p?.fields?.find(f=>importHeaderKey(f.name)==='id')||p?.fields?.find(f=>f.id==='codigo');}
function overviewCompareId(a,b,p) {
  const f=overviewIdField(p);if(!f)return 0;
  const x=String(a[f.id]??'').trim(),y=String(b[f.id]??'').trim();
  if(!x||!y)return x?-1:y?1:0;
  return x.localeCompare(y,'pt-BR',{numeric:true,sensitivity:'base'});
}
function overviewReview(projects) {
  const settings=overviewSettings(),issues=[],mapping=[],items=[];
  const add=(p,r,f,kind,reason,value)=>issues.push({p,r,field:f?.name||'Registro',kind,reason,value:String(value??'')});
  for(const p of projects) {
    const budget=biField(p,'budget'),spent=biField(p,'spent'),progress=biField(p,'progress'),deadline=biField(p,'deadline'),start=biField(p,'startDate')||biDateField(p,'startDate');
    mapping.push({p,budget,spent,deadline,start});
    const dates=(p.fields||[]).filter(f=>f.type==='date'||(/vigencia|data.*(inicio|fim|entrega)|prazo.*(entrega|final|conclusao)/.test(importHeaderKey(f.name))&&!/dias|meses|duracao/.test(importHeaderKey(f.name))));
    const moneyFields=(p.fields||[]).filter(f=>f.type==='currency'||[budget?.id,spent?.id].includes(f.id)||/^(valor|orcamento|investimento|contrapartida|repasse|executado|captado)/.test(importHeaderKey(f.name)));
    const medians=new Map();
    for(const f of moneyFields) {
      const values=(p.records||[]).map(r=>overviewNumber(r[f.id])).filter(n=>n!==null&&n>0).sort((a,b)=>a-b);
      medians.set(f.id,values.length>=5?(values[Math.floor((values.length-1)/2)]+values[Math.ceil((values.length-1)/2)])/2:null);
    }
    for(const r of p.records||[]) {
      const d=overviewDeadline(r,p),pv=budget?overviewNumber(r[budget.id]):null,sv=spent?overviewNumber(r[spent.id]):null;
      const status=typeof workSituation==='function'?workSituation(r,p):canonicalStatus(val(r,p,'status'));
      items.push({p,r,date:d,budget:pv,spent:sv,status,finished:isFinished(r,p),cancelled:/cancel/i.test(status)});
      for(const f of dates) {const v=r[f.id],check=overviewDate(v,settings);if(!check.missing&&!check.valid)add(p,r,f,'date',check.reason,v);}
      if(deadline&&!dates.some(f=>f.id===deadline.id)&&!d.valid&&!d.missing)add(p,r,deadline,'date',d.reason,r[deadline.id]);
      if(start&&deadline) {const a=overviewDate(r[start.id],settings),b=overviewDate(r[deadline.id],settings);if(a.valid&&b.valid&&a.date>b.date)add(p,r,deadline,'date','Data final anterior à data inicial',r[deadline.id]);}
      for(const f of moneyFields) {
        const raw=r[f.id];if(raw==null||String(raw).trim()==='')continue;
        const value=overviewNumber(raw),median=medians.get(f.id);
        if(value===null)add(p,r,f,'money','Valor financeiro não reconhecido como número',raw);
        else if(value<0)add(p,r,f,'money','Valor financeiro negativo: conferir o registro',raw);
        else if(settings.maxAmount&&value>settings.maxAmount)add(p,r,f,'money',`Acima do limite de conferência: ${money(settings.maxAmount)}`,raw);
        else if(median&&value>median*settings.outlierFactor)add(p,r,f,'money',`Valor acima de ${settings.outlierFactor} vezes a mediana desta coluna no projeto; pode ser legítimo`,raw);
      }
      if(pv!==null&&sv!==null&&pv>=0&&sv>pv)add(p,r,spent,'money','Valor executado maior que o previsto: conferir campos e valores',r[spent.id]);
      if(progress&&String(r[progress.id]??'').trim()) {const value=overviewNumber(r[progress.id]);if(value!==null&&(value<0||value>100))add(p,r,progress,'progress','Percentual fora da faixa de 0 a 100%',r[progress.id]);}
    }
  }
  return {issues,items,mapping,works:new Set(issues.map(i=>i.p.id+'|'+i.r.id)).size};
}
function overviewReviewPanel(projects) {
  const report=overviewReview(projects),counts=k=>report.issues.filter(i=>i.kind===k).length,missing=report.mapping.filter(x=>!x.budget||!x.deadline).length;
  return `<section class="panel overview-review-panel"><div class="panelhead"><div><span class="overview-eyebrow">CONFERÊNCIA DOS DADOS</span><h2>Antes de apresentar os números</h2><small>Alertas para revisão humana. Nenhum registro é corrigido ou excluído automaticamente.</small></div><button class="btn" onclick="openOverviewReviewSettings()">Critérios de conferência</button></div><div class="overview-review-grid"><button onclick="openOverviewReview('date')"><span>Datas a conferir</span><strong>${counts('date')}</strong><small>Inclui anos como 1900 e finais anteriores ao início</small></button><button onclick="openOverviewReview('money')"><span>Valores a conferir</span><strong>${counts('money')}</strong><small>Negativos, diferenças e valores fora do padrão</small></button><button onclick="openOverviewReview('progress')"><span>Percentuais a conferir</span><strong>${counts('progress')}</strong><small>Avanços fora da faixa de 0 a 100%</small></button><button onclick="openOverviewMappings()"><span>Associações pendentes</span><strong>${missing}</strong><small>Projetos sem coluna de valor previsto ou prazo associada</small></button></div><div class="overview-review-foot"><span>${report.works?`${report.works} obra(s) com pontos para conferir`:'Nenhum alerta pelos critérios atuais; isso não substitui a conferência da origem.'}</span><button class="textbtn" onclick="openOverviewReview('all')">Ver a conferência completa →</button></div></section>`;
}
function openOverviewReview(kind='all',project='@visible') {
  const report=overviewReview(visible().filter(p=>project==='@visible'||p.id===project)),list=report.issues.filter(i=>kind==='all'||i.kind===kind);
  modal('Conferência dos dados',`<p class="subtitle">${list.length} apontamento(s). Os valores abaixo são os registros originais, sem correção automática.</p><div class="overview-review-list">${list.map((i,n)=>`<article><div><b>${esc(recordTitle(i.r,i.p))}</b><small>${esc(i.p.name)} · ${esc(i.field)}</small><p>${esc(i.reason)}</p><code>${esc(i.value)}</code></div><button class="btn" onclick="openOverviewReviewWork(${n},'${kind}','${esc(project)}')">Abrir obra</button></article>`).join('')||'<p>Nenhum apontamento nesta categoria pelos critérios atuais.</p>'}</div>`,btn('Fechar','closeModal()','close'));
}
function openOverviewReviewWork(index,kind,project='@visible') {const i=overviewReview(visible().filter(p=>project==='@visible'||p.id===project)).issues.filter(i=>kind==='all'||i.kind===kind)[index];if(i){closeModal();editRecord(i.p.id,i.r.id);}}
function openOverviewReviewSettings() {
  const s=overviewSettings();modal('Critérios de conferência',`<form id="overviewReviewForm" onsubmit="event.preventDefault();saveOverviewReviewSettings(this)"><p>Esses critérios ajudam a selecionar o que conferir. Não declaram que um valor alto é um erro e não alteram as obras.</p><div class="twocol"><div class="field"><label>Ano mínimo para conferência</label><input name="minYear" type="number" min="1900" max="2099" value="${s.minYear}" required></div><div class="field"><label>Ano máximo para conferência</label><input name="maxYear" type="number" min="2000" max="2200" value="${s.maxYear}" required></div></div><div class="field"><label>Valor atípico: quantas vezes a mediana da coluna?</label><input name="outlierFactor" type="number" min="3" max="100" value="${s.outlierFactor}"><small>A comparação usa a mesma coluna no mesmo projeto, com pelo menos 5 valores positivos.</small></div><div class="field"><label>Limite financeiro para conferir (R$, opcional)</label><input name="maxAmount" type="number" min="0" step="0.01" value="${s.maxAmount||''}" placeholder="Deixe vazio para não definir um limite"></div><p class="subtitle">Preferência pessoal salva neste navegador.</p></form>`,btn('Voltar','closeModal()','arrow')+'<button class="btn primary" type="submit" form="overviewReviewForm">Salvar critérios</button>');
}
function saveOverviewReviewSettings(form) {
  const s=Object.fromEntries(new FormData(form));if(Number(s.minYear)>Number(s.maxYear))return notify('O ano mínimo deve ser menor ou igual ao máximo.');
  try{localStorage.setItem('secap-review:'+String(session||'guest'),JSON.stringify(s));}catch(e){return notify('Não foi possível salvar os critérios neste navegador.');}closeModal();render();
}
function openOverviewMappings() {
  const report=overviewReview(visible());modal('Origem dos números por projeto',`<p>Os totais usam uma coluna por informação em cada projeto. Colunas sem associação não entram no total.</p>${report.mapping.map(x=>`<article class="overview-mapping"><b>${esc(x.p.name)}</b><p>Valor previsto: <strong>${esc(x.budget?.name||'Não associado')}</strong></p><p>Valor executado: <strong>${esc(x.spent?.name||'Não associado')}</strong></p><p>Prazo: <strong>${esc(x.deadline?.name||'Não associado')}</strong></p><button class="btn" onclick="configureBI('${esc(x.p.id)}')">Configurar painel deste projeto</button></article>`).join('')}`,btn('Fechar','closeModal()','close'));
}
function overviewFinancePanel(projects) {
  const report=overviewReview(projects),active=report.items.filter(i=>!i.cancelled),b=active.filter(i=>i.budget!==null),s=active.filter(i=>i.spent!==null);
  const amount=items=>items.length?money(items.reduce((a,i)=>a+i.value,0)):'Não informado';
  return `<section class="panel overview-finance-panel"><div class="panelhead"><div><h2>Financeiro com origem identificada</h2><small>Obras não canceladas. Valores atípicos permanecem no total até revisão.</small></div><button class="textbtn" onclick="openOverviewMappings()">Ver colunas de origem</button></div><div class="overview-finance-grid"><div><small>Valor previsto</small><strong>${amount(b.map(i=>({value:i.budget})))}</strong><span>${b.length} de ${active.length} obras com valor informado</span></div><div><small>Valor executado</small><strong>${amount(s.map(i=>({value:i.spent})))}</strong><span>${s.length} de ${active.length} obras com valor informado</span></div></div></section>`;
}
function overviewStatusPanel(all) {
  const counts=new Map();for(const i of all){const name=i.status||'Não informado';counts.set(name,(counts.get(name)||0)+1);}
  const values=[...counts].sort((a,b)=>b[1]-a[1]),max=Math.max(1,...values.map(x=>x[1]));
  return `<section class="panel balanced-status overview-status-panel"><div class="panelhead"><div><h2>Situação das obras</h2><small>Quantidade por situação. Clique para consultar as obras.</small></div></div><div class="panelbody">${values.map(([name,count])=>`<button class="overview-status-row" data-status="${esc(name)}" onclick="dashStatusWorks(this.dataset.status)"><span>${esc(name)}</span><span class="overview-status-track"><i style="width:${count/max*100}%;background:${/^#[a-f0-9]{6}$/i.test(statusColor(name))?statusColor(name):'#7694a5'}"></i></span><b>${count}</b></button>`).join('')||'<p>Nenhuma obra nesta seleção.</p>'}<small class="overview-status-total">${all.length} obras nesta visão · nenhuma situação omitida</small></div></section>`;
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
