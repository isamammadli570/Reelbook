import {supabase} from "@/lib/supabase";

/** The bucket made by migration 004; avatars and covers share each user's folder. */
const BUCKET = "avatars";

export type ProfileImageKind = "avatar" | "cover";

/** Base64 from the image manipulator to the bytes Storage uploads; `atob` exists on Hermes and in browsers. */
const toBytes = (base64: string): Uint8Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
};

const bucket = () => {
    if (!supabase) throw new Error("Supabase is not configured");
    return supabase.storage.from(BUCKET);
};

/** Avatars uploaded before covers existed are named only by their timestamp. */
const isOfKind = (name: string, kind: ProfileImageKind): boolean =>
    name.startsWith(`${kind}-`) || (kind === "avatar" && /^\d+\.jpg$/.test(name));

/** Every file of this kind in the user's folder except `keep`, so old photos do not pile up. */
const removeOthers = async (userId: string, kind: ProfileImageKind, keep: string | null): Promise<void> => {
    const {data} = await bucket().list(userId);
    const stale = (data ?? [])
        .filter((file) => isOfKind(file.name, kind))
        .map((file) => `${userId}/${file.name}`)
        .filter((path) => path !== keep);
    if (stale.length) await bucket().remove(stale);
};

/**
 * Uploads a JPEG under a new name each time, so phones and CDNs never show a cached old picture,
 * then removes the previous ones of the same kind. Returns the public address saved on the profile.
 */
export const uploadProfileImage = async (userId: string, kind: ProfileImageKind, base64: string): Promise<string> => {
    const path = `${userId}/${kind}-${Date.now()}.jpg`;
    const {error} = await bucket().upload(path, toBytes(base64), {contentType: "image/jpeg", cacheControl: "31536000", upsert: false});
    if (error) throw error;
    // Cleanup failing only leaves an unused file behind; the new picture is already in place.
    await removeOthers(userId, kind, path).catch(() => undefined);
    return bucket().getPublicUrl(path).data.publicUrl;
};

export const removeProfileImages = (userId: string, kind: ProfileImageKind): Promise<void> => removeOthers(userId, kind, null);
