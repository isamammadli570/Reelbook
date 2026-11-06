import {Modal, Pressable, Text, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";
import {FadeIn} from "react-native-reanimated";
import {AnimatedView} from "@/components/ui/animated";
import {cn} from "@/lib/utils";
import {SHELF_SORT, type ShelfSort} from "@/constants/other";

type RadioRowProps = {
    label: string;
    isSelected: boolean;
    onPress: () => void;
};

const RadioRow = ({label, isSelected, onPress}: RadioRowProps) => (
    <Pressable role="radio" aria-checked={isSelected} onPress={onPress} className="flex-row items-center gap-3.5 px-4 py-3 active:bg-surface">
        <View className={cn("h-5 w-5 items-center justify-center rounded-full border-2", isSelected ? "border-foreground" : "border-subtle-foreground")}>
            {isSelected && <View className="h-2.5 w-2.5 rounded-full bg-foreground"/>}
        </View>
        <Text className="font-sans-medium text-[15px] text-foreground">{label}</Text>
    </Pressable>
);

type SortMenuProps = {
    isOpen: boolean;
    onClose: () => void;
    sort: ShelfSort;
    onSortChange: (sort: ShelfSort) => void;
    /** Series can also be split into watching, not started and completed. */
    canGroup: boolean;
    isGrouped: boolean;
    onGroupedChange: (isGrouped: boolean) => void;
};

/** Popover under the sort button: order of the list, and grouping by watch status for series. */
export const SortMenu = ({isOpen, onClose, sort, onSortChange, canGroup, isGrouped, onGroupedChange}: SortMenuProps) => {
    const {t} = useTranslation("profile");
    const insets = useSafeAreaInsets();

    const pick = (next: () => void) => {
        next();
        onClose();
    };

    return (
        <Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose}>
            <Pressable className="flex-1 bg-black/40" onPress={onClose} aria-label={t("list.closeSort")}>
                <AnimatedView entering={FadeIn.duration(160)} className="absolute right-5 w-64 gap-2" style={{top: insets.top + 60}}>
                    <View role="radiogroup" className="overflow-hidden rounded-2xl border border-border bg-surface-raised py-1">
                        {Object.values(SHELF_SORT).map((option) => (
                            <RadioRow key={option} label={t(`sort.${option}`)} isSelected={option === sort} onPress={() => pick(() => onSortChange(option))}/>
                        ))}
                    </View>
                    {canGroup && (
                        <View role="radiogroup" className="overflow-hidden rounded-2xl border border-border bg-surface-raised py-1">
                            <Text className="px-4 pb-1 pt-2.5 font-sans text-xs text-muted-foreground">{t("list.groupBy")}</Text>
                            <RadioRow label={t("list.byStatus")} isSelected={isGrouped} onPress={() => pick(() => onGroupedChange(true))}/>
                            <RadioRow label={t("list.noGrouping")} isSelected={!isGrouped} onPress={() => pick(() => onGroupedChange(false))}/>
                        </View>
                    )}
                </AnimatedView>
            </Pressable>
        </Modal>
    );
};
