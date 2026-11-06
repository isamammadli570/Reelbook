import {Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {LinearGradient} from "expo-linear-gradient";
import {ChevronRight} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {Image} from "@/components/ui/image";
import {ProgressBar} from "@/widgets/ProgressBar";
import {useGetCollection} from "@/hooks/details";
import {useGetLibrary} from "@/hooks/library";
import {itemKey} from "@/helpers/library";
import {imageUrl} from "@/helpers/media";
import {watchedInCollection} from "@/helpers/titleExtras";
import {withAlpha} from "@/helpers/details";
import {buildRoute} from "@/constants/routes";
import {IMAGE_SIZE, MEDIA_TYPE} from "@/constants/other";
import type {MovieDetails} from "@/api/movies.api";

type CollectionCardProps = {collection: NonNullable<MovieDetails["belongs_to_collection"]>};

/** The franchise a movie belongs to: its backdrop, how many films it has and how many the user has seen. */
export const CollectionCard = ({collection}: CollectionCardProps) => {
    const {t} = useTranslation("details");
    const [background, muted] = useCSSVariable(["--color-background", "--color-muted-foreground"]).map(String);
    const {data} = useGetCollection(collection.id);
    const {data: library} = useGetLibrary();
    const parts = data?.parts ?? [];
    const watched = watchedInCollection(parts, (id) => Boolean(library?.items[itemKey(MEDIA_TYPE.MOVIE, id)]?.diary.length));
    const backdrop = imageUrl(collection.backdrop_path, IMAGE_SIZE.BACKDROP);

    return (
        <Reveal variant="rise">
            <PressScale
                scaleTo={0.98}
                role="link"
                aria-label={collection.name}
                onPress={() => router.push(buildRoute.collection(collection.id))}
                className="h-32 overflow-hidden rounded-2xl bg-surface"
            >
                {backdrop && <Image source={backdrop} className="absolute inset-0" contentFit="cover"/>}
                <LinearGradient colors={[withAlpha(background, 0.92), withAlpha(background, 0.55)]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={{position: "absolute", inset: 0}}/>
                <View className="flex-1 flex-row items-center gap-3 p-4">
                    <View className="min-w-0 flex-1 gap-1">
                        <Text className="font-sans-semibold text-[11px] uppercase tracking-wider text-brand">{t("collection.eyebrow")}</Text>
                        <Text className="font-serif text-[22px] leading-[24px] text-foreground" numberOfLines={2}>{collection.name}</Text>
                        {parts.length > 0 && (
                            <View className="gap-1.5 pt-1">
                                <Text className="font-sans text-xs text-muted-foreground">{t("collection.progress", {count: parts.length, watched})}</Text>
                                <ProgressBar percent={(watched / parts.length) * 100} className="h-1 w-32" fillClassName="bg-brand"/>
                            </View>
                        )}
                    </View>
                    <ChevronRight size={20} strokeWidth={2} color={muted}/>
                </View>
            </PressScale>
        </Reveal>
    );
};
