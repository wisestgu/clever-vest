import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button, Logo, Notice } from '../components/ui';
import { Segmented } from '../components/motion';

const EXAMPLE = [
  { label: 'You send', value: '20 USDT', note: 'on Tron (TRC20)' },
  { label: 'Dollo credits', value: '$20.00', note: '1:1, no conversion fee' },
  { label: 'You invest', value: '$5 of Tesla', note: 'about 0.02 of one share' },
  { label: 'You cash out', value: '₦22,040', note: 'the other $15, to GTBank, OPay…' },
];

export function Welcome() {
  const { signIn, signUp, demo } = useAuth();
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'form' | 'demo' | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy('form');
    try {
      if (mode === 'signup') await signUp(name, email, password);
      else await signIn(email, password);
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  };

  const tryDemo = async () => {
    setError(null);
    setBusy('demo');
    try {
      await demo();
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  };

  return (
    <div className="welcome">
      <section className="welcome-story adire">
        <div className="brand">
          <Logo />
          Dollo
        </div>
        <div className="welcome-copy">
          <h1>US stocks from $1, funded with USDT, cashed out in naira.</h1>
          <p>
            Deposit USDT on Tron or Ethereum, own slices of Apple or NVIDIA, learn the basics in 60-second lessons, and
            send your returns to any Nigerian bank.
          </p>
        </div>
        <ol className="welcome-route" aria-label="Example: how 20 USDT moves through Dollo">
          {EXAMPLE.map((s) => (
            <li key={s.label}>
              <span className="wr-label">{s.label}</span>
              <span className="wr-value num">{s.value}</span>
              <span className="wr-note">{s.note}</span>
            </li>
          ))}
        </ol>
        <p className="welcome-fine">
          Dollo is the app you use. Trades are executed and held by a licensed US broker-dealer, and USD balances are held
          by Cleva. Example figures are illustrative.
        </p>
      </section>

      <section className="welcome-form">
        <div className="welcome-card">
          <Segmented
            block
            role="tablist"
            label="Account"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'signup', label: 'Create account' },
              { value: 'signin', label: 'Sign in' },
            ]}
          />

          <form className="stack" onSubmit={submit} noValidate>
            {mode === 'signup' && (
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="As it appears on your bank account" required />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
              {mode === 'signup' && <span className="hint">At least 8 characters.</span>}
            </div>
            {error && <Notice kind="error">{error}</Notice>}
            <Button variant="primary" type="submit" block loading={busy === 'form'} disabled={busy === 'demo'}>
              {mode === 'signup' ? 'Create my account' : 'Sign in'}
            </Button>
            {mode === 'signup' && (
              <p className="hint center">We’ll open a USD account with Cleva and USDT deposit addresses for you.</p>
            )}
          </form>

          <div className="divider">
            <span>or</span>
          </div>

          <Button block onClick={tryDemo} loading={busy === 'demo'} disabled={busy === 'form'}>
            Explore the demo account
            <ArrowRight aria-hidden="true" />
          </Button>
          <p className="hint center">Sandbox mode: every balance and trade is test money.</p>
        </div>
      </section>
    </div>
  );
}
