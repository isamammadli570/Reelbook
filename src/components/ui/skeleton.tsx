import {View, type ViewProps} from "react-native";
import {cn} from "@/lib/utils";

export const Skeleton = ({className, ...props}: ViewProps) => <View className={cn("rounded-lg bg-surface", className)} {...props}/>;
