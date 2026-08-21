"use client";

import { useEffect, useState } from "react";
import { onHeroReady } from "@/lib/heroLoad";

/** Where the bar pauses to wait for the hero's 3D scene. */
const HOLD = 92;
/** How long the final run from HOLD to 100 takes once the scene is in. */
const RELEASE_MS = 500;
/**
 * Longest the preloader will ever wait on the scene. The scene is ~10 MB, so
 * on a slow connection this fires first and the hero reveals with its own
 * loading ring rather than holding the whole page hostage.
 */
const CAP_MS = 9000;

// The DARWIN wordmark paths (from darwin.svg), drawn in order D-A-R-I-N-swirl.
const PATHS = [
  "M0 0.586914H10.8458C18.8523 0.586914 23.6328 4.02026 23.6328 17.2494V20.282C23.6328 33.4144 17.5122 37.0481 10.8458 37.0481H0V0.586914ZM9.69904 31.0242C14.0788 31.0242 16.3654 29.5321 16.3654 19.2873V18.2925C16.3654 8.59346 14.0788 6.55555 9.69904 6.55555H7.26046V31.0311H9.69904V31.0242Z",
  "M33.6228 0.586914H41.2839L50.1402 37.0481H42.6794L40.7382 26.9001H34.1754L32.2342 37.0481H24.7734L33.6228 0.586914ZM39.5431 20.9314L37.5052 10.286H37.4084L35.3705 20.9314H39.55H39.5431Z",
  "M61.9688 21.4772H59.9792V37.0481H52.7188V0.586914H64.7597C71.5227 0.586914 74.9077 4.26896 74.9077 10.887C74.9077 15.2667 72.8698 18.7968 68.7871 20.0403V20.289C71.7714 20.4409 73.3603 22.4788 73.3603 25.5115V37.055H66.0998V25.9605C66.0998 22.6792 64.6077 21.4841 61.9688 21.4841V21.4772ZM63.8616 15.4049C66.1965 15.4049 67.889 13.9127 67.889 10.8801C67.889 7.84738 66.1965 6.60391 63.8616 6.60391H59.9792V15.4118H63.8616V15.4049Z",
  "M117.531 0.586914H124.792V37.0481H117.531V0.586914Z",
  "M135.592 17.7951H135.44V37.0481H128.18V0.586914H135.44L144.593 22.7206H144.745V0.586914H152.006V37.0481H144.745L135.592 17.7951Z",
  "M85.1869 38.2988C82.7552 38.2988 80.6482 37.4836 79.0524 35.9293C77.0352 33.9535 75.9852 30.9347 76.1026 27.4254C76.4135 18.2375 79.8952 8.32432 85.6428 0.214153L89.3041 2.81162C84.047 10.2172 80.8693 19.2461 80.586 27.5773C80.51 29.781 81.0972 31.6531 82.1818 32.717C82.997 33.5183 84.1299 33.8776 85.5599 33.7947C87.8258 33.6634 89.7117 32.1298 91.2867 30.1264C89.0969 25.5532 88.5373 19.7297 89.7877 13.5192C89.8706 13.1048 91.8808 3.36427 96.8478 1.9481C97.8978 1.65105 99.9772 1.48525 102.112 3.76494C103.293 5.02913 103.956 6.80453 104.067 9.04277C104.405 15.7506 100.647 22.8729 98.1604 27.5911C97.7735 28.3234 97.2623 29.2905 96.6198 30.3406C96.7925 30.5755 96.9791 30.8103 97.1725 31.0383C98.3331 32.4061 99.5627 33.0762 100.855 33.0417C102.437 33.0002 104.191 31.8604 105.676 29.9192C111.396 22.4377 111.797 12.2481 106.775 1.97573L110.809 0C116.522 11.6817 115.942 23.8884 109.241 32.641C106.892 35.7082 103.956 37.4491 100.972 37.5251C99.1344 37.5734 96.4195 37.007 93.8497 34.0641C91.8463 36.2471 89.2005 38.0846 85.8155 38.2781C85.6013 38.2919 85.3872 38.2988 85.173 38.2988H85.1869ZM98.0982 6.26569C97.131 6.39695 94.9895 10.5211 94.2089 14.4035C93.7737 16.5865 93.1658 21.0077 94.2918 25.3184C96.5508 21.0422 99.8736 14.6729 99.5972 9.27074C99.542 8.1378 99.2795 7.295 98.8512 6.83907C98.4367 6.39004 98.1604 6.2726 98.0982 6.2726V6.26569Z",
];

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const duration = reduce ? 600 : 2800;

    let raf = 0;
    let start: number | null = null;
    let exitT: ReturnType<typeof setTimeout>;
    let doneT: ReturnType<typeof setTimeout>;

    // The bar runs to HOLD on its own, then waits for the hero's 3D scene
    // before completing, so the reveal never shows a half-loaded hero.
    // CAP_MS is the escape hatch: a slow network or a scene that fails to
    // load must never leave a visitor staring at the preloader.
    let released = reduce; // reduced motion: don't wait on the 3D at all
    let releaseStart: number | null = null;
    let releaseFrom = 0;

    const unsubscribe = onHeroReady(() => {
      released = true;
    });
    const capT = setTimeout(() => {
      released = true;
    }, CAP_MS);

    const finish = () => {
      exitT = setTimeout(() => setExiting(true), 300);
      doneT = setTimeout(() => {
        setDone(true);
        document.body.style.overflow = "";
      }, 300 + 1050);
    };

    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 2);
      const held = Math.min(eased * 100, HOLD);

      if (!released) {
        setProgress(Math.round(held));
        raf = requestAnimationFrame(step);
        return;
      }

      // Released: ease whatever is left up to 100 over RELEASE_MS.
      if (releaseStart === null) {
        releaseStart = t;
        releaseFrom = held;
      }
      const q = Math.min((t - releaseStart) / RELEASE_MS, 1);
      const value = releaseFrom + (100 - releaseFrom) * (1 - Math.pow(1 - q, 2));
      setProgress(Math.round(value));

      if (q < 1) {
        raf = requestAnimationFrame(step);
      } else {
        finish();
      }
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(capT);
      clearTimeout(exitT);
      clearTimeout(doneT);
      unsubscribe();
      document.body.style.overflow = "";
    };
  }, []);

  if (done) return null;

  return (
    <div className="pre-root">
      <div className={`pre-bg ${exiting ? "is-exiting" : ""}`}>
        <div className="preloader__count">{progress}%</div>
        <div className="preloader__line">
          <span style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
      </div>

      <div className={`pre-logo ${exiting ? "is-exiting" : ""}`}>
        <svg className="pre-logo__svg" viewBox="0 0 152 39" aria-label="Darwin">
          {PATHS.map((d, i) => (
            <path
              key={i}
              d={d}
              pathLength={1}
              style={{ "--d": `${i * 0.1}s` } as React.CSSProperties}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
