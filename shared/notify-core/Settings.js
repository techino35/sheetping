/**
 * Settings.js - PropertiesService wrapper
 */

var Settings = (function() {
  var _namespace = '';
  function init(namespace) { _namespace = namespace ? namespace.toUpperCase() + '_' : ''; }
  function _buildKey(key) { return _namespace + key; }
  function get(key) {
    try { return PropertiesService.getScriptProperties().getProperty(_buildKey(key)); }
    catch (e) { console.error('[Settings] get error: ' + e.message); return null; }
  }
  function set(key, value) {
    try { PropertiesService.getScriptProperties().setProperty(_buildKey(key), String(value)); return true; }
    catch (e) { console.error('[Settings] set error: ' + e.message); return false; }
  }
  function deleteKey(key) {
    try { PropertiesService.getScriptProperties().deleteProperty(_buildKey(key)); return true; }
    catch (e) { console.error('[Settings] delete error: ' + e.message); return false; }
  }
  function getAll() {
    try {
      var all = PropertiesService.getScriptProperties().getProperties();
      var result = {};
      Object.keys(all).forEach(function(k) {
        if (_namespace === '' || k.indexOf(_namespace) === 0) { result[_namespace ? k.slice(_namespace.length) : k] = all[k]; }
      });
      return result;
    } catch (e) { console.error('[Settings] getAll error: ' + e.message); return {}; }
  }
  function setAll(obj) {
    try {
      var prefixed = {};
      Object.keys(obj).forEach(function(k) { prefixed[_buildKey(k)] = String(obj[k]); });
      PropertiesService.getScriptProperties().setProperties(prefixed, false);
      return true;
    } catch (e) { console.error('[Settings] setAll error: ' + e.message); return false; }
  }
  function clearAll() {
    try {
      var all = PropertiesService.getScriptProperties().getProperties();
      Object.keys(all).forEach(function(k) { if (_namespace === '' || k.indexOf(_namespace) === 0) PropertiesService.getScriptProperties().deleteProperty(k); });
      return true;
    } catch (e) { console.error('[Settings] clearAll error: ' + e.message); return false; }
  }
  return { init: init, get: get, set: set, delete: deleteKey, getAll: getAll, setAll: setAll, clearAll: clearAll };
})();