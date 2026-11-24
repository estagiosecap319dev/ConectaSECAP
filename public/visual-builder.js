/* Local visual authoring with Apache ECharts. No remote runtime requests. */
const visualTypes = {
  donut: 'Rosca / donut',
  pie: 'Pizza',
  barh: 'Barras horizontais',
  barv: 'Colunas verticais',
  stacked: 'Colunas empilhadas',
  stacked_h: 'Barras empilhadas',
  stacked100: 'Colunas 100% empilhadas',
  stacked100_h: 'Barras 100% empilhadas',
  line: 'Linha por data',
  area: 'Área por data',
  treemap: 'Mapa de árvore',
  funnel: 'Funil',
  gauge: 'Medidor / velocímetro',
  radar: 'Radar / teia',
  heatmap: 'Mapa de calor',
  combo: 'Colunas + Linha (Combinado)',
  waterfall: 'Cascata (Variação)',
};
const aggregationNames = {
  count: 'Contagem de registros',
  sum: 'Soma',
  avg: 'Média',
  min: 'Mínimo',
  max: 'Máximo',
  distinct: 'Contagem distinta',
};
const semanticNames = {
  status: 'Situação do projeto',
  stage: 'Macroetapa / pipeline',
  budget: 'Investimento previsto',
  spent: 'Valor executado',
  raised: 'Valor captado',
  progress: 'Avanço físico (%)',
  deadline: 'Prazo de encerramento',
  owner: 'Responsável',
  agency: 'Órgão',
  priority: 'Prioridade',
  source: 'Fonte / programa',
};
const semanticTypes = {
  status: ['select', 'text'],
  stage: ['select', 'text'],
  budget: ['currency', 'number'],
  spent: ['currency', 'number'],
  raised: ['currency', 'number'],
  progress: ['number'],
  deadline: ['date'],
  owner: ['text', 'responsible', 'select'],
  agency: ['text', 'select'],
  priority: ['text', 'select'],
  source: ['text', 'select'],
};
let biCrossFilters = {},
  visualDraft = null,
  visualPreview = null;

function biSavedViewsKey(pid) {
  const userKey = (window.SECAP_EMAIL || me()?.email || session || 'guest').toLowerCase();
  return `secap_bi_views_${userKey}_${pid}`;
}

function getBiSavedViews(pid) {
  if (!pid) return [];
  try {
    const raw = localStorage.getItem(biSavedViewsKey(pid));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setBiSavedViews(pid, views) {
  if (!pid) return;
  try {
    if (views.length) localStorage.setItem(biSavedViewsKey(pid), JSON.stringify(views));
    else localStorage.removeItem(biSavedViewsKey(pid));
  } catch {}
}

function openSaveBiViewModal(pid) {
  const activeCount = Object.keys(biCrossFilters).length + (query ? 1 : 0) + (filterStatus ? 1 : 0);
  if (!activeCount) {
    return notify('Aplique ao menos um filtro ou clique em um gráfico antes de salvar uma visão.');
  }
  modal(
    'Salvar visão personalizada',
    `<form id="saveBiViewForm" onsubmit="event.preventDefault();saveCurrentBiView('${pid}')">
      <div class="field">
        <label>Nome da visão *</label>
        <input name="viewName" required maxlength="45" placeholder="Ex.: Obras SEINFRA em andamento">
        <small>Esta visão ficará salva apenas para o seu usuário neste navegador.</small>
      </div>
    </form>`,
    btn('Cancelar', 'closeModal()', 'close') +
      `<button class="btn primary" type="submit" form="saveBiViewForm">${icon('check')} Salvar visão</button>`
  );
}

function saveCurrentBiView(pid) {
  const form = $('#saveBiViewForm');
  const name = String(form?.elements.viewName?.value || '').trim();
  if (!name) return;

  const views = getBiSavedViews(pid);
  views.push({
    id: uid(),
    name,
    crossFilters: structuredClone(biCrossFilters),
    query: query || '',
    filterStatus: filterStatus || '',
  });
  setBiSavedViews(pid, views);
  closeModal();
  render();
  notify(`Visão "${name}" salva nos seus favoritos.`);
}

function applyBiSavedView(pid, viewId) {
  const view = getBiSavedViews(pid).find((v) => v.id === viewId);
  if (!view) return;
  biCrossFilters = structuredClone(view.crossFilters || {});
  query = view.query || '';
  filterStatus = view.filterStatus || '';
  render();
  notify(`Visão "${view.name}" aplicada.`);
}

function deleteBiSavedView(pid, viewId) {
  const views = getBiSavedViews(pid).filter((v) => v.id !== viewId);
  setBiSavedViews(pid, views);
  render();
  notify('Visão removida.');
}

function renderBiSavedViewsBar(p) {
  const views = getBiSavedViews(p.id);
  const hasActiveFilters = Boolean(Object.keys(biCrossFilters).length || query || filterStatus);
  if (!views.length && !hasActiveFilters) return '';

  return `<div class="bi-saved-views-bar" role="region" aria-label="Minhas visões salvas">
    <span class="bi-views-label">${icon('eye')} Minhas visões:</span>
    <div class="bi-views-list">
      ${views
        .map((v) => {
          const isCurrent =
            JSON.stringify(v.crossFilters || {}) === JSON.stringify(biCrossFilters) &&
            (v.query || '') === (query || '') &&
            (v.filterStatus || '') === (filterStatus || '');
          return `<span class="bi-view-pill ${isCurrent ? 'active' : ''}">
            <button type="button" class="bi-view-apply" onclick="applyBiSavedView('${p.id}','${v.id}')">${esc(v.name)}</button>
            <button type="button" class="bi-view-del" title="Excluir visão" aria-label="Excluir visão ${esc(v.name)}" onclick="deleteBiSavedView('${p.id}','${v.id}')">${icon('close')}</button>
          </span>`;
        })
        .join('')}
      ${
        hasActiveFilters
          ? `<button type="button" class="btn sm bi-view-save-btn" onclick="openSaveBiViewModal('${p.id}')">${icon('plus')} Salvar filtros atuais como visão</button>`
          : ''
      }
    </div>
  </div>`;
}

const chartMounts = new Map(),
  activeCharts = new Set();
let chartResizeObserver = null;
const biFieldBeforeLabels = biField;
biField = function (p, s) {
  const f = biFieldBeforeLabels(p, s);
  return f ? { ...f, name: p.biLabels?.[s] || p.biColumnLabels?.[f.id] || f.name } : undefined;
};
function biColumnName(p, id) {
  return p.biColumnLabels?.[id] || p.fields.find((f) => f.id === id)?.name || 'Não associado';
}
function baseDesign(p) {
  const k = (sem) => fieldKey(p, sem),
    axis = k('agency') || k('owner') || k('status'),
    dimension = k('stage') || k('status'),
    budget = k('budget');
  return {
    layout: 'executive',
    density: 'comfortable',
    kpis: [
      {
        id: 'k_records',
        title: 'Obras e iniciativas',
        field: '@records',
        agg: 'count',
        format: 'number',
        color: '#003856',
        visible: true,
      },
      {
        id: 'k_budget',
        title: p.biLabels?.budget || 'Investimento previsto',
        field: budget,
        agg: 'sum',
        format: 'currency',
        color: '#f37021',
        visible: true,
      },
      {
        id: 'k_spent',
        title: p.biLabels?.spent || 'Valor executado',
        field: k('spent'),
        agg: 'sum',
        format: 'currency',
        color: '#169dc4',
        visible: true,
      },
      {
        id: 'k_progress',
        title: p.biLabels?.progress || 'Avanço físico médio',
        field: k('progress'),
        agg: 'avg',
        format: 'percent',
        color: '#268c48',
        visible: true,
      },
      {
        id: 'k_attention',
        title: 'Precisam de atenção',
        field: '@attention',
        agg: 'count',
        format: 'number',
        color: '#c93636',
        visible: true,
      },
      {
        id: 'k_done',
        title: 'Entregas concluídas',
        field: '@done',
        agg: 'count',
        format: 'number',
        color: '#268c48',
        visible: true,
      },
    ],
    charts: [
      {
        id: 'c_status',
        title: 'Como estão as iniciativas',
        subtitle: 'Composição da carteira por situação',
        type: 'donut',
        category: k('status'),
        value: '',
        series: '',
        agg: 'count',
        format: 'number',
        order: 'desc',
        limit: 10,
        labels: false,
        legend: true,
        wide: false,
        visible: true,
        palette: 'institutional',
      },
      {
        id: 'c_stage',
        title: 'Em qual etapa estamos',
        subtitle: 'Concentração de iniciativas no fluxo de entrega',
        type: 'barv',
        category: dimension,
        value: '',
        series: '',
        agg: 'count',
        format: 'number',
        order: 'desc',
        limit: 10,
        labels: true,
        legend: false,
        wide: false,
        visible: true,
        palette: 'institutional',
      },
      {
        id: 'c_cross',
        title: 'Órgãos × macroetapas',
        subtitle: 'Participação das etapas na carteira de cada órgão',
        type: 'stacked100',
        category: axis,
        series: dimension,
        value: '',
        agg: 'count',
        format: 'number',
        order: 'desc',
        limit: 10,
        labels: false,
        legend: true,
        wide: true,
        visible: true,
        palette: 'institutional',
      },
      {
        id: 'c_budget',
        title: 'Onde está o investimento',
        subtitle: 'Investimento previsto por órgão responsável',
        type: 'barh',
        category: axis,
        value: budget,
        series: '',
        agg: 'sum',
        format: 'currency',
        order: 'desc',
        limit: 10,
        labels: true,
        legend: false,
        wide: false,
        visible: true,
        palette: 'navy',
      },
    ],
  };
}
function getDesign(p) {
  return p.biDesign ? structuredClone(p.biDesign) : baseDesign(p);
}
function commitDesign(p, design, action = 'Personalizou o BI') {
  if (!canEdit(p)) return false;
  p.biDesignPrevious = getDesign(p);
  p.biDesign = structuredClone(design);
  persist(action, p, '', 'Configuração visual do projeto');
  return true;
}
function visualNumber(v) {
  return numberOrNull(v);
}
function aggregateVisual(rows, field, agg) {
  if (agg === 'count') return rows.length;
  const values = rows.map((r) => r[field]).filter((v) => v !== '' && v != null);
  if (agg === 'distinct') return values.length ? new Set(values.map(String)).size : null;
  const ns = values.map(visualNumber).filter((v) => v !== null);
  if (!ns.length) return null;
  return agg === 'avg'
    ? ns.reduce((a, b) => a + b, 0) / ns.length
    : agg === 'min'
      ? Math.min(...ns)
      : agg === 'max'
        ? Math.max(...ns)
        : ns.reduce((a, b) => a + b, 0);
}
function formatVisual(value, format = 'number', short = true) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  const n = Number(value);
  if (format === 'currency') return short ? compact(n) : money(n);
  if (format === 'percent') return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
  return n.toLocaleString('pt-BR', { maximumFractionDigits: aggPrecision(n) });
}
function aggPrecision(n) {
  return Number.isInteger(n) ? 0 : 1;
}
function selectedVisualFormat(p, c) {
  if (c.format && c.format !== 'auto') return c.format;
  if (['count', 'distinct'].includes(c.agg)) return 'number';
  return p.fields.find((f) => f.id === c.value)?.type === 'currency' ? 'currency' : 'number';
}
function visualCategory(v) {
  return v === '' || v == null ? 'Não informado' : String(v);
}
function visualLabel(p, c, value) {
  return p.fields.find((f) => f.id === c.category)?.type === 'date' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? date(value)
    : value;
}
function visualData(p, rs, c) {
  const isGauge = c.type === 'gauge';
  const dimension = p.fields.find((f) => f.id === c.category);
  if (!isGauge && !dimension) return { error: 'Associe a categoria a uma coluna do projeto.' };
  if (c.agg !== 'count' && !p.fields.some((f) => f.id === c.value))
    return { error: 'Associe a medida a uma coluna para calcular o indicador.' };
  if (
    c.type === 'combo' &&
    (c.agg2 || 'sum') !== 'count' &&
    !p.fields.some((f) => f.id === c.value2)
  )
    return { error: 'Associe a 2ª medida (linha) a uma coluna para o gráfico combinado.' };
  if (['line', 'area'].includes(c.type) && dimension.type !== 'date')
    return {
      error:
        'Para linha ou área, escolha uma coluna de data. Os pontos mostram os registros por data, sem criar uma série histórica de execução.',
    };
  const stacked = ['stacked', 'stacked_h', 'stacked100', 'stacked100_h', 'heatmap'].includes(
    c.type
  );
  if (stacked && !p.fields.some((f) => f.id === c.series))
    return { error: 'Escolha uma segunda coluna para compor os segmentos/eixos cruzados.' };
  if (stacked && !['count', 'sum'].includes(c.agg))
    return {
      error:
        'Cruzamento/empilhamento requer soma ou contagem. Para comparar médias, escolha barras simples.',
    };

  if (isGauge) {
    if (!rs.length)
      return {
        error: 'Nenhum registro corresponde aos filtros. Cadastre informações ou limpe a seleção.',
      };
    const total = aggregateVisual(rs, c.value, c.agg);
    if (total === null) return { error: 'Nenhum valor numérico informado para esta medida.' };
    return {
      groups: [{ name: c.title || 'Indicador', rows: rs, total }],
      names: [c.title || 'Medida'],
      matrix: [[total]],
      full: 1,
      stacked: false,
      dateOmitted: 0,
      format: c.format && c.format !== 'auto' ? c.format : 'percent',
    };
  }

  const originalRows = rs.length;
  if (['line', 'area'].includes(c.type)) {
    rs = rs.filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(String(r[c.category] || '')));
    if (!rs.length)
      return {
        error:
          'Nenhuma data preenchida para organizar este visual. Complete as datas dos registros.',
      };
  }
  let groups = groupRows(rs, c.category).map(([name, rows]) => ({
    name,
    rows,
    total: aggregateVisual(rows, c.value, c.agg),
  }));
  if (['line', 'area'].includes(c.type) || c.order === 'name')
    groups.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  else
    groups.sort((a, b) =>
      c.order === 'asc'
        ? (a.total ?? -Infinity) - (b.total ?? -Infinity)
        : (b.total ?? -Infinity) - (a.total ?? -Infinity)
    );
  const full = groups.length;
  groups = groups.slice(0, Math.max(1, Number(c.limit) || 10));
  let names = stacked
    ? [...new Set(rs.map((r) => visualCategory(r[c.series])))]
    : [c.title || 'Medida'];
  const matrix = names.map((name) =>
    groups.map((g) =>
      aggregateVisual(
        stacked ? g.rows.filter((r) => visualCategory(r[c.series]) === name) : g.rows,
        c.value,
        c.agg
      )
    )
  );
  const matrix2 =
    c.type === 'combo'
      ? [groups.map((g) => aggregateVisual(g.rows, c.value2, c.agg2 || 'sum'))]
      : null;

  const valid = matrix.flat().filter((v) => v !== null);
  if (!rs.length)
    return {
      error: 'Nenhum registro corresponde aos filtros. Cadastre informações ou limpe a seleção.',
    };
  if (!valid.length)
    return {
      error:
        'Nenhum valor numérico informado para esta medida. Campos vazios permanecem sem informação.',
    };
  if (
    ['pie', 'donut', 'treemap', 'stacked100', 'stacked100_h', 'funnel', 'radar'].includes(c.type) &&
    valid.some((v) => v < 0)
  )
    return {
      error:
        'Este visual exige medidas não negativas. Use barras simples ou cascata para valores negativos.',
    };
  if (['pie', 'donut', 'treemap', 'funnel'].includes(c.type) && valid.every((v) => v === 0))
    return {
      error:
        'Os valores informados somam zero. Use barras para visualizar os zeros sem criar uma composição artificial.',
    };
  return {
    groups,
    names,
    matrix,
    matrix2,
    full,
    stacked,
    dateOmitted: originalRows - rs.length,
    format: selectedVisualFormat(p, c),
  };
}
function semanticVisualColor(label, i, palette = 'institutional') {
  if (palette === 'navy') return ['#003856', '#246480', '#4388a5', '#75adc2', '#a7cbd8'][i % 5];
  if (palette === 'finance') return ['#003856', '#f37021', '#169dc4', '#268c48', '#8fa6b2'][i % 5];
  const n = String(label).toLowerCase();
  if (/muito alta|crític|atras|paralis/.test(n)) return '#c93636';
  if (/^alta$|atenção/.test(n)) return '#e57925';
  if (/conclu|entreg|encerr/.test(n)) return '#268c48';
  if (/planej/.test(n)) return '#d0ab39';
  if (/andamento/.test(n)) return '#169dc4';
  if (/não informado|não defin/.test(n)) return '#a4b3bc';
  return paletteColors[i % paletteColors.length];
}
const paletteColors = [
  '#003856',
  '#169dc4',
  '#f37021',
  '#268c48',
  '#8a73ad',
  '#7997a8',
  '#b99553',
  '#a5bdc8',
];
function visualOptions(p, rs, c, d) {
  const fmt = (v) => formatVisual(v, d.format),
    cats = d.groups.map((g) => g.name),
    labels = cats.map((v) => visualLabel(p, c, v)),
    colors = (d.stacked ? d.names : cats).map((n, i) => semanticVisualColor(n, i, c.palette)),
    is100 = ['stacked100', 'stacked100_h'].includes(c.type),
    base = {
      animationDuration: 280,
      color: colors,
      textStyle: {
        fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
        fontSize: 11,
        color: '#627e8d',
      },
      aria: { enabled: false },
      tooltip: {
        trigger: ['donut', 'pie', 'treemap', 'funnel', 'gauge', 'heatmap', 'radar'].includes(c.type)
          ? 'item'
          : 'axis',
        renderMode: 'richText',
        confine: true,
        z: 10,
        backgroundColor: '#fff',
        borderColor: '#dce6ec',
        textStyle: { color: '#294e63', fontSize: 11 },
        formatter: (params) => {
          if (c.type === 'heatmap') {
            const [xi, yi, val] = params.value || [];
            return `${labels[xi] || ''} · ${d.names[yi] || ''}\n${formatVisual(val, d.format, false)}`;
          }
          if (c.type === 'radar') {
            return cats
              .map(
                (cat, idx) =>
                  `${visualLabel(p, c, cat)}: ${formatVisual(params.value?.[idx], d.format, false)}`
              )
              .join('\n');
          }
          if (c.type === 'waterfall' && Array.isArray(params)) {
            const bar = params[1];
            if (!bar || bar.value === '-') return '';
            return `${bar.name}\n${formatVisual(bar.value, d.format, false)}`;
          }
          const items = Array.isArray(params) ? params : [params];
          return items
            .map((v) => {
              const n = v.name || '';
              let value = v.value;
              if (is100 && typeof v.dataIndex === 'number') {
                const seriesIndex = v.seriesIndex || 0;
                value = d.matrix[seriesIndex]?.[v.dataIndex];
              }
              return `${visualLabel(p, c, n)}${d.stacked || c.type === 'combo' ? ' · ' + v.seriesName : ''}\n${formatVisual(value, d.format, false)}${v.percent != null ? ' · ' + v.percent.toLocaleString('pt-BR') + '%' : ''}`;
            })
            .join('\n\n');
        },
      },
      legend: {
        show: c.legend !== false,
        type: 'scroll',
        bottom: 0,
        left: 'center',
        itemWidth: 9,
        itemHeight: 9,
        itemGap: 17,
        textStyle: { fontSize: 10, color: '#6e8794' },
      },
      grid: {
        top: 25,
        right: c.type === 'combo' ? 55 : c.labels ? 65 : 25,
        bottom: c.legend !== false ? 70 : 52,
        left: 20,
        containLabel: true,
      },
      toolbox: { show: false },
    };

  if (['donut', 'pie'].includes(c.type)) {
    base.series = [
      {
        name: c.title,
        type: 'pie',
        radius: c.type === 'donut' ? ['52%', '73%'] : '73%',
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        minAngle: 2,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 3,
          borderRadius: c.type === 'donut' ? 4 : 1,
        },
        label: {
          show: !!c.labels,
          formatter: (v) => `${v.name}\n${formatVisual(v.value, d.format)} · ${v.percent}%`,
          fontSize: 10,
          lineHeight: 16,
          color: '#5a788b',
        },
        labelLine: { show: !!c.labels, length: 13, length2: 9 },
        emphasis: { scaleSize: 5 },
        data: d.groups.map((g, i) => ({
          name: g.name,
          value: g.total,
          itemStyle: { color: colors[i] },
        })),
      },
    ];
    if (c.type === 'donut') {
      const total = d.groups.reduce((a, g) => a + (g.total || 0), 0);
      base.graphic = [
        {
          type: 'text',
          left: 'center',
          top: '36%',
          style: {
            text: formatVisual(total, d.format),
            fill: '#003856',
            font: '600 25px Segoe UI',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          left: 'center',
          top: '47%',
          style: {
            text: c.agg === 'count' ? 'registros na seleção' : aggregationNames[c.agg] || 'Total',
            fill: '#8a9fa9',
            font: '10px Segoe UI',
            textAlign: 'center',
          },
        },
      ];
    }
  } else if (c.type === 'treemap') {
    base.legend.show = false;
    base.series = [
      {
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        top: 10,
        left: 0,
        right: 0,
        bottom: 5,
        visibleMin: 10,
        label: { show: true, formatter: (v) => v.name + '\n' + fmt(v.value), fontSize: 11 },
        itemStyle: { borderColor: '#fff', borderWidth: 3, gapWidth: 3 },
        data: d.groups.map((g, i) => ({
          name: g.name,
          value: g.total,
          itemStyle: { color: colors[i] },
        })),
      },
    ];
  } else if (c.type === 'funnel') {
    base.series = [
      {
        name: c.title,
        type: 'funnel',
        left: '10%',
        top: 18,
        bottom: c.legend !== false ? 55 : 20,
        width: '80%',
        minSize: '12%',
        maxSize: '100%',
        sort: c.order === 'asc' ? 'ascending' : c.order === 'desc' ? 'descending' : 'none',
        gap: 3,
        label: {
          show: true,
          position: c.labels ? 'inside' : 'right',
          formatter: (v) => `${v.name} (${fmt(v.value)})`,
          fontSize: 10,
          color: c.labels ? '#fff' : '#446b80',
        },
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        data: d.groups.map((g, i) => ({
          name: g.name,
          value: g.total,
          itemStyle: { color: colors[i] },
        })),
      },
    ];
  } else if (c.type === 'gauge') {
    base.legend.show = false;
    const val = Number(d.groups[0]?.total || 0);
    const maxVal = d.format === 'percent' ? 100 : Math.max(100, Math.ceil(val * 1.25));
    base.series = [
      {
        type: 'gauge',
        center: ['50%', '58%'],
        radius: '88%',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: maxVal,
        progress: { show: true, width: 16, itemStyle: { color: '#003856' } },
        axisLine: { lineStyle: { width: 16, color: [[1, '#e4edf2']] } },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '-4%'],
          fontSize: 26,
          fontWeight: 700,
          color: '#003856',
          formatter: (v) => formatVisual(v, d.format),
        },
        title: {
          offsetCenter: [0, '24%'],
          fontSize: 11,
          color: '#7a93a1',
        },
        data: [{ value: val, name: aggregationNames[c.agg] || c.title }],
      },
    ];
  } else if (c.type === 'radar') {
    base.legend.show = false;
    const maxVal = Math.max(...d.groups.map((g) => Number(g.total) || 0), 1) * 1.15;
    base.radar = {
      center: ['50%', '52%'],
      radius: '64%',
      indicator: d.groups.map((g) => ({ name: visualLabel(p, c, g.name), max: maxVal })),
      axisName: { color: '#5a788b', fontSize: 10 },
      splitArea: { areaStyle: { color: ['#fff', '#f6f9fb'] } },
      splitLine: { lineStyle: { color: '#dce6ec' } },
    };
    base.series = [
      {
        type: 'radar',
        symbolSize: 6,
        lineStyle: { width: 2.5, color: '#003856' },
        itemStyle: { color: '#003856' },
        areaStyle: { color: 'rgba(0, 56, 86, 0.16)' },
        label: { show: !!c.labels, fontSize: 10, formatter: (v) => fmt(v.value) },
        data: [{ value: d.groups.map((g) => g.total || 0), name: c.title }],
      },
    ];
  } else if (c.type === 'heatmap') {
    base.legend.show = false;
    const points = [];
    let maxCell = 0;
    d.groups.forEach((_, xi) => {
      d.names.forEach((__, yi) => {
        const val = Number(d.matrix[yi]?.[xi] || 0);
        if (val > maxCell) maxCell = val;
        points.push([xi, yi, val]);
      });
    });
    base.grid = { top: 20, right: 25, bottom: 58, left: 20, containLabel: true };
    base.xAxis = {
      type: 'category',
      data: labels,
      splitArea: { show: true },
      axisLabel: {
        color: '#6e8794',
        fontSize: 10,
        interval: 0,
        rotate: labels.length > 6 ? 25 : 0,
      },
    };
    base.yAxis = {
      type: 'category',
      data: d.names,
      splitArea: { show: true },
      axisLabel: { color: '#6e8794', fontSize: 10, width: 140, overflow: 'truncate' },
    };
    base.visualMap = {
      min: 0,
      max: maxCell || 1,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 4,
      itemWidth: 12,
      itemHeight: 110,
      textStyle: { fontSize: 9, color: '#6e8794' },
      inRange: { color: ['#edf4f8', '#75adc2', '#003856'] },
    };
    base.series = [
      {
        type: 'heatmap',
        data: points,
        label: {
          show: !!c.labels,
          fontSize: 10,
          formatter: (v) => (v.value[2] ? fmt(v.value[2]) : ''),
        },
        itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 3 },
      },
    ];
  } else if (c.type === 'waterfall') {
    base.legend.show = false;
    const wfLabels = [...labels, 'Total'];
    const helper = [];
    const positive = [];
    const negative = [];
    let running = 0;
    d.groups.forEach((g) => {
      const val = Number(g.total || 0);
      if (val >= 0) {
        helper.push(running);
        positive.push(val);
        negative.push('-');
      } else {
        helper.push(running + val);
        positive.push('-');
        negative.push(Math.abs(val));
      }
      running += val;
    });
    helper.push(0);
    positive.push(running >= 0 ? running : '-');
    negative.push(running < 0 ? Math.abs(running) : '-');

    base.xAxis = {
      type: 'category',
      data: wfLabels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e1e9ee' } },
      axisLabel: {
        color: '#6e8794',
        fontSize: 10,
        interval: 0,
        rotate: wfLabels.length > 6 ? 25 : 0,
      },
    };
    base.yAxis = {
      type: 'value',
      axisLabel: {
        fontSize: 9,
        color: '#8da0ab',
        formatter: (v) =>
          d.format === 'currency' ? formatAxisMoney(v) : formatVisual(v, d.format),
      },
      splitLine: { lineStyle: { color: '#edf2f5', type: 'dashed' } },
    };
    base.series = [
      {
        name: 'Base',
        type: 'bar',
        stack: 'wf',
        silent: true,
        itemStyle: { borderColor: 'transparent', color: 'transparent' },
        emphasis: { itemStyle: { borderColor: 'transparent', color: 'transparent' } },
        data: helper,
      },
      {
        name: 'Acréscimo',
        type: 'bar',
        stack: 'wf',
        barMaxWidth: 46,
        itemStyle: {
          color: (params) => (params.dataIndex === wfLabels.length - 1 ? '#003856' : '#268c48'),
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: !!c.labels,
          position: 'top',
          fontSize: 10,
          color: '#268c48',
          formatter: (v) => fmt(v.value),
        },
        data: positive,
      },
      {
        name: 'Dedução',
        type: 'bar',
        stack: 'wf',
        barMaxWidth: 46,
        itemStyle: { color: '#c93636', borderRadius: [0, 0, 4, 4] },
        label: {
          show: !!c.labels,
          position: 'bottom',
          fontSize: 10,
          color: '#c93636',
          formatter: (v) => '-' + fmt(v.value),
        },
        data: negative,
      },
    ];
  } else {
    const horizontal = ['barh', 'stacked_h', 'stacked100_h'].includes(c.type),
      isLine = ['line', 'area'].includes(c.type),
      axisCat = {
        type: 'category',
        data: labels,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e1e9ee' } },
        axisLabel: {
          color: '#6e8794',
          fontSize: 10,
          interval: 0,
          width: horizontal ? 160 : 92,
          overflow: 'truncate',
          rotate: !horizontal && labels.length > 6 ? 25 : 0,
        },
        inverse: horizontal,
      },
      axisNum = {
        type: 'value',
        minInterval: ['count', 'distinct'].includes(c.agg) && !is100 ? 1 : undefined,
        min: is100 ? 0 : undefined,
        max: is100 ? 100 : undefined,
        axisLabel: {
          fontSize: 9,
          color: '#8da0ab',
          formatter: (v) =>
            is100
              ? v + '%'
              : d.format === 'currency'
                ? formatAxisMoney(v)
                : formatVisual(v, d.format),
        },
        splitLine: { lineStyle: { color: '#edf2f5', type: 'dashed' } },
        axisLine: { show: false },
      };
    base.xAxis = horizontal ? axisNum : axisCat;
    base.yAxis = horizontal ? axisCat : [axisNum];

    if (c.type === 'combo') {
      const fmt2 =
        p.fields.find((f) => f.id === c.value2)?.type === 'currency' ? 'currency' : 'number';
      base.yAxis.push({
        type: 'value',
        splitLine: { show: false },
        axisLabel: {
          fontSize: 9,
          color: '#f37021',
          formatter: (v) => (fmt2 === 'currency' ? formatAxisMoney(v) : formatVisual(v, fmt2)),
        },
      });
      base.series = [
        {
          name: biColumnName(p, c.value) || 'Medida 1',
          type: 'bar',
          yAxisIndex: 0,
          barMaxWidth: 44,
          itemStyle: { color: '#003856', borderRadius: [4, 4, 0, 0] },
          label: {
            show: !!c.labels,
            position: 'top',
            fontSize: 10,
            formatter: (v) => fmt(v.value),
          },
          data: d.matrix[0],
        },
        {
          name: biColumnName(p, c.value2) || 'Medida 2',
          type: 'line',
          yAxisIndex: 1,
          symbolSize: 7,
          lineStyle: { width: 2.5, color: '#f37021' },
          itemStyle: { color: '#f37021' },
          data: d.matrix2[0],
        },
      ];
      base.legend.show = c.legend !== false;
    } else {
      base.series = d.names.map((name, index) => {
        const values = d.matrix[index].map((v, i) => {
          let display = v;
          if (is100 && v !== null) {
            const sum = d.matrix.reduce((a, row) => a + (row[i] || 0), 0);
            display = sum ? (v / sum) * 100 : 0;
          }
          return {
            value: display,
            itemStyle: {
              color: d.stacked ? colors[index] : semanticVisualColor(cats[i], i, c.palette),
              borderRadius: d.stacked ? 0 : horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
            },
          };
        });
        return {
          name: d.stacked ? name : c.title,
          type: isLine ? 'line' : 'bar',
          stack: d.stacked ? 'project-total' : undefined,
          barMaxWidth: horizontal ? 25 : 52,
          barMinHeight: 0,
          connectNulls: false,
          smooth: false,
          symbolSize: 6,
          lineStyle: { width: 2.5, color: colors[index % colors.length] },
          areaStyle: c.type === 'area' ? { opacity: 0.14 } : undefined,
          label: {
            show: !!c.labels,
            position: d.stacked ? 'inside' : horizontal ? 'right' : 'top',
            fontSize: 10,
            color: d.stacked ? '#fff' : '#446b80',
            formatter: (v) => {
              if (v.value == null) return '';
              if (is100) return Number(v.value) >= 7 ? Number(v.value).toFixed(0) + '%' : '';
              return fmt(v.value);
            },
          },
          emphasis: { focus: d.stacked ? 'series' : 'self' },
          data: values,
        };
      });
      if (!d.stacked) base.legend.show = false;
    }
  }
  return base;
}
function formatAxisMoney(n) {
  const v = Number(n);
  return Math.abs(v) >= 1e9
    ? (v / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' bi'
    : Math.abs(v) >= 1e6
      ? (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi'
      : Math.abs(v) >= 1000
        ? (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' mil'
        : String(v);
}
function visualTable(p, c, d) {
  if (c.type === 'gauge') return '';
  const hasSecond = c.type === 'combo' && d.matrix2;
  return `<details class="visual-data"><summary>Ver dados do gráfico ${icon('down')}</summary><div class="tablewrap"><table><thead><tr><th>${esc(biColumnName(p, c.category))}</th>${d.names.map((n) => `<th>${esc(d.stacked ? n : aggregationNames[c.agg])}</th>`).join('')}${hasSecond ? `<th>${esc(biColumnName(p, c.value2))}</th>` : ''}</tr></thead><tbody>${d.groups.map((g, i) => `<tr><td><button class="visual-data-filter" data-field="${esc(c.category)}" data-value="${esc(g.name)}" onclick="selectVisualFilter(this.dataset.field,this.dataset.value)">${esc(visualLabel(p, c, g.name))}</button></td>${d.matrix.map((row, j) => `<td>${d.stacked ? `<button class="visual-data-filter" data-field="${esc(c.category)}" data-value="${esc(g.name)}" data-series="${esc(c.series)}" data-segment="${esc(d.names[j])}" onclick="selectVisualFilter(this.dataset.field,this.dataset.value,this.dataset.series,this.dataset.segment)">${formatVisual(row[i], d.format, false)}</button>` : formatVisual(row[i], d.format, false)}</td>`).join('')}${hasSecond ? `<td>${formatVisual(d.matrix2[0][i], p.fields.find((f) => f.id === c.value2)?.type === 'currency' ? 'currency' : 'number', false)}</td>` : ''}</tr>`).join('')}</tbody></table></div></details>`;
}
function visualMount(p, rs, c, preview = false) {
  const id = 'echart_' + uid().replace(/[^\w]/g, ''),
    d = visualData(p, rs, c);
  if (d.error)
    return `<div class="visual-empty">${icon('chart')}<h3>${esc(c.title || 'Gráfico')}</h3><p>${esc(d.error)}</p></div>`;
  chartMounts.set(id, { p, rs, c, d, preview });
  return `<div id="${id}" class="echart-canvas" role="img" aria-label="${esc(c.title)} · ${esc(visualTypes[c.type])}" style="height:${Number(c.height) || 315}px"></div>${preview ? '' : visualTable(p, c, d)}<div class="visual-caption">${esc(aggregationNames[c.agg])}${c.agg !== 'count' ? ' de ' + esc(biColumnName(p, c.value)) : ''} · ${d.groups.length} de ${d.full} categorias${d.groups.length < d.full ? ' · seleção limitada às categorias exibidas' : ''}${d.dateOmitted ? ' · ' + d.dateOmitted + ' registros sem data ficaram fora do gráfico' : ''}</div>`;
}
function initVisualMounts() {
  if (typeof echarts === 'undefined') return;
  for (const [id, info] of chartMounts) {
    const el = document.getElementById(id);
    if (!el || echarts.getInstanceByDom(el)) continue;
    const instance = echarts.init(el, null, { renderer: 'svg' });
    instance.setOption(visualOptions(info.p, info.rs, info.c, info.d));
    el.setAttribute('role', 'img');
    el.setAttribute(
      'aria-label',
      info.c.title +
        ' · ' +
        visualTypes[info.c.type] +
        '. ' +
        info.d.groups
          .map(
            (g, i) =>
              visualLabel(info.p, info.c, g.name) +
              ': ' +
              formatVisual(g.total, info.d.format, false)
          )
          .join('; ')
    );
    el.querySelector('svg')?.setAttribute('aria-hidden', 'true');
    activeCharts.add(instance);
    if (chartResizeObserver) chartResizeObserver.observe(el);
    if (!info.preview)
      instance.on('click', (params) => {
        const { c, d } = info;
        if (c.type === 'gauge') return;
        if (c.type === 'heatmap') {
          const [xi, yi] = params.value || [];
          const cat = d.groups[xi]?.name;
          const seg = d.names[yi];
          if (cat != null) applyVisualSelection(c.category, cat);
          if (seg != null && c.series) applyVisualSelection(c.series, seg);
          return render();
        }
        if (c.type === 'waterfall' && params.dataIndex >= d.groups.length) return;
        const index = typeof params.dataIndex === 'number' ? params.dataIndex : 0,
          category = ['donut', 'pie', 'treemap', 'funnel'].includes(c.type)
            ? params.name
            : d.groups[index]?.name;
        if (category == null) return;
        applyVisualSelection(c.category, category);
        if (d.stacked && c.series) applyVisualSelection(c.series, params.seriesName);
        render();
      });
  }
}
function disposeVisuals() {
  for (const instance of activeCharts) {
    if (!instance.isDisposed()) instance.dispose();
  }
  activeCharts.clear();
  chartMounts.clear();
  chartResizeObserver?.disconnect();
}
if (typeof ResizeObserver !== 'undefined')
  chartResizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const instance =
        typeof echarts !== 'undefined' ? echarts.getInstanceByDom(entry.target) : null;
      instance?.resize();
    }
  });
const renderBeforeVisuals = render;
render = function () {
  disposeVisuals();
  renderBeforeVisuals();
  requestAnimationFrame(initVisualMounts);
};
const originalBiRowsVisuals = biRows;
biRows = function (p) {
  return originalBiRowsVisuals(p).filter((r) =>
    Object.entries(biCrossFilters).every(([field, value]) => visualCategory(r[field]) === value)
  );
};
const biFiltersBeforeVisuals = biFilters;
biFilters = function (p, rs) {
  const chips = Object.entries(biCrossFilters);
  return (
    biFiltersBeforeVisuals(p, rs) +
    renderBiSavedViewsBar(p) +
    (chips.length
      ? `<div class="visual-filter-chips"><span>Seleção pelos gráficos</span>${chips.map(([field, value]) => `<button data-field="${esc(field)}" onclick="delete biCrossFilters[this.dataset.field];render()">${esc(biColumnName(p, field))}: <b>${esc(value)}</b>${icon('close')}</button>`).join('')}<button class="clear-all" onclick="biCrossFilters={};render()">Limpar seleção</button></div>`
      : '')
  );
};
const openBIBeforeVisuals = openBI;
openBI = function (id) {
  biCrossFilters = {};
  openBIBeforeVisuals(id);
};
const goBeforeVisuals = go;
go = function (t, id = '') {
  biCrossFilters = {};
  goBeforeVisuals(t, id);
};
const oldRouteVisual = routeSnapshot;
routeSnapshot = function () {
  return { ...oldRouteVisual(), biCrossFilters: { ...biCrossFilters } };
};
const oldRestoreVisual = restoreRoute;
restoreRoute = function (r) {
  biCrossFilters = { ...(r.biCrossFilters || {}) };
  oldRestoreVisual(r);
};
function renderVisualCard(p, rs, c) {
  return `<section class="panel visual-card ${c.wide ? 'visual-wide' : ''}" ${typographyAttrs(c)}><div class="panelhead"><div><h2>${esc(c.title)}</h2>${c.subtitle ? `<small>${esc(c.subtitle)}</small>` : ''}</div>${canEdit(p) ? `<button class="iconbtn visual-edit" aria-label="Editar gráfico ${esc(c.title)}" title="Editar gráfico" onclick="editVisual('${p.id}','${c.id}')">${icon('edit')}</button>` : ''}</div><div class="visual-card-body">${visualMount(p, rs, c)}</div></section>`;
}
function metricResult(p, rs, k) {
  if (k.field === '@records') return rs.length;
  if (k.field === '@attention') return attentionRows(rs, p).length;
  if (k.field === '@done') return rs.filter((r) => isFinished(r, p)).length;
  if (!k.field) return null;
  return aggregateVisual(rs, k.field, k.agg);
}
function metricFoot(p, k) {
  return k.field === '@records'
    ? 'Registros nesta seleção'
    : k.field === '@attention'
      ? 'Urgência calculada por prazo e situação'
      : k.field === '@done'
        ? 'Situação marcada como concluída'
        : k.field
          ? `${aggregationNames[k.agg]} · ${biColumnName(p, k.field)}`
          : 'Associe uma coluna para preencher este indicador';
}
biOverview = function (p, rs) {
  const design = getDesign(p),
    ar = attentionRows(rs, p),
    kpis = design.kpis.filter((k) => k.visible !== false),
    charts = design.charts.filter((c) => c.visible !== false);
  return `<div class="visual-dashboard layout-${design.layout || 'executive'} density-${design.density || 'comfortable'}"><div class="visual-metrics">${kpis.map((k, i) => `<article class="visual-kpi ${i < 2 ? 'spotlight' : ''}" ${typographyAttrs(k, '--kpi-color:' + esc(k.color || '#003856'))}><div class="visual-kpi-head"><span>${esc(k.title)}</span>${canEdit(p) ? `<button class="iconbtn" title="Editar indicador" aria-label="Editar indicador ${esc(k.title)}" onclick="editMetric('${p.id}','${k.id}')">${icon('edit')}</button>` : icon(k.field === '@records' ? 'folder' : k.format === 'currency' ? 'money' : 'chart')}</div><strong>${formatVisual(metricResult(p, rs, k), k.format || 'number')}</strong><small>${esc(metricFoot(p, k))}</small></article>`).join('')}</div><div class="executive-reading"><div>${icon('eye')}<p><strong>${rs.length} iniciativas nesta seleção.</strong> ${ar.length} precisam de atenção e ${rs.filter((r) => isFinished(r, p)).length} estão concluídas. Clique nos gráficos para restringir a análise e consultar os registros.</p></div>${canEdit(p) ? btn('Personalizar BI', "switchBiSection('designer')", 'edit') : ''}</div><div class="visual-board">${charts.map((c) => renderVisualCard(p, rs, c)).join('')}</div>${charts.length ? '' : empty('Seu painel está pronto para ser montado', 'Abra Personalizar BI e adicione os gráficos que ajudam na sua decisão.')}<div class="chart-grid wide">${chartPanel(
    'O que precisa de decisão',
    'Próximas providências e responsáveis',
    ar
      .slice(0, 4)
      .map(
        (r) =>
          `<button class="attention" style="width:100%;padding:16px 0;text-align:left" onclick="editRecord('${p.id}','${r.id}')"><span class="alerticon">${icon('alert')}</span><div><h3>${esc(recordTitle(r, p))}</h3><p>${esc(r.proxima || 'Defina a próxima providência na ficha da iniciativa.')}</p><span class="subtitle" style="font-size:10px">${esc(val(r, p, 'owner') || 'Responsável não informado')} · ${date(val(r, p, 'deadline'))}</span></div></button>`
      )
      .join('') ||
      empty('Nenhuma atenção sinalizada', 'Mantenha o andamento e os prazos atualizados.')
  )}${chartPanel('Próximas entregas', 'Prazos informados nos registros', biDeadlineList(p, rs, 4))}</div></div>`;
};
// Use the same chart engine for the analytical pages outside the overview.
groupsChart = function (p, rs, f, mode = 'count', semantic = 'budget') {
  if (!f)
    return empty('Campo não associado', 'Associe a coluna correspondente em Personalizar BI.');
  return visualMount(p, rs, {
    id: 'auto_' + f.id,
    title: biColumnName(p, f.id),
    type: 'barh',
    category: f.id,
    value: mode === 'count' ? '' : fieldKey(p, semantic),
    agg: mode === 'count' ? 'count' : 'sum',
    format: mode === 'count' ? 'number' : 'currency',
    order: 'desc',
    limit: 10,
    labels: true,
    legend: false,
    palette: 'institutional',
  });
};
donutChart = function (p, rs, f) {
  if (!f) return empty('Campo não associado', 'Associe a situação do projeto em Personalizar BI.');
  return visualMount(p, rs, {
    title: biColumnName(p, f.id),
    type: 'donut',
    category: f.id,
    value: '',
    agg: 'count',
    format: 'number',
    order: 'desc',
    limit: 10,
    labels: false,
    legend: true,
    palette: 'institutional',
  });
};
function openDesigner(id) {
  if (id && id !== biProject) openBI(id);
  if (!canEdit(visible().find((p) => p.id === biProject))) return;
  switchBiSection('designer');
}
function biDesigner(p, rs) {
  if (!canEdit(p))
    return empty('Personalização restrita', 'Solicite permissão de edição ao administrador.');
  const d = getDesign(p);
  return `<section class="designer-heading"><div><div class="eyebrow">CONSTRUA A LEITURA DO SEU PROJETO</div><h2>Personalizar BI</h2><p>Escolha os gráficos, ajuste os nomes e conecte cada informação à coluna certa.</p></div>${btn('Ver painel', "switchBiSection('overview')", 'eye', 'primary')}</section><section class="panel design-section"><div class="panelhead"><div><h2>1. Apresentação do painel</h2><small>Hierarquia visual, tamanho dos cartões e organização da página</small></div></div><div class="panelbody"><div class="layout-options">${[
    ['executive', 'Executivo', 'Destaque para os principais indicadores e decisões.'],
    ['compact', 'Reunião de gestão', 'Mais informações na tela, com blocos compactos.'],
    ['presentation', 'Apresentação', 'Gráficos amplos e leitura com mais espaço.'],
  ]
    .map(
      ([id, name, desc]) =>
        `<button class="layout-option ${d.layout === id ? 'selected' : ''}" onclick="setDashboardLayout('${p.id}','${id}')"><span class="layout-mini ${id}"><i></i><i></i><i></i><i></i></span><b>${name}</b><small>${desc}</small>${d.layout === id ? `<span class="layout-selected">${icon('check')}Selecionado</span>` : ''}</button>`
    )
    .join(
      ''
    )}</div></div></section><section class="panel design-section"><div class="panelhead"><div><h2>2. Indicadores principais</h2><small>O título exibido no cartão pode ser diferente do nome da coluna</small></div>${btn('Adicionar indicador', `editMetric('${p.id}')`, 'plus')}</div><div class="designer-list">${d.kpis.map((k, i) => `<div class="designer-row"><span class="widget-order">${String(i + 1).padStart(2, '0')}</span><div class="widget-info"><b>${esc(k.title)}</b><small>${esc(metricFoot(p, k))}</small></div><span class="widget-value">${formatVisual(metricResult(p, rs, k), k.format)}</span><div class="widget-actions"><button class="iconbtn" title="Mover para cima" aria-label="Subir indicador ${esc(k.title)}" ${i === 0 ? 'disabled' : ''} onclick="moveDesignItem('${p.id}','kpis','${k.id}',-1)">${icon('arrow').replace('<svg ', '<svg style="transform:rotate(-90deg)" ')}</button><button class="iconbtn" aria-label="${k.visible === false ? 'Exibir' : 'Ocultar'} indicador ${esc(k.title)}" title="Exibir / ocultar" onclick="toggleDesignItem('${p.id}','kpis','${k.id}')">${icon(k.visible === false ? 'plus' : 'eye')}</button><button class="iconbtn" aria-label="Editar indicador ${esc(k.title)}" onclick="editMetric('${p.id}','${k.id}')">${icon('edit')}</button></div></div>`).join('')}</div></section><section class="panel design-section"><div class="panelhead"><div><h2>3. Gráficos e análises</h2><small>Rosca, pizza, barras, colunas, empilhamento, linha, área e mapa de árvore</small></div>${btn('Adicionar gráfico', `editVisual('${p.id}')`, 'plus', 'primary')}</div><div class="designer-list">${d.charts.map((c, i) => `<div class="designer-row"><span class="widget-chart-icon">${icon(c.type === 'donut' || c.type === 'pie' ? 'clock' : 'chart')}</span><div class="widget-info"><b>${esc(c.title)}</b><small>${visualTypes[c.type]} · ${esc(chartDimensionText(p, c))} · ${aggregationNames[c.agg]}</small></div><span class="badge ${c.visible === false ? 'gray' : ''}">${c.visible === false ? 'Oculto' : c.wide ? 'Largura total' : 'Meia largura'}</span><div class="widget-actions"><button class="iconbtn" title="Mover para cima" aria-label="Subir gráfico ${esc(c.title)}" ${i === 0 ? 'disabled' : ''} onclick="moveDesignItem('${p.id}','charts','${c.id}',-1)">${icon('arrow').replace('<svg ', '<svg style="transform:rotate(-90deg)" ')}</button><button class="iconbtn" aria-label="Alternar visibilidade de ${esc(c.title)}" title="Exibir / ocultar" onclick="toggleDesignItem('${p.id}','charts','${c.id}')">${icon(c.visible === false ? 'plus' : 'eye')}</button><button class="btn" onclick="editVisual('${p.id}','${c.id}')">${icon('edit')}Editar</button></div></div>`).join('') || empty('Sem gráficos no painel', 'Adicione o primeiro gráfico para começar.')}</div></section><div class="builder-model-link"><span>Modelo de análise: <b>${biTemplates[p.biTemplate || 'obras']?.name || 'Personalizado'}</b></span><button class="textbtn" onclick="configureBIBeforeDesigner('${p.id}')">Trocar modelo de análise ${icon('arrow')}</button></div>${mappingPanel(p)}${columnAliasesPanel(p)}<div class="designer-footer"><div><strong>Configuração exclusiva deste projeto.</strong><small>Os nomes exibidos no BI não alteram os campos do cadastro. Todas as visualizações usam os mesmos registros e permissões.</small></div><div class="actions">${p.biDesignPrevious ? btn('Restaurar composição anterior', `undoDesign('${p.id}')`, 'history') : ''}${btn('Restaurar composição inicial', `confirmResetDesign('${p.id}')`, 'history')}</div></div>`;
}
function setDashboardLayout(id, layout) {
  const p = visible().find((p) => p.id === id),
    d = getDesign(p);
  d.layout = layout;
  commitDesign(p, d, 'Alterou apresentação do BI');
  render();
  notify('Apresentação atualizada. Abra Ver painel para conferir.');
}
function toggleDesignItem(id, group, key) {
  const p = visible().find((p) => p.id === id),
    d = getDesign(p),
    item = d[group].find((x) => x.id === key);
  if (!item) return;
  item.visible = item.visible === false;
  commitDesign(p, d);
  render();
}
function moveDesignItem(id, group, key, delta) {
  const p = visible().find((p) => p.id === id),
    d = getDesign(p),
    i = d[group].findIndex((x) => x.id === key),
    j = i + delta;
  if (j < 0 || j >= d[group].length) return;
  [d[group][i], d[group][j]] = [d[group][j], d[group][i]];
  commitDesign(p, d, 'Reordenou elementos do BI');
  render();
}
function undoDesign(id) {
  const p = visible().find((p) => p.id === id);
  if (!canEdit(p) || !p.biDesignPrevious) return;
  const d = p.biDesign;
  p.biDesign = structuredClone(p.biDesignPrevious);
  p.biDesignPrevious = d;
  persist('Desfez edição visual do BI', p, '', 'Composição anterior');
  render();
  notify('Composição anterior restaurada.');
}
function confirmResetDesign(id) {
  modal(
    'Restaurar a composição inicial?',
    `<p>Os gráficos e indicadores voltarão à composição inicial deste projeto. As associações de colunas e os registros serão preservados. Você poderá desfazer esta alteração.</p>`,
    btn('Voltar', 'closeModal()', 'arrow') +
      btn('Restaurar', `resetDesign('${id}')`, 'history', 'primary')
  );
}
function resetDesign(id) {
  const p = visible().find((p) => p.id === id);
  if (commitDesign(p, baseDesign(p), 'Restaurou composição do BI')) {
    closeModal();
    render();
    notify('Composição inicial restaurada.');
  }
}
function mappingPanel(p) {
  return `<section class="panel design-section"><div class="panelhead"><div><h2>4. Campos do painel e colunas associadas</h2><small>Altere o nome que aparece no BI e confirme de onde vem cada indicador</small></div></div><form id="biMappingsForm" onsubmit="event.preventDefault();saveBIMappings('${p.id}')"><div class="tablewrap mapping-table"><table><thead><tr><th>Campo do painel · nome exibido</th><th>Coluna do projeto</th><th>Preenchimento</th></tr></thead><tbody>${Object.entries(
    semanticNames
  )
    .map(([key, label]) => {
      const f = biField(p, key);
      return `<tr><td><input name="label_${key}" aria-label="Nome exibido: ${label}" value="${esc(p.biLabels?.[key] || label)}"><small class="mapping-key">${label}</small></td><td><select name="map_${key}" aria-label="Coluna associada: ${label}" onchange="updateMappingCoverage(this,'${p.id}')"><option value="">Não associado</option>${p.fields
        .filter((f) => semanticTypes[key].includes(f.type))
        .map(
          (f) =>
            `<option value="${f.id}" ${f.id === fieldKey(p, key) ? 'selected' : ''}>${esc(f.name)}</option>`
        )
        .join('')}</select></td><td class="mapping-coverage">${coverageText(p, f?.id)}</td></tr>`;
    })
    .join(
      ''
    )}</tbody></table></div><div class="mapping-save"><span>O preenchimento considera todos os registros da pasta, independentemente dos filtros do BI.</span><button class="btn primary" type="submit">${icon('check')}Salvar nomes e associações</button></div></form></section>`;
}
function coverageText(p, id) {
  if (!id) return 'Não associado';
  const n = p.records.filter((r) => r[id] !== '' && r[id] != null).length;
  return `${n} de ${p.records.length} registros`;
}
function updateMappingCoverage(select, id) {
  const p = visible().find((p) => p.id === id);
  select.closest('tr').querySelector('.mapping-coverage').textContent = coverageText(
    p,
    select.value
  );
}
function saveBIMappings(id) {
  const p = visible().find((p) => p.id === id);
  if (!canEdit(p)) return;
  const data = new FormData($('#biMappingsForm')),
    old = Object.fromEntries(Object.keys(semanticNames).map((key) => [key, fieldKey(p, key)])),
    oldLabels = { ...p.biLabels };
  p.biMapping = Object.fromEntries(
    Object.keys(semanticNames).map((key) => [key, data.get('map_' + key) || ''])
  );
  p.biLabels = Object.fromEntries(
    Object.keys(semanticNames).map((key) => [
      key,
      String(data.get('label_' + key) || semanticNames[key]).trim(),
    ])
  );
  if (p.biDesign) {
    const bindings = { k_budget: 'budget', k_spent: 'spent', k_progress: 'progress' };
    for (const item of p.biDesign.kpis) {
      const key = bindings[item.id];
      if (key) {
        item.field = p.biMapping[key];
        if (
          item.title === (oldLabels[key] || semanticNames[key]) ||
          (item.id === 'k_progress' && item.title === 'Avanço físico médio')
        )
          item.title = p.biLabels[key];
      }
    }
    const bindCharts = {
      c_status: { category: 'status' },
      c_stage: { category: 'stage' },
      c_cross: { category: 'agency', series: 'stage' },
      c_budget: { category: 'agency', value: 'budget' },
    };
    for (const chart of p.biDesign.charts) {
      for (const [prop, key] of Object.entries(bindCharts[chart.id] || {})) {
        if (chart[prop] === old[key]) chart[prop] = p.biMapping[key];
      }
    }
  }
  persist('Alterou nomes e associações do BI', p, '', 'Nomes de apresentação e colunas');
  render();
  notify('Associações e nomes atualizados. Os campos originais foram preservados.');
}
function columnAliasesPanel(p) {
  return `<section class="panel design-section"><div class="panelhead"><div><h2>5. Nomes das colunas no detalhamento</h2><small>Use nomes claros para apresentar os dados sem alterar o cadastro de origem</small></div></div><form id="biAliasesForm" onsubmit="event.preventDefault();saveColumnAliases('${p.id}')"><div class="alias-grid">${p.fields.map((f) => `<label><span>${esc(f.name)}</span><input name="${f.id}" aria-label="Apelido no BI: ${esc(f.name)}" value="${esc(p.biColumnLabels?.[f.id] || f.name)}"></label>`).join('')}</div><div class="mapping-save"><span>A coluna original mantém seu nome na aba Projetos.</span><button class="btn primary" type="submit">Salvar nomes de apresentação</button></div></form></section>`;
}
function saveColumnAliases(id) {
  const p = visible().find((p) => p.id === id);
  if (!canEdit(p)) return;
  p.biColumnLabels = Object.fromEntries(
    [...new FormData($('#biAliasesForm'))].map(([k, v]) => [
      k,
      String(v).trim() || p.fields.find((f) => f.id === k)?.name,
    ])
  );
  persist('Renomeou colunas no BI', p, '', 'Apelidos de apresentação');
  render();
  notify('Nomes do detalhamento atualizados somente no BI.');
}
const detailBeforeAliases = biDetails;
biDetails = function (p, rs) {
  return detailBeforeAliases(
    { ...p, fields: p.fields.map((f) => ({ ...f, name: biColumnName(p, f.id) })) },
    rs
  );
};
function defaultVisual(p) {
  return {
    id: 'c_' + uid(),
    title: 'Novo gráfico',
    subtitle: '',
    type: 'barh',
    category:
      fieldKey(p, 'status') ||
      p.fields.find((f) => f.type === 'select')?.id ||
      p.fields[0]?.id ||
      '',
    series: fieldKey(p, 'stage'),
    value: fieldKey(p, 'budget'),
    value2: fieldKey(p, 'spent') || '',
    agg: 'count',
    agg2: 'sum',
    format: 'auto',
    order: 'desc',
    limit: 10,
    labels: true,
    legend: true,
    wide: false,
    visible: true,
    palette: 'institutional',
    height: 315,
  };
}
function fieldOptions(p, selected, types) {
  return p.fields
    .filter((f) => !types || types.includes(f.type))
    .map(
      (f) =>
        `<option value="${f.id}" ${selected === f.id ? 'selected' : ''}>${esc(biColumnName(p, f.id))}${p.biColumnLabels?.[f.id] && p.biColumnLabels[f.id] !== f.name ? ' · origem: ' + esc(f.name) : ''}</option>`
    )
    .join('');
}
function editVisual(id, key = '') {
  const p = visible().find((p) => p.id === id);
  if (!p || !canEdit(p)) return;
  const d = getDesign(p),
    existing = d.charts.find((c) => c.id === key);
  visualDraft = {
    pId: id,
    isNew: !existing,
    config: existing ? structuredClone(existing) : defaultVisual(p),
  };
  const c = visualDraft.config;
  modal(
    existing ? 'Editar gráfico' : 'Adicionar gráfico',
    `<div class="chart-editor-layout"><form id="chartEditorForm" oninput="updateVisualDraft()" onchange="updateVisualDraft()" onsubmit="event.preventDefault();saveVisual()"><div class="field"><label>Nome do gráfico *</label><input name="title" aria-label="Nome do gráfico" required value="${esc(c.title)}"></div>${typographyFields(c)}<div class="field"><label>Texto de apoio</label><input name="subtitle" aria-label="Texto de apoio do gráfico" value="${esc(c.subtitle || '')}" placeholder="Explique em uma frase o que deve ser observado"></div><div class="field"><label>Tipo de gráfico</label><select name="type" aria-label="Tipo de gráfico">${Object.entries(
      visualTypes
    )
      .map(([k, n]) => `<option value="${k}" ${c.type === k ? 'selected' : ''}>${n}</option>`)
      .join(
        ''
      )}</select></div><div class="field" id="categoryField"><label>Categoria · eixo ou fatias</label><select name="category" aria-label="Coluna da categoria"><option value="">Selecione a coluna...</option>${fieldOptions(
      p,
      c.category,
      p.fields.map((f) => f.type).filter((t) => !['long', 'link'].includes(t))
    )}</select></div><div class="field" id="seriesField"><label>Segmentos do empilhamento</label><select name="series" aria-label="Coluna dos segmentos"><option value="">Selecione uma segunda coluna...</option>${fieldOptions(p, c.series, ['select', 'text', 'responsible', 'boolean'])}</select><small>Ex.: órgão no eixo e macroetapa nos segmentos.</small></div><div class="twocol"><div class="field"><label>Como calcular</label><select name="agg" aria-label="Cálculo do gráfico">${Object.entries(
      aggregationNames
    )
      .map(([k, n]) => `<option value="${k}" ${c.agg === k ? 'selected' : ''}>${n}</option>`)
      .join(
        ''
      )}</select></div><div class="field"><label>Coluna da medida</label><select name="value" aria-label="Coluna da medida do gráfico"><option value="">Selecione...</option>${fieldOptions(p, c.value)}</select></div></div><div class="twocol" id="comboFields" style="display:none"><div class="field"><label>2º Cálculo (Linha)</label><select name="agg2" aria-label="Cálculo da segunda medida">${Object.entries(
      aggregationNames
    )
      .map(
        ([k, n]) =>
          `<option value="${k}" ${(c.agg2 || 'sum') === k ? 'selected' : ''}>${n}</option>`
      )
      .join(
        ''
      )}</select></div><div class="field"><label>2ª Medida (Linha)</label><select name="value2" aria-label="Coluna da segunda medida"><option value="">Selecione...</option>${fieldOptions(p, c.value2)}</select></div></div><div class="twocol"><div class="field"><label>Apresentar como</label><select name="format" aria-label="Formato dos valores">${[
      ['auto', 'Automático'],
      ['number', 'Número'],
      ['currency', 'R$'],
      ['percent', 'Percentual (0 a 100)'],
    ]
      .map(([k, n]) => `<option value="${k}" ${c.format === k ? 'selected' : ''}>${n}</option>`)
      .join(
        ''
      )}</select></div><div class="field"><label>Ordenar categorias</label><select name="order" aria-label="Ordenação do gráfico">${[
      ['desc', 'Maior valor primeiro'],
      ['asc', 'Menor valor primeiro'],
      ['name', 'Nome / data'],
    ]
      .map(([k, n]) => `<option value="${k}" ${c.order === k ? 'selected' : ''}>${n}</option>`)
      .join(
        ''
      )}</select></div></div><div class="twocol"><div class="field"><label>Quantidade de categorias</label><select name="limit" aria-label="Limite de categorias">${[5, 10, 15, 20, 30].map((n) => `<option ${Number(c.limit) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div class="field"><label>Paleta</label><select name="palette" aria-label="Paleta do gráfico">${[
      ['institutional', 'Institucional e situações'],
      ['navy', 'Tons de azul'],
      ['finance', 'Financeiro'],
    ]
      .map(([k, n]) => `<option value="${k}" ${c.palette === k ? 'selected' : ''}>${n}</option>`)
      .join(
        ''
      )}</select></div></div><div class="visual-checkboxes"><label><input name="labels" type="checkbox" ${c.labels ? 'checked' : ''}>Exibir valores no gráfico</label><label><input name="legend" type="checkbox" ${c.legend !== false ? 'checked' : ''}>Exibir legenda</label><label><input name="wide" type="checkbox" ${c.wide ? 'checked' : ''}>Usar largura total do painel</label></div></form><aside class="chart-editor-preview"><div class="eyebrow">PRÉVIA COM OS DADOS DO PROJETO</div><h3 id="chartPreviewTitle">${esc(c.title)}</h3><p id="chartPreviewSubtitle">${esc(c.subtitle || '')}</p><div id="chartEditorPreview"></div><div id="chartConfigError" class="chart-config-error" role="status"></div><div class="chart-preview-help">${icon('eye')}<span>A prévia acompanha os filtros atuais. As alterações serão aplicadas ao salvar o gráfico.</span></div><div class="chart-type-help"><b>Escolha pelo que quer entender</b><p>Rosca e pizza mostram composição. Barras comparam categorias. Empilhamento cruza duas colunas. Linha e área organizam registros por data. Mapa de árvore mostra proporções. Funil, medidor, radar, calor, cascata e combinado ampliam a análise.</p></div></aside></div>`,
    (existing ? btn('Remover gráfico', 'removeVisual()', 'trash') : '') +
      btn('Voltar', 'closeModal()', 'arrow') +
      `<button class="btn primary" form="chartEditorForm" type="submit">${icon('check')}Salvar gráfico</button>`
  );
  $('.dialog').classList.add('visual-editor-dialog');
  updateVisualDraft();
}
function readVisualForm() {
  const form = $('#chartEditorForm');
  if (!form || !visualDraft) return null;
  const d = new FormData(form);
  return {
    ...visualDraft.config,
    ...readTypography(d),
    title: String(d.get('title') || '').trim(),
    subtitle: String(d.get('subtitle') || '').trim(),
    type: d.get('type'),
    category: d.get('category'),
    series: d.get('series'),
    agg: d.get('agg'),
    value: form.elements.value.value,
    agg2: d.get('agg2') || 'sum',
    value2: form.elements.value2 ? form.elements.value2.value : '',
    format: d.get('format'),
    order: d.get('order'),
    limit: Number(d.get('limit')),
    palette: d.get('palette'),
    labels: d.has('labels'),
    legend: d.has('legend'),
    wide: d.has('wide'),
  };
}
function validateVisualConfig(p, c) {
  if (!c.title) return 'Informe o nome do gráfico.';
  const isGauge = c.type === 'gauge';
  const f = p.fields.find((f) => f.id === c.category);
  if (!isGauge && !f) return 'Associe a categoria a uma coluna do projeto.';
  if (c.agg !== 'count' && !p.fields.some((f) => f.id === c.value))
    return 'Selecione a coluna que fornecerá a medida.';
  if (
    !['count', 'distinct'].includes(c.agg) &&
    !p.fields.some((f) => f.id === c.value && ['number', 'currency'].includes(f.type))
  )
    return 'Soma, média, mínimo e máximo precisam de uma coluna numérica.';
  if (c.type === 'combo') {
    if ((c.agg2 || 'sum') !== 'count' && !p.fields.some((f) => f.id === c.value2))
      return 'Selecione a coluna da 2ª medida (linha).';
    if (
      !['count', 'distinct'].includes(c.agg2 || 'sum') &&
      !p.fields.some((f) => f.id === c.value2 && ['number', 'currency'].includes(f.type))
    )
      return 'A 2ª medida precisa ser uma coluna numérica.';
  }
  if (['line', 'area'].includes(c.type) && f.type !== 'date')
    return 'Linha e área precisam de uma coluna de data como categoria.';
  if (['stacked', 'stacked_h', 'stacked100', 'stacked100_h', 'heatmap'].includes(c.type)) {
    if (!c.series) return 'Selecione a coluna dos segmentos / cruzamento.';
    if (!['count', 'sum'].includes(c.agg))
      return 'Use soma ou contagem para empilhamento ou mapa de calor.';
  }
  return '';
}
function updateVisualDraft() {
  if (!visualDraft) return;
  const p = visible().find((p) => p.id === visualDraft.pId),
    c = readVisualForm();
  if (!p || !c) return;
  visualDraft.config = c;
  const form = $('#chartEditorForm'),
    stacked = ['stacked', 'stacked_h', 'stacked100', 'stacked100_h', 'heatmap'].includes(c.type),
    isCombo = c.type === 'combo',
    isGauge = c.type === 'gauge';
  if ($('#categoryField')) $('#categoryField').style.display = isGauge ? 'none' : 'block';
  $('#seriesField').style.display = stacked ? 'block' : 'none';
  if ($('#comboFields')) $('#comboFields').style.display = isCombo ? 'grid' : 'none';
  form.elements.value.disabled = c.agg === 'count';
  if (form.elements.value2) form.elements.value2.disabled = (c.agg2 || 'sum') === 'count';
  for (const option of form.elements.value.options) {
    const f = p.fields.find((f) => f.id === option.value);
    option.disabled =
      !!f && !['count', 'distinct'].includes(c.agg) && !['number', 'currency'].includes(f.type);
  }
  if (form.elements.value2) {
    for (const option of form.elements.value2.options) {
      const f = p.fields.find((f) => f.id === option.value);
      option.disabled =
        !!f &&
        !['count', 'distinct'].includes(c.agg2 || 'sum') &&
        !['number', 'currency'].includes(f.type);
    }
  }
  $('#chartPreviewTitle').textContent = c.title || 'Seu gráfico';
  $('#chartPreviewSubtitle').textContent = c.subtitle;
  const old = $('#chartEditorPreview .echart-canvas');
  if (old && typeof echarts !== 'undefined') {
    const instance = echarts.getInstanceByDom(old);
    if (instance) {
      activeCharts.delete(instance);
      instance.dispose();
    }
    chartMounts.delete(old.id);
  }
  const err = validateVisualConfig(p, c);
  $('#chartConfigError').textContent = err;
  $('#chartEditorPreview').innerHTML = err
    ? `<div class="visual-empty">${icon('chart')}<p>${esc(err)}</p></div>`
    : visualMount(p, biRows(p), c, true);
  requestAnimationFrame(initVisualMounts);
}
function saveVisual() {
  if (!visualDraft) return;
  const p = visible().find((p) => p.id === visualDraft.pId);
  if (!p || !canEdit(p)) return;
  const c = readVisualForm(),
    err = validateVisualConfig(p, c);
  if (err) return notify(err);
  const d = getDesign(p),
    i = d.charts.findIndex((x) => x.id === c.id);
  if (i < 0) d.charts.push(c);
  else d.charts[i] = c;
  if (commitDesign(p, d, 'Configurou gráfico do BI')) {
    visualDraft = null;
    closeModal();
    render();
    notify('Gráfico salvo com o nome e as colunas selecionadas.');
  }
}
function removeVisual() {
  if (!visualDraft) return;
  const p = visible().find((p) => p.id === visualDraft.pId);
  if (!p || !canEdit(p)) return;
  const d = getDesign(p);
  d.charts = d.charts.filter((c) => c.id !== visualDraft.config.id);
  if (commitDesign(p, d, 'Removeu gráfico do BI')) {
    visualDraft = null;
    closeModal();
    render();
    notify('Gráfico removido. Você pode desfazer em Personalizar BI.');
  }
}
function editMetric(id, key = '') {
  const p = visible().find((p) => p.id === id);
  if (!p || !canEdit(p)) return;
  const k = getDesign(p).kpis.find((k) => k.id === key) || {
    id: 'k_' + uid(),
    title: 'Novo indicador',
    field: '@records',
    agg: 'count',
    format: 'number',
    color: '#003856',
    visible: true,
  };
  modal(
    key ? 'Editar indicador' : 'Adicionar indicador',
    `<form id="metricEditorForm" oninput="updateMetricPreview('${id}')" onchange="updateMetricPreview('${id}')" onsubmit="event.preventDefault();saveMetric('${id}','${k.id}')"><div class="field"><label>Nome no cartão *</label><input name="title" aria-label="Nome do indicador" required value="${esc(k.title)}"></div><div class="field"><label>Informação ou coluna associada</label><select name="field" aria-label="Coluna do indicador"><optgroup label="Indicadores calculados"><option value="@records" ${k.field === '@records' ? 'selected' : ''}>Quantidade de registros</option><option value="@attention" ${k.field === '@attention' ? 'selected' : ''}>Registros que precisam de atenção</option><option value="@done" ${k.field === '@done' ? 'selected' : ''}>Entregas concluídas</option></optgroup><optgroup label="Colunas do projeto"><option value="">Não associado</option>${fieldOptions(p, k.field)}</optgroup></select></div><div class="twocol"><div class="field"><label>Como calcular</label><select name="agg" aria-label="Cálculo do indicador">${Object.entries(
      aggregationNames
    )
      .map(
        ([key, name]) =>
          `<option value="${key}" ${k.agg === key ? 'selected' : ''}>${name}</option>`
      )
      .join(
        ''
      )}</select></div><div class="field"><label>Apresentar como</label><select name="format" aria-label="Formato do indicador">${[
      ['number', 'Número'],
      ['currency', 'R$'],
      ['percent', 'Percentual (0 a 100)'],
    ]
      .map(
        ([key, name]) =>
          `<option value="${key}" ${k.format === key ? 'selected' : ''}>${name}</option>`
      )
      .join(
        ''
      )}</select></div></div><div class="field"><label>Cor de destaque</label><input name="color" type="color" value="${k.color || '#003856'}" style="height:40px"></div>${typographyFields(k)}<div class="metric-live-preview"><small id="metricPreviewTitle">${esc(k.title)}</small><strong id="metricPreviewValue"></strong><span>Prévia com a seleção atual do projeto</span></div></form>`,
    (key ? btn('Remover indicador', `removeMetric('${id}','${k.id}')`, 'trash') : '') +
      btn('Voltar', 'closeModal()', 'arrow') +
      `<button class="btn primary" type="submit" form="metricEditorForm">Salvar indicador</button>`
  );
  updateMetricPreview(id);
}
function readMetricForm() {
  const f = $('#metricEditorForm');
  return {
    ...readTypography(new FormData(f)),
    title: f.elements.title.value.trim(),
    field: f.elements.field.value,
    agg: f.elements.agg.value,
    format: f.elements.format.value,
    color: f.elements.color.value,
  };
}
function updateMetricPreview(id) {
  const p = visible().find((p) => p.id === id),
    k = readMetricForm(),
    f = $('#metricEditorForm');
  f.elements.agg.disabled = k.field.startsWith('@');
  $('#metricPreviewTitle').textContent = k.title;
  $('#metricPreviewValue').textContent = formatVisual(metricResult(p, biRows(p), k), k.format);
}
function saveMetric(id, key) {
  const p = visible().find((p) => p.id === id);
  if (!p || !canEdit(p)) return;
  const c = readMetricForm();
  if (!c.title) return;
  if (
    !c.field.startsWith('@') &&
    c.field &&
    !['count', 'distinct'].includes(c.agg) &&
    !p.fields.some((f) => f.id === c.field && ['number', 'currency'].includes(f.type))
  )
    return notify('Escolha uma coluna numérica para este cálculo.');
  const d = getDesign(p),
    i = d.kpis.findIndex((k) => k.id === key),
    k = { ...(i >= 0 ? d.kpis[i] : {}), ...c, id: key, visible: true };
  if (i < 0) d.kpis.push(k);
  else d.kpis[i] = k;
  if (commitDesign(p, d, 'Configurou indicador do BI')) {
    closeModal();
    render();
    notify('Indicador atualizado no painel.');
  }
}
function removeMetric(id, key) {
  const p = visible().find((p) => p.id === id);
  if (!p || !canEdit(p)) return;
  const d = getDesign(p);
  d.kpis = d.kpis.filter((k) => k.id !== key);
  if (commitDesign(p, d, 'Removeu indicador do BI')) {
    closeModal();
    render();
    notify('Indicador removido. Você pode desfazer em Personalizar BI.');
  }
}
const configureBIBeforeDesigner = configureBI;
configureBI = function (id) {
  openDesigner(id);
};
const closeModalBeforeVisual = closeModal;
closeModal = function () {
  const els = document.querySelectorAll('#modal .echart-canvas');
  els.forEach((el) => {
    const instance = typeof echarts !== 'undefined' ? echarts.getInstanceByDom(el) : null;
    if (instance) {
      activeCharts.delete(instance);
      instance.dispose();
    }
    chartMounts.delete(el.id);
  });
  visualDraft = null;
  closeModalBeforeVisual();
};
const profileSwitchBeforeCharts = switchProfile;
switchProfile = function (id) {
  biCrossFilters = {};
  profileSwitchBeforeCharts(id);
};
function selectVisualFilter(field, value, series = '', segment = '') {
  if (field) biCrossFilters[field] = value;
  if (series) biCrossFilters[series] = segment;
  render();
}
render();

const visualOptionsBeforeTypography = visualOptions;
visualOptions = function(p, rs, c, d) { return chartTypography(visualOptionsBeforeTypography(p, rs, c, d), c); };
