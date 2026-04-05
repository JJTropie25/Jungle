const fs = require("fs");
const path = require("path");

const appJsonPath = path.join(__dirname, "app.json");
const raw = fs.readFileSync(appJsonPath, "utf8");
const { expo } = JSON.parse(raw);

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

module.exports = {
  ...expo,
  ios: {
    ...expo.ios,
    config: {
      ...(expo.ios?.config ?? {}),
      googleMapsApiKey,
    },
  },
  android: {
    ...expo.android,
    config: {
      ...(expo.android?.config ?? {}),
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  },
};
