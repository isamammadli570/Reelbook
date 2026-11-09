import {describe, expect, it} from "vitest";
import {BACKUP_VERSION, createBackup, parseBackup, hasProfile, prepareRestore} from "@/helpers/backup";
import {createListsStore} from "@/helpers/lists";
import {createLibrary} from "@/helpers/library";
import type {Profile} from "@/api/profile.api";

const NOW = "2026-11-05T20:00:00.000Z";
const PROFILE: Profile = {name: "İsa", username: "isa", bio: "Film", coverPath: "/cover.jpg", coverUrl: null, avatarColor: "teal", avatarUrl: null, shareActivity: true, updatedAt: "2026-11-01T10:00:00.000Z"};

describe("backup round trip", () => {
    it("reads back what was exported", () => {
        const library = createLibrary();
        const lists = createListsStore();
        const text = JSON.stringify(createBackup(library, lists, PROFILE, NOW));
        expect(parseBackup(text)).toEqual({version: BACKUP_VERSION, exportedAt: NOW, library, lists, profile: PROFILE});
    });
});

describe("parseBackup", () => {
    it("refuses text that is not JSON", () => {
        expect(parseBackup("not json")).toBeNull();
    });

    it("refuses other versions and missing parts", () => {
        expect(parseBackup(JSON.stringify({version: 99, library: {items: {}}, profile: {}}))).toBeNull();
        expect(parseBackup(JSON.stringify({version: BACKUP_VERSION, profile: {}}))).toBeNull();
        expect(parseBackup(JSON.stringify({version: BACKUP_VERSION, library: {items: {}}}))).toBeNull();
    });

    it("fills missing profile fields with defaults, so older backups still import", () => {
        const backup = parseBackup(JSON.stringify({version: BACKUP_VERSION, library: {items: {}}, profile: {name: 5}}));
        expect(backup?.profile).toEqual({name: "", username: "", bio: "", coverPath: null, coverUrl: null, avatarColor: "amber", avatarUrl: null, shareActivity: true, updatedAt: ""});
    });
});

describe("lists in a backup", () => {
    const LIST = {id: "a", name: "Weekend", description: "", entries: [], createdAt: NOW, updatedAt: NOW};

    it("reads a version 1 backup without lists, so the lists on the device stay", () => {
        const backup = parseBackup(JSON.stringify({version: 1, library: {items: {}}, profile: {}}));
        expect(backup?.lists).toBeNull();
    });

    it("drops damaged lists and entries but keeps the rest", () => {
        const entry = {key: "movie:1", id: 1, mediaType: "movie", title: "A", posterPath: null, backdropPath: null, year: "2020", addedAt: NOW};
        const text = JSON.stringify({version: BACKUP_VERSION, library: {items: {}}, profile: {}, lists: {lists: {a: {...LIST, entries: [entry, {bad: true}]}, b: {name: 5}}}});
        expect(Object.keys(parseBackup(text)?.lists?.lists ?? {})).toEqual(["a"]);
        expect(parseBackup(text)?.lists?.lists.a.entries).toEqual([entry]);
    });
});

describe("prepareRestore", () => {
    const LATER = "2026-12-01T00:00:00.000Z";
    const LIST = {id: "a", name: "Weekend", description: "", entries: [], createdAt: NOW, updatedAt: NOW};
    const backup = {...createBackup({items: {}, removed: {}}, {lists: {a: LIST}, removed: {}}, PROFILE, NOW)};
    const item = (updatedAt: string) => ({updatedAt}) as never;

    it("stamps restored records with the restore time and marks what the backup lacks as deleted", () => {
        const current = {library: {items: {gone: item(NOW)}, removed: {}}, lists: {lists: {old: {...LIST, id: "old"}}, removed: {}}};
        const result = prepareRestore(backup, current, LATER);
        expect(result.lists?.lists.a.updatedAt).toBe(LATER);
        expect(result.lists?.removed).toEqual({old: LATER});
        expect(result.library.removed).toEqual({gone: LATER});
    });

    it("leaves the lists alone for a backup without them", () => {
        const result = prepareRestore({...backup, lists: null}, {library: {items: {}, removed: {}}, lists: createListsStore()}, LATER);
        expect(result.lists).toBeNull();
    });
});

describe("hasProfile", () => {
    it("tells a real profile from the empty one a converted backup carries", () => {
        expect(hasProfile(PROFILE)).toBe(true);
        expect(hasProfile({...PROFILE, name: "", username: "", bio: "", coverPath: null})).toBe(false);
    });
});
