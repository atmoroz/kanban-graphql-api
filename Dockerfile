# 1. Base image (Node 22 — OK for Prisma)
FROM node:22-alpine

# 2. App directory
WORKDIR /app

# 3. Install deps
COPY package.json package-lock.json ./
RUN npm ci

# 4. Copy source
COPY . .

# 5. Prisma
RUN npx prisma generate

# 6. BUILD TYPESCRIPT (ВОТ ЧЕГО НЕ ХВАТАЛО)
RUN npm run build

# (необязательно, но полезно для дебага)
RUN ls -la dist

# 7. Expose port
EXPOSE 4000

# 8. Run compiled JS
CMD ["node", "dist/index.js"]