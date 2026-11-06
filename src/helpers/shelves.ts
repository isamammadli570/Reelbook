import type {Library, LibraryItem} from "@/api/library.api";
import {MEDIA_TYPE, SERIES_STATUS, SHELF, SHELF_SORT, type SeriesStatus, type Shelf, type ShelfSort} from "@/constants/other";
import {seriesProgress} from "@/helpers/library";

/** When the user last watched anything of this title: a movie viewing or an episode. */
export const lastWatchedAt = (item: LibraryItem): string | null => {
    const dates = [...item.diary.map((entry) => entry.watchedAt), ...Object.values(item.episodes)];
    return dates.length ? dates.reduce((latest, date) => (date > latest ? date : latest)) : null;
};

/** The titles that belong on one profile row. */
export const shelfItems = (library: Library, shelf: Shelf): LibraryItem[] => {
    const items = Object.values(library.items);
    switch (shelf) {
        case SHELF.FAVORITES:
            return items.filter((item) => item.isFavorite);
        case SHELF.MOVIES:
            return items.filter((item) => item.mediaType === MEDIA_TYPE.MOVIE && item.diary.length > 0);
        case SHELF.SERIES:
            return items.filter((item) => item.mediaType === MEDIA_TYPE.TV && (item.isFollowing || Object.keys(item.episodes).length > 0));
        case SHELF.WATCHLIST:
            return items.filter((item) => item.isInWatchlist);
        case SHELF.REVIEWS:
            return items.filter((item) => Boolean(item.review));
    }
};

/** Each row opens sorted the way people browse it: what was watched last, or what was added last. */
export const DEFAULT_SHELF_SORT: Record<Shelf, ShelfSort> = {
    favorites: SHELF_SORT.LAST_ADDED,
    movies: SHELF_SORT.LAST_WATCHED,
    series: SHELF_SORT.LAST_WATCHED,
    watchlist: SHELF_SORT.LAST_ADDED,
    reviews: SHELF_SORT.LAST_ADDED,
};

const newestFirst = (a: string, b: string): number => b.localeCompare(a);

export const sortShelf = (items: LibraryItem[], sort: ShelfSort): LibraryItem[] =>
    [...items].sort((a, b) => {
        switch (sort) {
            case SHELF_SORT.LAST_WATCHED:
                return newestFirst(lastWatchedAt(a) ?? a.updatedAt, lastWatchedAt(b) ?? b.updatedAt);
            case SHELF_SORT.LAST_ADDED:
                return newestFirst(a.review?.updatedAt ?? a.addedAt, b.review?.updatedAt ?? b.addedAt);
            case SHELF_SORT.ALPHABETICAL:
                return a.title.localeCompare(b.title);
            case SHELF_SORT.RELEASE_DATE:
                return newestFirst(a.year, b.year) || a.title.localeCompare(b.title);
            case SHELF_SORT.RATING:
                // Unrated titles go last rather than counting as zero stars.
                return (b.rating ?? -1) - (a.rating ?? -1) || a.title.localeCompare(b.title);
        }
    });

/** Every sort a shelf offers; the watchlist holds unwatched titles, so it has no ratings to sort by. */
export const shelfSorts = (shelf: Shelf): ShelfSort[] =>
    Object.values(SHELF_SORT).filter((sort) => sort !== SHELF_SORT.RATING || shelf !== SHELF.WATCHLIST);

/** Backdrops the user can pick as a profile cover: favourites first, then the most recently touched, no repeats. */
export const coverChoices = (library: Library, limit = 24): {path: string; title: string}[] => {
    const ordered = Object.values(library.items).sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || b.updatedAt.localeCompare(a.updatedAt));
    const seen = new Set<string>();
    const choices: {path: string; title: string}[] = [];
    for (const item of ordered) {
        if (choices.length >= limit) break;
        if (!item.backdropPath || seen.has(item.backdropPath)) continue;
        seen.add(item.backdropPath);
        choices.push({path: item.backdropPath, title: item.title});
    }
    return choices;
};

export const seriesStatus = (item: LibraryItem): SeriesStatus => {
    const {watched, aired} = seriesProgress(item);
    if (!watched) return SERIES_STATUS.NOT_STARTED;
    if (aired > 0 && watched >= aired) return SERIES_STATUS.COMPLETED;
    return SERIES_STATUS.WATCHING;
};

const STATUS_ORDER: SeriesStatus[] = [SERIES_STATUS.WATCHING, SERIES_STATUS.NOT_STARTED, SERIES_STATUS.COMPLETED];

/** Series split into watching, not started and completed, keeping each group's order; empty groups are left out. */
export const groupByStatus = (items: LibraryItem[]): {status: SeriesStatus; items: LibraryItem[]}[] =>
    STATUS_ORDER.map((status) => ({status, items: items.filter((item) => seriesStatus(item) === status)})).filter((group) => group.items.length > 0);

export type ShelfRow =
    | {kind: "title"; key: string; status: SeriesStatus}
    | {kind: "posters"; key: string; items: LibraryItem[]};

/** Splits a list into rows of `size`, the last one shorter, for grids drawn row by row in a virtual list. */
export const chunk = <T>(items: T[], size: number): T[][] =>
    Array.from({length: Math.ceil(items.length / size)}, (_, index) => items.slice(index * size, index * size + size));

/**
 * A shelf flattened for a virtual list: rows of `columns` posters, and with `isGrouped` a heading row before each
 * watch status. Only the rows on screen are rendered, so a shelf of hundreds of titles scrolls smoothly.
 */
export const shelfRows = (items: LibraryItem[], columns: number, isGrouped: boolean): ShelfRow[] => {
    const postersOf = (list: LibraryItem[], prefix: string): ShelfRow[] =>
        chunk(list, columns).map((row) => ({kind: "posters", key: `${prefix}${row.map((item) => `${item.mediaType}:${item.id}`).join(",")}`, items: row}));
    if (!isGrouped) return postersOf(items, "");
    return groupByStatus(items).flatMap((group): ShelfRow[] => [
        {kind: "title", key: `title-${group.status}`, status: group.status},
        ...postersOf(group.items, `${group.status}-`),
    ]);
};
