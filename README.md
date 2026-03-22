# SheetPing

## English

### Overview
SheetPing is a Google Sheets add-on that monitors cell changes and sends instant notifications via Slack, Discord, Google Chat, LINE Notify, or email.

### Features
- Monitor specific cell ranges for changes
- Multiple notification channels: Slack / Discord / Google Chat / LINE Notify / Email
- Threshold conditions: always / value <= X / value >= X / value != X
- Automatic user tracking (shows who made the change)
- Free plan: up to 3 monitoring rules
- Pro plan: unlimited rules + LINE Notify support

### Setup with clasp
1. Install clasp: `npm install -g @google/clasp`
2. Login: `clasp login`
3. Copy `.clasp.json.example` to `.clasp.json` and fill in your Script ID
4. Push code: `clasp push`

---

## 日本語

### 概要
SheetPingは、Google スプレッドシートのセル変更を監視し、Slack・Discord・Google Chat・LINE Notify・メールに即座に通知するアドオンです。

### 機能
- 特定のセル範囲の変更を監視
- 複数通知チャンネル対応
- 閾値条件設定
- Freeプラン: 監視ルール最大3件
- Proプラン: ルール無制限 + LINE Notify対応
