import {Tabs} from "expo-router";
import {useTranslation} from "react-i18next";
import {TabBar} from "@/layout/TabBar";

export default function TabsLayout() {
    const {t} = useTranslation();

    return (
        <Tabs tabBar={(props) => <TabBar {...props}/>} screenOptions={{headerShown: false}}>
            <Tabs.Screen name="index" options={{title: t("nav.home")}}/>
            <Tabs.Screen name="discover" options={{title: t("nav.discover")}}/>
            <Tabs.Screen name="calendar" options={{title: t("nav.calendar")}}/>
            <Tabs.Screen name="stats" options={{title: t("nav.stats")}}/>
            <Tabs.Screen name="profile" options={{title: t("nav.profile")}}/>
        </Tabs>
    );
}
