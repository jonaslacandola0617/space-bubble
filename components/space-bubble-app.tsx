"use client";

import { useState } from "react";
import {
  needLabels,
  seedBubbles,
  statusLabels,
  type Bubble,
  type BubbleNeed,
  type BubbleStatus,
} from "@/lib/bubbles";

const energyLabels = ["Need rest", "Low", "Okay", "Open", "Ready"];
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

export function SpaceBubbleApp() {
  const [energy, setEnergy] = useState(2);
  const [bubbles, setBubbles] = useState<Bubble[]>(seedBubbles);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftNeed, setDraftNeed] = useState<BubbleNeed>("listen");
  const [poppingId, setPoppingId] = useState<number | null>(null);

  const selectedBubble = bubbles.find((bubble) => bubble.id === selectedId) ?? null;

  function createBubble() {
    const text = draftText.trim();
    if (!text) return;

    const positions = [
      { x: 24, y: 50 },
      { x: 52, y: 54 },
      { x: 65, y: 42 },
      { x: 41, y: 58 },
    ];
    const tones: Bubble["tone"][] = ["blue", "violet", "pearl", "rose"];
    const position = positions[bubbles.length % positions.length];

    const bubble: Bubble = {
      id: Date.now(),
      author: "you",
      text,
      status: "shared",
      need: draftNeed,
      x: position.x,
      y: position.y,
      size: text.length > 90 ? "lg" : text.length > 45 ? "md" : "sm",
      tone: tones[bubbles.length % tones.length],
      time: "Just now",
    };

    setBubbles((current) => [...current, bubble]);
    setDraftText("");
    setDraftNeed("listen");
    setComposerOpen(false);
    setSelectedId(bubble.id);
  }

  function advanceSelectedBubble() {
    if (!selectedBubble || selectedBubble.status === "settled") return;
    const nextStatus = getNextStatus(selectedBubble.status);
    setBubbles((current) =>
      current.map((bubble) =>
        bubble.id === selectedBubble.id ? { ...bubble, status: nextStatus } : bubble,
      ),
    );
  }

  function popSelectedBubble() {
    if (!selectedBubble || selectedBubble.status !== "settled") return;
    const id = selectedBubble.id;
    setPoppingId(id);
    window.setTimeout(() => {
      setBubbles((current) => current.filter((bubble) => bubble.id !== id));
      setSelectedId(null);
      setPoppingId(null);
    }, 500);
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
        <div className="together-status"><div className="person"><span className="avatar">J</span><span className="person-copy"><small>you</small><strong>energy {energy}/5</strong></span></div><span className="connection-line"><i /></span><div className="person"><span className="avatar avatar-partner">P</span><span className="person-copy"><small>partner</small><strong>energy 3/5</strong></span></div></div>
        <button className="quiet-button" type="button" onClick={() => setCheckinOpen(true)}>Check in</button>
      </header>

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
            {selectedBubble.status !== "settled" ? <button className="primary-action full-width" type="button" onClick={advanceSelectedBubble}>{getActionLabel(selectedBubble.status)}</button> : <button className="pop-action full-width" type="button" onClick={popSelectedBubble}>Pop this bubble</button>}
          </div>
        </aside>
      ) : null}

      <nav className="dock"><button className="dock-button" type="button" onClick={() => setCheckinOpen(true)}><span className="dock-symbol">≈</span><span>Check in</span></button><button className="new-bubble-button" type="button" onClick={() => setComposerOpen(true)}><span>+</span>New bubble</button><div className="dock-status"><span className="pulse-dot" /><span>just us</span></div></nav>

      {composerOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setComposerOpen(false)}>
          <section className="composer-modal" role="dialog" aria-modal="true" aria-labelledby="new-bubble-title">
            <div className="modal-heading"><div><p className="eyebrow">new bubble</p><h2 id="new-bubble-title">What do you want them to know?</h2></div><button className="icon-button" type="button" onClick={() => setComposerOpen(false)} aria-label="Close composer">×</button></div>
            <label className="field-label" htmlFor="bubble-thought">Your thought</label>
            <textarea id="bubble-thought" autoFocus value={draftText} onChange={(event) => setDraftText(event.target.value)} placeholder="It doesn't need to be perfectly worded. You can start where you are." />
            <fieldset className="need-picker"><legend>What do you need from this?</legend><div className="need-grid">{needs.map((need) => <button key={need} className={`need-option${draftNeed === need ? " is-active" : ""}`} type="button" onClick={() => setDraftNeed(need)}>{needLabels[need]}</button>)}</div></fieldset>
            <div className="composer-footer"><p>You can keep things gentle and unfinished.</p><button className="primary-action" type="button" onClick={createBubble} disabled={!draftText.trim()}>Share bubble</button></div>
          </section>
        </div>
      ) : null}

      {checkinOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCheckinOpen(false)}>
          <section className="checkin-modal" role="dialog" aria-modal="true" aria-labelledby="checkin-title">
            <div className="modal-heading"><div><p className="eyebrow">check in</p><h2 id="checkin-title">How much room do you have right now?</h2></div><button className="icon-button" type="button" onClick={() => setCheckinOpen(false)} aria-label="Close check in">×</button></div>
            <div className="energy-scale">{energyLabels.map((label, index) => { const value = index + 1; return <button key={value} type="button" className={`energy-button${energy === value ? " is-active" : ""}`} onClick={() => setEnergy(value)}><span>{value}</span><small>{label}</small></button>; })}</div>
            <div className="soft-note checkin-note"><span className="soft-note-mark">≈</span><p><strong>{energyLabels[energy - 1]}.</strong> This is context, not a score. Your partner can know whether now is a good time to talk.</p></div>
            <button className="primary-action full-width" type="button" onClick={() => setCheckinOpen(false)}>Save check-in</button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
