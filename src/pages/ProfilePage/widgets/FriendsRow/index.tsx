import {Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {ChevronRight, Users} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {useFollowCounts, useSelfId} from "@/hooks/social";
import {ROUTES} from "@/constants/routes";

/** Followers and following on your own profile; the row opens the friends page to find and manage people. */
export const FriendsRow = ({index = 0}: {index?: number}) => {
    const {t} = useTranslation("social");
    const [muted, brand] = useCSSVariable(["--color-subtle-foreground", "--color-brand"]).map(String);
    const selfId = useSelfId();
    const {data: counts} = useFollowCounts(selfId);
    if (!selfId) return null;

    return (
        <Reveal variant="rise" index={index}>
            <PressScale scaleTo={0.98} onPress={() => router.push(ROUTES.FRIENDS)} role="link" aria-label={t("friends.title")} className="flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-3.5">
                <Users size={20} strokeWidth={2} color={brand}/>
                <View className="min-w-0 flex-1">
                    <Text className="font-sans-semibold text-[15px] text-foreground">{t("friends.title")}</Text>
                    <Text className="font-sans text-[13px] text-muted-foreground" numberOfLines={1}>
                        {`${t("counts.followers", {count: counts?.followers ?? 0})}  ·  ${t("counts.following", {count: counts?.following ?? 0})}`}
                    </Text>
                </View>
                <ChevronRight size={18} strokeWidth={2} color={muted}/>
            </PressScale>
        </Reveal>
    );
};
