const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
  mode: "production",
  entry: {
    main: "./src/main.js",
    index: "./src/pages/index/index.js",
    services: "./src/pages/services/services.js",
    scheduling: "./src/pages/scheduling/scheduling.js",
    confirmation: "./src/pages/confirmation/confirmation.js"
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "scripts/[name].[contenthash].js",
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.(png|jpg|gif|mp4)$/,
        type: "asset/resource", // Use Webpack's built-in asset handling
        generator: {
          filename: "assets/[name][ext]", // Output files to 'assets' folder
        },
      },
      {
        test: /\.html$/,
        use: ["html-loader"],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash].css",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/components/js/phone-type-formatter.us.js",
          to: "components/js/phone-type-formatter.us.js"
        }
      ]
    }),
    new HtmlWebpackPlugin({
      template: "./src/components/header/header.html",
      filename: "header.html",
    }),
    new HtmlWebpackPlugin({
      template: "./src/components/footer/footer.html",
      filename: "footer.html",
    }),
    new HtmlWebpackPlugin({
      template: "./src/pages/index/index.html",
      filename: "index.html",
      chunks: ["main", "index"],
      favicon: "./src/assets/images/logos/logo.jpg",
    }),
    new HtmlWebpackPlugin({
      template: "./src/pages/services/services.html",
      filename: "services.html",
      chunks: ["main", "services"],
      favicon: "./src/assets/images/logos/logo.jpg",
    }),
    new HtmlWebpackPlugin({
      template: "./src/pages/scheduling/scheduling.html",
      filename: "scheduling.html",
      chunks: ["main", "scheduling"],
      favicon: "./src/assets/images/logos/logo.jpg",
    }),
    new HtmlWebpackPlugin({
      template: "./src/pages/confirmation/confirmation.html",
      filename: "confirmation.html",
      chunks: ["main", "confirmation"],
      favicon: "./src/assets/images/logos/logo.jpg",
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    compress: true,
    port: 9000,
  },
};

console.log("Webpack output path:", path.resolve(__dirname, "dist"));
console.log("Entry points:", module.exports.entry);
