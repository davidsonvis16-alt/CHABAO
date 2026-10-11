/* Hand-drawn linework used as ornament — steam, lanterns, brush rings, chopsticks. */

export function Steam({ className = '' }: { className?: string }) {
  return (
    <svg className={`steam ${className}`} viewBox="0 0 120 160" fill="none" aria-hidden>
      <path className="steam-p s1" d="M40 150c-14-22 18-34 4-58s16-36 4-62" />
      <path className="steam-p s2" d="M62 152c-12-20 16-30 4-52s14-32 4-56" />
      <path className="steam-p s3" d="M84 150c-14-22 18-34 4-58s16-36 4-60" />
    </svg>
  );
}

export function Lantern({ className = '' }: { className?: string }) {
  const ribs = Array.from({ length: 13 }, (_, i) => 20 + i * 10);
  return (
    <svg className={`lantern ${className}`} viewBox="0 0 160 300" fill="none" aria-hidden>
      <line x1="80" y1="0" x2="80" y2="70" className="ln" />
      <ellipse cx="80" cy="76" rx="18" ry="5" className="ln" />
      <path d="M22 110 Q80 66 138 110" className="ln" />
      <ellipse cx="80" cy="110" rx="58" ry="10" className="ln" />
      {ribs.map((x) => (
        <path key={x} d={`M${x} ${110 + (x === 20 || x === 140 ? 0 : 1)} L${x} 200`} className="ln thin" />
      ))}
      <ellipse cx="80" cy="200" rx="60" ry="11" className="ln" />
      {Array.from({ length: 30 }, (_, i) => 22 + i * 4).map((x) => (
        <path key={x} d={`M${x} 204 q${(x % 3) - 1} 20 0 ${34 + (x % 5) * 2}`} className="ln fringe" />
      ))}
      <circle cx="80" cy="150" r="13" className="bulb" />
      <circle cx="80" cy="150" r="40" className="halo" />
    </svg>
  );
}

export function BrushRing({ className = '' }: { className?: string }) {
  return (
    <svg className={`brush-ring ${className}`} viewBox="0 0 200 200" fill="none" aria-hidden>
      <path d="M170 64c18 40 0 98-52 112S20 160 20 104 66 18 116 24c28 4 44 16 52 30" />
    </svg>
  );
}

export function Chopsticks({ className = '' }: { className?: string }) {
  return (
    <svg className={`chopsticks ${className}`} viewBox="0 0 240 40" fill="none" aria-hidden>
      <path d="M4 14 L236 6" />
      <path d="M4 26 L236 34" />
      <path d="M200 7.2 L236 6 M200 32.8 L236 34" className="tip" />
    </svg>
  );
}

export function ChilliDots({ level, max = 3 }: { level: number; max?: number }) {
  return (
    <span className="chilli-dots" aria-label={`Heat ${level} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} viewBox="0 0 16 16" className={i < level ? 'on' : ''}>
          <path d="M5 3c0-1.5 2-2 2.5-.5C11 2 14 5 13 9s-6 6-9 5c-2-.6-1-2 0-2.5C7 10 7 6 5 3z" />
        </svg>
      ))}
    </span>
  );
}

export const Icon = {
  arrow: () => (<svg className="ic" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6" /></svg>),
  back: () => (<svg className="ic" viewBox="0 0 24 24"><path d="M20 12H5M11 6l-6 6 6 6" /></svg>),
  plus: () => (<svg className="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>),
  minus: () => (<svg className="ic" viewBox="0 0 24 24"><path d="M5 12h14" /></svg>),
  close: () => (<svg className="ic" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>),
  bag: () => (<svg className="ic" viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>),
  check: () => (<svg className="ic" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" /></svg>),
  lock: () => (<svg className="ic" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>),
  rotate: () => (<svg className="ic" viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5" /></svg>),
};
