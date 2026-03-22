/**
 * SheetPing - Code.js
 * エントリーポイント: onInstall / onOpen / showSidebar / onEdit / checkChanges
 */

// プロダクト識別子（Settings.js の namespace に使用）
var PRODUCT_NAME = 'SHEETPING';

// ライセンス検証用ハッシュ済みキー（SHA-256）
// 実運用時は安全な管理方法に変更すること
var VALID_KEY_HASHES = [
  'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // example key: 123
];

/**
 * アドオンインストール時の処理
 * @param {GoogleAppsScript.Events.AddonOnInstall} e
 */
function onInstall(e) {
  Settings.init(PRODUCT_NAME);
  onOpen(e);
}

/**
 * スプレッドシートオープン時の処理
 * @param {GoogleAppsScript.Events.SheetsOnOpen} e
 */
function onOpen(e) {
  Settings.init(PRODUCT_NAME);
  SpreadsheetApp.getUi()
    .createAddonMenu()
    .addItem('Open SheetPing', 'showSidebar')
    .addItem('Run Check Now', 'checkChanges')
    .addToUi();
}

/**
 * アドオンホームページカードを返す（Workspace Add-on用）
 * @returns {GoogleAppsScript.Card_Service.Card}
 */
function onHomepage() {
  Settings.init(PRODUCT_NAME);
  showSidebar();
  return CardService.newCardBuilder().build();
}

/**
 * サイドバーを表示する
 */
function showSidebar() {
  Settings.init(PRODUCT_NAME);
  try {
    var html = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setTitle('SheetPing')
      .setWidth(300);
    SpreadsheetApp.getUi().showSidebar(html);
  } catch (e) {
    console.error('[SheetPing] showSidebar: ' + e.message);
    SpreadsheetApp.getUi().alert('SheetPing でエラーが発生しました: ' + e.message);
  }
}

/**
 * セル編集時トリガー（onEdit）
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e
 */
function onEdit(e) {
  Settings.init(PRODUCT_NAME);
  try {
    var range = e.range;
    var sheet = range.getSheet();
    var rules = Rules.getRules();

    rules.forEach(function(rule) {
      if (!_isRuleActive(rule, sheet, range)) return;
      if (!_meetsCondition(rule, e.value)) return;

      var message = _buildChangeMessage(rule, e, range, sheet);
      Notify.sendNotification(message);
    });

  } catch (err) {
    console.error('[SheetPing] onEdit: ' + err.message);
  }
}

/**
 * タイマートリガー用: 定期チェック（5分毎を想定）
 */
function checkChanges() {
  Settings.init(PRODUCT_NAME);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var rules = Rules.getRules();
    var changed = [];

    rules.forEach(function(rule) {
      var sheet = ss.getSheetByName(rule.sheetName);
      if (!sheet) return;

      var currentValues = sheet.getRange(rule.range).getValues();
      var snapshotKey = 'SNAPSHOT_' + rule.id;
      var raw = Settings.get(snapshotKey);
      var prevValues = raw ? JSON.parse(raw) : null;

      Settings.set(snapshotKey, JSON.stringify(currentValues));

      if (!prevValues) return;

      for (var r = 0; r < currentValues.length; r++) {
        for (var c = 0; c < currentValues[r].length; c++) {
          var cur = currentValues[r][c];
          var prev = prevValues[r] ? prevValues[r][c] : '';
          if (String(cur) !== String(prev)) {
            if (!_meetsConditionValue(rule, cur)) continue;
            var a1 = _indexToA1(rule.range, r, c);
            changed.push({ rule: rule, cell: a1, oldVal: prev, newVal: cur, sheet: rule.sheetName });
          }
        }
      }
    });

    if (changed.length > 0) {
      var msg = '[SheetPing] ' + changed.length + '件の変更を検出\n';
      changed.forEach(function(ch) {
        msg += '- シート: ' + ch.sheet + ' | セル: ' + ch.cell + ' | ' + ch.oldVal + ' → ' + ch.newVal + '\n';
      });
      Notify.sendNotification(msg.trim());
    }

  } catch (err) {
    console.error('[SheetPing] checkChanges: ' + err.message);
    SpreadsheetApp.getUi().alert('SheetPing チェックエラー: ' + err.message);
  }
}

function _isRuleActive(rule, sheet, range) {
  if (rule.sheetName && sheet.getName() !== rule.sheetName) return false;
  try {
    var ruleRange = sheet.getRange(rule.range);
    return ruleRange.getA1Notation() === range.getA1Notation() || _rangeContains(ruleRange, range);
  } catch (e) { return false; }
}

function _meetsCondition(rule, value) { return _meetsConditionValue(rule, value); }

function _meetsConditionValue(rule, value) {
  var num = parseFloat(value);
  switch (rule.condition) {
    case 'none': return true;
    case 'lte':  return !isNaN(num) && num <= parseFloat(rule.threshold);
    case 'gte':  return !isNaN(num) && num >= parseFloat(rule.threshold);
    case 'neq':  return String(value) !== String(rule.threshold);
    default:     return true;
  }
}

function _buildChangeMessage(rule, e, range, sheet) {
  var user = '';
  try { user = Session.getActiveUser().getEmail(); } catch (_) {}
  var ts = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
  return '[SheetPing] セル変更を検出\n変更者: ' + (user || '不明') + '\nシート: ' + sheet.getName() + '\nセル: ' + range.getA1Notation() + '\n変更前: ' + (e.oldValue !== undefined ? e.oldValue : '') + '\n変更後: ' + (e.value !== undefined ? e.value : '') + '\n日時: ' + ts;
}

function _rangeContains(parentRange, cellRange) {
  var pr = parentRange, cr = cellRange;
  return cr.getRow() >= pr.getRow() && cr.getLastRow() <= pr.getLastRow() && cr.getColumn() >= pr.getColumn() && cr.getLastColumn() <= pr.getLastColumn();
}

function _indexToA1(baseRange, rowOffset, colOffset) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var r = ss.getActiveSheet().getRange(baseRange);
    var row = r.getRow() + rowOffset;
    var col = r.getColumn() + colOffset;
    return ss.getActiveSheet().getRange(row, col).getA1Notation();
  } catch (e) { return '(unknown)'; }
}