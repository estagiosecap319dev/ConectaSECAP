"""Notificação semanal na Vercel (Vercel Cron).

Chamado pelo agendamento de vercel.json toda segunda-feira. Só aceita a chamada com
Authorization: Bearer <CRON_SECRET> (a Vercel envia esse cabeçalho sozinha).

Variáveis de ambiente do projeto na Vercel:
  CRON_SECRET, SECAP_SUPABASE_URL, SECAP_SERVICE_ROLE_KEY, SECAP_PORTAL_URL,
  SMTP_HOST, SMTP_PORTA, SMTP_SEGURANCA, SMTP_USUARIO, SMTP_SENHA, SMTP_REMETENTE, SMTP_NOME_REMETENTE
"""

import hmac
import json
import os
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import weekly_notify  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        secret = os.environ.get('CRON_SECRET', '')
        given = self.headers.get('Authorization', '')
        if not secret or not hmac.compare_digest(given.encode(), ('Bearer ' + secret).encode()):
            return self._send(401, {'erro': 'Não autorizado.'})
        try:
            cfg = weekly_notify.load_config()
            if not cfg['smtp'].get('host'):
                # Na nuvem não há modo teste: sem SMTP nada é enviado nem registrado.
                return self._send(500, {'erro': 'SMTP_HOST não configurado; nenhum e-mail foi enviado.'})
            summary = weekly_notify.run(None, 'automático (Vercel Cron)')
        except Exception as exc:  # noqa: BLE001 - devolve o erro para o log da Vercel
            print('[notificação semanal] Erro:', exc, flush=True)
            return self._send(500, {'erro': str(exc)[:500]})
        return self._send(200, {k: summary[k] for k in ('semana', 'enviados', 'erros', 'ja_enviados', 'modo')})

    def _send(self, code, body):
        raw = json.dumps(body, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)
