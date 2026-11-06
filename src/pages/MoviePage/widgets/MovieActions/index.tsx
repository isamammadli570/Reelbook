import {useState} from "react";
import {View} from "react-native";
import {useTranslation} from "react-i18next";
import {Bookmark, Heart, Plus} from "lucide-react-native";
import {Button} from "@/components/ui/button";
import {AddToListButton} from "@/widgets/AddToListButton";
import {LogWatchSheet} from "@/widgets/LogWatchSheet";
import {useLogWatch, useToggleFavorite, useToggleWatchlist} from "@/hooks/library";
import {haptics} from "@/lib/haptics";
import type {LibraryItem, MediaSnapshot} from "@/api/library.api";

type MovieActionsProps = {
    snapshot: MediaSnapshot;
    item: LibraryItem | undefined;
};

/** Log a viewing on a chosen day, favourite, and watchlist toggles for a movie. */
export const MovieActions = ({snapshot, item}: MovieActionsProps) => {
    const {t} = useTranslation("details");
    const {mutate: logWatch} = useLogWatch();
    const {mutate: toggleFavorite} = useToggleFavorite();
    const {mutate: toggleWatchlist} = useToggleWatchlist();
    const [isLogging, setIsLogging] = useState(false);

    const isFavorite = item?.isFavorite ?? false;
    const isInWatchlist = item?.isInWatchlist ?? false;

    return (
        <>
            <View className="flex-row gap-2">
                <Button
                    variant="brand"
                    icon={Plus}
                    label={item?.diary.length ? t("actions.logAgain") : t("actions.logWatch")}
                    className="flex-1"
                    onPress={() => {
                        haptics.tap();
                        setIsLogging(true);
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
            <LogWatchSheet
                isOpen={isLogging}
                onClose={() => setIsLogging(false)}
                title={t("logSheet.title")}
                subtitle={snapshot.title}
                submitLabel={t("logSheet.submit")}
                onSubmit={(watchedAt) => {
                    haptics.success();
                    logWatch({snapshot, watchedAt});
                }}
            />
        </>
    );
};
