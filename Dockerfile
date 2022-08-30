FROM node:16-alpine
WORKDIR /app
EXPOSE 8080
COPY . .
CMD ["npm", "run", "start"]
