import {useEffect, useState} from "react";
import type {Session} from "@supabase/supabase-js";
import {getCurrentSession} from "@/api/auth.api";
import {supabase} from "@/lib/supabase";

/** The signed-in session, or `null`. `isLoading` is true until the stored session has been read. */
export const useSession = () => {
    const [session, setSession] = useState<Session | null>(null);
    // Without Supabase there is nothing to load, so the session is settled from the start.
    const [isLoading, setIsLoading] = useState(Boolean(supabase));

    useEffect(() => {
        if (!supabase) return;
        let isActive = true;
        void getCurrentSession().then((current) => {
            if (!isActive) return;
            setSession(current);
            setIsLoading(false);
        });
        const {data} = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
        return () => {
            isActive = false;
            data.subscription.unsubscribe();
        };
    }, []);

    return {session, isLoading};
};
