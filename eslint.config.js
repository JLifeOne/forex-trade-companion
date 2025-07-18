
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "backend/functions/dist/**",
      "backend/functions/lib/**",
      "backend/functions/node_modules.old/**",
      "my-vite-app/**"
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: pluginReact,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...pluginReact.configs["jsx-runtime"].rules,
    },
  },
  ...tseslint.configs.recommended,
);
