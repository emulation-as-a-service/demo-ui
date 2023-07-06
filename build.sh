#!/bin/sh

# HACK: Work around https://github.com/webpack/webpack/issues/14532 for Node.js >= 17
# See: https://gitlab.com/emulation-as-a-service/demo-ui/-/issues/4
node_version="$(node --version)"
node_version="${node_version#v}"
node_version="${node_version%%.*}"
if test "$node_version" -ge 17; then
    export NODE_OPTIONS=--openssl-legacy-provider
fi

npm ci --legacy-peer-deps

cd eaas-client
git submodule init
git submodule update
cd ..

cd eaas-frontend-admin
npm ci --legacy-peer-deps && \
npm run build && \
cd ../landing-page && \
npm ci --legacy-peer-deps && \
npm run build
