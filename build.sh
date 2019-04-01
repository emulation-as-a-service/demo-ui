#!/bin/sh

cd eaas-frontend-admin
npm install
npm run build
cd ../landing-page
npm install
npm run build
