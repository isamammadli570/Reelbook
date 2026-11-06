import type {ReactNode} from "react";
import {ScrollView, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Button} from "@/components/ui/button";
import {Chip} from "@/components/ui/chip";
import {Image} from "@/components/ui/image";
import {BottomSheet} from "@/widgets/BottomSheet";
import {imageUrl} from "@/helpers/media";
import {
    DISCOVER_DECADES,
    DISCOVER_LANGUAGES,
    DISCOVER_RATINGS,
    DISCOVER_SORT,
    EMPTY_FILTERS,
    toggleDecade,
    toggleValue,
    type DiscoverFilters,
} from "@/helpers/discover";
import {IMAGE_SIZE} from "@/constants/other";
import type {StreamingService} from "@/api/media.api";

type GroupProps = {title: string; hint?: string; children: ReactNode};

const Group = ({title, hint, children}: GroupProps) => (
    <View className="gap-2.5">
        <Text className="font-sans-medium text-xs uppercase tracking-wider text-muted-foreground">{title}</Text>
        {hint ? <Text className="-mt-1 font-sans text-xs text-subtle-foreground">{hint}</Text> : null}
        <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
);

type FilterSheetProps = {
    isOpen: boolean;
    onClose: () => void;
    filters: DiscoverFilters;
    onChange: (filters: DiscoverFilters) => void;
    services: StreamingService[];
};

/**
 * Everything Discover can narrow by besides genre: order, streaming services, original languages, era and
 * a rating floor. Services and languages take several at once (either matches); decades form one unbroken
 * run. Each tap applies at once, so the results behind the sheet are ready when it closes.
 */
export const FilterSheet = ({isOpen, onClose, filters, onChange, services}: FilterSheetProps) => {
    const {t} = useTranslation("discover");
    const update = (change: Partial<DiscoverFilters>) => onChange({...filters, ...change});

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={t("filters.title")}>
            <ScrollView className="-mx-5" contentContainerClassName="gap-6 px-5 pb-2" showsVerticalScrollIndicator={false}>
                <Group title={t("filters.sort")}>
                    {Object.values(DISCOVER_SORT).map((sort) => (
                        <Chip key={sort} label={t(`filters.sorts.${sort}`)} isSelected={filters.sort === sort} onPress={() => update({sort})}/>
                    ))}
                </Group>
                {services.length > 0 && (
                    <Group title={t("filters.service")}>
                        {services.map((service) => {
                            const logo = imageUrl(service.logo_path, IMAGE_SIZE.LOGO);
                            return (
                                <Chip
                                    key={service.provider_id}
                                    label={service.provider_name}
                                    isSelected={filters.providerIds.includes(service.provider_id)}
                                    onPress={() => update({providerIds: toggleValue(filters.providerIds, service.provider_id)})}
                                    leading={logo ? <Image source={logo} className="-ml-1.5 h-6 w-6 rounded-md"/> : undefined}
                                />
                            );
                        })}
                    </Group>
                )}
                <Group title={t("filters.language")}>
                    {DISCOVER_LANGUAGES.map((language) => (
                        <Chip key={language} label={t(`filters.languages.${language}`)} isSelected={filters.languages.includes(language)} onPress={() => update({languages: toggleValue(filters.languages, language)})}/>
                    ))}
                </Group>
                <Group title={t("filters.decade")} hint={t("filters.decadeHint")}>
                    {DISCOVER_DECADES.map((decade) => (
                        <Chip key={decade} label={t(`filters.decades.${decade}`)} isSelected={filters.decades.includes(decade)} onPress={() => update({decades: toggleDecade(filters.decades, decade)})}/>
                    ))}
                </Group>
                <Group title={t("filters.rating")}>
                    {DISCOVER_RATINGS.map((rating) => (
                        <Chip key={rating} label={`${rating}+`} isSelected={filters.minRating === rating} onPress={() => update({minRating: filters.minRating === rating ? null : rating})}/>
                    ))}
                </Group>
            </ScrollView>
            <View className="flex-row gap-2">
                <Button variant="outline" label={t("filters.reset")} className="flex-1" onPress={() => onChange(EMPTY_FILTERS)}/>
                <Button variant="brand" label={t("filters.show")} className="flex-1" onPress={onClose}/>
            </View>
        </BottomSheet>
    );
};
