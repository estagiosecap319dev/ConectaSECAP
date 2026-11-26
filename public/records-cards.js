/* records-cards.js — formatos da lista de obras de cada projeto: Master-detail / Tabela / Cards. */
(function () {
  'use strict';
  // Nova chave: com a chegada do Master-detail, todos começam nele (a escolha anterior era Tabela/Cards).
  var KEY = 'secap-records-view-v2';
  var MODES = ['master', 'table', 'cards'];
  window.recordsView = 'master';
  try { var saved = localStorage.getItem(KEY); if (MODES.indexOf(saved) >= 0) window.recordsView = saved; } catch (e) {}

  window.setRecordsView = function (mode) {
    window.recordsView = MODES.indexOf(mode) >= 0 ? mode : 'master';
    try { localStorage.setItem(KEY, window.recordsView); } catch (e) {}
    render();
  };

  /* 1) botões de alternância no cabeçalho do painel "Obras e registros" */
  var viewBefore = projectView;
  projectView = function () {
    var html = viewBefore();
    var button = function (mode, ic, label) {
      var on = window.recordsView === mode;
      return '<button type="button" class="' + (on ? 'is-on' : '') + '" aria-pressed="' + on + '" onclick="setRecordsView(\'' + mode + '\')">' + icon(ic) + ' ' + label + '</button>';
    };
    var toggle =
      '<div class="view-toggle" role="group" aria-label="Formato de exibição das obras">' +
      button('master', 'menu', 'Master-detail') + button('table', 'sheet', 'Tabela') + button('cards', 'dashboard', 'Cards') + '</div>';
    return '<div class="municipal-project-detail">'+html.replace('<h2>Obras e registros</h2>', '<h2>Obras e registros</h2>' + toggle)+'</div>';
  };

  /* 2) "master": lista + detalhe; "cards": cards; "table": tabela */
  var tableBefore = table;
  table = function (rs, limited) {
    if (window.recordsView === 'master' && !limited && projectId && rs.length) {
      var mp = visible().find(function (x) { return x.id === projectId; });
      if (mp) return masterDetail(rs, mp);
    }
    if (window.recordsView !== 'cards' || limited || !projectId || !rs.length) { const html=tableBefore.apply(this, arguments); return projectId&&!limited?sheetMarkup(html):html; }
    var p = visible().find(function (x) { return x.id === projectId; });
    if (!p) return tableBefore.apply(this, arguments);
    var shown = rs.slice(0, tableLimit);
    return '<div class="rcards">' + shown.map(function (r) { return card(r, p); }).join('') + '</div>' +
      '<div class="tablefoot"><span>' + shown.length + ' de ' + rs.length + ' obras</span>' +
      (rs.length > tableLimit
        ? '<button class="textbtn" onclick="showMoreRows()">Mostrar mais ' + Math.min(50, rs.length - tableLimit) + ' obras</button>'
        : '<span>Clique em um card para abrir a obra</span>') + '</div>';
  };

  function sheetMarkup(html){
    const t=document.createElement('template');t.innerHTML=html;const grid=t.content.querySelector('table');if(!grid)return html;
    grid.classList.add('records-sheet');grid.setAttribute('aria-label','Obras: use as setas para navegar nas células. Abra pelo nome da obra.');
    // The redundant action column is removed: only the first column opens a record.
    const last=grid.querySelector('thead tr')?.lastElementChild;if(last?.textContent.trim()==='Ações'){last.remove();grid.querySelectorAll('tbody tr').forEach(r=>r.lastElementChild.remove())}
    grid.querySelectorAll('tbody td').forEach((cell,i)=>{cell.tabIndex=i===0?0:-1});
    const hint=t.content.querySelector('.tablefoot');if(hint){const h=document.createElement('span');h.className='sheet-hint';h.textContent='Clique em uma célula e use ← ↑ ↓ →. Para abrir a obra, clique no nome.';hint.append(h)}
    return t.innerHTML;
  }
  function selectCell(cell){const grid=cell.closest('.records-sheet');grid.querySelectorAll('td[tabindex="0"]').forEach(e=>e.tabIndex=-1);cell.tabIndex=0;cell.focus({preventScroll:true});if(cell.scrollIntoView)cell.scrollIntoView({block:'nearest',inline:'nearest'});
    // A coluna fixa cobre células à esquerda; scrollIntoView não desconta essa área.
    let viewport=grid.parentElement;
    while(viewport&&viewport!==document.body){const style=getComputedStyle(viewport);if(/auto|scroll/.test(style.overflowX)&&viewport.scrollWidth>viewport.clientWidth+1)break;viewport=viewport.parentElement}
    if(!viewport||viewport===document.body)return;
    if(cell.cellIndex===0){viewport.scrollLeft=0;return}
    const first=cell.parentElement.cells[0],fixed=getComputedStyle(first).position==='sticky'?first.getBoundingClientRect().width:0;
    const frame=viewport.getBoundingClientRect(),box=cell.getBoundingClientRect(),left=frame.left+viewport.clientLeft+fixed+8,right=frame.left+viewport.clientLeft+viewport.clientWidth-8;
    if(box.width>right-left){viewport.scrollLeft+=box.left-left}else if(box.left<left){viewport.scrollLeft-=left-box.left}else if(box.right>right){viewport.scrollLeft+=box.right-right}
    viewport.scrollLeft=Math.max(0,Math.min(viewport.scrollLeft,viewport.scrollWidth-viewport.clientWidth));}
  document.addEventListener('click',function(e){const cell=e.target.closest('.records-sheet tbody td');if(!cell)return;selectCell(cell);if(cell.cellIndex>0){e.preventDefault();e.stopPropagation()}},true);
  document.addEventListener('keydown',function(e){const cell=e.target.closest('.records-sheet tbody td');if(!cell||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;const offsets={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};const delta=offsets[e.key];if(!delta)return;e.preventDefault();e.stopPropagation();const rows=cell.parentElement.parentElement.rows,row=cell.parentElement.sectionRowIndex;const next=rows[row+delta[0]]?.cells[cell.cellIndex+delta[1]];if(next)selectCell(next)},true);
  function cardValue(r,p,id,label,semantic){const f=p.fields.find(f=>f.id===id)||p.fields.find(f=>String(f.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()===label);const v=(semantic?val(r,p,semantic):undefined)??r[f?.id||id];return v==null||v===''?'—':String(v)}
  function card(r,p){
    const status=canonicalStatus(val(r,p,'status')||r.status),title=recordTitle(r,p);
    const fields=[['ID',cardValue(r,p,'codigo','id')],['Órgão responsável',cardValue(r,p,'orgao','orgao responsavel','agency')],['Macroetapa',cardValue(r,p,'etapa','macroetapa','stage')],['Prioridade',cardValue(r,p,'prioridade','prioridade','priority')]];
    const open="editRecord('"+esc(p.id)+"','"+esc(r.id)+"')";
    // A cor do topo do card acompanha a cor do status da obra.
    const chip=badge(status),tint=(/--status-color:([^;"]+)/.exec(chip)||[])[1]||'#0a7cc1';
    return '<article class="rcard municipal-work-card" style="--wc:'+esc(tint)+'" tabindex="0" role="button" aria-label="Abrir '+esc(title)+'" onclick="'+open+'" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();'+open+'}">'+'<div class="work-card-band"><div class="work-card-heading"><h3>'+esc(title)+'</h3></div></div><div class="rc-grid">'+fields.map(([label,value])=>'<div class="rc-item"><span>'+label+'</span><b>'+esc(value)+'</b></div>').join('')+'</div><footer class="rc-foot"><span class="work-card-status">'+chip+'</span><span class="rc-open">Abrir obra'+icon('arrow')+'</span></footer></article>';
  }

  /* ======================================================================
     3) MASTER-DETAIL: lista de obras à esquerda, detalhe da obra selecionada à direita.
     Os campos são achados pelo vínculo do painel (BI) ou pelo nome da coluna, porque
     cada pasta tem códigos próprios (ex.: f_regiao_8c1d).
     ====================================================================== */
  var mdSelected = {};
  function mdKey(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  // Ordem: 1) vínculo configurado no painel do projeto; 2) nome da coluna; 3) reconhecimento automático.
  function mdField(p, names, semantic) {
    var fields = p.fields || [];
    var mapped = semantic && p.biMapping && p.biMapping[semantic];
    if (mapped) { var m = fields.find(function (x) { return String(x.id) === String(mapped); }); if (m) return m; }
    for (var i = 0; i < names.length; i++) {
      var key = names[i];
      var f = fields.find(function (x) { return String(x.id) === key || mdKey(x.name) === key; });
      if (f) return f;
    }
    if (semantic && typeof biField === 'function') { var b = biField(p, semantic); if (b) return b; }
    return null;
  }
  function mdText(r, f) { var v = f ? r[f.id] : ''; return v == null ? '' : String(v).trim(); }
  function mdFields(p) {
    return {
      id: mdField(p, ['codigo', 'id']),
      orgao: mdField(p, ['orgao', 'orgaoresponsavel', 'secretaria', 'unidade'], 'agency'),
      regiao: mdField(p, ['regiao']),
      etapa: mdField(p, ['etapa', 'macroetapa', 'macroetapaatual'], 'stage'),
      prioridade: mdField(p, ['prioridade'], 'priority'),
      sei: mdField(p, ['sei', 'processosei', 'numerosei']),
      responsavel: mdField(p, ['responsavelacompanhamento', 'responsavel'], 'owner'),
      tipo: mdField(p, ['tipo', 'tipodeobra', 'tipodaobra', 'tipoprojeto', 'tipodeprojeto']),
      valor: mdField(p, ['valorestimadoexecucaoobra', 'valor', 'valorprevisto', 'investimento', 'investimentoprevisto', 'valortotal'], 'budget'),
      avanco: mdField(p, ['execucao', 'avancofisico', 'progresso', 'percentualexecucao', 'percentualexecutado'], 'progress'),
      inicio: mdField(p, ['datainicio', 'datainiciodoprojetochegadadademandanasecap', 'previsaoplanejamento', 'inicio'], 'startDate'),
      fim: mdField(p, ['prazo', 'previsaoencerramento', 'datafim', 'termino'], 'deadline'),
    };
  }
  function mdPriorityChip(value) {
    var v = String(value || '').trim();
    if (!v) return '';
    var k = mdKey(v);
    var tone = /muitoalta|critic/.test(k) ? 'is-critical' : /alta/.test(k) ? 'is-high' : /media/.test(k) ? 'is-medium' : /baixa/.test(k) ? 'is-low' : 'is-neutral';
    return '<span class="md-priority ' + tone + '">● ' + esc(v) + '</span>';
  }
  function mdMonth(value) {
    var iso = typeof spreadsheetDate === 'function' ? spreadsheetDate(value) : String(value || '').slice(0, 10);
    var m = /^(\d{4})-(\d{2})/.exec(iso || '');
    if (!m) return '';
    return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][Number(m[2]) - 1] + '/' + m[1];
  }
  function mdMoney(r, f) {
    var raw = f ? r[f.id] : '';
    if (raw === '' || raw == null) return '—';
    var n = typeof parseCurrencyInput === 'function' ? parseCurrencyInput(String(raw)) : Number(raw);
    return n == null || !isFinite(n) ? String(raw) : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function mdPercent(r, f) {
    var raw = f ? r[f.id] : '';
    var n = typeof physicalProgress === 'function' ? physicalProgress(raw) : Number(raw);
    if (n == null || !isFinite(n)) return '—';
    return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
  }
  function mdCanEditField(p, r, f) {
    if (!f || !canEdit(p)) return false;
    if (typeof memberFieldAllowed === 'function' && !memberFieldAllowed(p.id, f.id)) return false;
    if (typeof canEditSelectedWork === 'function' && !canEditSelectedWork(p.id, r.id)) return false;
    return true;
  }
  function mdListItem(r, p, F, selected) {
    var stage = mdText(r, F.etapa), stageNum = (/^\s*(\d{1,3})/.exec(stage) || [])[1] || '';
    var meta = [mdText(r, F.orgao), mdText(r, F.regiao)].filter(Boolean).join(' • ');
    return '<button type="button" class="md-item' + (selected ? ' is-selected' : '') + '" data-rid="' + esc(r.id) + '" aria-selected="' + selected + '" role="option" onclick="mdSelect(this.closest(\'.md-wrap\').dataset.pid, this.dataset.rid)">' +
      '<span class="md-item-top"><span class="md-id">ID ' + esc(mdText(r, F.id) || '—') + '</span>' + mdPriorityChip(mdText(r, F.prioridade)) + '</span>' +
      '<b class="md-item-title">' + esc(recordTitle(r, p)) + '</b>' +
      '<span class="md-item-foot"><span>' + esc(meta || '—') + '</span>' + (stageNum ? '<span class="md-stage-num" title="' + esc(stage) + '">' + esc(stageNum) + '</span>' : '') + '</span></button>';
  }
  function mdDetail(r, p, F) {
    var cell = function (label, inner, extra) { return '<div class="md-cell' + (extra || '') + '"><small>' + label + '</small>' + inner + '</div>'; };
    var plain = function (v) { return '<b>' + esc(v || '—') + '</b>'; };
    var stage = mdText(r, F.etapa), sei = mdText(r, F.sei);
    var tipoRegiao = [mdText(r, F.tipo), mdText(r, F.regiao)].filter(Boolean).join(' • ');
    var status = typeof workSituation === 'function' ? workSituation(r, p) : canonicalStatus(val(r, p, 'status'));
    if (!status || status === 'Não informado') status = 'Ainda não definido';
    var inicio = mdMonth(F.inicio ? r[F.inicio.id] : ''), fim = mdMonth(F.fim ? r[F.fim.id] : '');
    var pct = mdPercent(r, F.avanco), pctNum = parseFloat(String(pct).replace(',', '.'));
    var extraHtml =
      '<div class="md-grid md-grid-2">' +
      cell((F.valor && F.valor.name) || 'Investimento', '<b class="md-money">' + esc(mdMoney(r, F.valor)) + '</b>') +
      cell((F.avanco && F.avanco.name) || 'Avanço físico', '<b>' + esc(pct) + '</b>' + (isFinite(pctNum) ? '<span class="md-bar"><i style="width:' + Math.max(0, Math.min(100, pctNum)) + '%"></i></span>' : '')) +
      '</div>' +
      '<button type="button" class="md-all" data-pid="' + esc(p.id) + '" data-rid="' + esc(r.id) + '" onclick="editRecord(this.dataset.pid, this.dataset.rid)">' + icon('eye') + ' Ver todos os campos</button>';
    return '<div class="md-detail-head"><div><span class="md-detail-tag"><span class="md-id is-dark">ID ' + esc(mdText(r, F.id) || '—') + '</span>' + esc(p.name) + (mdText(r, F.orgao) ? ' · ' + esc(mdText(r, F.orgao)) : '') + '</span>' +
      '<h3>' + esc(recordTitle(r, p)) + '</h3></div>' +
      '<button type="button" class="md-open" data-pid="' + esc(p.id) + '" data-rid="' + esc(r.id) + '" onclick="editRecord(this.dataset.pid, this.dataset.rid)">Abrir obra completa →</button></div>' +
      '<div class="md-grid">' +
      cell((F.orgao && F.orgao.name) || 'Órgão responsável', plain(mdText(r, F.orgao))) +
      cell((F.etapa && F.etapa.name) || 'Macroetapa atual', stage ? '<span class="md-stage">' + esc(stage) + '</span>' : plain('')) +
      cell((F.prioridade && F.prioridade.name) || 'Prioridade', mdPriorityChip(mdText(r, F.prioridade)) || plain('')) +
      cell((F.sei && F.sei.name) || 'Processo SEI', sei ? '<span class="md-sei"><code>' + esc(sei) + '</code><button type="button" class="iconbtn" title="Copiar número do processo" aria-label="Copiar número do processo" data-copy="' + esc(sei) + '" onclick="mdCopy(this.dataset.copy)">' + icon('file') + '</button></span>' : plain('')) +
      cell((F.responsavel && F.responsavel.name) || 'Responsável', plain(mdText(r, F.responsavel))) +
      cell('Tipo / Região', '<b class="md-small">' + esc(tipoRegiao || '—') + '</b>') +
      '</div>' + extraHtml +
      '<footer class="md-detail-foot"><span>Cronograma previsto: <b>' + esc(inicio && fim ? inicio + ' - ' + fim : inicio || fim || 'não informado') + '</b></span><span>Status: <b>' + esc(status) + '</b></span></footer>';
  }
  function masterDetail(rs, p) {
    var F = mdFields(p);
    var byId = function (id) { return (p.records || []).find(function (x) { return String(x.id) === String(id); }); };
    var sel = mdSelected[p.id];
    if (!rs.some(function (r) { return String(r.id) === String(sel); })) sel = mdSelected[p.id] = rs[0].id;
    var current = byId(sel) || rs[0];
    return '<div class="md-wrap" data-pid="' + esc(p.id) + '">' +
      '<div class="md-list" role="listbox" aria-label="Obras" tabindex="-1" onkeydown="mdKeys(event, this.closest(\'.md-wrap\').dataset.pid)">' +
      rs.map(function (r) { return mdListItem(byId(r.id) || r, p, F, String(r.id) === String(sel)); }).join('') + '</div>' +
      '<section class="md-detail" id="mdDetail" aria-live="polite">' + mdDetail(current, p, F) + '</section></div>' +
      '<div class="tablefoot"><span>' + rs.length + ' obra(s)</span><span>Use ↑ ↓ na lista para trocar de obra</span></div>';
  }
  window.mdSelect = function (pid, rid) {
    var p = visible().find(function (x) { return x.id === pid; });
    var r = p && (p.records || []).find(function (x) { return String(x.id) === String(rid); });
    if (!r) return;
    mdSelected[pid] = rid;
    document.querySelectorAll('.md-item').forEach(function (b) { var on = b.dataset.rid === String(rid); b.classList.toggle('is-selected', on); b.setAttribute('aria-selected', on); if (on) b.scrollIntoView({ block: 'nearest' }); });
    var detail = document.getElementById('mdDetail');
    if (detail) detail.innerHTML = mdDetail(r, p, mdFields(p));
  };
  window.mdKeys = function (e, pid) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    var items = Array.prototype.slice.call(document.querySelectorAll('.md-item'));
    var i = items.findIndex(function (b) { return b.classList.contains('is-selected'); });
    var next = items[Math.max(0, Math.min(items.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
    if (!next) return;
    e.preventDefault();
    window.mdSelect(pid, next.dataset.rid);
    next.focus();
  };
  window.mdCopy = function (text) {
    var done = function () { notify('Número do processo copiado.'); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
  };
})();
