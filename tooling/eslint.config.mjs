import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  globalIgnores([
    "../.next/**",
    "../.open-next/**",
    "../dist/**",
    "../.corepack/**",
    "../.npm-cache/**",
    "../.pnpm-store/**",
    "../coverage/**",
    "../playwright-report/**",
    "../test-results/**",
    "../tests/vite-windows-sandbox.cjs",
  ]),
]);
