import {useEffect, useState, type ReactNode} from "react";
import {AppState, Platform} from "react-native";
import {focusManager, QueryClient, QueryClientProvider} from "@tanstack/react-query";
import i18n from "@/i18n";

/**
 * The browser tells React Query when the page is shown again; a phone app does not, so without this a query
 * asking to refresh on focus never did. Coming back to the app now counts as focus.
 */
const followAppState = () => {
    if (Platform.OS === "web") return () => undefined;
    const subscription = AppState.addEventListener("change", (state) => focusManager.setFocused(state === "active"));
    return () => subscription.remove();
};

const createQueryClient = (): QueryClient =>
    new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                // TMDB catalogue data changes slowly; a few minutes of freshness saves requests.
                staleTime: 5 * 60_000,
                gcTime: 30 * 60_000,
                retry: (count, error) => {
                    const status = (error as {status?: number}).status;
                    if (status === 401 || status === 404) return false;
                    return count < 1;
                },
            },
        },
    });

type QueryProviderProps = {children: ReactNode};

/** Owns the app's QueryClient; errors are shown in place by `QueryErrorState`, not as global toasts. */
export const QueryProvider = ({children}: QueryProviderProps) => {
    const [queryClient] = useState(createQueryClient);

    useEffect(followAppState, []);

    // Cached responses were fetched in the previous language and do not translate themselves.
    useEffect(() => {
        const refetchAll = () => void queryClient.invalidateQueries();
        i18n.on("languageChanged", refetchAll);
        return () => i18n.off("languageChanged", refetchAll);
    }, [queryClient]);

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
