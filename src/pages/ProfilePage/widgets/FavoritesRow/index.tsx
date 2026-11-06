import {View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {Plus} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {PosterGrid} from "@/widgets/PosterGrid";
import {RowHeader} from "@/pages/ProfilePage/widgets/RowHeader";
import {POSTER_GAP, usePosterWidth} from "@/hooks/usePosterWidth";
import {toMediaSummary} from "@/helpers/library";
import {buildRoute, ROUTES} from "@/constants/routes";
import {SHELF, SHELF_PREVIEW} from "@/constants/other";
import type {LibraryItem} from "@/api/library.api";

type FavoritesRowProps = {
    items: LibraryItem[];
    index?: number;
};

/**
 * Four favourite posters, always four places: empty ones invite adding a favourite, so the row never looks
 * half-built. The count opens the full list once there are more than fit.
 */
export const FavoritesRow = ({items, index = 0}: FavoritesRowProps) => {
    const {t} = useTranslation("profile");
    const muted = String(useCSSVariable("--color-subtle-foreground"));
    const width = usePosterWidth();
    const preview = items.slice(0, SHELF_PREVIEW);
    const emptySlots = SHELF_PREVIEW - preview.length;

    return (
        <Reveal index={index} variant="rise" className="gap-3">
            <RowHeader
                title={t("shelves.favorites")}
                aside={items.length > SHELF_PREVIEW ? String(items.length) : undefined}
                onPress={items.length > SHELF_PREVIEW ? () => router.push(buildRoute.shelf(SHELF.FAVORITES)) : undefined}
            />
            <View className="flex-row" style={{columnGap: POSTER_GAP}}>
                {preview.length > 0 && (
                    <PosterGrid items={preview.map(toMediaSummary)} isCompact onPress={(media) => router.push(buildRoute.media(media))}/>
                )}
                {Array.from({length: emptySlots}, (_, slot) => (
                    // The entrance sits on a wrapper so that its transform does not overwrite the press scale.
                    <Reveal key={slot} variant="pop" index={preview.length + slot}>
                        <PressScale
                            onPress={() => router.push(ROUTES.DISCOVER)}
                            aria-label={t("favorites.add")}
                            className="aspect-[2/3] items-center justify-center rounded-[10px] border border-dashed border-border"
                            style={{width}}
                        >
                            <Plus size={22} strokeWidth={1.8} color={muted}/>
                        </PressScale>
                    </Reveal>
                ))}
            </View>
        </Reveal>
    );
};
