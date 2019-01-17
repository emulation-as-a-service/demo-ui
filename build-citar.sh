#!/bin/sh

cd eaas-frontend-admin
npm install
npm run build
cd ../citar-headless-client
npm install
npm run build
