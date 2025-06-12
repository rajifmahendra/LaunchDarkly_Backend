FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# 🛠 Fix permission issue with nodemon
RUN chmod +x ./node_modules/.bin/nodemon

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]