/* global document, window, location, URLSearchParams */
// Mockup runtime: app shell, demo user (?as=ROLE-…), state (?state=…), role gating and action feedback.
// Reads window.UX_NAV (nav.js) and the page's data attributes; pages stay plain HTML.
(function () {
  var nav = window.UX_NAV || { app: 'Application', modules: [], roles: [] };
  var params = new URLSearchParams(location.search);
  var body = document.body;
  var screenRoles = (body.getAttribute('data-roles') || '').split(' ').filter(Boolean);
  var as = params.get('as') || screenRoles[0] || '';
  var state = params.get('state') || 'default';
  var current = body.getAttribute('data-screen');
  // A role that may not use the screen sees the no-permission state.
  if (current && as && screenRoles.indexOf(as) < 0) state = 'no-permission';

  function link(extra) {
    var p = new URLSearchParams();
    if (as) p.set('as', as);
    Object.keys(extra || {}).forEach(function (k) {
      if (extra[k]) p.set(k, extra[k]);
    });
    var q = p.toString();
    return q ? '?' + q : '';
  }

  // Shell: navigation and top bar around <main>.
  var main = document.querySelector('main');
  if (main && !document.querySelector('.ux-app')) {
    var app = document.createElement('div');
    app.className = 'ux-app';
    var side = document.createElement('nav');
    side.className = 'ux-nav';
    var html = '<a class="ux-brand" href="index.html' + link() + '">' + nav.app + '</a>';
    nav.modules.forEach(function (m) {
      html += '<div class="ux-nav-group">' + m.title + '</div>';
      m.screens.forEach(function (s) {
        html +=
          '<a class="ux-nav-link" href="' + s.id + '.html' + link() + '"' +
          (s.id === current ? ' aria-current="page"' : '') + '>' + s.title + '</a>';
      });
    });
    side.innerHTML = html;
    if (!current) {
      // The launcher: a card per designed screen.
      var grid = '<div class="ux-gallery">';
      nav.modules.forEach(function (m) {
        m.screens.forEach(function (s) {
          grid +=
            '<a class="ux-card ux-gallery-item" href="' + s.id + '.html' + link() + '"><span class="ux-breadcrumb">' +
            m.title + '</span><strong>' + s.title + '</strong><span class="ux-breadcrumb">' + s.id + '</span></a>';
        });
      });
      main.insertAdjacentHTML('beforeend', grid + '</div>');
    }
    var right = document.createElement('div');
    right.className = 'ux-main';
    var top = document.createElement('div');
    top.className = 'ux-topbar';
    var states = (body.getAttribute('data-states') || '').split(' ').filter(Boolean);
    top.innerHTML =
      (states.length
        ? '<span class="ux-review">' +
          states
            .map(function (s) {
              return '<a href="' + link({ state: s === 'default' ? '' : s }) + '"' +
                (s === state ? ' aria-current="true"' : '') + '>' + s + '</a>';
            })
            .join('') +
          '</span>'
        : '') +
      '<label>Signed in as <select id="ux-as">' +
      nav.roles
        .map(function (r) {
          return '<option value="' + r.id + '"' + (r.id === as ? ' selected' : '') + '>' + r.title + '</option>';
        })
        .join('') +
      '</select></label>';
    main.parentNode.insertBefore(app, main);
    right.appendChild(top);
    right.appendChild(main);
    app.appendChild(side);
    app.appendChild(right);
    document.getElementById('ux-as').addEventListener('change', function (e) {
      params.set('as', e.target.value);
      location.search = params.toString();
    });
  }

  body.setAttribute('data-state', state);
  document.querySelectorAll('[data-show-in]').forEach(function (el) {
    var on = el.getAttribute('data-show-in').split(' ').indexOf(state) >= 0;
    el.classList.toggle('ux-shown', on);
  });

  // Roles: hide or disable what the demo user may not use.
  document.querySelectorAll('[data-roles]').forEach(function (el) {
    if (el === body) return;
    var roles = el.getAttribute('data-roles').split(' ');
    if (!as || roles.indexOf(as) >= 0) return;
    if (el.getAttribute('data-unavailable') === 'disabled') {
      el.setAttribute('disabled', '');
      if (el.getAttribute('data-reason')) el.title = el.getAttribute('data-reason');
    } else el.hidden = true;
  });

  // Actions: say what would happen.
  document.querySelectorAll('[data-action]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      var t = document.createElement('div');
      t.className = 'ux-toast';
      t.textContent = b.getAttribute('data-action');
      body.appendChild(t);
      window.setTimeout(function () {
        t.remove();
      }, 2500);
    });
  });
  document.querySelectorAll('form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
    });
  });
})();
