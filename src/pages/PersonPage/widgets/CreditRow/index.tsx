import {Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {Image} from "@/components/ui/image";
import {creditDate, creditTitle, type FilmographyEntry} from "@/helpers/person";
import {imageUrl} from "@/helpers/media";
import {buildRoute} from "@/constants/routes";
import {IMAGE_SIZE} from "@/constants/other";

type CreditRowProps = {entry: FilmographyEntry};

/** One title in a filmography: small poster, the year, and who they were in it. */
export const CreditRow = ({entry}: CreditRowProps) => {
    const {t} = useTranslation("person");
    const {credit, roles} = entry;
    const title = creditTitle(credit);
    const poster = imageUrl(credit.poster_path, IMAGE_SIZE.PROFILE);
    const year = creditDate(credit).slice(0, 4);
    const episodes = credit.episode_count ? t("episodes", {count: credit.episode_count}) : null;
    const detail = [roles.join(", "), episodes].filter(Boolean).join(" · ");

    return (
        <PressScale role="link" aria-label={title} onPress={() => router.push(buildRoute.media(credit))} className="flex-row items-center gap-3.5 py-2">
            <View className="h-[66px] w-11 overflow-hidden rounded-lg border border-border bg-surface">
                {poster && <Image source={poster} className="h-full w-full" contentFit="cover"/>}
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
                <Text className="font-sans-semibold text-[15px] text-foreground" numberOfLines={1}>{title}</Text>
                {detail ? <Text className="font-sans text-[13px] text-muted-foreground" numberOfLines={2}>{detail}</Text> : null}
            </View>
            <Text className="w-11 text-right font-sans-medium text-[13px] text-muted-foreground">{year || "—"}</Text>
        </PressScale>
    );
};
