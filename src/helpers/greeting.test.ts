import {describe, expect, it} from "vitest";
import {greetingKey} from "@/helpers/greeting";

describe("greetingKey", () => {
    it("splits the day at 5, 12 and 18", () => {
        expect(greetingKey(4)).toBe("evening");
        expect(greetingKey(5)).toBe("morning");
        expect(greetingKey(11)).toBe("morning");
        expect(greetingKey(12)).toBe("afternoon");
        expect(greetingKey(17)).toBe("afternoon");
        expect(greetingKey(18)).toBe("evening");
        expect(greetingKey(23)).toBe("evening");
    });
});
