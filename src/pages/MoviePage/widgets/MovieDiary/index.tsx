import {useState} from "react";
import {Pressable, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Trash2} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {LogWatchSheet} from "@/widgets/LogWatchSheet";
import {Section} from "@/widgets/Section";
import {useChangeWatchDate, useDeleteWatch} from "@/hooks/library";
import {useDateFormat} from "@/hooks/useDateFormat";
import {formatStars} from "@/helpers/library";
import {cn} from "@/lib/utils";
import type {LibraryItem, MediaSnapshot} from "@/api/library.api";

type MovieDiaryProps = {
    snapshot: MediaSnapshot;
    item: LibraryItem | undefined;
};

/** Every logged viewing of this movie, newest first; tap one to move it to another day, or remove it. */
export const MovieDiary = ({snapshot, item}: MovieDiaryProps) => {
    const {t} = useTranslation("details");
    const {dayNumber, shortMonthYear} = useDateFormat();
    const {mutate: deleteWatch} = useDeleteWatch();
    const {mutate: changeDate} = useChangeWatchDate();
    const [editingId, setEditingId] = useState<string | null>(null);
    const muted = String(useCSSVariable("--color-muted-foreground"));

    if (!item?.diary.length) return null;

    const oldestId = item.diary.at(-1)?.id;
    const editing = item.diary.find((entry) => entry.id === editingId);

    return (
        <Section title={t("diary.title")}>
            <View className="overflow-hidden rounded-2xl bg-surface">
                {item.diary.map((entry, index) => {
                    return (
                        <View key={entry.id} className={cn("flex-row items-center gap-3.5 px-3.5 py-3", index > 0 && "border-t border-border")}>
                            <Pressable
                                onPress={() => setEditingId(entry.id)}
                                aria-label={t("logSheet.changeDate")}
                                className="flex-1 flex-row items-center gap-3.5"
                            >
                                <View className="w-12 items-center">
                                    <Text className="font-serif text-[28px] leading-[30px] text-foreground">{dayNumber(entry.watchedAt)}</Text>
                                    <Text className="font-sans text-[11px] uppercase text-muted-foreground">{shortMonthYear(entry.watchedAt)}</Text>
                                </View>
                                <View className="flex-1 gap-0.5">
                                    <Text className="font-sans-medium text-sm text-foreground">{entry.id === oldestId ? t("diary.firstTime") : t("diary.rewatch")}</Text>
                                    {entry.rating !== null && <Text className="font-sans text-sm text-brand">{formatStars(entry.rating)}</Text>}
                                </View>
                            </Pressable>
                            <Pressable aria-label={t("diary.delete")} onPress={() => deleteWatch({snapshot, entryId: entry.id})} className="h-10 w-10 items-center justify-center rounded-full" hitSlop={4}>
                                <Trash2 size={18} strokeWidth={1.8} color={muted}/>
                            </Pressable>
                        </View>
                    );
                })}
            </View>
            <LogWatchSheet
                isOpen={Boolean(editing)}
                onClose={() => setEditingId(null)}
                title={t("logSheet.changeDate")}
                subtitle={snapshot.title}
                submitLabel={t("logSheet.save")}
                initialWatchedAt={editing?.watchedAt}
                onSubmit={(watchedAt) => {
                    if (editing) changeDate({snapshot, entryId: editing.id, watchedAt});
                }}
            />
        </Section>
    );
};
