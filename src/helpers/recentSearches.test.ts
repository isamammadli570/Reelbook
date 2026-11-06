import {describe, expect, it} from "vitest";
import {addRecentSearch, removeRecentSearch} from "@/helpers/recentSearches";

describe("recent searches", () => {
    it("puts the newest first and keeps one of each, whatever the case", () => {
        expect(addRecentSearch(["dune", "heat"], "Heat")).toEqual(["Heat", "dune"]);
        expect(addRecentSearch(["dune"], "  christopher   nolan ")).toEqual(["christopher nolan", "dune"]);
    });

    it("ignores blank terms and keeps only the last few", () => {
        expect(addRecentSearch(["dune"], "   ")).toEqual(["dune"]);
        expect(addRecentSearch(["a1", "a2", "a3"], "a4", 3)).toEqual(["a4", "a1", "a2"]);
    });

    it("removes one entry", () => {
        expect(removeRecentSearch(["dune", "heat"], "dune")).toEqual(["heat"]);
    });
});
