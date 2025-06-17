# frontend/Dockerfile

FROM node:20-alpine

WORKDIR /app

# Copy everything you prebuilt manually
COPY .next .next
COPY node_modules node_modules
COPY package.json .

EXPOSE 3000

CMD ["npm", "start"]
