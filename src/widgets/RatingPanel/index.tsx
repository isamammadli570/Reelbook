import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {StarRating} from "@/widgets/StarRating";
import {useDeleteWatch, useRateItem} from "@/hooks/library";
import {itemKey, nextRating} from "@/helpers/library";
import {haptics} from "@/lib/haptics";
import {toast} from "@/lib/toast";
import {MEDIA_TYPE} from "@/constants/other";
import type {LibraryItem, MediaSnapshot} from "@/api/library.api";

type RatingPanelProps = {
    snapshot: MediaSnapshot;
    item: LibraryItem | undefined;
};

/**
 * The user's own star rating, centred under the actions. Rating a movie never logged also logs it today;
 * a toast says so and offers to undo both, in case the tap was only a guess at a rating.
 */
export const RatingPanel = ({snapshot, item}: RatingPanelProps) => {
    const {t} = useTranslation("details");
    const {mutate: rate} = useRateItem();
    const {mutateAsync: deleteWatch} = useDeleteWatch();
    const rating = item?.rating ?? null;
    const isUnlogged = snapshot.mediaType === MEDIA_TYPE.MOVIE && !item?.diary.length;

    const undo = async (entryId: string) => {
        haptics.tap();
        await deleteWatch({snapshot, entryId});
        rate({snapshot, rating: null});
    };

    return (
        <View className="items-center gap-2">
            <Text className="font-sans text-xs text-muted-foreground">{rating === null ? t("rating.hint") : t("rating.label")}</Text>
            <StarRating
                value={rating}
                onChange={(tapped) => {
                    haptics.tap();
                    const next = nextRating(rating, tapped);
                    rate({snapshot, rating: next}, {
                        onSuccess: (library) => {
                            if (!isUnlogged || next === null) return;
                            const entryId = library.items[itemKey(snapshot.mediaType, snapshot.id)]?.diary[0]?.id;
                            if (!entryId) return;
                            toast.success(t("rating.loggedAsWatched"), {label: t("rating.undo"), onPress: () => void undo(entryId)});
                        },
                    });
                }}
            />
        </View>
    );
};
