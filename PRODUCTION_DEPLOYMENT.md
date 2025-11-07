# Production 部署指南

## 問題說明
在 production 環境中使用 Puppeteer 時，可能會遇到缺少系統依賴的錯誤：
```
Error: Failed to launch the browser process: Code: 127
libatk-bridge-2.0.so.0: cannot open shared object file: No such file or directory
```

## 解決方案

### 方案一：使用 Docker（推薦）

1. **建立 Docker 映像**：
   ```bash
   docker build -t kapo-backend .
   ```

2. **運行容器**：
   ```bash
   docker run -p 4488:4488 \
     -e MONGODB_URI="your_mongodb_uri" \
     -e PORT=4488 \
     kapo-backend
   ```

### 方案二：手動安裝系統依賴

如果您不使用 Docker，需要在 Linux 伺服器上安裝以下依賴：

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils
```

#### CentOS/RHEL:
```bash
sudo yum install -y \
    alsa-lib \
    atk \
    cairo \
    cups-libs \
    dbus-glib \
    expat \
    fontconfig \
    freetype \
    gdk-pixbuf2 \
    glib2 \
    gtk3 \
    libX11 \
    libXcomposite \
    libXcursor \
    libXdamage \
    libXext \
    libXfixes \
    libXi \
    libXrandr \
    libXScrnSaver \
    libXtst \
    pango \
    xorg-x11-fonts-100dpi \
    xorg-x11-fonts-75dpi \
    xorg-x11-fonts-cyrillic \
    xorg-x11-fonts-ethiopic \
    xorg-x11-fonts-misc \
    xorg-x11-fonts-Type1 \
    xorg-x11-utils
```

### 方案三：使用環境變數

設定以下環境變數：
```bash
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## 測試

部署後，測試 PDF 生成功能：
```bash
curl -X GET "http://your-server:4488/api/reports/{clientProfileId}" \
  -H "Cookie: connect.sid=your_session_cookie" \
  --output report.pdf
```

## 注意事項

1. **記憶體使用**：Puppeteer 會使用較多記憶體，建議伺服器至少有 1GB RAM
2. **安全性**：在 production 環境中，確保適當的防火牆設定
3. **監控**：建議監控 PDF 生成的效能和錯誤率


