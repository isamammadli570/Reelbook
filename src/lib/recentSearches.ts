import {useSyncExternalStore} from "react";
import {storage} from "@/lib/storage";
import {addRecentSearch, removeRecentSearch} from "@/helpers/recentSearches";
import {STORAGE_KEYS} from "@/constants/other";

/**
 * The last searches on Discover, kept on this device only. Like preferences, every screen reading them
 * updates together; unlike preferences they are personal, so signing out clears them.
 */
let current: string[] = [];
const listeners = new Set<() => void>();
const EMPTY: string[] = [];

const update = (next: string[]) => {
    current = next;
    listeners.forEach((listener) => listener());
    void storage.set(STORAGE_KEYS.RECENT_SEARCHES, current);
};

void storage.get<string[]>(STORAGE_KEYS.RECENT_SEARCHES).then((stored) => {
    if (!Array.isArray(stored)) return;
    current = stored.filter((entry): entry is string => typeof entry === "string");
    listeners.forEach((listener) => listener());
});

export const rememberSearch = (term: string): void => {
    const next = addRecentSearch(current, term);
    if (next !== current && next.join("\n") !== current.join("\n")) update(next);
};

export const forgetSearch = (term: string): void => update(removeRecentSearch(current, term));

export const clearRecentSearches = (): void => update([]);

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const useRecentSearches = (): string[] => useSyncExternalStore(subscribe, () => current, () => EMPTY);
