import {useEffect, useState} from "react";

const CHUNK_DELAY_MS = 60;

/**
 * How many of `total` items to draw right now: `initial` at once, then `step` more every few frames until all
 * are in. Mounting a few dozen posters in one go blocks the JS thread and freezes the screen being opened;
 * in chunks the page appears first and fills in while it stays responsive.
 */
export const useProgressiveCount = (total: number, initial: number, step: number): number => {
    const [count, setCount] = useState(initial);

    useEffect(() => {
        if (count >= total) return;
        const timer = setTimeout(() => setCount((value) => value + step), CHUNK_DELAY_MS);
        return () => clearTimeout(timer);
    }, [count, total, step]);

    return Math.min(count, total);
};
