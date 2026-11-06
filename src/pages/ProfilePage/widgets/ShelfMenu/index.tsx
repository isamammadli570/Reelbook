import {Pressable, Text, View} from "react-native";
import {router} from "expo-router";
import {ChevronRight} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {Reveal} from "@/components/motion/Reveal";
import {cn} from "@/lib/utils";

export type ShelfLink = {key: string; label: string; count: number; href: string};

type ShelfMenuProps = {
    links: ShelfLink[];
    index?: number;
};

/** The rest of the profile as one list of counts; each row opens its full page with sorting. */
export const ShelfMenu = ({links, index = 0}: ShelfMenuProps) => {
    const muted = String(useCSSVariable("--color-muted-foreground"));

    return (
        <Reveal index={index} variant="rise" className="overflow-hidden rounded-2xl bg-surface">
            {links.map((link, position) => (
                <Pressable
                    key={link.key}
                    onPress={() => router.push(link.href)}
                    role="link"
                    aria-label={`${link.label}, ${link.count}`}
                    className={cn("flex-row items-center justify-between px-4 py-3.5 active:bg-surface-raised", position > 0 && "border-t border-border")}
                >
                    <Text className="font-sans-medium text-[15px] text-foreground">{link.label}</Text>
                    <View className="flex-row items-center gap-1">
                        <Text className="font-sans-medium text-[15px] text-muted-foreground">{link.count}</Text>
                        <ChevronRight size={18} strokeWidth={2} color={muted}/>
                    </View>
                </Pressable>
            ))}
        </Reveal>
    );
};
