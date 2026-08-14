"use client";

import { useEffect, useState } from "react";
import { useOnLightBg } from "@/components/useOnLightBg";
import { useScrolled } from "@/components/useScrolled";

export default function StatusWidget() {
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const onLight = useOnLightBg();
  const scrolled = useScrolled();

  useEffect(() => {
    // Derive an approximate "browsing location" from the browser's timezone —
    // no permission prompt, no network. e.g. "Asia/Colombo" → "Colombo".
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const city = tz.split("/").pop()?.replace(/_/g, " ") ?? "Earth";
    setLocation(city);

    const tick = () =>
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={`status ${onLight ? "is-dark" : ""} ${scrolled ? "is-hidden" : ""}`}
      suppressHydrationWarning
    >
      <span className="status__loc">
        <span className="status__dot" />
        {location}
      </span>
      <span className="status__time">{time}</span>
    </div>
  );
}
