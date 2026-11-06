import {describe, expect, it} from "vitest";
import {isValidUsername, normalizeUsername} from "@/helpers/username";

describe("normalizeUsername", () => {
    it("trims, drops a leading @ and lowercases", () => {
        expect(normalizeUsername("  @Isa_M ")).toBe("isa_m");
    });
});

describe("isValidUsername", () => {
    it("accepts 3 to 20 letters, digits and underscores", () => {
        expect(isValidUsername("isa")).toBe(true);
        expect(isValidUsername("film_lover_2026")).toBe(true);
        expect(isValidUsername("@Isa")).toBe(true);
    });

    it("rejects short, long and unsafe names", () => {
        expect(isValidUsername("is")).toBe(false);
        expect(isValidUsername("a".repeat(21))).toBe(false);
        expect(isValidUsername("isa m")).toBe(false);
        expect(isValidUsername("isə")).toBe(false);
    });
});
