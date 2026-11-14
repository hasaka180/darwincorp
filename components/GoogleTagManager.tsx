"use client";

import { useEffect } from "react";
import { CONSENT_EVENT, readConsent, type Consent } from "@/lib/consent";

const GTM_ID = "GTM-MQL5CFSF";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(..._args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // Google recognizes gtag commands as Arguments objects, not plain arrays.
  window.dataLayer.push(arguments);
}

function updateGoogleConsent(consent: Consent) {
  window.gtag?.(
    "consent",
    "update",
    {
      analytics_storage: consent.analytics ? "granted" : "denied",
      ad_storage: consent.marketing ? "granted" : "denied",
      ad_user_data: consent.marketing ? "granted" : "denied",
      ad_personalization: consent.marketing ? "granted" : "denied",
    },
  );
}

function loadGoogleTagManager(consent: Consent) {
  if (document.querySelector(`script[data-gtm-id="${GTM_ID}"]`)) {
    updateGoogleConsent(consent);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || gtag;
  window.gtag(
    "consent",
    "default",
    {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    },
  );
  updateGoogleConsent(consent);
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  script.dataset.gtmId = GTM_ID;
  document.head.appendChild(script);
}

export default function GoogleTagManager() {
  useEffect(() => {
    const syncConsent = (event?: Event) => {
      const consent =
        (event as CustomEvent<Consent> | undefined)?.detail ?? readConsent();
      if (!consent) return;

      if (consent.analytics || consent.marketing) {
        loadGoogleTagManager(consent);
      } else {
        updateGoogleConsent(consent);
      }
    };

    syncConsent();
    window.addEventListener(CONSENT_EVENT, syncConsent);
    return () => window.removeEventListener(CONSENT_EVENT, syncConsent);
  }, []);

  return null;
}
