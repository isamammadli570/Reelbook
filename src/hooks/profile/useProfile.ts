import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {getProfile, saveProfile, type Profile} from "@/api/profile.api";
import {QUERY_KEYS} from "@/constants/other";

export const useGetProfile = () =>
    useQuery({
        queryKey: [QUERY_KEYS.PROFILE],
        queryFn: getProfile,
        staleTime: Infinity,
        gcTime: Infinity,
    });

export const useSaveProfile = () => {
    const queryClient = useQueryClient();

    return useMutation<Profile, Error, Profile>({
        mutationFn: saveProfile,
        onSuccess: (profile) => queryClient.setQueryData([QUERY_KEYS.PROFILE], profile),
    });
};
