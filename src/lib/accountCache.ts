import type {QueryClient} from "@tanstack/react-query";
import {EMPTY_PROFILE} from "@/api/profile.api";
import {createLibrary} from "@/helpers/library";
import {createListsStore} from "@/helpers/lists";
import {QUERY_KEYS} from "@/constants/other";

/**
 * After the device has been emptied (signed out, account deleted): the screens show the empty device at once.
 * Marking the queries stale was not enough, because until each one had been read again the screens kept
 * drawing the old account's name, photo and library. Other people's data read for the old account goes too.
 */
export const resetAccountCache = (queryClient: QueryClient): void => {
    queryClient.setQueryData([QUERY_KEYS.PROFILE], EMPTY_PROFILE);
    queryClient.setQueryData([QUERY_KEYS.LIBRARY], createLibrary());
    queryClient.setQueryData([QUERY_KEYS.LISTS], createListsStore());
    void queryClient.resetQueries({queryKey: [QUERY_KEYS.SOCIAL]});
};
