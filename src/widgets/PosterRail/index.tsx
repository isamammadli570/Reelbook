import {ScrollView, View} from "react-native";
import {router} from "expo-router";
import {Skeleton} from "@/components/ui/skeleton";
import {PosterCard} from "@/widgets/PosterCard";
import {Section} from "@/widgets/Section";
import {buildRoute} from "@/constants/routes";
import type {MediaSummary} from "@/api/media.api";

/** Posters a little narrower than a three-column grid, so the next one peeks in and invites a swipe. */
const RAIL_POSTER_WIDTH = 108;
const RAIL_LIMIT = 15;

type PosterRailProps = {
    title: string;
    items: MediaSummary[] | undefined;
    isLoading?: boolean;
    index?: number;
};

/** A titled row of posters that scrolls sideways; hidden once loaded if there is nothing to show. */
export const PosterRail = ({title, items, isLoading, index = 0}: PosterRailProps) => {
    if (!isLoading && !items?.length) return null;

    return (
        <Section title={title} index={index}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-2.5 px-5">
                {isLoading
                    ? Array.from({length: 4}, (_, position) => (
                        <View key={position} className="gap-1.5" style={{width: RAIL_POSTER_WIDTH}}>
                            <Skeleton className="aspect-[2/3] w-full rounded-[10px]"/>
                            <Skeleton className="h-3 w-4/5"/>
                        </View>
                    ))
                    : items?.slice(0, RAIL_LIMIT).map((media, position) => (
                        <PosterCard
                            key={`${media.media_type}-${media.id}`}
                            media={media}
                            width={RAIL_POSTER_WIDTH}
                            index={position}
                            onPress={() => router.push(buildRoute.media(media))}
                        />
                    ))}
            </ScrollView>
        </Section>
    );
};
