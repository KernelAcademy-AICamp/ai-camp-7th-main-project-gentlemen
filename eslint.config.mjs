import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // PoC와 워커는 Next ESLint 규칙 대상에서 제외(별도 런타임/스타일)
    ignores: ["poc/**", ".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
