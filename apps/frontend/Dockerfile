FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# CMD ["npm", "run", "dev", "--", "--host"]
CMD ["sh", "-c", "npm install && npm audit fix --force && npm run dev -- --host"]