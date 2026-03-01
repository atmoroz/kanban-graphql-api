# 1. Base image (Node 22 — как требует Prisma)
FROM node:22-alpine

# 2. Create app directory
WORKDIR /app

# 3. Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# 4. Copy source code
COPY . .

# 5. Generate Prisma client
RUN npx prisma generate

# 6. Expose port (Render uses PORT env, this is informational)
EXPOSE 4000

# 7. Start the app
CMD ["npm", "run", "start"]
