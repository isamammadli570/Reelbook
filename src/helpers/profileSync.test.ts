import {describe, expect, it} from "vitest";
import {EMPTY_PROFILE, type Profile} from "@/api/profile.api";
import {mergeProfile} from "@/helpers/profileSync";

const NOW = "2026-11-07T12:00:00.000Z";
const noAccount = {username: null, name: null, avatarUrl: null};
const profile = (overrides: Partial<Profile>): Profile => ({...EMPTY_PROFILE, ...overrides});

describe("mergeProfile", () => {
    it("takes a newer edit from another device instead of uploading this device's old copy", () => {
        // The reported bug: the computer still had "Old name" and overwrote the phone's edit on start.
        const computer = profile({name: "Old name", username: "isa", updatedAt: "2026-11-01T10:00:00.000Z"});
        const server = profile({name: "New name", username: "isa_m", bio: "Films", updatedAt: "2026-11-06T10:00:00.000Z"});
        expect(mergeProfile(computer, server, noAccount, NOW)).toEqual({profile: server, shouldPush: false, changed: true});
    });

    it("uploads this device's edit when it is the newer one", () => {
        const phone = profile({name: "New name", updatedAt: "2026-11-06T10:00:00.000Z"});
        const server = profile({name: "Old name", updatedAt: "2026-11-01T10:00:00.000Z"});
        expect(mergeProfile(phone, server, noAccount, NOW)).toEqual({profile: phone, shouldPush: true, changed: false});
    });

    it("does nothing when both sides hold the same edit", () => {
        const same = profile({name: "Isa", updatedAt: "2026-11-06T10:00:00.000Z"});
        expect(mergeProfile(same, {...same}, noAccount, NOW)).toEqual({profile: same, shouldPush: false, changed: false});
    });

    it("treats a profile saved before edit times existed as the older one", () => {
        const legacy = profile({name: "Stale", updatedAt: ""});
        const server = profile({name: "Fresh", updatedAt: "2026-11-06T10:00:00.000Z"});
        expect(mergeProfile(legacy, server, noAccount, NOW).profile.name).toBe("Fresh");
    });

    it("creates the server copy when there is none", () => {
        const local = profile({name: "Isa", updatedAt: "2026-11-06T10:00:00.000Z"});
        expect(mergeProfile(local, null, noAccount, NOW)).toMatchObject({shouldPush: true, changed: false});
    });

    it("fills a never-edited profile from the account and passes it on as an edit", () => {
        const result = mergeProfile(EMPTY_PROFILE, null, {username: "isa", name: "İsa Məmmədli", avatarUrl: "https://photo"}, NOW);
        expect(result.profile).toMatchObject({username: "isa", name: "İsa Məmmədli", avatarUrl: "https://photo", updatedAt: NOW});
        expect(result).toMatchObject({shouldPush: true, changed: true});
    });

    it("never lets the account overwrite something the person set", () => {
        const edited = profile({name: "My own name", updatedAt: "2026-11-06T10:00:00.000Z"});
        expect(mergeProfile(edited, null, {username: "x", name: "Google name", avatarUrl: null}, NOW).profile.name).toBe("My own name");
    });
});
