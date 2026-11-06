import {useState} from "react";
import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Button} from "@/components/ui/button";
import {SegmentedControl} from "@/components/ui/segmented-control";
import {BottomSheet} from "@/widgets/BottomSheet";
import {MonthCalendar} from "@/widgets/MonthCalendar";
import {useDateFormat} from "@/hooks/useDateFormat";
import {addDays} from "@/helpers/calendar";
import {parseDate} from "@/helpers/dates";
import {quickDayOf, watchedAtFor, type QuickDay} from "@/helpers/watchDate";

type LogWatchSheetProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle: string;
    submitLabel: string;
    /** The viewing being moved; a new one starts on today. */
    initialWatchedAt?: string;
    onSubmit: (watchedAt: string) => void;
};

/**
 * Asks when a movie was watched: today and yesterday are one tap, any earlier day is on a calendar.
 * Mounted only while open, so each opening starts from the viewing's own date.
 */
const LogWatchForm = ({onClose, submitLabel, initialWatchedAt, onSubmit}: Omit<LogWatchSheetProps, "isOpen" | "title" | "subtitle">) => {
    const {t} = useTranslation("details");
    const {longDate} = useDateFormat();
    const [now] = useState(() => new Date());
    const initialDay = parseDate(initialWatchedAt) ?? now;
    const [quick, setQuick] = useState<QuickDay>(() => (initialWatchedAt ? quickDayOf(initialWatchedAt, now) : "today"));
    const [picked, setPicked] = useState<Date>(initialDay);

    const day = quick === "today" ? now : quick === "yesterday" ? addDays(now, -1) : picked;
    const options = (["today", "yesterday", "other"] as const).map((value) => ({value, label: t(`logSheet.${value}`)}));

    return (
        <>
            <SegmentedControl options={options} value={quick} onChange={setQuick} label={t("logSheet.when")}/>
            {quick === "other" && <MonthCalendar value={picked} onChange={setPicked} today={now}/>}
            {/* The calendar already marks the day; the line names it when only a shortcut is showing. */}
            {quick !== "other" && <Text className="text-center font-sans text-sm text-muted-foreground">{longDate(day.toISOString())}</Text>}
            <View className="gap-2">
                <Button
                    variant="brand"
                    label={submitLabel}
                    onPress={() => {
                        onSubmit(watchedAtFor(day, now));
                        onClose();
                    }}
                />
                <Button variant="outline" label={t("review.cancel")} onPress={onClose}/>
            </View>
        </>
    );
};

export const LogWatchSheet = ({isOpen, onClose, title, subtitle, ...form}: LogWatchSheetProps) => (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
        <Text className="-mt-2 shrink-0 font-sans text-sm text-muted-foreground" numberOfLines={1}>{subtitle}</Text>
        {isOpen && <LogWatchForm onClose={onClose} {...form}/>}
    </BottomSheet>
);
