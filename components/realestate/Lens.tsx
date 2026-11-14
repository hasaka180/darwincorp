"use client";

import { useEffect, useRef, useState } from "react";

// Wraps the demonstration. "The Thinking" reveals the design rationale notes
// (.re-note) that sit beside each demo section; the switch only floats on
// screen while the demonstration itself is in view.
export default function Lens({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"experience" | "thinking">("experience");
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "-30% 0px -30% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="re-lens" data-lens={mode} id="re-experience">
      {children}
      <div className={`re-lens__switch ${visible ? "is-visible" : ""}`} role="group" aria-label="View mode">
        <span className="re-lens__label">Concept demo</span>
        <button type="button" aria-pressed={mode === "experience"} onClick={() => setMode("experience")}>The Experience</button>
        <button type="button" aria-pressed={mode === "thinking"} onClick={() => setMode("thinking")}>The Thinking</button>
      </div>
    </div>
  );
}
