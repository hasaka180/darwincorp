/**
 * White marks for the capability cards: one simple geometric symbol per
 * service, drawn on a 100x100 grid so they sit at the same optical size.
 */
type Props = { className?: string };
const svg = (className: string | undefined, children: React.ReactNode) => (
  <svg className={className} viewBox="0 0 100 100" fill="#fff" aria-hidden="true" focusable="false">{children}</svg>
);

/** Website design & development: a pair of code brackets. */
export function MarkWeb({ className }: Props) {
  return svg(className, (
    <g fill="none" stroke="#fff" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round">
      <path className="mk-web-l" d="M38 24 12 50l26 26" />
      <path className="mk-web-r" d="M62 24l26 26-26 26" />
    </g>
  ));
}

/** Brand identity: an eight-spoke burst with an open centre. */
export function MarkBrand({ className }: Props) {
  return svg(className, (
    <g className="mk-burst" stroke="#fff" strokeWidth="12" strokeLinecap="round">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const r = (a * Math.PI) / 180;
        return <line key={a} x1={50 + Math.cos(r) * 16} y1={50 + Math.sin(r) * 16} x2={50 + Math.cos(r) * 42} y2={50 + Math.sin(r) * 42} />;
      })}
    </g>
  ));
}

/** Interactive experiences: dots rippling out from a touch point. */
export function MarkInteractive({ className }: Props) {
  // [x, y, radius, ring]; the ring index staggers the ripple animation.
  const dots: [number, number, number, number][] = [[50, 70, 7, 0]];
  [[22, 5, 5.5], [40, 7, 4.5]].forEach(([r, n, size], ring) => {
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (Math.PI * i) / (n - 1);
      dots.push([50 + Math.cos(a) * r, 70 + Math.sin(a) * r, size, ring + 1]);
    }
  });
  return svg(className, dots.map(([x, y, r, ring], i) => (
    <circle key={i} className="mk-dot" style={{ ["--ring" as string]: ring }} cx={x.toFixed(2)} cy={y.toFixed(2)} r={r} />
  )));
}

/** UI/UX & product: an interface grid, one tile turned into a control. */
export function MarkProduct({ className }: Props) {
  return svg(className, (
    <>
      <rect x="12" y="12" width="34" height="34" rx="9" />
      <circle className="mk-toggle" cx="71" cy="29" r="17" />
      <rect x="12" y="54" width="34" height="34" rx="9" />
      <rect x="54" y="54" width="34" height="34" rx="9" />
    </>
  ));
}

/** Motion design: a form leaving a trail behind it. */
export function MarkMotion({ className }: Props) {
  return svg(className, (
    <>
      <g className="mk-trail">
        <circle className="mk-trail-3" cx="16" cy="50" r="7" opacity="0.4" />
        <circle className="mk-trail-2" cx="38" cy="50" r="12" opacity="0.7" />
        <circle cx="68" cy="50" r="20" />
      </g>
    </>
  ));
}

/** AI creative production: a generative spark. */
export function MarkAi({ className }: Props) {
  return svg(className, (
    <>
      <path className="mk-spark" d="M44 12c3 22 10 29 32 32-22 3-29 10-32 32-3-22-10-29-32-32 22-3 29-10 32-32Z" />
      <path className="mk-twinkle" d="M78 58c1.6 10 4.6 13 14 14.5-9.4 1.5-12.4 4.5-14 14.5-1.6-10-4.6-13-14-14.5 9.4-1.5 12.4-4.5 14-14.5Z" />
    </>
  ));
}
