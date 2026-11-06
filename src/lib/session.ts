import type {Session} from "@supabase/supabase-js";
import {supabase} from "@/lib/supabase";

/**
 * The signed-in session, read once and kept current by one auth listener for the whole app. Every screen and
 * row asks this store instead of reading the session and subscribing on its own, which a list of twenty
 * people did twenty times over.
 */
type SessionState = {session: Session | null; isLoading: boolean};

// Without Supabase there is nothing to load, so the session is settled from the start.
let state: SessionState = {session: null, isLoading: Boolean(supabase)};
const listeners = new Set<() => void>();
let hasStarted = false;

const set = (next: SessionState) => {
    state = next;
    listeners.forEach((listener) => listener());
};

const start = () => {
    if (hasStarted || !supabase) return;
    hasStarted = true;
    void supabase.auth.getSession().then(({data}) => set({session: data.session, isLoading: false}));
    supabase.auth.onAuthStateChange((_event, session) => set({session, isLoading: false}));
};

export const subscribeSession = (listener: () => void) => {
    start();
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const getSessionState = (): SessionState => state;
