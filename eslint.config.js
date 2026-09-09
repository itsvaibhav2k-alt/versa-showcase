// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/*",
      "supabase/functions/**",
      "coverage/**",
      "e2e/**",
    ],
  },
  {
    files: ["src/**/__tests__/**"],
    rules: {
      "import/first": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);
