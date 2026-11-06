import {View} from "react-native";
import {PressScale} from "@/components/motion/PressScale";
import {SlidingHighlight, SlidingLabel, useSlidingHighlight} from "@/components/motion/SlidingHighlight";
import {cn} from "@/lib/utils";

type SegmentedOption<TValue extends string> = {value: TValue; label: string};

type SegmentedControlProps<TValue extends string> = {
    options: SegmentedOption<TValue>[];
    value: TValue;
    onChange: (value: TValue) => void;
    label?: string;
    className?: string;
};

/** A pill row of mutually exclusive tabs, e.g. All / Movies / Series. The active pill slides to the choice. */
export const SegmentedControl = <TValue extends string>({options, value, onChange, label, className}: SegmentedControlProps<TValue>) => {
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
    const highlight = useSlidingHighlight(selectedIndex);

    return (
        <View role="tablist" aria-label={label} className={cn("flex-row gap-1 rounded-2xl bg-surface p-1", className)}>
            {/* Options measure from the row's edge, padding included, so only the height is inset here. */}
            <SlidingHighlight style={highlight.style} className="bottom-1 top-1 rounded-xl bg-foreground"/>
            {options.map((option, index) => {
                const isSelected = index === selectedIndex;
                return (
                    <PressScale
                        key={option.value}
                        role="tab"
                        aria-selected={isSelected}
                        onPress={() => onChange(option.value)}
                        onLayout={highlight.measure(index)}
                        scaleTo={0.97}
                        className="h-9 flex-1 items-center justify-center rounded-xl"
                    >
                        <SlidingLabel
                            x={highlight.x}
                            box={highlight.boxes[index]}
                            restColor="--color-muted-foreground"
                            activeColor="--color-background"
                            className="font-sans-medium text-[13px]"
                        >
                            {option.label}
                        </SlidingLabel>
                    </PressScale>
                );
            })}
        </View>
    );
};
