import {memo} from "react";
import {Pressable, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Image} from "@/components/ui/image";
import {imageUrl, mediaTitle, mediaYear} from "@/helpers/media";
import {IMAGE_SIZE} from "@/constants/other";
import type {MediaSummary} from "@/api/media.api";

type PosterCardProps = {
    media: MediaSummary;
    width: number;
    rank?: number;
    onPress?: (media: MediaSummary) => void;
};

/** A 2:3 poster with title and "type · year" underneath; memoised because grids render many. */
export const PosterCard = memo(({media, width, rank, onPress}: PosterCardProps) => {
    const {t} = useTranslation();
    const title = mediaTitle(media);
    const poster = imageUrl(media.poster_path, IMAGE_SIZE.POSTER);
    const meta = [t(`mediaType.${media.media_type}`), mediaYear(media)].filter(Boolean).join(" · ");

    return (
        <Pressable onPress={() => onPress?.(media)} aria-label={title} className="gap-1.5" style={{width}}>
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
            <Text className="font-sans-medium text-xs text-foreground" numberOfLines={1}>{title}</Text>
            <Text className="font-sans text-[11px] text-muted-foreground" numberOfLines={1}>{meta}</Text>
        </Pressable>
    );
});
PosterCard.displayName = "PosterCard";
