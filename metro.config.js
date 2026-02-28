const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};

config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg"
);
config.resolver.sourceExts = Array.from(
  new Set([...config.resolver.sourceExts, "svg", "mjs"])
);
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
