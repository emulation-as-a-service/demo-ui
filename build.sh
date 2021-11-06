#!/bin/sh

npm install

cd eaas-client
git submodule init
git submodule update
cd ..

cd landing-page
npm ci && \
npm run build && \
cd ../eaas-frontend-admin && \
npm ci && \
npm run build
