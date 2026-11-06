import {describe, expect, it} from "vitest";
import {translateGenre} from "@/helpers/genres";

describe("translateGenre", () => {
    it("translates TMDB's English names into Azerbaijani and Russian", () => {
        expect(translateGenre("Science Fiction", "az")).toBe("Elmi fantastika");
        expect(translateGenre("Horror", "ru")).toBe("Ужасы");
    });

    it("keeps English as is, and names it does not know", () => {
        expect(translateGenre("Mystery", "en")).toBe("Mystery");
        expect(translateGenre("Детектив", "ru")).toBe("Детектив");
        expect(translateGenre("Anime", "az")).toBe("Anime");
    });
});
