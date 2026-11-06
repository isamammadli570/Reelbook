import {Pressable, Text, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {LinearGradient} from "expo-linear-gradient";
import {useTranslation} from "react-i18next";
import {EllipsisVertical} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {Reveal} from "@/components/motion/Reveal";
import {Image} from "@/components/ui/image";
import {Avatar} from "@/widgets/Avatar";
import {withAlpha} from "@/helpers/details";
import {imageUrl} from "@/helpers/media";
import {IMAGE_SIZE} from "@/constants/other";
import type {Profile} from "@/api/profile.api";

const COVER_HEIGHT = 220;
const AVATAR_SIZE = 92;

type ProfileCoverProps = {
    profile: Profile;
    onOpenMenu: () => void;
};

/** Cover image fading into the page, the avatar overlapping it, and name, @username and bio beneath. */
export const ProfileCover = ({profile, onOpenMenu}: ProfileCoverProps) => {
    const {t} = useTranslation("profile");
    const insets = useSafeAreaInsets();
    const [background, foreground] = useCSSVariable(["--color-background", "--color-foreground"]).map(String);
    // Only what the user chose: with no cover the plain tinted band shows, exactly as on the edit page.
    const cover = profile.coverUrl ?? imageUrl(profile.coverPath, IMAGE_SIZE.BACKDROP);
    const name = profile.name || t("defaultName");

    return (
        <View>
            <Reveal variant="fade" className="w-full bg-brand-soft" style={{height: COVER_HEIGHT + insets.top}}>
                {cover && <Image source={cover} className="h-full w-full" contentFit="cover" transition={300}/>}
                <LinearGradient colors={[withAlpha(background, 0.35), withAlpha(background, 0), background]} locations={[0, 0.4, 1]} style={{position: "absolute", inset: 0}}/>
                <Pressable
                    onPress={onOpenMenu}
                    aria-label={t("menu.open")}
                    className="absolute right-5 h-11 w-11 items-center justify-center rounded-full bg-black/50"
                    style={{top: insets.top + 8}}
                >
                    <EllipsisVertical size={22} strokeWidth={2} color={foreground}/>
                </Pressable>
            </Reveal>

            <View className="gap-3 px-5" style={{marginTop: -AVATAR_SIZE / 2}}>
                <Reveal variant="pop" index={1}>
                    <Avatar name={name} color={profile.avatarColor} photoUrl={profile.avatarUrl} size={AVATAR_SIZE} hasRing/>
                </Reveal>
                <Reveal variant="rise" index={2} className="gap-1">
                    <Text role="heading" aria-level={1} className="font-serif text-[34px] leading-[38px] text-foreground" numberOfLines={1}>{name}</Text>
                    {profile.username ? <Text className="font-sans text-sm text-muted-foreground">@{profile.username}</Text> : null}
                    {profile.bio ? <Text className="mt-1 font-sans text-sm leading-5 text-foreground">{profile.bio}</Text> : null}
                </Reveal>
            </View>
        </View>
    );
};
