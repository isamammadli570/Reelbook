import {Platform} from "react-native";
import {File, Paths} from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import {getLibrary, replaceLibrary} from "@/api/library.api";
import {editProfile, getProfile} from "@/api/profile.api";
import {getLists, replaceLists} from "@/api/lists.api";
import {createBackup, hasProfile, parseBackup, prepareRestore, type Backup} from "@/helpers/backup";

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
    const [library, lists, profile] = await Promise.all([getLibrary(), getLists(), getProfile()]);
    const stamp = new Date().toISOString().slice(0, 10);
    const name = `reelbook-${stamp}-${Date.now()}.json`;
    const contents = JSON.stringify(createBackup(library, lists, profile, new Date().toISOString()), null, 2);

    if (isWeb) {
        downloadInBrowser(name, contents);
        return;
    }
    const file = new File(Paths.cache, name);
    file.create();
    await file.write(contents);
    await Sharing.shareAsync(file.uri, {mimeType: "application/json", dialogTitle: "Reelbook"});
};

export type PickResult = {status: "cancelled"} | {status: "invalid"} | {status: "picked"; backup: Backup};

/** Lets the user pick a backup file and reads it; nothing on the device changes until `applyBackup`. */
export const pickBackup = async (): Promise<PickResult> => {
    const picked = await DocumentPicker.getDocumentAsync({type: "application/json", copyToCacheDirectory: true});
    const asset = picked.canceled ? null : picked.assets?.[0];
    if (!asset) return {status: "cancelled"};

    // On the web the picker hands over the browser's own File; on a phone, a copy in the app's cache.
    const text = isWeb && asset.file ? await asset.file.text() : new File(asset.uri).textSync();
    const backup = parseBackup(text);
    return backup ? {status: "picked", backup} : {status: "invalid"};
};

/** Replaces the library, the lists (when the backup has them) and the profile (when it has one) with the backup. */
export const applyBackup = async (backup: Backup): Promise<void> => {
    const [library, lists] = await Promise.all([getLibrary(), getLists()]);
    const restore = prepareRestore(backup, {library, lists}, new Date().toISOString());

    // A backup made elsewhere (converted from another app) has no profile; then the one here stays as it is.
    if (hasProfile(backup.profile)) await editProfile(backup.profile);
    await replaceLibrary(restore.library);
    if (restore.lists) await replaceLists(restore.lists);
};
