import {describe, expect, it} from "vitest";
import {careerCredits, filmography, knownFor, personAge} from "@/helpers/person";
import type {PersonCredit, PersonDetails} from "@/api/people.api";

const credit = (overrides: Partial<PersonCredit> & Pick<PersonCredit, "id" | "media_type">): PersonCredit => ({
    poster_path: "/p.jpg",
    backdrop_path: null,
    vote_count: 10,
    vote_average: 7,
    ...overrides,
});

const person = (cast: PersonCredit[], crew: PersonCredit[] = [], department = "Acting"): PersonDetails => ({
    id: 1,
    name: "Adam Scott",
    profile_path: null,
    known_for_department: department,
    biography: "",
    birthday: "1973-04-03",
    deathday: null,
    place_of_birth: null,
    combined_credits: {cast, crew},
});

describe("personAge", () => {
    const today = new Date(2026, 10, 6);

    it("counts whole years, before and after this year's birthday", () => {
        expect(personAge("1973-04-03", null, today)).toBe(53);
        expect(personAge("1973-12-25", null, today)).toBe(52);
    });

    it("stops at the day they died and needs a birthday", () => {
        expect(personAge("1940-10-09", "1980-12-08", today)).toBe(40);
        expect(personAge(null, null, today)).toBeNull();
    });
});

describe("careerCredits", () => {
    it("uses acting roles for actors and crew work for directors", () => {
        const acted = credit({id: 1, media_type: "movie", character: "Mark"});
        const directed = credit({id: 2, media_type: "movie", job: "Director"});
        expect(careerCredits(person([acted], [directed]))).toEqual([acted]);
        expect(careerCredits(person([acted], [directed], "Directing"))).toEqual([directed]);
    });
});

describe("knownFor", () => {
    it("ranks by votes, drops repeats, posterless titles and appearances as themselves", () => {
        const credits = [
            credit({id: 1, media_type: "tv", character: "Mark", vote_count: 500}),
            credit({id: 1, media_type: "tv", character: "Mark (voice)", vote_count: 500}),
            credit({id: 2, media_type: "movie", character: "Ben", vote_count: 900}),
            credit({id: 3, media_type: "tv", character: "Self", vote_count: 5000}),
            credit({id: 4, media_type: "movie", character: "Guest", vote_count: 800, poster_path: null}),
        ];
        expect(knownFor(person(credits)).map((item) => item.id)).toEqual([2, 1]);
    });
});

describe("filmography", () => {
    it("keeps one row per title with every role, undated first, then newest", () => {
        const credits = [
            credit({id: 1, media_type: "movie", title: "Old", release_date: "2001-05-01", character: "A"}),
            credit({id: 2, media_type: "movie", title: "New", release_date: "2024-02-01", character: "B"}),
            credit({id: 2, media_type: "movie", title: "New", release_date: "2024-02-01", character: "C"}),
            credit({id: 3, media_type: "movie", title: "Announced", release_date: "", character: "D"}),
            credit({id: 4, media_type: "tv", name: "Show", first_air_date: "2022-02-17", character: "E"}),
        ];
        const movies = filmography(credits, "movie");
        expect(movies.map((entry) => entry.credit.id)).toEqual([3, 2, 1]);
        expect(movies[1].roles).toEqual(["B", "C"]);
        expect(filmography(credits, "tv").map((entry) => entry.credit.id)).toEqual([4]);
    });
});
