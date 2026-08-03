FROM node:22-alpine

RUN apk add --no-cache git

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

EXPOSE 4000

CMD ["npm", "start"]
