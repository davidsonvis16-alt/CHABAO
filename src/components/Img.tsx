import { useState, type CSSProperties } from 'react';

/** Image slot: renders the real photo once its file is in /public; until then shows which file it expects. */
export function Img({ src, alt, className = '', style, eager }: { src: string; alt: string; className?: string; style?: CSSProperties; eager?: boolean }) {
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading');
  return (
    <span className={`media media--${state} ${className}`} style={style} data-file={src.replace('/images/', '')}>
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setState('ok')}
        onError={() => setState('missing')}
        ref={(el) => { if (el && el.complete && state === 'loading') setState(el.naturalWidth ? 'ok' : 'missing'); }}
      />
    </span>
  );
}

/** Brand logo with typeset fallback in Cha Bao's lambda-A style. */
export function Logo({ small }: { small?: boolean }) {
  const [missing, setMissing] = useState(false);
  return (
    <span className={`logo ${small ? 'logo--sm' : ''}`}>
      {!missing && <img src="/images/brand/logo-white.png" alt="Cha Bao" onError={() => setMissing(true)} />}
      {missing && (
        <span className="wordmark" aria-label="Cha Bao">
          <span className="wm-name">CHΛ BΛO</span>
          <span className="wm-sub">Modern Asian Bistro</span>
        </span>
      )}
    </span>
  );
}

/** Payment-brand logo slot (real SVG/PNG marks in /public/images/pay). */
export function PayMark({ name, label }: { name: string; label: string }) {
  const [missing, setMissing] = useState(false);
  const file = name === 'mpesa' ? `/images/pay/mpesa.png` : `/images/pay/${name}.svg`;
  return missing ? (
    <span className={`paymark paymark--text paymark--${name}`}>{label}</span>
  ) : (
    <img className={`paymark paymark--${name}`} src={file} alt={label} onError={() => setMissing(true)} />
  );
}
