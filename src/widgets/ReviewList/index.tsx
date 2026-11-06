import {Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {Image} from "@/components/ui/image";
import {EmptyState} from "@/widgets/EmptyState";
import {useDateFormat} from "@/hooks/useDateFormat";
import {imageUrl} from "@/helpers/media";
import {buildRoute} from "@/constants/routes";
import {IMAGE_SIZE, MEDIA_TYPE} from "@/constants/other";
import type {LibraryItem} from "@/api/library.api";

type ReviewListProps = {items: LibraryItem[]};

/** Written reviews as quotes, each opening its title. */
export const ReviewList = ({items}: ReviewListProps) => {
    const {t} = useTranslation(["profile", "common"]);
    const {shortDate} = useDateFormat();

    if (!items.length) return <EmptyState title={t("reviewsEmpty.title")} description={t("reviewsEmpty.description")}/>;

    return (
        <View className="gap-3">
            {items.map((item) => {
                const poster = imageUrl(item.posterPath, IMAGE_SIZE.THUMB);
                const isMovie = item.mediaType === MEDIA_TYPE.MOVIE;
                return (
                    <PressScale
                        scaleTo={0.98}
                        key={`${item.mediaType}-${item.id}`}
                        onPress={() => router.push(isMovie ? buildRoute.movie(item.id) : buildRoute.series(item.id))}
                        className="gap-3 rounded-2xl bg-surface p-3.5"
                    >
                        <View className="flex-row items-center gap-3">
                            <View className="h-12 w-8 overflow-hidden rounded-md bg-surface-raised">
                                {poster && <Image source={poster} className="h-full w-full" contentFit="cover"/>}
                            </View>
                            <View className="min-w-0 flex-1">
                                <Text className="font-sans-medium text-sm text-foreground" numberOfLines={1}>{item.title}</Text>
                                <Text className="font-sans text-xs text-muted-foreground">{t(`common:mediaType.${item.mediaType}`)} · {item.year}</Text>
                            </View>
                            <Text className="font-sans text-xs text-muted-foreground">{shortDate(item.review?.updatedAt)}</Text>
                        </View>
                        <Text className="font-serif-italic text-[17px] leading-[23px] text-foreground" numberOfLines={4}>“{item.review?.text}”</Text>
                    </PressScale>
                );
            })}
        </View>
    );
};
