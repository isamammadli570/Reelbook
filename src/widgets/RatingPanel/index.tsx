import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {StarRating} from "@/widgets/StarRating";
import {useRateItem} from "@/hooks/library";
import {nextRating} from "@/helpers/library";
import {haptics} from "@/lib/haptics";
import type {LibraryItem, MediaSnapshot} from "@/api/library.api";

type RatingPanelProps = {
    snapshot: MediaSnapshot;
    item: LibraryItem | undefined;
};

/** The user's own star rating of a movie or series, centred under the actions. */
export const RatingPanel = ({snapshot, item}: RatingPanelProps) => {
    const {t} = useTranslation("details");
    const {mutate: rate} = useRateItem();
    const rating = item?.rating ?? null;

    return (
        <View className="items-center gap-2">
            <Text className="font-sans text-xs text-muted-foreground">{rating === null ? t("rating.hint") : t("rating.label")}</Text>
            <StarRating
                value={rating}
                onChange={(tapped) => {
                    haptics.tap();
                    rate({snapshot, rating: nextRating(rating, tapped)});
                }}
            />
        </View>
    );
};
