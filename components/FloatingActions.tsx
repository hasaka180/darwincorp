"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

// Update these with real details.
const WHATSAPP = "971555355897"; // country code + number, no +/spaces
const EMAIL = "hello@thedarwin.co";

export default function FloatingActions() {
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);

  // Ad landing pages stay chrome-free: the form is the only call to action.
  if (pathname?.startsWith("/lp")) return null;

  return (
    <div className="fab">
      {chatOpen && (
        <div className="fab__chat" role="dialog" aria-label="Chat">
          <div className="fab__chat-head">
            <strong>Darwin Corp</strong>
            <button
              className="fab__chat-close"
              aria-label="Close chat"
              onClick={() => setChatOpen(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="fab__chat-msg">
            👋 Hi! How can we help? Reach us instantly below.
          </p>
          <div className="fab__chat-actions">
            <a
              className="fab__chat-btn"
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp us
            </a>
            <a className="fab__chat-btn fab__chat-btn--ghost" href={`mailto:${EMAIL}`}>
              Email us
            </a>
          </div>
        </div>
      )}

      <a
        className="fab__btn fab__btn--wa"
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
      >
        <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
          <path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.7 1.4 5.8 1.4h.01c6.6 0 12-5.4 12-12S22.6 3 16 3Zm0 21.8h-.01c-1.8 0-3.5-.5-5-1.4l-.36-.21-4.9 1 1-4.8-.24-.37c-1-1.6-1.5-3.4-1.5-5.3C5 9.5 9.9 4.6 16 4.6S27 9.5 27 15.6 22.1 24.8 16 24.8Zm5.5-7.4c-.3-.15-1.8-.9-2.05-1-.28-.1-.48-.15-.68.15s-.78.98-.95 1.18c-.18.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.53.07-.8.38-.28.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.14 4.54.72.3 1.28.5 1.71.63.72.23 1.37.2 1.89.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.42-.07-.12-.27-.2-.57-.34Z" />
        </svg>
      </a>

      <a
        className="fab__btn fab__btn--mail"
        href={`mailto:${EMAIL}`}
        aria-label="Email"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>

      <button
        className={`fab__btn fab__btn--chat ${chatOpen ? "is-open" : ""}`}
        onClick={() => setChatOpen((v) => !v)}
        aria-label="Chat"
        aria-expanded={chatOpen}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9A1.5 1.5 0 0 1 18.5 16H9l-4 4v-4H5.5A1.5 1.5 0 0 1 4 14.5v-9Z" strokeLinejoin="round" />
          <path d="M8.5 9.5h7M8.5 12.5h4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
