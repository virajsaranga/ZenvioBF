FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p uploads/kyc uploads/avatars uploads/deposit-proofs

EXPOSE 5000

CMD ["node", "src/server.js"]
