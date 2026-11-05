import {Pressable, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Star, StarHalf} from "lucide-react-native";
import {useCSSVariable} from "uniwind";

const STARS = [1, 2, 3, 4, 5];

type StarRatingProps = {
    value: number | null;
    onChange: (tapped: number) => void;
    size?: number;
};

/** Five tappable stars showing half steps; what a tap does is decided by the caller (see `nextRating`). */
export const StarRating = ({value, onChange, size = 36}: StarRatingProps) => {
    const {t} = useTranslation("details");
    const [brand, empty] = useCSSVariable(["--color-brand", "--color-surface-raised"]).map(String);

    return (
        <View role="radiogroup" aria-label={t("rating.label")} className="flex-row gap-1.5">
            {STARS.map((star) => {
                const isFull = value !== null && value >= star;
                const isHalf = value === star - 0.5;
                return (
                    <Pressable key={star} role="radio" aria-checked={isFull || isHalf} aria-label={t("rating.stars", {count: star})} onPress={() => onChange(star)} hitSlop={4}>
                        <Star size={size} strokeWidth={1.5} color={isFull || isHalf ? brand : empty} fill={isFull ? brand : empty}/>
                        {isHalf && (
                            <View className="absolute inset-0">
                                <StarHalf size={size} strokeWidth={1.5} color={brand} fill={brand}/>
                            </View>
                        )}
                    </Pressable>
                );
            })}
        </View>
    );
};
