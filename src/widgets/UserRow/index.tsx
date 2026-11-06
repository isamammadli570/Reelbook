import {Text, View} from "react-native";
import {router} from "expo-router";
import {PressScale} from "@/components/motion/PressScale";
import {Avatar} from "@/widgets/Avatar";
import {FollowButton} from "@/widgets/FollowButton";
import {buildRoute} from "@/constants/routes";
import type {PublicProfile} from "@/api/social.api";

type UserRowProps = {user: PublicProfile};

/** A person in a list: photo, name and @username open their page; the follow button sits on the right. */
export const UserRow = ({user}: UserRowProps) => (
    <View className="flex-row items-center gap-3">
        <PressScale scaleTo={0.98} onPress={() => router.push(buildRoute.user(user.username))} role="link" aria-label={user.name || `@${user.username}`} className="min-w-0 flex-1 flex-row items-center gap-3">
            <Avatar name={user.name || user.username} color={user.avatarColor} photoUrl={user.avatarUrl} size={44}/>
            <View className="min-w-0 flex-1">
                <Text className="font-sans-semibold text-[15px] text-foreground" numberOfLines={1}>{user.name || `@${user.username}`}</Text>
                {user.name ? <Text className="font-sans text-[13px] text-muted-foreground" numberOfLines={1}>@{user.username}</Text> : null}
            </View>
        </PressScale>
        <FollowButton userId={user.userId} isCompact/>
    </View>
);
