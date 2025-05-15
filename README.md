# Client Profile API

這是一個用於管理客戶檔案的 API，支持用戶的身份驗證、客戶檔案的創建、更新、刪除和查詢功能。

## 目錄

- [技術棧](#技術棧)
- [安裝](#安裝)
- [環境變數](#環境變數)
- [API 端點](#api-端點)
  - [用戶相關](#用戶相關)
  - [客戶檔案相關](#客戶檔案相關)
- [使用說明](#使用說明)
- [貢獻](#貢獻)
- [許可證](#許可證)

## 技術棧

- Node.js
- Express
- MongoDB
- Mongoose
- dotenv
- bcrypt
- express-session
- connect-mongo

## 安裝

1. 克隆此存儲庫：
   ```bash
   git clone https://github.com/yourusername/client-profile-api.git
   cd client-profile-api
   ```

2. 安裝依賴：
   ```bash
   npm install
   ```

3. 創建 `.env` 文件並設置環境變數：
   ```plaintext
   MONGODB_URI=mongodb+srv://username:password@cluster0.kelsrqo.mongodb.net/fingerprint
   PORT=4488
   ```

## 環境變數

- `MONGODB_URI`: MongoDB 的連接字符串。
- `PORT`: 伺服器運行的端口（默認為 4488）。

## API 端點

### 用戶相關

- **註冊用戶**
  - **方法**: `POST`
  - **路徑**: `/api/users`
  - **請求體**:
    ```json
    {
        "username": "your_username",
        "password": "your_password"
    }
    ```

- **登入用戶**
  - **方法**: `POST`
  - **路徑**: `/api/users/login`
  - **請求體**:
    ```json
    {
        "email": "your_email",
        "password": "your_password"
    }
    ```

### 客戶檔案相關

- **創建客戶檔案**
  - **方法**: `POST`
  - **路徑**: `/api/clientProfiles`
  - **請求體**:
    ```json
    {
        "name": "John Doe",
        "gender": "male",
        "birth": "1990-01-01",
        "age": 33,
        "dropdownSelection": "option1",
        "fingerprints": [
            {
                "hand": "right",
                "img": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."
            }
        ]
    }
    ```

- **獲取用戶的所有客戶檔案**
  - **方法**: `GET`
  - **路徑**: `/api/clientProfiles/user`
  - **請求參數**: 無需參數，通過 session 獲取用戶 ID。

- **更新客戶檔案**
  - **方法**: `PUT`
  - **路徑**: `/api/clientProfiles/:id`
  - **請求體**:
    ```json
    {
        "name": "Updated Name",
        "gender": "female",
        "age": 34
    }
    ```

- **刪除客戶檔案**
  - **方法**: `DELETE`
  - **路徑**: `/api/clientProfiles/:id`
  - **請求參數**: 無需參數，通過 session 獲取用戶 ID。

## 使用說明

1. 啟動伺服器：
   ```bash
   npm start
   ```

2. 使用 Postman 或其他 API 測試工具來測試 API 端點。

## 貢獻

歡迎任何形式的貢獻！請提交問題或拉取請求。

## 許可證

此項目使用 MIT 許可證。詳情請參見 [LICENSE](LICENSE) 文件。