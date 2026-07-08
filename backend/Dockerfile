# Build context: repository root (see docker-compose.yml)
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY backend/package.json backend/package-lock.json ./backend/

RUN npm ci
RUN npm ci --prefix backend

RUN npx prisma generate

COPY backend/tsconfig.json backend/nest-cli.json ./backend/
COPY backend/src ./backend/src

WORKDIR /app/backend
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl \
  && addgroup --system --gid 1001 nestjs \
  && adduser --system --uid 1001 nestjs

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY backend/package.json backend/package-lock.json ./backend/
COPY backend/docker-entrypoint.sh ./backend/docker-entrypoint.sh

# Production deps only; Prisma CLI + generated client copied from builder for version parity
RUN npm ci --omit=dev \
  && npm ci --prefix backend --omit=dev \
  && sed -i 's/\r$//' ./backend/docker-entrypoint.sh \
  && chmod +x ./backend/docker-entrypoint.sh

COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

COPY --from=builder /app/backend/dist ./backend/dist

RUN chown -R nestjs:nestjs /app

WORKDIR /app/backend

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
