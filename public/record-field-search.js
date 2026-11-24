/* record-field-search.js — barra de pesquisa na janela "Editar dados" da obra.
   Filtra os campos pelo nome enquanto se digita (sem diferenciar acentos ou maiúsculas),
   esconde as seções sem resultado e mantém o termo ao navegar entre obras.
   Só mostra/esconde campos: nada é alterado nos dados. Os campos escondidos continuam
   no formulário e são salvos normalmente. */
(function () {
  'use strict';
  if (typeof openRecordForm !== 'function') return;
  var original = openRecordForm;
  var lastQuery = '';

  function norm(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Nome do campo: aria-label do próprio controle (não do botão "Renomear o campo…").
  function fieldName(box) {
    var control = box.querySelector('input[aria-label], select[aria-label], textarea[aria-label], [name][aria-label]');
    if (control) return control.getAttribute('aria-label');
    var label = box.querySelector('label');
    if (!label) return '';
    var copy = label.cloneNode(true);
    copy.querySelectorAll('button').forEach(function (b) {
      b.remove();
    });
    return copy.textContent;
  }

  function applyFilter(query) {
    var form = document.getElementById('recordForm');
    if (!form) return;
    lastQuery = query;
    var terms = norm(query).split(' ').filter(Boolean);
    var shown = 0;
    var total = 0;
    // Todos os campos do formulário, inclusive os acrescentados fora das seções.
    form.querySelectorAll('.field').forEach(function (box) {
      if (box.parentElement && box.parentElement.closest('.field')) return; // campo dentro de campo
      total++;
      var name = norm(fieldName(box));
      var match = terms.every(function (t) {
        return name.indexOf(t) !== -1;
      });
      box.hidden = !match;
      if (match) shown++;
    });
    form.querySelectorAll('.edit-section-group').forEach(function (section) {
      section.hidden = !section.querySelector('.field:not([hidden])');
    });
    var status = document.getElementById('recordFieldSearchStatus');
    if (status) {
      status.textContent = terms.length
        ? shown
          ? shown + ' de ' + total + ' campo(s) encontrado(s)'
          : 'Nenhum campo com esse nome.'
        : total + ' campos';
    }
    var clear = document.getElementById('recordFieldSearchClear');
    if (clear) clear.hidden = !terms.length;
  }

  function addSearch() {
    var form = document.getElementById('recordForm');
    if (!form || document.getElementById('recordFieldSearch')) return;
    if (!form.querySelector('.edit-section-group .field')) return;
    var bar = document.createElement('div');
    bar.className = 'record-field-search';
    bar.innerHTML =
      '<label for="recordFieldSearch" class="sr-only">Buscar campo</label>' +
      '<span class="record-field-search-icon" aria-hidden="true"></span>' +
      '<input id="recordFieldSearch" type="search" placeholder="Buscar campo pelo nome… (ex.: prazo, valor, responsável)" autocomplete="off" maxlength="80">' +
      '<button type="button" id="recordFieldSearchClear" class="record-field-search-clear" aria-label="Limpar busca" hidden>×</button>' +
      '<small id="recordFieldSearchStatus" class="record-field-search-status" aria-live="polite"></small>';
    form.parentNode.insertBefore(bar, form);
    var input = bar.querySelector('input');
    input.value = lastQuery;
    input.addEventListener('input', function () {
      applyFilter(input.value);
    });
    input.addEventListener('keydown', function (ev) {
      // Enter não envia o formulário; Esc limpa a busca antes de fechar a janela.
      if (ev.key === 'Enter') ev.preventDefault();
      if (ev.key === 'Escape' && input.value) {
        ev.preventDefault();
        ev.stopPropagation();
        input.value = '';
        applyFilter('');
      }
    });
    bar.querySelector('#recordFieldSearchClear').addEventListener('click', function () {
      input.value = '';
      applyFilter('');
      input.focus();
    });
    applyFilter(lastQuery);
  }

  openRecordForm = function () {
    var result = original.apply(this, arguments);
    try {
      addSearch();
    } catch (e) {
      console.error('Busca de campos:', e);
    }
    return result;
  };
})();
