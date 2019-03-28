var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  //plugins: [
  //  new HtmlWebpackPlugin({
  //    template: './src/index.html',
  //    title: 'Output Management',
  //    filename: 'index.html'
  //  })
  //],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      //{
      //  test: /\.html$/,
      //  use: [
      //    "file-loader",
      //    {
      //      loader: "extract-loader",
      //      options: {
      //        name: "index.html",
      //      },
      //    },
      //    {
      //      loader: "html-loader",
      //      options: {
      //        attrs: ["img:src", "link:href"]
      //      }
      //    }
      //  ]
      //},
      {
        test: /\.html$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: '[name].[ext]'
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
      //{
      //  test: /\.css$/,
      //    use: [
      //      "file-loader",
      //      {
      //        loader: "extract-loader",
      //        options: {
      //          name: "bootstrap.css",
      //        },
      //      },
      //      {
      //        loader: "css-loader",
      //        options: {
      //          sourceMap: false
      //        }
      //      }
      //    ]
      //}
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 8080
  }
};
