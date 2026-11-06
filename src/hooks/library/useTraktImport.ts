import {useEffect, useRef, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {
    fetchTraktExport,
    importTraktMatches,
    matchTraktTitles,
    pollDeviceToken,
    requestDeviceCode,
    revokeToken,
    TraktError,
    type DeviceCode,
    type TraktMatchResult,
    type TraktStep,
} from "@/api/trakt.api";
import {collectTrakt, summarizeTrakt, type TraktImportList, type TraktSummary} from "@/helpers/trakt";
import {QUERY_KEYS} from "@/constants/other";

export type TraktImportError = "not_configured" | "unavailable" | "failed" | "denied" | "expired";

type Prepared = {result: TraktMatchResult; lists: TraktImportList[]; summary: TraktSummary; missing: string[]};

export type TraktImportState =
    | {step: "idle"; error?: TraktImportError}
    | {step: "connecting"; userCode: string; verificationUrl: string}
    | {step: "fetching"; part: TraktStep}
    | {step: "matching"; done: number; total: number}
    | ({step: "preview"} & Prepared)
    | ({step: "importing"} & Prepared)
    | {step: "done"; summary: TraktSummary};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Connect to Trakt with a code entered at trakt.tv/activate, read the history, ratings, watchlist and lists,
 * find each title on TMDB, preview, then write. The Trakt token lives only in memory and is revoked when the
 * import ends or the page is left.
 */
export const useTraktImport = () => {
    const queryClient = useQueryClient();
    const [state, setState] = useState<TraktImportState>({step: "idle"});
    const token = useRef<string | null>(null);
    // Bumped on cancel or leaving, so a poll or fetch still running sees it is no longer wanted.
    const run = useRef(0);

    const forgetToken = () => {
        if (token.current) void revokeToken(token.current);
        token.current = null;
    };

    useEffect(() => () => {
        run.current += 1;
        forgetToken();
    }, []);

    const fail = (error: unknown) => setState({step: "idle", error: error instanceof TraktError ? error.kind : "failed"});

    /** Polls until the code is approved, refused or runs out, at the pace Trakt asked for. */
    const waitForApproval = async (code: DeviceCode, current: number): Promise<string | null> => {
        const {deviceCode, interval, expiresIn, verifier} = code;
        let pause = interval * 1000;
        const deadline = Date.now() + expiresIn * 1000;
        while (Date.now() < deadline) {
            await wait(pause);
            if (run.current !== current) return null;
            const result = await pollDeviceToken(deviceCode, verifier);
            if (result.state === "approved") return result.token;
            if (result.state === "slow_down") pause += 1000;
            if (result.state === "denied" || result.state === "invalid") {
                setState({step: "idle", error: "denied"});
                return null;
            }
            if (result.state === "expired") break;
        }
        if (run.current === current) setState({step: "idle", error: "expired"});
        return null;
    };

    const start = async () => {
        const current = ++run.current;
        try {
            const code = await requestDeviceCode();
            if (run.current !== current) return;
            setState({step: "connecting", userCode: code.userCode, verificationUrl: code.verificationUrl});

            const approved = await waitForApproval(code, current);
            if (!approved || run.current !== current) return;
            token.current = approved;

            const data = await fetchTraktExport(approved, (part) => run.current === current && setState({step: "fetching", part}));
            if (run.current !== current) return;
            const collected = collectTrakt(data);

            setState({step: "matching", done: 0, total: collected.titles.length});
            const signal = {isCancelled: false};
            const result = await matchTraktTitles(collected.titles, (done) => {
                if (run.current !== current) signal.isCancelled = true;
                else setState({step: "matching", done, total: collected.titles.length});
            }, signal);
            if (run.current !== current) return;

            const found = new Set(result.matched.map((match) => match.title.key));
            const missing = [
                ...collected.missing.map((entry) => (entry.year ? `${entry.title} (${entry.year})` : entry.title)),
                ...result.failed.map((title) => (title.year ? `${title.title} (${title.year})` : title.title)),
            ];
            setState({step: "preview", result, lists: collected.lists, summary: summarizeTrakt(collected.titles, collected.lists, found), missing});
        } catch (error) {
            if (run.current === current) fail(error);
            forgetToken();
        }
    };

    const confirm = async () => {
        if (state.step !== "preview") return;
        const prepared = state;
        setState({...prepared, step: "importing"});
        try {
            await importTraktMatches(prepared.result.matched, prepared.lists);
            void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LIBRARY]});
            void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LISTS]});
            forgetToken();
            setState({step: "done", summary: prepared.summary});
        } catch {
            setState({...prepared, step: "preview"});
            throw new Error("import failed");
        }
    };

    /** Stops whatever is running and starts over; the token, if any, is revoked. */
    const cancel = () => {
        run.current += 1;
        forgetToken();
        setState({step: "idle"});
    };

    return {state, start, confirm, cancel};
};
