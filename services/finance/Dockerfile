FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY shared ./shared
COPY services/finance ./services/finance
RUN npm install --legacy-peer-deps
EXPOSE 8003
CMD ["npm", "run", "dev", "--prefix", "services/finance"]
