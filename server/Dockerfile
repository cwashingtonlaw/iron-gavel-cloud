FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --workspace=@iron-gavel/server --workspace=@iron-gavel/shared
COPY packages/shared/ ./packages/shared/
COPY server/ ./server/
RUN npm run build --workspace=@iron-gavel/shared
RUN cd server && npx prisma generate
RUN npm run build --workspace=@iron-gavel/server

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/server/prisma ./server/prisma
COPY --from=build /app/server/package.json ./server/
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
EXPOSE 4000
WORKDIR /app/server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
