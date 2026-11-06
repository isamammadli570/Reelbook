import type {ReactNode} from "react";
import {KeyboardAvoidingView, Platform, ScrollView, Text, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {LinearGradient} from "expo-linear-gradient";
import {useCSSVariable} from "uniwind";
import {Reveal} from "@/components/motion/Reveal";
import {Image} from "@/components/ui/image";
import {BackButton} from "@/widgets/BackButton";
import {useGetTrending} from "@/hooks/media";
import {usePosterWidth} from "@/hooks/usePosterWidth";
import {withAlpha} from "@/helpers/details";
import {imageUrl} from "@/helpers/media";
import {IMAGE_SIZE, MAX_CONTENT_WIDTH, MEDIA_FILTER} from "@/constants/other";

const WALL_HEIGHT = 280;
const WALL_POSTERS = 8;
const WALL_GAP = 8;

type AuthLayoutProps = {
    title: string;
    subtitle: string;
    children: ReactNode;
    footer?: ReactNode;
};

/** Sign-in and sign-up share this frame: a wall of this week's posters fading into the form, like a cinema lobby. */
export const AuthLayout = ({title, subtitle, children, footer}: AuthLayoutProps) => {
    const insets = useSafeAreaInsets();
    const background = String(useCSSVariable("--color-background"));
    const posterWidth = usePosterWidth();
    const {items} = useGetTrending(MEDIA_FILTER.ALL);
    const posters = items.filter((media) => media.poster_path).slice(0, WALL_POSTERS);

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
            <ScrollView className="flex-1" contentContainerClassName="items-center" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View className="w-full" style={{maxWidth: MAX_CONTENT_WIDTH}}>
                    <View className="overflow-hidden" style={{height: WALL_HEIGHT}}>
                        <View className="flex-row flex-wrap px-5" style={{gap: WALL_GAP, paddingTop: insets.top + 8}}>
                            {posters.map((media, index) => (
                                <Reveal key={media.id} index={index} variant="fade" style={{width: posterWidth, aspectRatio: 2 / 3}} className="overflow-hidden rounded-lg bg-surface">
                                    <Image source={imageUrl(media.poster_path, IMAGE_SIZE.POSTER)} className="h-full w-full opacity-70" contentFit="cover"/>
                                </Reveal>
                            ))}
                        </View>
                        <LinearGradient colors={[withAlpha(background, 0.25), withAlpha(background, 0.7), background]} locations={[0, 0.55, 1]} style={{position: "absolute", inset: 0}}/>
                        <BackButton className="absolute left-5" style={{top: insets.top + 8}}/>
                    </View>

                    <View className="-mt-20 gap-6 px-5" style={{paddingBottom: insets.bottom + 32}}>
                        <Reveal variant="rise" className="gap-2">
                            <Text className="font-serif-italic text-lg text-brand">Reelbook</Text>
                            <Text role="heading" aria-level={1} className="font-serif text-[40px] leading-[42px] text-foreground">{title}</Text>
                            <Text className="font-sans text-[15px] leading-[22px] text-muted-foreground">{subtitle}</Text>
                        </Reveal>
                        <Reveal variant="rise" index={1} className="gap-4">{children}</Reveal>
                        {footer}
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
