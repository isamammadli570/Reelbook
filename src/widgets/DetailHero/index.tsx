import {useState, type ReactNode} from "react";
import {Text, View} from "react-native";
import {Reveal} from "@/components/motion/Reveal";
import {useParallax} from "@/components/motion/ScrollContext";
import {AnimatedView} from "@/components/ui/animated";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {LinearGradient} from "expo-linear-gradient";
import {useCSSVariable} from "uniwind";
import {Image} from "@/components/ui/image";
import {BackButton} from "@/widgets/BackButton";
import {imageUrl} from "@/helpers/media";
import {withAlpha} from "@/helpers/details";
import {IMAGE_SIZE} from "@/constants/other";

const BACKDROP_HEIGHT = 320;
const POSTER_WIDTH = 112;
const POSTER_HEIGHT = 168;
/** Tall enough to read as the title, short enough to leave the meta line beside the poster. */
const LOGO_HEIGHT = 72;

type DetailHeroProps = {
    title: string;
    backdropPath: string | null;
    posterPath: string | null;
    eyebrow?: string;
    meta?: string;
    /** Sits over the backdrop's top right, across from the back button (the trailer). */
    action?: ReactNode;
    /** The age rating, such as "R" or "TV-MA", drawn as a small outlined label after the eyebrow. */
    badge?: string | null;
    /** The title's own logo, shown in place of its name; the name stays for screen readers and as a fallback. */
    logoPath?: string | null;
};

/**
 * Backdrop fading into the page, with the poster overlapping it and the title beside the poster:
 * the title's own logo where TMDB has one, else its name in the serif face.
 */
export const DetailHero = ({title, backdropPath, posterPath, eyebrow, meta, action, badge, logoPath}: DetailHeroProps) => {
    const insets = useSafeAreaInsets();
    const background = String(useCSSVariable("--color-background"));
    const backdrop = imageUrl(backdropPath, IMAGE_SIZE.BACKDROP);
    const poster = imageUrl(posterPath, IMAGE_SIZE.POSTER);
    const parallax = useParallax(BACKDROP_HEIGHT);
    const logo = imageUrl(logoPath, IMAGE_SIZE.LOGO_LARGE);
    // A logo that does not load falls back to the written title.
    const [hasLogoFailed, setHasLogoFailed] = useState(false);

    return (
        <View>
            <Reveal variant="fade" className="w-full" style={{height: BACKDROP_HEIGHT}}>
                <AnimatedView className="absolute inset-0 overflow-hidden bg-surface" style={parallax.frame}>
                    {backdrop && (
                        <AnimatedView className="h-full w-full" style={parallax.image}>
                            <Image source={backdrop} className="h-full w-full" contentFit="cover" transition={250}/>
                        </AnimatedView>
                    )}
                </AnimatedView>
                {/* A transparent stop in the page colour avoids the grey band "transparent" leaves on iOS. */}
                <LinearGradient
                    colors={[withAlpha(background, 0.15), withAlpha(background, 0), background]}
                    locations={[0, 0.35, 1]}
                    style={{position: "absolute", inset: 0}}
                />
                <BackButton className="absolute left-5" style={{top: insets.top + 8}}/>
                {action && <View className="absolute right-5" style={{top: insets.top + 8}}>{action}</View>}
            </Reveal>

            <View className="flex-row items-end gap-4 px-5" style={{marginTop: -POSTER_HEIGHT + 40}}>
                <Reveal variant="pop" index={1} className="overflow-hidden rounded-[14px] border border-border bg-surface" style={{width: POSTER_WIDTH, height: POSTER_HEIGHT}}>
                    {poster
                        ? <Image source={poster} className="h-full w-full" contentFit="cover" transition={250}/>
                        : <Text className="p-2.5 font-serif text-xl text-foreground">{title}</Text>}
                </Reveal>
                <View className="min-w-0 flex-1 gap-1.5 pb-1">
                    {(eyebrow || badge) && (
                        <View className="flex-row items-center gap-2">
                            {eyebrow ? <Text className="font-sans-semibold text-xs uppercase tracking-wider text-brand">{eyebrow}</Text> : null}
                            {badge && (
                                <View className="rounded-md border border-muted-foreground px-1.5" aria-label={badge}>
                                    <Text className="font-sans-semibold text-[11px] leading-[16px] text-muted-foreground">{badge}</Text>
                                </View>
                            )}
                        </View>
                    )}
                    {logo && !hasLogoFailed ? (
                        <Reveal variant="fade" index={2} role="heading" aria-level={1} aria-label={title} style={{height: LOGO_HEIGHT}}>
                            {/* The height sits on the wrapper: a number in the image's own style clashes with its classes on the web. */}
                            <Image
                                source={logo}
                                className="h-full w-full"
                                contentFit="contain"
                                contentPosition="left"
                                onError={() => setHasLogoFailed(true)}
                            />
                        </Reveal>
                    ) : (
                        <Text role="heading" aria-level={1} className="font-serif text-[34px] leading-[34px] text-foreground" numberOfLines={3}>{title}</Text>
                    )}
                    {meta ? <Text className="font-sans text-[13px] text-muted-foreground" numberOfLines={2}>{meta}</Text> : null}
                </View>
            </View>
        </View>
    );
};
