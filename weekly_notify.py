"""Notificação semanal por e-mail: obras sem edição na semana.

* Toda segunda-feira (padrão 08:00, horário de Brasília) o servidor do portal consulta,
  para a semana anterior (segunda a domingo), as obras de cada conta vinculada
  (Responsável Acompanhamento ou seleção nas Permissões do projeto) que não tiveram
  nenhuma alteração registrada na auditoria, e envia um e-mail para a conta.
* Cada envio é gravado na Auditoria ("Notificação semanal enviada") e na tabela
  public.secap_weekly_notifications, que impede envio duplicado na mesma semana.
* Sem servidor de e-mail (SMTP) configurado, funciona em MODO TESTE: os e-mails são
  gerados em data/weekly-notify-outbox/ (arquivos .eml) e registrados como teste.

Configuração: data/weekly-notify.json (ver LEIA-ME-NOTIFICACAO-SEMANAL.md).
Uso manual:   python weekly_notify.py --previa            (lista quem seria notificado)
              python weekly_notify.py --enviar [AAAA-MM-DD] (envia para a semana do dia)
"""

from __future__ import annotations

import datetime as dt
import html
import json
import os
import smtplib
import ssl
import sys
import threading
import time
import urllib.parse
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from pathlib import Path

from sheet_sync import SyncError, http

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / 'data'
CONFIG_FILE = DATA_DIR / 'weekly-notify.json'
STATE_FILE = DATA_DIR / 'weekly-notify-state.json'
OUTBOX = DATA_DIR / 'weekly-notify-outbox'
LOG_FILE = DATA_DIR / 'weekly-notify.log'
BRT = dt.timezone(dt.timedelta(hours=-3))  # Brasília (sem horário de verão)

DEFAULT_CONFIG = {
    'ativo': True,
    'dia_semana': 0,            # 0 = segunda-feira
    'hora': '08:00',
    'portal_url': 'http://127.0.0.1:8080',
    'supabase_url': 'http://127.0.0.1:54321',
    'service_role_key': '',     # vazio = usa a de data/sheet-sync.json ou SECAP_SERVICE_ROLE_KEY
    'smtp': {
        'host': '',             # vazio = modo teste (gera .eml, não envia)
        'porta': 587,
        'seguranca': 'starttls',  # starttls | ssl | nenhuma
        'usuario': '',
        'senha': '',
        'remetente': '',
        'nome_remetente': 'Portal SECAP',
    },
}

ENV_CONFIG = {'SECAP_SUPABASE_URL': 'supabase_url', 'SECAP_PORTAL_URL': 'portal_url'}
ENV_SMTP = {'SMTP_HOST': 'host', 'SMTP_PORTA': 'porta', 'SMTP_SEGURANCA': 'seguranca', 'SMTP_USUARIO': 'usuario',
            'SMTP_SENHA': 'senha', 'SMTP_REMETENTE': 'remetente', 'SMTP_NOME_REMETENTE': 'nome_remetente'}

STATUS = {'ativo': False, 'ultima_execucao': None, 'ultimo_erro': None, 'resumo': None}
_lock = threading.Lock()


def log(msg: str) -> None:
    print('[notificação semanal] ' + msg, flush=True)
    try:
        DATA_DIR.mkdir(exist_ok=True)
        with LOG_FILE.open('a', encoding='utf-8') as fh:
            fh.write(f'[{dt.datetime.now():%Y-%m-%d %H:%M:%S}] {msg}\n')
    except OSError:
        pass


def load_config() -> dict:
    cfg = json.loads(json.dumps(DEFAULT_CONFIG))
    if CONFIG_FILE.exists():
        user = json.loads(CONFIG_FILE.read_text(encoding='utf-8'))
        smtp = dict(cfg['smtp'], **(user.get('smtp') or {}))
        cfg.update(user)
        cfg['smtp'] = smtp
    # Variáveis de ambiente (usadas na Vercel, onde não existe data/) têm prioridade sobre o arquivo.
    for name, key in ENV_CONFIG.items():
        if os.environ.get(name):
            cfg[key] = os.environ[name]
    for name, key in ENV_SMTP.items():
        if os.environ.get(name):
            cfg['smtp'][key] = os.environ[name]
    key = os.environ.get('SECAP_SERVICE_ROLE_KEY') or cfg.get('service_role_key', '')
    if not key:
        sheet_cfg = DATA_DIR / 'sheet-sync.json'
        if sheet_cfg.exists():
            key = json.loads(sheet_cfg.read_text(encoding='utf-8')).get('service_role_key', '')
    if not key:
        raise SyncError('Informe service_role_key em data/weekly-notify.json ou SECAP_SERVICE_ROLE_KEY.')
    cfg['service_role_key'] = key
    return cfg


def rpc(cfg, name, payload):
    key = cfg['service_role_key']
    return http('POST', f"{cfg['supabase_url'].rstrip('/')}/rest/v1/rpc/{name}",
                {'apikey': key, 'Authorization': 'Bearer ' + key}, payload)


def br_date(iso: str) -> str:
    y, m, d = iso.split('-')
    return f'{d}/{m}/{y}'


def build_message(cfg, account, week_start, week_end) -> EmailMessage:
    smtp = cfg['smtp']
    sender = smtp.get('remetente') or smtp.get('usuario') or 'portal-secap@localhost'
    obras = account['obras']
    periodo = f'{br_date(week_start)} a {br_date(week_end)}'
    msg = EmailMessage()
    msg['Subject'] = f'SECAP · {len(obras)} obra(s) sem atualização na semana de {periodo}'
    msg['From'] = formataddr((smtp.get('nome_remetente') or 'Portal SECAP', sender))
    msg['To'] = formataddr((account['name'], account['email']))
    msg['Message-ID'] = make_msgid(domain='portal-secap')
    linhas = '\n'.join(
        f"  • {o.get('nome') or 'Obra sem nome'}" + (f" (ID {o['codigo']})" if o.get('codigo') else '')
        + (f" — {o['projectName']}" if o.get('projectName') else '') for o in obras)
    msg.set_content(
        f"Olá, {account['name']}.\n\n"
        f"As obras abaixo estão vinculadas a você e não tiveram nenhuma atualização no portal "
        f"na semana de {periodo}:\n\n{linhas}\n\n"
        f"Acesse o portal para revisar e atualizar: {cfg['portal_url']}\n\n"
        "Mensagem automática do Portal SECAP. Este envio fica registrado na auditoria.\n")
    itens = ''.join(
        f"<li><strong>{html.escape(o.get('nome') or 'Obra sem nome')}</strong>"
        + (f" <span style='color:#64748b'>ID {html.escape(str(o['codigo']))}</span>" if o.get('codigo') else '')
        + (f"<br><small style='color:#64748b'>{html.escape(o['projectName'])}</small>" if o.get('projectName') else '')
        + '</li>' for o in obras)
    msg.add_alternative(
        f"""<div style="font-family:Arial,sans-serif;color:#0f172a;max-width:640px">
<h2 style="color:#003249;margin:0 0 12px">Obras sem atualização na semana</h2>
<p>Olá, {html.escape(account['name'])}.</p>
<p>As obras abaixo estão vinculadas a você e <strong>não tiveram nenhuma atualização</strong> no portal
na semana de <strong>{periodo}</strong>:</p>
<ul style="line-height:1.6">{itens}</ul>
<p><a href="{html.escape(cfg['portal_url'])}" style="background:#003249;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Abrir o Portal SECAP</a></p>
<p style="color:#64748b;font-size:12px">Mensagem automática do Portal SECAP. Este envio fica registrado na auditoria.</p>
</div>""", subtype='html')
    return msg


def deliver(cfg, msg: EmailMessage) -> str:
    """Envia por SMTP ou grava .eml (modo teste). Retorna 'enviado' ou 'teste'."""
    smtp = cfg['smtp']
    if not smtp.get('host'):
        OUTBOX.mkdir(parents=True, exist_ok=True)
        safe = ''.join(c if c.isalnum() else '_' for c in str(msg['To']))[:60]
        (OUTBOX / f'{dt.datetime.now():%Y%m%d-%H%M%S}-{safe}.eml').write_bytes(bytes(msg))
        return 'teste'
    port = int(str(smtp.get('porta') or 587).strip())
    mode = str(smtp.get('seguranca') or 'starttls').strip().lower()
    # Porta 465 é sempre SSL direto (com starttls o servidor fecha a conexão sem resposta).
    if port == 465 or mode in ('ssl/tls', 'smtps'):
        mode = 'ssl'
    elif mode in ('tls', 'start_tls', 'start-tls', ''):
        mode = 'starttls'
    host = str(smtp['host']).strip()
    ctx = ssl.create_default_context()
    stage = 'conexão'
    try:
        if mode == 'ssl':
            server = smtplib.SMTP_SSL(host, port, context=ctx, timeout=30)
        else:
            server = smtplib.SMTP(host, port, timeout=30)
        with server:
            if mode == 'starttls':
                stage = 'starttls'
                server.starttls(context=ctx)
            if smtp.get('usuario'):
                stage = 'login'
                server.login(str(smtp['usuario']).strip(), smtp.get('senha', ''))
            stage = 'envio'
            server.send_message(msg)
    except Exception as exc:
        # Diz onde falhou (sem a senha) para facilitar o diagnóstico na Auditoria/log.
        raise RuntimeError(f'{exc} [etapa: {stage}; servidor {host}:{port}; modo {mode}]') from exc
    return 'enviado'


def preview(week: str | None = None) -> dict:
    cfg = load_config()
    return rpc(cfg, 'secap_weekly_notify_pending', {'p_week': week})


def run(week: str | None = None, origin: str = 'automático', resend: bool = False) -> dict:
    """Notifica as contas com obras sem edição na semana (padrão: semana anterior)."""
    with _lock:
        cfg = load_config()
        data = rpc(cfg, 'secap_weekly_notify_pending', {'p_week': week})
        week_start, week_end = data['weekStart'], data['weekEnd']
        summary = {'semana': f'{br_date(week_start)} a {br_date(week_end)}', 'weekStart': week_start,
                   'enviados': 0, 'teste': 0, 'erros': 0, 'ja_enviados': 0, 'contas': [],
                   'modo': 'envio por e-mail' if cfg['smtp'].get('host') else 'modo teste (arquivos .eml)'}
        for acc in data.get('accounts', []):
            if acc.get('lastStatus') in ('enviado', 'teste') and not resend:
                summary['ja_enviados'] += 1
                continue
            obras = acc['obras']
            try:
                status = deliver(cfg, build_message(cfg, acc, week_start, week_end))
                error = ''
            except Exception as exc:  # noqa: BLE001 - registra a falha e segue para a próxima conta
                status, error = 'erro', str(exc)[:500]
            rpc(cfg, 'secap_weekly_notify_record', {
                'p_week': week_start, 'p_user': acc['userId'], 'p_email': acc['email'], 'p_name': acc['name'],
                'p_obras': obras, 'p_status': status, 'p_error': error, 'p_origin': origin})
            summary['enviados' if status == 'enviado' else 'teste' if status == 'teste' else 'erros'] += 1
            summary['contas'].append({'nome': acc['name'], 'email': acc['email'], 'obras': len(obras),
                                      'status': status, 'erro': error})
        log(f"Semana {summary['semana']} ({origin}): enviados {summary['enviados']}, teste {summary['teste']}, "
            f"erros {summary['erros']}, já notificados {summary['ja_enviados']}")
        return summary


# ----------------------------------------------------------------------------- agendamento

def _due(cfg, now: dt.datetime, state: dict):
    """Semana a notificar, se já passou o horário agendado e ela ainda não foi processada."""
    h, m = (int(x) for x in str(cfg.get('hora') or '08:00').split(':'))
    monday = (now - dt.timedelta(days=now.weekday())).date()
    scheduled = dt.datetime.combine(monday + dt.timedelta(days=int(cfg.get('dia_semana') or 0)),
                                    dt.time(h, m), BRT)
    target = (monday - dt.timedelta(days=7)).isoformat()  # semana anterior
    if now >= scheduled and state.get('ultima_semana') != target:
        return target
    return None


def _loop():
    while True:
        try:
            cfg = load_config()
            if cfg.get('ativo', True):
                state = json.loads(STATE_FILE.read_text(encoding='utf-8')) if STATE_FILE.exists() else {}
                target = _due(cfg, dt.datetime.now(BRT), state)
                if target:
                    summary = run(target, 'automático')
                    STATE_FILE.write_text(json.dumps({'ultima_semana': target, 'resumo': summary},
                                                     ensure_ascii=False, indent=1), encoding='utf-8')
                    STATUS.update(ultima_execucao=dt.datetime.now(BRT).isoformat(timespec='seconds'),
                                  ultimo_erro=None, resumo=summary)
        except Exception as exc:  # noqa: BLE001 - nunca derruba o portal
            STATUS.update(ultima_execucao=dt.datetime.now(BRT).isoformat(timespec='seconds'), ultimo_erro=str(exc))
            log(f'Erro: {exc}')
        time.sleep(300)


def start_background() -> bool:
    """Inicia o agendamento se data/weekly-notify.json existir."""
    if not CONFIG_FILE.exists():
        return False
    STATUS['ativo'] = True
    threading.Thread(target=_loop, name='weekly-notify', daemon=True).start()
    log('Notificação semanal agendada.')
    return True


def verify_admin(token: str) -> str:
    """Confere se o token pertence a um administrador do portal. Retorna o id da conta."""
    cfg = load_config()
    base = cfg['supabase_url'].rstrip('/')
    key = cfg['service_role_key']
    if not token:
        raise PermissionError('Sessão ausente. Entre novamente.')
    try:
        user = http('GET', f'{base}/auth/v1/user', {'apikey': key, 'Authorization': 'Bearer ' + token})
    except SyncError:
        raise PermissionError('Sessão inválida ou expirada. Entre novamente.') from None
    uid = (user or {}).get('id')
    if not uid:
        raise PermissionError('Sessão inválida.')
    q = urllib.parse.urlencode({'id': f'eq.{uid}', 'select': 'role'})
    rows = http('GET', f'{base}/rest/v1/profiles?{q}', {'apikey': key, 'Authorization': 'Bearer ' + key}) or []
    if not rows or rows[0].get('role') != 'administrador':
        raise PermissionError('Somente administradores.')
    return uid


if __name__ == '__main__':
    try:
        if '--enviar' in sys.argv:
            i = sys.argv.index('--enviar')
            day = sys.argv[i + 1] if len(sys.argv) > i + 1 else None
            print(json.dumps(run(day, 'manual (linha de comando)'), ensure_ascii=False, indent=1))
        else:
            data = preview(sys.argv[2] if len(sys.argv) > 2 else None)
            print(f"Semana {br_date(data['weekStart'])} a {br_date(data['weekEnd'])}")
            for acc in data['accounts']:
                print(f"  {acc['name']} <{acc['email']}>: {acc['total']} obra(s) sem edição"
                      + (f" · já notificado ({acc['lastStatus']})" if acc.get('lastStatus') else ''))
            if not data['accounts']:
                print('  Nenhuma conta com obras sem edição.')
    except SyncError as err:
        print('Erro:', err)
        sys.exit(1)
