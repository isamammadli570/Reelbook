import {Linking, ScrollView, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {Image} from "@/components/ui/image";
import {Section} from "@/widgets/Section";
import {imageUrl} from "@/helpers/media";
import {providerGroups, regionOffers} from "@/helpers/watch";
import {regionName, watchRegions} from "@/lib/region";
import {IMAGE_SIZE} from "@/constants/other";
import type {RegionProviders} from "@/api/watch.api";

type WhereToWatchProps = {
    results: Record<string, RegionProviders>;
    index?: number;
};

/** Streaming, rental and purchase options in the viewer's country. JustWatch asks to be credited for the data. */
export const WhereToWatch = ({results, index}: WhereToWatchProps) => {
    const {t, i18n} = useTranslation("details");
    const found = regionOffers(results, watchRegions(i18n.language));
    const groups = found ? providerGroups(found.offers) : [];

    return (
        <Section
            title={t("watch.title")}
            index={index}
            aside={found ? <Text className="font-sans text-[13px] text-muted-foreground">{regionName(found.region, i18n.language)}</Text> : null}
        >
            {groups.length ? (
                <View className="gap-4">
                    {groups.map((group) => (
                        <View key={group.kind} className="gap-2">
                            <Text className="font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">{t(`watch.kinds.${group.kind}`)}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-3 px-5">
                                {group.providers.map((provider) => {
                                    const logo = imageUrl(provider.logo_path, IMAGE_SIZE.LOGO);
                                    return (
                                        <PressScale
                                            key={provider.provider_id}
                                            role="link"
                                            aria-label={provider.provider_name}
                                            onPress={() => found && void Linking.openURL(found.offers.link)}
                                            className="w-16 items-center gap-1.5"
                                        >
                                            <View className="h-14 w-14 overflow-hidden rounded-2xl border border-border bg-surface">
                                                {logo && <Image source={logo} className="h-full w-full" contentFit="cover"/>}
                                            </View>
                                            <Text className="text-center font-sans text-[11px] leading-[14px] text-muted-foreground" numberOfLines={2}>{provider.provider_name}</Text>
                                        </PressScale>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    ))}
                </View>
            ) : (
                <Text className="font-sans text-sm text-muted-foreground">{t("watch.none")}</Text>
            )}
            <Text className="font-sans text-[11px] text-muted-foreground">{t("watch.source")}</Text>
        </Section>
    );
};
