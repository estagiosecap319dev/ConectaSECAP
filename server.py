"""SECAP web server — Supabase Local Edition. Python 3.10+, standard library only."""

import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import sheet_sync
import weekly_notify
import access_request_notify

ROOT = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT / 'public'


class Handler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'same-origin')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def reply_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/sheet-sync/status':
            return self.reply_json(200, sheet_sync.STATUS)
        if path == '/api/sheet-sync' and 'conta=1' in (urlparse(self.path).query or ''):
            # Só o e-mail da conta de serviço: o portal mostra com quem compartilhar a planilha.
            return self.reply_json(200, {'conta_servico': sheet_sync.service_account_email()})
        if path.startswith('/api/'):
            return self.reply_json(404, {
                'error': 'As requisições da API do SECAP são gerenciadas diretamente pelo Supabase CLI local (porta 54321).'
            })
        super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path in ('/api/weekly-notify/preview', '/api/weekly-notify/run'):
            return self.weekly_notify(path.endswith('/run'))
        self.reply_json(404, {
            'error': 'As requisições da API do SECAP são gerenciadas diretamente pelo Supabase CLI local (porta 54321).'
        })

    def weekly_notify(self, send):
        """Notificação semanal acionada pelo administrador no Registro semanal."""
        auth = self.headers.get('Authorization', '')
        token = auth[7:] if auth.startswith('Bearer ') else ''
        try:
            length = min(int(self.headers.get('Content-Length') or 0), 10_000)
            body = json.loads(self.rfile.read(length) or b'{}') if length else {}
            weekly_notify.verify_admin(token)
            week = body.get('week') or None
            if send:
                result = weekly_notify.run(week, 'manual (administrador)', bool(body.get('reenviar')))
            else:
                result = weekly_notify.preview(week)
                result['modo'] = ('envio por e-mail' if weekly_notify.load_config()['smtp'].get('host')
                                  else 'modo teste (arquivos .eml)')
            return self.reply_json(200, result)
        except PermissionError as exc:
            return self.reply_json(403, {'error': str(exc)})
        except Exception as exc:  # noqa: BLE001
            return self.reply_json(500, {'error': str(exc)})


if __name__ == '__main__':
    host = os.environ.get('SECAP_HOST', '127.0.0.1')
    port = int(os.environ.get('SECAP_PORT', '8080'))
    print(f'SECAP Portal disponível em http://{host}:{port}')
    print(f'Backend / Banco de Dados: Supabase CLI Local em http://127.0.0.1:54321')
    if sheet_sync.start_background():
        print('Sincronia com a planilha Google: ativa (status em /api/sheet-sync/status)')
    if weekly_notify.start_background():
        print('Notificação semanal por e-mail: agendada')
    if access_request_notify.start_background():
        print('Aviso de solicitação de acesso por e-mail: ativo')
    print('Pressione Ctrl+C para encerrar.', flush=True)
    ThreadingHTTPServer((host, port), Handler).serve_forever()
