FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY shared ./shared
COPY services/identity ./services/identity
RUN npm install
EXPOSE 8001
CMD ["npm", "run", "dev", "--prefix", "services/identity"]
