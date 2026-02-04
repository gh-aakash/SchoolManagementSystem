FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY gateway ./gateway
RUN npm install --legacy-peer-deps
EXPOSE 8000
CMD ["npm", "run", "dev", "--prefix", "gateway"]
