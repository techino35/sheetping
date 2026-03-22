/**
 * NotifyCore.js - 共通通知基盤
 * Webhook送信 / MailApp送信モジュール
 */

function _buildSlackPayload(message) { return JSON.stringify({ text: message }); }
function _buildDiscordPayload(message) { return JSON.stringify({ content: message }); }
function _buildGoogleChatPayload(message) { return JSON.stringify({ text: message }); }
function _buildLinePayload(message) { return 'message=' + encodeURIComponent(message); }

function sendWebhook(type, message, webhookUrl) {
  if (!webhookUrl || !message) { console.error('[NotifyCore] sendWebhook: webhookUrl or message is empty'); return false; }
  try {
    var options = { method: 'post', muteHttpExceptions: true };
    if (type === 'line') {
      var token = Settings.get('NOTIFY_LINE_TOKEN');
      options.headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/x-www-form-urlencoded' };
      options.payload = _buildLinePayload(message);
    } else {
      options.contentType = 'application/json';
      switch (type) {
        case 'slack': options.payload = _buildSlackPayload(message); break;
        case 'discord': options.payload = _buildDiscordPayload(message); break;
        case 'googlechat': options.payload = _buildGoogleChatPayload(message); break;
        default: console.error('[NotifyCore] sendWebhook: unknown type: ' + type); return false;
      }
    }
    var response = UrlFetchApp.fetch(webhookUrl, options);
    var code = response.getResponseCode();
    if (code < 200 || code >= 300) { console.error('[NotifyCore] sendWebhook: HTTP ' + code); return false; }
    return true;
  } catch (e) { console.error('[NotifyCore] sendWebhook: ' + e.message); return false; }
}

function sendEmail(to, subject, body) {
  if (!to || !subject || !body) { console.error('[NotifyCore] sendEmail: required parameter is empty'); return false; }
  try {
    var addresses = to.split(',').map(function(addr) { return addr.trim(); }).filter(Boolean);
    addresses.forEach(function(addr) { MailApp.sendEmail({ to: addr, subject: subject, body: body }); });
    return true;
  } catch (e) { console.error('[NotifyCore] sendEmail: ' + e.message); return false; }
}

function notify(config, message) {
  if (!config || !message) { console.error('[NotifyCore] notify: config or message is empty'); return false; }
  var results = [];
  if (config.webhookUrl && config.type) results.push(sendWebhook(config.type, message, config.webhookUrl));
  if (config.email) results.push(sendEmail(config.email, config.emailSubject || '[通知] シート変更アラート', message));
  if (results.length === 0) { console.error('[NotifyCore] notify: no destination configured'); return false; }
  return results.some(function(r) { return r === true; });
}