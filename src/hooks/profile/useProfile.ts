import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {editProfile, getProfile, type Profile} from "@/api/profile.api";
import {pushProfileNow} from "@/services/sync";
import {ensureAccount} from "@/lib/accountGate";
import {reportSaveError} from "@/lib/saveError";
import {QUERY_KEYS} from "@/constants/other";

export const useGetProfile = () =>
    useQuery({
        queryKey: [QUERY_KEYS.PROFILE],
        queryFn: getProfile,
        staleTime: Infinity,
        gcTime: Infinity,
    });

/** Editing the profile needs an account, because the profile is uploaded for other devices. */
export const useSaveProfile = () => {
    const queryClient = useQueryClient();

    return useMutation<Profile, Error, Profile>({
        mutationFn: async (profile) => {
            await ensureAccount();
            return editProfile(profile);
        },
        onSuccess: (profile) => {
            queryClient.setQueryData([QUERY_KEYS.PROFILE], profile);
            // Straight to the server; if that fails, the next sync sends it, since this edit is the newer one.
            void pushProfileNow();
        },
        onError: reportSaveError,
    });
};
