const Path = require('path');
const PortFinder = require('portfinder');
const ClosurePlugin = require('closure-webpack-plugin');
const webpack = require('webpack');

module.exports = async function (env) {
    const get = (it, val) => {
        return env === undefined || env[it] === undefined ? val : env[it];
    };

    const rules = [
        {
            test: /(?<!\.min)\.(js|css)$/,
            exclude: /node_modules/,
            use: [
                {
                    loader: 'babel-loader',
                    options: {
                        'presets': [
                            '@babel/preset-env'
                        ]
                    }
                }
            ]
        },
        {
            test: /\.(css|scss)$/,
            use: [
                'style-loader',
                'css-loader',
                {
                    loader: 'sass-loader',
                    options: {
                        sourceMap: true,
                        sassOptions: {
                            includePaths: [
                                Path.resolve(__dirname, './sass')
                            ]
                        }
                    }
                }
            ]
        },
        {
            test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
            use: [
                {
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: '../fonts/',
                        publicPath: '../../resources/fonts',
                    }
                }
            ]
        }
    ];

    const entry = {
        main: [
            '@babel/polyfill',
            Path.resolve(__dirname, './main.js')
        ]
    };

    const output = {
        path: Path.resolve(__dirname, './resources/js'),
        filename: 'bundle.js'
    };

    const resolve = {
        alias: {
            node_modules: Path.resolve(__dirname, '../node_modules'),
            ile: Path.resolve(__dirname, '.')
        }
    };

    const plugins = {
        development: [
            new webpack.ProvidePlugin({
                $: "jquery",
                jQuery: "jquery"
            })
        ],
        production: [
            new ClosurePlugin({mode: 'STANDARD'})
        ]
    };

    const devtool = {
        development: 'inline-source-map'
    };

    const environment = get('environment', 'development');

    PortFinder.basePort = (env && env.port) || 3000;
    return PortFinder.getPortPromise().then(port => {
        return {
            mode: environment,
            devtool: devtool[environment],
            entry: entry,
            output: output,
            plugins: plugins[environment],
            module: { rules: rules },
            resolve: resolve,
            performance: { hints: false },
            stats: 'none',
            optimization: { noEmitOnErrors: true },
            node: false,
            devServer: {
                contentBase: Path.join(__dirname, './'),
                contentBasePublicPath: '/ile',
                port: port,
                writeToDisk: true
            }
        };
    });
};
