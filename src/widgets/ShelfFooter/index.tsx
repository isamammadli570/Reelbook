import {Text, View} from "react-native";
import {SeriesProgressLine} from "@/widgets/SeriesProgressLine";
import {formatStars} from "@/helpers/library";
import {MEDIA_TYPE} from "@/constants/other";
import type {LibraryItem} from "@/api/library.api";

type ShelfFooterProps = {item: LibraryItem};

/** Under a poster on the user's own lists: the year and their stars, plus progress for a series. */
export const ShelfFooter = ({item}: ShelfFooterProps) => {
    const stars = item.rating === null ? null : formatStars(item.rating);
    const yearAndStars = (
        <Text className="font-sans text-[11px] text-muted-foreground" numberOfLines={1}>
            {item.year}
            {stars && (
                <>
                    {item.year ? " · " : ""}
                    <Text className="text-brand">{stars}</Text>
                </>
            )}
        </Text>
    );

    if (item.mediaType !== MEDIA_TYPE.TV) return yearAndStars;

    return (
        <View className="gap-1">
            <SeriesProgressLine item={item}/>
            {stars && <Text className="font-sans text-[11px] text-brand" numberOfLines={1}>{stars}</Text>}
        </View>
    );
};
