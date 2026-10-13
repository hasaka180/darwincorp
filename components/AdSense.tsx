"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, hasConsent } from "@/lib/consent";

const SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5661938637436853";

/**
 * Loads Google AdSense once the visitor allows marketing cookies, as the
 * consent banner promises. Site ownership is verified by the
 * google-adsense-account meta tag in the root layout, so the crawler does not
 * need this script. The tag is added by hand because next/script stamps a
 * data-nscript attribute that AdSense warns about.
 */
export default function AdSense() {
  const pathname = usePathname();
  // Same exclusions as the banner: no ads in the studio CMS or on the bio links page.
  const off = pathname?.startsWith("/studio") || pathname?.startsWith("/links");

  useEffect(() => {
    if (off) return;
    function load() {
      if (!hasConsent("marketing") || document.querySelector(`script[src="${SRC}"]`)) return;
      const s = document.createElement("script");
      s.async = true;
      s.src = SRC;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    load();
    window.addEventListener(CONSENT_EVENT, load);
    return () => window.removeEventListener(CONSENT_EVENT, load);
  }, [off]);

  return null;
}
