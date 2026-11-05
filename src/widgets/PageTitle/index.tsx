import {Text, View} from "react-native";

type PageTitleProps = {
    title: string;
    eyebrow?: string;
};

/** The big serif heading at the top of a tab page, with an optional small line above it. */
export const PageTitle = ({title, eyebrow}: PageTitleProps) => (
    <View className="gap-1">
        {eyebrow && <Text className="font-sans text-sm text-muted-foreground">{eyebrow}</Text>}
        <Text role="heading" aria-level={1} className="font-serif text-[40px] leading-[42px] text-foreground">{title}</Text>
    </View>
);
