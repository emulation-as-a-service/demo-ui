#!/bin/sh

cd landing-page
npm install
npm run build

cd ../eaas-frontend-admin
npm install
npm run build
