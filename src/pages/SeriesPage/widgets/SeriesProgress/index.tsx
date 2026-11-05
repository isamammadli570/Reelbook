import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {ProgressBar} from "@/widgets/ProgressBar";
import {seriesProgress} from "@/helpers/library";
import type {LibraryItem} from "@/api/library.api";

type SeriesProgressProps = {item: LibraryItem | undefined};

/** Watched vs aired episodes, shown once the user has started the series. */
export const SeriesProgress = ({item}: SeriesProgressProps) => {
    const {t} = useTranslation("details");
    if (!item?.isFollowing) return null;

    const {watched, aired, percent} = seriesProgress(item);

    return (
        <View className="gap-2">
            <View className="flex-row justify-between">
                <Text className="font-sans-medium text-[13px] text-foreground">{t("progress.title")}</Text>
                <Text className="font-sans text-[13px] text-muted-foreground">{t("progress.value", {watched, aired, percent})}</Text>
            </View>
            <ProgressBar percent={percent}/>
        </View>
    );
};
