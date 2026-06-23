# 本番用イメージ（multi-stage）。Next.js standalone 出力を最小ランタイムで動かす。
# CD への配線（Coolify / Cloudflare Tunnel）は Issue #7 で行う。

# 1) 依存インストール
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) ビルド
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma を使う場合はここで generate（schema 導入後に有効化）
# RUN npx prisma generate
RUN npm run build

# 3) ランタイム（非root・standalone）
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# 非root ユーザーで実行
USER node
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
