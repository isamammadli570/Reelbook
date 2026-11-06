import {describe, expect, it} from "vitest";
import {mergeLibrary, type RemoteEntry} from "@/helpers/sync";
import {createLibrary, itemKey, setReview, updateItem} from "@/helpers/library";
import type {MediaSnapshot} from "@/api/library.api";

const snapshot: MediaSnapshot = {id: 1, mediaType: "movie", title: "Dune", posterPath: null, backdropPath: null, year: "2024", series: null};
const KEY = itemKey("movie", 1);
const EARLY = "2026-11-01T10:00:00.000Z";
const LATE = "2026-11-02T10:00:00.000Z";

const localWithReview = (text: string, at: string) => {
    const library = updateItem(createLibrary(), snapshot, (item) => setReview(item, text, at), at);
    return library;
};

describe("mergeLibrary", () => {
    it("keeps the newer version of a title and updates the device", () => {
        const local = localWithReview("old", EARLY);
        const remoteItem = localWithReview("new", LATE).items[KEY];
        const {library, outbox} = mergeLibrary(local, {[KEY]: {updatedAt: LATE, item: remoteItem}});
        expect(library.items[KEY].review?.text).toBe("new");
        expect(outbox).toEqual({});
    });

    it("sends a newer local change to the server", () => {
        const local = localWithReview("local", LATE);
        const remoteItem = localWithReview("old", EARLY).items[KEY];
        const {library, outbox} = mergeLibrary(local, {[KEY]: {updatedAt: EARLY, item: remoteItem}});
        expect(library.items[KEY].review?.text).toBe("local");
        expect(outbox[KEY].item?.review?.text).toBe("local");
    });

    it("adds titles that exist only on the server without pushing them back", () => {
        const remoteItem = localWithReview("from phone", LATE).items[KEY];
        const {library, outbox} = mergeLibrary(createLibrary(), {[KEY]: {updatedAt: LATE, item: remoteItem}});
        expect(library.items[KEY]).toBeDefined();
        expect(outbox).toEqual({});
    });

    it("lets a newer local deletion remove a title and tells the server", () => {
        const local = {...createLibrary(), removed: {[KEY]: LATE}};
        const remoteItem = localWithReview("old", EARLY).items[KEY];
        const {library, outbox} = mergeLibrary(local, {[KEY]: {updatedAt: EARLY, item: remoteItem}});
        expect(library.items[KEY]).toBeUndefined();
        expect(outbox[KEY]).toEqual({updatedAt: LATE, item: null});
    });

    it("applies a deletion made on another device", () => {
        const local = localWithReview("still here", EARLY);
        const remote: Record<string, RemoteEntry> = {[KEY]: {updatedAt: LATE, item: null}};
        const {library, outbox} = mergeLibrary(local, remote);
        expect(library.items[KEY]).toBeUndefined();
        expect(library.removed?.[KEY]).toBe(LATE);
        expect(outbox).toEqual({});
    });

    it("does nothing when both sides agree", () => {
        const local = localWithReview("same", EARLY);
        const remoteItem = local.items[KEY];
        const {outbox} = mergeLibrary(local, {[KEY]: {updatedAt: EARLY, item: remoteItem}});
        expect(outbox).toEqual({});
    });
});
