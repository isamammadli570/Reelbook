import {useInfiniteQuery, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
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

/** Other people's data changes while the app is open; a minute of freshness is plenty. */
const SOCIAL_STALE_MS = 60_000;

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
    });
    return {...result, isSearching: enabled};
};

export const useUserProfile = (username: string) =>
    useQuery({
        queryKey: [QUERY_KEYS.SOCIAL, "user", username.toLowerCase()],
        queryFn: () => getUserByUsername(username),
        enabled: hasSupabase && Boolean(username),
        staleTime: SOCIAL_STALE_MS,
    });

export const useFollowCounts = (userId: string | null | undefined) =>
    useQuery({
        queryKey: [QUERY_KEYS.SOCIAL, "counts", userId],
        queryFn: () => getFollowCounts(userId ?? ""),
        enabled: Boolean(userId),
        staleTime: SOCIAL_STALE_MS,
    });

export const useFollowList = (userId: string | null | undefined, direction: "following" | "followers") =>
    useQuery({
        queryKey: [QUERY_KEYS.SOCIAL, direction, userId],
        queryFn: () => getFollowList(userId ?? "", direction),
        enabled: Boolean(userId),
        staleTime: SOCIAL_STALE_MS,
    });

const followingKey = (selfId: string | null) => [QUERY_KEYS.SOCIAL, "followingIds", selfId];

/**
 * Everyone you follow, asked once. Each follow button and the feed read it from here, so a list of twenty
 * people costs one request instead of twenty.
 */
export const useFollowingIds = () => {
    const selfId = useSelfId();
    return useQuery({
        queryKey: followingKey(selfId),
        queryFn: () => getFollowingIds(selfId ?? ""),
        enabled: Boolean(selfId),
        staleTime: SOCIAL_STALE_MS,
    });
};

export const useIsFollowing = (userId: string | null | undefined) => {
    const {data: ids, isLoading} = useFollowingIds();
    return {data: userId ? Boolean(ids?.includes(userId)) : false, isLoading};
};

/**
 * Follow or unfollow. The button flips at once; if the server says no, it flips back and a toast explains.
 * Counts, lists and the feed refresh afterwards.
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
            return {key, previous};
        },
        onError: (_error, _variables, context) => {
            if (context) queryClient.setQueryData(context.key, context.previous);
            toast.error(i18n.t("social:followFailed"));
        },
        onSettled: () => void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.SOCIAL]}),
    });
};

/** What the people you follow did, newest first, a page at a time. */
export const useFeed = () => {
    const selfId = useSelfId();
    const {data: followingIds} = useFollowingIds();
    return useInfiniteQuery({
        // The ids are part of the key: following someone new starts the feed over with them in it.
        queryKey: [QUERY_KEYS.SOCIAL, "feed", selfId, followingIds],
        queryFn: ({pageParam}) => getFeedPage(followingIds ?? [], pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage, pages) => (lastPage.length === FEED_PAGE_SIZE ? pages.length : undefined),
        enabled: Boolean(selfId && followingIds),
        staleTime: SOCIAL_STALE_MS,
    });
};

/** Which of the people you follow watched or reviewed this title, one entry each, newest first. */
export const useFriendsOnTitle = (mediaType: MediaType, id: number) => {
    const selfId = useSelfId();
    const {data: followingIds} = useFollowingIds();
    return useQuery({
        // The ids are part of the key: following someone new brings their viewing in at once.
        queryKey: [QUERY_KEYS.SOCIAL, "title", itemKey(mediaType, id), followingIds],
        queryFn: () => getFriendsOnTitle(followingIds ?? [], itemKey(mediaType, id)),
        select: friendsOnTitle,
        enabled: Boolean(selfId && followingIds?.length),
        staleTime: SOCIAL_STALE_MS,
    });
};

/** Someone else's data barely moves while you look at it; a few minutes keeps their pages instant on return. */
const PROFILE_STALE_MS = 5 * 60_000;

/** Another person's whole library, read for their profile page and its shelves. */
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
