import {useSyncExternalStore} from "react";
import {getSessionState, subscribeSession} from "@/lib/session";

/** The signed-in session, or `null`. `isLoading` is true until the stored session has been read. */
export const useSession = () => useSyncExternalStore(subscribeSession, getSessionState, getSessionState);
