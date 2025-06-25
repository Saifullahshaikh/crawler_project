# Lightweight container to serve built app
FROM node:20-alpine

WORKDIR /app

# Copy production-ready files (already built)
COPY .next .next
COPY public public
COPY node_modules node_modules
COPY package.json package.json
COPY next.config.mjs next.config.mjs

EXPOSE 3000

CMD ["npm", "start"]
