FROM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914
RUN test "$(node --version)" = "v22.23.4"
EXPOSE 8080
WORKDIR /app
COPY package.json .
RUN npm i
RUN npm i knex -g
COPY . .
CMD ["sh", "scripts/start.sh"]
