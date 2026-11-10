import {useState} from "react";
import {router} from "expo-router";
import {useQueryClient} from "@tanstack/react-query";
import {deleteOwnAccount, getCurrentSession} from "@/api/auth.api";
import {removeProfileImages} from "@/api/profileImages.api";
import {clearDevice, runExclusive} from "@/services/sync";
import {resetAccountCache} from "@/lib/accountCache";
import {ROUTES} from "@/constants/routes";

/**
 * Deletes the account for good: its photos, then the account and every row that belongs to it, then this
 * device's copy. Nothing is uploaded first, since it is all being deleted. Returns whether it worked.
 * It waits behind any sync already running, so none of them writes the deleted account back to the device.
 */
export const useDeleteAccount = () => {
    const queryClient = useQueryClient();
    const [isDeleting, setIsDeleting] = useState(false);

    const run = async (): Promise<boolean> => {
        setIsDeleting(true);
        try {
            const isDeleted = await runExclusive(async () => {
                const session = await getCurrentSession();
                if (!session) return false;
                const userId = session.user.id;
                // Photos first: once the account is gone, the user can no longer delete their own files.
                await Promise.all([removeProfileImages(userId, "avatar"), removeProfileImages(userId, "cover")]).catch(() => undefined);
                await deleteOwnAccount();
                await clearDevice();
                return true;
            });
            if (!isDeleted) return false;
            resetAccountCache(queryClient);
            router.replace(ROUTES.HOME);
            return true;
        } catch {
            return false;
        } finally {
            setIsDeleting(false);
        }
    };

    return {deleteAccount: run, isDeleting};
};
