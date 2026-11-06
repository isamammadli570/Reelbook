import {View} from "react-native";
import {useTranslation} from "react-i18next";
import {Bookmark, Check, Heart, Plus} from "lucide-react-native";
import {Button} from "@/components/ui/button";
import {AddToListButton} from "@/widgets/AddToListButton";
import {useToggleFavorite, useToggleFollowing, useToggleWatchlist} from "@/hooks/library";
import {haptics} from "@/lib/haptics";
import type {LibraryItem, MediaSnapshot} from "@/api/library.api";

type SeriesActionsProps = {
    snapshot: MediaSnapshot;
    item: LibraryItem | undefined;
};

/** Start/stop watching, favourite, and watchlist toggles for a series. */
export const SeriesActions = ({snapshot, item}: SeriesActionsProps) => {
    const {t} = useTranslation("details");
    const {mutate: toggleFollowing} = useToggleFollowing();
    const {mutate: toggleFavorite} = useToggleFavorite();
    const {mutate: toggleWatchlist} = useToggleWatchlist();

    const isFollowing = item?.isFollowing ?? false;
    const isFavorite = item?.isFavorite ?? false;
    const isInWatchlist = item?.isInWatchlist ?? false;

    return (
        <View className="flex-row gap-2">
            <Button
                variant={isFollowing ? "primary" : "brand"}
                icon={isFollowing ? Check : Plus}
                label={isFollowing ? t("actions.following") : t("actions.follow")}
                aria-pressed={isFollowing}
                className="flex-1"
                onPress={() => {
                    haptics.tap();
                    toggleFollowing(snapshot);
                }}
            />
            <Button
                icon={Heart}
                isIconFilled={isFavorite}
                aria-label={isFavorite ? t("actions.favoriteRemove") : t("actions.favoriteAdd")}
                aria-pressed={isFavorite}
                onPress={() => {
                    haptics.tap();
                    toggleFavorite(snapshot);
                }}
            />
            <Button
                icon={Bookmark}
                isIconFilled={isInWatchlist}
                aria-label={isInWatchlist ? t("actions.watchlistRemove") : t("actions.watchlistAdd")}
                aria-pressed={isInWatchlist}
                onPress={() => {
                    haptics.tap();
                    toggleWatchlist(snapshot);
                }}
            />
            <AddToListButton snapshot={snapshot}/>
        </View>
    );
};
