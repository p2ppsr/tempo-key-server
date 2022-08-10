#!/bin/bash

# Create .env file
echo "Generating .env file..."
echo "NODE_ENV=$NODE_ENV" > .env
echo "ROUTING_PREFIX=$ROUTING_PREFIX" >> .env
echo "HOSTING_DOMAIN=$HOSTING_DOMAIN" >> .env
echo "KNEX_DB_CONNECTION=$KNEX_DB_CONNECTION" >> .env
echo "KNEX_DB_CLIENT=$KNEX_DB_CLIENT" >> .env

echo "Generating .npmrc"
echo "@cwi:registry=https://npm-registry.babbage.systems/" > .npmrc
echo "//npm-registry.babbage.systems/:_authToken=$CWI_NPM_TOKEN" >> .npmrc
# cat .npmrc