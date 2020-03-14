"use strict";

/* eslint-disable
  no-shadow,
  no-undefined
*/
const webpack = require("webpack");
const addEntries = require("./addEntries");
const getSocketClientPath = require("./getSocketClientPath");

function dedupeHotModuleReplacementPlugin(compiler) {
    if (compiler && compiler.options && Array.isArray(compiler.options.plugins)) {
        compiler.options.plugins = (() => {
            let hasHotReplacementPlugin = false;
            return compiler.options.plugins.reduce(
                /**
                 * @param {Array} plugins
                 * @param {Object} plugin
                 * @returns {Array}
                 */
                (plugins, plugin) => {
                    if (typeof plugin === "object" && plugin !== null) {
                        if (Object.getPrototypeOf(plugin).constructor.name === "HotModuleReplacementPlugin") {
                            if (!hasHotReplacementPlugin) {
                                hasHotReplacementPlugin = true;
                                plugins.push(plugin);
                            }
                        } else {
                            plugins.push(plugin);
                        }
                        return plugins;
                    }
                },
                []
            );
        })();
    }
}

function updateCompiler(compiler, options) {
    if (options.inline !== false) {
        const findHMRPlugin = config => {
            if (!config.plugins) {
                return undefined;
            }

            return config.plugins.find(plugin => plugin.constructor.name === "HotModuleReplacementPlugin");
        };

        const compilers = [];
        const compilersWithoutHMR = [];
        let webpackConfig;
        if (compiler.compilers) {
            webpackConfig = [];
            compiler.compilers.forEach(compiler => {
                dedupeHotModuleReplacementPlugin(compiler);
                webpackConfig.push(compiler.options);
                compilers.push(compiler);
                if (!findHMRPlugin(compiler.options)) {
                    compilersWithoutHMR.push(compiler);
                }
            });
        } else {
            webpackConfig = compiler.options;
            compilers.push(compiler);
            if (!findHMRPlugin(compiler.options)) {
                compilersWithoutHMR.push(compiler);
            }
        }

        // it's possible that we should clone the config before doing
        // this, but it seems safe not to since it actually reflects
        // the changes we are making to the compiler
        // important: this relies on the fact that addEntries now
        // prevents duplicate new entries.
        addEntries(webpackConfig, options);
        compilers.forEach(compiler => {
            dedupeHotModuleReplacementPlugin(compiler);
            const config = compiler.options;
            compiler.hooks.entryOption.call(config.context, config.entry);

            const providePlugin = new webpack.ProvidePlugin({
                __webpack_dev_server_client__: getSocketClientPath(options)
            });
            providePlugin.apply(compiler);
        });

        // do not apply the plugin unless it didn't exist before.
        if (options.hot || options.hotOnly) {
            compilersWithoutHMR.forEach(compiler => {
                dedupeHotModuleReplacementPlugin(compiler);
                // addDevServerEntrypoints above should have added the plugin
                // to the compiler options
                const plugin = findHMRPlugin(compiler.options);
                if (plugin) {
                    plugin.apply(compiler);
                }
            });
        }
    }
}

module.exports = updateCompiler;
