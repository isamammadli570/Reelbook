import {Linking, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {ArrowUpRight} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {Section} from "@/widgets/Section";
import {EXTERNAL_SITE, externalLinks, type ExternalSite} from "@/helpers/externalLinks";
import type {MediaType} from "@/constants/other";
import type {ExternalIds} from "@/api/externalIds.api";

/** Site names are brands and read the same in every language; only "Official site" is translated. */
const SITE_NAMES: Record<Exclude<ExternalSite, "homepage">, string> = {
    imdb: "IMDb",
    letterboxd: "Letterboxd",
    tmdb: "TMDB",
    wikipedia: "Wikipedia",
};

type ExternalLinksProps = {
    mediaType: MediaType;
    tmdbId: number;
    externalIds: ExternalIds | undefined;
    homepage: string | null | undefined;
};

/** Pills that open the title on IMDb, Letterboxd, TMDB, Wikipedia and its own site. */
export const ExternalLinks = ({mediaType, tmdbId, externalIds, homepage}: ExternalLinksProps) => {
    const {t, i18n} = useTranslation("details");
    const muted = String(useCSSVariable("--color-muted-foreground"));
    const links = externalLinks({mediaType, tmdbId, externalIds, homepage, language: i18n.language});

    return (
        <Section title={t("links.title")}>
            <View className="flex-row flex-wrap gap-2">
                {links.map((link) => {
                    const name = link.site === EXTERNAL_SITE.HOMEPAGE ? t("links.homepage") : SITE_NAMES[link.site];
                    return (
                        <PressScale
                            key={link.site}
                            role="link"
                            aria-label={link.site === EXTERNAL_SITE.HOMEPAGE ? t("links.openHomepage") : t("links.open", {site: name})}
                            onPress={() => void Linking.openURL(link.url)}
                            scaleTo={0.95}
                            className="h-9 flex-row items-center gap-1 rounded-full border border-border bg-surface pl-3.5 pr-2.5"
                        >
                            <Text className="font-sans-medium text-[13px] text-foreground">{name}</Text>
                            <ArrowUpRight size={14} strokeWidth={2} color={muted}/>
                        </PressScale>
                    );
                })}
            </View>
        </Section>
    );
};
