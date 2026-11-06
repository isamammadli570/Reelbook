import {describe, expect, it} from "vitest";
import {createList, createListsStore, deleteList, listIdsContaining, removeListEntry, restoreListEntry, sortedLists, toggleListEntry, updateListDetails} from "@/helpers/lists";
import type {MediaSnapshot} from "@/api/library.api";

const T1 = "2026-11-06T10:00:00.000Z";
const T2 = "2026-11-06T11:00:00.000Z";
const T3 = "2026-11-06T12:00:00.000Z";

const dune: MediaSnapshot = {id: 1, mediaType: "movie", title: "Dune", posterPath: "/dune.jpg", backdropPath: null, year: "2024", series: null};
const dark: MediaSnapshot = {id: 2, mediaType: "tv", title: "Dark", posterPath: null, backdropPath: null, year: "2017", series: null};

describe("lists", () => {
    it("creates a list with trimmed details", () => {
        const store = createList(createListsStore(), "a", {name: "  Best sci-fi ", description: " Space "}, T1);
        expect(store.lists.a).toMatchObject({name: "Best sci-fi", description: "Space", entries: [], createdAt: T1, updatedAt: T1});
    });

    it("adds titles at the top and removes them on a second toggle", () => {
        let store = createList(createListsStore(), "a", {name: "Mix", description: ""}, T1);
        store = toggleListEntry(store, "a", dune, T2);
        store = toggleListEntry(store, "a", dark, T3);
        expect(store.lists.a.entries.map((entry) => entry.key)).toEqual(["tv:2", "movie:1"]);
        expect(store.lists.a.updatedAt).toBe(T3);

        store = toggleListEntry(store, "a", dune, T3);
        expect(store.lists.a.entries.map((entry) => entry.key)).toEqual(["tv:2"]);
    });

    it("removes one entry by key and edits details", () => {
        let store = toggleListEntry(createList(createListsStore(), "a", {name: "Mix", description: ""}, T1), "a", dune, T1);
        store = removeListEntry(store, "a", "movie:1", T2);
        store = updateListDetails(store, "a", {name: "Renamed", description: "New"}, T3);
        expect(store.lists.a).toMatchObject({name: "Renamed", description: "New", entries: [], updatedAt: T3});
    });

    it("deletes with a tombstone and recreating clears it", () => {
        let store = deleteList(createList(createListsStore(), "a", {name: "Mix", description: ""}, T1), "a", T2);
        expect(store.lists.a).toBeUndefined();
        expect(store.removed?.a).toBe(T2);

        store = createList(store, "a", {name: "Again", description: ""}, T3);
        expect(store.removed?.a).toBeUndefined();
    });

    it("finds the lists holding a title and sorts by last change", () => {
        let store = createList(createListsStore(), "a", {name: "A", description: ""}, T1);
        store = createList(store, "b", {name: "B", description: ""}, T2);
        store = toggleListEntry(store, "a", dune, T3);
        expect([...listIdsContaining(store, "movie:1")]).toEqual(["a"]);
        expect(sortedLists(store).map((list) => list.id)).toEqual(["a", "b"]);
    });

    it("ignores changes to a list that does not exist", () => {
        const store = createListsStore();
        expect(toggleListEntry(store, "missing", dune, T1)).toBe(store);
        expect(deleteList(store, "missing", T1)).toBe(store);
    });
});

describe("restoreListEntry", () => {
    it("puts a removed title back at its old place with its original date", () => {
        let store = createList(createListsStore(), "a", {name: "Weekend", description: ""}, T1);
        store = toggleListEntry(store, "a", dune, T1);
        store = toggleListEntry(store, "a", dark, T2);
        const before = store.lists.a.entries;
        const removed = before[1];
        const after = restoreListEntry(removeListEntry(store, "a", removed.key, T3), "a", removed, 1, T3);
        expect(after.lists.a.entries).toEqual(before);
    });
});
