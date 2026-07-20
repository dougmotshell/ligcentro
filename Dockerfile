# Estágio 1: instalação de dependências
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Estágio 2: build do Next.js
FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Estágio 3: imagem de produção (mínima)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copia apenas o necessário para rodar
COPY --from=builder /app/public ./public
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
COPY --from=builder /app/.next-app/standalone ./
COPY --from=builder /app/.next-app/static ./.next/static

EXPOSE 3000

# Servidor Node standalone do Next.js (nenhum npm install em runtime)
CMD ["node", "server.js"]
