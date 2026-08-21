"use client";

import Spline from "@splinetool/react-spline";
import type { Application } from "@splinetool/runtime";

/**
 * The 3D hero canvas, isolated so it can be code-split out of the homepage.
 *
 * `@splinetool/react-spline` only declares an `import` condition in its
 * exports map, so `next/dynamic` can't resolve it directly — importing it
 * statically here and lazy-loading *this* module instead keeps the ~590 kB
 * runtime out of the first-load bundle.
 */
export default function HeroScene({
  sceneUrl,
  onLoad,
}: {
  sceneUrl: string;
  onLoad: (app: Application) => void;
}) {
  return <Spline scene={sceneUrl} onLoad={onLoad} />;
}
