'use strict';

// Modules
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WebpackShellPluginNext = require('webpack-shell-plugin-next');
const path = require('path');

/**
 * Env
 * Get npm lifecycle event to identify the environment
 */
const ENV = process.env.npm_lifecycle_event;
const isProd = ENV === 'build';

const PRODUCTION_BASE_PATH = '';
const ADMIN_PATH = '/admin/';

// Include git commit hash
const commitHash = require('child_process').execSync('git rev-parse --short=10 HEAD').toString().toUpperCase();

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
        publicPath: isProd ? PRODUCTION_BASE_PATH : ADMIN_PATH,

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
    if (!isProd) {
        config.devtool = 'source-map';
    }

    config.optimization = {
        minimize: isProd,
        splitChunks: {
            chunks: 'all',
            minSize: 1000,
            minRemainingSize: 0,
            minChunks: 1,
            maxAsyncRequests: 30,
            maxInitialRequests: 30,
            enforceSizeThreshold: 3000,
            cacheGroups: {
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    reuseExistingChunk: true,
                },
                default: {
                    minChunks: 4,
                    priority: -20,
                    reuseExistingChunk: true,
                },
            },
        },
    };

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
        },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
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
                    publicPath: ADMIN_PATH
                },
            }, {
                // HTML LOADER
                // Reference: https://github.com/webpack/raw-loader
                // Allow loading html through js
                test: /\.html$/,
                loader: 'raw-loader'
            },
            {test: /\.tsx?$/, exclude: /\.node_modules/, loader: "ts-loader"}]
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
        new webpack.ProvidePlugin({
            '$': "jquery",
            'jQuery': "jquery",
            'Popper': 'popper.js'
        }),
        new webpack.DefinePlugin({
            __UI_COMMIT_HASH__: JSON.stringify(commitHash),
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

        new MiniCssExtractPlugin({
            filename: 'css/[name].css',
        }),

        isProd ? new WebpackShellPluginNext({
                onBuildStart: {
                    scripts: ['echo "Webpack Start (Production Mode)"'],
                    blocking: true,
                    parallel: false
                },
                onBuildExit: {
                    scripts: ['echo "Executing cleanup scripts..."',
                        '../eaas-client/delete-unneeded-files.sh',
                        '../eaas-client/write-version-json.sh',
                        'echo "Done with cleanup scripts!"'],
                    blocking: true,
                    parallel: false
                }
            }) :
            new WebpackShellPluginNext({
                onBuildStart: {
                    scripts: ['echo "Starting Webpack in Dev Mode"'],
                    blocking: true,
                    parallel: false
                }
            }),

        new CopyWebpackPlugin({
            patterns: [
                {from: '../eaas-client/xpra/xpra-html5/html5', to: 'xpra/xpra-html5/html5/'},
                {from: '../eaas-client/xpra/eaas-xpra-worker.js', to: 'xpra'},
                {from: '../eaas-client/xpra/xpraWrapper.js', to: 'xpra'},
                {from: '../eaas-client/xpra/eaas-xpra.js', to: 'xpra'},
                {from: '../eaas-client/xpra/eaas-xpra.css', to: 'xpra'},
                {from: '../eaas-client/lib', to: 'lib'},
                {
                    from: '../eaas-client/guacamole/guacamole-client-eaas/guacamole-common-js/src/main/webapp/modules/',
                    to: 'guacamole/guacamole-client-eaas/guacamole-common-js/src/main/webapp/modules/'
                },
                {
                    from: '../eaas-client/guacamole/guacamole-client-eaas/guacamole/src/main/webapp/app/client/styles/keyboard.css',
                    to: 'guacamole/guacamole-client-eaas/guacamole/src/main/webapp/app/client/styles/keyboard.css'
                },
                {
                    from: '../eaas-client/guacamole/guacamole-client-eaas/guacamole/src/main/webapp/app/osk/styles/osk.css',
                    to: 'guacamole/guacamole-client-eaas/guacamole/src/main/webapp/app/osk/styles/osk.css'
                },
            ]
        }),
        new CopyWebpackPlugin({
            patterns: [{
                from: '../eaas-client', to: 'eaas-client',
                globOptions: {
                    dot: false,
                    ignore: ["**/*.html"],
                },
            }]
        }),
    );

    // Add build specific plugins
    if (isProd) {
        config.plugins.push(
            // Reference: http://webpack.github.io/docs/list-of-plugins.html#noerrorsplugin
            // Only emit files when there are no errors
            new webpack.NoEmitOnErrorsPlugin(),

            // Copy assets from the public folder
            // Reference: https://github.com/kevlened/copy-webpack-plugin
            new CopyWebpackPlugin({
                patterns: [{
                    from: __dirname + '/src/public'
                }]
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {from: '../eaas-client/xpra/xpra-html5/html5', to: 'xpra/xpra-html5/html5/'},
                    {from: '../eaas-client/xpra/eaas-xpra-worker.js', to: 'xpra'},
                    {from: '../eaas-client/xpra/xpraWrapper.js', to: 'xpra'},
                    {from: '../eaas-client/xpra/eaas-xpra.js', to: 'xpra'},
                    {from: '../eaas-client/xpra/eaas-xpra.css', to: 'xpra'},
                    {from: '../eaas-client/lib', to: 'lib'},
                    {
                        from: '../eaas-client/guacamole/guacamole-client-eaas/guacamole-common-js/src/main/webapp/modules/',
                        to: 'guacamole/guacamole-client-eaas/guacamole-common-js/src/main/webapp/modules/'
                    },
                    {
                        from: '../eaas-client/guacamole/guacamole-client-eaas/guacamole/src/main/webapp/app/client/styles/keyboard.css',
                        to: 'guacamole/guacamole-client-eaas/guacamole/src/main/webapp/app/client/styles/keyboard.css'
                    },
                    {
                        from: '../eaas-client/guacamole/guacamole-client-eaas/guacamole/src/main/webapp/app/osk/styles/osk.css',
                        to: 'guacamole/guacamole-client-eaas/guacamole/src/main/webapp/app/osk/styles/osk.css'
                    },
                ]
            })
        );
    }

    /**
     * Dev server configuration
     * Reference: http://webpack.github.io/docs/configuration.html#devserver
     * Reference: http://webpack.github.io/docs/webpack-dev-server.html
     */
    config.devServer = {
        // contentBase: './src/public',
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        compress: true,
        client: {
            overlay: false
        },
        port: 8080,
        static: {
            directory: './src/public',
        },
        open: false
    };
    config.resolve = {
        alias: {
            EaasLibs: path.resolve(__dirname, '../eaas-frontend-lib/'),
            EaasAdmin: path.resolve(__dirname, './src/'),
            '@angular': path.resolve(__dirname, './node_modules/@angular'),
            'uuid': path.resolve(__dirname, './node_modules/uuid'),
            'EaasClient': path.resolve(__dirname, '../eaas-client/')
        }
    };
    return config;
}
();
