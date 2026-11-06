import {Pressable, Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {ChevronRight} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {Reveal} from "@/components/motion/Reveal";
import {CreateListButton} from "@/widgets/CreateListButton";
import {ListGrid} from "@/widgets/ListGrid";
import {useUserLists} from "@/hooks/lists";
import {ROUTES} from "@/constants/routes";

const PREVIEW = 4;

type ListsRowProps = {index?: number};

/** The user's lists on the profile: the latest four as cards, the count and a chevron to all of them. */
export const ListsRow = ({index = 0}: ListsRowProps) => {
    const {t} = useTranslation("lists");
    const muted = String(useCSSVariable("--color-muted-foreground"));
    const {lists} = useUserLists();

    return (
        <Reveal index={index} variant="rise" className="gap-3">
            <Pressable onPress={() => router.push(ROUTES.LISTS)} disabled={!lists.length} className="flex-row items-center justify-between" aria-label={t("title")}>
                <Text role="heading" className="font-serif text-[26px] text-foreground">{t("title")}</Text>
                {lists.length > 0 && (
                    <View className="flex-row items-center gap-1">
                        <Text className="font-sans-medium text-[15px] text-muted-foreground">{lists.length}</Text>
                        <ChevronRight size={20} strokeWidth={2} color={muted}/>
                    </View>
                )}
            </Pressable>
            {lists.length
                ? <ListGrid lists={lists.slice(0, PREVIEW)}/>
                : (
                    <View className="gap-3">
                        <Text className="font-sans text-sm leading-5 text-muted-foreground">{t("empty")}</Text>
                        <CreateListButton variant="outline"/>
                    </View>
                )}
        </Reveal>
    );
};
