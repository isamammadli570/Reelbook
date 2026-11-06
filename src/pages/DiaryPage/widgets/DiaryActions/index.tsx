import {useState} from "react";
import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {CalendarDays, EyeOff, Trash2, type LucideIcon} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {BottomSheet} from "@/widgets/BottomSheet";
import {LogWatchSheet} from "@/widgets/LogWatchSheet";
import {useChangeWatchDate, useDeleteWatch, useRestoreEpisodes, useRestoreWatch, useSetSeasonWatched} from "@/hooks/library";
import {useDateFormat} from "@/hooks/useDateFormat";
import {episodeKey, snapshotOf} from "@/helpers/library";
import {haptics} from "@/lib/haptics";
import {toast} from "@/lib/toast";
import {cn} from "@/lib/utils";
import {MEDIA_TYPE} from "@/constants/other";
import type {Watch} from "@/helpers/stats";

type ActionRowProps = {
    icon: LucideIcon;
    label: string;
    isDanger?: boolean;
    onPress: () => void;
};

const ActionRow = ({icon: Icon, label, isDanger, onPress}: ActionRowProps) => {
    const [foreground, danger] = useCSSVariable(["--color-foreground", "--color-danger"]).map(String);

    return (
        <PressScale scaleTo={0.98} onPress={onPress} role="button" className="flex-row items-center gap-3.5 rounded-xl px-3 py-3.5 active:bg-surface-raised">
            <Icon size={20} strokeWidth={1.8} color={isDanger ? danger : foreground}/>
            <Text className={cn("font-sans-medium text-[15px]", isDanger ? "text-danger" : "text-foreground")}>{label}</Text>
        </PressScale>
    );
};

type DiaryActionsProps = {
    /** The viewing the sheet is about; `null` keeps it closed. */
    watch: Watch | null;
    onClose: () => void;
};

/**
 * What can be done to one diary line: a movie viewing can move to another day or be deleted, an episode
 * can be unmarked. Deleting and unmarking offer an undo that brings back the same dates and rating.
 */
export const DiaryActions = ({watch, onClose}: DiaryActionsProps) => {
    const {t} = useTranslation("details");
    const {longDate} = useDateFormat();
    const {mutate: deleteWatch} = useDeleteWatch();
    const {mutate: restoreWatch} = useRestoreWatch();
    const {mutate: changeDate} = useChangeWatchDate();
    const {mutate: setSeasonWatched} = useSetSeasonWatched();
    const {mutate: restoreEpisodes} = useRestoreEpisodes();
    // The date sheet opens once the actions sheet has gone; it keeps the viewing while the actions close.
    const [dating, setDating] = useState<Watch | null>(null);

    const item = watch?.item;
    const entry = watch && watch.kind === MEDIA_TYPE.MOVIE ? watch.item.diary.find((viewing) => viewing.watchedAt === watch.watchedAt) : undefined;
    const snapshot = item ? snapshotOf(item) : null;

    const deleteViewing = () => {
        if (!snapshot || !entry || !item) return;
        haptics.tap();
        const rating = item.rating;
        onClose();
        deleteWatch({snapshot, entryId: entry.id}, {
            onSuccess: () => toast.show({message: t("toast.watchDeleted"), action: {label: t("toast.undo"), onPress: () => restoreWatch({snapshot, entry, rating})}}),
        });
    };

    const unmarkEpisode = () => {
        if (!snapshot || !watch?.episode) return;
        haptics.tap();
        const {season, episode} = watch.episode;
        const watchedAt = watch.watchedAt;
        onClose();
        setSeasonWatched({snapshot, season, episodes: [episode], isWatched: false}, {
            onSuccess: () => toast.show({
                message: t("toast.episodeUnmarked", {code: t("episodeCode", {season, episode})}),
                action: {label: t("toast.undo"), onPress: () => restoreEpisodes({snapshot, episodes: {[episodeKey({season, episode})]: watchedAt}})},
            }),
        });
    };

    return (
        <>
            <BottomSheet isOpen={Boolean(watch)} onClose={onClose} title={item?.title ?? ""}>
                <Text className="-mt-2 font-sans text-sm text-muted-foreground" numberOfLines={1}>
                    {[watch?.episode ? t("episodeCode", {season: watch.episode.season, episode: watch.episode.episode}) : null, longDate(watch?.watchedAt)].filter(Boolean).join(" · ")}
                </Text>
                <View className="-mx-3">
                    {entry ? (
                        <>
                            <ActionRow
                                icon={CalendarDays}
                                label={t("logSheet.changeDate")}
                                onPress={() => {
                                    setDating(watch);
                                    onClose();
                                }}
                            />
                            <ActionRow icon={Trash2} label={t("diary.delete")} isDanger onPress={deleteViewing}/>
                        </>
                    ) : (
                        <ActionRow icon={EyeOff} label={t("diary.unmarkEpisode")} isDanger onPress={unmarkEpisode}/>
                    )}
                </View>
            </BottomSheet>
            <LogWatchSheet
                isOpen={Boolean(dating)}
                onClose={() => setDating(null)}
                title={t("logSheet.changeDate")}
                subtitle={dating?.item.title ?? ""}
                submitLabel={t("logSheet.save")}
                initialWatchedAt={dating?.watchedAt}
                onSubmit={(watchedAt) => {
                    const viewing = dating?.item.diary.find((candidate) => candidate.watchedAt === dating.watchedAt);
                    if (!dating || !viewing) return;
                    changeDate({snapshot: snapshotOf(dating.item), entryId: viewing.id, watchedAt}, {onSuccess: () => toast.success(t("toast.dateChanged", {date: longDate(watchedAt)}))});
                }}
            />
        </>
    );
};
