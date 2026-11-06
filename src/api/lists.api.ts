import {storage} from "@/lib/storage";
import {STORAGE_KEYS, type MediaType} from "@/constants/other";
import {
    createList,
    createListsStore,
    deleteList,
    removeListEntry,
    toggleListEntry,
    restoreListEntry,
    updateListDetails,
    type ListDetails,
} from "@/helpers/lists";
import type {MediaSnapshot} from "@/api/library.api";

/** A title inside a list: enough to draw its poster without asking TMDB. */
export type ListEntry = {
    /** `itemKey(mediaType, id)`, the same key the library uses. */
    key: string;
    id: number;
    mediaType: MediaType;
    title: string;
    posterPath: string | null;
    backdropPath: string | null;
    year: string;
    addedAt: string;
};

/** A list the user made, newest entries first. */
export type UserList = {
    id: string;
    name: string;
    description: string;
    entries: ListEntry[];
    createdAt: string;
    updatedAt: string;
};

export type ListsStore = {
    lists: Record<string, UserList>;
    /** When each deleted list was removed, so the deletion can reach other devices. */
    removed?: Record<string, string>;
};

/* ------------------------------ storage ------------------------------ */

export const getLists = async (): Promise<ListsStore> => (await storage.get<ListsStore>(STORAGE_KEYS.LISTS)) ?? createListsStore();

// Writes run one after another so quick taps never overwrite each other's read-modify-write.
let writeQueue: Promise<unknown> = Promise.resolve();

const modifyLists = (change: (store: ListsStore) => ListsStore): Promise<ListsStore> => {
    const run = writeQueue.then(async () => {
        const next = change(await getLists());
        await storage.set(STORAGE_KEYS.LISTS, next);
        return next;
    });
    writeQueue = run.catch(() => undefined);
    return run;
};

/* ----------------------------- mutations ----------------------------- */

const now = (): string => new Date().toISOString();

export const createUserList = ({id, details}: {id: string; details: ListDetails}) => modifyLists((store) => createList(store, id, details, now()));

export const updateUserList = ({id, details}: {id: string; details: ListDetails}) => modifyLists((store) => updateListDetails(store, id, details, now()));

export const deleteUserList = (id: string) => modifyLists((store) => deleteList(store, id, now()));

export const toggleInList = ({listId, snapshot}: {listId: string; snapshot: MediaSnapshot}) => modifyLists((store) => toggleListEntry(store, listId, snapshot, now()));

export const removeFromList = ({listId, key}: {listId: string; key: string}) => modifyLists((store) => removeListEntry(store, listId, key, now()));

export const restoreToList = ({listId, entry, index}: {listId: string; entry: ListEntry; index: number}) =>
    modifyLists((store) => restoreListEntry(store, listId, entry, index, now()));

/** Replaces every list, used by sync and when signing out. */
export const replaceLists = (store: ListsStore) => modifyLists(() => store);

/** Applies a change to every list in one write, used by imports. */
export const mergeIntoLists = (change: (store: ListsStore) => ListsStore) => modifyLists(change);
