"use client";

import { openCookieSettings } from "@/lib/consent";

/**
 * Re-opens the cookie preferences panel. Rendered in the footer and on the
 * cookie policy page so a choice can always be changed after it's been made.
 */
export default function CookieSettingsButton({
  className = "",
  children = "Cookie settings",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={openCookieSettings}>
      {children}
    </button>
  );
}
