/* saving-indicator.js — selo "Salvando…" com bolinha girando.
   Aparece no canto da tela enquanto qualquer obra está sendo gravada no banco
   (SECAP_OBRAS_BACKEND.saveObra / batchSave / deleteObra) e mostra "Salvo" ao terminar.
   Salvamentos rápidos (< 200 ms) não piscam o selo. */
(function () {
  'use strict';
  var backend = window.SECAP_OBRAS_BACKEND;
  if (!backend || backend.__savingIndicator) return;
  backend.__savingIndicator = true;

  var pending = 0;
  var failed = false;
  var el = null;
  var showTimer = null;
  var hideTimer = null;
  var shownAt = 0;

  function build() {
    if (el) return el;
    el = document.createElement('div');
    el.className = 'save-indicator';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.hidden = true;
    el.innerHTML = '<span class="save-indicator-dot" aria-hidden="true"></span><span class="save-indicator-text"></span>';
    document.body.appendChild(el);
    return el;
  }

  function setState(state, text) {
    build();
    el.dataset.state = state;
    el.querySelector('.save-indicator-text').textContent = text;
  }

  function show() {
    clearTimeout(hideTimer);
    setState('saving', pending > 1 ? 'Salvando ' + pending + ' obras…' : 'Salvando…');
    el.hidden = false;
    el.classList.remove('is-leaving');
    shownAt = Date.now();
  }

  function finish() {
    clearTimeout(showTimer);
    showTimer = null;
    if (!el || el.hidden) return;
    // Fica visível pelo menos 600 ms para a animação não "piscar".
    var wait = Math.max(0, 600 - (Date.now() - shownAt));
    hideTimer = setTimeout(function () {
      if (failed) {
        el.hidden = true;
        return;
      }
      setState('done', 'Salvo');
      hideTimer = setTimeout(function () {
        el.classList.add('is-leaving');
        hideTimer = setTimeout(function () {
          el.hidden = true;
          el.classList.remove('is-leaving');
        }, 300);
      }, 1200);
    }, wait);
  }

  function start() {
    if (pending === 0) failed = false;
    pending++;
    if (el && !el.hidden) show();
    else if (!showTimer) showTimer = setTimeout(show, 200);
  }

  function end(ok) {
    if (!ok) failed = true;
    pending = Math.max(0, pending - 1);
    if (pending === 0) finish();
    else if (el && !el.hidden) show();
  }

  ['saveObra', 'batchSave', 'deleteObra'].forEach(function (name) {
    var original = backend[name];
    if (typeof original !== 'function') return;
    backend[name] = function () {
      start();
      var result;
      try {
        result = original.apply(this, arguments);
      } catch (error) {
        end(false);
        throw error;
      }
      return Promise.resolve(result).then(
        function (value) {
          end(!!(value && value.ok !== false));
          return value;
        },
        function (error) {
          end(false);
          throw error;
        }
      );
    };
  });
})();
