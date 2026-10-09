/* global document, window, localStorage, location */
// Wireframe behaviour shared by the generic wireframe and every variant. It only reads data attributes:
// data-roles (who sees an element), data-state-set (business state buttons) and data-action (action buttons).
(function () {
  var KEY = 'alterspec-wireframe-role';
  var select = document.getElementById('as-role');
  var main = document.querySelector('main');

  function storedRole() {
    var m = /(?:^|[#&])role=([^&]*)/.exec(location.hash);
    if (m) return decodeURIComponent(m[1]);
    try {
      return localStorage.getItem(KEY) || '';
    } catch {
      return '';
    }
  }

  function setState(state) {
    if (!main) return;
    main.setAttribute('data-state', state);
    document.querySelectorAll('[data-state-set]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-state-set') === state));
    });
  }

  function applyRole(role) {
    try {
      localStorage.setItem(KEY, role);
    } catch {
      /* storage unavailable: the role still applies to this page */
    }
    if (select) select.value = role;
    document.querySelectorAll('[data-roles]').forEach(function (el) {
      var roles = el.getAttribute('data-roles').split(' ').filter(Boolean);
      var allowed = !role || roles.indexOf(role) >= 0;
      if (el === document.body) {
        if (main) setState(allowed ? 'normal' : 'no-permission');
      } else {
        el.hidden = !allowed;
      }
    });
  }

  if (select) {
    select.addEventListener('change', function () {
      applyRole(select.value);
    });
  }

  document.querySelectorAll('[data-state-set]').forEach(function (b) {
    b.addEventListener('click', function () {
      setState(b.getAttribute('data-state-set'));
    });
  });

  var dialog = document.getElementById('as-dialog');
  document.querySelectorAll('[data-action]').forEach(function (b) {
    b.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (!dialog) return;
      dialog.querySelector('[data-slot=title]').textContent = b.getAttribute('data-action-label');
      dialog.querySelector('[data-slot=capability]').textContent = b.getAttribute('data-action-capability');
      dialog.querySelector('[data-slot=summary]').textContent = b.getAttribute('data-action-summary') || '';
      if (dialog.showModal) dialog.showModal();
      else dialog.setAttribute('open', '');
    });
  });

  document.querySelectorAll('form.as-form').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
    });
  });

  window.addEventListener('hashchange', function () {
    applyRole(storedRole());
  });
  applyRole(storedRole());
})();
