const readEnv = (value: string | undefined): string => value?.trim() ?? "";

/** Expo inlines `EXPO_PUBLIC_*` at build time, so each one must be read by its full name. */
export const ENV = {
    tmdbToken: readEnv(process.env.EXPO_PUBLIC_TMDB_TOKEN),
} as const;

export const hasTmdbToken = ENV.tmdbToken.length > 0;

if (!hasTmdbToken && __DEV__) {
    console.warn("EXPO_PUBLIC_TMDB_TOKEN is not set. TMDB requests are disabled.");
}
