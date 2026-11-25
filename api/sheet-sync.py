"""Sincronia com a planilha Google na Vercel.

Chamado a cada 2 minutos pelo agendador do Supabase (pg_cron + pg_net, ver
supabase/security/sheet_sync_cloud.sql). Só aceita
Authorization: Bearer <SHEET_SYNC_SECRET> ou Bearer <CRON_SECRET>.

Variáveis de ambiente:
  SHEET_SYNC_SECRET, GOOGLE_SERVICE_ACCOUNT_JSON (conteúdo do JSON da conta de serviço),
  SHEET_SYNC_PLANILHA_ID, SHEET_SYNC_PROJETO_ID, SHEET_SYNC_ABA (opcional),
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
        if not _authorized(self.headers.get('Authorization', '')):
            return self._send(401, {'erro': 'Não autorizado.'})
        try:
            cfg = sheet_sync.load_config()
            if not cfg.get('ativo', True):
                return self._send(200, {'modo': 'pausada'})
            report = sheet_sync.run_once()
            if str(report.get('modo', '')).startswith('relat'):
                # Sem base no banco, o ciclo só compara e nada é gravado.
                return self._send(500, {'erro': 'Base da sincronia não encontrada no banco: depois de instalar '
                                                 'sheet_sync_cloud.sql, rode uma sincronia pelo portal local '
                                                 '(python sheet_sync.py --uma-vez) para copiar a base.'})
        except Exception as exc:  # noqa: BLE001 - devolve o erro para o log da Vercel
            print('[planilha] Erro:', exc, flush=True)
            return self._send(500, {'erro': str(exc)[:500]})
        body = {k: report.get(k) for k in KEYS if k in report}
        body['conflitos'] = len(report.get('conflitos') or [])
        body['avisos'] = (report.get('avisos') or [])[:20]
        if not report.get('ignorado') and any(report.get(k) for k in KEYS[1:5]):
            print('[planilha]', sheet_sync.summary(report), flush=True)
        return self._send(200, body)

    def _send(self, code, body):
        raw = json.dumps(body, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)
