/**
 * SheetPing - Rules.js
 * ルール管理: addRule / removeRule / getRules / validateLicense
 */

var FREE_MAX_RULES = 3;

function addRule(rule) {
  Settings.init(PRODUCT_NAME);
  try {
    var existing = getRules();
    var isPro = _isProUser();
    if (!isPro && existing.length >= FREE_MAX_RULES) {
      return { success: false, error: 'Free プランはルール最大 ' + FREE_MAX_RULES + ' 件です。Proへアップグレードしてください。' };
    }
    if (!rule.range || !rule.sheetName) {
      return { success: false, error: 'シート名とセル範囲は必須です。' };
    }
    var newRule = { id: String(Date.now()), sheetName: rule.sheetName || '', range: rule.range, condition: rule.condition || 'none', threshold: rule.threshold || '', label: rule.label || rule.range };
    existing.push(newRule);
    Settings.set('RULES', JSON.stringify(existing));
    return { success: true, rule: newRule };
  } catch (e) {
    console.error('[Rules] addRule: ' + e.message);
    return { success: false, error: e.message };
  }
}

function removeRule(ruleId) {
  Settings.init(PRODUCT_NAME);
  try {
    var existing = getRules();
    var filtered = existing.filter(function(r) { return r.id !== ruleId; });
    if (filtered.length === existing.length) return { success: false, error: 'ルールが見つかりません: ' + ruleId };
    Settings.delete('SNAPSHOT_' + ruleId);
    Settings.set('RULES', JSON.stringify(filtered));
    return { success: true };
  } catch (e) {
    console.error('[Rules] removeRule: ' + e.message);
    return { success: false, error: e.message };
  }
}

function getRules() {
  Settings.init(PRODUCT_NAME);
  try {
    var raw = Settings.get('RULES');
    return raw ? JSON.parse(raw) : [];
  } catch (e) { console.error('[Rules] getRules: ' + e.message); return []; }
}

function validateLicense(key) {
  Settings.init(PRODUCT_NAME);
  try {
    if (!key) return false;
    var hash = _sha256(key.trim());
    var valid = VALID_KEY_HASHES.indexOf(hash) !== -1;
    if (valid) { Settings.set('LICENSE_KEY', key.trim()); Settings.set('LICENSE_STATUS', 'pro'); }
    return valid;
  } catch (e) { console.error('[Rules] validateLicense: ' + e.message); return false; }
}

function _isProUser() { return Settings.get('LICENSE_STATUS') === 'pro'; }

function getLicenseInfo() {
  Settings.init(PRODUCT_NAME);
  var isPro = _isProUser();
  return { isPro: isPro, ruleCount: getRules().length, maxRules: isPro ? null : FREE_MAX_RULES };
}

function getSheetNames() {
  try { return SpreadsheetApp.getActiveSpreadsheet().getSheets().map(function(s) { return s.getName(); }); }
  catch (e) { console.error('[Rules] getSheetNames: ' + e.message); return []; }
}

function saveNotifySettings(config) {
  Settings.init(PRODUCT_NAME);
  try {
    Settings.setAll({ WEBHOOK_TYPE: config.webhookType || '', WEBHOOK_URL: config.webhookUrl || '', EMAIL_TO: config.emailTo || '' });
    return { success: true };
  } catch (e) { console.error('[Rules] saveNotifySettings: ' + e.message); return { success: false, error: e.message }; }
}

function getNotifySettings() {
  Settings.init(PRODUCT_NAME);
  return { webhookType: Settings.get('WEBHOOK_TYPE') || '', webhookUrl: Settings.get('WEBHOOK_URL') || '', emailTo: Settings.get('EMAIL_TO') || '' };
}

function _sha256(input) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  return bytes.map(function(b) { var hex = (b < 0 ? b + 256 : b).toString(16); return hex.length === 1 ? '0' + hex : hex; }).join('');
}