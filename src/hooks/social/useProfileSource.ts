import {useLocalSearchParams} from "expo-router";
import {useSession} from "@/hooks/auth/useSession";
import {useGetLibrary} from "@/hooks/library";
import {useGetLists} from "@/hooks/lists";
import {useSelfId, useUserLibrary, useUserListsOf, useUserProfile} from "@/hooks/social/useSocial";
import {hasSupabase} from "@/lib/env";
import {buildRoute, type ProfileRoutes} from "@/constants/routes";
import type {Library} from "@/api/library.api";
import type {ListsStore} from "@/api/lists.api";
import type {PublicProfile} from "@/api/social.api";

/**
 * - `ready`: the data is here (possibly empty)
 * - `guest`: your own profile, but you are not signed in
 * - `hidden`: their profile is not public yet (sharing was off before profiles became public)
 */
export type ProfileSourceStatus = "ready" | "loading" | "error" | "notFound" | "guest" | "hidden";

export type ProfileSource = {
    status: ProfileSourceStatus;
    /** Your own profile: data from the device, and everything can be edited. */
    isOwn: boolean;
    /** The @username in the address, or `null` on your own tab and pages. */
    username: string | null;
    /** The person whose profile this is, when it is someone else. */
    user: PublicProfile | null;
    library: Library;
    lists: ListsStore;
    /** Where this profile's shelves, lists and diary open. */
    routes: ProfileRoutes;
    error: Error | null;
    retry: () => void;
};

const EMPTY_LIBRARY: Library = {items: {}};
const EMPTY_LISTS: ListsStore = {lists: {}};

/**
 * Whose profile a page shows, and its data. Pages under `/user/[username]` show that person, read from the
 * server; every other page shows your own, read from the device. Your own @username counts as your own.
 */
export const useProfileSource = (): ProfileSource => {
    const {username: param} = useLocalSearchParams<{username?: string}>();
    const username = param || null;
    const selfId = useSelfId();
    const {session, isLoading: isSessionLoading} = useSession();
    const profile = useUserProfile(username ?? "");
    const user = username ? profile.data ?? null : null;
    const isOwn = !username || (user !== null && user.userId === selfId);

    const ownLibrary = useGetLibrary();
    const ownLists = useGetLists();
    const theirId = !isOwn && user?.shareActivity ? user.userId : null;
    const theirLibrary = useUserLibrary(theirId);
    const theirLists = useUserListsOf(theirId);

    const base = {isOwn, username, user, routes: buildRoute.profile(isOwn ? null : username)};

    if (isOwn) {
        const isGuest = hasSupabase && !session && !isSessionLoading;
        return {
            ...base,
            status: isGuest ? "guest" : "ready",
            library: ownLibrary.data ?? EMPTY_LIBRARY,
            lists: ownLists.data ?? EMPTY_LISTS,
            error: null,
            retry: () => undefined,
        };
    }

    const failed = [profile, theirLibrary, theirLists].find((query) => query.isError);
    const status: ProfileSourceStatus = profile.isLoading
        ? "loading"
        : failed
            ? "error"
            : !user
                ? "notFound"
                : !user.shareActivity
                    ? "hidden"
                    : theirLibrary.isLoading || theirLists.isLoading
                        ? "loading"
                        : "ready";

    return {
        ...base,
        status,
        library: theirLibrary.data ?? EMPTY_LIBRARY,
        lists: theirLists.data ?? EMPTY_LISTS,
        error: failed?.error ?? null,
        retry: () => {
            void profile.refetch();
            if (theirId) {
                void theirLibrary.refetch();
                void theirLists.refetch();
            }
        },
    };
};
