// collections-init.js — CollectionsEngine Boot Step
//
// Runs AFTER collections.js + all collections/*.js schema files are loaded.
// Responsibilities:
//   - Validates each schema's extraFields against FIELD_TYPE_REGISTRY
//   - Calls buildCollection() on each schema
//   - Writes the final window.COLLECTIONS object
//   - window.COLLECTIONS is what App.js (the router) reads to render the UI

(function validateSchemas() {
  var schemas = window.COLLECTION_SCHEMAS;
  var registry = window.FIELD_TYPE_REGISTRY;
  if (!schemas || !registry) return;
  Object.keys(schemas).forEach(function (collKey) {
    (schemas[collKey].extraFields || []).forEach(function (field) {
      var typeDef = registry[field.type];
      if (!typeDef) {
        console.warn('[Schema] Unknown field type "' + field.type + '" in ' + collKey + '.' + field.key + '. Supported: ' + Object.keys(registry).join(', '));
        return;
      }
      (typeDef.required || []).forEach(function (rp) {
        if (field[rp] == null) {
          console.warn('[Schema] ' + collKey + '.' + field.key + ' (type: ' + field.type + ') missing required "' + rp + '".');
        }
      });
    });
  });
})();

window.COLLECTIONS = Object.keys(window.COLLECTION_SCHEMAS).reduce(function (acc, key) {
  acc[key] = window.buildCollection(window.COLLECTION_SCHEMAS[key]);
  return acc;
}, {});

var collectionCount = Object.keys(window.COLLECTIONS).length;
console.log('[CollectionsEngine] ' + collectionCount + ' collections loaded.');
console.table(Object.keys(window.COLLECTION_SCHEMAS).reduce(function (acc, key) {
  var schema = window.COLLECTION_SCHEMAS[key];
  var primary = schema.primary ? schema.primary.key : '—';
  var extra = (schema.extraFields || []).map(function (f) { return f.key; }).join(', ') || '—';
  acc[key] = { primary: primary, fields: extra };
  return acc;
}, {}));
