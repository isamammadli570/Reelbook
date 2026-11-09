import {useCallback, useEffect, useState} from "react";
import {Platform} from "react-native";

/** Chrome's install prompt event; not in the DOM typings. */
type InstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{outcome: "accepted" | "dismissed"}>;
};

type InstallMode = "hidden" | "prompt" | "ios";

const isWeb = Platform.OS === "web" && typeof window !== "undefined";

// The browser fires this once, often before Settings is open, so it is caught at load and kept.
let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

let isWatching = false;

/**
 * Starts catching the install prompt. Call it once at app start (the root layout does): Settings loads lazily,
 * long after the browser has fired the event, so listening only there would miss it.
 */
export const watchInstallPrompt = () => {
    if (!isWeb || isWatching) return;
    isWatching = true;
    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredPrompt = event as InstallPromptEvent;
        notify();
    });
    window.addEventListener("appinstalled", () => {
        deferredPrompt = null;
        notify();
    });
    // The service worker (public/sw.js) is part of what makes browsers offer the install. Left out in dev,
    // where a cached page would only get in the way of reloads.
    if (!__DEV__ && "serviceWorker" in navigator) {
        void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
};

watchInstallPrompt();

const isStandalone = () => isWeb && (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & {standalone?: boolean}).standalone === true);

/** iPhones and iPads (iPadOS reports itself as a Mac with a touch screen). */
const isIos = () => isWeb && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

/**
 * Lets the web version be put on the home screen / installed as an app.
 * Android and desktop Chrome/Edge install straight from a button; iOS has no such API, so it needs the manual steps.
 */
export const useInstallApp = () => {
    const [, rerender] = useState(0);

    useEffect(() => {
        const listener = () => rerender((value) => value + 1);
        listeners.add(listener);
        return () => void listeners.delete(listener);
    }, []);

    let mode: InstallMode = "hidden";
    if (isWeb && !isStandalone()) {
        if (deferredPrompt) mode = "prompt";
        else if (isIos()) mode = "ios";
    }

    const install = useCallback(async () => {
        if (!deferredPrompt) return;
        const prompt = deferredPrompt;
        deferredPrompt = null; // a prompt event can only be used once
        await prompt.prompt();
        await prompt.userChoice;
        notify();
    }, []);

    return {mode, install};
};
