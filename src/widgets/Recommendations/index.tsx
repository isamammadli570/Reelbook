import {router} from "expo-router";
import {PosterGrid} from "@/widgets/PosterGrid";
import {Section} from "@/widgets/Section";
import {buildRoute} from "@/constants/routes";
import {RECOMMENDATION_LIMIT} from "@/constants/other";
import type {MediaSummary} from "@/api/media.api";

type RecommendationsProps = {
    title: string;
    items: MediaSummary[];
};

/** "Similar titles" grid at the bottom of a detail page; hidden when TMDB has none. */
export const Recommendations = ({title, items}: RecommendationsProps) => {
    if (!items.length) return null;

    return (
        <Section title={title}>
            <PosterGrid items={items.slice(0, RECOMMENDATION_LIMIT)} onPress={(media) => router.push(buildRoute.media(media))}/>
        </Section>
    );
};
