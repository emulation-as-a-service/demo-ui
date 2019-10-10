#!/bin/sh
cd eaas-frontend-admin
npm install
cp -r node_modules ../
cp tsconfig.json ../eaas-frontend-lib/tsconfig.json
