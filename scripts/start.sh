#!/bin/bash

if [ $NODE_ENV = 'production' ] || [ $NODE_ENV = 'staging' ]
then
  npm run build
  node src/index.js
  exit
fi

until nc -z -v -w30 tempo-key-server-mysql 3002
do
  echo "Waiting for database connection..."
  sleep 1
done
knex migrate:latest
npm run dev
