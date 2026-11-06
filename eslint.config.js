const {defineConfig} = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
    expoConfig,
    // Edge Functions run on Deno, with its own globals and imports.
    {ignores: ["dist/*", ".expo/*", "src/uniwind-types.d.ts", "supabase/functions/**"]},
]);
