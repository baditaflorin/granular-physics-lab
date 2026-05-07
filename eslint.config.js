import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "docs/assets/**",
      "docs/index.html",
      "docs/404.html",
      "docs/sw.js",
      "node_modules/**",
      "coverage/**",
      "public/wasm/**",
      "playwright-report/**",
      "test-results/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
    }
  }
];
