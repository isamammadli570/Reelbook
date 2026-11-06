import {useMemo} from "react";
import {router} from "expo-router";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    createUserList,
    deleteUserList,
    getLists,
    removeFromList,
    restoreToList,
    toggleInList,
    updateUserList,
    type ListsStore,
} from "@/api/lists.api";
import {createListId, listIdsContaining, sortedLists} from "@/helpers/lists";
import {ensureAccount} from "@/lib/accountGate";
import {reportSaveError} from "@/lib/saveError";
import {QUERY_KEYS} from "@/constants/other";
import {buildRoute} from "@/constants/routes";

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
        onError: reportSaveError,
    });
};

export const useCreateList = () => useListsMutation(createUserList);
export const useUpdateList = () => useListsMutation(updateUserList);
export const useDeleteList = () => useListsMutation(deleteUserList);
export const useToggleInList = () => useListsMutation(toggleInList);
export const useRemoveFromList = () => useListsMutation(removeFromList);
export const useRestoreToList = () => useListsMutation(restoreToList);

/** Creates a list and opens it, so the user can start filling it; resolves to whether it was created. */
export const useCreateAndOpenList = () => {
    const {mutateAsync: createList} = useCreateList();
    return async (details: {name: string; description: string}): Promise<boolean> => {
        const id = createListId();
        const isCreated = await createList({id, details}).then(() => true, () => false);
        if (isCreated) router.push(buildRoute.userList(id));
        return isCreated;
    };
};
