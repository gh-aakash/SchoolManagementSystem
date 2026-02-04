FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY shared ./shared
COPY services/academic ./services/academic
RUN npm install
EXPOSE 8005
CMD ["npm", "run", "dev", "--prefix", "services/academic"]
