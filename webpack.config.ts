const path = require('path');

const srcDir = path.resolve(__dirname, 'client', 'src', 'index.tsx');
module.exports = {
  mode: 'development',
  entry: path.resolve(srcDir),
  output: {
    filename: 'bundle.ts',
    path: path.resolve(__dirname, 'client', 'dist'),
  },
  module: {
    rules: [
      {
        test: /.(jsx|js)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }],
            ],
          },
        },
      },
    ],
  },
};
