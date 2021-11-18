#!/bin/sh

npm install

cd eaas-client
git submodule init
git submodule update
cd ..

cd eaas-frontend-admin && \
npm install && \
npm run build
