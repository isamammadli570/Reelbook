import {View} from "react-native";
import {useTranslation} from "react-i18next";
import {Bookmark, Heart, Plus} from "lucide-react-native";
import {Button} from "@/components/ui/button";
import {AddToListButton} from "@/widgets/AddToListButton";
import {useLogWatch, useToggleFavorite, useToggleWatchlist} from "@/hooks/library";
import {haptics} from "@/lib/haptics";
import type {LibraryItem, MediaSnapshot} from "@/api/library.api";

type MovieActionsProps = {
    snapshot: MediaSnapshot;
    item: LibraryItem | undefined;
};

/** Log a viewing today, favourite, and watchlist toggles for a movie. */
export const MovieActions = ({snapshot, item}: MovieActionsProps) => {
    const {t} = useTranslation("details");
    const {mutate: logWatch} = useLogWatch();
    const {mutate: toggleFavorite} = useToggleFavorite();
    const {mutate: toggleWatchlist} = useToggleWatchlist();

    const isFavorite = item?.isFavorite ?? false;
    const isInWatchlist = item?.isInWatchlist ?? false;

    return (
        <View className="flex-row gap-2">
            <Button
                variant="brand"
                icon={Plus}
                label={item?.diary.length ? t("actions.logAgain") : t("actions.logWatch")}
                className="flex-1"
                onPress={() => {
                    haptics.success();
                    logWatch({snapshot});
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
