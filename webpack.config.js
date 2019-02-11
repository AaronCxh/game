const path = require("path");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const production = process.env.NODE_ENV === 'production' || false;


module.exports = {
  mode: "production",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: production ? 'hero.min.js' : 'hero.js',
    library: 'HeroJS',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }]
  },
  optimization: {
    minimize: production,
    minimizer: [
      new UglifyJsPlugin({
        parallel: require('os').cpus().length,
        uglifyOptions: {
          ie8: false,
          keep_fnames: false,
          output: {
            beautify: false,
            comments: (node, {
              value,
              type
            }) => type == 'comment2' && value.startsWith('!')
          }
        }
      })
    ]
  },

}