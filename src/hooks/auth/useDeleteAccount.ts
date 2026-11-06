import {useState} from "react";
import {router} from "expo-router";
import {useQueryClient} from "@tanstack/react-query";
import {deleteOwnAccount, getCurrentSession} from "@/api/auth.api";
import {removeProfileImages} from "@/api/profileImages.api";
import {clearDevice} from "@/services/sync";
import {QUERY_KEYS} from "@/constants/other";
import {ROUTES} from "@/constants/routes";

/**
 * Deletes the account for good: its photos, then the account and every row that belongs to it, then this
 * device's copy. Nothing is uploaded first, since it is all being deleted. Returns whether it worked.
 */
export const useDeleteAccount = () => {
    const queryClient = useQueryClient();
    const [isDeleting, setIsDeleting] = useState(false);

    const run = async (): Promise<boolean> => {
        setIsDeleting(true);
        try {
            const session = await getCurrentSession();
            if (!session) return false;
            const userId = session.user.id;
            // Photos first: once the account is gone, the user can no longer delete their own files.
            await Promise.all([removeProfileImages(userId, "avatar"), removeProfileImages(userId, "cover")]).catch(() => undefined);
            await deleteOwnAccount();
            await clearDevice();
            [QUERY_KEYS.LIBRARY, QUERY_KEYS.PROFILE, QUERY_KEYS.LISTS].forEach((key) => void queryClient.invalidateQueries({queryKey: [key]}));
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
