import {useEffect, useRef, useState, type ReactNode} from "react";
import {useQueryClient} from "@tanstack/react-query";
import i18n from "@/i18n";
import {getCurrentSession} from "@/api/auth.api";
import {useGetLibrary} from "@/hooks/library";
import {useGetLists} from "@/hooks/lists";
import {useGetProfile} from "@/hooks/profile";
import {supabase} from "@/lib/supabase";
import {toast} from "@/lib/toast";
import {pushProfileChange, syncLibrary, syncLists, syncProfileOnSignIn} from "@/services/sync";
import {QUERY_KEYS} from "@/constants/other";

/** Changes are uploaded a moment after the user stops editing, so a burst of taps makes one sync. */
const SYNC_DELAY_MS = 1500;

type SyncProviderProps = {children: ReactNode};

/**
 * Keeps the device and the account in step while signed in: it follows the session, merges the library
 * on sign-in and after each change, and uploads profile edits. Signed out, it does nothing.
 * When a sync fails, the changes stay on the device for the next try, and a toast says so once.
 */
export const SyncProvider = ({children}: SyncProviderProps) => {
    const queryClient = useQueryClient();
    const [userId, setUserId] = useState<string | null>(null);
    const {data: library} = useGetLibrary();
    const {data: profile} = useGetProfile();
    const {data: lists} = useGetLists();
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    // Runs syncs one at a time so two of them never read and write the library at once.
    const queue = useRef<Promise<unknown>>(Promise.resolve());
    // A failed sync is reported once; the next success clears it, so being offline does not repeat the message.
    const hasReportedFailure = useRef(false);

    const enqueue = (task: () => Promise<void>) => {
        queue.current = queue.current.then(task, task).then(
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

    // Signing in: fetch the profile and merge the library once.
    useEffect(() => {
        if (!userId) return;
        enqueue(async () => {
            const session = await getCurrentSession();
            const signUpUsername: unknown = session?.user.user_metadata?.username;
            const profileChanged = await syncProfileOnSignIn(userId, typeof signUpUsername === "string" ? signUpUsername : null);
            const libraryChanged = await syncLibrary(userId);
            if (profileChanged) void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.PROFILE]});
            if (libraryChanged) void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LIBRARY]});
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

    // Profile edits: upload after a short pause.
    useEffect(() => {
        if (!userId || !profile) return;
        const handle = setTimeout(() => enqueue(() => pushProfileChange(userId)), SYNC_DELAY_MS);
        return () => clearTimeout(handle);
    }, [profile, userId]);

    return <>{children}</>;
};
