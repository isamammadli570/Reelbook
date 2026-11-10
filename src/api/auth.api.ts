import {Platform} from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type {Session} from "@supabase/supabase-js";
import {supabase} from "@/lib/supabase";
import {ROUTES} from "@/constants/routes";
import {parseAuthRedirect} from "@/helpers/authRedirect";

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
    if (/reauthenticat|recent login/i.test(message)) return "needs_recent_sign_in";
    if (/email.*(invalid|valid)|invalid.*email/i.test(message)) return "invalidEmail";
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

/**
 * Signing out of Reelbook does not sign the browser out of Google, so Google would quietly pick the account
 * used last. Asking it to show the chooser every time lets someone switch to another Google account.
 */
const GOOGLE_PARAMS = {prompt: "select_account"};

/** `isRedirecting`: the web page is on its way to Google, so nothing more should happen here. */
export type GoogleResult = AuthResult & {cancelled?: boolean; isRedirecting?: boolean};

/**
 * Signs in, or creates the account, with Google. On the web the page goes to Google and comes back to the
 * site, where the session is read from the address. In the app Google opens in an in-app browser that returns
 * to the app's own link; the session is taken from that link.
 */
export const signInWithGoogle = async (): Promise<GoogleResult> => {
    if (!supabase) return {error: "not_configured"};

    if (Platform.OS === "web") {
        const {error} = await supabase.auth.signInWithOAuth({provider: "google", options: {redirectTo: window.location.origin, queryParams: GOOGLE_PARAMS}});
        return error ? {error: mapError(error.message)} : {error: null, isRedirecting: true};
    }

    const redirectTo = Linking.createURL(ROUTES.AUTH_CALLBACK);
    const {data, error} = await supabase.auth.signInWithOAuth({provider: "google", options: {redirectTo, skipBrowserRedirect: true, queryParams: GOOGLE_PARAMS}});
    if (error || !data.url) return {error: mapError(error?.message ?? "")};

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success") return {error: null, cancelled: true};

    const parsed = parseAuthRedirect(result.url);
    if (!parsed) return {error: "generic"};
    if ("error" in parsed) return {error: mapError(parsed.error)};
    const session = await supabase.auth.setSession({access_token: parsed.accessToken, refresh_token: parsed.refreshToken});
    return {error: session.error ? mapError(session.error.message) : null};
};

/**
 * Signs out everywhere. When that request fails (offline, a server error), Supabase keeps the session and only
 * returns the error, which left the device emptied but still signed in; this device is then signed out on
 * its own, which never needs the network.
 */
export const signOut = async (): Promise<void> => {
    if (!supabase) return;
    const {error} = await supabase.auth.signOut();
    if (!error) return;
    if (__DEV__) console.warn("[auth] sign-out", error.message);
    await supabase.auth.signOut({scope: "local"});
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

/**
 * Asks Supabase to move the account to a new address. Nothing changes until the link it emails is opened;
 * with "secure email change" on, the old address gets a link to confirm too.
 */
export const changeEmail = async (email: string): Promise<AuthResult> => {
    if (!supabase) return {error: "not_configured"};
    const {error} = await supabase.auth.updateUser({email});
    return {error: error ? mapError(error.message) : null};
};

export const changePassword = async (password: string): Promise<AuthResult> => {
    if (!supabase) return {error: "not_configured"};
    const {error} = await supabase.auth.updateUser({password});
    return {error: error ? mapError(error.message) : null};
};

/**
 * Deletes the signed-in account through the database function from migration 006; the user's rows go with it
 * (their tables cascade from auth.users). Storage files are removed by the caller first.
 */
export const deleteOwnAccount = async (): Promise<void> => {
    if (!supabase) throw new Error("Supabase is not configured");
    const {error} = await supabase.rpc("delete_my_account");
    if (error) throw error;
    // The session belongs to a user who no longer exists, so only this device's copy is cleared.
    await supabase.auth.signOut({scope: "local"}).catch(() => undefined);
};
