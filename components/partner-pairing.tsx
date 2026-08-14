"use client";

import { useEffect, useState } from "react";
import { ensureSpaceSession, getSupabaseBrowserClient, type SpaceSession } from "@/lib/supabase/client";

type PartnerMode = "invite" | "join";

type ErrorLike = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function messageFrom(error: unknown) {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const candidate = error as ErrorLike;
    const rawMessage = candidate.message?.trim();

    if (rawMessage === "This Space Bubble already has two people") {
      return "This Space Bubble is already paired. If this is your own second device, do not use the partner invite—sign in with your existing username and password instead.";
    }

    if (rawMessage === "Invalid invite code") {
      return "That invite code is not valid. Ask your partner to copy the current code again and paste it here.";
    }

    if (rawMessage === "Authentication required") {
      return "Your sign-in session expired. Sign in again with your username and password, then retry pairing.";
    }

    const parts = [candidate.message, candidate.details, candidate.hint]
      .filter((part): part is string => Boolean(part?.trim()));

    if (parts.length) return parts.join(" · ");
    if (candidate.code) return `Pairing failed (${candidate.code}).`;
  }

  return "Something went wrong while pairing your space.";
}

export function PartnerPairing() {
  const [session, setSession] = useState<SpaceSession | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PartnerMode>("invite");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function refreshPairing() {
    const current = await ensureSpaceSession();
    setSession(current);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { count, error: countError } = await supabase
      .from("space_members")
      .select("id", { count: "exact", head: true })
      .eq("space_id", current.spaceId);

    if (countError) throw countError;
    setMemberCount(count ?? 1);
  }

  useEffect(() => {
    void refreshPairing().catch((nextError) => setError(messageFrom(nextError)));
  }, []);

  useEffect(() => {
    if (!session?.spaceId || memberCount >= 2) return;

    const refresh = () => void refreshPairing().catch(() => {});
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [session?.spaceId, memberCount]);

  async function copyInvite() {
    if (!session?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(session.inviteCode.toUpperCase());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function joinPartner() {
    if (!code.trim() || !session || busy) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      setBusy(true);
      setError(null);
      const { error: joinError } = await supabase.rpc("join_shared_space", {
        code: code.trim().toLowerCase(),
        member_name: session.displayName,
      });

      if (joinError) throw joinError;
      window.location.reload();
    } catch (nextError) {
      console.error("Space Bubble partner pairing failed", nextError);
      setError(messageFrom(nextError));
      setBusy(false);
    }
  }

  if (!session || memberCount >= 2) return null;

  return (
    <>
      <button className="invite-chip" type="button" onClick={() => setOpen(true)}>
        <span className="pulse-dot" />
        <span>Waiting for your person</span>
        <strong>Pair with partner</strong>
      </button>

      {open ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <section className="pairing-modal invite-modal" role="dialog" aria-modal="true" aria-labelledby="partner-pair-title">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">your shared orbit</p>
                <h2 id="partner-pair-title">{mode === "invite" ? "Invite your partner" : "Join your partner"}</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close pairing">×</button>
            </div>

            <div className="pairing-tabs" role="tablist" aria-label="Partner pairing">
              <button className={mode === "invite" ? "is-active" : ""} type="button" onClick={() => { setMode("invite"); setError(null); }}>Invite partner</button>
              <button className={mode === "join" ? "is-active" : ""} type="button" onClick={() => { setMode("join"); setError(null); }}>Join partner</button>
            </div>

            {mode === "invite" ? (
              <>
                <p className="pairing-copy">Send this private code to your partner. When they enter it, both accounts will share the same Space Bubble.</p>
                <button className="invite-code" type="button" onClick={copyInvite}>
                  <span>{session.inviteCode?.toUpperCase()}</span>
                  <small>{copied ? "Copied" : "Tap to copy"}</small>
                </button>
                <p className="pairing-footnote">Once your partner joins, this space is full. Your own extra devices simply sign in with your username and password.</p>
              </>
            ) : (
              <>
                <p className="pairing-copy">Paste the invite code your partner sent you. You are joining as <strong>@{session.displayName}</strong>.</p>
                <label className="field-label" htmlFor="partner-code">Partner invite code</label>
                <input className="pairing-input code-input" id="partner-code" autoFocus value={code} onChange={(event) => setCode(event.target.value)} placeholder="Paste invite code" autoCapitalize="characters" />
                {error ? <p className="pairing-error" role="alert">{error}</p> : null}
                <div className="pairing-actions">
                  <button className="primary-action full-width" type="button" onClick={joinPartner} disabled={!code.trim() || busy}>{busy ? "Connecting…" : "Connect with partner"}</button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
