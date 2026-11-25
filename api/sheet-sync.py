"""Sincronia com a planilha Google na Vercel.

Chamado a cada 5 minutos pelo agendador do Supabase (pg_cron + pg_net, ver
supabase/security/sheet_sync_cloud.sql). Só aceita
Authorization: Bearer <SHEET_SYNC_SECRET> ou Bearer <CRON_SECRET>.

Variáveis de ambiente:
  SHEET_SYNC_SECRET, GOOGLE_SERVICE_ACCOUNT_JSON (conteúdo do JSON da conta de serviço),
  SHEET_SYNC_PLANILHA_ID, SHEET_SYNC_PROJETO_ID, SHEET_SYNC_ABA (opcionais: planilha fixa),
Também sincroniza os projetos conectados a uma planilha pelo portal (project.sheetSync).
GET ?conta=1 (sem autorização) devolve só o e-mail da conta de serviço, para o portal
mostrar com quem a planilha precisa ser compartilhada.
  SECAP_SUPABASE_URL, SECAP_SERVICE_ROLE_KEY (as mesmas da notificação semanal).
"""

import hmac
import json
import os
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import sheet_sync  # noqa: E402

KEYS = ('modo', 'planilha_para_portal', 'portal_para_planilha', 'obras_criadas_no_portal',
        'linhas_criadas_na_planilha', 'fim', 'ignorado')


def _authorized(given: str) -> bool:
    for name in ('SHEET_SYNC_SECRET', 'CRON_SECRET'):
        secret = os.environ.get(name, '')
        if secret and hmac.compare_digest(given.encode(), ('Bearer ' + secret).encode()):
            return True
    return False


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self._handle()

    def do_POST(self):
        self._handle()

    def _handle(self):
        if 'conta=1' in (self.path.split('?', 1)[1] if '?' in self.path else ''):
            return self._send(200, {'conta_servico': sheet_sync.service_account_email()})
        if not _authorized(self.headers.get('Authorization', '')):
            return self._send(401, {'erro': 'Não autorizado.'})
        try:
            cfg = sheet_sync.load_base_config()
            if not cfg.get('ativo', True):
                return self._send(200, {'modo': 'pausada'})
            results = sheet_sync.run_all()
        except Exception as exc:  # noqa: BLE001 - devolve o erro para o log da Vercel
            print('[planilha] Erro:', exc, flush=True)
            return self._send(500, {'erro': str(exc)[:500]})
        body = {}
        for pid, report in results.items():
            item = {k: report.get(k) for k in KEYS if k in report}
            item['nome'] = report.get('nome', '')
            if report.get('erro'):
                item['erro'] = report['erro'][:500]
                print(f"[planilha] {item['nome'] or pid}: Erro: {item['erro']}", flush=True)
            elif str(report.get('modo', '')).startswith('relat'):
                # Sem base no banco, o ciclo só compara e nada é gravado.
                item['erro'] = ('Base da sincronia não encontrada no banco: rode uma sincronia pelo portal local '
                                '(python sheet_sync.py --uma-vez) para copiar a base.')
            item['conflitos'] = report.get('conflitos') if isinstance(report.get('conflitos'), int) else len(report.get('conflitos') or [])
            body[pid] = item
        failed = [i for i in body.values() if i.get('erro')]
        return self._send(500 if body and len(failed) == len(body) else 200, body)

    def _send(self, code, body):
        raw = json.dumps(body, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)
