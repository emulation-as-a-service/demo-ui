# emil-ui
User web frontend for the EAAS REST backend.

## Config
To deploy the emil-ui you need to add a config.json to the root directory, you can copy the content from the [template](config.json.template) and adjust it to your needs.

## Quick start
Install npm (by installing nodejs) and make sure it can be found in the `PATH`.

```bash
# install the dependencies with npm
$ npm install

# start the server
$ npm start
```

Running `$ npm start` will start a local server using `webpack-dev-server` which will watch, build (in-memory), and reload for you.


## Build for production
Run `npm run build`, this will create a deployable distribution in the `dist` directory.

If the distribution is not running at the root path, the base path can be adjusted by setting `PRODUCTION_BASE_PATH` in `webpack.config.js`.

## Webpack config
The webpack config is based on https://github.com/preboot/angularjs-webpack