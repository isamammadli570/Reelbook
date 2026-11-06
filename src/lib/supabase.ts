import "react-native-url-polyfill/auto";
import {Platform} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {createClient, type SupabaseClient} from "@supabase/supabase-js";
import {ENV, hasSupabase} from "@/lib/env";

/** The Supabase client, or `null` when the project keys are not configured. The session is kept on the device so the user stays signed in. */
export const supabase: SupabaseClient | null = hasSupabase
    ? createClient(ENV.supabaseUrl, ENV.supabaseKey, {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            // On the web, coming back from Google lands on the site with the session in the address; read it there.
            // The phone app reads it from the returned link itself (see `signInWithGoogle`).
            detectSessionInUrl: Platform.OS === "web",
        },
    })
    : null;
