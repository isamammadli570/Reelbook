import {useMutation, useQueryClient} from "@tanstack/react-query";
import {QUERY_KEYS} from "@/constants/other";
import type {Library} from "@/api/library.api";

/** Library writes return the whole new library, which replaces the cache directly — no refetch round-trip. */
export const useLibraryMutation = <TVariables>(mutationFn: (variables: TVariables) => Promise<Library>) => {
    const queryClient = useQueryClient();

    return useMutation<Library, Error, TVariables>({
        mutationFn,
        onSuccess: (library) => queryClient.setQueryData([QUERY_KEYS.LIBRARY], library),
    });
};
