/** Reads the session tokens, or an error, from the link Supabase sends back: in the "#" part, or the "?" part. */
export const parseAuthRedirect = (url: string): {accessToken: string; refreshToken: string} | {error: string} | null => {
    const [, query = ""] = url.split("?");
    const [, fragment = ""] = url.split("#");
    const params = new URLSearchParams(`${query.split("#")[0]}&${fragment}`);
    const error = params.get("error_description") ?? params.get("error");
    if (error) return {error};
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    return accessToken && refreshToken ? {accessToken, refreshToken} : null;
};
