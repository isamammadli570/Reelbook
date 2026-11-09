import type {ReactNode} from "react";
import {Text, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {LinearGradient} from "expo-linear-gradient";
import {useTranslation} from "react-i18next";
import type {LucideIcon} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {useParallax} from "@/components/motion/ScrollContext";
import {AnimatedView} from "@/components/ui/animated";
import {Image} from "@/components/ui/image";
import {Avatar} from "@/widgets/Avatar";
import {withAlpha} from "@/helpers/details";
import {imageUrl} from "@/helpers/media";
import {IMAGE_SIZE} from "@/constants/other";
import type {Profile} from "@/api/profile.api";

const COVER_HEIGHT = 220;
const AVATAR_SIZE = 92;

/** What the cover shows; your own profile and someone else's public one both have it. */
export type CoverProfile = Pick<Profile, "name" | "username" | "bio" | "avatarColor" | "avatarUrl" | "coverUrl" | "coverPath">;

type ProfileCoverProps = {
    profile: CoverProfile;
    /** Round buttons over the cover's top corners. */
    leading?: ReactNode;
    actions?: ReactNode;
    /** Under the bio: counts and the follow button on someone else's profile. */
    children?: ReactNode;
};

/** Cover image fading into the page, the avatar overlapping it, and name, @username and bio beneath. */
export const ProfileCover = ({profile, leading, actions, children}: ProfileCoverProps) => {
    const {t} = useTranslation("profile");
    const insets = useSafeAreaInsets();
    const background = String(useCSSVariable("--color-background"));
    // Only what the user chose: with no cover the plain tinted band shows, exactly as on the edit page.
    const cover = profile.coverUrl ?? imageUrl(profile.coverPath, IMAGE_SIZE.BACKDROP);
    const name = profile.name || (profile.username ? `@${profile.username}` : t("defaultName"));
    const parallax = useParallax(COVER_HEIGHT + insets.top);

    return (
        <View>
            <Reveal variant="fade" className="w-full" style={{height: COVER_HEIGHT + insets.top}}>
                <AnimatedView className="absolute inset-0 overflow-hidden bg-brand-soft" style={parallax.frame}>
                    {cover && (
                        <AnimatedView className="h-full w-full" style={parallax.image}>
                            <Image source={cover} className="h-full w-full" contentFit="cover" transition={300}/>
                        </AnimatedView>
                    )}
                </AnimatedView>
                <LinearGradient colors={[withAlpha(background, 0.35), withAlpha(background, 0), background]} locations={[0, 0.4, 1]} style={{position: "absolute", inset: 0}}/>
                {leading ? <View className="absolute left-5" style={{top: insets.top + 8}}>{leading}</View> : null}
                {actions ? <View className="absolute right-5 flex-row gap-2" style={{top: insets.top + 8}}>{actions}</View> : null}
            </Reveal>

            <View className="gap-3 px-5" style={{marginTop: -AVATAR_SIZE / 2}}>
                <Reveal variant="pop" index={1}>
                    <Avatar name={name} color={profile.avatarColor} photoUrl={profile.avatarUrl} size={AVATAR_SIZE} hasRing/>
                </Reveal>
                <Reveal variant="rise" index={2} className="gap-1">
                    <Text role="heading" aria-level={1} className="font-serif text-[34px] leading-[38px] text-foreground" numberOfLines={1}>{name}</Text>
                    {profile.name && profile.username ? <Text className="font-sans text-sm text-muted-foreground">@{profile.username}</Text> : null}
                    {profile.bio ? <Text className="mt-1 font-sans text-sm leading-5 text-foreground">{profile.bio}</Text> : null}
                </Reveal>
                {children}
            </View>
        </View>
    );
};

type CoverButtonProps = {icon: LucideIcon; label: string; onPress: () => void};

/** A round translucent button that reads over the cover, like the back button. */
export const CoverButton = ({icon: Icon, label, onPress}: CoverButtonProps) => {
    const foreground = String(useCSSVariable("--color-foreground"));
    return (
        <PressScale onPress={onPress} aria-label={label} className="h-11 w-11 items-center justify-center rounded-full bg-black/50">
            <Icon size={20} strokeWidth={2} color={foreground}/>
        </PressScale>
    );
};
