// Stand-in for photography that has not been chosen yet. Each placeholder
// names the shot it is holding space for, so swapping in a real image later
// is a matter of replacing this element with an <img> of the same frame.
export default function Placeholder({ label, tone = "dusk", className = "" }: {
  label: string; tone?: "dusk" | "sand" | "stone" | "night" | "sea"; className?: string;
}) {
  return (
    <div className={`re-ph re-ph--${tone} ${className}`} role="img" aria-label={`Image placeholder: ${label}`}>
      <span className="re-ph__label">{label}</span>
    </div>
  );
}
