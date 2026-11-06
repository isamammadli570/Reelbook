import {memo} from "react";
import {Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {Image} from "@/components/ui/image";
import {imageUrl} from "@/helpers/media";
import {buildRoute} from "@/constants/routes";
import {IMAGE_SIZE} from "@/constants/other";
import type {UserList} from "@/api/lists.api";

const STACK_SIZE = 4;

type ListCardProps = {
    list: UserList;
    width: number;
    index?: number;
};

/** A list as a fanned stack of its first posters, with its name and how many titles it holds. */
export const ListCard = memo(({list, width, index = 0}: ListCardProps) => {
    const {t} = useTranslation("lists");
    // Four posters overlap by a third of their width, so the stack fills the card edge to edge.
    const posterWidth = Math.floor((width - 20) / (1 + (STACK_SIZE - 1) * 0.66));
    const covers = list.entries.slice(0, STACK_SIZE);

    return (
        <Reveal variant="rise" index={index} style={{width}}>
            <PressScale onPress={() => router.push(buildRoute.userList(list.id))} aria-label={list.name} className="gap-2.5 rounded-2xl bg-surface p-2.5">
                <View className="flex-row" style={{height: posterWidth * 1.5}}>
                    {Array.from({length: STACK_SIZE}, (_, slot) => {
                        const entry = covers[slot];
                        const poster = imageUrl(entry?.posterPath, IMAGE_SIZE.POSTER);
                        return (
                            <View
                                key={entry?.key ?? `empty-${slot}`}
                                className="overflow-hidden rounded-md border border-background bg-surface-raised"
                                style={{width: posterWidth, height: posterWidth * 1.5, marginLeft: slot ? -posterWidth * 0.34 : 0, zIndex: STACK_SIZE - slot}}
                            >
                                {poster && <Image source={poster} className="h-full w-full" contentFit="cover"/>}
                            </View>
                        );
                    })}
                </View>
                <View className="gap-0.5 px-0.5">
                    <Text className="font-sans-medium text-sm text-foreground" numberOfLines={1}>{list.name}</Text>
                    <Text className="font-sans text-xs text-muted-foreground">{t("count", {count: list.entries.length})}</Text>
                </View>
            </PressScale>
        </Reveal>
    );
});
ListCard.displayName = "ListCard";
