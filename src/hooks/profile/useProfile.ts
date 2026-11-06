import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {getProfile, saveProfile, type Profile} from "@/api/profile.api";
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
            return saveProfile(profile);
        },
        onSuccess: (profile) => queryClient.setQueryData([QUERY_KEYS.PROFILE], profile),
        onError: reportSaveError,
    });
};
