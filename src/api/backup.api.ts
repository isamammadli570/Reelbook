import {File, Paths} from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import {getLibrary, replaceLibrary, type Library} from "@/api/library.api";
import {getProfile, saveProfile, type Profile} from "@/api/profile.api";
import {createBackup, parseBackup} from "@/helpers/backup";

/** Writes the library and profile to a JSON file in the cache and opens the system share sheet. */
export const exportBackup = async (): Promise<void> => {
    const [library, profile] = await Promise.all([getLibrary(), getProfile()]);
    const stamp = new Date().toISOString().slice(0, 10);
    const file = new File(Paths.cache, `reelbook-${stamp}-${Date.now()}.json`);
    file.create();
    await file.write(JSON.stringify(createBackup(library, profile, new Date().toISOString()), null, 2));
    await Sharing.shareAsync(file.uri, {mimeType: "application/json", dialogTitle: "Reelbook"});
};

export type ImportResult = {status: "cancelled"} | {status: "invalid"} | {status: "imported"; library: Library; profile: Profile};

/** Lets the user pick a backup file and, if it is valid, replaces the local library and profile with it. */
export const importBackup = async (): Promise<ImportResult> => {
    const picked = await DocumentPicker.getDocumentAsync({type: "application/json", copyToCacheDirectory: true});
    if (picked.canceled || !picked.assets?.[0]) return {status: "cancelled"};

    const backup = parseBackup(new File(picked.assets[0].uri).textSync());
    if (!backup) return {status: "invalid"};

    const [library, profile] = await Promise.all([replaceLibrary(backup.library), saveProfile(backup.profile)]);
    return {status: "imported", library, profile};
};
