import {createContext} from "react";

/**
 * Whether `Reveal` plays its entrance here. A long virtual list turns it off for rows below the first screen:
 * those mount while scrolling, where an animation per poster only costs frames and is never really seen.
 */
export const EntranceContext = createContext(true);
