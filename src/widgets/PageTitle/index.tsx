import {Text} from "react-native";
import {Reveal} from "@/components/motion/Reveal";

type PageTitleProps = {
    title: string;
    eyebrow?: string;
};

/** The big serif heading at the top of a page, with an optional small line above it; the heading rises in. */
export const PageTitle = ({title, eyebrow}: PageTitleProps) => (
    <Reveal variant="rise" className="gap-1">
        {eyebrow ? <Text className="font-sans text-sm text-muted-foreground">{eyebrow}</Text> : null}
        <Text role="heading" aria-level={1} className="font-serif text-[40px] leading-[42px] text-foreground">{title}</Text>
    </Reveal>
);
