import {useEffect, useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {
    deleteWatch,
    saveReview,
    getLibrary,
    logWatch,
    rateItem,
    refreshItemSnapshot,
    setSeasonWatched,
    toggleEpisodeWatched,
    toggleFavoriteItem,
    toggleFollowingItem,
    toggleWatchlistItem,
} from "@/api/library.api";
import {useLibraryMutation} from "@/hooks/_shared/useLibraryMutation";
import {favoriteItems, itemKey, reviewedItems, upNextItems, watchlistItems} from "@/helpers/library";
import {collectWatches} from "@/helpers/stats";
import {DEFAULT_SHELF_SORT, shelfItems, sortShelf} from "@/helpers/shelves";
import {QUERY_KEYS, type MediaType, type Shelf, type ShelfSort} from "@/constants/other";
import type {MediaSnapshot} from "@/api/library.api";

/** The user's whole library from device storage; only this app writes it, so it never goes stale. */
export const useGetLibrary = () =>
    useQuery({
        queryKey: [QUERY_KEYS.LIBRARY],
        queryFn: getLibrary,
        staleTime: Infinity,
        gcTime: Infinity,
    });

/** The stored entry for one title, or undefined when the user has no relation to it yet. */
export const useLibraryItem = (mediaType: MediaType, id: number) => {
    const {data} = useGetLibrary();
    return data?.items[itemKey(mediaType, id)];
};

export const useUpNext = () => {
    const {data, ...query} = useGetLibrary();
    const items = useMemo(() => (data ? upNextItems(data) : []), [data]);
    return {...query, items};
};

export const useWatchlist = () => {
    const {data, ...query} = useGetLibrary();
    const items = useMemo(() => (data ? watchlistItems(data) : []), [data]);
    return {...query, items};
};

export const useFavorites = () => {
    const {data, ...query} = useGetLibrary();
    const items = useMemo(() => (data ? favoriteItems(data) : []), [data]);
    return {...query, items};
};

/** One profile row's titles, sorted; the row's own default order when no sort is given. */
export const useShelf = (shelf: Shelf, sort: ShelfSort = DEFAULT_SHELF_SORT[shelf]) => {
    const {data, ...query} = useGetLibrary();
    const items = useMemo(() => (data ? sortShelf(shelfItems(data, shelf), sort) : []), [data, shelf, sort]);
    return {...query, items};
};

export const useReviews = () => {
    const {data, ...query} = useGetLibrary();
    const items = useMemo(() => (data ? reviewedItems(data) : []), [data]);
    return {...query, items};
};

/** Every movie viewing and episode, newest first: the source of the diary and all statistics. */
export const useWatches = () => {
    const {data, ...query} = useGetLibrary();
    const watches = useMemo(() => (data ? collectWatches(data) : []), [data]);
    return {...query, watches};
};

export const useSaveReview = () => useLibraryMutation(saveReview);

export const useToggleWatchlist = () => useLibraryMutation(toggleWatchlistItem);
export const useToggleFavorite = () => useLibraryMutation(toggleFavoriteItem);
export const useToggleFollowing = () => useLibraryMutation(toggleFollowingItem);
export const useRateItem = () => useLibraryMutation(rateItem);
export const useLogWatch = () => useLibraryMutation(logWatch);
export const useDeleteWatch = () => useLibraryMutation(deleteWatch);
export const useToggleEpisode = () => useLibraryMutation(toggleEpisodeWatched);
export const useSetSeasonWatched = () => useLibraryMutation(setSeasonWatched);
export const useRefreshSnapshot = () => useLibraryMutation(refreshItemSnapshot, {requiresAccount: false});

/** Re-saves a tracked title's details on each visit: new episodes air, and older entries may predate fields like genres. */
export const useSyncSnapshot = (snapshot: MediaSnapshot | null, isTracked: boolean) => {
    const {mutate: refreshSnapshot} = useRefreshSnapshot();

    useEffect(() => {
        if (snapshot && isTracked) refreshSnapshot(snapshot);
    }, [snapshot, isTracked, refreshSnapshot]);
};
