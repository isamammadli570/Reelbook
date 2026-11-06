import {TextInput, View} from "react-native";
import {Search} from "lucide-react-native";
import {useCSSVariable} from "uniwind";

type SearchFieldProps = {
    value: string;
    onChangeText: (value: string) => void;
    label: string;
    placeholder: string;
};

/** Search box with a leading icon; the text is debounced by the page, not here. */
export const SearchField = ({value, onChangeText, label, placeholder}: SearchFieldProps) => {
    const muted = String(useCSSVariable("--color-subtle-foreground"));

    return (
        <View className="h-[52px] flex-row items-center gap-2.5 rounded-2xl border border-border bg-surface px-4">
            <Search size={20} strokeWidth={1.8} color={muted}/>
            <TextInput
                aria-label={label}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={muted}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                className="flex-1 font-sans text-[15px] text-foreground"
            />
        </View>
    );
};
