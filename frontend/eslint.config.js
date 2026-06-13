import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tsparser,
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "@typescript-eslint": tseslint,
    },
    rules: {
      // React hooks — warnings en lugar de errors para código existente
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",

      // Variables no usadas — warnings
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

      // Desactivar reglas que generan falsos positivos
      "no-undef": "off",
      "no-console": "off",
      "no-empty": "warn",
    },
  },
  {
    ignores: ["node_modules/**", "dist/**", "build/**", "e2e/**"],
  },
];
