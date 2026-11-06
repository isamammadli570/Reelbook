import {useEffect, useState} from "react";
import {Pressable, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Reveal} from "@/components/motion/Reveal";
import {StarRating} from "@/widgets/StarRating";
import {useDeleteWatch, useRateItem} from "@/hooks/library";
import {itemKey, nextRating} from "@/helpers/library";
import {haptics} from "@/lib/haptics";
import {MEDIA_TYPE} from "@/constants/other";
import type {LibraryItem, MediaSnapshot} from "@/api/library.api";

/** Long enough to read the note and reach "Undo", short enough not to linger. */
const UNDO_VISIBLE_MS = 6000;

type RatingPanelProps = {
    snapshot: MediaSnapshot;
    item: LibraryItem | undefined;
};

/**
 * The user's own star rating, centred under the actions. Rating a movie never logged also logs it today;
 * a note says so and offers to undo both, in case the tap was only a guess at a rating.
 */
export const RatingPanel = ({snapshot, item}: RatingPanelProps) => {
    const {t} = useTranslation("details");
    const {mutate: rate} = useRateItem();
    const {mutateAsync: deleteWatch} = useDeleteWatch();
    const [autoLoggedId, setAutoLoggedId] = useState<string | null>(null);
    const rating = item?.rating ?? null;

    useEffect(() => {
        if (!autoLoggedId) return;
        const timer = setTimeout(() => setAutoLoggedId(null), UNDO_VISIBLE_MS);
        return () => clearTimeout(timer);
    }, [autoLoggedId]);

    const isUnlogged = snapshot.mediaType === MEDIA_TYPE.MOVIE && !item?.diary.length;

    const undo = async () => {
        if (!autoLoggedId) return;
        setAutoLoggedId(null);
        haptics.tap();
        await deleteWatch({snapshot, entryId: autoLoggedId});
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
                            setAutoLoggedId(library.items[itemKey(snapshot.mediaType, snapshot.id)]?.diary[0]?.id ?? null);
                        },
                    });
                }}
            />
            {autoLoggedId && (
                <Reveal variant="fade" className="flex-row items-center gap-1.5">
                    <Text className="font-sans text-xs text-muted-foreground">{t("rating.loggedAsWatched")}</Text>
                    <Text className="font-sans text-xs text-muted-foreground">·</Text>
                    <Pressable onPress={() => void undo()} hitSlop={8} role="button">
                        <Text className="font-sans-semibold text-xs text-brand">{t("rating.undo")}</Text>
                    </Pressable>
                </Reveal>
            )}
        </View>
    );
};
