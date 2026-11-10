import {useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient} from "@tanstack/react-query";
import {
    FEED_PAGE_SIZE,
    getFeedPage,
    getFriendsOnTitle,
    getFollowCounts,
    getFollowList,
    getUserLibrary,
    getUserLists,
    getFollowingIds,
    getUserByUsername,
    searchUsers,
    setFollowing,
    type FollowCounts,
} from "@/api/social.api";
import {useSession} from "@/hooks/auth/useSession";
import {useDebouncedValue} from "@/hooks/useDebouncedValue";
import {itemKey} from "@/helpers/library";
import {cleanUserQuery, friendsOnTitle} from "@/helpers/social";
import {hasSupabase} from "@/lib/env";
import {applyActivitySharing} from "@/services/sync";
import {toast} from "@/lib/toast";
import i18n from "@/i18n";
import {QUERY_KEYS, SEARCH_DEBOUNCE_MS, type MediaType} from "@/constants/other";

/**
 * Other people's data changes while the app is open; a minute of freshness is plenty. Coming back to the
 * app (or the browser tab) asks again once that minute has passed.
 */
const SOCIAL_STALE_MS = 60_000;
/**
 * Who someone is (name, photo, bio) and their counts: one small row each, so a profile asks again whenever it
 * opens after a short while. A changed name or photo used to show up only a minute or more later.
 */
const HEADER_STALE_MS = 15_000;

/** The signed-in user's id, or `null`; social features need an account. */
export const useSelfId = (): string | null => {
    const {session} = useSession();
    return hasSupabase ? session?.user.id ?? null : null;
};

/** People matching what is typed, asked once the typing pauses; at least two characters. */
export const useUserSearch = (query: string) => {
    const selfId = useSelfId();
    const term = cleanUserQuery(useDebouncedValue(query, SEARCH_DEBOUNCE_MS));
    const enabled = Boolean(selfId) && term.length >= 2;
    const result = useQuery({
        queryKey: [QUERY_KEYS.SOCIAL, "search", term],
        queryFn: () => searchUsers(term, selfId),
        enabled,
        staleTime: SOCIAL_STALE_MS,
        refetchOnWindowFocus: true,
    });
    return {...result, isSearching: enabled};
};

export const useUserProfile = (username: string) =>
    useQuery({
        queryKey: [QUERY_KEYS.SOCIAL, "user", username.toLowerCase()],
        queryFn: () => getUserByUsername(username),
        enabled: hasSupabase && Boolean(username),
        staleTime: HEADER_STALE_MS,
        refetchOnWindowFocus: true,
    });

const countsKey = (userId: string | null | undefined) => [QUERY_KEYS.SOCIAL, "counts", userId];

export const useFollowCounts = (userId: string | null | undefined) =>
    useQuery({
        queryKey: countsKey(userId),
        queryFn: () => getFollowCounts(userId ?? ""),
        enabled: Boolean(userId),
        staleTime: HEADER_STALE_MS,
        refetchOnWindowFocus: true,
    });

export const useFollowList = (userId: string | null | undefined, direction: "following" | "followers") =>
    useQuery({
        queryKey: [QUERY_KEYS.SOCIAL, direction, userId],
        queryFn: () => getFollowList(userId ?? "", direction),
        enabled: Boolean(userId),
        staleTime: SOCIAL_STALE_MS,
        refetchOnWindowFocus: true,
    });

const followingKey = (selfId: string | null) => [QUERY_KEYS.SOCIAL, "followingIds", selfId];

const followingQuery = (selfId: string | null) => ({
    queryKey: followingKey(selfId),
    queryFn: () => getFollowingIds(selfId ?? ""),
    staleTime: SOCIAL_STALE_MS,
});

/**
 * Everyone you follow, asked once. Each follow button and the feed read it from here, so a list of twenty
 * people costs one request instead of twenty.
 */
export const useFollowingIds = () => {
    const selfId = useSelfId();
    return useQuery({...followingQuery(selfId), enabled: Boolean(selfId), refetchOnWindowFocus: true});
};

/** The people you follow as the feed and title cards read them: from the shared query, asked only if missing. */
const readFollowingIds = (queryClient: QueryClient, selfId: string | null): Promise<string[]> =>
    selfId ? queryClient.ensureQueryData(followingQuery(selfId)) : Promise.resolve([]);

export const useIsFollowing = (userId: string | null | undefined) => {
    const {data: ids, isLoading} = useFollowingIds();
    return {data: userId ? Boolean(ids?.includes(userId)) : false, isLoading};
};

/** Adds `delta` to one of the two counts, when they have been read; returns what was there, to undo with. */
const shiftCount = (queryClient: QueryClient, userId: string | null, field: keyof FollowCounts, delta: number) => {
    const key = countsKey(userId);
    const previous = queryClient.getQueryData<FollowCounts>(key);
    if (previous) queryClient.setQueryData<FollowCounts>(key, {...previous, [field]: Math.max(0, previous[field] + delta)});
    return {key, previous};
};

/**
 * Follow or unfollow. The button and both counts flip at once; if the server says no, they flip back and a
 * toast explains. Afterwards only what following changes is asked again: never the other person's library
 * and lists, which a big library made slow and which following does not change.
 */
export const useSetFollowing = () => {
    const selfId = useSelfId();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({userId, follow}: {userId: string; follow: boolean}) => setFollowing(selfId ?? "", userId, follow),
        onMutate: async ({userId, follow}) => {
            const key = followingKey(selfId);
            await queryClient.cancelQueries({queryKey: key});
            const previous = queryClient.getQueryData<string[]>(key);
            const without = (previous ?? []).filter((id) => id !== userId);
            queryClient.setQueryData(key, follow ? [userId, ...without] : without);

            // Counts move only when this is a real change, so a double tap does not count twice.
            const wasFollowing = Boolean(previous?.includes(userId));
            const delta = follow === wasFollowing ? 0 : follow ? 1 : -1;
            const counts = delta
                ? [shiftCount(queryClient, userId, "followers", delta), shiftCount(queryClient, selfId, "following", delta)]
                : [];
            return {key, previous, counts};
        },
        onError: (_error, _variables, context) => {
            if (context) {
                queryClient.setQueryData(context.key, context.previous);
                context.counts.forEach(({key, previous}) => queryClient.setQueryData(key, previous));
            }
            toast.error(i18n.t("social:followFailed"));
        },
        onSettled: (_data, _error, {userId}) => {
            const refresh = (...key: unknown[]) => void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.SOCIAL, ...key]});
            refresh("followingIds", selfId);
            refresh("counts", selfId);
            refresh("counts", userId);
            refresh("following", selfId);
            refresh("followers", userId);
            refresh("feed", selfId);
            refresh("title");
        },
    });
};

/**
 * What the people you follow did, newest first, a page at a time. The key does not hold the people followed:
 * following someone used to start the feed over, empty, under a new key; now it refreshes in place.
 */
export const useFeed = () => {
    const selfId = useSelfId();
    const queryClient = useQueryClient();
    return useInfiniteQuery({
        queryKey: [QUERY_KEYS.SOCIAL, "feed", selfId],
        queryFn: async ({pageParam}) => getFeedPage(await readFollowingIds(queryClient, selfId), pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage, pages) => (lastPage.length === FEED_PAGE_SIZE ? pages.length : undefined),
        enabled: Boolean(selfId),
        staleTime: SOCIAL_STALE_MS,
        refetchOnWindowFocus: true,
    });
};

/** Which of the people you follow watched or reviewed this title, one entry each, newest first. */
export const useFriendsOnTitle = (mediaType: MediaType, id: number) => {
    const selfId = useSelfId();
    const queryClient = useQueryClient();
    const key = itemKey(mediaType, id);
    return useQuery({
        // Refreshed in place when you follow someone, like the feed.
        queryKey: [QUERY_KEYS.SOCIAL, "title", key, selfId],
        queryFn: async () => getFriendsOnTitle(await readFollowingIds(queryClient, selfId), key),
        select: friendsOnTitle,
        enabled: Boolean(selfId),
        staleTime: SOCIAL_STALE_MS,
        refetchOnWindowFocus: true,
    });
};

/** Someone else's data barely moves while you look at it; a few minutes keeps their pages instant on return. */
const PROFILE_STALE_MS = 5 * 60_000;

/**
 * Another person's whole library, read for their profile page and its shelves. It is not asked again on focus:
 * a big library is a heavy download, so it waits for the page to open again after a few minutes.
 */
export const useUserLibrary = (userId: string | null | undefined) =>
    useQuery({
        queryKey: [QUERY_KEYS.SOCIAL, "library", userId],
        queryFn: () => getUserLibrary(userId ?? ""),
        enabled: Boolean(userId),
        staleTime: PROFILE_STALE_MS,
    });

/** Another person's lists, read for their profile page. */
export const useUserListsOf = (userId: string | null | undefined) =>
    useQuery({
        queryKey: [QUERY_KEYS.SOCIAL, "lists", userId],
        queryFn: () => getUserLists(userId ?? ""),
        enabled: Boolean(userId),
        staleTime: PROFILE_STALE_MS,
    });

/** Publishes or takes down your activity after the sharing setting changes. */
export const useApplySharing = () => {
    const selfId = useSelfId();
    return useMutation({
        mutationFn: (share: boolean) => (selfId ? applyActivitySharing(selfId, share) : Promise.resolve()),
        onError: () => toast.error(i18n.t("social:sharingFailed")),
    });
};
