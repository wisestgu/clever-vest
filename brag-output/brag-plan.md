# /brag plan: Dollo

**Format:** landscape 1920×1080, 30 fps, 24.0 s. **Tempo:** 120 BPM (beat 0.5 s, bar 2 s, 12 bars). Every cut lands on a beat.
**Tone:** `default` leaning `polished`. Punchy cuts, elegant holds, money-printing confidence. The visual world is the app's own "Legal Tender" design.

## The answers

- **What is it?** Dollo is a dollar investing app for Nigerians: deposit USDT, buy US stocks from $1, learn as you go, and cash out in naira.
- **Who is it for?** Young Nigerians who already hold USDT to protect their savings, but can't afford whole US shares and don't speak finance jargon.
- **What sets it apart?** The whole loop in one app: USDT in (Tether), dollars held with Cleva, $1 fractional US stocks, insider moves in plain English, 60-second lessons that pay you in stock, and naira out to any Nigerian bank.
- **Most impressive claim:** a single dollar buys a real slice of Tesla.
- **Visual hook:** a $1 banknote engraving itself: the guilloche draws line by line, then "$1" stamps down.
- **Real UI to show:** the app's own components and CSS (Note, Guilloche, MoneyRoute, Coin, ledger and wire rows, amount input, network cards, QR, hold-to-send), rendered live, not screenshots.
- **Share caption:** see `share-copy.txt`.

## Angle

*Money, printed.* Dollo makes US investing feel like holding real money: the product is literally printed as banknotes. The video follows one ₦-to-$ journey end to end, exactly the hackathon story: **USDT deposit → market feed → $5 Tesla → learn & earn → naira out.**

## Storyboard (beats from t = 0)

| # | Time | Beats | Scene | On screen | Sound |
|---|---|---|---|---|---|
| 1 | 0.0–3.0 | 1–6 | **Hook** | A green $1 note engraves itself (guilloche draws in). At 1.5 s "$1" stamps down. Caption: **"Own US stocks from $1."** | Pad and shaker; engraving ticks; stamp thump on beat 4; riser into 3.0 |
| 2 | 3.0–6.0 | 7–12 | **Reveal** | Dollo rosette logo and wordmark. **"The dollar investing app for Nigeria."** An engraved route draws, and stations pop on beats: *USDT in · US stocks · Naira out* | Groove drops on 3.0; soft taps on each station |
| 3 | 6.0–10.0 | 13–20 | **USDT in** | **"Send USDT on Tron. It lands as dollars, 1:1."** The real TRC20 network card and QR address; a 25 USDT deposit confirms 4→19/19; the route counts USDT in $25.00 → Dollars $25.00 with the copper pulse | Tap; confirmation ticks; chime when credited (8.5 s) |
| 4 | 10.0–14.0 | 21–28 | **Market feed → $5 Tesla** | **"Insider moves in plain English. Buy a $5 slice."** The wire row "Tesla's CEO bought $2.3M of Tesla stock" with its BUY stamp → the Tesla panel (Bodoni price, chart drawing) → $5 chip → "Buy $5.00 of TSLA" pressed → "You bought $5.00 of Tesla · 0.0177 shares" | Stamp; taps; success chime |
| 5 | 14.0–17.0 | 29–34 | **Learn & earn** | **"Learn in 60 seconds. Earn real stock."** The real quiz card "What does TRC20 refer to?" → "The Tron network" ✓ → a copper coin drops into the purse: "$1 of NVIDIA, earned" | Tap; coin chime |
| 6 | 17.0–20.0 | 35–40 | **Naira out** | **"Cash out to any Nigerian bank."** "You'll receive ₦14,405.61"; the review line; *Hold to send* fills copper → "Naira sent" | Rising tone while holding; success chime |
| 7 | 20.0–24.0 | 41–48 | **Outro** | The portfolio banknote tilting, holographic thread shifting; the full route: USDT in $25.00 · Dollars $10.00 · US stocks $6.00 · Naira out ₦14,406. Then **Dollo**, **"USDT in. US stocks. Naira out."**, and "Built on Cleva + Tether rails · sandbox demo" | Final chord hit on 22.0, ring out |

**Durations:** 3 + 3 + 4 + 4 + 3 + 3 + 4 = 24.0 s ✓.
**Readability:** every caption is on screen fully settled for at least 0.3 s per word: 5, 6, 9, 10, 7, 6 words against 1.5–3.6 s of settled time.

## Numbers (one consistent story)

These are illustrative sandbox values, consistent with what the app's sandbox actually produces:

- Deposit 25 USDT (TRC20) → $25.00.
- Buy $5.00 of Tesla at $282.44 → 0.0177 shares.
- Pass the "TRC20 vs ERC20" lesson → $1 of NVIDIA.
- Withdraw $10.00, minus a $0.50 fee, at $1 = ₦1,516.38 → ₦14,405.61 to GTBank ····6789.
- End state: $10.00 cash + $5 Tesla + $1 NVIDIA = $16.00 portfolio.

**Personal data:** the account holder "Adaeze Okafor", the account number and the deposit address are fictional sandbox stand-ins. There are no real names, keys or URLs.

## Visual identity

- **Ground:** sage security paper `#e7ece2`, with a faint slow-turning guilloche watermark.
- **Captions:** Bodoni Moda 600 in intaglio ink `#0f2219`, left column.
- **UI:** the real components on the right at 1.5–1.6× zoom.
- **Accents:** banknote green `#0f4a36`, copper `#b4692f`, Schibsted Grotesk for UI.
- **Transitions:** stagger, not crossfade. Old content slides out in about 0.2 s, the paper shows, then new content rises in with a critically damped spring curve.

## Sound

An original 120 BPM afrobeats-leaning groove in E♭ major (E♭ – Cm – A♭ – B♭, one bar each):

- tresillo kick, clap on 2 and 4, rim and shaker 16ths;
- an amapiano-style log-drum bass;
- a kalimba-like pluck motif on the pentatonic;
- a soft pad.

The effects are tuned to E♭, sit on the same beat grid, and are mixed under the music. Everything is synthesized from scratch: no samples, no licensing.
