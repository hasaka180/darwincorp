"use client";

import { useState } from "react";

// Update these with real details.
const WHATSAPP = "971500000000"; // country code + number, no +/spaces
const EMAIL = "hello@thedarwin.co";

export default function FloatingActions() {
  const [chatOpen, setChatOpen] = useState(false);

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
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.5 14.4c-.3-.15-1.7-.85-1.97-.94-.26-.1-.46-.15-.65.15-.2.29-.74.94-.9 1.13-.17.2-.33.22-.62.07-.3-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.3-.02-.46.13-.6.13-.13.3-.34.44-.5.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.65-1.57-.9-2.15-.23-.56-.47-.49-.65-.5h-.55c-.2 0-.5.07-.77.36-.26.29-1 .98-1 2.4 0 1.4 1.03 2.76 1.17 2.95.15.2 2.02 3.08 4.9 4.32.68.3 1.22.47 1.63.6.69.22 1.31.19 1.8.11.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34ZM12.05 21.9h-.02a9.83 9.83 0 0 1-5-1.37l-.36-.21-3.72.97 1-3.63-.24-.37a9.86 9.86 0 1 1 8.34 4.61Zm5.8-15.66A11.8 11.8 0 0 0 3.7 18.35L2 24l5.79-1.52a11.75 11.75 0 0 0 5.63 1.44h.01c6.5 0 11.79-5.29 11.79-11.79a11.72 11.72 0 0 0-3.46-8.35Z" />
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
