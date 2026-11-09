import type {Ref} from "react";
import type {HostInstance} from "react-native";
import {Text, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useTranslation} from "react-i18next";
import {useCSSVariable} from "uniwind";
import {Image} from "@/components/ui/image";
import {useDateFormat} from "@/hooks/useDateFormat";
import {formatStars} from "@/helpers/library";
import {imageUrl} from "@/helpers/media";
import {translateGenre} from "@/helpers/genres";
import type {Recap} from "@/helpers/recap";
import {IMAGE_SIZE} from "@/constants/other";

/** The card is drawn at this logical size (9:16, a story); the picture is taken from it at the device's density. */
export const RECAP_CARD_WIDTH = 360;
export const RECAP_CARD_HEIGHT = 640;

type RecapCardProps = {
    recap: Recap;
    /** The view to hand to `captureRef`. */
    ref?: Ref<HostInstance>;
    /** Called once for each poster as it finishes loading or fails, so the picture is taken only when all are in. */
    onPosterSettled?: () => void;
};

const Stat = ({value, label}: {value: string; label: string}) => (
    <View className="flex-1 gap-0.5">
        <Text className="font-serif text-[30px] leading-[32px] text-foreground">{value}</Text>
        <Text className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Text>
    </View>
);

/**
 * "Your year in review", laid out for sharing as a picture: hours in front of the screen, the best-loved
 * titles as posters, the counts and favourite genres. Fixed size so the picture is the same on every device.
 */
export const RecapCard = ({recap, ref, onPosterSettled}: RecapCardProps) => {
    const {t, i18n} = useTranslation("stats");
    const {monthName} = useDateFormat();
    const background = String(useCSSVariable("--color-background"));
    const brandSoft = String(useCSSVariable("--color-brand-soft"));
    const genres = recap.genres.map((genre) => translateGenre(genre, i18n.language)).join(" · ");
    const facts = [
        genres ? {label: t("recap.topGenres"), value: genres} : null,
        recap.busiestMonth !== null ? {label: t("recap.busiest"), value: monthName(recap.busiestMonth)} : null,
        recap.averageRating !== null ? {label: t("tiles.averageRating"), value: `${recap.averageRating.toFixed(1)} / 5`} : null,
    ].filter((fact) => fact !== null);

    return (
        // `collapsable` off keeps the view real on Android, where `captureRef` cannot see a flattened one.
        <View ref={ref} collapsable={false} style={{width: RECAP_CARD_WIDTH, height: RECAP_CARD_HEIGHT, backgroundColor: background}} className="overflow-hidden rounded-3xl">
            <LinearGradient colors={[brandSoft, background]} start={{x: 0.2, y: 0}} end={{x: 0.7, y: 0.55}} style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0}}/>
            <View className="flex-1 justify-between p-6">
                <View className="gap-6">
                    <View className="flex-row items-center justify-between">
                        <Text className="font-sans-semibold text-xs uppercase tracking-widest text-brand">Reelbook</Text>
                        <Text className="font-sans-semibold text-xs uppercase tracking-widest text-muted-foreground">{t("recap.eyebrow", {year: recap.year})}</Text>
                    </View>
                    <Text className="font-serif text-[64px] leading-[60px] text-foreground">
                        {t("hours", {count: recap.hours})}
                        {"\n"}
                        <Text className="font-serif-italic text-brand">{t("screenTime")}</Text>
                    </Text>
                </View>

                {recap.titles.length > 0 && (
                    <View className="flex-row gap-3">
                        {recap.titles.map((title) => {
                            const poster = imageUrl(title.posterPath, IMAGE_SIZE.POSTER);
                            return (
                                <View key={`${title.mediaType}:${title.id}`} className="flex-1 gap-1.5">
                                    <View className="aspect-[2/3] overflow-hidden rounded-xl border border-border bg-surface-raised">
                                        {poster ? <Image source={poster} className="h-full w-full" contentFit="cover" transition={0} onLoad={onPosterSettled} onError={onPosterSettled}/> : null}
                                    </View>
                                    {title.rating !== null ? <Text className="text-center font-sans text-[13px] text-brand">{formatStars(title.rating)}</Text> : null}
                                </View>
                            );
                        })}
                    </View>
                )}

                <View className="gap-4">
                    <View className="flex-row gap-3">
                        <Stat value={String(recap.movies)} label={t("tiles.movies")}/>
                        <Stat value={recap.episodes.toLocaleString()} label={t("tiles.episodes")}/>
                        <Stat value={String(recap.series)} label={t("tiles.series")}/>
                    </View>
                    <View className="gap-2 border-t border-border pt-3">
                        {facts.map((fact) => (
                            <View key={fact.label} className="flex-row items-baseline justify-between gap-3">
                                <Text className="font-sans text-xs text-muted-foreground">{fact.label}</Text>
                                <Text className="min-w-0 shrink font-sans-medium text-[13px] text-foreground" numberOfLines={1}>{fact.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
};
