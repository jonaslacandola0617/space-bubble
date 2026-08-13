"use client";

import { useEffect, useState } from "react";
import {
  needLabels,
  statusLabels,
  type Bubble,
  type BubbleNeed,
  type BubbleStatus,
} from "@/lib/bubbles";
import {
  ensureSpaceSession,
  insertBubble,
  loadSpaceState,
  popBubble,
  subscribeToSpace,
  updateBubbleStatus,
  upsertCheckin,
  type BubbleRow,
  type CheckinRow,
} from "@/lib/supabase/client";

const energyLabels = ["Need rest", "Low", "Okay", "Open", "Ready"];
const readinessValues = ["need_rest", "low", "okay", "open", "ready"];
const needs = Object.keys(needLabels) as BubbleNeed[];

function getNextStatus(status: BubbleStatus): BubbleStatus {
  if (status === "processing") return "shared";
  if (status === "shared") return "heard";
  if (status === "heard") return "talking";
  if (status === "talking") return "settled";
  return "settled";
}

function getActionLabel(status: BubbleStatus) {
  if (status === "processing") return "Share when ready";
  if (status === "shared") return "I hear you";
  if (status === "heard") return "Start talking";
  if (status === "talking") return "Ready to settle";
  return "Ready to pop";
}

function formatTime(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function toBubble(row: BubbleRow, userId: string): Bubble {
  return {
    id: row.id,
    author: row.author_id === userId ? "you" : "partner",
    text: row.body,
    status: row.status as BubbleStatus,
    need: row.need as BubbleNeed,
    x: Number(row.pos_x),
    y: Number(row.pos_y),
    size: row.size as Bubble["size"],
    tone: row.tone as Bubble["tone"],
    time: formatTime(row.created_at),
  };
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong while syncing our space.";
}

export function SpaceBubbleApp() {
  const [energy, setEnergy] = useState(2);
  const [draftEnergy, setDraftEnergy] = useState(2);
  const [partnerEnergy, setPartnerEnergy] = useState<number | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftNeed, setDraftNeed] = useState<BubbleNeed>("listen");
  const [poppingId, setPoppingId] = useState<string | null>(null);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<"connecting" | "live" | "error">("connecting");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedBubble = bubbles.find((bubble) => bubble.id === selectedId) ?? null;

  useEffect(() => {
    let disposed = false;
    let unsubscribe = () => {};

    async function boot() {
      try {
        setSyncState("connecting");
        const session = await ensureSpaceSession();
        if (disposed) return;

        setSpaceId(session.spaceId);
        setUserId(session.userId);

        const refresh = async () => {
          const state = await loadSpaceState(session.spaceId);
          if (disposed) return;

          setBubbles(state.bubbles.map((row) => toBubble(row, session.userId)));

          const mine = state.checkins.find((row: CheckinRow) => row.user_id === session.userId);
          const partner = state.checkins.find((row: CheckinRow) => row.user_id !== session.userId);

          if (mine) {
            setEnergy(mine.energy);
            setDraftEnergy(mine.energy);
          }
          setPartnerEnergy(partner?.energy ?? null);
          setSyncError(null);
          setSyncState("live");
        };

        await refresh();
        if (disposed) return;

        unsubscribe = subscribeToSpace(session.spaceId, () => {
          void refresh().catch((error) => {
            if (!disposed) {
              setSyncError(messageFrom(error));
              setSyncState("error");
            }
          });
        });
      } catch (error) {
        if (!disposed) {
          setSyncError(messageFrom(error));
          setSyncState("error");
        }
      }
    }

    void boot();
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  function openCheckin() {
    setDraftEnergy(energy);
    setCheckinOpen(true);
  }

  async function createBubble() {
    const text = draftText.trim();
    if (!text || !spaceId || !userId || busy) return;

    const positions = [
      { x: 24, y: 50 },
      { x: 52, y: 54 },
      { x: 65, y: 42 },
      { x: 41, y: 58 },
    ];
    const tones: Bubble["tone"][] = ["blue", "violet", "pearl", "rose"];
    const position = positions[bubbles.length % positions.length];
    const size: Bubble["size"] = text.length > 90 ? "lg" : text.length > 45 ? "md" : "sm";
    const tone = tones[bubbles.length % tones.length];

    try {
      setBusy(true);
      const row = await insertBubble({
        spaceId,
        userId,
        body: text,
        need: draftNeed,
        posX: position.x,
        posY: position.y,
        size,
        tone,
      });

      const bubble = toBubble(row, userId);
      setBubbles((current) => current.some((item) => item.id === bubble.id) ? current : [...current, bubble]);
      setDraftText("");
      setDraftNeed("listen");
      setComposerOpen(false);
      setSelectedId(bubble.id);
      setSyncError(null);
      setSyncState("live");
    } catch (error) {
      setSyncError(messageFrom(error));
      setSyncState("error");
    } finally {
      setBusy(false);
    }
  }

  async function advanceSelectedBubble() {
    if (!selectedBubble || selectedBubble.status === "settled" || !spaceId || busy) return;
    const nextStatus = getNextStatus(selectedBubble.status);

    try {
      setBusy(true);
      const row = await updateBubbleStatus(spaceId, selectedBubble.id, nextStatus);
      if (!userId) return;
      const updated = toBubble(row, userId);
      setBubbles((current) => current.map((bubble) => bubble.id === updated.id ? updated : bubble));
      setSyncError(null);
      setSyncState("live");
    } catch (error) {
      setSyncError(messageFrom(error));
      setSyncState("error");
    } finally {
      setBusy(false);
    }
  }

  function popSelectedBubble() {
    if (!selectedBubble || selectedBubble.status !== "settled" || !spaceId || busy) return;
    const id = selectedBubble.id;
    setPoppingId(id);

    window.setTimeout(() => {
      void (async () => {
        try {
          setBusy(true);
          await popBubble(spaceId, id);
          setBubbles((current) => current.filter((bubble) => bubble.id !== id));
          setSelectedId(null);
          setSyncError(null);
          setSyncState("live");
        } catch (error) {
          setSyncError(messageFrom(error));
          setSyncState("error");
        } finally {
          setPoppingId(null);
          setBusy(false);
        }
      })();
    }, 500);
  }

  async function saveCheckin() {
    if (!spaceId || !userId || busy) return;

    try {
      setBusy(true);
      await upsertCheckin({
        spaceId,
        userId,
        energy: draftEnergy,
        readiness: readinessValues[draftEnergy - 1],
      });
      setEnergy(draftEnergy);
      setCheckinOpen(false);
      setSyncError(null);
      setSyncState("live");
    } catch (error) {
      setSyncError(messageFrom(error));
      setSyncState("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="space-shell">
      <div className="cosmos" aria-hidden="true">
        <div className="stars" /><div className="stars stars-b" />
        <div className="nebula nebula-one" /><div className="nebula nebula-two" />
        <div className="orbit orbit-one" /><div className="orbit orbit-two" />
      </div>

      <header className="topbar">
        <div className="brand"><span className="brand-orbit"><span /></span><span className="brand-copy"><strong>space bubble</strong><small>our quiet place</small></span></div>
        <div className="together-status"><div className="person"><span className="avatar">J</span><span className="person-copy"><small>you</small><strong>energy {energy}/5</strong></span></div><span className="connection-line"><i /></span><div className="person"><span className="avatar avatar-partner">P</span><span className="person-copy"><small>partner</small><strong>energy {partnerEnergy ?? "—"}/5</strong></span></div></div>
        <button className="quiet-button" type="button" onClick={openCheckin}>Check in</button>
      </header>

      {syncError ? <div className="sync-banner" role="status">{syncError}</div> : null}

      <section className="space-stage">
        <div className="stage-intro"><p className="eyebrow">shared orbit</p><h1>What's floating between us?</h1><p>Leave a thought here. It can stay unfinished until you both have room for it.</p></div>
        <div className="bubble-field">
          {bubbles.map((bubble) => (
            <button
              key={bubble.id}
              type="button"
              className={`thought-bubble bubble-${bubble.size} bubble-${bubble.tone}${selectedId === bubble.id ? " is-selected" : ""}${poppingId === bubble.id ? " is-popping" : ""}`}
              style={{ left: `${bubble.x}%`, top: `${bubble.y}%` }}
              onClick={() => setSelectedId(bubble.id)}
              aria-label={`Open bubble: ${bubble.text}`}
            >
              <span className="bubble-glint" />
              <span className="bubble-author">{bubble.author === "you" ? "J" : "P"}</span>
              <span className="bubble-title">{bubble.text}</span>
              <span className="bubble-meta">{statusLabels[bubble.status]}</span>
            </button>
          ))}
        </div>
      </section>

      {selectedBubble ? (
        <aside className="bubble-panel" aria-label="Bubble details">
          <div className="panel-topline">
            <div className="panel-author"><span className={`avatar${selectedBubble.author === "partner" ? " avatar-partner" : ""}`}>{selectedBubble.author === "you" ? "J" : "P"}</span><span><small>{selectedBubble.author === "you" ? "you" : "partner"}</small><strong>{selectedBubble.time}</strong></span></div>
            <button className="icon-button" type="button" onClick={() => setSelectedId(null)} aria-label="Close bubble">×</button>
          </div>
          <div className="panel-status-row"><span className="status-pill">{statusLabels[selectedBubble.status]}</span><span className="need-pill">{needLabels[selectedBubble.need]}</span></div>
          <div className="panel-copy"><h2>{selectedBubble.text}</h2><p>This bubble can move forward when there is enough room for the conversation. Nothing here has to be solved immediately.</p></div>
          <div className="soft-note"><span className="soft-note-mark">○</span><p><strong>Same side.</strong> The bubble is the thing between you, not either person.</p></div>
          <div className="panel-actions">
            {selectedBubble.status !== "settled" ? <button className="primary-action full-width" type="button" onClick={advanceSelectedBubble} disabled={busy}>{getActionLabel(selectedBubble.status)}</button> : <button className="pop-action full-width" type="button" onClick={popSelectedBubble} disabled={busy}>Pop this bubble</button>}
          </div>
        </aside>
      ) : null}

      <nav className="dock"><button className="dock-button" type="button" onClick={openCheckin}><span className="dock-symbol">≈</span><span>Check in</span></button><button className="new-bubble-button" type="button" onClick={() => setComposerOpen(true)} disabled={!spaceId || busy}><span>+</span>New bubble</button><div className="dock-status"><span className="pulse-dot" /><span>{syncState === "live" ? "live" : syncState === "error" ? "offline" : "syncing"}</span></div></nav>

      {composerOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setComposerOpen(false)}>
          <section className="composer-modal" role="dialog" aria-modal="true" aria-labelledby="new-bubble-title">
            <div className="modal-heading"><div><p className="eyebrow">new bubble</p><h2 id="new-bubble-title">What do you want them to know?</h2></div><button className="icon-button" type="button" onClick={() => setComposerOpen(false)} aria-label="Close composer">×</button></div>
            <label className="field-label" htmlFor="bubble-thought">Your thought</label>
            <textarea id="bubble-thought" autoFocus value={draftText} onChange={(event) => setDraftText(event.target.value)} placeholder="It doesn't need to be perfectly worded. You can start where you are." />
            <fieldset className="need-picker"><legend>What do you need from this?</legend><div className="need-grid">{needs.map((need) => <button key={need} className={`need-option${draftNeed === need ? " is-active" : ""}`} type="button" onClick={() => setDraftNeed(need)}>{needLabels[need]}</button>)}</div></fieldset>
            <div className="composer-footer"><p>You can keep things gentle and unfinished.</p><button className="primary-action" type="button" onClick={createBubble} disabled={!draftText.trim() || busy}>Share bubble</button></div>
          </section>
        </div>
      ) : null}

      {checkinOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCheckinOpen(false)}>
          <section className="checkin-modal" role="dialog" aria-modal="true" aria-labelledby="checkin-title">
            <div className="modal-heading"><div><p className="eyebrow">check in</p><h2 id="checkin-title">How much room do you have right now?</h2></div><button className="icon-button" type="button" onClick={() => setCheckinOpen(false)} aria-label="Close check in">×</button></div>
            <div className="energy-scale">{energyLabels.map((label, index) => { const value = index + 1; return <button key={value} type="button" className={`energy-button${draftEnergy === value ? " is-active" : ""}`} onClick={() => setDraftEnergy(value)}><span>{value}</span><small>{label}</small></button>; })}</div>
            <div className="soft-note checkin-note"><span className="soft-note-mark">≈</span><p><strong>{energyLabels[draftEnergy - 1]}.</strong> This is context, not a score. Your partner can know whether now is a good time to talk.</p></div>
            <button className="primary-action full-width" type="button" onClick={saveCheckin} disabled={busy}>Save check-in</button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
