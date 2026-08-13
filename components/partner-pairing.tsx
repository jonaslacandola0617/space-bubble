"use client";

import { useEffect, useState } from "react";
import { ensureSpaceSession, getSupabaseBrowserClient, type SpaceSession } from "@/lib/supabase/client";

type PartnerMode = "invite" | "join";

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong while pairing your space.";
}

export function PartnerPairing() {
  const [session, setSession] = useState<SpaceSession | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PartnerMode>("invite");
  const [name, setName] = useState("");
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
    if (!code.trim() || !name.trim() || busy) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      setBusy(true);
      setError(null);
      const { error: joinError } = await supabase.rpc("join_shared_space", {
        code: code.trim().toLowerCase(),
        member_name: name.trim(),
      });

      if (joinError) throw joinError;
      window.location.reload();
    } catch (nextError) {
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
                <p className="pairing-copy">Send this private code to your partner. It fills the one remaining spot in your Space Bubble.</p>
                <button className="invite-code" type="button" onClick={copyInvite}>
                  <span>{session.inviteCode?.toUpperCase()}</span>
                  <small>{copied ? "Copied" : "Tap to copy"}</small>
                </button>
                <p className="pairing-footnote">Once your partner joins, this space is full. A third person or device cannot join with this code.</p>
              </>
            ) : (
              <>
                <p className="pairing-copy">If your partner created the space first, enter their invite code here. This device will move into that shared Space Bubble.</p>
                <label className="field-label" htmlFor="partner-code">Partner invite code</label>
                <input className="pairing-input code-input" id="partner-code" autoFocus value={code} onChange={(event) => setCode(event.target.value)} placeholder="Paste invite code" autoCapitalize="characters" />
                <label className="field-label pairing-name-label" htmlFor="partner-name">Your name</label>
                <input className="pairing-input" id="partner-name" maxLength={40} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
                {error ? <p className="pairing-error">{error}</p> : null}
                <div className="pairing-actions">
                  <button className="primary-action full-width" type="button" onClick={joinPartner} disabled={!code.trim() || !name.trim() || busy}>{busy ? "Joining…" : "Join our space"}</button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
