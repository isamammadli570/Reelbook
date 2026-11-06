import {getCurrentSession} from "@/api/auth.api";
import {hasSupabase} from "@/lib/env";

/** Thrown by a write that needs an account; the prompt has already been shown when it is thrown. */
export class AccountRequiredError extends Error {
    constructor() {
        super("account_required");
        this.name = "AccountRequiredError";
    }
}

type Listener = () => void;
let listener: Listener | null = null;

/** The app-level prompt registers itself here, so any hook can ask for sign-in without knowing the UI. */
export const subscribeAccountPrompt = (fn: Listener): (() => void) => {
    listener = fn;
    return () => {
        if (listener === fn) listener = null;
    };
};

export const openAccountPrompt = (): void => {
    listener?.();
};

/**
 * Passes when the user is signed in. Without Supabase keys there are no accounts at all, so nothing is gated.
 * Otherwise it shows the sign-in prompt and throws, so the write never happens.
 */
export const ensureAccount = async (): Promise<void> => {
    if (!hasSupabase) return;
    if (await getCurrentSession()) return;
    openAccountPrompt();
    throw new AccountRequiredError();
};
