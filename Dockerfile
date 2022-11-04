FROM node:16-alpine
WORKDIR /app
EXPOSE 8080
COPY package.json .
RUN npm i
COPY . .
CMD ["sh", "scripts/start.sh"]
