FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY shared ./shared
COPY services/sis ./services/sis
RUN npm install --legacy-peer-deps
EXPOSE 8002
CMD ["npm", "run", "dev", "--prefix", "services/sis"]
