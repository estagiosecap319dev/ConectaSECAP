"""E-mail de reunião marcada na agenda do portal.

* O gatilho do banco (supabase/security/meeting_notify.sql) registra uma notificação para cada
  participante quando uma reunião é criada ou alterada.
* Este módulo envia os e-mails pendentes e marca cada notificação como enviada (ou com erro).
* É acionado:
    - na Vercel, por /api/meeting-notify (chamado pelo gatilho na hora e por um agendamento diário);
    - no portal local (server.py), por uma verificação a cada minuto.
* Usa a mesma configuração de e-mail (SMTP) da notificação semanal. Sem SMTP: modo teste (.eml).

Uso manual: python meeting_notify.py
"""

from __future__ import annotations

import datetime as dt
import html
import json
import sys
import threading
import time
from email.message import EmailMessage
from email.utils import formataddr, make_msgid

import weekly_notify
from sheet_sync import SyncError

_lock = threading.Lock()
WEEKDAYS = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo']


def log(msg: str) -> None:
    weekly_notify.log('[reunião] ' + msg)


def when_text(n: dict) -> str:
    try:
        day = dt.date.fromisoformat(str(n.get('date') or '')[:10])
        text = f"{WEEKDAYS[day.weekday()]}, {day:%d/%m/%Y}"
    except ValueError:
        text = 'data não informada'
    hour = str(n.get('time') or '')[:5]
    return f'{text} às {hour}' if hour else text


def build_message(cfg, n: dict) -> EmailMessage:
    smtp = cfg['smtp']
    sender = smtp.get('remetente') or smtp.get('usuario') or 'portal-secap@localhost'
    portal = str(cfg.get('portal_url') or '').rstrip('/')
    changed = n.get('kind') == 'alterada'
    title = str(n.get('title') or 'Reunião')
    organizer = str(n.get('organizer') or 'Um colega')
    when = when_text(n)
    msg = EmailMessage()
    msg['Subject'] = f"{'Reunião alterada' if changed else 'Nova reunião'}: {title} · {when}"
    msg['From'] = formataddr((smtp.get('nome_remetente') or 'Portal SECAP', sender))
    msg['To'] = str(n['email'])
    msg['Message-ID'] = make_msgid(domain=sender.split('@')[-1] or 'localhost')
    intro = (f'{organizer} alterou a reunião abaixo, da qual você participa.' if changed
             else f'{organizer} marcou uma reunião com você no Portal SECAP.')
    desc = str(n.get('description') or '').strip()
    lines = [f"Olá, {n.get('name') or ''}".strip(','), '', intro, '', f'Reunião: {title}', f'Quando: {when}',
             f'Marcada por: {organizer}']
    if desc:
        lines += ['', 'Anotações:', desc]
    lines += ['', 'A reunião aparece na sua agenda do portal (Calendário).'] + ([f'Portal: {portal}'] if portal else [])
    lines += ['', 'Mensagem automática do Portal SECAP.']
    msg.set_content('\n'.join(lines))
    button = (f'<p style="margin:20px 0"><a href="{html.escape(portal)}" style="background:#003856;color:#fff;'
              'padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Abrir a agenda no portal</a></p>'
              if portal else '')
    desc_html = (f'<p style="margin:14px 0 4px;color:#47616d">Anotações:</p>'
                 f'<p style="white-space:pre-wrap;margin:0">{html.escape(desc)}</p>' if desc else '')
    msg.add_alternative(f"""<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1f2d36;font-size:14px">
<h2 style="color:#003856;margin:0 0 12px">{'Reunião alterada' if changed else 'Nova reunião'}</h2>
<p>{html.escape(intro)}</p>
<table style="border-collapse:collapse;font-size:14px;margin:8px 0">
<tr><td style="padding:6px 14px 6px 0;color:#47616d">Reunião</td><td style="padding:6px 0"><strong>{html.escape(title)}</strong></td></tr>
<tr><td style="padding:6px 14px 6px 0;color:#47616d">Quando</td><td style="padding:6px 0"><strong>{html.escape(when)}</strong></td></tr>
<tr><td style="padding:6px 14px 6px 0;color:#47616d">Marcada por</td><td style="padding:6px 0">{html.escape(organizer)}</td></tr>
</table>{desc_html}
<p>A reunião aparece na sua agenda do portal (Calendário).</p>{button}
<p style="color:#6b7280;font-size:12px">Mensagem automática do Portal SECAP.</p>
</body></html>""", subtype='html')
    return msg


def run(origin: str = 'automático') -> dict:
    """Envia os e-mails de reunião pendentes."""
    with _lock:
        cfg = weekly_notify.load_config()
        pending = weekly_notify.rpc(cfg, 'secap_meeting_notify_pending', {'p_limit': 200}) or []
        summary = {'pendentes': len(pending), 'enviados': 0, 'teste': 0, 'erros': 0,
                   'modo': 'envio por e-mail' if cfg['smtp'].get('host') else 'modo teste (arquivos .eml)'}
        results: dict[str, list] = {}
        for n in pending:
            try:
                status = weekly_notify.deliver(cfg, build_message(cfg, n))
            except Exception as exc:  # noqa: BLE001 - registra e segue para os demais
                status = 'erro: ' + str(exc)[:250]
            results.setdefault(status, []).append(n['id'])
            key = 'enviados' if status == 'enviado' else 'teste' if status == 'teste' else 'erros'
            summary[key] += 1
        for status, ids in results.items():
            weekly_notify.rpc(cfg, 'secap_meeting_notify_mark', {'p_ids': ids, 'p_status': status})
        if pending:
            log(f"{len(pending)} aviso(s) ({origin}): {summary['enviados']} enviado(s), "
                f"{summary['teste']} em teste, {summary['erros']} erro(s)")
        return summary


def _loop(interval: int):
    while True:
        try:
            run('automático (portal local)')
        except Exception as exc:  # noqa: BLE001 - nunca derruba o portal
            log(f'Erro: {exc}')
        time.sleep(interval)


def start_background(interval: int = 60) -> bool:
    """Verifica avisos pendentes periodicamente se data/weekly-notify.json existir."""
    if not weekly_notify.CONFIG_FILE.exists():
        return False
    threading.Thread(target=_loop, args=(interval,), name='meeting-notify', daemon=True).start()
    return True


if __name__ == '__main__':
    try:
        print(json.dumps(run('manual (linha de comando)'), ensure_ascii=False, indent=1))
    except SyncError as err:
        print('Erro:', err)
        sys.exit(1)
