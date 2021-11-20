#!/bin/sh

npm install

cd landing-page
npm ci && \
npm run build && \
cd ../eaas-frontend-admin && \
npm ci && \
npm run build

cd eaas-frontend-admin && \
npm install && \
npm run build
