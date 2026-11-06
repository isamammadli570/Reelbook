import {ScrollView, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {SlidersHorizontal, X} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {Chip} from "@/components/ui/chip";
import {activeFilterCount, DISCOVER_SORT, EMPTY_FILTERS, type DiscoverFilters} from "@/helpers/discover";
import type {StreamingService} from "@/api/media.api";

type FilterButtonProps = {filters: DiscoverFilters; onOpen: () => void};

/** A square button the height of the media switch beside it, with how many kinds of filter are on. */
export const FilterButton = ({filters, onOpen}: FilterButtonProps) => {
    const {t} = useTranslation("discover");
    const [foreground, brandInk] = useCSSVariable(["--color-foreground", "--color-brand-ink"]).map(String);
    const count = activeFilterCount(filters);

    return (
        <PressScale
            onPress={onOpen}
            aria-label={count > 0 ? `${t("filters.title")}, ${count}` : t("filters.title")}
            scaleTo={0.94}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-surface"
        >
            <SlidersHorizontal size={18} strokeWidth={2} color={foreground}/>
            {count > 0 && (
                <Reveal variant="pop" className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-brand px-1">
                    <Text className="font-sans-semibold text-[10px] leading-[12px]" style={{color: brandInk}}>{count}</Text>
                </Reveal>
            )}
        </PressScale>
    );
};

type FilterChipsProps = {
    filters: DiscoverFilters;
    onChange: (filters: DiscoverFilters) => void;
    services: StreamingService[];
};

type ActiveChip = {key: string; label: string; remove: () => DiscoverFilters};

/** Each active filter as a chip whose × lets go of it; nothing at all while no filter is on. */
export const FilterChips = ({filters, onChange, services}: FilterChipsProps) => {
    const {t} = useTranslation("discover");
    const background = String(useCSSVariable("--color-background"));

    const decadeLabel = () => {
        // Newest first, so the run reads from its oldest decade to its newest.
        const newest = Math.max(...filters.decades);
        const oldest = Math.min(...filters.decades);
        const label = (decade: number) => t(`filters.decades.${decade}`);
        return newest === oldest ? label(newest) : `${label(oldest)} – ${label(newest)}`;
    };

    const chips: ActiveChip[] = [
        ...(filters.sort !== DISCOVER_SORT.POPULARITY
            ? [{key: "sort", label: t(`filters.sorts.${filters.sort}`), remove: () => ({...filters, sort: EMPTY_FILTERS.sort})}]
            : []),
        ...filters.providerIds.map((id) => ({
            key: `provider-${id}`,
            label: services.find((service) => service.provider_id === id)?.provider_name ?? t("filters.service"),
            remove: () => ({...filters, providerIds: filters.providerIds.filter((value) => value !== id)}),
        })),
        ...filters.languages.map((language) => ({
            key: `language-${language}`,
            label: t(`filters.languages.${language}`),
            remove: () => ({...filters, languages: filters.languages.filter((value) => value !== language)}),
        })),
        ...(filters.decades.length ? [{key: "decades", label: decadeLabel(), remove: () => ({...filters, decades: []})}] : []),
        ...(filters.minRating !== null ? [{key: "rating", label: `${filters.minRating}+`, remove: () => ({...filters, minRating: null})}] : []),
    ];

    if (!chips.length) return null;

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="items-center gap-2 px-5">
            {chips.map((chip) => (
                <View key={chip.key}>
                    <Reveal variant="pop">
                        <Chip label={chip.label} isSelected onPress={() => onChange(chip.remove())} trailing={<X size={14} strokeWidth={2.5} color={background}/>}/>
                    </Reveal>
                </View>
            ))}
            {chips.length > 1 && (
                <PressScale onPress={() => onChange(EMPTY_FILTERS)} scaleTo={0.95} className="h-9 justify-center px-2">
                    <Text className="font-sans-medium text-[13px] text-brand">{t("filters.clearAll")}</Text>
                </PressScale>
            )}
        </ScrollView>
    );
};
