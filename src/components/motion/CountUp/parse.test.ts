import {describe, expect, it, vi} from "vitest";

// The component itself needs React Native; only the parser is under test here.
vi.mock("react-native", () => ({Text: () => null}));
vi.mock("react-native-reanimated", () => ({useReducedMotion: () => false}));

const {parsePlainNumber} = await import("@/components/motion/CountUp");

describe("parsePlainNumber", () => {
    it("reads whole and decimal numbers with their precision", () => {
        expect(parsePlainNumber("1999")).toEqual({value: 1999, decimals: 0});
        expect(parsePlainNumber(" 8.4 ")).toEqual({value: 8.4, decimals: 1});
    });

    it("leaves anything with units, words or grouping as text", () => {
        expect(parsePlainNumber("2 s 19 dəq")).toBeNull();
        expect(parsePlainNumber("—")).toBeNull();
        expect(parsePlainNumber("1,091")).toBeNull();
    });
});
