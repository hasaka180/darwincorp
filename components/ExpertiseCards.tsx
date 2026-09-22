"use client";

import { useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import useNearViewport from "@/components/useNearViewport";
import SceneBoundary from "@/components/SceneBoundary";
import styles from "./ExpertiseCards.module.css";

const ExpertiseScene = dynamic(() => import("./ExpertiseScene"), { ssr: false });

const EXPERTISE = [
  { slug: "custom-web-development", title: "Custom Website", phrase: "Ideas into experiences", note: "Build\nbrands\nonline", object: "layers" },
  { slug: "interactive-web-design", title: "Interactive", phrase: "More than a click", note: "Engage\ninteract\nconvert", object: "cursor" },
  { slug: "creative-web-development", title: "Creative Development", phrase: "Concepts that move people", note: "Ideas\ndesign\ncreate", object: "spark" },
  { slug: "website-redesign", title: "Website Redesign", phrase: "A better tomorrow", note: "Refresh\nreimagine\nrelaunch", object: "refresh" },
  { slug: "ui-ux-design", title: "UI/UX", phrase: "Beautiful. Intuitive. Human.", note: "People\nfirst\ndesign", object: "interface" },
  { slug: "logo-visual-identity", title: "Visual Identity", phrase: "A stronger you", note: "Distinct\nmemorable\ntimeless", object: "identity" },
  { slug: "motion-design", title: "Motion & Animation", phrase: "Bring ideas to life", note: "Stories\nin motion", object: "motion" },
  { slug: "ai-creative-production", title: "AI Creatives", phrase: "New possibilities", note: "Intelligence\nmeets\ncreativity", object: "cluster" },
  { slug: "social-media-design", title: "Social Creatives", phrase: "Ideas for every platform", note: "Content\nthat\nconnects", object: "tiles" },
] as const;

export default function ExpertiseCards() {
  const grid = useRef<HTMLDivElement>(null);
  const near = useNearViewport(grid);
  return <div ref={grid} className={styles.grid}>
    {EXPERTISE.map((service, index) => <Link href={`/services/${service.slug}`} className={styles.card} key={service.slug} data-expertise-card={index}>
      <span className={styles.topline}><span className={styles.number}>{String(index + 1).padStart(2, "0")}</span><span className={styles.note}>{service.note}</span></span>
      <div className={styles.stage} data-expertise-stage={service.object} aria-hidden="true">
        <div className={styles.guides} />
        <div className={styles.shadow} />
        <div className={styles.fallback}><i /><i /><i /></div>
      </div>
      <div className={styles.copy}><div className={styles.titleRow}><h3>{service.title}</h3><span className={styles.arrow} aria-hidden="true">→</span></div><p>{service.phrase}</p></div>
    </Link>)}
    {near && <SceneBoundary><ExpertiseScene gridRef={grid} /></SceneBoundary>}
  </div>;
}
