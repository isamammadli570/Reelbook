import {useEffect, useRef, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {importLetterboxdMatches, matchLetterboxdFilms, pickLetterboxdExport, type MatchResult} from "@/api/letterboxd.api";
import {
    collectLetterboxd,
    collectLetterboxdLists,
    hasLibraryData,
    listCounts,
    listFilmsToFind,
    snapshotsByFilm,
    summarizeLetterboxd,
    type LetterboxdList,
    type LetterboxdSummary,
} from "@/helpers/letterboxd";
import {QUERY_KEYS} from "@/constants/other";

/** What the preview shows: the library counts, plus how many lists and list entries come along. */
export type ImportSummary = LetterboxdSummary & {lists: number; listEntries: number};

type Prepared = {result: MatchResult; lists: LetterboxdList[]; summary: ImportSummary};

export type LetterboxdImportState =
    | {step: "idle"; error?: "invalid" | "empty" | "failed"}
    | {step: "matching"; done: number; total: number}
    | ({step: "preview"} & Prepared)
    | ({step: "importing"} & Prepared)
    | {step: "done"; summary: ImportSummary; unmatched: number};

/**
 * Pick the export, find each film on TMDB with progress shown, preview what will come in, then write it.
 * Films from the diary, ratings and lists are found in one pass. Leaving the page stops the search.
 */
export const useLetterboxdImport = () => {
    const queryClient = useQueryClient();
    const [state, setState] = useState<LetterboxdImportState>({step: "idle"});
    const signal = useRef({isCancelled: false});

    useEffect(() => {
        const current = signal.current;
        return () => {
            current.isCancelled = true;
        };
    }, []);

    const choose = async () => {
        try {
            const picked = await pickLetterboxdExport();
            if (picked.status === "cancelled") return;
            if (picked.status === "invalid") return setState({step: "idle", error: "invalid"});

            const films = collectLetterboxd(picked.files);
            const lists = collectLetterboxdLists(picked.files);
            const toFind = [...films, ...listFilmsToFind(lists, films)];
            if (!toFind.length) return setState({step: "idle", error: "empty"});

            setState({step: "matching", done: 0, total: toFind.length});
            const result = await matchLetterboxdFilms(toFind, (done) => setState({step: "matching", done, total: toFind.length}), signal.current);
            if (signal.current.isCancelled) return;

            // Counts only what was found, since that is all that will be written.
            const counts = listCounts(lists, snapshotsByFilm(result.matched));
            const summary: ImportSummary = {
                ...summarizeLetterboxd(result.matched.map((match) => match.film).filter(hasLibraryData)),
                lists: counts.lists,
                listEntries: counts.entries,
            };
            setState({step: "preview", result, lists, summary});
        } catch {
            setState({step: "idle", error: "failed"});
        }
    };

    const confirm = async () => {
        if (state.step !== "preview") return;
        const {result, lists, summary} = state;
        setState({step: "importing", result, lists, summary});
        try {
            await importLetterboxdMatches(result.matched, lists);
            void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LIBRARY]});
            void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LISTS]});
            setState({step: "done", summary, unmatched: result.unmatched.length});
        } catch {
            setState({step: "preview", result, lists, summary});
            throw new Error("import failed");
        }
    };

    const reset = () => setState({step: "idle"});

    return {state, choose, confirm, reset};
};
