const autoprefixer = require("autoprefixer");
const htmlPlugin = require("html-webpack-plugin");
const path = require("path");

const config = {
	resolve: { extensions: [ ".ts", ".js", ".d.ts" ] },
	devtool: "source-map",
	entry: {
		main: "./src/index.ts"
	},

	output: {
		filename: "index.js",
		path: path.resolve(__dirname + "/dist"),
		libraryTarget: "commonjs"
	},

	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: "ts-loader"
			},
			{
				test: /\.css$/,
				use: [ "style-loader", "css-loader" ]
			},
			{
				test: /\.js$/,
				exclude: [ /node_modules/, /tests/ ],
				use: [ "babel-loader" ]
			},
			{
				test: /\.scss$/,
				use: [
					"style-loader",
					"css-loader",
					{
						loader: "postcss-loader",
						options: {
							plugins: [
								autoprefixer({
									overrideBrowserslist: ['ie >= 8', 'last 8 version']
								})
							]
						}
					},
					"sass-loader"
				]
			},
			{
				test: /\.html$/,
				// use: "html-loader?exportAsEs6Default"
				use: "html-loader?"
			},
			{
				test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: "file-loader",
						options: {
							name: "[name].[ext]",
							outputPath: "fonts/"
						}
					}
				]
			},
			{
				test: /\.ico(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: "file-loader",
						options: {
							name: "[name].[ext]"
						}
					}
				]
			},
			{
				test: /\.(gif|jpe?g|png)$/,
				use: [
					"file-loader",
					{
						loader: "image-webpack-loader",
						options: {
							bypassOnDebug: true,
							disable: true,

							optipng: { enabled: true }
						}
					}
				]
			}
		]
	},

	plugins: [
		new htmlPlugin({
			template: "./src/index.html",
			filename: "index.html",
			inject: true
		})
	]
};

config.devServer = { 
	overlay: true,
	contentBase: path.resolve("public"),
	publicPath: '/',
};
config.mode = "development";
config.target = "web";

module.exports = config;
