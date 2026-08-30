# 外部服務與環境變數配置手冊 (Configuration Setup Guide)

> 本手冊列出 Mote 專案所需之外部服務與環境變數配置清單，便於後續統一開通與填入。

---

## 1. 本地開發環境變數 (`.dev.vars`)

請於專案根目錄或 `worker/` 目錄建立 `.dev.vars` 檔案（此檔案已加入 `.gitignore`，切勿提交至 Git）：

```ini
# Google OAuth 2.0 憑證 (由 Google Cloud Console 取得)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Gemini API 金鑰 (由 Google AI Studio 取得)
GEMINI_API_KEY=your_gemini_api_key

# JWT 簽章密鑰 (至少 32 字元的隨機亂數)
JWT_SECRET=generate_a_secure_random_string_at_least_32_chars

# 前端與後端連線設定
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
FRONTEND_URL=http://localhost:3000
ENV=development
```

---

## 2. Cloudflare 生產環境資源建立指令

若需部署至正式 Cloudflare 帳號，請在終端機執行以下指令：

### 2.1 建立 D1 資料庫
```bash
npx wrangler d1 create mote-db
```
執行完成後，將終端機輸出的 `database_id` 填入 `wrangler.jsonc` 的 `d1_databases` 區塊。

### 2.2 建立 R2 儲存儲存庫
```bash
npx wrangler r2 bucket create mote-storage
```
確保 `wrangler.jsonc` 中的 `bucket_name` 與建立之儲存庫名稱一致。

### 2.3 設定生產環境 Secrets
```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put JWT_SECRET
```

---

## 3. Google Cloud Console (OAuth 設定)

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)。
2. 建立新專案或選取現有專案。
3. 前往 **API 與服務 > 憑證**，建立 **OAuth 2.0 用戶端 ID**（應用程式類型：網頁應用程式）。
4. 設定 **已授權的 JavaScript 來源**：
   - 本地開發：`http://localhost:3000`
   - 正式環境：`https://<your-project>.pages.dev`（或您的自訂域名）
5. 設定 **已授權的重新導向 URI**：
   - 本地開發：`http://localhost:3000/api/auth/callback` 或 `http://127.0.0.1:8787/api/auth/callback`
   - 正式環境：`https://<your-worker-subdomain>.workers.dev/api/auth/callback`
6. 將取得之 Client ID 與 Client Secret 填入上述變數中。
