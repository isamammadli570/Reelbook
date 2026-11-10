import {useEffect, useRef, useState, type ReactNode} from "react";
import {AppState} from "react-native";
import {useQueryClient} from "@tanstack/react-query";
import {router} from "expo-router";
import {getProfile} from "@/api/profile.api";
import {ROUTES} from "@/constants/routes";
import i18n from "@/i18n";
import {getCurrentSession} from "@/api/auth.api";
import {useGetLibrary} from "@/hooks/library";
import {useGetLists} from "@/hooks/lists";
import {supabase} from "@/lib/supabase";
import {toast} from "@/lib/toast";
import {ensureActivityPublished, runExclusive, syncLibrary, syncLists, syncProfile} from "@/services/sync";
import {QUERY_KEYS} from "@/constants/other";

/** Changes are uploaded a moment after the user stops editing, so a burst of taps makes one sync. */
const SYNC_DELAY_MS = 1500;
/** Coming back to the app fetches what other devices changed, at most this often. */
const REFRESH_INTERVAL_MS = 30_000;

type SyncProviderProps = {children: ReactNode};

/**
 * Keeps the device and the account in step while signed in: it follows the session, merges the library
 * on sign-in, after each change and when the app comes back to the front, so edits made on another device
 * show up without a restart. Profile edits are sent by the edit itself. Signed out, it does nothing.
 * When a sync fails, the changes stay on the device for the next try, and a toast says so once.
 */
export const SyncProvider = ({children}: SyncProviderProps) => {
    const queryClient = useQueryClient();
    const [userId, setUserId] = useState<string | null>(null);
    const {data: library} = useGetLibrary();
    const {data: lists} = useGetLists();
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    // A failed sync is reported once; the next success clears it, so being offline does not repeat the message.
    const hasReportedFailure = useRef(false);

    // Runs syncs one at a time, in the app-wide queue that signing out also waits in, so two of them never
    // read and write the library at once.
    const enqueue = (task: () => Promise<void>) => {
        void runExclusive(task).then(
            () => {
                hasReportedFailure.current = false;
            },
            () => {
                if (hasReportedFailure.current) return;
                hasReportedFailure.current = true;
                toast.error(i18n.t("common:toast.syncFailed"));
            },
        );
    };

    useEffect(() => {
        if (!supabase) return;
        let isActive = true;
        void getCurrentSession().then((session) => {
            if (isActive) setUserId(session?.user.id ?? null);
        });
        const {data} = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null));
        return () => {
            isActive = false;
            data.subscription.unsubscribe();
        };
    }, []);

    // Whenever the account on this device changes (signed out here, signed out by another device, or someone
    // else signed in), what was read about other people for the previous account goes. Only from an account,
    // not from the guest start: its social queries had nothing to read.
    const previousUserId = useRef<string | null>(null);
    useEffect(() => {
        const previous = previousUserId.current;
        previousUserId.current = userId;
        if (previous && previous !== userId) void queryClient.resetQueries({queryKey: [QUERY_KEYS.SOCIAL]});
    }, [userId, queryClient]);

    // Signing in: fetch the profile and merge the library once.
    useEffect(() => {
        if (!userId) return;
        enqueue(async () => {
            const session = await getCurrentSession();
            // Signed out again before this task's turn came: the device is not this account's any more.
            if (session?.user.id !== userId) return;
            // A handle from the sign-up form; a name and photo from Google, which calls them differently.
            const metadata: Record<string, unknown> = session?.user.user_metadata ?? {};
            const text = (...keys: string[]) => keys.map((key) => metadata[key]).find((value): value is string => typeof value === "string" && value.trim() !== "") ?? null;
            const profileChanged = await syncProfile(userId, {
                username: text("username"),
                name: text("full_name", "name"),
                avatarUrl: text("avatar_url", "picture"),
            });
            const libraryChanged = await syncLibrary(userId);
            if (profileChanged) void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.PROFILE]});
            // An account with no @handle yet (one made with Google) is asked for one each time the app opens
            // signed in, until it has one. Checked after the merge above, so a handle set on another device counts.
            // Asking is a nicety: if navigation is not ready yet, it is skipped rather than reported as a failed sync.
            if (!(await getProfile()).username) {
                try {
                    router.push(ROUTES.CHOOSE_USERNAME);
                } catch {
                    // Asked again next time.
                }
            }
            if (libraryChanged) void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LIBRARY]});
            // Friends see the history from before sharing existed; done once per account on this device.
            await ensureActivityPublished(userId);
        });
        // A separate task, so lists failing (say, before their table exists) never block the library.
        enqueue(async () => {
            if (await syncLists(userId)) void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LISTS]});
        });
        // Only the user id matters here; later changes are handled by the effects below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Local library edits: upload after a short pause.
    useEffect(() => {
        if (!userId || !library) return;
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            enqueue(async () => {
                if (await syncLibrary(userId)) void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LIBRARY]});
            });
        }, SYNC_DELAY_MS);
        return () => clearTimeout(timer.current);
    }, [library, userId, queryClient]);

    // List edits: upload after a short pause.
    useEffect(() => {
        if (!userId || !lists) return;
        const handle = setTimeout(() => enqueue(async () => {
            if (await syncLists(userId)) void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LISTS]});
        }), SYNC_DELAY_MS);
        return () => clearTimeout(handle);
    }, [lists, userId, queryClient]);

    // Back to the front (phone unlocked, tab shown again): pick up what other devices changed meanwhile.
    // Profile edits no longer upload on every load, which is what let a stale device undo a newer edit.
    const lastRefresh = useRef(0);
    useEffect(() => {
        if (!userId) return;
        // Signing in has just synced everything, so the first refresh waits a full interval.
        lastRefresh.current = Date.now();
        const subscription = AppState.addEventListener("change", (state) => {
            if (state !== "active" || Date.now() - lastRefresh.current < REFRESH_INTERVAL_MS) return;
            lastRefresh.current = Date.now();
            enqueue(async () => {
                if (await syncProfile(userId)) void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.PROFILE]});
                if (await syncLibrary(userId)) void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LIBRARY]});
            });
            enqueue(async () => {
                if (await syncLists(userId)) void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LISTS]});
            });
        });
        return () => subscription.remove();
    }, [userId, queryClient]);

    return <>{children}</>;
};
