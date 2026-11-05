import type {ReactNode} from "react";
import {Text, View} from "react-native";

type SectionProps = {
    title: string;
    aside?: ReactNode;
    children: ReactNode;
};

/** A titled block of a page; `aside` sits on the right of the title (a link or a count). */
export const Section = ({title, aside, children}: SectionProps) => (
    <View className="gap-3">
        <View className="flex-row items-baseline justify-between">
            <Text role="heading" className="font-serif text-[26px] text-foreground">{title}</Text>
            {aside}
        </View>
        {children}
    </View>
);
