import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {Popover} from "@/widgets/Popover";
import {cn} from "@/lib/utils";
import type {ShelfSort} from "@/constants/other";

type RadioRowProps = {
    label: string;
    isSelected: boolean;
    onPress: () => void;
};

/** One choice; its dot pops in when picked. */
const RadioRow = ({label, isSelected, onPress}: RadioRowProps) => (
    <PressScale scaleTo={0.98} role="radio" aria-checked={isSelected} onPress={onPress} className="flex-row items-center gap-3.5 px-4 py-3 active:bg-surface">
        <View className={cn("h-5 w-5 items-center justify-center rounded-full border-2", isSelected ? "border-foreground" : "border-subtle-foreground")}>
            {isSelected && <Reveal variant="pop" className="h-2.5 w-2.5 rounded-full bg-foreground"/>}
        </View>
        <Text className="font-sans-medium text-[15px] text-foreground">{label}</Text>
    </PressScale>
);

type SortMenuProps = {
    isOpen: boolean;
    onClose: () => void;
    /** The sorts this list offers, in menu order. */
    sorts: ShelfSort[];
    sort: ShelfSort;
    onSortChange: (sort: ShelfSort) => void;
    /** Series can also be split into watching, not started and completed. */
    canGroup: boolean;
    isGrouped: boolean;
    onGroupedChange: (isGrouped: boolean) => void;
};

/** Popover under the sort button: order of the list, and grouping by watch status for series. */
export const SortMenu = ({isOpen, onClose, sorts, sort, onSortChange, canGroup, isGrouped, onGroupedChange}: SortMenuProps) => {
    const {t} = useTranslation("profile");

    const pick = (next: () => void) => {
        next();
        onClose();
    };

    return (
        <Popover isOpen={isOpen} onClose={onClose} closeLabel={t("list.closeSort")}>
            <View role="radiogroup" className="w-64 overflow-hidden rounded-2xl border border-border bg-surface-raised py-1">
                {sorts.map((option) => (
                    <RadioRow key={option} label={t(`sort.${option}`)} isSelected={option === sort} onPress={() => pick(() => onSortChange(option))}/>
                ))}
            </View>
            {canGroup && (
                <View role="radiogroup" className="w-64 overflow-hidden rounded-2xl border border-border bg-surface-raised py-1">
                    <Text className="px-4 pb-1 pt-2.5 font-sans text-xs text-muted-foreground">{t("list.groupBy")}</Text>
                    <RadioRow label={t("list.byStatus")} isSelected={isGrouped} onPress={() => pick(() => onGroupedChange(true))}/>
                    <RadioRow label={t("list.noGrouping")} isSelected={!isGrouped} onPress={() => pick(() => onGroupedChange(false))}/>
                </View>
            )}
        </Popover>
    );
};
