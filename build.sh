#!/bin/sh

cd landing-page
npm install
npm run build

cd ../eaas-frontend-admin
npm install
npm run build

cd ../eaasi-public-portal
npm install 
npm run build
