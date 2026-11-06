import type {ReactNode} from "react";
import {Text, View} from "react-native";
import {Reveal} from "@/components/motion/Reveal";

type SectionProps = {
    title: string;
    aside?: ReactNode;
    children: ReactNode;
    /** Position among its siblings, so sections rise in one after another. */
    index?: number;
};

/** A titled block of a page; `aside` sits on the right of the title (a link or a count). */
export const Section = ({title, aside, children, index = 0}: SectionProps) => (
    <Reveal index={index} variant="rise" className="gap-3">
        <View className="flex-row items-baseline justify-between">
            <Text role="heading" className="font-serif text-[26px] text-foreground">{title}</Text>
            {aside}
        </View>
        {children}
    </Reveal>
);
