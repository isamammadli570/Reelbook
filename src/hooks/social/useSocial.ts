import {useInfiniteQuery, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    FEED_PAGE_SIZE,
    getFeedPage,
    getFollowCounts,
    getFollowList,
    getUserActivityPage,
    getUserByUsername,
    isFollowing,
    searchUsers,
    setFollowing,
} from "@/api/social.api";
import {useSession} from "@/hooks/auth/useSession";
import {useDebouncedValue} from "@/hooks/useDebouncedValue";
import {cleanUserQuery} from "@/helpers/social";
import {hasSupabase} from "@/lib/env";
import {applyActivitySharing} from "@/services/sync";
import {toast} from "@/lib/toast";
import i18n from "@/i18n";
import {QUERY_KEYS, SEARCH_DEBOUNCE_MS} from "@/constants/other";

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

export const useIsFollowing = (userId: string | null | undefined) => {
    const selfId = useSelfId();
    return useQuery({
        queryKey: [QUERY_KEYS.SOCIAL, "isFollowing", selfId, userId],
        queryFn: () => isFollowing(selfId ?? "", userId ?? ""),
        enabled: Boolean(selfId && userId && selfId !== userId),
        staleTime: SOCIAL_STALE_MS,
    });
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
        onMutate: ({userId, follow}) => {
            const key = [QUERY_KEYS.SOCIAL, "isFollowing", selfId, userId];
            const previous = queryClient.getQueryData<boolean>(key);
            queryClient.setQueryData(key, follow);
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
    return useInfiniteQuery({
        queryKey: [QUERY_KEYS.SOCIAL, "feed", selfId],
        queryFn: ({pageParam}) => getFeedPage(selfId ?? "", pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage, pages) => (lastPage.length === FEED_PAGE_SIZE ? pages.length : undefined),
        enabled: Boolean(selfId),
        staleTime: SOCIAL_STALE_MS,
    });
};

/** One person's activity, for their profile page. */
export const useUserActivity = (userId: string | null | undefined) =>
    useInfiniteQuery({
        queryKey: [QUERY_KEYS.SOCIAL, "activity", userId],
        queryFn: ({pageParam}) => getUserActivityPage(userId ?? "", pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage, pages) => (lastPage.length === FEED_PAGE_SIZE ? pages.length : undefined),
        enabled: Boolean(userId),
        staleTime: SOCIAL_STALE_MS,
    });

/** Publishes or takes down your activity after the sharing setting changes. */
export const useApplySharing = () => {
    const selfId = useSelfId();
    return useMutation({
        mutationFn: (share: boolean) => (selfId ? applyActivitySharing(selfId, share) : Promise.resolve()),
        onError: () => toast.error(i18n.t("social:sharingFailed")),
    });
};
