import {View} from "react-native";
import {Skeleton} from "@/components/ui/skeleton";
import {PosterCard} from "@/widgets/PosterCard";
import {POSTER_GAP, usePosterWidth} from "@/hooks/usePosterWidth";
import {POSTER_COLUMNS} from "@/constants/other";
import type {MediaSummary} from "@/api/media.api";

type PosterGridProps = {
    items: MediaSummary[];
    isLoading?: boolean;
    /** How many skeleton posters to show while loading. */
    placeholderCount?: number;
    isRanked?: boolean;
    onPress?: (media: MediaSummary) => void;
};

/** Four posters per row on a phone, the home and discover pages' main building block. */
export const PosterGrid = ({items, isLoading, placeholderCount = POSTER_COLUMNS * 2, isRanked, onPress}: PosterGridProps) => {
    const width = usePosterWidth();

    return (
        <View className="flex-row flex-wrap" style={{columnGap: POSTER_GAP, rowGap: 16}}>
            {isLoading
                ? Array.from({length: placeholderCount}, (_, index) => (
                    <View key={index} className="gap-1.5" style={{width}}>
                        <Skeleton className="aspect-[2/3] w-full rounded-[10px]"/>
                        <Skeleton className="h-3 w-4/5"/>
                        <Skeleton className="h-2.5 w-1/2"/>
                    </View>
                ))
                : items.map((media, index) => (
                    <PosterCard key={`${media.media_type}-${media.id}`} media={media} width={width} rank={isRanked ? index + 1 : undefined} onPress={onPress}/>
                ))}
        </View>
    );
};
