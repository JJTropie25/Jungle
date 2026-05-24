const fs = require("fs");
const path = require("path");

const appJsonPath = path.join(__dirname, "app.json");
const raw = fs.readFileSync(appJsonPath, "utf8");
const { expo } = JSON.parse(raw);

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const localGoogleServicesPath = path.join(__dirname, "google-services.json");
const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ||
  (fs.existsSync(localGoogleServicesPath) ? "./google-services.json" : undefined);

const androidConfig = {
  ...expo.android,
  config: {
    ...(expo.android?.config ?? {}),
    googleMaps: {
      apiKey: googleMapsApiKey,
    },
  },
};

if (googleServicesFile) {
  androidConfig.googleServicesFile = googleServicesFile;
}

module.exports = {
  ...expo,
  ios: {
    ...expo.ios,
    config: {
      ...(expo.ios?.config ?? {}),
      googleMapsApiKey,
    },
  },
  android: androidConfig,
};
