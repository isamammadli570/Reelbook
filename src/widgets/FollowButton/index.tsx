import {useTranslation} from "react-i18next";
import {UserCheck, UserPlus} from "lucide-react-native";
import {Button} from "@/components/ui/button";
import {useIsFollowing, useSelfId, useSetFollowing} from "@/hooks/social";
import {haptics} from "@/lib/haptics";
import {cn} from "@/lib/utils";

type FollowButtonProps = {userId: string; isCompact?: boolean; className?: string};

/** "Follow" in the brand colour, or "Following" in outline once followed; tapping flips it at once. Hidden on yourself. */
export const FollowButton = ({userId, isCompact, className}: FollowButtonProps) => {
    const {t} = useTranslation("social");
    const selfId = useSelfId();
    const {data: isFollowing, isLoading} = useIsFollowing(userId);
    const {mutate: setFollowing} = useSetFollowing();
    if (!selfId || selfId === userId) return null;

    const toggle = () => {
        haptics.tap();
        setFollowing({userId, follow: !isFollowing});
    };

    return (
        <Button
            variant={isFollowing ? "outline" : "brand"}
            icon={isCompact ? undefined : isFollowing ? UserCheck : UserPlus}
            label={isFollowing ? t("followingButton") : t("follow")}
            isLoading={isLoading}
            onPress={toggle}
            aria-pressed={Boolean(isFollowing)}
            className={cn(isCompact && "h-9 rounded-full px-3.5", className)}
        />
    );
};
