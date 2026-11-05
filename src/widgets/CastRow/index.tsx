import {ScrollView, Text, View} from "react-native";
import {Image} from "@/components/ui/image";
import {imageUrl} from "@/helpers/media";
import {CAST_LIMIT, IMAGE_SIZE} from "@/constants/other";
import type {CastMember} from "@/api/people.api";

const initials = (name: string): string => name.split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

type CastRowProps = {cast: CastMember[]};

/** Horizontally scrolling round portraits with the actor and the character they play. */
export const CastRow = ({cast}: CastRowProps) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-3.5 px-5">
        {cast.slice(0, CAST_LIMIT).map((member) => {
            const photo = imageUrl(member.profile_path, IMAGE_SIZE.PROFILE);
            return (
                <View key={member.id} className="w-[72px] items-center gap-1.5">
                    <View className="h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full bg-surface">
                        {photo
                            ? <Image source={photo} className="h-full w-full" contentFit="cover"/>
                            : <Text className="font-sans-semibold text-lg text-muted-foreground">{initials(member.name)}</Text>}
                    </View>
                    <Text className="text-center font-sans-medium text-[11px] leading-[14px] text-foreground" numberOfLines={2}>{member.name}</Text>
                    {member.character ? <Text className="text-center font-sans text-[11px] leading-[14px] text-muted-foreground" numberOfLines={1}>{member.character}</Text> : null}
                </View>
            );
        })}
    </ScrollView>
);
