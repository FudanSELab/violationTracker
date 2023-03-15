// const { injectBabelPlugin } = require('react-app-rewired');
const {
  override,
  overrideDevServer,
  fixBabelImports,
  addWebpackAlias,
  addBabelPlugin,
  addLessLoader,
} = require('customize-cra');
const resolve = (dir) => require('path').join(__dirname, dir);
const paths = require('react-scripts/config/paths');

const addProxy = () => (configFunction) => {
  configFunction.proxy = {
    '/api/': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      pathRewrite: { '^/api': '/' },
    },
    '/code-portrait': {
      target: 'http://localhost:80',
      changeOrigin: true,
    },
  };
  return configFunction;
};

module.exports = {
  webpack: override(
    fixBabelImports('import', {
      //配置按需加载
      libraryName: 'antd',
      libraryDirectory: 'es',
      // style: true,
    }),
    addBabelPlugin([
      'prismjs',
      {
        languages: ['javascript', 'css', 'java', 'cpp'],
        plugins: [],
        theme: 'default',
        css: true,
      },
    ]),
    addLessLoader({
      javascriptEnabled: true,
    }),
    addWebpackAlias({
      '@': resolve('./src'),
      '@img': resolve('./src/img'),
      '@libs': resolve('./src/libs'),
      '@utils': resolve('./src/utils'),
      '@pages': resolve('./src/pages'),
      '@components': resolve('./src/components'),
    }),
    (config) => {
      // 修改打包路径
      paths.appBuild = resolve('./server/public');
      config.output.path = resolve('./server/public');
      return config;
    },
  ),
  devServer: overrideDevServer(addProxy()),
};

// module.exports = function override(config) {
//   config = injectBabelPlugin(
//     ['import', { libraryName: 'antd', libraryDirectory: 'es', style: 'css' }],
//     config,
//   );
//   config.module.rules.push({
//     enforce: 'pre',
//     test: /\.jsx?$/,
//     loader: 'ESLint-loader',
//     options: {
//       emitWarning: true,
//     },
//   });
//   config.resolve.alias = {
//     ...config.resolve.alias,
//     '@': resolve('./src'),
//     '@img': resolve('./src/img'),
//     '@libs': resolve('./src/libs'),
//     '@utils': resolve('./src/utils'),
//     '@pages': resolve('./src/pages'),
//     '@components': resolve('./src/components'),
//     // '@utils': path.resolve(__dirname, './src/utils'),
//   };
//   return config;
// };
