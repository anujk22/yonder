import { AppState, Platform } from "react-native";
import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { getLiveClient, liveConfigured } from "./liveClient";
import { liveErrorMessage } from "./livePolicy";

export const useLiveAuth = create<{ user: User | null; ready: boolean; error: string }>(() => ({
  user: null, ready: !liveConfigured, error: "",
}));

export function observeLiveAuth() {
  if (!liveConfigured) return () => {};
  const client = getLiveClient();
  let disposed = false;
  let authEventReceived = false;
  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
    if (disposed) return;
    authEventReceived = true;
    useLiveAuth.setState({ user: session?.user ?? null, ready: true, error: "" });
  });
  void client.auth.getSession().then(({ data, error }) => {
    if (disposed || authEventReceived) return;
    useLiveAuth.setState({ user: data.session?.user ?? null, ready: true, error: error ? "Couldn’t restore your sign-in. Please sign in again." : "" });
  }).catch(() => {
    if (!disposed && !authEventReceived) useLiveAuth.setState({ ready: true, error: "Couldn’t restore your sign-in. Please try again." });
  });
  const updateRefresh = (state: string) => {
    if (state === "active") client.auth.startAutoRefresh();
    else client.auth.stopAutoRefresh();
  };
  if (Platform.OS !== "web") updateRefresh(AppState.currentState);
  const listener = Platform.OS !== "web" ? AppState.addEventListener("change", updateRefresh) : undefined;
  return () => {
    disposed = true;
    subscription.unsubscribe();
    listener?.remove();
    if (Platform.OS !== "web") client.auth.stopAutoRefresh();
  };
}

export async function sendSignInCode(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) throw new Error("Enter a valid email address.");
  const { error } = await getLiveClient().auth.signInWithOtp({ email: normalized, options: { shouldCreateUser: false } });
  if (error) throw new Error("Couldn’t send a code. Use your invited email and wait a minute before trying again.");
}

export async function verifySignInCode(email: string, code: string) {
  if (!/^\d{6,10}$/.test(code.trim())) throw new Error("Enter the code from your email.");
  const { data, error } = await getLiveClient().auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
  if (error || !data.user) throw new Error("That code is invalid or has expired. Request a new code and try again.");
  useLiveAuth.setState({ user: data.user, ready: true, error: "" });
}

export async function signOutLive() {
  const { error } = await getLiveClient().auth.signOut({ scope: "local" });
  if (error && useLiveAuth.getState().user) throw new Error("Couldn’t sign out. Check your connection and try again.");
  useLiveAuth.setState({ user: null, ready: true, error: "" });
}

export async function deleteLiveAccount() {
  const client = getLiveClient();
  const { error } = await client.rpc("pilot_delete_account");
  if (error) throw new Error(liveErrorMessage(error));
  await client.auth.signOut({ scope: "local" });
  useLiveAuth.setState({ user: null, ready: true, error: "" });
}
