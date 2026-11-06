import {Text, View} from "react-native";
import {Image} from "@/components/ui/image";
import {AVATAR_COLORS, DEFAULT_AVATAR_COLOR, type AvatarColor} from "@/constants/other";

type AvatarProps = {
    name: string;
    color: string;
    size?: number;
    /** A ring in the page colour, for an avatar that overlaps a cover image. */
    hasRing?: boolean;
    /** The user's photo; covers the initial when set. */
    photoUrl?: string | null;
};

const isAvatarColor = (value: string): value is AvatarColor => value in AVATAR_COLORS;

/** The user's photo, or their initial on their chosen colour. */
export const Avatar = ({name, color, size = 88, hasRing, photoUrl}: AvatarProps) => {
    const palette = AVATAR_COLORS[isAvatarColor(color) ? color : DEFAULT_AVATAR_COLOR];

    return (
        <View
            className={hasRing ? "items-center justify-center overflow-hidden rounded-full border-4 border-background" : "items-center justify-center overflow-hidden rounded-full"}
            style={{width: size, height: size, backgroundColor: palette.bg}}
        >
            <Text className="font-serif" style={{color: palette.ink, fontSize: size * 0.46, lineHeight: size * 0.56}}>
                {name.charAt(0).toLocaleUpperCase()}
            </Text>
            {photoUrl && <Image source={photoUrl} className="absolute inset-0" contentFit="cover" transition={200}/>}
        </View>
    );
};
