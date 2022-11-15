FROM node:lts as builder
WORKDIR /app
COPY . /app
RUN npm ci
RUN npm run build

FROM node:lts-slim
WORKDIR /app
COPY --from=builder /app/build /app/build
COPY --from=builder /app/package*.json /app
COPY .env /app
RUN npm ci --production

EXPOSE ${PORT}
CMD ["node", "build/index.js"]
