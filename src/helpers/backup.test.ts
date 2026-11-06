import {describe, expect, it} from "vitest";
import {BACKUP_VERSION, createBackup, parseBackup} from "@/helpers/backup";
import {createLibrary} from "@/helpers/library";
import type {Profile} from "@/api/profile.api";

const NOW = "2026-11-05T20:00:00.000Z";
const PROFILE: Profile = {name: "İsa", username: "isa", bio: "Film", coverPath: "/cover.jpg", coverUrl: null, avatarColor: "teal", avatarUrl: null};

describe("backup round trip", () => {
    it("reads back what was exported", () => {
        const library = createLibrary();
        const text = JSON.stringify(createBackup(library, PROFILE, NOW));
        expect(parseBackup(text)).toEqual({version: BACKUP_VERSION, exportedAt: NOW, library, profile: PROFILE});
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
        expect(backup?.profile).toEqual({name: "", username: "", bio: "", coverPath: null, coverUrl: null, avatarColor: "amber", avatarUrl: null});
    });
});
