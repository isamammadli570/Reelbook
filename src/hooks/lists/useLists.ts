import {useMemo} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    createUserList,
    deleteUserList,
    getLists,
    removeFromList,
    toggleInList,
    updateUserList,
    type ListsStore,
} from "@/api/lists.api";
import {listIdsContaining, sortedLists} from "@/helpers/lists";
import {ensureAccount} from "@/lib/accountGate";
import {QUERY_KEYS} from "@/constants/other";

/** All of the user's lists from device storage; only this app writes them, so they never go stale. */
export const useGetLists = () =>
    useQuery({
        queryKey: [QUERY_KEYS.LISTS],
        queryFn: getLists,
        staleTime: Infinity,
        gcTime: Infinity,
    });

export const useUserLists = () => {
    const {data, ...query} = useGetLists();
    const lists = useMemo(() => (data ? sortedLists(data) : []), [data]);
    return {...query, lists};
};

export const useUserList = (id: string) => {
    const {data, ...query} = useGetLists();
    return {...query, list: data?.lists[id]};
};

/** The lists that already hold a title, for the ticks in the "add to list" sheet. */
export const useListIdsContaining = (key: string) => {
    const {data} = useGetLists();
    return useMemo(() => (data ? listIdsContaining(data, key) : new Set<string>()), [data, key]);
};

/** List writes need an account, return the whole store, and replace the cache directly. */
const useListsMutation = <TVariables>(mutationFn: (variables: TVariables) => Promise<ListsStore>) => {
    const queryClient = useQueryClient();

    return useMutation<ListsStore, Error, TVariables>({
        mutationFn: async (variables) => {
            await ensureAccount();
            return mutationFn(variables);
        },
        onSuccess: (store) => queryClient.setQueryData([QUERY_KEYS.LISTS], store),
    });
};

export const useCreateList = () => useListsMutation(createUserList);
export const useUpdateList = () => useListsMutation(updateUserList);
export const useDeleteList = () => useListsMutation(deleteUserList);
export const useToggleInList = () => useListsMutation(toggleInList);
export const useRemoveFromList = () => useListsMutation(removeFromList);
