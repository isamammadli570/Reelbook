import type {Session} from "@supabase/supabase-js";
import {supabase} from "@/lib/supabase";

/** `error` is a key under `auth:errors`, never the provider's raw message. */
export type AuthResult = {error: string | null; needsConfirmation?: boolean};

/** Shown instead of the provider's raw message, which is English and sometimes technical. */
const mapError = (message: string): string => {
    if (__DEV__) console.warn("[auth]", message);
    if (/invalid login credentials/i.test(message)) return "invalid_credentials";
    if (/email not confirmed/i.test(message)) return "email_not_confirmed";
    if (/already registered|already exists/i.test(message)) return "already_registered";
    if (/expired|invalid.*(token|otp)|(token|otp).*invalid/i.test(message)) return "invalid_code";
    if (/rate limit|security purposes|too many/i.test(message)) return "too_many_requests";
    if (/different from the old/i.test(message)) return "same_password";
    // The SMTP server refused the login or the message; the fix is in the Supabase email settings, not in the form.
    if (/sending.*email|smtp/i.test(message)) return "email_send_failed";
    if (/password/i.test(message)) return "weak_password";
    return "generic";
};

export const getCurrentSession = async (): Promise<Session | null> => {
    if (!supabase) return null;
    const {data} = await supabase.auth.getSession();
    return data.session;
};

/** Asks the database whether a handle is free; other users' rows are hidden, so a function answers instead. */
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
    if (!supabase) return true;
    const {data, error} = await supabase.rpc("is_username_available", {candidate: username});
    if (error) throw error;
    return data === true;
};

/** Creates the account with the chosen handle; it reaches the profile on the first sign-in via the account metadata. */
export const signUp = async (email: string, password: string, username: string): Promise<AuthResult> => {
    if (!supabase) return {error: "not_configured"};

    try {
        if (!(await isUsernameAvailable(username))) return {error: "username_taken"};
    } catch {
        return {error: "generic"};
    }

    const {data, error} = await supabase.auth.signUp({email, password, options: {data: {username}}});
    if (error) return {error: mapError(error.message)};
    // With e-mail confirmation on, Supabase returns no session until the link is opened.
    return {error: null, needsConfirmation: data.session === null};
};

export const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return {error: "not_configured"};
    const {error} = await supabase.auth.signInWithPassword({email, password});
    return {error: error ? mapError(error.message) : null};
};

export const signOut = async (): Promise<void> => {
    if (!supabase) return;
    await supabase.auth.signOut();
};

/**
 * Emails a one-time code for choosing a new password. The code (not a link) is what makes this work in the
 * phone app, which has no web address a link could return to. Supabase answers the same for unknown
 * addresses, so nobody can probe which emails have accounts.
 */
export const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    if (!supabase) return {error: "not_configured"};
    const {error} = await supabase.auth.resetPasswordForEmail(email);
    return {error: error ? mapError(error.message) : null};
};

/** Signs in with the emailed code, then sets the new password on that session. */
export const resetPassword = async (email: string, code: string, password: string): Promise<AuthResult> => {
    if (!supabase) return {error: "not_configured"};
    const verified = await supabase.auth.verifyOtp({email, token: code, type: "recovery"});
    if (verified.error) return {error: mapError(verified.error.message)};
    const {error} = await supabase.auth.updateUser({password});
    return {error: error ? mapError(error.message) : null};
};
