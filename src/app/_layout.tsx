import "../global.css";
import "@/i18n";
import {useMemo} from "react";
import {DarkTheme, Stack, ThemeProvider} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {useFonts} from "expo-font";
import {Inter_400Regular, Inter_500Medium, Inter_600SemiBold} from "@expo-google-fonts/inter";
import {InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic} from "@expo-google-fonts/instrument-serif";
import {useCSSVariable} from "uniwind";
import {QueryProvider} from "@/provider/QueryProvider";
import {RemindersProvider} from "@/provider/RemindersProvider";
import {SyncProvider} from "@/provider/SyncProvider";
import {AccountPrompt} from "@/widgets/AccountPrompt";

// Expo Router requires route files to default-export their component.
export default function RootLayout() {
    const background = String(useCSSVariable("--color-background"));
    const [isFontsLoaded] = useFonts({Inter_400Regular, Inter_500Medium, Inter_600SemiBold, InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic});

    // Navigators paint their containers from the navigation theme, light by default; that showed as a white
    // flash between screens. The app is dark only, so the theme takes the page colour.
    const theme = useMemo(() => ({...DarkTheme, colors: {...DarkTheme.colors, background, card: background}}), [background]);

    if (!isFontsLoaded) return null;

    return (
        <ThemeProvider value={theme}>
            <QueryProvider>
                <SyncProvider>
                    <StatusBar style="light"/>
                    <AccountPrompt/>
                    <RemindersProvider>
                        <Stack screenOptions={{headerShown: false, contentStyle: {backgroundColor: background}}}/>
                    </RemindersProvider>
                </SyncProvider>
            </QueryProvider>
        </ThemeProvider>
    );
}
