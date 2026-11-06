import {useSyncExternalStore} from "react";

export type ToastTone = "info" | "success" | "error";

export type ToastAction = {label: string; onPress: () => void};

export type Toast = {
    id: number;
    message: string;
    tone: ToastTone;
    /** One button, such as "Undo"; pressing it also dismisses the toast. */
    action?: ToastAction;
    /** How long it stays, in milliseconds; toasts with an action stay longer so there is time to reach it. */
    duration: number;
};

export type ToastInput = {message: string; tone?: ToastTone; action?: ToastAction; duration?: number};

const DURATION_MS = 3200;
const ACTION_DURATION_MS = 5500;

let current: Toast | null = null;
let nextId = 1;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/**
 * One toast at a time: a new one replaces the one on screen rather than stacking, so a burst of actions
 * never piles up messages over the page. Callable from anywhere, inside React or not.
 */
export const toast = {
    show: ({message, tone = "info", action, duration}: ToastInput): number => {
        current = {id: nextId, message, tone, action, duration: duration ?? (action ? ACTION_DURATION_MS : DURATION_MS)};
        nextId += 1;
        notify();
        return current.id;
    },
    success: (message: string, action?: ToastAction) => toast.show({message, tone: "success", action}),
    error: (message: string, action?: ToastAction) => toast.show({message, tone: "error", action}),
    /** Hides the given toast, or whichever is showing; a toast already replaced is left alone. */
    dismiss: (id?: number) => {
        if (!current || (id !== undefined && current.id !== id)) return;
        current = null;
        notify();
    },
    current: (): Toast | null => current,
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

/** The toast on screen, for the host that draws it. */
export const useCurrentToast = (): Toast | null => useSyncExternalStore(subscribe, () => current, () => null);
