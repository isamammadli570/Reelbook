import {memo, type ReactNode} from "react";
import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {Image} from "@/components/ui/image";
import {imageUrl, mediaTitle, mediaYear} from "@/helpers/media";
import {IMAGE_SIZE} from "@/constants/other";
import type {MediaSummary} from "@/api/media.api";

/** Only the first posters animate in; later ones mount while scrolling or in chunks, where it only costs frames. */
const ENTRANCE_POSTERS = 8;

type PosterCardProps = {
    media: MediaSummary;
    width: number;
    rank?: number;
    index?: number;
    /** Shown instead of "type · year" when given. */
    footer?: ReactNode;
    /** Poster only, for rows where the poster already says what it is; a footer still shows. */
    isCompact?: boolean;
    onPress?: (media: MediaSummary) => void;
};

/** A 2:3 poster with title and "type · year" underneath; it rises in with its place in the grid and springs when pressed. */
export const PosterCard = memo(({media, width, rank, index = 0, footer, isCompact, onPress}: PosterCardProps) => {
    const {t} = useTranslation();
    const title = mediaTitle(media);
    const poster = imageUrl(media.poster_path, IMAGE_SIZE.POSTER);
    const meta = [t(`mediaType.${media.media_type}`), mediaYear(media)].filter(Boolean).join(" · ");

    return (
        // The entrance lives on a wrapper: an entering transform would overwrite the press scale on the card itself.
        <Reveal variant="rise" index={index} isActive={index < ENTRANCE_POSTERS} style={{width}}>
        <PressScale onPress={() => onPress?.(media)} aria-label={title} className="gap-1.5">
            <View className="aspect-[2/3] w-full overflow-hidden rounded-[10px] border border-border bg-surface">
                {poster ? (
                    <Image source={poster} className="h-full w-full" contentFit="cover" transition={200}/>
                ) : (
                    <View className="flex-1 justify-end p-2">
                        <Text className="font-serif text-[15px] leading-4 text-foreground" numberOfLines={3}>{title}</Text>
                    </View>
                )}
                {rank !== undefined && (
                    <View className="absolute left-1.5 top-1.5 h-5 min-w-5 items-center justify-center rounded-md bg-black/60 px-1">
                        <Text className="font-sans-semibold text-[11px] text-white">{rank}</Text>
                    </View>
                )}
            </View>
            {!isCompact && <Text className="font-sans-medium text-xs text-foreground" numberOfLines={1}>{title}</Text>}
            {footer ?? (isCompact ? null : <Text className="font-sans text-[11px] text-muted-foreground" numberOfLines={1}>{meta}</Text>)}
        </PressScale>
        </Reveal>
    );
});
PosterCard.displayName = "PosterCard";
