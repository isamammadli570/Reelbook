import {Platform} from "react-native";
import {File, Paths} from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import {getLibrary, replaceLibrary, type Library} from "@/api/library.api";
import {getProfile, saveProfile, type Profile} from "@/api/profile.api";
import {createBackup, parseBackup} from "@/helpers/backup";

const isWeb = Platform.OS === "web";

/** Browsers have no share sheet; the file is downloaded instead, as any site offers a file. */
const downloadInBrowser = (name: string, contents: string): void => {
    const url = URL.createObjectURL(new Blob([contents], {type: "application/json"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    // The download has started by now; the address is only needed for that.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Writes the library and profile to a JSON file: shared from the phone, downloaded on the web. */
export const exportBackup = async (): Promise<void> => {
    const [library, profile] = await Promise.all([getLibrary(), getProfile()]);
    const stamp = new Date().toISOString().slice(0, 10);
    const name = `reelbook-${stamp}-${Date.now()}.json`;
    const contents = JSON.stringify(createBackup(library, profile, new Date().toISOString()), null, 2);

    if (isWeb) {
        downloadInBrowser(name, contents);
        return;
    }
    const file = new File(Paths.cache, name);
    file.create();
    await file.write(contents);
    await Sharing.shareAsync(file.uri, {mimeType: "application/json", dialogTitle: "Reelbook"});
};

export type ImportResult = {status: "cancelled"} | {status: "invalid"} | {status: "imported"; library: Library; profile: Profile};

/** Lets the user pick a backup file and, if it is valid, replaces the local library and profile with it. */
export const importBackup = async (): Promise<ImportResult> => {
    const picked = await DocumentPicker.getDocumentAsync({type: "application/json", copyToCacheDirectory: true});
    const asset = picked.canceled ? null : picked.assets?.[0];
    if (!asset) return {status: "cancelled"};

    // On the web the picker hands over the browser's own File; on a phone, a copy in the app's cache.
    const text = isWeb && asset.file ? await asset.file.text() : new File(asset.uri).textSync();
    const backup = parseBackup(text);
    if (!backup) return {status: "invalid"};

    const [library, profile] = await Promise.all([replaceLibrary(backup.library), saveProfile(backup.profile)]);
    return {status: "imported", library, profile};
};
