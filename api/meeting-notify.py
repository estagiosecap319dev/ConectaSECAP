"""Aviso de reunião marcada na agenda (e-mail) na Vercel.

Chamado:
  * pelo gatilho do Supabase (pg_net) assim que uma reunião é salva (POST);
  * pelo agendamento diário de vercel.json, como segurança (GET).
Só aceita Authorization: Bearer <MEETING_NOTIFY_SECRET>, <ACCESS_NOTIFY_SECRET> ou <CRON_SECRET>.

Variáveis de ambiente: as mesmas da notificação semanal (SECAP_SUPABASE_URL,
SECAP_SERVICE_ROLE_KEY, SECAP_PORTAL_URL, SMTP_*). MEETING_NOTIFY_SECRET é opcional.
"""

import hmac
import json
import os
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import meeting_notify  # noqa: E402
import weekly_notify  # noqa: E402


def _authorized(given: str) -> bool:
    # Aceita também o segredo do aviso de acesso: o banco usa o mesmo quando não há um próprio.
    for name in ('MEETING_NOTIFY_SECRET', 'ACCESS_NOTIFY_SECRET', 'CRON_SECRET'):
        secret = os.environ.get(name, '')
        if secret and hmac.compare_digest(given.encode(), ('Bearer ' + secret).encode()):
            return True
    return False


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self._handle('automático (Vercel Cron)')

    def do_POST(self):
        self._handle('automático (agenda)')

    def _handle(self, origin):
        if not _authorized(self.headers.get('Authorization', '')):
            return self._send(401, {'erro': 'Não autorizado.'})
        try:
            if not weekly_notify.load_config()['smtp'].get('host'):
                return self._send(500, {'erro': 'SMTP_HOST não configurado; nenhum e-mail foi enviado.'})
            summary = meeting_notify.run(origin)
        except Exception as exc:  # noqa: BLE001 - devolve o erro para o log da Vercel
            print('[reunião] Erro:', exc, flush=True)
            return self._send(500, {'erro': str(exc)[:500]})
        return self._send(200, summary)

    def _send(self, code, body):
        raw = json.dumps(body, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)
