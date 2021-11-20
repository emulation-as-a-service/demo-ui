#!/bin/sh

npm install

cd landing-page
npm ci --legacy-peer-deps && \
npm run build && \
cd ../eaas-frontend-admin && \
npm ci --legacy-peer-deps && \
npm run build

