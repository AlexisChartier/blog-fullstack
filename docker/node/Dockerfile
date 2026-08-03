FROM node:22-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ .

RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache git

WORKDIR /app

COPY --from=build /app/dist/frontend ./dist/frontend
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules

EXPOSE 4000

CMD ["npm", "run", "serve:ssr"]
