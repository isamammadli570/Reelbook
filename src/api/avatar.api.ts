import {supabase} from "@/lib/supabase";

const BUCKET = "avatars";

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

/** Every file in the user's folder except `keep`, so old photos do not pile up. */
const removeOthers = async (userId: string, keep: string | null): Promise<void> => {
    const {data} = await bucket().list(userId);
    const stale = (data ?? []).map((file) => `${userId}/${file.name}`).filter((path) => path !== keep);
    if (stale.length) await bucket().remove(stale);
};

/**
 * Uploads a JPEG under a new name each time, so phones and CDNs never show a cached old photo,
 * then removes the previous ones. Returns the public address saved on the profile.
 */
export const uploadAvatar = async (userId: string, base64: string): Promise<string> => {
    const path = `${userId}/${Date.now()}.jpg`;
    const {error} = await bucket().upload(path, toBytes(base64), {contentType: "image/jpeg", cacheControl: "31536000", upsert: false});
    if (error) throw error;
    // Cleanup failing only leaves an unused file behind; the new photo is already in place.
    await removeOthers(userId, path).catch(() => undefined);
    return bucket().getPublicUrl(path).data.publicUrl;
};

export const removeAvatar = (userId: string): Promise<void> => removeOthers(userId, null);
