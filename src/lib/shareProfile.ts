import {Platform, Share} from "react-native";
import {ENV} from "@/lib/env";
import {buildRoute} from "@/constants/routes";

export type ShareProfileResult = "shared" | "copied" | "cancelled";

const isWeb = Platform.OS === "web";

/** The web app's address: the page's own on the web, the configured one in the phone apps. */
const siteOrigin = (): string => (isWeb && typeof window !== "undefined" ? window.location.origin : ENV.siteUrl);

/** The link that opens someone's profile, for anyone, signed in or not. */
export const profileUrl = (username: string): string => `${siteOrigin()}${buildRoute.user(username)}`;

/** The web: the browser's share sheet where there is one (phones), otherwise the link is copied. */
const shareInBrowser = async (url: string, title: string): Promise<ShareProfileResult> => {
    if (typeof navigator.share === "function") {
        try {
            await navigator.share({title, url});
            return "shared";
        } catch (error) {
            // Closing the sheet is not a failure.
            if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
        }
    }
    await navigator.clipboard.writeText(url);
    return "copied";
};

/**
 * Hands the profile's link to the share sheet. Without a configured web address the phone apps share the
 * @username instead, which still finds the person in search.
 */
export const shareProfile = async (username: string, title: string): Promise<ShareProfileResult> => {
    if (isWeb) return shareInBrowser(profileUrl(username), title);
    const message = siteOrigin() ? profileUrl(username) : `${title} @${username}`;
    const result = await Share.share({message, title});
    return result.action === Share.dismissedAction ? "cancelled" : "shared";
};
