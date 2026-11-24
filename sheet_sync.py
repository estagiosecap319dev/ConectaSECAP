"""Sincronia bidirecional: obras do portal (Supabase) <-> planilha Google (obras_prioritarias).

Como funciona
-------------
* A cada ciclo (padrão: 60 s) lê a aba da planilha e as obras do projeto no banco.
* As linhas são casadas pelo campo de ID da obra (padrão: campo "ID", id "codigo").
* Guarda em data/sheet-sync-state.json o último valor sincronizado de cada célula
  ("base"). Assim sabe de que lado veio cada mudança:
    - mudou só no portal   -> grava na planilha;
    - mudou só na planilha -> grava no portal (aparece na Auditoria como
      "Planilha Google (sincronização)");
    - mudou nos dois lados -> conflito: vence o lado configurado em "conflito"
      (padrão: portal) e o caso é registrado no relatório.
* Obra nova no portal (com ID) -> nova linha na planilha.
  Linha nova na planilha (com ID e nome) -> nova obra no portal.
  Exclusões NÃO são propagadas: apenas aparecem no relatório.
* Células com fórmula na planilha nunca são sobrescritas.

Configuração: data/sheet-sync.json (ver LEIA-ME-SINCRONIA-PLANILHA.md).
Uso manual:   python sheet_sync.py --uma-vez        (executa um ciclo)
              python sheet_sync.py --relatorio      (só compara, não grava nada)
"""

from __future__ import annotations

import datetime as dt
import json
import os
import re
import sys
import threading
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / 'data'
CONFIG_FILE = DATA_DIR / 'sheet-sync.json'
STATE_FILE = DATA_DIR / 'sheet-sync-state.json'
REPORT_FILE = DATA_DIR / 'sheet-sync-relatorio.json'
LOG_FILE = DATA_DIR / 'sheet-sync.log'

# Campos gravados em colunas próprias da tabela public.obras (o resto vai em "dados").
STANDARD_COLUMNS = {'nome', 'status', 'valor', 'executado', 'prazo', 'responsavel', 'progresso', 'proxima', 'orgao'}
DATE_COLUMNS = {'prazo'}
NUMERIC_TYPES = {'currency', 'number'}

# Mesmos apelidos usados pela importação do portal (public/app.js).
SYS_ALIASES = {
    'nome': ['nomedaobra', 'nomedoprojeto', 'obra', 'titulo', 'empreendimento', 'descricao', 'denominacao'],
    'status': ['status', 'situacao', 'posicao', 'fase'],
    'etapa': ['etapa', 'macroetapa'],
    'valor': ['valor', 'investimento', 'investimentoprevisto', 'orcamento',
              'valorestimadoexecucaoprojeto', 'valorestimadoexecucaoobra'],
    'executado': ['executado', 'valorexecutado', 'gasto', 'pago'],
    'prazo': ['prazo', 'prazodeentrega', 'dataentrega', 'prazodaproximaprovidencia', 'previsao'],
    'responsavel': ['responsavel', 'gestor', 'fiscal'],
    'progresso': ['progresso', 'avancofisico', 'avanco', 'execucao', 'percentualexecucao'],
    'proxima': ['proxima', 'proximaprovidencia', 'providencia', 'acao'],
    'orgao': ['orgao', 'secretaria', 'unidade'],
}

DEFAULT_CONFIG = {
    'ativo': True,
    'planilha_id': '',
    'aba': '',                       # vazio = detectar a aba pelos cabeçalhos
    'projeto_id': '',
    'credenciais': 'data/google-service-account.json',
    'supabase_url': 'http://127.0.0.1:54321',
    'service_role_key': '',          # ou variável de ambiente SECAP_SERVICE_ROLE_KEY
    'intervalo_segundos': 60,
    'primeira_sincronia': 'relatorio',   # relatorio | portal | planilha
    'conflito': 'portal',                # portal | planilha
    'campo_id': 'codigo',
    'campos_ignorados': ['responsavel'],
    'criar_obras_da_planilha': True,
    'criar_linhas_do_portal': True,
}


class SyncError(Exception):
    pass


# ----------------------------------------------------------------------------- utilidades

def log(msg: str) -> None:
    line = f'[{dt.datetime.now():%Y-%m-%d %H:%M:%S}] {msg}'
    print('[planilha] ' + msg, flush=True)
    try:
        DATA_DIR.mkdir(exist_ok=True)
        with LOG_FILE.open('a', encoding='utf-8') as fh:
            fh.write(line + '\n')
    except OSError:
        pass


def write_json(path: Path, payload) -> None:
    DATA_DIR.mkdir(exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding='utf-8')
    os.replace(tmp, path)


def norm_header(text) -> str:
    s = unicodedata.normalize('NFD', str(text or '').lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', s)


def http(method: str, url: str, headers=None, body=None, timeout=60):
    hdrs = dict(headers or {})
    data = None
    if body is not None:
        if isinstance(body, bytes):
            data = body
        elif isinstance(body, str):
            data = body.encode('utf-8')
        else:
            data = json.dumps(body, ensure_ascii=False).encode('utf-8')
            hdrs.setdefault('Content-Type', 'application/json')
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode('utf-8', 'replace')[:600]
        short = url.split('?')[0]
        raise SyncError(f'{method} {short} respondeu {exc.code}: {detail}') from None
    except urllib.error.URLError as exc:
        raise SyncError(f'Sem conexão com {url.split("?")[0]}: {exc.reason}') from None


# ----------------------------------------------------------------------------- valores

def to_number(v):
    if v is None or v == '':
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace('R$', '').replace('%', '').replace(' ', '').replace(' ', '')
    if not s:
        return None
    if ',' in s and '.' in s:
        s = s.replace('.', '').replace(',', '.') if s.rfind(',') > s.rfind('.') else s.replace(',', '')
    elif ',' in s:
        s = s.replace('.', '').replace(',', '.')
    elif s.count('.') > 1:
        s = s.replace('.', '')
    try:
        return float(s)
    except ValueError:
        return None


def fmt_number(n: float) -> str:
    text = f'{round(n, 2):.2f}'.rstrip('0').rstrip('.')
    return '0' if text in ('-0', '') else text


def to_iso_date(v):
    if v is None or v == '' or isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        # Número de série do Sheets. Antes de 1950 = resultado de fórmula sem data (ex.: 29/01/1900).
        if 18264 <= v < 2958466:
            return (dt.date(1899, 12, 30) + dt.timedelta(days=int(v))).isoformat()
        return None
    s = str(v).strip()
    m = re.match(r'^(\d{4})-(\d{2})-(\d{2})', s)
    if m:
        y, mo, d = map(int, m.groups())
    else:
        m = re.match(r'^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$', s)
        if not m:
            return None
        d, mo, y = map(int, m.groups())
        if y < 100:
            y += 2000
    try:
        return dt.date(y, mo, d).isoformat()
    except ValueError:
        return None


def canon(ftype: str, v) -> str:
    """Forma canônica usada para comparar portal e planilha (independe de formatação)."""
    if v is None:
        return ''
    if ftype in NUMERIC_TYPES:
        n = to_number(v)
        return '' if n is None else fmt_number(n)
    if ftype == 'date':
        iso = to_iso_date(v)
        if iso:
            return iso
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            return ''  # número que não é data válida (fórmula sem dado)
        return str(v).strip()
    if isinstance(v, bool):
        return 'Sim' if v else 'Não'
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return str(v).replace('\r\n', '\n').strip()


def db_value(field_id: str, ftype: str, c: str):
    """Valor canônico -> valor a gravar no banco. Retorna (ok, valor)."""
    column = field_id in STANDARD_COLUMNS
    if ftype in NUMERIC_TYPES:
        if c == '':
            return True, (None if column else '')
        n = float(c)
        return True, (int(n) if n.is_integer() else n)
    if ftype == 'date':
        if c == '':
            return True, (None if column else '')
        if re.match(r'^\d{4}-\d{2}-\d{2}$', c):
            return True, c
        return (False, None) if field_id in DATE_COLUMNS else (True, c)
    return True, c


def sheet_value(ftype: str, c: str):
    """Valor canônico -> valor a enviar para a planilha (USER_ENTERED)."""
    if c == '':
        return ''
    if ftype in NUMERIC_TYPES:
        n = float(c)
        return int(n) if n.is_integer() else n
    if ftype == 'date' and re.match(r'^\d{4}-\d{2}-\d{2}$', c):
        return c  # o Sheets interpreta AAAA-MM-DD como data em qualquer localidade
    if re.fullmatch(r'[1-9]\d{0,14}', c):
        return int(c)
    if c[0] in '=+-@' or to_number(c) is not None or to_iso_date(c):
        return "'" + c  # mantém como texto
    return c


def col_letter(index: int) -> str:
    s = ''
    index += 1
    while index:
        index, rem = divmod(index - 1, 26)
        s = chr(65 + rem) + s
    return s


# ----------------------------------------------------------------------------- Google Sheets

class GoogleSheets:
    SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

    def __init__(self, credentials_path: Path, spreadsheet_id: str):
        try:
            info = json.loads(Path(credentials_path).read_text(encoding='utf-8'))
        except FileNotFoundError:
            raise SyncError(f'Arquivo de credenciais não encontrado: {credentials_path}') from None
        self.email = info['client_email']
        self._key = info['private_key']
        self._token_uri = info.get('token_uri', 'https://oauth2.googleapis.com/token')
        self._token = None
        self._exp = 0
        self.sid = spreadsheet_id

    def _access_token(self) -> str:
        if self._token and time.time() < self._exp - 120:
            return self._token
        try:
            import jwt  # PyJWT (+ cryptography)
        except ImportError:
            raise SyncError('Instale as dependências: python -m pip install pyjwt cryptography') from None
        now = int(time.time())
        assertion = jwt.encode(
            {'iss': self.email, 'scope': self.SCOPE, 'aud': self._token_uri, 'iat': now, 'exp': now + 3600},
            self._key, algorithm='RS256')
        body = urllib.parse.urlencode({
            'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion': assertion})
        resp = http('POST', self._token_uri, {'Content-Type': 'application/x-www-form-urlencoded'}, body)
        self._token = resp['access_token']
        self._exp = now + int(resp.get('expires_in', 3600))
        return self._token

    def _call(self, method, path='', query=None, body=None):
        url = 'https://sheets.googleapis.com/v4/spreadsheets/' + self.sid + path
        if query:
            url += '?' + urllib.parse.urlencode(query, doseq=True)
        return http(method, url, {'Authorization': 'Bearer ' + self._access_token()}, body)

    def sheet_titles(self):
        meta = self._call('GET', '', {'fields': 'sheets(properties(title))'})
        return [s['properties']['title'] for s in meta.get('sheets', [])]

    def read(self, ranges, render):
        resp = self._call('GET', '/values:batchGet', {
            'ranges': ranges, 'valueRenderOption': render,
            'dateTimeRenderOption': 'SERIAL_NUMBER', 'majorDimension': 'ROWS'})
        return [vr.get('values', []) for vr in resp.get('valueRanges', [])]

    def write_cells(self, data):
        if data:
            self._call('POST', '/values:batchUpdate', body={'valueInputOption': 'USER_ENTERED', 'data': data})

    def append_rows(self, title, rows):
        if rows:
            rng = urllib.parse.quote(f"'{title}'!A1", safe='')
            self._call('POST', f'/values/{rng}:append',
                       {'valueInputOption': 'USER_ENTERED', 'insertDataOption': 'INSERT_ROWS'},
                       {'values': rows})


# ----------------------------------------------------------------------------- Supabase

class Portal:
    def __init__(self, url: str, key: str):
        if not key:
            raise SyncError('Informe service_role_key em data/sheet-sync.json ou na variável SECAP_SERVICE_ROLE_KEY.')
        self.url = url.rstrip('/')
        self.headers = {'apikey': key, 'Authorization': 'Bearer ' + key}

    def project(self, project_id):
        rows = http('GET', f'{self.url}/rest/v1/app_state?id=eq.1&select=body', self.headers)
        projects = (rows[0]['body'] or {}).get('projects', []) if rows else []
        for p in projects:
            if p.get('id') == project_id:
                return p
        raise SyncError(f'Projeto {project_id} não encontrado no portal.')

    def obras(self, project_id):
        out, start = [], 0
        while True:
            hdrs = dict(self.headers, Range=f'{start}-{start + 999}', **{'Range-Unit': 'items'})
            q = urllib.parse.urlencode({'project_id': f'eq.{project_id}', 'select': '*', 'order': 'id'})
            page = http('GET', f'{self.url}/rest/v1/obras?{q}', hdrs) or []
            out.extend(page)
            if len(page) < 1000:
                return out
            start += 1000

    def apply(self, project_id, updates, inserts, sheet_name):
        return http('POST', f'{self.url}/rest/v1/rpc/secap_sheet_sync_apply', self.headers, {
            'p_project': project_id, 'p_updates': updates, 'p_inserts': inserts, 'p_sheet_name': sheet_name})


# ----------------------------------------------------------------------------- sincronia

def load_config() -> dict:
    if not CONFIG_FILE.exists():
        raise SyncError(f'Configuração ausente: {CONFIG_FILE}')
    cfg = dict(DEFAULT_CONFIG)
    cfg.update(json.loads(CONFIG_FILE.read_text(encoding='utf-8')))
    cfg['service_role_key'] = cfg.get('service_role_key') or os.environ.get('SECAP_SERVICE_ROLE_KEY', '')
    for key in ('planilha_id', 'projeto_id'):
        if not cfg.get(key):
            raise SyncError(f'Preencha "{key}" em {CONFIG_FILE}.')
    if cfg['primeira_sincronia'] not in ('relatorio', 'portal', 'planilha'):
        raise SyncError('"primeira_sincronia" deve ser relatorio, portal ou planilha.')
    if cfg['conflito'] not in ('portal', 'planilha'):
        raise SyncError('"conflito" deve ser portal ou planilha.')
    return cfg


def load_state(cfg) -> dict:
    if STATE_FILE.exists():
        state = json.loads(STATE_FILE.read_text(encoding='utf-8'))
        # Base de outra planilha/projeto não serve: recomeça como primeira sincronia.
        if state.get('planilha_id') == cfg['planilha_id'] and state.get('projeto_id') == cfg['projeto_id']:
            return state
    return {'planilha_id': cfg['planilha_id'], 'projeto_id': cfg['projeto_id'], 'base': None}


def match_field(header, fields):
    h = norm_header(header)
    if not h:
        return None
    # Nome/ID exato tem prioridade sobre apelidos (ex.: "SITUAÇÃO" é campo próprio, não "Status").
    for f in fields:
        if f['id'] == h or norm_header(f.get('name')) == h:
            return f
    for f in fields:
        if h in SYS_ALIASES.get(f['id'], []):
            return f
    return None


def detect_layout(sheets, fields, wanted_title, id_field):
    """Escolhe a aba e a linha de cabeçalho com mais colunas reconhecidas."""
    titles = [wanted_title] if wanted_title else sheets.sheet_titles()
    blocks = sheets.read([f"'{t}'!1:15" for t in titles], 'FORMATTED_VALUE')
    best = None
    for title, rows in zip(titles, blocks):
        for r, row in enumerate(rows):
            mapping, used = {}, set()
            for c, header in enumerate(row):
                f = match_field(header, fields)
                if f and f['id'] not in used:
                    mapping[c] = f
                    used.add(f['id'])
            if id_field in used and 'nome' in used and (best is None or len(mapping) > len(best[2])):
                best = (title, r, mapping)
    if not best:
        raise SyncError('Nenhuma aba da planilha tem cabeçalho com as colunas de ID e nome da obra.')
    return best


class Cycle:
    def __init__(self, cfg, sheets=None, portal=None, dry_run=False):
        self.cfg = cfg
        self.sheets = sheets or GoogleSheets(ROOT / cfg['credenciais'], cfg['planilha_id'])
        self.portal = portal or Portal(cfg['supabase_url'], cfg['service_role_key'])
        self.dry_run = dry_run
        self.report = {'inicio': dt.datetime.now().isoformat(timespec='seconds'), 'avisos': [], 'conflitos': [],
                       'diferencas_primeira_sincronia': 0, 'planilha_para_portal': 0, 'portal_para_planilha': 0,
                       'obras_criadas_no_portal': 0, 'linhas_criadas_na_planilha': 0,
                       'somente_no_portal': [], 'somente_na_planilha': []}

    def warn(self, msg):
        if len(self.report['avisos']) < 200:
            self.report['avisos'].append(msg)

    def run(self):
        cfg = self.cfg
        project = self.portal.project(cfg['projeto_id'])
        fields = [f for f in project.get('fields', []) if f.get('id')]
        ftype = {f['id']: f.get('type', 'text') for f in fields}
        id_field = cfg['campo_id']
        if id_field not in ftype:
            raise SyncError(f'O projeto não tem o campo de ID "{id_field}".')

        title, header_row, mapping = detect_layout(self.sheets, fields, cfg.get('aba'), id_field)
        self.report['aba'] = title
        values = self.sheets.read([f"'{title}'"], 'UNFORMATTED_VALUE')[0]
        formulas = self.sheets.read([f"'{title}'"], 'FORMULA')[0]
        shown = self.sheets.read([f"'{title}'"], 'FORMATTED_VALUE')[0]
        ignored = set(cfg.get('campos_ignorados') or [])
        synced = {c: f['id'] for c, f in mapping.items() if f['id'] not in ignored and f['id'] != id_field}
        id_col = next(c for c, f in mapping.items() if f['id'] == id_field)

        # Planilha: chave -> {linha, valores, células com fórmula}
        sheet_rows, dup_sheet = {}, set()
        for r in range(header_row + 1, len(values)):
            row = values[r]
            key = canon('text', row[id_col] if id_col < len(row) else '')
            if not key:
                continue
            if key in sheet_rows:
                dup_sheet.add(key)
                continue
            frow = formulas[r] if r < len(formulas) else []
            srow = shown[r] if r < len(shown) else []

            def cell(c, fid, row=row, srow=srow):
                # Texto: compara como aparece na tela (ex.: "R$ 180.511,00"); número/data: valor bruto.
                src = row if ftype[fid] in NUMERIC_TYPES or ftype[fid] == 'date' else srow
                return src[c] if c < len(src) else ''
            sheet_rows[key] = {
                'row': r,
                'vals': {fid: canon(ftype[fid], cell(c, fid)) for c, fid in synced.items()},
                'formula': {fid for c, fid in synced.items()
                            if c < len(frow) and isinstance(frow[c], str) and frow[c].startswith('=')},
            }
        # Portal: chave -> obra
        db_rows, dup_db, no_key = {}, set(), 0
        for o in self.portal.obras(cfg['projeto_id']):
            dados = o.get('dados') or {}
            key = canon('text', dados.get(id_field, ''))
            if not key:
                no_key += 1
                continue
            if key in db_rows:
                dup_db.add(key)
                continue
            vals = {fid: canon(ftype[fid], o.get(fid) if fid in STANDARD_COLUMNS else dados.get(fid))
                    for fid in synced.values()}
            db_rows[key] = {'id': o['id'], 'vals': vals}
        for key in sorted(dup_sheet | dup_db):
            self.warn(f'ID {key} repetido ({"planilha" if key in dup_sheet else "portal"}); essa obra não é sincronizada.')
        if no_key:
            self.warn(f'{no_key} obra(s) do portal sem ID não são sincronizadas.')

        state = load_state(cfg)
        base = state.get('base')
        first = base is None
        mode = 'relatorio' if self.dry_run else (cfg['primeira_sincronia'] if first else None)
        new_base = {} if first else dict(base)

        updates, inserts, cell_writes, appends = {}, [], [], []
        pending_sheet = {}  # chave -> {fid: valor} confirmados só após gravar na planilha

        for key in sorted(set(sheet_rows) | set(db_rows)):
            if key in dup_sheet or key in dup_db:
                continue
            s, d = sheet_rows.get(key), db_rows.get(key)
            b = None if first else (base.get(key) or None)
            if s and d:
                merged = {}
                for c, fid in synced.items():
                    sv, dv = s['vals'][fid], d['vals'][fid]
                    if sv == dv:
                        merged[fid] = sv
                        continue
                    if first:
                        winner = mode
                        self.report['diferencas_primeira_sincronia'] += 1
                    elif b is None or fid not in b:
                        winner = self.cfg['conflito']
                    elif sv == b[fid]:
                        winner = 'portal'
                    elif dv == b[fid]:
                        winner = 'planilha'
                    else:
                        winner = self.cfg['conflito']
                        self.report['conflitos'].append(
                            {'id': key, 'campo': fid, 'portal': dv, 'planilha': sv, 'venceu': winner})
                    if mode == 'relatorio':
                        diffs = self.report.setdefault('diferencas', [])
                        if len(diffs) < 500:
                            diffs.append({'id': key, 'campo': fid, 'portal': dv[:200], 'planilha': sv[:200]})
                        continue
                    if winner == 'portal' and fid in s['formula']:
                        self.warn(f'ID {key} · {fid}: célula com fórmula na planilha; valor da planilha mantido.')
                        winner = 'planilha'
                    if winner == 'planilha':
                        ok, value = db_value(fid, ftype[fid], sv)
                        if not ok:
                            self.warn(f'ID {key} · {fid}: "{sv}" não é uma data válida; não gravado no portal.')
                            merged[fid] = b[fid] if b and fid in b else dv
                            continue
                        u = updates.setdefault(d['id'], {'id': d['id'], 'columns': {}, 'dados': {}})
                        (u['columns'] if fid in STANDARD_COLUMNS else u['dados'])[fid] = value
                        merged[fid] = sv
                        self.report['planilha_para_portal'] += 1
                    else:
                        cell_writes.append({'range': f"'{title}'!{col_letter(c)}{s['row'] + 1}",
                                            'values': [[sheet_value(ftype[fid], dv)]]})
                        pending_sheet.setdefault(key, {})[fid] = dv
                        merged[fid] = b[fid] if b and fid in b else sv
                        self.report['portal_para_planilha'] += 1
                if mode != 'relatorio':
                    new_base[key] = merged
            elif d:  # só no portal
                if (first and mode != 'portal') or (not first and key in base) or not self.cfg['criar_linhas_do_portal'] \
                        or mode == 'relatorio':
                    self.report['somente_no_portal'].append(key)
                    if mode != 'relatorio':
                        new_base.setdefault(key, {})
                    continue
                row = [''] * (max(list(synced) + [id_col]) + 1)
                row[id_col] = sheet_value('text', key)
                for c, fid in synced.items():
                    row[c] = sheet_value(ftype[fid], d['vals'][fid])
                appends.append(row)
                pending_sheet[key] = dict(d['vals'])
                self.report['linhas_criadas_na_planilha'] += 1
            else:  # só na planilha
                name = s['vals'].get('nome', '')
                if (first and mode != 'planilha') or (not first and key in base) \
                        or not self.cfg['criar_obras_da_planilha'] or mode == 'relatorio' or not name:
                    self.report['somente_na_planilha'].append(key)
                    if mode != 'relatorio':
                        new_base.setdefault(key, {})
                    continue
                item = {'id': str(uuid.uuid4()), 'columns': {}, 'dados': {id_field: key}}
                for fid, sv in s['vals'].items():
                    ok, value = db_value(fid, ftype[fid], sv)
                    if ok:
                        (item['columns'] if fid in STANDARD_COLUMNS else item['dados'])[fid] = value
                item['columns']['nome'] = name
                inserts.append(item)
                new_base[key] = dict(s['vals'])
                self.report['obras_criadas_no_portal'] += 1

        for k in ('somente_no_portal', 'somente_na_planilha'):
            self.report[k + '_total'] = len(self.report[k])
            self.report[k] = self.report[k][:100]

        if mode == 'relatorio':
            self.report['modo'] = 'relatório (nada foi gravado)'
            return self.report

        # 1) portal  2) base parcial  3) planilha  4) base final
        if updates or inserts:
            res = self.portal.apply(cfg['projeto_id'], list(updates.values()), inserts, f'Planilha Google · {title}')
            self.report['resultado_portal'] = res
        write_json(STATE_FILE, {'planilha_id': cfg['planilha_id'], 'projeto_id': cfg['projeto_id'],
                                'aba': title, 'base': new_base})
        self.sheets.write_cells(cell_writes)
        self.sheets.append_rows(title, appends)
        for key, vals in pending_sheet.items():
            new_base.setdefault(key, {}).update(vals)
        write_json(STATE_FILE, {'planilha_id': cfg['planilha_id'], 'projeto_id': cfg['projeto_id'],
                                'aba': title, 'base': new_base,
                                'ultima_sincronia': dt.datetime.now().isoformat(timespec='seconds')})
        self.report['modo'] = 'primeira sincronia (' + mode + ' prevalece)' if first else 'sincronia'
        return self.report


# ----------------------------------------------------------------------------- execução contínua

STATUS = {'ativo': False, 'ultima_execucao': None, 'ultimo_erro': None, 'resumo': None}
_lock = threading.Lock()


def run_once(dry_run=False, sheets=None, portal=None):
    with _lock:
        cfg = load_config()
        report = Cycle(cfg, sheets, portal, dry_run).run()
        report['fim'] = dt.datetime.now().isoformat(timespec='seconds')
        write_json(REPORT_FILE, report)
        return report


def summary(report):
    return (f"{report.get('modo')}: planilha→portal {report['planilha_para_portal']}, "
            f"portal→planilha {report['portal_para_planilha']}, obras novas {report['obras_criadas_no_portal']}, "
            f"linhas novas {report['linhas_criadas_na_planilha']}, conflitos {len(report['conflitos'])}, "
            f"avisos {len(report['avisos'])}")


def _loop():
    delay = None
    while True:
        try:
            cfg = load_config()
            delay = max(30, int(cfg.get('intervalo_segundos') or 60))
            if cfg.get('ativo', True):
                report = run_once()
                STATUS.update(ultima_execucao=report['fim'], ultimo_erro=None,
                              resumo={k: v for k, v in report.items() if k not in ('avisos',)})
                if any(report[k] for k in ('planilha_para_portal', 'portal_para_planilha',
                                           'obras_criadas_no_portal', 'linhas_criadas_na_planilha')) \
                        or report['conflitos']:
                    log(summary(report))
        except Exception as exc:  # noqa: BLE001 - a sincronia nunca derruba o portal
            STATUS.update(ultima_execucao=dt.datetime.now().isoformat(timespec='seconds'), ultimo_erro=str(exc))
            log(f'Erro: {exc}')
            delay = min(max(delay or 60, 60) * 2, 900)
        time.sleep(delay or 60)


def start_background():
    """Inicia a sincronia em segundo plano, se data/sheet-sync.json existir."""
    if not CONFIG_FILE.exists():
        return False
    STATUS['ativo'] = True
    threading.Thread(target=_loop, name='sheet-sync', daemon=True).start()
    log('Sincronia com a planilha Google iniciada.')
    return True


if __name__ == '__main__':
    try:
        rep = run_once(dry_run='--relatorio' in sys.argv)
    except SyncError as err:
        print('Erro:', err)
        sys.exit(1)
    print(summary(rep))
    for a in rep['avisos'][:30]:
        print(' -', a)
    print(f'Relatório completo: {REPORT_FILE}')
