/* global window, localStorage */
// Demo data store: the records of data.js, kept in the browser so changes survive page loads until the demo data
// is reset. Records: { id, entity, state, owner, values: { <attribute name>: value } }.
(function () {
  var UX = (window.UX = window.UX || {});
  var app = window.UX_APP || {};
  var spec = window.UX_SPEC || { entities: {} };
  var seed = window.UX_DATA || { version: '0', entities: {} };
  var KEY = (app.storeKey || 'ux') + '-data-' + seed.version;

  function load() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      /* storage unavailable: start from the seed */
    }
    return JSON.parse(JSON.stringify(seed.entities));
  }

  var data = load();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage unavailable: changes last until the page closes */
    }
  }

  function list(entity) {
    if (!data[entity]) data[entity] = [];
    return data[entity];
  }

  var counter = 0;
  UX.store = {
    all: function (entity) {
      return list(entity).slice();
    },
    get: function (entity, id) {
      return list(entity).find(function (r) {
        return r.id === id;
      });
    },
    /** The record with this id in any entity. */
    find: function (id) {
      var found;
      Object.keys(data).some(function (e) {
        found = UX.store.get(e, id);
        return Boolean(found);
      });
      return found;
    },
    add: function (entity, values, extra) {
      var meta = spec.entities[entity] || {};
      var record = Object.assign(
        {
          id: (meta.prefix || entity.toLowerCase()) + '-n' + Date.now().toString(36) + counter++,
          entity: entity,
          state: meta.initialState,
          owner: UX.session && UX.session.user ? UX.session.user.id : undefined,
          values: values,
        },
        extra || {},
      );
      list(entity).unshift(record);
      save();
      return record;
    },
    update: function (entity, id, patch) {
      var r = UX.store.get(entity, id);
      if (!r) return undefined;
      if (patch.values) Object.assign(r.values, patch.values);
      if (patch.state) r.state = patch.state;
      save();
      return r;
    },
    remove: function (entity, id) {
      data[entity] = list(entity).filter(function (r) {
        return r.id !== id;
      });
      save();
    },
    /** How a record is named where others refer to it. */
    label: function (id) {
      var r = id && UX.store.find(id);
      if (!r) return id || '';
      var meta = spec.entities[r.entity] || {};
      if (meta.label && r.values[meta.label]) return r.values[meta.label];
      // No name of its own: the entity and what it belongs to, e.g. "Sales price · Article Nova".
      var attrs = meta.attributes || {};
      var ref = Object.keys(attrs).find(function (n) {
        return attrs[n].references && r.values[n] && attrs[n].references !== r.entity;
      });
      return (meta.title || r.entity) + (ref ? ' · ' + UX.store.label(r.values[ref]) : '');
    },
    reset: function () {
      try {
        Object.keys(localStorage)
          .filter(function (k) {
            return k.indexOf((app.storeKey || 'ux') + '-') === 0;
          })
          .forEach(function (k) {
            localStorage.removeItem(k);
          });
      } catch {
        /* nothing stored */
      }
      data = JSON.parse(JSON.stringify(seed.entities));
    },
  };
})();
