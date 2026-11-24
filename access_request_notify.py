"""Aviso por e-mail aos administradores quando chega uma solicitação de acesso.

* Quem cria conta na tela de login vira uma solicitação em public.account_requests.
* Este módulo lê as solicitações pendentes ainda não avisadas e envia um e-mail para cada
  administrador do portal, depois marca a solicitação como avisada (não repete o aviso).
* É acionado:
    - na Vercel, por /api/access-request-notify (chamado pelo gatilho do Supabase na hora
      do cadastro, e por um agendamento diário de segurança);
    - no portal local (server.py), por uma verificação a cada minuto.
* Usa a mesma configuração de e-mail (SMTP) da notificação semanal
  (data/weekly-notify.json ou variáveis SMTP_* na Vercel). Sem SMTP: modo teste (.eml).

Instalação: supabase/security/access_request_notify.sql (ver LEIA-ME-AVISO-SOLICITACAO-ACESSO.md).
Uso manual: python access_request_notify.py
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


def log(msg: str) -> None:
    weekly_notify.log('[solicitação de acesso] ' + msg)


def br_datetime(value: str) -> str:
    try:
        when = dt.datetime.fromisoformat(str(value).replace('Z', '+00:00')).astimezone(weekly_notify.BRT)
        return when.strftime('%d/%m/%Y às %H:%M')
    except ValueError:
        return str(value or '')


def build_message(cfg, admin_email: str, requests: list) -> EmailMessage:
    smtp = cfg['smtp']
    sender = smtp.get('remetente') or smtp.get('usuario') or 'portal-secap@localhost'
    portal = str(cfg.get('portal_url') or '').rstrip('/')
    n = len(requests)
    msg = EmailMessage()
    msg['Subject'] = (f'Nova solicitação de acesso ao Portal SECAP: {requests[0]["name"]}' if n == 1
                      else f'{n} novas solicitações de acesso ao Portal SECAP')
    msg['From'] = formataddr((smtp.get('nome_remetente') or 'Portal SECAP', sender))
    msg['To'] = admin_email
    msg['Message-ID'] = make_msgid(domain=sender.split('@')[-1] or 'localhost')

    intro = ('Uma pessoa pediu acesso ao Portal SECAP e aguarda sua decisão.' if n == 1
             else f'{n} pessoas pediram acesso ao Portal SECAP e aguardam sua decisão.')
    where = 'Para aprovar ou recusar, entre no portal e abra Administração → Acesso ao sistema.'
    lines = [intro, '']
    for r in requests:
        lines += [f"• {r['name']} <{r['email']}>", f"  Cargo: {r.get('jobTitle') or 'Não informado'}",
                  f"  Pedido em: {br_datetime(r.get('createdAt'))}", '']
    lines += [where] + ([f'Portal: {portal}'] if portal else []) + ['', 'Mensagem automática do Portal SECAP.']
    msg.set_content('\n'.join(lines))

    rows = ''.join(
        '<tr>'
        f'<td style="padding:8px 10px;border-bottom:1px solid #e4ebef"><strong>{html.escape(r["name"])}</strong>'
        f'<br><span style="color:#47616d">{html.escape(r["email"])}</span></td>'
        f'<td style="padding:8px 10px;border-bottom:1px solid #e4ebef">{html.escape(r.get("jobTitle") or "Não informado")}</td>'
        f'<td style="padding:8px 10px;border-bottom:1px solid #e4ebef;white-space:nowrap">{html.escape(br_datetime(r.get("createdAt")))}</td>'
        '</tr>' for r in requests)
    button = (f'<p style="margin:20px 0"><a href="{html.escape(portal)}" style="background:#003856;color:#fff;'
              'padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Abrir o portal</a></p>'
              if portal else '')
    msg.add_alternative(f"""<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1f2d36;font-size:14px">
<h2 style="color:#003856;margin:0 0 12px">Solicitação de acesso ao Portal SECAP</h2>
<p>{html.escape(intro)}</p>
<table style="border-collapse:collapse;width:100%;max-width:640px;font-size:13px">
<thead><tr style="background:#f3f6f8;text-align:left"><th style="padding:8px 10px">Pessoa</th>
<th style="padding:8px 10px">Cargo</th><th style="padding:8px 10px">Pedido em</th></tr></thead>
<tbody>{rows}</tbody></table>
<p>{html.escape(where)}</p>{button}
<p style="color:#6b7280;font-size:12px">Mensagem automática do Portal SECAP.</p>
</body></html>""", subtype='html')
    return msg


def run(origin: str = 'automático') -> dict:
    """Avisa os administradores sobre as solicitações pendentes ainda não avisadas."""
    with _lock:
        cfg = weekly_notify.load_config()
        data = weekly_notify.rpc(cfg, 'secap_access_notify_pending', {})
        requests, admins = data.get('requests') or [], data.get('admins') or []
        summary = {'solicitacoes': len(requests), 'administradores': len(admins), 'enviados': 0, 'teste': 0,
                   'erros': [], 'modo': 'envio por e-mail' if cfg['smtp'].get('host') else 'modo teste (arquivos .eml)'}
        if not requests:
            return summary
        if not admins:
            log('Há solicitações pendentes, mas nenhum administrador com e-mail cadastrado.')
            summary['erros'].append('Nenhum administrador com e-mail.')
            return summary
        for admin in admins:
            try:
                status = weekly_notify.deliver(cfg, build_message(cfg, admin, requests))
                summary['enviados' if status == 'enviado' else 'teste'] += 1
            except Exception as exc:  # noqa: BLE001 - tenta os demais administradores
                summary['erros'].append(f'{admin}: {str(exc)[:200]}')
        ok = summary['enviados'] or summary['teste']
        status = ('enviado' if summary['enviados'] else 'teste') if ok else 'erro: ' + '; '.join(summary['erros'])
        weekly_notify.rpc(cfg, 'secap_access_notify_mark', {'p_ids': [r['id'] for r in requests], 'p_status': status})
        log(f"{len(requests)} solicitação(ões) ({origin}): {summary['enviados']} e-mail(s) enviado(s), "
            f"{summary['teste']} em teste, {len(summary['erros'])} erro(s)")
        return summary


def _loop(interval: int):
    while True:
        try:
            run('automático (portal local)')
        except Exception as exc:  # noqa: BLE001 - nunca derruba o portal
            log(f'Erro: {exc}')
        time.sleep(interval)


def start_background(interval: int = 60) -> bool:
    """Verifica novas solicitações periodicamente se data/weekly-notify.json existir."""
    if not weekly_notify.CONFIG_FILE.exists():
        return False
    threading.Thread(target=_loop, args=(interval,), name='access-request-notify', daemon=True).start()
    return True


if __name__ == '__main__':
    try:
        print(json.dumps(run('manual (linha de comando)'), ensure_ascii=False, indent=1))
    except SyncError as err:
        print('Erro:', err)
        sys.exit(1)
