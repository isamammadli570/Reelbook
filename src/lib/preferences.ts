import {useSyncExternalStore} from "react";
import {storage} from "@/lib/storage";
import {STORAGE_KEYS} from "@/constants/other";

/** Choices that belong to this device, not the account: they stay when someone signs out. */
export type Preferences = {
    /** Vibration on taps and confirmations. */
    haptics: boolean;
    /** Blur stills and hide titles of episodes the user has not watched yet. */
    hideSpoilers: boolean;
    /** What to do with earlier unwatched episodes when a later one is marked: ask each time, or always/never mark them. */
    earlierEpisodes: "ask" | "mark" | "skip";
};

const DEFAULTS: Preferences = {haptics: true, hideSpoilers: false, earlierEpisodes: "ask"};

let current: Preferences = DEFAULTS;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

// Read once at start-up. Until it resolves the defaults apply, which matches a first launch.
void storage.get<Partial<Preferences>>(STORAGE_KEYS.PREFERENCES).then((stored) => {
    if (!stored) return;
    current = {...DEFAULTS, ...stored};
    notify();
});

/** Synchronous, for code outside React such as the haptics helper. */
export const getPreference = <K extends keyof Preferences>(key: K): Preferences[K] => current[key];

export const setPreference = <K extends keyof Preferences>(key: K, value: Preferences[K]): void => {
    current = {...current, [key]: value};
    notify();
    void storage.set(STORAGE_KEYS.PREFERENCES, current);
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

/** One preference and its setter; every screen using it updates together. */
export const usePreference = <K extends keyof Preferences>(key: K): [Preferences[K], (value: Preferences[K]) => void] => {
    const value = useSyncExternalStore(subscribe, () => current[key], () => DEFAULTS[key]);
    return [value, (next) => setPreference(key, next)];
};
