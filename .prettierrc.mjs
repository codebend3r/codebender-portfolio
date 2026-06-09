/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  arrowParens: "always",
  importOrder: [
    "^(react/(.*)$)|^(react$)",
    "^(next/(.*)$)|^(next$)",
    "<THIRD_PARTY_MODULES>",
    "^@assets/(.*)$",
    "^@axios/(.*)$",
    "^@components/(.*)$",
    "^@data/(.*)$",
    "^@fetcher/(.*)$",
    "^@hooks/(.*)$",
    "^@pages/(.*)$",
    "^@pdf(/.*)?$",
    "^@sky$",
    "^@state/(.*)$",
    "^@utils/(.*)$",
    "^@styles/(.*)$",
    "^@app/(.*)$",
    "^types$",
    "^[./]",
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  printWidth: 80,
  semi: false,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  useTabs: false,
}

export default config
