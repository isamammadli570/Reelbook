import {describe, expect, it} from "vitest";
import {parseAuthRedirect} from "@/helpers/authRedirect";

describe("parseAuthRedirect", () => {
    it("takes the tokens from the part after #", () => {
        expect(parseAuthRedirect("reelbook://auth-callback#access_token=abc&refresh_token=def&expires_in=3600&token_type=bearer"))
            .toEqual({accessToken: "abc", refreshToken: "def"});
    });

    it("works with the Expo Go address too", () => {
        expect(parseAuthRedirect("exp://192.168.1.5:8081/--/auth-callback#access_token=a&refresh_token=b")).toEqual({accessToken: "a", refreshToken: "b"});
    });

    it("reports Google or Supabase refusing, from either part", () => {
        expect(parseAuthRedirect("reelbook://auth-callback?error=access_denied&error_description=User+cancelled")).toEqual({error: "User cancelled"});
        expect(parseAuthRedirect("reelbook://auth-callback#error=server_error")).toEqual({error: "server_error"});
    });

    it("gives nothing when the link has no session", () => {
        expect(parseAuthRedirect("reelbook://auth-callback")).toBeNull();
    });
});
