# frontend/Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

COPY . .

RUN npm install --legacy-peer-deps

# Final image to serve the built app
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "start"]
