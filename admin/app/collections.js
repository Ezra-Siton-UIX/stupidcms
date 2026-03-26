// collections.js — CollectionsEngine Core
//
// Responsibilities:
//   - Exposes window.API_BASE (backend URL, auto-detected local vs. Railway)
//   - Defines window.FIELD_TYPE_REGISTRY (all supported field types)
//   - Exposes window.buildCollection() (used by collections-init.js)
//   - Defines window.SITE_DOMAINS (per-site slug prefixes)
//   - Initializes window.COLLECTION_SCHEMAS = {} (schemas register themselves here)
//
// Individual schemas live in admin/app/collections/*.js
// Final COLLECTIONS object is built in collections-init.js

(function () {
  function getStorageValue(key) {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  }

  function isLocalHost(hostname) {
    return /^(localhost|127\.0\.0\.1)$/i.test(hostname || '');
  }

  function isLocalHttpUrl(value) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value || '');
  }

  var isLocalAdminHost = window.location.protocol !== 'file:' && isLocalHost(window.location.hostname);

  var fromStorage = getStorageValue('api_base');
  if (isLocalAdminHost) {
    window.API_BASE = window.location.origin;
    if (isLocalHttpUrl(fromStorage) && fromStorage !== window.location.origin) {
      localStorage.setItem('api_base', window.location.origin);
      sessionStorage.setItem('api_base', window.location.origin);
    }
  } else if (fromStorage) {
    window.API_BASE = fromStorage;
  } else {
    var isFile = window.location.protocol === 'file:';
    window.API_BASE = isFile ? 'http://localhost:3002' : window.location.origin;
  }
})();

// Empty registry — each collections/*.js file adds its schema here.
window.COLLECTION_SCHEMAS = {};

// --- Build helpers (used by collections-init.js) ---

function buildCommonFields(schema) {
  var primary = schema.primary;
  var hasSinglePage = !!schema.hasSinglePage;
  return [
    {
      key: primary.key,
      label: primary.label,
      type: 'title',
      required: true,
      placeholder: primary.placeholder,
    },
    {
      key: 'slug',
      label: 'Slug',
      type: 'slug',
      prefix: schema.slugPrefix,
      autoFrom: primary.key,
      required: hasSinglePage,
      disabled: false,
      disabledNote: '',
    },
  ];
}

window.buildCollection = function buildCollection(schema) {
  var primaryKey = schema.primary.key;
  var fields = buildCommonFields(schema).concat(schema.extraFields || []);

  return {
    key: schema.key,
    label: schema.label,
    singular: schema.singular,
    newLabel: schema.newLabel,
    emptyMessage: schema.emptyMessage,
    hasSinglePage: !!schema.hasSinglePage,
    metadataNote: schema.metadataNote || '',
    navGroup: schema.navGroup || schema.key,
    navGroupLabel: schema.navGroupLabel || schema.label,
    navPrimary: !!schema.navPrimary,
    navSecondary: !!schema.navSecondary,
    navVisible: schema.navVisible !== false,
    navOrder: schema.navOrder || 0,
    list: {
      title: primaryKey,
      subtitle: schema.list.subtitle,
      image: schema.list.image,
      slug: schema.hasSinglePage ? 'slug' : null,
      placeholder: schema.list.placeholder || null,
    },
    fields: fields,
  };
};

// --- Site domains (developer-defined, not editable by clients) ---

window.SITE_DOMAINS = {
  site_bobby: 'https://demo-bobby.example.com',
};
window.DEFAULT_SITE_DOMAIN = 'https://demo-site.example.com';

(function () {
  function isLocalHttpUrl(value) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value || '');
  }
  function getStorageValue(key) {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  }

  window.getSiteDomain = function (siteId) {
    var runtimeBase = window.API_BASE || getStorageValue('api_base') || '';
    if (isLocalHttpUrl(runtimeBase)) return runtimeBase;
    if (isLocalHttpUrl(window.location.origin)) return window.location.origin;
    return window.SITE_DOMAINS[siteId] || window.DEFAULT_SITE_DOMAIN;
  };
})();

// --- Field type registry ---

var FIELD_TYPE_REGISTRY = {
  title:     { props: ['placeholder'] },
  slug:      { props: ['prefix', 'autoFrom', 'disabled', 'disabledNote'] },
  text:      { props: ['placeholder', 'maxLength', 'half'] },
  textarea:  { props: ['placeholder', 'maxLength', 'rows', 'half'] },
  email:     { props: ['placeholder', 'half'] },
  phone:     { props: ['placeholder', 'half'] },
  number:    { props: ['placeholder', 'min', 'max', 'step', 'half'] },
  date:      { props: ['half'] },
  link:      { props: ['placeholder', 'half'] },
  url:       { props: ['placeholder', 'half'] },
  image:     { props: ['previewMode', 'imageSize'] },
  video:     { props: ['placeholder'] },
  richtext:  { props: ['placeholder', 'toolbar'] },
  reference: { props: ['sourceCollection', 'labelKey', 'mirrorKey', 'placeholder', 'half'], required: ['sourceCollection'] },
  select:    { props: ['options', 'placeholder', 'half'], required: ['options'] },
  checkbox:  { props: ['checkboxLabel'] },
  radio:     { props: ['options'], required: ['options'] },
  color:     { props: ['placeholder', 'half'] },
  prefixed:  { props: ['prefix', 'placeholder', 'half'] },
};
window.FIELD_TYPE_REGISTRY = FIELD_TYPE_REGISTRY;

console.log("collections.js loaded");
