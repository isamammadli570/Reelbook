import {View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {BackButton} from "@/widgets/BackButton";
import {DetailBody, DetailScreen} from "@/widgets/DetailScreen";
import {QueryErrorState} from "@/widgets/QueryErrorState";

type DetailErrorStateProps = {
    error: Error | null;
    onRetry: () => void;
};

/** A detail page that failed to load: still offers the way back, plus a retry. */
export const DetailErrorState = ({error, onRetry}: DetailErrorStateProps) => {
    const insets = useSafeAreaInsets();

    return (
        <DetailScreen>
            <View className="px-5" style={{paddingTop: insets.top + 8}}>
                <BackButton/>
            </View>
            <DetailBody>
                <QueryErrorState error={error} onRetry={onRetry}/>
            </DetailBody>
        </DetailScreen>
    );
};
