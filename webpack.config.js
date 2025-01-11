const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
	mode: 'development', // Режим разработки
	entry: {
		main: './src/index.js', // Главный JS файл
	},
	output: {
		path: path.resolve(__dirname, 'build'),
		filename: '[name].min.js',
		assetModuleFilename: 'assets/[name][ext]',
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: ['babel-loader'], // Транспиляция современного JS
			},
			{
				test: /\.(glb|gltf)$/, // Поддержка моделей
				type: 'asset/resource',
				generator: {
					filename: 'models/[name][ext]',
				},
			},
			{
				test: /\.(png|jpg|jpeg|gif)$/, // Поддержка текстур
				type: 'asset/resource',
				generator: {
					filename: 'textures/[name][ext]',
				},
			},
		],
	},
	plugins: [
		new CleanWebpackPlugin(), // Очищает папку сборки перед новой сборкой
		new CopyWebpackPlugin({
			patterns: [
				// Копируем файлы из public/models в dist/models
				{ from: 'public/models', to: 'models' },
			],
		}),
	],
	devServer: {
		static: {
			directory: path.join(__dirname, 'public'), // Указываем папку для статических файлов
		},
		port: 8080, // Порт сервера
		open: true, // Автоматически открывает браузер
		headers: {
			'Access-Control-Allow-Origin': '*', // Разрешаем CORS
		},
	},
}
