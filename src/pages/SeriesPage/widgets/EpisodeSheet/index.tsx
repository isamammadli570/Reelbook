import {useState} from "react";
import {ScrollView, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Check, Eye, Star} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {Button} from "@/components/ui/button";
import {Image} from "@/components/ui/image";
import {BottomSheet} from "@/widgets/BottomSheet";
import {CastRow} from "@/widgets/CastRow";
import {useDateFormat} from "@/hooks/useDateFormat";
import {useFormatRuntime} from "@/hooks/useFormatRuntime";
import {imageUrl} from "@/helpers/media";
import {formatScore} from "@/helpers/details";
import {usePreference} from "@/lib/preferences";
import {IMAGE_SIZE} from "@/constants/other";
import type {Episode} from "@/api/series.api";

type EpisodeSheetProps = {
    episode: Episode | null;
    isWatched: boolean;
    isReleased: boolean;
    onClose: () => void;
    onToggle: (episode: Episode) => void;
};

/**
 * One episode in full: its still, rating, overview, guest stars and who directed and wrote it, with the
 * watched toggle. With spoilers hidden, an unwatched episode keeps its still blurred and its overview
 * behind a "Show" button.
 */
export const EpisodeSheet = ({episode, isWatched, isReleased, onClose, onToggle}: EpisodeSheetProps) => {
    const {t} = useTranslation("details");
    const {longDate} = useDateFormat();
    const formatRuntime = useFormatRuntime();
    const [brand, foreground] = useCSSVariable(["--color-brand", "--color-foreground"]).map(String);
    const [isHidingSpoilers] = usePreference("hideSpoilers");
    // Revealed for this episode only; the next episode opened starts hidden again.
    const [revealedId, setRevealedId] = useState<number | null>(null);

    const isHidden = Boolean(episode) && isHidingSpoilers && !isWatched && revealedId !== episode?.id;
    const still = imageUrl(episode?.still_path, IMAGE_SIZE.BACKDROP);
    const code = episode ? t("episodeCode", {season: episode.season_number, episode: episode.episode_number}) : "";
    const meta = episode ? [longDate(episode.air_date) ?? t("dateUnknown"), formatRuntime(episode.runtime)].filter(Boolean).join(" · ") : "";
    const guests = (episode?.guest_stars ?? []).map((person) => ({id: person.id, name: person.name, profile_path: person.profile_path, character: person.character}));
    const crewLine = (job: string) => (episode?.crew ?? []).filter((person) => person.job === job).map((person) => person.name).join(", ");
    const directors = crewLine("Director");
    const writers = crewLine("Writer") || crewLine("Screenplay");

    return (
        <BottomSheet isOpen={Boolean(episode)} onClose={onClose} title={isHidden ? t("spoilerName", {number: episode?.episode_number}) : episode?.name ?? ""}>
            <ScrollView className="-mx-5" contentContainerClassName="gap-4 px-5" showsVerticalScrollIndicator={false}>
                <View className="flex-row items-center gap-2">
                    <Text className="font-sans-semibold text-xs text-brand">{code}</Text>
                    <Text className="font-sans text-xs text-muted-foreground" numberOfLines={1}>{meta}</Text>
                    {episode && episode.vote_average > 0 && (
                        <View className="ml-auto flex-row items-center gap-1">
                            <Star size={12} strokeWidth={2} color={brand} fill={brand}/>
                            <Text className="font-sans-medium text-xs text-foreground">{formatScore(episode.vote_average)}</Text>
                        </View>
                    )}
                </View>
                {still && (
                    <View className="aspect-video w-full overflow-hidden rounded-2xl bg-surface-raised">
                        <Image source={still} className="h-full w-full" contentFit="cover" blurRadius={isHidden ? 24 : 0}/>
                    </View>
                )}
                {isHidden ? (
                    <PressScale
                        onPress={() => episode && setRevealedId(episode.id)}
                        scaleTo={0.98}
                        className="flex-row items-center gap-2.5 rounded-2xl border border-dashed border-border p-4"
                    >
                        <Eye size={18} strokeWidth={1.8} color={foreground}/>
                        <Text className="flex-1 font-sans text-sm leading-5 text-muted-foreground">{t("episodeSheet.spoilerHidden")}</Text>
                        <Text className="font-sans-semibold text-sm text-brand">{t("episodeSheet.show")}</Text>
                    </PressScale>
                ) : episode?.overview ? (
                    <Reveal variant="fade">
                        <Text className="font-sans text-sm leading-[22px] text-muted-foreground">{episode.overview}</Text>
                    </Reveal>
                ) : (
                    <Text className="font-sans text-sm text-muted-foreground">{t("noOverview")}</Text>
                )}
                {Boolean(directors || writers) && (
                    <View className="gap-1 rounded-2xl bg-background p-3.5">
                        {directors ? <Text className="font-sans text-[13px] text-foreground"><Text className="text-muted-foreground">{t("episodeSheet.director")} </Text>{directors}</Text> : null}
                        {writers ? <Text className="font-sans text-[13px] text-foreground"><Text className="text-muted-foreground">{t("episodeSheet.writer")} </Text>{writers}</Text> : null}
                    </View>
                )}
                {guests.length > 0 && (
                    <View className="gap-2.5">
                        <Text className="font-sans-medium text-xs uppercase tracking-wider text-muted-foreground">{t("episodeSheet.guests")}</Text>
                        <CastRow cast={guests}/>
                    </View>
                )}
            </ScrollView>
            {episode && isReleased && (
                <Button
                    variant={isWatched ? "outline" : "brand"}
                    icon={Check}
                    label={isWatched ? t("episodeActions.unmark", {code}) : t("episodeActions.mark", {code})}
                    onPress={() => onToggle(episode)}
                />
            )}
        </BottomSheet>
    );
};
