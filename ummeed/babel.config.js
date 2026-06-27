module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 (SDK 54) uses react-native-worklets for the babel plugin.
    plugins: ['react-native-worklets/plugin'],
  };
};
