/* loading-screen.js — tela de carregamento ao entrar no portal.
   Aparece ao clicar em "Entrar" (ou "Continuar com Google") e continua visível
   durante o recarregamento da página até o sistema terminar de carregar.
   Uma marca em sessionStorage liga as duas páginas (antes e depois do reload). */
(function () {
  'use strict';
  var FLAG = 'secap-login-loading';
  var el = null;
  var progress = 8;

  function flag(value) {
    try {
      if (value) sessionStorage.setItem(FLAG, '1');
      else sessionStorage.removeItem(FLAG);
    } catch (e) {}
  }
  function hasFlag() {
    try {
      return sessionStorage.getItem(FLAG) === '1';
    } catch (e) {
      return false;
    }
  }

  function build() {
    if (el) return el;
    el = document.createElement('div');
    el.className = 'secap-loading';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML =
      '<span class="sl-arc a1" aria-hidden="true"></span>' +
      '<span class="sl-arc a2" aria-hidden="true"></span>' +
      '<div class="sl-card">' +
      '<img class="sl-logo" src="marca-goiania-negativa.svg" alt="Prefeitura de Goiânia">' +
      '<div class="sl-ring" aria-hidden="true"><span></span></div>' +
      '<div><p class="sl-eyebrow">Portal de projetos</p><h1 class="sl-title">Preparando o Conecta SECAP</h1></div>' +
      '<p class="sl-step">Verificando suas credenciais…</p>' +
      '<div class="sl-bar" aria-hidden="true"><i></i></div>' +
      '<p class="sl-foot">Projetos que avançam. Uma cidade que transforma.</p>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }

  function setProgress(value) {
    progress = Math.max(progress, Math.min(100, value));
    if (el) el.querySelector('.sl-bar i').style.width = progress + '%';
  }

  var api = {
    // Mostra a tela; "persist" mantém a tela no recarregamento após o login.
    show: function (message, persist) {
      build();
      el.hidden = false;
      el.classList.remove('is-leaving');
      if (message) api.step(message);
      if (persist) flag(true);
      document.documentElement.style.overflow = 'hidden';
    },
    step: function (message, value) {
      if (!el) return;
      el.querySelector('.sl-step').textContent = message;
      if (typeof value === 'number') setProgress(value);
    },
    active: function () {
      return !!el && !el.hidden;
    },
    // Some com uma transição suave; usado quando o sistema termina de carregar.
    finish: function () {
      flag(false);
      if (!el || el.hidden) return;
      api.step('Tudo pronto!', 100);
      setTimeout(function () {
        el.classList.add('is-leaving');
        document.documentElement.style.overflow = '';
        setTimeout(function () {
          el.hidden = true;
        }, 480);
      }, 250);
    },
    // Esconde na hora (ex.: senha incorreta), sem marcar como concluído.
    hide: function () {
      flag(false);
      if (!el) return;
      el.hidden = true;
      el.classList.remove('is-leaving');
      document.documentElement.style.overflow = '';
      progress = 8;
      setProgress(8);
    },
  };
  window.SECAPLoading = api;

  // Há sessão salva do Supabase neste navegador? (chave "sb-<projeto>-auth-token")
  // Indica que o usuário já está logado, por exemplo ao apertar F5.
  function hasSavedSession() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        if (/^sb-.+-auth-token$/.test(localStorage.key(i) || '')) return true;
      }
    } catch (e) {}
    return false;
  }

  // Logo após o login ou ao recarregar a página (F5) com a sessão ativa, a tela
  // aparece antes de o sistema iniciar. Se a sessão não for mais válida, o boot
  // esconde a tela ao terminar e a página de login aparece normalmente.
  if (hasFlag()) {
    api.show('Abrindo sua sessão…');
    setProgress(15);
  } else if (hasSavedSession()) {
    api.show('Carregando o sistema…');
    setProgress(15);
  } else {
    // Visitante sem sessão: a tela cobre o carregamento até a página de login aparecer.
    api.show('Carregando o portal…');
    setProgress(15);
  }
})();
