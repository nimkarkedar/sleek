// Extends app.json — only used to set a base path when building for GitHub Pages, since a
// project site is served from /sleek/ instead of the domain root. Local dev (`npm run web`)
// never sets GH_PAGES_BASE_PATH, so it's a no-op there.
const basePath = process.env.GH_PAGES_BASE_PATH || undefined;

module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: basePath,
  },
});
