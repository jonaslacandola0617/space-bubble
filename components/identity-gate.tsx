"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type GateState = "checking" | "new-device" | "ready";
type AccessMode = "claim" | "signin";

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong with your Space Bubble identity.";
}

export function IdentityGate({ children }: { children: ReactNode }) {
  const [gateState, setGateState] = useState<GateState>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [accessOpen, setAccessOpen] = useState(false);
  const [mode, setMode] = useState<AccessMode>("claim");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setGateState("new-device");
      return;
    }

    let active = true;

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
        setGateState("new-device");
        return;
      }
      setUser(data.session?.user ?? null);
      setGateState(data.session ? "ready" : "new-device");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setGateState(session ? "ready" : "new-device");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function startNewIdentity() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || busy) return;

    try {
      setBusy(true);
      setError(null);
      const { error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) throw signInError;
      window.location.reload();
    } catch (nextError) {
      setError(messageFrom(nextError));
      setBusy(false);
    }
  }

  async function sendExistingSignIn() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !email.trim() || busy) return;

    try {
      setBusy(true);
      setError(null);
      setMessage(null);
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: window.location.origin,
        },
      });
      if (signInError) throw signInError;
      setMessage("Check your email and open the Space Bubble sign-in link on this device.");
    } catch (nextError) {
      setError(messageFrom(nextError));
    } finally {
      setBusy(false);
    }
  }

  async function claimCurrentIdentity() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !email.trim() || busy) return;

    try {
      setBusy(true);
      setError(null);
      setMessage(null);
      const { error: updateError } = await supabase.auth.updateUser({ email: email.trim() });
      if (updateError) throw updateError;
      setMessage("Verification sent. Open the email on this device to finish protecting this identity.");
    } catch (nextError) {
      const text = messageFrom(nextError);
      setError(text.includes("link") ? `${text} Enable Manual Linking in Supabase Auth → Providers.` : text);
    } finally {
      setBusy(false);
    }
  }

  if (gateState === "checking") {
    return <div className="identity-shell"><div className="pairing-loader"><span className="pulse-dot" />Preparing your orbit…</div></div>;
  }

  if (gateState === "new-device") {
    return (
      <main className="identity-shell">
        <section className="pairing-modal identity-welcome">
          <div className="pairing-mark"><span className="brand-orbit"><span /></span></div>
          <p className="eyebrow">Space Bubble</p>
          <h1>Where should this device belong?</h1>
          <p className="pairing-copy">Use your existing identity on another phone or computer, or start a new Space Bubble if this is your first device.</p>

          <label className="field-label" htmlFor="existing-email">I already use Space Bubble</label>
          <input className="pairing-input" id="existing-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email" autoComplete="email" />
          <button className="primary-action full-width identity-signin-button" type="button" onClick={sendExistingSignIn} disabled={!email.trim() || busy}>{busy ? "Sending…" : "Send me a sign-in link"}</button>

          {message ? <p className="pairing-success">{message}</p> : null}
          {error ? <p className="pairing-error">{error}</p> : null}

          <div className="identity-divider"><span>or</span></div>
          <button className="secondary-action full-width" type="button" onClick={startNewIdentity} disabled={busy}>This is my first device</button>
        </section>
      </main>
    );
  }

  return (
    <>
      {children}

      {user?.is_anonymous ? (
        <button className="identity-chip" type="button" onClick={() => { setAccessOpen(true); setMode("claim"); setMessage(null); setError(null); }}>
          <span className="pulse-dot" />
          <span>Use on another device</span>
        </button>
      ) : null}

      {accessOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setAccessOpen(false)}>
          <section className="pairing-modal identity-modal" role="dialog" aria-modal="true" aria-labelledby="identity-title">
            <div className="modal-heading">
              <div><p className="eyebrow">your identity</p><h2 id="identity-title">Use Space Bubble anywhere</h2></div>
              <button className="icon-button" type="button" onClick={() => setAccessOpen(false)} aria-label="Close identity settings">×</button>
            </div>

            <div className="pairing-tabs" role="tablist" aria-label="Identity access">
              <button className={mode === "claim" ? "is-active" : ""} type="button" onClick={() => { setMode("claim"); setMessage(null); setError(null); }}>Keep this identity</button>
              <button className={mode === "signin" ? "is-active" : ""} type="button" onClick={() => { setMode("signin"); setMessage(null); setError(null); }}>I already claimed mine</button>
            </div>

            {mode === "claim" ? (
              <>
                <p className="pairing-copy">Attach an email to this exact identity. Your partner connection, bubbles, and check-ins stay under the same user ID.</p>
                <label className="field-label" htmlFor="claim-email">Email</label>
                <input className="pairing-input" id="claim-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
                <button className="primary-action full-width identity-signin-button" type="button" onClick={claimCurrentIdentity} disabled={!email.trim() || busy}>{busy ? "Sending…" : "Protect this identity"}</button>
              </>
            ) : (
              <>
                <p className="pairing-copy">Use this when this browser accidentally created a temporary identity but you already protected your real Space Bubble identity elsewhere.</p>
                <label className="field-label" htmlFor="switch-email">Email</label>
                <input className="pairing-input" id="switch-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
                <button className="primary-action full-width identity-signin-button" type="button" onClick={sendExistingSignIn} disabled={!email.trim() || busy}>{busy ? "Sending…" : "Send sign-in link"}</button>
              </>
            )}

            {message ? <p className="pairing-success">{message}</p> : null}
            {error ? <p className="pairing-error">{error}</p> : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
