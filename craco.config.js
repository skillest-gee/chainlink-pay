module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallbacks for Node.js modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer"),
        "util": require.resolve("util"),
        "assert": require.resolve("assert"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "os": require.resolve("os-browserify/browser"),
        "url": require.resolve("url"),
        "fs": false,
        "path": require.resolve("path-browserify"),
        "zlib": require.resolve("browserify-zlib"),
        "net": false,
        "tls": false,
        "child_process": false,
      };
      
      // Add plugins for global variables
      const webpack = require('webpack');
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
      
      return webpackConfig;
    },
  },
};
