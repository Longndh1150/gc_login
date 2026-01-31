# Login Assignment
# 認証機能付きログインシステム (Secure Authentication System)

フロントエンド・バックエンド・データ保存を含めた、堅牢な認証機能の実装プロジェクトです。
セキュリティ（JWT, Rate Limit）とユーザー体験（Auto-renew token, UX）を重視して設計されています。

## 📌 主な機能 (Features)

### ユーザー機能
- **ユーザー登録 & ログイン**: ID/Passwordによる認証。
- **2要素認証 (2FA)**:
  - メールアドレスがある場合：コンソール（サーバーログ）にOTPを表示（メール送信シミュレーション）。
  - メールアドレスがない場合：画面上にToast通知でOTPを表示。
- **OTP再送機能**: スパム防止のためのカウントダウンタイマー付き。
- **ダッシュボード**: ログイン済みユーザーのみがアクセス可能な保護されたページ。

### セキュリティ & UX
- **JWT認証**: アクセストークンによるステートレス認証。
- **Auto-Renew Token (Silent Refresh)**: ユーザーが操作中、トークンの有効期限が迫ると自動的に更新し、ログアウトを防ぎます。
- **Idle Timeout**: 一定時間（デモ設定：30分）操作がない場合、自動的にログアウトします。
- **Rate Limiting**: 総当たり攻撃対策（例: ログイン試行は10回/分まで）。
- **SQL Injection対策**: SQLModel (ORM) の使用により、SQLインジェクションを防止。

---

## 🧪 テストガイド (Testing Guide)

面接官の方が動作確認を行う際に、以下のAPIおよび手動操作をテストできます。

### 1. APIテスト (Swagger UI)
バックエンド起動後、以下のURLでAPIドキュメントにアクセスし、直接リクエストを送信できます。
- **URL**: `http://localhost:8000/docs`

| メソッド | エンドポイント | 説明 |
| :--- | :--- | :--- |
| `POST` | `/register` | 新規ユーザー登録 (Password strength check, OTP verification含む) |
| `POST` | `/login` | ログイン (Password check -> OTP verification -> Token発行) |
| `POST` | `/send-otp` | OTPの発行 (Rate Limit: 3回/分) |
| `POST` | `/refresh-token` | トークンの更新 (Auto-renew機能で使用) |

### 2. 手動テストシナリオ (Manual UI Testing Scenarios)
ブラウザ (`http://localhost:5173`) で以下の操作をお試しください。

#### ✅ シナリオA: メールなしでの登録 (Basic Flow)
1. **登録画面**へ移動し、UsernameとPasswordを入力（Emailは空欄）。
2. 「OTPを送信」をクリック。
3. **画面右上**に表示されるToast通知からOTPコードをコピー。
4. コードを入力し、登録完了 -> ログイン画面へ遷移することを確認。

#### ✅ シナリオB: メールありでの登録 (Email Simulation)
1. **登録画面**で、Username, Passwordに加え、**Email**を入力。
2. 「OTPを送信」をクリック。
3. 画面にはOTPが表示されず、「メールを確認してください」と表示される。
4. **VS Codeのターミナル（バックエンドのログ）**を確認し、`[MOCK EMAIL SERVER]` と出力されたOTPコードを使用する。

#### ✅ シナリオC: Rate Limit (セキュリティ確認)
1. **ログイン画面**または**登録画面**にて、「OTPを送信」ボタンを**連打**する。
2. 数回クリックした後、エラーメッセージ（`Too Many Requests`）が表示され、操作がブロックされることを確認。

#### ✅ シナリオD: 自動ログアウト (Idle Timeout)
1. ログインしてダッシュボードを表示する。
2. マウスやキーボードを操作せず、**放置**する。
3. 設定時間（テスト用に短縮可能、デフォルトは30分）経過後、アラートが表示されログイン画面に戻されることを確認。

---

## 🤖 生成AIの活用 (AI Usage)

本プロジェクトでは、開発効率の向上とベストプラクティスの導入のために生成AI (Google Gemini) を活用しました。

### 1. 利用分野
- **サンプルコードの生成**: FastAPIの基本設定、Pydanticモデルの定義、Reactコンポーネントの初期構造の作成。Rate Limitの実装およびSQL Injection対策のコードパターン生成。
- **UIデザイン**: Tailwind CSSを使用した配色の提案（Goal Connect様のWebサイトカラーをベースに設計）。

### 2. プロンプトの例 (Example Prompts)
以下は、AIとの対話履歴の一部です：

> "FastAPIとSQLModelを使用して、ユーザー登録とログインを行う基本的なAPIを作成してください。パスワードはハッシュ化する必要があります。"

> "FastAPIとReactで使用できる、Rate Limit（レート制限）の実装パターンを提示してください。"

---

## 🛠 技術スタック (Tech Stack)

- **Frontend**: React (Vite), Tailwind CSS, Axios
- **Backend**: Python 3.11, FastAPI, SQLModel, SlowAPI
- **Database**: SQLite (開発用)
- **Infrastructure**: Docker, Docker Compose

## 🚀 起動手順 (How to Run)

### Dockerを使用する場合（推奨）
プロジェクトのルートディレクトリで以下のコマンドを実行してください。

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

### 手動で実行する場合

#### Backend
```bash
cd backend
pip install -r requirements.txt
python -m app.main
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

