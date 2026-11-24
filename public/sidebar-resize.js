/* sidebar-resize.js — largura do menu lateral ajustável com o mouse.
   Arraste a alça na borda direita do menu para diminuir ou aumentar.
   Duplo clique volta ao tamanho padrão. Setas do teclado também ajustam (alça com foco).
   A largura fica guardada só neste navegador (localStorage). */
(function () {
  'use strict';
  var KEY = 'secap-sidebar-width';
  var MIN = 220;
  var MAX = 480;
  var root = document.documentElement;

  function clamp(px) {
    var max = Math.min(MAX, Math.round(window.innerWidth * 0.5));
    return Math.max(MIN, Math.min(max, Math.round(px)));
  }
  function current() {
    var el = document.querySelector('.sidebar');
    return el ? el.getBoundingClientRect().width : parseFloat(getComputedStyle(root).getPropertyValue('--sb-w')) || 344;
  }
  function save(px) {
    try {
      if (px == null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, String(px));
    } catch (e) {}
  }
  function apply(px) {
    if (px == null) root.style.removeProperty('--sb-w');
    else root.style.setProperty('--sb-w', px + 'px');
    if (handle) handle.setAttribute('aria-valuenow', String(Math.round(current())));
  }

  var handle = document.createElement('div');
  handle.className = 'sidebar-resizer';
  handle.setAttribute('role', 'separator');
  handle.setAttribute('aria-orientation', 'vertical');
  handle.setAttribute('aria-label', 'Ajustar largura do menu lateral');
  handle.setAttribute('aria-valuemin', String(MIN));
  handle.setAttribute('aria-valuemax', String(MAX));
  handle.title = 'Arraste para ajustar a largura do menu · duplo clique volta ao padrão';
  handle.tabIndex = 0;
  document.body.appendChild(handle);

  try {
    var saved = Number(localStorage.getItem(KEY));
    if (saved) apply(clamp(saved));
  } catch (e) {}

  var startX = 0;
  var startW = 0;
  handle.addEventListener('pointerdown', function (ev) {
    if (ev.button !== 0) return;
    ev.preventDefault();
    startX = ev.clientX;
    startW = current();
    handle.setPointerCapture(ev.pointerId);
    document.body.classList.add('sidebar-resizing');
  });
  handle.addEventListener('pointermove', function (ev) {
    if (!handle.hasPointerCapture(ev.pointerId)) return;
    apply(clamp(startW + ev.clientX - startX));
  });
  function finish(ev) {
    if (!handle.hasPointerCapture(ev.pointerId)) return;
    handle.releasePointerCapture(ev.pointerId);
    document.body.classList.remove('sidebar-resizing');
    save(clamp(current()));
    window.dispatchEvent(new Event('resize')); // gráficos se ajustam à nova largura
  }
  handle.addEventListener('pointerup', finish);
  handle.addEventListener('pointercancel', finish);

  handle.addEventListener('dblclick', function () {
    apply(null);
    save(null);
    window.dispatchEvent(new Event('resize'));
  });
  handle.addEventListener('keydown', function (ev) {
    var step = ev.shiftKey ? 40 : 16;
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    ev.preventDefault();
    var px = clamp(current() + (ev.key === 'ArrowRight' ? step : -step));
    apply(px);
    save(px);
    window.dispatchEvent(new Event('resize'));
  });
  // Mantém a largura salva dentro do limite quando a janela muda de tamanho.
  window.addEventListener('resize', function () {
    if (root.style.getPropertyValue('--sb-w')) apply(clamp(current()));
  });
  apply(root.style.getPropertyValue('--sb-w') ? clamp(current()) : null);
})();
