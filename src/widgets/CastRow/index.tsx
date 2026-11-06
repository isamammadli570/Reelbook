import {ScrollView, Text, View} from "react-native";
import {router} from "expo-router";
import {PressScale} from "@/components/motion/PressScale";
import {AnimatedView} from "@/components/ui/animated";
import {enteringFor} from "@/lib/motion";
import {Image} from "@/components/ui/image";
import {imageUrl} from "@/helpers/media";
import {initials} from "@/helpers/person";
import {buildRoute} from "@/constants/routes";
import {CAST_LIMIT, IMAGE_SIZE} from "@/constants/other";
import type {CastMember} from "@/api/people.api";

/** Anyone with a portrait: a cast member with their character, or a search result with their department. */
export type PersonChip = Pick<CastMember, "id" | "name" | "profile_path"> & {character?: string};

type CastRowProps = {cast: PersonChip[]};

/** Horizontally scrolling round portraits; each opens that person's page. */
export const CastRow = ({cast}: CastRowProps) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-3.5 px-5">
        {cast.slice(0, CAST_LIMIT).map((member, index) => {
            const photo = imageUrl(member.profile_path, IMAGE_SIZE.PROFILE);
            return (
                // The entrance sits on a wrapper so that its transform does not overwrite the press scale.
                <AnimatedView key={member.id} entering={enteringFor("fade", index)}>
                    <PressScale
                        role="link"
                        aria-label={member.name}
                        onPress={() => router.push(buildRoute.person(member.id))}
                        className="w-[72px] items-center gap-1.5"
                    >
                        <View className="h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full bg-surface">
                            {photo
                                ? <Image source={photo} className="h-full w-full" contentFit="cover"/>
                                : <Text className="font-sans-semibold text-lg text-muted-foreground">{initials(member.name)}</Text>}
                        </View>
                        <Text className="text-center font-sans-medium text-[11px] leading-[14px] text-foreground" numberOfLines={2}>{member.name}</Text>
                        {member.character ? <Text className="text-center font-sans text-[11px] leading-[14px] text-muted-foreground" numberOfLines={1}>{member.character}</Text> : null}
                    </PressScale>
                </AnimatedView>
            );
        })}
    </ScrollView>
);
