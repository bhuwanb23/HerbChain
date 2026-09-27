/**
 * Metro configuration.
 *
 * `react-native-fast-tflite` is a native-only module: its JS references a
 * TurboReactPackage codegen spec (`../spec/NativeRNTflite`) that does not
 * exist for the web platform bundle. Our TFLite wrapper
 * (services/recognition/tflite.js) already feature-detects and falls back on
 * web / Expo Go, so we simply stub the module out for web builds.
 */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const WEB_TFLITE_STUB = require.resolve('./services/recognition/tflite.web.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    (moduleName === 'react-native-fast-tflite' || moduleName.startsWith('react-native-fast-tflite/'))
  ) {
    return context.resolveRequest(
      { ...context, resolveRequest: undefined },
      WEB_TFLITE_STUB,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
