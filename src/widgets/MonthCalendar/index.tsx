import {useState} from "react";
import {Pressable, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {ChevronLeft, ChevronRight} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {useDateFormat} from "@/hooks/useDateFormat";
import {isFutureDay, isSameDay, monthGrid} from "@/helpers/watchDate";
import {cn} from "@/lib/utils";

/** A Monday to show weekday names from, Monday first. */
const WEEK_START = new Date(2024, 0, 1);
const WEEKDAYS = Array.from({length: 7}, (_, index) => new Date(WEEK_START.getFullYear(), 0, 1 + index));

type MonthCalendarProps = {
    value: Date;
    onChange: (day: Date) => void;
    today: Date;
};

/** One month of days to pick from, with arrows to earlier months; days after today cannot be picked. */
export const MonthCalendar = ({value, onChange, today}: MonthCalendarProps) => {
    const {t} = useTranslation("details");
    const {monthName, weekdayShort} = useDateFormat();
    const [foreground, subtle] = useCSSVariable(["--color-foreground", "--color-subtle-foreground"]).map(String);
    const [shown, setShown] = useState({year: value.getFullYear(), month: value.getMonth()});

    const isCurrentMonth = shown.year === today.getFullYear() && shown.month === today.getMonth();
    const step = (delta: number) => setShown(({year, month}) => {
        const next = new Date(year, month + delta, 1);
        return {year: next.getFullYear(), month: next.getMonth()};
    });

    return (
        <View className="gap-1.5 rounded-2xl bg-background p-3">
            <View className="flex-row items-center justify-between">
                <Pressable onPress={() => step(-1)} aria-label={t("logSheet.previousMonth")} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full">
                    <ChevronLeft size={20} strokeWidth={2} color={foreground}/>
                </Pressable>
                <Text className="font-sans-semibold text-[15px] text-foreground">{monthName(shown.month)} {shown.year}</Text>
                <Pressable
                    onPress={() => step(1)}
                    disabled={isCurrentMonth}
                    aria-label={t("logSheet.nextMonth")}
                    hitSlop={8}
                    className="h-9 w-9 items-center justify-center rounded-full"
                >
                    <ChevronRight size={20} strokeWidth={2} color={isCurrentMonth ? subtle : foreground}/>
                </Pressable>
            </View>

            <View className="flex-row">
                {WEEKDAYS.map((day) => (
                    <Text key={day.getDay()} className="flex-1 text-center font-sans text-[11px] text-muted-foreground">{weekdayShort(day)}</Text>
                ))}
            </View>

            {monthGrid(shown.year, shown.month).map((week, index) => (
                <View key={index} className="flex-row">
                    {week.map((day, column) => {
                        if (!day) return <View key={column} className="h-9 flex-1"/>;
                        const isSelected = isSameDay(day, value);
                        const isDisabled = isFutureDay(day, today);
                        const isToday = isSameDay(day, today);
                        return (
                            <Pressable
                                key={column}
                                onPress={() => onChange(day)}
                                disabled={isDisabled}
                                role="radio"
                                aria-checked={isSelected}
                                aria-label={`${day.getDate()} ${monthName(day.getMonth())}`}
                                className="h-9 flex-1 items-center justify-center"
                            >
                                <View className={cn("h-8 w-8 items-center justify-center rounded-full", isSelected && "bg-brand", !isSelected && isToday && "border border-border")}>
                                    <Text className={cn(
                                        "font-sans-medium text-sm",
                                        isSelected ? "text-brand-ink" : isDisabled ? "text-subtle-foreground" : "text-foreground",
                                    )}
                                    >
                                        {day.getDate()}
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};
