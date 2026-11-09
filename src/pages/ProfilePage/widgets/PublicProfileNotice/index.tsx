import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Reveal} from "@/components/motion/Reveal";
import {Button} from "@/components/ui/button";
import {useApplySharing} from "@/hooks/social";
import {useGetProfile, useSaveProfile} from "@/hooks/profile";
import {haptics} from "@/lib/haptics";

/**
 * Profiles are public now; an account that had turned sharing off stays hidden until its owner agrees here,
 * so nobody is made public without being asked.
 */
export const PublicProfileNotice = () => {
    const {t} = useTranslation("profile");
    const {data: profile} = useGetProfile();
    const {mutateAsync: saveProfile, isPending: isSaving} = useSaveProfile();
    const {mutate: applySharing, isPending: isApplying} = useApplySharing();

    const makePublic = async () => {
        if (!profile) return;
        haptics.tap();
        await saveProfile({...profile, shareActivity: true});
        applySharing(true);
    };

    return (
        <Reveal variant="fade" className="gap-4 rounded-2xl border border-border bg-surface p-5">
            <View className="gap-1.5">
                <Text className="font-serif text-2xl text-foreground">{t("public.title")}</Text>
                <Text className="font-sans text-sm leading-5 text-muted-foreground">{t("public.body")}</Text>
            </View>
            <Button variant="brand" label={t("public.action")} isLoading={isSaving || isApplying} onPress={() => void makePublic().catch(() => undefined)}/>
        </Reveal>
    );
};
