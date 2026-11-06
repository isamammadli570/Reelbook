import {Linking, Text} from "react-native";
import {useTranslation} from "react-i18next";
import {Play} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {pickTrailer, youtubeUrl} from "@/helpers/watch";
import type {Video} from "@/api/watch.api";

type TrailerButtonProps = {videos: Video[]};

/** A translucent pill over the backdrop that opens the trailer on YouTube; absent when there is none. */
export const TrailerButton = ({videos}: TrailerButtonProps) => {
    const {t, i18n} = useTranslation("details");
    const foreground = String(useCSSVariable("--color-foreground"));
    const trailer = pickTrailer(videos, i18n.language);
    if (!trailer) return null;

    return (
        <PressScale
            role="link"
            aria-label={t("trailer.open", {name: trailer.name})}
            onPress={() => void Linking.openURL(youtubeUrl(trailer.key))}
            className="h-11 flex-row items-center gap-2 rounded-full bg-black/50 pl-3.5 pr-4"
        >
            <Play size={16} strokeWidth={2.25} color={foreground} fill={foreground}/>
            <Text className="font-sans-semibold text-sm text-foreground">{t("trailer.label")}</Text>
        </PressScale>
    );
};
