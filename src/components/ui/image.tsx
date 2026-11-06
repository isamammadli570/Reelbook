import type {ComponentProps} from "react";
import {Image as ExpoImage} from "expo-image";
import {withUniwind} from "uniwind";

const StyledImage = withUniwind(ExpoImage);

/** A fade every image shares, so posters and photos never pop in. */
const FADE_IN_MS = 220;

/**
 * expo-image with `className` support; images fade in as they load unless a caller sets its own transition.
 * Decoded images are also kept in memory, so a poster seen a moment ago (going back, scrolling up) shows at
 * once instead of being read and decoded from disk again.
 */
export const Image = ({transition = FADE_IN_MS, cachePolicy = "memory-disk", ...props}: ComponentProps<typeof StyledImage>) => (
    <StyledImage transition={transition} cachePolicy={cachePolicy} {...props}/>
);
