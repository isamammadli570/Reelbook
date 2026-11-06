import {ScrollView, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {History, X} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {clearRecentSearches, forgetSearch, useRecentSearches} from "@/lib/recentSearches";

type RecentSearchesProps = {onPick: (term: string) => void};

/**
 * One slim row of the last searches under the search box: a tap searches again, × forgets one, and
 * "Clear" forgets them all. Nothing shows until something has been searched.
 */
export const RecentSearches = ({onPick}: RecentSearchesProps) => {
    const {t} = useTranslation("discover");
    const recent = useRecentSearches();
    const muted = String(useCSSVariable("--color-subtle-foreground"));
    if (!recent.length) return null;

    return (
        <Reveal variant="fade" className="gap-2">
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                    <History size={14} strokeWidth={2} color={muted}/>
                    <Text className="font-sans-medium text-xs uppercase tracking-wider text-muted-foreground">{t("recent.title")}</Text>
                </View>
                <PressScale onPress={clearRecentSearches} hitSlop={8} scaleTo={0.95} aria-label={t("recent.clearAll")}>
                    <Text className="font-sans-medium text-xs text-brand">{t("recent.clear")}</Text>
                </PressScale>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" className="-mx-5" contentContainerClassName="gap-2 px-5">
                {recent.map((term) => (
                    <View key={term} className="h-9 flex-row items-center rounded-full border border-border bg-surface">
                        <PressScale onPress={() => onPick(term)} scaleTo={0.96} aria-label={t("recent.searchAgain", {term})} className="h-full justify-center pl-3.5 pr-1.5">
                            <Text className="max-w-[160px] font-sans text-[13px] text-foreground" numberOfLines={1}>{term}</Text>
                        </PressScale>
                        <PressScale onPress={() => forgetSearch(term)} scaleTo={0.9} hitSlop={6} aria-label={t("recent.remove", {term})} className="h-full justify-center pl-0.5 pr-3">
                            <X size={13} strokeWidth={2.25} color={muted}/>
                        </PressScale>
                    </View>
                ))}
            </ScrollView>
        </Reveal>
    );
};
