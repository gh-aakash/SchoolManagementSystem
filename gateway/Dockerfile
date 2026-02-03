FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY gateway ./gateway
RUN npm install
EXPOSE 8000
CMD ["npm", "run", "dev", "--prefix", "gateway"]
