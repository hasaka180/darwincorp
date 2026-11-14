// Concept photography for the Aurelia demo, generated with
// scripts/generate-realestate-images.mjs into public/assets/realestate/.
// The tone gradient sits behind the image while it loads.
export default function Photo({ src, alt, tone = "dusk", className = "", eager = false }: {
  src: string; alt: string; tone?: "dusk" | "sand" | "stone" | "night" | "sea"; className?: string; eager?: boolean;
}) {
  return (
    <div className={`re-ph re-ph--${tone} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/assets/realestate/${src}.webp`} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />
    </div>
  );
}
