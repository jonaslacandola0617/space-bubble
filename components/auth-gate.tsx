"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type GateState = "checking" | "signed-out" | "ready";
type AuthMode = "signup" | "signin";
type AuthErrorLike = { message?: string; code?: string };

const usernamePattern = /^[a-z0-9_]{3,24}$/;
const internalAuthDomain = "spacebubble.example.com";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function usernameToEmail(username: string) {
  return `${normalizeUsername(username)}@${internalAuthDomain}`;
}

function displayMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const candidate = error as AuthErrorLike;
    const message = candidate.message?.trim();

    if (candidate.code === "email_address_invalid" || message?.includes("Email address")) {
      return "Space Bubble could not create that account because its internal username mapping was rejected. Please refresh and try again.";
    }

    if (message) return message;
  }

  return "Something went wrong while signing in.";
}

function accountName(user: User | null) {
  const metadataName = user?.user_metadata?.username;
  if (typeof metadataName === "string" && metadataName) return metadataName;
  return user?.email?.split("@")[0] ?? "account";
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [gateState, setGateState] = useState<GateState>("checking");
  const [mode, setMode] = useState<AuthMode>("signup");
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const browserClient = getSupabaseBrowserClient();
    if (!browserClient) {
      setError("Supabase is not configured.");
      setGateState("signed-out");
      return;
    }

    const supabase = browserClient;
    let active = true;

    async function inspectSession() {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;

      if (sessionError) {
        setError(sessionError.message);
        setGateState("signed-out");
        return;
      }

      if (data.session?.user?.is_anonymous) {
        await supabase.auth.signOut({ scope: "local" });
        if (!active) return;
        setUser(null);
        setGateState("signed-out");
        return;
      }

      setUser(data.session?.user ?? null);
      setGateState(data.session ? "ready" : "signed-out");
    }

    void inspectSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active || session?.user?.is_anonymous) return;
      setUser(session?.user ?? null);
      setGateState(session ? "ready" : "signed-out");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  function validateUsername() {
    const normalized = normalizeUsername(username);
    if (!usernamePattern.test(normalized)) {
      throw new Error("Username must be 3–24 characters using only letters, numbers, or underscores.");
    }
    return normalized;
  }

  async function createAccount() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || busy) return;

    try {
      setBusy(true);
      setError(null);
      const normalized = validateUsername();

      if (password.length < 6) throw new Error("Password must be at least 6 characters.");
      if (password !== confirmPassword) throw new Error("Passwords do not match.");

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: usernameToEmail(normalized),
        password,
        options: {
          data: { username: normalized },
        },
      });

      if (signUpError) throw signUpError;
      if (data.user?.identities?.length === 0) throw new Error("That username is already taken.");
      if (!data.session) {
        throw new Error("Account created, but Confirm email is still enabled in Supabase. Turn it off in Authentication → Providers → Email, then use Sign in with this username and password.");
      }

      window.location.reload();
    } catch (nextError) {
      setError(displayMessage(nextError));
      setBusy(false);
    }
  }

  async function signIn() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || busy) return;

    try {
      setBusy(true);
      setError(null);
      const normalized = validateUsername();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(normalized),
        password,
      });

      if (signInError) throw new Error("Wrong username or password.");
      window.location.reload();
    } catch (nextError) {
      setError(displayMessage(nextError));
      setBusy(false);
    }
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || busy) return;
    setBusy(true);
    await supabase.auth.signOut({ scope: "local" });
    window.location.reload();
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  if (gateState === "checking") {
    return (
      <main className="identity-shell">
        <div className="pairing-loader"><span className="pulse-dot" />Preparing your orbit…</div>
      </main>
    );
  }

  if (gateState === "signed-out") {
    const canSubmit = username.trim() && password && (mode === "signin" || confirmPassword);

    return (
      <main className="identity-shell">
        <section className="pairing-modal auth-card">
          <div className="pairing-mark"><span className="brand-orbit"><span /></span></div>
          <p className="eyebrow">Space Bubble</p>
          <h1>{mode === "signup" ? "Create your little corner." : "Welcome back."}</h1>
          <p className="pairing-copy">
            {mode === "signup"
              ? "Choose a username and password. Use the same account on your phone, laptop, or any other device."
              : "Sign in with the same username and password you already use on Space Bubble."}
          </p>

          <div className="pairing-tabs auth-tabs" role="tablist" aria-label="Account access">
            <button className={mode === "signup" ? "is-active" : ""} type="button" onClick={() => switchMode("signup")}>Create account</button>
            <button className={mode === "signin" ? "is-active" : ""} type="button" onClick={() => switchMode("signin")}>Sign in</button>
          </div>

          <form onSubmit={(event) => { event.preventDefault(); void (mode === "signup" ? createAccount() : signIn()); }}>
            <label className="field-label" htmlFor="account-username">Username</label>
            <input className="pairing-input" id="account-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="e.g. jonas" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={24} />

            <label className="field-label auth-field-gap" htmlFor="account-password">Password</label>
            <div className="password-control">
              <input className="pairing-input password-input" id="account-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={mode === "signup" ? "new-password" : "current-password"} />
              <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {mode === "signup" ? (
              <>
                <label className="field-label auth-field-gap" htmlFor="account-password-confirm">Confirm password</label>
                <div className="password-control">
                  <input className="pairing-input password-input" id="account-password-confirm" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Type it again" autoComplete="new-password" />
                  <button className="password-toggle" type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showConfirmPassword}>
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </>
            ) : null}

            {error ? <p className="pairing-error" role="alert">{error}</p> : null}

            <button className="primary-action full-width auth-submit" type="submit" disabled={!canSubmit || busy}>
              {busy ? "One moment…" : mode === "signup" ? "Create my account" : "Sign in"}
            </button>
          </form>

          <p className="auth-footnote">Your username is case-insensitive. Your password stays private and is handled by Supabase Auth.</p>
        </section>
      </main>
    );
  }

  return (
    <>
      {children}
      <button className="account-chip" type="button" onClick={() => void signOut()} disabled={busy} title="Sign out">
        <span>@{accountName(user)}</span>
        <strong>Sign out</strong>
      </button>
    </>
  );
}
