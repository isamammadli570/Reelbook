import "react-native-url-polyfill/auto";
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
            detectSessionInUrl: false,
        },
    })
    : null;
