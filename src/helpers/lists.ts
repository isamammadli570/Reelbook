import type {MediaSnapshot} from "@/api/library.api";
import type {MediaSummary} from "@/api/media.api";
import type {ListEntry, ListsStore, UserList} from "@/api/lists.api";
import {itemKey} from "@/helpers/library";

export const createListsStore = (): ListsStore => ({lists: {}, removed: {}});

export const createListId = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export type ListDetails = {name: string; description: string};

const cleanDetails = ({name, description}: ListDetails): ListDetails => ({name: name.trim(), description: description.trim()});

export const createList = (store: ListsStore, id: string, details: ListDetails, nowIso: string): ListsStore => {
    const list: UserList = {id, ...cleanDetails(details), entries: [], createdAt: nowIso, updatedAt: nowIso};
    const removed = {...store.removed};
    delete removed[id];
    return {lists: {...store.lists, [id]: list}, removed};
};

/** Applies `change` to one list and stamps it; unknown ids leave the store as it was. */
const updateList = (store: ListsStore, id: string, change: (list: UserList) => UserList, nowIso: string): ListsStore => {
    const current = store.lists[id];
    if (!current) return store;
    return {...store, lists: {...store.lists, [id]: {...change(current), updatedAt: nowIso}}};
};

export const updateListDetails = (store: ListsStore, id: string, details: ListDetails, nowIso: string): ListsStore =>
    updateList(store, id, (list) => ({...list, ...cleanDetails(details)}), nowIso);

/** Removes the list and leaves a tombstone, so the deletion reaches the user's other devices. */
export const deleteList = (store: ListsStore, id: string, nowIso: string): ListsStore => {
    if (!store.lists[id]) return store;
    const lists = {...store.lists};
    delete lists[id];
    return {lists, removed: {...store.removed, [id]: nowIso}};
};

/** A title as a list keeps it: just enough to draw the poster. */
export const toEntry = (snapshot: MediaSnapshot, nowIso: string): ListEntry => ({
    key: itemKey(snapshot.mediaType, snapshot.id),
    id: snapshot.id,
    mediaType: snapshot.mediaType,
    title: snapshot.title,
    posterPath: snapshot.posterPath,
    backdropPath: snapshot.backdropPath,
    year: snapshot.year,
    addedAt: nowIso,
});

/** Adds the title at the top of the list, or takes it out if it is already there. */
export const toggleListEntry = (store: ListsStore, id: string, snapshot: MediaSnapshot, nowIso: string): ListsStore =>
    updateList(store, id, (list) => {
        const key = itemKey(snapshot.mediaType, snapshot.id);
        const isListed = list.entries.some((entry) => entry.key === key);
        return {
            ...list,
            entries: isListed ? list.entries.filter((entry) => entry.key !== key) : [toEntry(snapshot, nowIso), ...list.entries],
        };
    }, nowIso);

export const removeListEntry = (store: ListsStore, id: string, key: string, nowIso: string): ListsStore =>
    updateList(store, id, (list) => ({...list, entries: list.entries.filter((entry) => entry.key !== key)}), nowIso);

/** Undoes a removal: the entry goes back at its old position, with its original "added" date. */
export const restoreListEntry = (store: ListsStore, id: string, entry: ListEntry, index: number, nowIso: string): ListsStore =>
    updateList(store, id, (list) => {
        const entries = list.entries.filter((existing) => existing.key !== entry.key);
        entries.splice(Math.min(Math.max(index, 0), entries.length), 0, entry);
        return {...list, entries};
    }, nowIso);

/** The ids of the lists that already hold this title, for ticking them in the "add to list" sheet. */
export const listIdsContaining = (store: ListsStore, key: string): Set<string> =>
    new Set(Object.values(store.lists).filter((list) => list.entries.some((entry) => entry.key === key)).map((list) => list.id));

/** Lets list entries reuse the TMDB poster grid. */
export const entryToMediaSummary = (entry: ListEntry): MediaSummary => ({
    id: entry.id,
    media_type: entry.mediaType,
    title: entry.title,
    overview: "",
    poster_path: entry.posterPath,
    backdrop_path: entry.backdropPath,
    release_date: entry.year,
    vote_average: 0,
    genre_ids: [],
});

/** Lists with the most recently changed first. */
export const sortedLists = (store: ListsStore): UserList[] => Object.values(store.lists).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
