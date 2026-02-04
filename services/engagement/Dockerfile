FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY shared ./shared
COPY services/engagement ./services/engagement
RUN npm install
EXPOSE 8004
CMD ["npm", "run", "dev", "--prefix", "services/engagement"]
