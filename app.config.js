// Injects the Mapbox download token from the environment (.env.local) at build
// time, so no secret is ever committed. The rest of the config stays in app.json.
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []).filter((p) => (Array.isArray(p) ? p[0] : p) !== '@rnmapbox/maps'),
    ['@rnmapbox/maps', { RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN }],
  ],
});
