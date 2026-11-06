import {Text, View} from "react-native";
import {ProgressBar} from "@/widgets/ProgressBar";
import {seriesProgress} from "@/helpers/library";
import type {LibraryItem} from "@/api/library.api";

type SeriesProgressLineProps = {item: LibraryItem};

/** "26/26" with a short bar, under a series poster. */
export const SeriesProgressLine = ({item}: SeriesProgressLineProps) => {
    const {watched, aired, percent} = seriesProgress(item);

    return (
        <View className="flex-row items-center gap-2">
            <Text className="font-sans text-[11px] text-muted-foreground">{watched}/{aired}</Text>
            <ProgressBar percent={percent} className="h-1 flex-1" fillClassName="bg-brand"/>
        </View>
    );
};
