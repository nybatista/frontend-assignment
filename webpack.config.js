const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

let _defaultAssetsDirName = "assets";
const port = 8085;

let mode;
let _isProduction;
let _buildType;

// USE "/./" FOR ROOT DOMAIN OR "./" FOR RELATIVE DOMAIN PATHS"
let _relativeRoot = "./"


let _publicPath;
let _staticPublicPath
let _assetsFolder;
let _imgPath;
let _staticDir;
let _fontsDir;
let _grp;


const shell = require('child_process').execSync ;


const copyDir = (srcDirectory, destDirectory)=>{
  const P = {
    src: path.resolve(__dirname, srcDirectory)
  };

  shell(`mkdir -p ${destDirectory}`);
  shell(`cp -r ${P.src}/* ${destDirectory}`);
};




module.exports = (env={mode:"development"})=> {

  /**
   *
   * ADD ASSETS_DIR="/dam/project/"
   * TODO: _imgPath, _staticDIr, _fontsDir all EQUALS ASSETS_DIR if ASSETS_DIR exists
   *
   *
   * */


  _defaultAssetsDirName = process.env.DAM || _defaultAssetsDirName;
  _relativeRoot = process.env.DAM !== undefined ? "" : _relativeRoot;

  mode =           env.mode || 'development';

      console.log("PROCESS ENV IS ",process.env.DAM);

  _grp = env.grp || 'iwm';
  _isProduction =   env.build === true;
  _buildType =      process.env.buildType;
  _publicPath =     _isProduction ?  _relativeRoot : "/";
  _staticPublicPath =     _isProduction ?  "/" : "/";
  _assetsFolder =   _isProduction ? `${_defaultAssetsDirName}/` : "";
  _imgPath =        `${_staticPublicPath}${_assetsFolder}static/imgs/`;
  _staticDir =        `${_publicPath}${_assetsFolder}static/`;
  _fontsDir =        `${_publicPath}${_assetsFolder}static/fonts/`;
  const sassStaticDir = _isProduction ? `././../static/` : "./static/";


  //_assetsFolder = process.env.DAM || _assetsFolder;
  console.log("GROUP IS1 ",env.grp, '\n',{_grp, env}, _assetsFolder);



  const config = {
    mode,

    entry: {
      index: './src/index.js'
    },

    output: {
      filename: `${_assetsFolder}js/[name].js`,
      publicPath: _publicPath,
      clean: true
    },

    devtool:  _isProduction ? 'cheap-source-map' : 'cheap-source-map',

    devServer: {
      static: {
        directory: 'src',
      },
      historyApiFallback: true,
      port
    },

    plugins:  getWebpackPlugins(),

    optimization: {
      splitChunks: {
        cacheGroups: {
          common: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendor",
            chunks: 'all',
          }
        },
      }
    },

    module: {
      rules: [

        {
          test: /\.html$/,
          loader: "html-loader",
          options: {
            minimize: false,
            esModule: false,
          }
        },

        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            _isProduction !== true ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader', options :{
                sourceMap: true,
                url: false
              }
            },

            {
              loader: 'sass-loader', options: {
                sourceMap: true,
                implementation: require.resolve("sass"),
                additionalData: "$STATIC_DIR: " + JSON.stringify(sassStaticDir)+ ";",
                sassOptions: {
                  fiber: false,
                  includePaths: [
                    `${_assetsFolder}static/fonts/`
                  ]
                }

              },
            }
          ]
        },

        {
          test: /\.(ttf|woff|woff2)$/i,
          type: "asset/resource",
          generator: {
            filename: `${_assetsFolder}static/fonts/[name][ext][query]`
          }
        },

        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: "asset/resource",
          generator: {
            filename: `${_assetsFolder}static/imgs/[name][ext][query]`
          }
        },

        {
          test: /\.(json|csv)$/,
          type: 'javascript/auto',
          use: [
            {
              loader: 'file-loader',
              options: {
                name: `${_assetsFolder}static/data/[name].[ext]`
              },
            }]
        }

      ]
    },

    resolve: {
      alias: {
        plugins: path.resolve(__dirname, 'src/plugins/'),
        imgs: path.resolve(__dirname, 'src/static/imgs/'),
        fonts: path.resolve(__dirname, 'src/static/fonts/'),
        data: path.resolve(__dirname, '/./src/static/data/'),
        css: path.resolve(__dirname, 'src/css/'),
        core: path.resolve(__dirname, 'src/core/'),
        traits: path.resolve(__dirname, 'src/app/traits/'),
        utils: path.resolve(__dirname, 'src/app/utils/'),
        channels: path.resolve(__dirname, 'src/app/channels/'),
        components: path.resolve(__dirname, 'src/app/components/'),
        node_modules: path.resolve(__dirname, 'node_modules/')

      },

      extensions: ['.js', '.css'],
    }
  };

  return config;

}


const getWebpackPlugins = ()=> {

  const providePlugin = new webpack.ProvidePlugin({
    R: 'ramda',
    Popper: "@popperjs/core",
  })



  const miniCssPlugin = ()=> {
    return new MiniCssExtractPlugin({
      filename: `${_assetsFolder}css/main.css`
    });
  }

  const definePlugin = new webpack.DefinePlugin({
    "IMG_PATH": JSON.stringify(_imgPath),
    'NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    "IMAGES_DIR": JSON.stringify(_imgPath),
    "DEV_MODE"  : JSON.stringify(_isProduction === false),
    "STATIC_DIR": JSON.stringify(_staticDir),
    "FONTS_DIR": JSON.stringify(_fontsDir),
    "SITE_GROUP" : JSON.stringify(_grp)


  });

  const htmlPlugin = new HtmlWebpackPlugin({
    template: './src/index.tmpl.html',
    minify: false
  });

  const getCopyPatternsPlugin = () => {
    const patterns = [
      {from: "./src/static/imgs", to: `${_assetsFolder}static/imgs`}
    ]

    if (_buildType === 'apache') {
      patterns.push(
          {from: "./apache-htaccess", to: ".htaccess", toType: "file"})
    }

    return new CopyWebpackPlugin({patterns})
  }



  const ProgressHookPlugin = new webpack.ProgressPlugin(function(percentage, msg) {
    if (percentage===0){
      // pre-hook code (before webpack compiles )
    } else if (percentage===1){
      // post-hook code (after webpack compiles )
      copyDir('./src/static/fonts/', './dist/'+ _assetsFolder+'/static/fonts/');

    }
  });





  return _isProduction ?
      [htmlPlugin, definePlugin, providePlugin, miniCssPlugin(), getCopyPatternsPlugin(), ProgressHookPlugin] :
      [htmlPlugin, definePlugin, providePlugin];

}
