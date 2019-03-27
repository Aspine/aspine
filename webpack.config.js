var path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: [
          "file-loader",
          {
            loader: "extract-loader",
            options: {
              name: "index.html",
            },
          },
          {
            loader: "html-loader",
            options: {
              attrs: ["img:src", "link:href"]
            }
          }
        ]
      },
      //{
      //  test: /\.css$/,
      //  //use: ['style-loader', 'css-loader']
      //  use: ['file-loader', 'extract-loader', 'css-loader']
      //}
      {
        test: /\.css$/,
          use: [
            "file-loader",
            {
              loader: "extract-loader",
              options: {
                name: "bootstrap.css",
              },
            },
            {
              loader: "css-loader",
              options: {
                sourceMap: false
              }
            }
          ]
      }
    ]
  }
};
