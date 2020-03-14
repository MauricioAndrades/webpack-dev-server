"use strict";
/* eslint-disable
  no-shadow,
  no-undefined
*/

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var webpack = require("webpack");

var addEntries = require("./addEntries.babel.js");

var getSocketClientPath = require("./getSocketClientPath");

function dedupeHotModuleReplacementPlugin(compiler) {
  var _compiler$options;

  console.log(require("util").inspect(compiler, {
    compact: true,
    depth: null,
    sorted: true
  }));

  if (Array.isArray(compiler === null || compiler === void 0 ? void 0 : (_compiler$options = compiler.options) === null || _compiler$options === void 0 ? void 0 : _compiler$options.plugins)) {
    compiler.options.plugins = function () {
      var _compiler$options$plu, _compiler$options$plu2;

      var hasHotReplacementPlugin = false;
      return (_compiler$options$plu = compiler.options.plugins) === null || _compiler$options$plu === void 0 ? void 0 : (_compiler$options$plu2 = _compiler$options$plu.reduce) === null || _compiler$options$plu2 === void 0 ? void 0 : _compiler$options$plu2.call(_compiler$options$plu,
      /**
       * @param {Array} plugins
       * @param {Object} plugin
       * @returns {Array}
       */
      function (plugins, plugin) {
        if (_typeof(plugin) === "object" && plugin !== null) {
          var _Object$getPrototypeO, _Object$getPrototypeO2;

          if (((_Object$getPrototypeO = Object.getPrototypeOf(plugin)) === null || _Object$getPrototypeO === void 0 ? void 0 : (_Object$getPrototypeO2 = _Object$getPrototypeO.constructor) === null || _Object$getPrototypeO2 === void 0 ? void 0 : _Object$getPrototypeO2.name) === "HotModuleReplacementPlugin") {
            if (!hasHotReplacementPlugin) {
              hasHotReplacementPlugin = true;
              plugins.push(plugin);
            }
          } else {
            plugins.push(plugins);
          }

          return plugins;
        }
      }, []);
    }();
  }
}

function updateCompiler(compiler, options) {
  if (options.inline !== false) {
    var findHMRPlugin = function findHMRPlugin(config) {
      if (!config.plugins) {
        return undefined;
      }

      return config.plugins.find(function (plugin) {
        return plugin.constructor === webpack.HotModuleReplacementPlugin;
      });
    };

    var compilers = [];
    var compilersWithoutHMR = [];
    var webpackConfig;

    if (compiler.compilers) {
      webpackConfig = [];
      compiler.compilers.forEach(function (compiler) {
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
    } // it's possible that we should clone the config before doing
    // this, but it seems safe not to since it actually reflects
    // the changes we are making to the compiler
    // important: this relies on the fact that addEntries now
    // prevents duplicate new entries.


    addEntries(webpackConfig, options);
    compilers.forEach(function (compiler) {
      dedupeHotModuleReplacementPlugin(compiler);
      var config = compiler.options;
      compiler.hooks.entryOption.call(config.context, config.entry);
      var providePlugin = new webpack.ProvidePlugin({
        __webpack_dev_server_client__: getSocketClientPath(options)
      });
      providePlugin.apply(compiler);
    }); // do not apply the plugin unless it didn't exist before.

    if (options.hot || options.hotOnly) {
      compilersWithoutHMR.forEach(function (compiler) {
        dedupeHotModuleReplacementPlugin(compiler); // addDevServerEntrypoints above should have added the plugin
        // to the compiler options

        var plugin = findHMRPlugin(compiler.options);

        if (plugin) {
          plugin.apply(compiler);
        }
      });
    }
  }
}

module.exports = updateCompiler;

