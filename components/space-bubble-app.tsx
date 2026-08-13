"use client";

import { useState } from "react";

export function SpaceBubbleApp() {
  const [energy, setEnergy] = useState(2);

  function cycleEnergy() {
    setEnergy((current) => (current >= 5 ? 1 : current + 1));
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
        <button className="quiet-button" type="button" onClick={cycleEnergy}>Check in</button>
      </header>

      <section className="space-stage">
        <div className="stage-intro"><p className="eyebrow">shared orbit</p><h1>What's floating between us?</h1><p>Leave a thought here. It can stay unfinished until you both have room for it.</p></div>
        <div className="bubble-field">
          <button type="button" className="thought-bubble bubble-lg bubble-rose" style={{ left: "18%", top: "31%" }}><span className="bubble-glint" /><span className="bubble-author">P</span><span className="bubble-title">Can we make a little time for us this week?</span><span className="bubble-meta">Heard</span></button>
          <button type="button" className="thought-bubble bubble-md bubble-blue" style={{ left: "62%", top: "22%" }}><span className="bubble-glint" /><span className="bubble-author">J</span><span className="bubble-title">I'm still sorting through a thought.</span><span className="bubble-meta">Processing</span></button>
          <button type="button" className="thought-bubble bubble-lg bubble-violet" style={{ left: "73%", top: "61%" }}><span className="bubble-glint" /><span className="bubble-author">P</span><span className="bubble-title">A quiet moment together this weekend?</span><span className="bubble-meta">Shared</span></button>
          <button type="button" className="thought-bubble bubble-sm bubble-pearl" style={{ left: "37%", top: "70%" }}><span className="bubble-glint" /><span className="bubble-author">J</span><span className="bubble-title">Thank you for today.</span><span className="bubble-meta">Ready to pop</span></button>
        </div>
      </section>

      <nav className="dock"><button className="dock-button" type="button" onClick={cycleEnergy}><span className="dock-symbol">≈</span><span>Check in</span></button><button className="new-bubble-button" type="button"><span>+</span>New bubble</button><div className="dock-status"><span className="pulse-dot" /><span>just us</span></div></nav>
    </main>
  );
}
