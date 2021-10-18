// eslint-disable-next-line @typescript-eslint/no-var-requires
const { GenerateSW } = require('workbox-webpack-plugin');

module.exports = {
  // publicPath: process.env.NODE_ENV === 'development' ? '/vuejs-pwa/' : '',
  configureWebpack: {
    plugins: [/*
    new InjectManifest({
      swSrc: './src/sw.js',
      mode: process.env.NODE_ENV,
    })
    */
      new GenerateSW({
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      })],
  },

  transpileDependencies: [
    'vuetify',
  ],

  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'lang',
      enableInSFC: false,
    },
  },
};

/*

module.exports = {
  transpileDependencies: [
    'vuetify',
  ],
  pwa: {
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: 'public/sw.js',
    },
    name: 'Busket',
    themeColor: '#01916D',
    msTileColor: '#01916D',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: '#01916D',
    iconPaths: {
      favicon32: 'src/assets/pwa/icon-32x32.png',
      favicon16: 'src/assets/pwa/icon-16x16.png',
      appleTouchIcon: 'src/assets/pwa/icon-152x152.png',
      maskIcon: 'src/assets/pwa/icon-512x512.png',
      msTileImage: 'src/assets/pwa/icon-144x144.png',
    },
    manifestOptions: {
      start_url: '/',
      shortcuts: [{
        name: 'View my lists',
        short_name: 'My lists',
        url: '/me/lists',
        icons: [
          {
            src: 'src/assets/pwa/list-icon-96x96.png',
            sizes: '96x96',
          },
          {
            src: 'src/assets/pwa/list-icon-192x192.png',
            sizes: '192x192',
          },
        ],
      }],
      description: 'A free and reliable digital shopping list',
      icons: [
        {
          src: 'src/assets/pwa/icon-16x16.png',
          sizes: '16x16',
          type: 'image/png',
        },
        {
          src: 'src/assets/pwa/icon-32x32.png',
          sizes: '32x32',
          type: 'image/png',
        },
        {
          src: 'src/assets/pwa/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
        },
        {
          src: 'src/assets/pwa/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
        },
        {
          src: 'src/assets/pwa/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: 'src/assets/pwa/icon-512x512.png',
          purpose: 'maskable',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
  },
  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'lang',
      enableInSFC: false,
    },
  },
};
*/
