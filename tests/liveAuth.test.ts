import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { liveErrorMessage } from "../src/lib/livePolicy";

type State = { user: { id: string } | null; ready: boolean; error: string };
type AuthModule = {
  signInLive: (email: string, password: string) => Promise<void>;
  createLiveAccount: (email: string, password: string, confirmation: string) => Promise<boolean>;
  sendSignInCode: (email: string) => Promise<void>;
  verifySignInCode: (email: string, code: string) => Promise<void>;
  deleteLiveAccount: () => Promise<void>;
};

function loadAuth(client: Record<string, unknown>) {
  let state: State = { user: null, ready: false, error: "" };
  const exports = {} as AuthModule;
  const source = readFileSync(new URL("../src/lib/liveAuth.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports,
    require: (name: string) => {
      if (name === "react-native") return { AppState: {}, Platform: { OS: "web" } };
      if (name === "zustand") return { create: (initialize: () => State) => {
        state = initialize();
        return { setState: (patch: Partial<State>) => { state = { ...state, ...patch }; }, getState: () => state };
      } };
      if (name === "./liveClient") return { liveConfigured: true, getLiveClient: () => client };
      if (name === "./livePolicy") return { liveErrorMessage };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return { auth: exports, state: () => state };
}

test("password sign-in normalizes email, preserves password and requires a real session", async () => {
  let credentials: { email: string; password: string } | undefined;
  const { auth, state } = loadAuth({ auth: { signInWithPassword: async (input: typeof credentials) => {
    credentials = input;
    return { data: { session: { access_token: "test-session" }, user: { id: "member" } }, error: null };
  } } });
  await auth.signInLive("  Member@Example.com  ", " A Password ");
  assert.equal(credentials?.email, "member@example.com");
  assert.equal(credentials?.password, " A Password ");
  assert.equal(state().user?.id, "member");
  assert.equal(state().ready, true);
  const incomplete = loadAuth({ auth: { signInWithPassword: async () => ({ data: { session: null, user: { id: "member" } }, error: null }) } });
  await assert.rejects(incomplete.auth.signInLive("member@example.com", "password"), /complete sign-in/);
  assert.equal(incomplete.state().user, null);
});

test("invalid credentials and unconfirmed email do not grant account access", async () => {
  for (const [code, message] of [["invalid_credentials", /incorrect/], ["email_not_confirmed", /Confirm your email/]] as const) {
    const { auth, state } = loadAuth({ auth: { signInWithPassword: async () => ({ data: { user: null, session: null }, error: { code, message: "server detail" } }) } });
    await assert.rejects(auth.signInLive("member@example.com", "password"), message);
    assert.equal(state().user, null);
  }
});

test("account creation validates email, password length and confirmation before contacting auth", async () => {
  let calls = 0;
  const { auth } = loadAuth({ auth: { signUp: async () => { calls++; return {}; } } });
  await assert.rejects(auth.createLiveAccount("not an email", "password", "password"), /valid email/);
  await assert.rejects(auth.createLiveAccount(`${"x".repeat(250)}@example.com`, "password", "password"), /valid email/);
  await assert.rejects(auth.createLiveAccount("member@example.com", "short", "short"), /at least 8/);
  await assert.rejects(auth.createLiveAccount("member@example.com", "password", "different"), /don’t match/);
  await assert.rejects(auth.signInLive("member@example.com", ""), /Enter your password/);
  assert.equal(calls, 0);
});

test("signup without a session requires confirmation and never signs an unconfirmed user in", async () => {
  let credentials: { email: string; password: string } | undefined;
  const { auth, state } = loadAuth({ auth: { signUp: async (input: typeof credentials) => {
    credentials = input;
    return { data: { user: { id: "unconfirmed" }, session: null }, error: null };
  } } });
  assert.equal(await auth.createLiveAccount(" Member@Example.com ", "password", "password"), true);
  assert.equal(credentials?.email, "member@example.com");
  assert.equal(state().user, null);
});

test("signup surfaces password requirements and email service restrictions", async () => {
  for (const [code, detail, message] of [
    ["weak_password", "Password should contain at least one symbol.", /at least one symbol/],
    ["email_address_not_authorized", "internal email restriction", /email delivery is unavailable/],
    ["over_email_send_rate_limit", "internal quota", /Too many attempts/],
  ] as const) {
    const { auth, state } = loadAuth({ auth: { signUp: async () => ({ data: { user: null, session: null }, error: { code, message: detail } }) } });
    await assert.rejects(auth.createLiveAccount("member@example.com", "password", "password"), message);
    assert.equal(state().user, null);
  }
});

test("email codes sign existing accounts in only after successful token verification", async () => {
  let options: { email: string; options: { shouldCreateUser: boolean } } | undefined;
  const verifications: { email: string; token: string; type: string }[] = [];
  const { auth, state } = loadAuth({ auth: {
    signInWithOtp: async (input: typeof options) => { options = input; return { error: null }; },
    verifyOtp: async (input: typeof verifications[number]) => {
      verifications.push(input);
      return { data: { user: { id: "member" }, session: { access_token: "test-session" } }, error: null };
    },
  } });
  await auth.sendSignInCode(" Member@Example.com ");
  assert.equal(options?.email, "member@example.com");
  assert.equal(options?.options.shouldCreateUser, false);
  assert.equal(state().user, null);
  await assert.rejects(auth.verifySignInCode("member@example.com", "letters"), /code from your email/);
  assert.equal(verifications.length, 0);
  await auth.verifySignInCode(" Member@Example.com ", " 123456 ");
  assert.equal(verifications[0]?.email, "member@example.com");
  assert.equal(verifications[0]?.token, "123456");
  assert.equal(verifications[0]?.type, "email");
  assert.equal(state().user?.id, "member");
});

test("account deletion invokes the authenticated deletion RPC then clears the session", async () => {
  const calls: string[] = [];
  const { auth, state } = loadAuth({
    rpc: async (name: string) => { calls.push(name); return { error: null }; },
    auth: {
      signInWithPassword: async () => ({ data: { user: { id: "member" }, session: { access_token: "test-session" } }, error: null }),
      signOut: async ({ scope }: { scope: string }) => { calls.push(`signout:${scope}`); return { error: null }; },
    },
  });
  await auth.signInLive("member@example.com", "password");
  await auth.deleteLiveAccount();
  assert.deepEqual(calls, ["pilot_delete_account", "signout:local"]);
  assert.equal(state().user, null);
  const failed = loadAuth({ rpc: async () => ({ error: { message: "Failed to fetch" } }), auth: { signOut: async () => { assert.fail("must not sign out after failed deletion"); } } });
  await assert.rejects(failed.auth.deleteLiveAccount(), /connection/);
});
