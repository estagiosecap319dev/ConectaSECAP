"""Leva para o Supabase em nuvem: a conta estagiosecap319@gmail.com (administradora),
o estado do portal (projetos/campos, sem permissões de outras contas e sem histórico)
e as obras + planilha importada. NÃO leva auditoria, registro semanal, agenda nem anotações.

Pré-requisitos:
  * data/nuvem.json com {"url": "https://<ref>.supabase.co", "service_role_key": "<chave>"}
    (Painel do Supabase → Project Settings → API Keys → service_role / secret).
  * Supabase local rodando (fonte dos dados).
Uso:  python scripts/migrar_para_nuvem.py
"""
import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EMAIL = 'estagiosecap319@gmail.com'
CFG = json.loads((ROOT / 'data' / 'nuvem.json').read_text(encoding='utf-8'))
URL, KEY = CFG['url'].rstrip('/'), CFG['service_role_key']
H = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'}


def local(sql):
    out = subprocess.run(['docker', 'exec', '-i', 'supabase_db_SECAP-Site', 'psql', '-U', 'postgres', '-At'],
                         input=sql, capture_output=True, text=True, encoding='utf-8', check=True)
    return json.loads(out.stdout.strip() or 'null')


def call(method, path, body=None, extra=None):
    req = urllib.request.Request(URL + path, method=method, headers=dict(H, **(extra or {})),
                                 data=None if body is None else json.dumps(body, ensure_ascii=False).encode('utf-8'))
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        sys.exit(f'Falhou {method} {path}: {e.code} {e.read().decode("utf-8", "replace")[:400]}')


# 1) Conta administradora (primeira conta da nuvem = administradora pelo gatilho handle_new_user)
user = local(f"select row_to_json(u) from (select raw_user_meta_data from auth.users where email='{EMAIL}') u")
call('POST', '/auth/v1/admin/users', {'email': EMAIL, 'email_confirm': True,
                                      'user_metadata': user['raw_user_meta_data'] if user else {}})
print('Conta criada:', EMAIL)

# 2) Estado do portal sem histórico e sem regras de outras contas
body = local('select body from public.app_state where id=1')
for k in ('fieldPermissions', 'projectWorkAccess', 'projectResponsibleLinks', 'rowFilters'):
    body[k] = {}  # sempre objeto: as funções do banco gravam por chave (id do usuário/projeto)
body['requests'] = []
body['logs'], body['notes'] = [], []
body['users'] = [u for u in body.get('users', []) if u.get('id') == 'admin']
call('POST', '/rest/v1/app_state', {'id': 1, 'body': body}, {'Prefer': 'resolution=merge-duplicates'})
print('Estado do portal enviado.')

# 3) Planilha importada e obras (em lotes)
planilhas = local("select coalesce(json_agg(p),'[]') from (select id,nome_arquivo,project_id,total_obras,importado_por,created_at from public.planilhas_importadas) p")
if planilhas:
    call('POST', '/rest/v1/planilhas_importadas', planilhas)
obras = local("select coalesce(json_agg(o order by id),'[]') from (select id,project_id,nome,status,valor,executado,prazo,responsavel,progresso,proxima,orgao,dados,created_at,updated_at,nome_planilha,planilha_id from public.obras) o")
for i in range(0, len(obras), 50):
    call('POST', '/rest/v1/obras', obras[i:i + 50])
print(f'{len(obras)} obras enviadas.')
