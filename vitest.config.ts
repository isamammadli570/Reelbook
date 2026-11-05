import {fileURLToPath} from "node:url";
import {defineConfig} from "vitest/config";

// Only pure helpers are unit-tested, so the node environment is enough.
export default defineConfig({
    resolve: {alias: {"@": fileURLToPath(new URL("./src", import.meta.url))}},
    test: {globals: true, environment: "node", include: ["src/**/*.test.ts"]},
});
