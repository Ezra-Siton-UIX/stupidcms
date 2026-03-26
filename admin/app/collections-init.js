// collections-init.js — Validates schemas and builds final COLLECTIONS object.
// Runs AFTER collections.js + all collections/*.js schema files are loaded.

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

console.log("collections-init.js loaded (" + Object.keys(window.COLLECTIONS).length + " collections)");
