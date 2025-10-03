FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install & npm install -g nodemon & npm install mysql2   

COPY . .

EXPOSE 3000

CMD ["npx", "nodemon", "server.js"]  