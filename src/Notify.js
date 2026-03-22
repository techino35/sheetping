/**
 * SheetPing - Notify.js
 * NotifyCore の呼び出しラッパー
 */

function sendNotification(message) {
  Settings.init(PRODUCT_NAME);
  try {
    var config = { type: Settings.get('WEBHOOK_TYPE') || '', webhookUrl: Settings.get('WEBHOOK_URL') || '', email: Settings.get('EMAIL_TO') || '', emailSubject: '[SheetPing] セル変更通知' };
    if (!config.webhookUrl && !config.email) return false;
    return notify(config, message);
  } catch (e) {
    console.error('[Notify] sendNotification: ' + e.message);
    SpreadsheetApp.getUi().alert('通知送信エラー: ' + e.message);
    return false;
  }
}

function sendTestNotification() {
  Settings.init(PRODUCT_NAME);
  try {
    var ts = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
    var msg = '[SheetPing] テスト通知\n送信日時: ' + ts + '\n設定が正常に動作しています。';
    var result = sendNotification(msg);
    return result ? { success: true } : { success: false, error: '送信先が未設定か、送信に失敗しました。' };
  } catch (e) { console.error('[Notify] sendTestNotification: ' + e.message); return { success: false, error: e.message }; }
}