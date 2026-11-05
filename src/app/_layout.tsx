import "../global.css";
import "@/i18n";
import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {useFonts} from "expo-font";
import {Inter_400Regular, Inter_500Medium, Inter_600SemiBold} from "@expo-google-fonts/inter";
import {InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic} from "@expo-google-fonts/instrument-serif";
import {useCSSVariable} from "uniwind";
import {QueryProvider} from "@/provider/QueryProvider";

// Expo Router requires route files to default-export their component.
export default function RootLayout() {
    const background = String(useCSSVariable("--color-background"));
    const [isFontsLoaded] = useFonts({Inter_400Regular, Inter_500Medium, Inter_600SemiBold, InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic});

    if (!isFontsLoaded) return null;

    return (
        <QueryProvider>
            <StatusBar style="light"/>
            <Stack screenOptions={{headerShown: false, contentStyle: {backgroundColor: background}}}/>
        </QueryProvider>
    );
}
