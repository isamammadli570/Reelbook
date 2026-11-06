import {Tabs} from "expo-router";
import {useTranslation} from "react-i18next";
import {useReducedMotion} from "react-native-reanimated";
import {useCSSVariable} from "uniwind";
import {TabBar} from "@/layout/TabBar";

export default function TabsLayout() {
    const {t} = useTranslation();
    const reduced = useReducedMotion();
    const background = String(useCSSVariable("--color-background"));

    return (
        <Tabs
            tabBar={(props) => <TabBar {...props}/>}
            // The scene behind each tab defaults to white, which shows mid cross-fade; it takes the page colour instead.
            screenOptions={{headerShown: false, animation: reduced ? "none" : "fade", sceneStyle: {backgroundColor: background}}}
        >
            <Tabs.Screen name="index" options={{title: t("nav.home")}}/>
            <Tabs.Screen name="discover" options={{title: t("nav.discover")}}/>
            <Tabs.Screen name="calendar" options={{title: t("nav.calendar")}}/>
            <Tabs.Screen name="stats" options={{title: t("nav.stats")}}/>
            <Tabs.Screen name="profile" options={{title: t("nav.profile")}}/>
        </Tabs>
    );
}
