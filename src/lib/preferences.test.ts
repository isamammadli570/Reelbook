import {beforeEach, describe, expect, it, vi} from "vitest";

const stored = vi.hoisted(() => ({value: null as unknown, writes: [] as unknown[]}));

vi.mock("@/lib/storage", () => ({
    storage: {
        get: async () => stored.value,
        set: async (_key: string, value: unknown) => {
            stored.writes.push(value);
            return true;
        },
    },
}));

/** Fresh module per test, since it reads storage once when first imported. */
const load = async () => {
    vi.resetModules();
    const module = await import("@/lib/preferences");
    // Let the start-up read settle.
    await new Promise((resolve) => setTimeout(resolve, 0));
    return module;
};

beforeEach(() => {
    stored.value = null;
    stored.writes = [];
});

describe("preferences", () => {
    it("starts from the defaults on a first launch", async () => {
        const {getPreference} = await load();
        expect(getPreference("haptics")).toBe(true);
        expect(getPreference("hideSpoilers")).toBe(false);
    });

    it("keeps stored choices and fills in ones added since", async () => {
        stored.value = {hideSpoilers: true};
        const {getPreference} = await load();
        expect(getPreference("hideSpoilers")).toBe(true);
        expect(getPreference("haptics")).toBe(true);
    });

    it("applies a change at once and saves every preference together", async () => {
        const {getPreference, setPreference} = await load();
        setPreference("haptics", false);
        expect(getPreference("haptics")).toBe(false);
        expect(stored.writes.at(-1)).toEqual({haptics: false, hideSpoilers: false});
    });
});
