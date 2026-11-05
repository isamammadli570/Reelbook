import {View} from "react-native";
import {Skeleton} from "@/components/ui/skeleton";
import {BackButton} from "@/widgets/BackButton";
import {DetailBody, DetailScreen} from "@/widgets/DetailScreen";
import {useSafeAreaInsets} from "react-native-safe-area-context";

/** Placeholder shaped like a detail page, shown while it loads. */
export const DetailSkeleton = () => {
    const insets = useSafeAreaInsets();

    return (
        <DetailScreen>
            <View className="h-[320px] w-full bg-surface">
                <BackButton className="absolute left-5" style={{top: insets.top + 8}}/>
            </View>
            <DetailBody>
                <View className="flex-row items-end gap-4" style={{marginTop: -128}}>
                    <Skeleton className="h-[168px] w-[112px] rounded-[14px] bg-surface-raised"/>
                    <View className="flex-1 gap-2 pb-1">
                        <Skeleton className="h-3 w-1/3"/>
                        <Skeleton className="h-8 w-4/5"/>
                        <Skeleton className="h-3 w-1/2"/>
                    </View>
                </View>
                <Skeleton className="h-16 w-full rounded-2xl"/>
                <View className="gap-2">
                    <Skeleton className="h-3 w-full"/>
                    <Skeleton className="h-3 w-full"/>
                    <Skeleton className="h-3 w-2/3"/>
                </View>
            </DetailBody>
        </DetailScreen>
    );
};
