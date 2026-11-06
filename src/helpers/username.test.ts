import {describe, expect, it} from "vitest";
import {isValidUsername, normalizeUsername, suggestUsername} from "@/helpers/username";

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

describe("suggestUsername", () => {
    it("makes a handle from the name, in Latin letters", () => {
        expect(suggestUsername("İsa Məmmədli", "x@gmail.com")).toBe("isa_memmedli");
        expect(suggestUsername("Анна Каренина", null)).toBe("anna_karenina");
        expect(suggestUsername("Zoë O'Brien", null)).toBe("zoe_o_brien");
    });

    it("falls back to the email, and keeps within 20 characters", () => {
        expect(suggestUsername("", "isa.m+films@gmail.com")).toBe("isa_m_films");
        expect(suggestUsername("A", "jo@x.com")).toBe("");
        expect(suggestUsername("Maximilian Alexander Longname", null)).toBe("maximilian_alexander");
    });

    it("always suggests something the rules accept", () => {
        ["İsa Məmmədli", "Анна", "Zoë O'Brien", "Maximilian Alexander Longname"].forEach((name) => {
            const handle = suggestUsername(name, "someone@mail.com");
            expect(isValidUsername(handle)).toBe(true);
        });
    });
});
