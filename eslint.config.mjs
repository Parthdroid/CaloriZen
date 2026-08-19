import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const typescriptSources = [
  "artifacts/api-server/src/**/*.{ts,tsx}",
  "artifacts/mobile/app/**/*.{ts,tsx}",
  "artifacts/mobile/context/**/*.{ts,tsx}",
  "artifacts/mobile/lib/**/*.{ts,tsx}",
  "artifacts/landing/src/pages/**/*.{ts,tsx}",
  "lib/db/src/**/*.{ts,tsx}",
  "lib/integrations-openai-ai-server/src/**/*.{ts,tsx}",
];

export default [
  {
    ignores: [
      "**/dist/**",
      "**/generated/**",
      "**/node_modules/**",
      "**/Pods/**",
    ],
  },
  {
    files: typescriptSources,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "constructor-super": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "for-direction": "error",
      "getter-return": "error",
      "no-async-promise-executor": "error",
      "no-constant-binary-expression": "error",
      "no-debugger": "error",
      "no-dupe-args": "error",
      "no-dupe-class-members": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-new-native-nonconstructor": "error",
      "no-promise-executor-return": "error",
      "no-self-assign": "error",
      "no-setter-return": "error",
      "no-unexpected-multiline": "error",
      "no-unreachable": "error",
      "no-unreachable-loop": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error",
      "no-unused-private-class-members": "error",
      "no-useless-assignment": "error",
      "no-var": "error",
      "prefer-const": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: [
      "artifacts/mobile/app/**/*.{ts,tsx}",
      "artifacts/mobile/context/**/*.{ts,tsx}",
      "artifacts/landing/src/pages/**/*.{ts,tsx}",
    ],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",
    },
  },
];
