// Trakt sign-in and read-only data access for the Reelbook import.
//
// Sign-in uses Trakt's device flow: the person types a short code at trakt.tv/activate and the app asks here
// until it is approved. Trakt stopped issuing Client Secrets to new apps in October 2026, so the flow runs on
// the Client ID with PKCE (a one-time verifier the app keeps for the session); a secret, if an older app has
// one, is still sent. Browsers cannot call Trakt directly (no CORS), so every call goes through here too.
// Nothing is stored: the token goes back to the app for the import and is revoked when the import ends.
//
// Secrets (Supabase → Edge Functions → Secrets): TRAKT_CLIENT_ID; TRAKT_CLIENT_SECRET only for older apps.
// Optional: TRAKT_OAUTH_URL, should Trakt move sign-in to its own host (https://auth.trakt.tv).
// Only signed-in Reelbook users can call it: Supabase checks their session before this code runs.

const TRAKT = "https://api.trakt.tv";
const OAUTH = Deno.env.get("TRAKT_OAUTH_URL") || TRAKT;
const CLIENT_ID = Deno.env.get("TRAKT_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("TRAKT_CLIENT_SECRET") ?? "";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** The only Trakt pages the import reads: the person's own history, ratings and watchlist, and their lists. */
const READABLE = [
    /^\/sync\/history\/movies$/,
    /^\/sync\/watched\/shows$/,
    /^\/sync\/ratings\/(movies|shows)$/,
    /^\/sync\/watchlist\/(movies|shows)$/,
    /^\/users\/me\/lists$/,
    /^\/users\/me\/lists\/[A-Za-z0-9_-]+\/items\/(movies|shows|movie,show)$/,
];

const traktHeaders = (token?: string): HeadersInit => ({
    "Content-Type": "application/json",
    "User-Agent": "Reelbook/1.0",
    "trakt-api-version": "2",
    "trakt-api-key": CLIENT_ID,
    ...(token ? {Authorization: `Bearer ${token}`} : {}),
});

/** The secret goes along only for an app that has one; new apps sign in with the Client ID and PKCE alone. */
const withSecret = (body: Record<string, unknown>) => (CLIENT_SECRET ? {...body, client_secret: CLIENT_SECRET} : body);

/** Always 200 to the app, with Trakt's own status inside: the app treats "still waiting" (400) as normal. */
const reply = (body: unknown): Response =>
    new Response(JSON.stringify(body), {headers: {...CORS, "Content-Type": "application/json"}});

const readJson = async (response: Response): Promise<unknown> => {
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
};

const post = async (path: string, body: Record<string, unknown>) => {
    const response = await fetch(`${OAUTH}${path}`, {method: "POST", headers: traktHeaders(), body: JSON.stringify(body)});
    return {status: response.status, data: await readJson(response)};
};

const base64Url = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** A PKCE pair: a random verifier the app keeps, and its SHA-256 challenge Trakt gets first. */
const pkcePair = async (): Promise<{verifier: string; challenge: string}> => {
    const verifier = base64Url(crypto.getRandomValues(new Uint8Array(48)));
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
    return {verifier, challenge: base64Url(digest)};
};

Deno.serve(async (request) => {
    if (request.method === "OPTIONS") return new Response("ok", {headers: CORS});
    if (request.method !== "POST") return new Response("Method not allowed", {status: 405, headers: CORS});
    if (!CLIENT_ID) return reply({status: 500, error: "not_configured"});

    let input: {action?: string; deviceCode?: string; verifier?: string; token?: string; path?: string; page?: number};
    try {
        input = await request.json();
    } catch {
        return reply({status: 400, error: "bad_request"});
    }

    switch (input.action) {
        // Step 1: a code for the person to type at trakt.tv/activate, and the verifier the app keeps for step 2.
        case "device_code": {
            const {verifier, challenge} = await pkcePair();
            const result = await post("/oauth/device/code", {client_id: CLIENT_ID, code_challenge: challenge, code_challenge_method: "S256"});
            return reply({...result, verifier});
        }

        // Step 2, repeated: has the person approved yet? 400 means not yet, 200 brings the token.
        case "poll": {
            if (!input.deviceCode) return reply({status: 400, error: "missing_code"});
            return reply(await post("/oauth/device/token", withSecret({
                code: input.deviceCode,
                client_id: CLIENT_ID,
                ...(input.verifier ? {code_verifier: input.verifier} : {}),
            })));
        }

        // Step 3: read one page of the person's data with their token.
        case "get": {
            const path = input.path ?? "";
            if (!input.token || !READABLE.some((pattern) => pattern.test(path))) return reply({status: 403, error: "not_allowed"});
            const query = input.page ? `?page=${Math.max(1, Math.floor(input.page))}&limit=100` : "";
            const response = await fetch(`${TRAKT}${path}${query}`, {headers: traktHeaders(input.token)});
            return reply({
                status: response.status,
                data: await readJson(response),
                pageCount: Number(response.headers.get("x-pagination-page-count") ?? "1"),
            });
        }

        // Step 4: the import is done; the token stops working.
        case "revoke": {
            if (!input.token) return reply({status: 400, error: "missing_token"});
            return reply(await post("/oauth/revoke", withSecret({token: input.token, client_id: CLIENT_ID})));
        }

        default:
            return reply({status: 400, error: "unknown_action"});
    }
});
