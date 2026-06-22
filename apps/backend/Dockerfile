FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3333

CMD ["sh", "-c", "npm install && npm audit fix --force && npx prisma generate && npm run dev"]