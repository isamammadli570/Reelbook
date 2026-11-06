import {useMutation, useQueryClient} from "@tanstack/react-query";
import {QUERY_KEYS} from "@/constants/other";
import {ensureAccount} from "@/lib/accountGate";
import type {Library} from "@/api/library.api";

type LibraryMutationOptions = {
    /** Personal writes need an account. Background bookkeeping, such as refreshing a title's details, does not. */
    requiresAccount?: boolean;
};

/** Library writes return the whole new library, which replaces the cache directly — no refetch round-trip. */
export const useLibraryMutation = <TVariables>(
    mutationFn: (variables: TVariables) => Promise<Library>,
    {requiresAccount = true}: LibraryMutationOptions = {},
) => {
    const queryClient = useQueryClient();

    return useMutation<Library, Error, TVariables>({
        mutationFn: async (variables) => {
            if (requiresAccount) await ensureAccount();
            return mutationFn(variables);
        },
        onSuccess: (library) => queryClient.setQueryData([QUERY_KEYS.LIBRARY], library),
    });
};
