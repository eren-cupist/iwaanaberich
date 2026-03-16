# 빌드 스테이지
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# 실행 스테이지
FROM node:20-alpine AS runner

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/main"]
