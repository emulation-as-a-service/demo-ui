'use strict';

// Modules
var webpack = require('webpack');
var autoprefixer = require('autoprefixer');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');

/**
 * Env
 * Get npm lifecycle event to identify the environment
 */
var ENV = process.env.npm_lifecycle_event;
var isProd = ENV === 'build';

var PRODUCTION_BASE_PATH = '';

var LOCAL_WEBSERVER_PATH = '/';
var PRODUCTION_PATH = '/landing-page/';

// Include git commit hash
var commitHash = require('child_process').execSync('git rev-parse HEAD').toString();

module.exports = function makeWebpackConfig() {
  /**
   * Config
   * Reference: http://webpack.github.io/docs/configuration.html
   * This is the object where all configuration gets set
   */
  var config = {};

  /**
   * Entry
   * Reference: http://webpack.github.io/docs/configuration.html#entry
   */
  config.entry = {
    polyfills: './src/app2/polyfills.js',
    app: './src/app2/app.module.ts'
  };

  /**
   * Output
   * Reference: http://webpack.github.io/docs/configuration.html#output
   */
  config.output = {
    // Absolute output directory
    path: __dirname + '/dist',

    // Output path from the view of the page
    // Uses webpack-dev-server in development
    publicPath: isProd ? PRODUCTION_BASE_PATH : LOCAL_WEBSERVER_PATH,

    // Filename for entry points
    // Only adds hash in build mode
    filename: isProd ? '[name].[hash].js' : '[name].bundle.js',

    // Filename for non-entry points
    // Only adds hash in build mode
    chunkFilename: isProd ? '[name].[hash].js' : '[name].bundle.js'
  };

  /**
   * Devtool
   * Reference: http://webpack.github.io/docs/configuration.html#devtool
   * Type of sourcemap to use per build type
   */
  if (isProd) {
    config.devtool = 'source-map';
  }
  else {
    config.devtool = 'eval';
  }

  /**
   * Loaders
   * Reference: http://webpack.github.io/docs/configuration.html#module-loaders
   * List: http://webpack.github.io/docs/list-of-loaders.html
   * This handles most of the magic responsible for converting modules
   */

  // Initialize module
  config.module = {
    rules: [{
      // JS LOADER
      // Reference: https://github.com/babel/babel-loader
      // Transpile .js files using babel-loader
      // Compiles ES6 and ES7 into ES5 code
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules/
    }, {
      // CSS LOADER
      // Reference: https://github.com/webpack/css-loader
      // Allow loading css through js
      //
      // Reference: https://github.com/postcss/postcss-loader
      // Postprocess your css with PostCSS plugins
      test: /\.css$/,
      // Reference: https://github.com/webpack/extract-text-webpack-plugin
      // Extract css files in production builds
      //
      // Reference: https://github.com/webpack/style-loader
      // Use style-loader in development.

      loader: ExtractTextPlugin.extract({
        fallbackLoader: 'style-loader',
        loader: [
          {loader: 'css-loader', query: {sourceMap: true}},
          {loader: 'postcss-loader', query: { config: './postcss.config.js' }}
        ],
      })
    }, {
      test: /\.scss$/,
      use: [
          {
              loader: 'style-loader'
          },
          {
              loader: 'to-string-loader'
          },
          {
              loader: 'css-loader'
          },
          {
              loader: 'sass-loader'
          }
      ]
  }, {
      // ASSET LOADER
      // Reference: https://github.com/webpack/file-loader
      // Copy png, jpg, jpeg, gif, svg, woff, woff2, ttf, eot files to output
      // Rename the file using the asset hash
      // Pass along the updated reference to your code
      // You can add here any file extension you want to get copied to your output
      test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
        loader: 'file-loader',
        options: {
            publicPath: isProd ? PRODUCTION_PATH : LOCAL_WEBSERVER_PATH
        },   
    }, {
      // HTML LOADER
      // Reference: https://github.com/webpack/raw-loader
      // Allow loading html through js
      test: /\.html$/,
      loader: 'raw-loader'
    },
      { test: /\.tsx?$/,exclude: /\.node_modules/, loader: "ts-loader" }]

  };

  /**
   * PostCSS
   * Reference: https://github.com/postcss/autoprefixer-core
   * Add vendor prefixes to your css
   */
   // NOTE: This is now handled in the `postcss.config.js`
   //       webpack2 has some issues, making the config file necessary

  /**
   * Plugins
   * Reference: http://webpack.github.io/docs/configuration.html#plugins
   * List: http://webpack.github.io/docs/list-of-plugins.html
   */
  config.plugins = [
    new webpack.LoaderOptionsPlugin({
      debug: true
    }),
    new webpack.LoaderOptionsPlugin({
      test: /\.scss$/i,
      options: {
        postcss: {
          plugins: [autoprefixer]
        }
      }
    }),
    new webpack.DefinePlugin({
        __UI_COMMIT_HASH__: JSON.stringify(commitHash)
    })
  ];

  // Reference: https://github.com/ampedandwired/html-webpack-plugin
  // Render index.html
  config.plugins.push(
    new HtmlWebpackPlugin({
      template: './src/public/index.ejs',
      baseUrl: isProd ? PRODUCTION_BASE_PATH : '/',
      inject: 'body'
    }),

    // Reference: https://github.com/webpack/extract-text-webpack-plugin
    // Extract css files
    // Disabled when in test mode or not in build mode
    new ExtractTextPlugin({filename: 'css/[name].css', disable: !isProd, allChunks: true}),
    new CopyWebpackPlugin([
        {from: '../eaas-client/xpra/xpra-html5/html5', to: 'xpra/xpra-html5/html5/' },
        {from: '../eaas-client/xpra/eaas-xpra-worker.js', to: 'xpra' },
        {from: '../eaas-client/xpra/xpraWrapper.js', to: 'xpra' },
        {from: '../eaas-client/xpra/eaas-xpra.js', to: 'xpra' },
        {from: '../eaas-client/lib', to: 'lib' },
      ])
  );

  // Add build specific plugins
  if (isProd) {
    config.plugins.push(
      // Reference: http://webpack.github.io/docs/list-of-plugins.html#noerrorsplugin
      // Only emit files when there are no errors
      new webpack.NoEmitOnErrorsPlugin(),

      // Reference: https://webpack.js.org/plugins/uglifyjs-webpack-plugin/
      // Minify all javascript, disable renaming/mangling
      

      // Copy assets from the public folder
      // Reference: https://github.com/kevlened/copy-webpack-plugin
      new CopyWebpackPlugin([{
        from: __dirname + '/src/public'
      }])
    )
  }

  /**
   * Dev server configuration
   * Reference: http://webpack.github.io/docs/configuration.html#devserver
   * Reference: http://webpack.github.io/docs/webpack-dev-server.html
   */
  config.devServer = {
    contentBase: './src/public',
    stats: 'minimal',
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    open: true
  };
  config.resolve = {
    alias: {
        EaasLibs: path.resolve(__dirname, '../eaas-frontend-lib/'),
        EaasAdmin: path.resolve(__dirname, '../eaas-frontend-admin/src/'),
        '@angular': path.resolve(__dirname, './node_modules/@angular'),
        'uuid': path.resolve(__dirname, './node_modules/uuid'),
        'EaasClient': path.resolve(__dirname, '../eaas-client/')
    }
};
  return config;
}();
