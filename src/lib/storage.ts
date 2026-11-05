import AsyncStorage from "@react-native-async-storage/async-storage";

/** AsyncStorage wrappers that never throw: a broken or full store must not crash the app. */
export const storage = {
    get: async <T>(key: string): Promise<T | null> => {
        try {
            const raw = await AsyncStorage.getItem(key);
            return raw === null ? null : (JSON.parse(raw) as T);
        } catch {
            return null;
        }
    },
    set: async <T>(key: string, value: T): Promise<boolean> => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },
    remove: async (key: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(key);
        } catch {
            // Nothing to recover: the key is gone or the store is unavailable.
        }
    },
};
