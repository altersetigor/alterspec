/* global window, document, URLSearchParams */
// UI helpers for mockup pages: formatting values, filling elements from records, toasts and confirmations.
(function () {
  var UX = (window.UX = window.UX || {});
  var app = window.UX_APP || {};
  var spec = window.UX_SPEC || { entities: {} };

  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };
  UX.esc = esc;

  UX.attr = function (entity, name) {
    var e = spec.entities[entity] || {};
    return (e.attributes || {})[name] || {};
  };

  /** A value as people read it. */
  UX.format = function (entity, name, value) {
    var a = UX.attr(entity, name);
    if (value == null || value === '') return '—';
    if (a.kind === 'reference') return UX.store.label(value);
    if (a.kind === 'amount') {
      var n = Number(value);
      if (isNaN(n)) return value;
      var cur = app.currency || '$';
      // A three-letter code (EUR, USD) formats as that currency; anything else is a symbol to put in front.
      if (/^[A-Za-z]{3}$/.test(cur)) {
        try { return n.toLocaleString(app.locale || 'en', { style: 'currency', currency: cur.toUpperCase() }); } catch { /* not a currency code: use it as a symbol */ }
      }
      return cur + ' ' + n.toLocaleString(app.locale || 'en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (a.kind === 'date') {
      var d = new Date(value);
      return isNaN(d) ? value : d.toLocaleDateString(app.locale || 'en', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    if (a.kind === 'yes_no') return value === true || value === 'Yes' ? 'Yes' : 'No';
    return Array.isArray(value) ? value.join(', ') : value;
  };

  var fallback = function (img, text) {
    img.onerror = null;
    var label = encodeURIComponent((text || '').slice(0, 24));
    img.src =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%25" height="100%25" fill="%23e2e8f0"/><text x="50%25" y="50%25" font-family="sans-serif" font-size="28" fill="%2364748b" text-anchor="middle" dominant-baseline="middle">' +
      label +
      '</text></svg>';
  };

  UX.image = function (src, alt, cls) {
    var img = document.createElement('img');
    img.className = cls || 'ux-img';
    img.alt = alt || '';
    img.loading = 'lazy';
    img.onerror = function () {
      fallback(img, alt);
    };
    img.src = src;
    return img;
  };

  /**
   * Fill an element from a record: [data-field] gets the formatted value, [data-field-img] an image (the first one
   * of a list), [data-field-gallery] all images, [data-field-state] the state badge, [name] form controls the raw value.
   */
  UX.fill = function (root, record) {
    var entity = record.entity;
    root.querySelectorAll('[data-field]').forEach(function (el) {
      el.textContent = UX.format(entity, el.getAttribute('data-field'), record.values[el.getAttribute('data-field')]);
    });
    root.querySelectorAll('[data-field-img]').forEach(function (el) {
      var v = record.values[el.getAttribute('data-field-img')];
      var src = Array.isArray(v) ? v[0] : v;
      el.innerHTML = '';
      if (src) el.appendChild(UX.image(src, UX.store.label(record.id), 'ux-thumb-img'));
    });
    root.querySelectorAll('[data-field-gallery]').forEach(function (el) {
      var v = record.values[el.getAttribute('data-field-gallery')];
      el.innerHTML = '';
      (Array.isArray(v) ? v : v ? [v] : []).forEach(function (src) {
        el.appendChild(UX.image(src, UX.store.label(record.id), 'ux-gallery-img'));
      });
    });
    root.querySelectorAll('[data-field-state]').forEach(function (el) {
      el.textContent = record.state ? record.state.replace(/_/g, ' ') : '';
      el.className = 'ux-badge ux-badge-' + UX.tone(record.state);
      el.hidden = !record.state;
    });
    root.querySelectorAll('[name]').forEach(function (el) {
      var v = record.values[el.getAttribute('name')];
      if (el.type === 'file') {
        el.setAttribute('data-current', JSON.stringify(v || []));
        return;
      }
      if (el.type === 'checkbox') el.checked = v === true || v === 'Yes';
      else if (el.tagName === 'SELECT' && el.hasAttribute('data-references')) el.value = v || '';
      else el.value = Array.isArray(v) ? v.join(', ') : v == null ? '' : v;
    });
  };

  /** Options of reference selects come from the referenced entity's records. */
  UX.options = function (root) {
    root.querySelectorAll('select[data-references]').forEach(function (sel) {
      var entity = sel.getAttribute('data-references');
      sel.innerHTML =
        '<option value=""></option>' +
        UX.store
          .all(entity)
          .map(function (r) {
            return '<option value="' + esc(r.id) + '">' + esc(UX.store.label(r.id)) + '</option>';
          })
          .join('');
    });
  };

  /** Values of a form, by attribute name. */
  UX.read = function (form) {
    var out = {};
    form.querySelectorAll('[name]').forEach(function (el) {
      var name = el.getAttribute('name');
      if (el.type === 'file') {
        // Photos: the ones already there plus the ones just picked (kept for this browser session).
        var current = JSON.parse(el.getAttribute('data-current') || '[]');
        var picked = Array.prototype.map.call(el.files || [], function (f) {
          return window.URL.createObjectURL(f);
        });
        var all = (Array.isArray(current) ? current : [current]).concat(picked);
        out[name] = UX.attr(form.closest('[data-entity]').getAttribute('data-entity'), name).multiple ? all : all[0];
      } else out[name] = el.type === 'checkbox' ? (el.checked ? 'Yes' : 'No') : el.value;
    });
    return out;
  };

  UX.tone = function (state) {
    var t = (spec.tones || {})[state];
    return t || 'neutral';
  };

  UX.toast = function (message) {
    var t = document.createElement('div');
    t.className = 'ux-toast';
    t.setAttribute('role', 'status');
    t.innerHTML = UX.icon('circle-check') + '<span>' + esc(message) + '</span>';
    document.body.appendChild(t);
    window.setTimeout(function () {
      t.classList.add('ux-toast-out');
      window.setTimeout(function () {
        t.remove();
      }, 300);
    }, 2600);
  };

  /** A confirmation dialog; resolves to true when confirmed. */
  UX.confirm = function (opts) {
    return new Promise(function (resolve) {
      var d = document.createElement('dialog');
      d.className = 'ux-dialog';
      d.innerHTML =
        '<form method="dialog"><h2 class="ux-dialog-title">' +
        esc(opts.title) +
        '</h2>' +
        (opts.message ? '<p>' + esc(opts.message) + '</p>' : '') +
        '<div class="ux-dialog-actions"><button class="ux-button" value="cancel">Cancel</button>' +
        '<button class="ux-button ' +
        (opts.danger ? 'ux-button-danger-solid' : 'ux-button-primary') +
        '" value="ok">' +
        esc(opts.confirm || 'Confirm') +
        '</button></div></form>';
      document.body.appendChild(d);
      d.addEventListener('close', function () {
        resolve(d.returnValue === 'ok');
        d.remove();
      });
      d.showModal();
    });
  };

  /** Show picked photos right away. */
  document.addEventListener('change', function (e) {
    var input = e.target;
    if (!input || input.type !== 'file' || !input.hasAttribute('data-image')) return;
    var gallery = input.closest('.ux-upload').querySelector('[data-field-gallery]');
    Array.prototype.forEach.call(input.files || [], function (f) {
      gallery.appendChild(UX.image(window.URL.createObjectURL(f), f.name, 'ux-gallery-img'));
    });
  });

  UX.params = new URLSearchParams(window.location.search);
})();
