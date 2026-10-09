/* global window, document, location, localStorage, URLSearchParams */
// Mockup app runtime: sign-in as a demo user, the application shell, pages bound to the demo data store, actions that
// change data, and the business states (?state=…). Pages stay plain HTML; this reads their data attributes.
(function () {
  var UX = (window.UX = window.UX || {});
  var app = window.UX_APP || {};
  if (app.locale) document.documentElement.lang = app.locale;
  var spec = window.UX_SPEC || { modules: [], screens: {}, entities: {}, roles: {} };
  var body = document.body;
  var SESSION = (app.storeKey || 'ux') + '-session';
  var users = app.users || [];
  var params = UX.params || new URLSearchParams(location.search);
  var esc = UX.esc;

  // ---------- session ----------
  function storedUser() {
    try {
      var id = localStorage.getItem(SESSION);
      return users.find(function (u) {
        return u.id === id;
      });
    } catch {
      return undefined;
    }
  }
  var as = params.get('as');
  var user = as
    ? users.find(function (u) {
        return u.role === as || u.id === as;
      })
    : storedUser();
  UX.session = { user: user };

  function signIn(u) {
    try {
      localStorage.setItem(SESSION, u.id);
    } catch {
      /* session lasts for this page only */
    }
    var first = topScreens(u)[0];
    UX.session.user = u;
    location.href = first ? first.id + '.html' : 'index.html';
  }
  function signOut() {
    try {
      localStorage.removeItem(SESSION);
    } catch {
      /* nothing stored */
    }
    location.href = 'index.html';
  }

  var roleTitle = function (role) {
    return (spec.roles || {})[role] || role;
  };
  var initials = function (name) {
    return name
      .split(/\s+/)
      .map(function (w) {
        return w[0];
      })
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  var hue = function (s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  };
  function avatar(u, cls) {
    return (
      '<span class="ux-avatar ' + (cls || '') + '" style="--ux-avatar-hue:' + hue(u.name) + '">' +
      (u.photo ? '<img src="' + esc(u.photo) + '" alt="">' : esc(initials(u.name))) +
      '</span>'
    );
  }

  // ---------- navigation ----------
  function canOpen(u, screenId) {
    var s = spec.screens[screenId];
    return Boolean(s && u && s.roles.indexOf(u.role) >= 0);
  }
  function topScreens(u) {
    // Menu entries: every screen this person may open, except those opened for one record picked in a list.
    var order = app.nav && app.nav.length ? app.nav : Object.keys(spec.screens).filter(function (id) {
      var s = spec.screens[id];
      return !s.record || !(s.parents || []).some(function (p) {
        return canOpen(u, p);
      });
    });
    return order
      .filter(function (id) {
        return spec.screens[id] && canOpen(u, id);
      })
      .map(function (id) {
        return Object.assign({ id: id }, spec.screens[id]);
      });
  }
  var icons = app.icons || {};
  /** Is the screen itself a menu entry for this person? */
  function navScreen(id) {
    return topScreens(user).some(function (s) {
      return s.id === id;
    });
  }
  /** The parent screen this page was opened from (for highlighting the menu). */
  function cameFrom(id) {
    var parents = (spec.screens[id] && spec.screens[id].parents) || [];
    var ref = (document.referrer.match(/([A-Z]+-[A-Z0-9]+-\d+)\.html/) || [])[1];
    return parents.indexOf(ref) >= 0 ? ref : undefined;
  }
  function iconFor(screen) {
    return (icons.screens || {})[screen.id] || (icons.modules || {})[screen.module] || 'circle-check';
  }

  function brand() {
    return (
      '<a class="ux-brand" href="index.html">' +
      (app.logo ? '<img class="ux-logo" src="' + esc(app.logo) + '" alt="">' : '<span class="ux-logo-mark">' + esc(initials(app.name || 'App')) + '</span>') +
      '<span>' + esc(app.name || spec.app || 'Application') + '</span></a>'
    );
  }

  function shell(current) {
    var main = document.querySelector('main');
    if (!main) return;
    var groups = (spec.modules || [])
      .map(function (m) {
        var items = topScreens(user).filter(function (s) {
          return s.module === m.id;
        });
        if (!items.length) return '';
        return (
          '<div class="ux-nav-group"><div class="ux-nav-heading">' + esc(m.title) + '</div>' +
          items
            .map(function (s) {
              var active = s.id === current || (!navScreen(current) && s.id === cameFrom(current));
              return (
                '<a class="ux-nav-link" href="' + s.id + '.html"' + (active ? ' aria-current="page"' : '') + '>' +
                UX.icon(iconFor(s)) + '<span>' + esc(s.title) + '</span></a>'
              );
            })
            .join('') +
          '</div>'
        );
      })
      .join('');
    var app_ = document.createElement('div');
    app_.className = 'ux-app';
    app_.innerHTML =
      '<header class="ux-header">' +
      '<button class="ux-icon-button ux-nav-toggle" type="button" aria-label="Menu">' + UX.icon('menu') + '</button>' +
      brand() +
      '<div class="ux-header-spacer"></div>' +
      (user
        ? '<div class="ux-user"><button class="ux-user-button" type="button" aria-haspopup="menu">' + avatar(user) +
          '<span class="ux-user-text"><strong>' + esc(user.name) + '</strong><small>' + esc(roleTitle(user.role)) +
          '</small></span>' + UX.icon('chevron-down') + '</button>' +
          '<div class="ux-menu" role="menu" hidden><div class="ux-menu-head">' + avatar(user, 'ux-avatar-lg') +
          '<div><strong>' + esc(user.name) + '</strong><small>' + esc(user.persona || roleTitle(user.role)) + '</small></div></div>' +
          '<button class="ux-menu-item" type="button" data-sign-out>' + UX.icon('log-out') + 'Sign out</button></div></div>'
        : '') +
      '</header><div class="ux-body"><nav class="ux-nav" aria-label="Main">' + groups + '</nav><div class="ux-main"></div></div>';
    main.parentNode.insertBefore(app_, main);
    app_.querySelector('.ux-main').appendChild(main);
    var menu = app_.querySelector('.ux-menu');
    var button = app_.querySelector('.ux-user-button');
    if (button)
      button.addEventListener('click', function (e) {
        e.stopPropagation();
        menu.hidden = !menu.hidden;
      });
    document.addEventListener('click', function () {
      if (menu) menu.hidden = true;
    });
    var out = app_.querySelector('[data-sign-out]');
    if (out) out.addEventListener('click', signOut);
    app_.querySelector('.ux-nav-toggle').addEventListener('click', function () {
      app_.classList.toggle('ux-nav-open');
    });
  }

  // ---------- login page ----------
  var isGuest = function (u) {
    return /guest|visitor|anonymous|public/i.test(roleTitle(u.role));
  };
  function login() {
    var root = document.querySelector('main[data-login]');
    if (!root) return;
    root.innerHTML =
      '<div class="ux-login-card">' + brand() +
      '<h1 class="ux-login-title">Sign in</h1><p class="ux-login-sub">Choose an account to continue.</p>' +
      '<div class="ux-accounts">' +
      users
        .map(function (u, i) {
          if (isGuest(u)) return '';
          return (
            '<button class="ux-account" type="button" data-user="' + i + '">' + avatar(u, 'ux-avatar-lg') +
            '<span><strong>' + esc(u.name) + '</strong><small>' + esc(u.persona || '') +
            (u.persona ? ' · ' : '') + esc(roleTitle(u.role)) + '</small></span>' + UX.icon('chevron-right') + '</button>'
          );
        })
        .join('') +
      '</div>' +
      users
        .map(function (u, i) {
          return isGuest(u)
            ? '<button class="ux-button ux-guest" type="button" data-user="' + i + '">Continue as guest</button>'
            : '';
        })
        .join('') +
      '<button class="ux-link-button" type="button" data-reset>Reset demo data</button></div>';
    root.querySelectorAll('[data-user]').forEach(function (b) {
      b.addEventListener('click', function () {
        signIn(users[Number(b.getAttribute('data-user'))]);
      });
    });
    root.querySelector('[data-reset]').addEventListener('click', function () {
      UX.store.reset();
      UX.toast('Demo data reset');
    });
  }

  // ---------- page binding ----------
  var primaryId = params.get('id');
  var primary = primaryId ? UX.store.find(primaryId) : undefined;

  function scopeFilter(section, records) {
    var scopes = JSON.parse(section.getAttribute('data-scope') || '{}');
    if (user && scopes[user.role] === 'own')
      return records.filter(function (r) {
        return r.owner === user.id;
      });
    return records;
  }
  /** Records of an entity related to the page's record: referencing it, or referenced by it. */
  function related(entity) {
    if (!primary) return undefined;
    var attrs = (spec.entities[entity] || {}).attributes || {};
    var refs = Object.keys(attrs).filter(function (n) {
      return attrs[n].references === primary.entity;
    });
    if (refs.length)
      return UX.store.all(entity).filter(function (r) {
        return refs.some(function (n) {
          return r.values[n] === primary.id;
        });
      });
    // Siblings: records that refer to the same thing the page's record refers to (prices of the same article).
    var pattrs = (spec.entities[primary.entity] || {}).attributes || {};
    var shared = Object.keys(attrs).filter(function (n) {
      var target = attrs[n].references;
      return target && Object.keys(pattrs).some(function (p) {
        return pattrs[p].references === target && primary.values[p];
      });
    });
    if (shared.length)
      return UX.store.all(entity).filter(function (r) {
        return shared.every(function (n) {
          var target = attrs[n].references;
          return Object.keys(pattrs).some(function (p) {
            return pattrs[p].references === target && primary.values[p] === r.values[n];
          });
        });
      });
    return undefined;
  }
  function recordFor(section, entity) {
    if (primary && primary.entity === entity) return primary;
    if (primary) {
      var pattrs = (spec.entities[primary.entity] || {}).attributes || {};
      var ref = Object.keys(pattrs).find(function (n) {
        return pattrs[n].references === entity && primary.values[n];
      });
      if (ref) return UX.store.get(entity, primary.values[ref]);
    }
    if (section.querySelector('form') && !primaryId) return undefined; // a new record
    return scopeFilter(section, UX.store.all(entity))[0];
  }

  var emptyLists = 0;
  var lists = 0;
  function bindLists() {
    document.querySelectorAll('[data-list]').forEach(function (section) {
      lists++;
      var entity = section.getAttribute('data-entity');
      var records = scopeFilter(section, related(entity) || UX.store.all(entity));
      var tbody = section.querySelector('[data-rows]');
      var tpl = section.querySelector('template[data-row]');
      if (!tbody || !tpl) return;
      tbody.innerHTML = '';
      records.forEach(function (r) {
        var row = tpl.content.firstElementChild.cloneNode(true);
        UX.fill(row, r);
        var href = row.getAttribute('data-href');
        if (href && !canOpen(user, href.replace(/\.html$/, ''))) href = null;
        if (href) {
          row.classList.add('ux-row-link');
          row.tabIndex = 0;
          var go = function () {
            location.href = href + '?id=' + encodeURIComponent(r.id);
          };
          row.addEventListener('click', go);
          row.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') go();
          });
        }
        tbody.appendChild(row);
      });
      var count = section.querySelector('[data-count]');
      if (count) count.textContent = String(records.length);
      if (!records.length) emptyLists++;
    });
  }

  function bindRecords() {
    document.querySelectorAll('[data-record]').forEach(function (section) {
      var entity = section.getAttribute('data-entity');
      UX.options(section);
      var r = recordFor(section, entity);
      if (r) {
        section.setAttribute('data-record-id', r.id);
        UX.fill(section, r);
      }
    });
    if (primary) {
      document.querySelectorAll('[data-crumb-record]').forEach(function (el) {
        if (el.tagName === 'SPAN') el.textContent = UX.store.label(primary.id);
        el.hidden = false;
      });
    }
  }

  function recordIn(entity) {
    var s = document.querySelector('[data-record][data-entity="' + entity + '"]');
    var id = s && s.getAttribute('data-record-id');
    return id ? UX.store.get(entity, id) : primary && primary.entity === entity ? primary : undefined;
  }

  function validate(form) {
    var missing = [];
    form.querySelectorAll('[required]').forEach(function (el) {
      var empty =
        el.type === 'checkbox'
          ? false
          : el.type === 'file'
            ? !(el.files && el.files.length) && JSON.parse(el.getAttribute('data-current') || '[]').length === 0
            : !String(el.value).trim();
      el.closest('.ux-field').classList.toggle('ux-field-invalid', empty);
      if (empty) missing.push(el);
    });
    if (missing.length) {
      setState('validation');
      missing[0].focus();
    }
    return !missing.length;
  }

  function bindActions() {
    document.querySelectorAll('[data-effect]').forEach(function (b) {
      var fx = JSON.parse(b.getAttribute('data-effect'));
      var record = recordIn(fx.entity);
      var applicable =
        fx.op === 'create' ? !record : fx.op === 'transition' ? record && (!fx.from || record.state === fx.from) : Boolean(record);
      // Capabilities scoped to `own`: only on the signed-in person's own records.
      if (applicable && record && fx.scopes && user && fx.scopes[user.role] === 'own' && record.owner && record.owner !== user.id)
        applicable = false;
      if (!applicable) b.hidden = true;
      b.addEventListener('click', function (e) {
        e.preventDefault();
        var section = document.querySelector('[data-record][data-entity="' + fx.entity + '"]');
        var form = section && section.querySelector('form');
        if (form && (fx.op === 'create' || fx.op === 'update') && !validate(form)) return;
        var go = function () {
          var values = form ? UX.read(form) : undefined;
          var target = recordIn(fx.entity);
          var next;
          if (fx.op === 'create') next = UX.store.add(fx.entity, values || {});
          else if (fx.op === 'update') next = UX.store.update(fx.entity, target.id, { values: values });
          else if (fx.op === 'transition') next = UX.store.update(fx.entity, target.id, { state: fx.to, values: values });
          else if (fx.op === 'archive' && fx.to) next = UX.store.update(fx.entity, target.id, { state: fx.to });
          else UX.store.remove(fx.entity, target.id);
          UX.toast(fx.toast);
          window.setTimeout(function () {
            if (!next) location.href = (fx.back || 'index') + '.html';
            else location.href = (fx.show || spec.screens[body.getAttribute('data-screen')] && body.getAttribute('data-screen')) + '.html?id=' + encodeURIComponent(next.id);
          }, 700);
        };
        if (fx.confirm)
          UX.confirm({ title: fx.confirm, confirm: b.textContent.trim(), danger: fx.op === 'delete' || fx.op === 'archive' }).then(function (ok) {
            if (ok) go();
          });
        else go();
      });
    });
  }

  // ---------- states and roles ----------
  function setState(state) {
    body.setAttribute('data-state', state);
    document.querySelectorAll('[data-show-in]').forEach(function (el) {
      el.classList.toggle('ux-shown', el.getAttribute('data-show-in').split(' ').indexOf(state) >= 0);
    });
  }

  function gate() {
    document.querySelectorAll('[data-roles]').forEach(function (el) {
      if (el === body) return;
      var roles = el.getAttribute('data-roles').split(' ');
      if (!user || roles.indexOf(user.role) >= 0) return;
      if (el.getAttribute('data-unavailable') === 'disabled') {
        el.setAttribute('disabled', '');
        if (el.getAttribute('data-reason')) el.title = el.getAttribute('data-reason');
      } else el.hidden = true;
    });
  }

  // ---------- boot ----------
  if (body.hasAttribute('data-login')) {
    login();
  } else {
    var screen = body.getAttribute('data-screen');
    if (!user) {
      location.replace('index.html');
      return;
    }
    shell(screen);
    bindLists();
    bindRecords();
    bindActions();
    gate();
    var state = params.get('state') || 'default';
    if (screen && spec.screens[screen] && spec.screens[screen].roles.indexOf(user.role) < 0) state = 'no-permission';
    else if (state === 'default' && lists && emptyLists === lists && !document.querySelector('[data-record]'))
      state = 'empty';
    setState(state);
  }
  UX.icons(document);
})();
