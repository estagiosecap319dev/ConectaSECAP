/* Apresentação do BI: datas da planilha e tipografia opcional. */
function spreadsheetDate(value) {
  if (value == null || String(value).trim() === '') return '';
  const raw = String(value).trim();
  if (/^\d{5}(?:\.\d+)?$/.test(raw) && Number(raw) >= 20000 && Number(raw) <= 90000) {
    return new Date(Date.UTC(1899,11,30) + Math.floor(Number(raw)) * 86400000).toISOString().slice(0,10);
  }
  let y, m, d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) [y,m,d] = raw.split('-').map(Number);
  else {
    const match = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2}|\d{4})$/);
    if (!match) return '';
    d=Number(match[1]); m=Number(match[2]); y=Number(match[3]); if(y<100)y+=2000;
  }
  const date = new Date(Date.UTC(y,m-1,d));
  return date.getUTCFullYear()===y && date.getUTCMonth()===m-1 && date.getUTCDate()===d
    ? date.toISOString().slice(0,10) : '';
}
function biDateField(p, semantic) {
  const aliases = semantic === 'deadline'
    ? ['fimdavigencia','fimvigencia','terminodavigencia','datadefimdavigencia','datafimvigencia','vencimentodavigencia']
    : ['iniciodavigencia','iniciovigencia','datadeiniciodavigencia','datainiciovigencia'];
  return p.fields.find((f) => aliases.includes(importHeaderKey(f.name)));
}
function typographyFields(c = {}) {
  return `<fieldset class="typography-editor"><legend>Fonte dos títulos e textos</legend><label><input type="checkbox" name="customTypography" ${c.customTypography?'checked':''}> Personalizar a fonte deste bloco</label><div class="twocol"><div class="field"><label>Tamanho do título (px)</label><input name="titleFontSize" type="number" min="10" max="48" value="${Number(c.titleFontSize)||16}"></div><div class="field"><label>Tamanho dos textos / legendas (px)</label><input name="fontSize" type="number" min="10" max="36" value="${Number(c.fontSize)||12}"></div></div><div class="field"><label>Cor da fonte</label><input name="fontColor" type="color" value="${/^#[\da-f]{6}$/i.test(c.fontColor||'')?c.fontColor:'#003856'}"></div></fieldset>`;
}
// Mexer no tamanho ou na cor já liga "Personalizar a fonte deste bloco" (antes a mudança era ignorada
// até marcar a caixa). Roda na captura, antes do oninput do formulário que atualiza a prévia.
document.addEventListener('input', (e) => {
  const box = e.target?.closest?.('.typography-editor');
  if (!box || e.target.name === 'customTypography') return;
  const check = box.querySelector('[name=customTypography]');
  if (check && !check.checked) check.checked = true;
}, true);
function readTypography(data) {
  return { customTypography:data.has('customTypography'),
    titleFontSize:Math.max(10,Math.min(48,Number(data.get('titleFontSize'))||16)),
    fontSize:Math.max(10,Math.min(36,Number(data.get('fontSize'))||12)),
    fontColor:/^#[\da-f]{6}$/i.test(data.get('fontColor')||'')?data.get('fontColor'):'#003856' };
}
function typographyAttrs(c = {}, extraStyle = '') {
  if (!c.customTypography) return extraStyle ? `style="${extraStyle}"` : '';
  const safe = readTypography(new Map([['customTypography',true],['titleFontSize',c.titleFontSize],['fontSize',c.fontSize],['fontColor',c.fontColor]]));
  return `data-custom-font="true" style="--custom-title-size:${safe.titleFontSize}px;--custom-text-size:${safe.fontSize}px;--custom-font-color:${safe.fontColor};${extraStyle}"`;
}
function chartTypography(option, c) {
  if (!c.customTypography) return option;
  const safe = readTypography(new Map([['customTypography',true],['fontSize',c.fontSize],['fontColor',c.fontColor]]));
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    for (const key of Object.keys(node)) {
      if (['textStyle','axisLabel','label','endLabel','nameTextStyle'].includes(key) && node[key] && typeof node[key] === 'object') {
        Object.assign(node[key], {fontSize:safe.fontSize,color:safe.fontColor});
      } else if (key !== 'data') walk(node[key]);
    }
  }
  walk(option);
  option.textStyle={...option.textStyle,fontSize:safe.fontSize,color:safe.fontColor};
  return option;
}
