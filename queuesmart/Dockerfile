FROM node:22-alpine3.21 AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci 
COPY . .

FROM base AS dev
EXPOSE 5173
CMD ["npm","run","dev"]

FROM base AS build
RUN npm run build

FROM nginx:1.28.0-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
