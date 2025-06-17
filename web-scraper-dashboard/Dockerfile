# frontend/Dockerfile

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Serve production build
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app ./

RUN npm install --legacy-peer-deps --omit=dev

EXPOSE 3000

CMD ["npm", "start"]
