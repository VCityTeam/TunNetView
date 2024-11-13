const path = require('path');

const MODE = process.env.MODE || 'production';
console.log(MODE);

const webpackConfig = {
  entry: `./src/index.js`,
  output: {
    filename: 'bundle.js',
    publicPath: `./public`,
    path: path.resolve(__dirname, `./public/dist`),
  },
  module: {
    rules: [
      {
        test: /\.css/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: { modules: ['./node_modules'] },
};

webpackConfig.mode = MODE;
webpackConfig.devtool = MODE == 'development' ? 'source-map' : undefined;

module.exports = webpackConfig;
