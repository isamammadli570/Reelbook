import {Text, View} from "react-native";

export type Fact = {label: string; value: string};

type PersonFactsProps = {facts: Fact[]};

/** Born / died / birthplace as label and value lines. */
export const PersonFacts = ({facts}: PersonFactsProps) => {
    if (!facts.length) return null;

    return (
        <View className="gap-2.5 rounded-2xl bg-surface p-4">
            {facts.map((fact) => (
                <View key={fact.label} className="flex-row gap-3">
                    <Text className="w-24 font-sans text-[13px] text-muted-foreground">{fact.label}</Text>
                    <Text className="min-w-0 flex-1 font-sans-medium text-[13px] text-foreground">{fact.value}</Text>
                </View>
            ))}
        </View>
    );
};
