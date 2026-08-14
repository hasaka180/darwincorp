"use client";

import { useEffect, useRef, useState } from "react";
import Spline from "@splinetool/react-spline";
import type { Application, SPEObject } from "@splinetool/runtime";
import Counter from "@/components/Counter";

const SCENE_URL =
  process.env.NEXT_PUBLIC_SPLINE_SCENE ||
  "https://prod.spline.design/ZxF4urNm-snNBqhQ/scene.splinecode";

// Preferred object names — the first match is driven directly by the cursor.
// "CompassJellyfish" is the actual group name in this scene.
const JELLYFISH_NAMES = [
  "CompassJellyfish",
  "Jellyfish",
  "jellyfish",
  "Jelly",
  "Group",
];

// A target plus its resting transform, so cursor motion is an offset (never
// accumulates frame to frame).
type Target = {
  obj: SPEObject;
  baseRX: number;
  baseRY: number;
  basePX: number;
  basePY: number;
};

export default function Hero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const splineRef = useRef<Application | null>(null);
  const targetRef = useRef<Target | null>(null);

  const mouse = useRef({ x: 0, y: 0 });
  const eased = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  const [loading, setLoading] = useState(true);

  function onLoad(app: Application) {
    splineRef.current = app;
    setLoading(false);

    // Pull the full object list (newer runtimes expose getAllObjects).
    const all: SPEObject[] =
      typeof app.getAllObjects === "function" ? app.getAllObjects() : [];

    if (process.env.NODE_ENV !== "production") {
      // Read these names in the browser console to fine-tune JELLYFISH_NAMES.
      console.log(
        "[Spline] objects:",
        all.map((o) => o.name)
      );
    }

    // Hide the scene's baked-in "Drag any balloon..." hint text.
    for (const o of all) {
      if (o.name && /balloon|drag|hint|text/i.test(o.name)) {
        o.visible = false;
      }
    }

    // 1) Try a named match. 2) Otherwise prefer anything "jelly". 3) Else the
    // first real mesh (skipping camera / lights / the hint text).
    let obj: SPEObject | undefined;
    for (const name of JELLYFISH_NAMES) {
      const found = app.findObjectByName(name);
      if (found) {
        obj = found;
        break;
      }
    }
    if (!obj) {
      obj =
        all.find((o) => o.name && /jelly/i.test(o.name)) ||
        all.find((o) => o.name && !/camera|light|balloon|drag|text/i.test(o.name));
    }

    if (obj) {
      targetRef.current = {
        obj,
        baseRX: obj.rotation.x,
        baseRY: obj.rotation.y,
        basePX: obj.position.x,
        basePY: obj.position.y,
      };
    }
  }

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      mouse.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1, // -1 .. 1
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    }
    window.addEventListener("pointermove", handleMove, { passive: true });

    const tick = () => {
      eased.current.x += (mouse.current.x - eased.current.x) * 0.08;
      eased.current.y += (mouse.current.y - eased.current.y) * 0.08;
      const { x, y } = eased.current;

      // Move the whole rendered scene toward the cursor. This is immune to the
      // scene's looping idle animation (which overrides per-object transforms),
      // so the jellyfish reliably follows the pointer. Scaled up so the canvas
      // edges never show while it pans/tilts.
      if (stageRef.current) {
        stageRef.current.style.transform =
          `scale(1.16) perspective(1400px) ` +
          `rotateX(${-y * 7}deg) rotateY(${x * 7}deg) ` +
          `translate3d(${-x * 26}px, ${-y * 26}px, 0)`;
      }

      // Also nudge the object directly — harmless if the idle animation wins.
      const t = targetRef.current;
      if (t) {
        t.obj.rotation.y = t.baseRY + x * 0.6;
        t.obj.rotation.x = t.baseRX + y * 0.35;
      }

      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <section className="hero">
      <div className="hero__frame">
      <div className="hero__stage" ref={stageRef}>
        <Spline scene={SCENE_URL} onLoad={onLoad} />
      </div>

      {loading && (
        <div className="hero__loader">
          <div className="ring" />
        </div>
      )}

      <div className="hero__heading">
        <span className="line-serif blur-in">THE MIRROR OF</span>
        <span className="line-display blur-in">IMAGINATION</span>
      </div>

      <div className="hero__pitch blur-in">
        <p className="hero__pitch-text">
          Creating brands, digital experiences, and stories designed to evolve
          with people, culture, and technology.
        </p>

        <div className="hero__stats">
          <div className="stat">
            <span className="stat__num">
              <Counter value={100} suffix="+" delay={700} />
            </span>
            <span className="stat__label">Projects</span>
          </div>
          <div className="stat">
            <span className="stat__num">
              <Counter value={8} suffix="+Y" delay={850} />
            </span>
            <span className="stat__label">Experience</span>
          </div>
          <div className="stat">
            <span className="stat__num">
              <Counter value={1000} suffix="+" duration={1900} delay={1000} />
            </span>
            <span className="stat__label">Deliverables</span>
          </div>
        </div>

        <a className="cta-btn" href="#get-started">
          <span className="cta-btn__fluid" aria-hidden="true" />
          <span className="cta-btn__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h13M12 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="cta-btn__text">Get Started</span>
        </a>
      </div>
      </div>
    </section>
  );
}
