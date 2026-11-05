import {useWindowDimensions} from "react-native";
import {MAX_CONTENT_WIDTH, POSTER_COLUMNS} from "@/constants/other";

const GUTTER = 20;
const GAP = 10;

/** React Native has no `calc()`, so the poster grid computes its column width from the screen. */
export const usePosterWidth = (columns: number = POSTER_COLUMNS): number => {
    const {width} = useWindowDimensions();
    const content = Math.min(width, MAX_CONTENT_WIDTH) - GUTTER * 2;
    return Math.floor((content - GAP * (columns - 1)) / columns);
};

export const POSTER_GAP = GAP;
export const SCREEN_GUTTER = GUTTER;
