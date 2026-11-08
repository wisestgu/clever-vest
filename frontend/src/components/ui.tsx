import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { AlertTriangle, Check, CircleAlert, Copy, Info } from 'lucide-react';
import QRCode from 'qrcode';
import { pct, tone } from '../lib/format';
import { Rosette } from './Guilloche';

export function Logo({ className = 'logo' }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <Rosette seed="dollo-mark-3" layers={4} stroke={0.9} />
    </span>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'quiet' | 'brass';
  size?: 'sm' | 'md';
  block?: boolean;
  loading?: boolean;
};

export function Button({ variant = 'secondary', size = 'md', block, loading, className = '', children, disabled, ...rest }: BtnProps) {
  const cls = ['btn', variant !== 'secondary' && `btn-${variant}`, size === 'sm' && 'btn-sm', block && 'btn-block', className].filter(Boolean).join(' ');
  return (
    <button className={cls} data-loading={loading || undefined} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {children}
    </button>
  );
}

export function Notice({ kind = 'info', title, children }: { kind?: 'info' | 'warn' | 'error' | 'success'; title?: string; children: ReactNode }) {
  const Icon = kind === 'warn' ? AlertTriangle : kind === 'error' ? CircleAlert : kind === 'success' ? Check : Info;
  return (
    <div className={`notice ${kind !== 'info' ? `notice-${kind}` : ''}`} role={kind === 'error' ? 'alert' : undefined}>
      <Icon aria-hidden="true" />
      <div>
        {title && <strong>{title} </strong>}
        {children}
      </div>
    </div>
  );
}

export function ChangeBadge({ value, className = '' }: { value: number | null | undefined; className?: string }) {
  if (value == null) return null;
  const t = tone(value);
  return <span className={`badge num ${t ? `badge-${t}` : ''} ${className}`}>{pct(value)}</span>;
}

/** Ticker as type, not as an icon tile. */
export function Ticker({ symbol, large }: { symbol: string; large?: boolean }) {
  return (
    <span className={`sym ${large ? 'sym-lg' : ''}`} aria-hidden="true">
      {symbol}
    </span>
  );
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1800);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => setDone(true), () => setDone(false));
      }}
      aria-label={done ? `${label} copied` : `Copy ${label}`}
      title={done ? 'Copied' : `Copy ${label}`}
    >
      {done ? <Check /> : <Copy />}
    </button>
  );
}

export function Qr({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let alive = true;
    QRCode.toString(value, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#10231b', light: '#ffffff' } }).then((s) => alive && setSvg(s));
    return () => {
      alive = false;
    };
  }, [value]);
  return <div className="qr" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Skeleton({ h = 16, w = '100%', r }: { h?: number; w?: number | string; r?: number }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />;
}

export function LoadError({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="empty">
      <h3>Couldn’t load this</h3>
      <p>{error.message}</p>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
