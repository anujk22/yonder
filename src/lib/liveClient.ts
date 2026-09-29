import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { validLiveConfiguration } from "./livePolicy";

const projectUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const liveConfigured = validLiveConfiguration(projectUrl, publishableKey);
let client: SupabaseClient | undefined;

export function getLiveClient() {
  if (!liveConfigured) throw new Error("Shared checks aren’t connected in this build yet.");
  // Created on demand so server-rendered pages do not access device storage.
  client ??= createClient(projectUrl!, publishableKey!, {
    auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
  return client;
}
