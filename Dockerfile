# 使用 Node.js 官方映像
FROM node:18-alpine

# 安裝 Puppeteer 所需的系統依賴
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# 告訴 Puppeteer 使用系統安裝的 Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製應用程式碼
COPY . .

# 建立非 root 用戶
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 變更檔案擁有者
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 4488

# 啟動應用程式
CMD ["npm", "start"]


