/** How many recent searches are kept: one row of chips, enough to find the last few again. */
export const RECENT_SEARCHES_MAX = 8;

/**
 * Puts a search first in the list. Repeats are matched without case or extra spaces, so "Dune" and "dune "
 * stay one entry; the newest spelling wins. Blank terms change nothing.
 */
export const addRecentSearch = (recent: string[], term: string, max = RECENT_SEARCHES_MAX): string[] => {
    const clean = term.trim().replace(/\s+/g, " ");
    if (!clean) return recent;
    const key = clean.toLocaleLowerCase();
    return [clean, ...recent.filter((entry) => entry.toLocaleLowerCase() !== key)].slice(0, max);
};

export const removeRecentSearch = (recent: string[], term: string): string[] => recent.filter((entry) => entry !== term);
