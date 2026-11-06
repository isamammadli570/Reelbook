import {useEffect, useRef} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {storePeople, type TitlePeople} from "@/api/library.api";
import {getTitlePeople} from "@/api/titlePeople.api";
import {useGetLibrary} from "@/hooks/library/useLibrary";
import {itemKey} from "@/helpers/library";
import {QUERY_KEYS, MEDIA_TYPE} from "@/constants/other";

/** Requests at once, gentle on TMDB while the stats page is open. */
const CONCURRENCY = 4;
/** Found people are saved in batches, so the page fills in as it goes without a write per title. */
const BATCH = 20;

/**
 * Titles watched before people were kept have no directors or cast stored. While the stats page is open
 * this fetches them in the background, once per title; one that fails is simply tried again next time.
 */
export const useBackfillPeople = () => {
    const queryClient = useQueryClient();
    const {data: library} = useGetLibrary();
    const hasStarted = useRef(false);
    // Stopped only by leaving the page: each saved batch changes the library, which must not end the run.
    const isLeaving = useRef(false);

    useEffect(() => {
        isLeaving.current = false;
        return () => {
            isLeaving.current = true;
        };
    }, []);

    useEffect(() => {
        if (!library || hasStarted.current) return;
        const missing = Object.values(library.items).filter((item) =>
            !item.people && (item.mediaType === MEDIA_TYPE.MOVIE ? item.diary.length > 0 : Object.keys(item.episodes).length > 0));
        if (!missing.length) return;
        hasStarted.current = true;

        let next = 0;
        let pending: Record<string, TitlePeople> = {};

        const flush = async () => {
            if (!Object.keys(pending).length) return;
            const batch = pending;
            pending = {};
            await storePeople(batch);
            void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LIBRARY]});
        };

        const worker = async () => {
            while (next < missing.length && !isLeaving.current) {
                const item = missing[next++];
                try {
                    pending[itemKey(item.mediaType, item.id)] = await getTitlePeople(item.mediaType, item.id);
                    if (Object.keys(pending).length >= BATCH) await flush();
                } catch {
                    // Left without people; the next visit tries again.
                }
            }
        };

        // Whatever was found is saved at the end, also when the page is left part way.
        void Promise.all(Array.from({length: Math.min(CONCURRENCY, missing.length)}, worker)).then(flush);
    }, [library, queryClient]);
};
