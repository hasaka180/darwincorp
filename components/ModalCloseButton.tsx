'use client'

import { useRouter } from 'next/navigation'

/** Close button for the case/journal "modal page" — goes back if there's history,
 *  otherwise to the listing. */
export default function ModalCloseButton({ fallback, className }: { fallback: string; className?: string }) {
  const router = useRouter()
  return (
    <button
      className={className}
      aria-label="Close"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) router.back()
        else router.push(fallback)
      }}
    >
      ✕
    </button>
  )
}
