import {Platform, type HostInstance} from "react-native";
import * as Sharing from "expo-sharing";
import {captureRef} from "react-native-view-shot";

export type ShareViewResult = "shared" | "downloaded" | "cancelled";

const isWeb = Platform.OS === "web";

/** Browsers that cannot share a file get it as a download, as any site offers one. */
const downloadInBrowser = (name: string, blob: Blob): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    // The download has started by now; the address is only needed for that.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** The web: the browser's share sheet when it can send a file (phones), otherwise a download. */
const shareInBrowser = async (view: HostInstance, name: string, title: string): Promise<ShareViewResult> => {
    const dataUri = await captureRef(view, {format: "png", quality: 1, result: "data-uri"});
    const blob = await (await fetch(dataUri)).blob();
    const file = new File([blob], name, {type: "image/png"});

    if (typeof navigator.canShare === "function" && navigator.canShare({files: [file]})) {
        try {
            await navigator.share({files: [file], title});
            return "shared";
        } catch (error) {
            // Closing the sheet is not a failure.
            if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
            throw error;
        }
    }
    downloadInBrowser(name, blob);
    return "downloaded";
};

/**
 * Takes a picture of a view and hands it over as an image file: the phone's share sheet, or on the web the
 * browser's own share sheet or a download.
 */
export const shareView = async (view: HostInstance, name: string, title: string): Promise<ShareViewResult> => {
    if (isWeb) return shareInBrowser(view, name, title);
    const uri = await captureRef(view, {format: "png", quality: 1, result: "tmpfile"});
    await Sharing.shareAsync(uri, {mimeType: "image/png", UTI: "public.png", dialogTitle: title});
    return "shared";
};
