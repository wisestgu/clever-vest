# Design system

Mode: **Operate.** Users come to Dollo to get a job done, so navigation, controls and layout are the standard ones a fintech user already knows. The visual world lends four things only: type, palette, density and one signature move.

## World: Adire indigo

The palette comes from adire, the indigo resist-dyed cloth of Abeokuta. The deep indigo shell carries the brand: side rail, mobile top bar, home band and welcome panel. The content ground is a cool, faintly indigo-tinted grey rather than white or cream. Brass, like the thread and gold worn with indigo, marks earned value and the primary path in: the Deposit button, Learn-to-earn rewards and the money route.

The home band and welcome panel carry an authored SVG tile after *adire eleko* (rings, dashed resist circles and seeds). It sits at about 8% opacity and fades in from the left so it never sits under text.

## Signature move: the money route

On Home, the user's money is drawn as a transit line (`components/MoneyRoute.tsx`):

`USDT in ── USD balance ══ US stocks ── Naira out`

- Brass track on indigo; USD balance and US stocks are larger "interchange" nodes.
- Each stop shows its live amount and an action (Deposit, Add, Invest, Withdraw).
- Empty stops dim their node and the track leading into them.
- While a USDT deposit is confirming, the first segment flows (an animated dash), so value in transit is visible.
- The welcome screen repeats the route vertically as a worked example (20 USDT → $20 → $5 of Tesla → ₦).

## Tokens

Defined in `frontend/src/styles/tokens.css`. Light and dark themes are each chosen, not auto-inverted.

| Role | Light | Dark |
| --- | --- | --- |
| Ground `--bg` | `#f2f3f8` | `#0a0d22` |
| Surface `--surface` | `#ffffff` | `#121638` |
| Ink / secondary / muted | `#12162e` / `#454a68` / `#5d6286` | `#eceefb` / `#b7bcdd` / `#9197c0` |
| Shell `--shell` / rail `--shell-deep` | `#141b5c` / `#0d1240` | `#10154a` / `#070a1f` |
| Primary action `--primary` | `#3243b5` | `#7080f2` |
| Brass `--brass` (fill) / `--brass-ink` (text) | `#e0b44c` / `#81600f` | `#e0b44c` / `#e8c46c` |
| Gain / loss / warning | `#11784b` / `#ae2530` / `#7c5200` | `#4fcf8f` / `#ff7a83` / `#f3c66a` |

- **Type:** Geist (variable, self-hosted) for everything. Geist Mono only for data that is read character by character: wallet addresses, account numbers, references. The scale ratio is 1.2 in fixed rem (12 · 13 · 15 · 18 · 22 · 28 · 36px). Every figure uses tabular numerals.
- **Spacing:** a 4px base (4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48).
- **Radius:** 6 for small controls, 10 for buttons and inputs, 14 for panels.
- **Motion:** 140–250ms with exponential ease-out, used only for state (hover, selection, confirmations, the flowing route). `prefers-reduced-motion` is respected.
- **Browser surfaces:** focus ring, selection colour, caret, accent colour and scrollbars are themed from the palette.

## Components

Buttons (primary, secondary, ghost, shell, brass; each with hover, active, disabled and loading), inputs, a large amount input with preset chips, segmented controls, a network radio-card, notices (info, warn, error, success), badges, data rows, a definition list, skeleton loaders and empty states that teach the next action. There are no modals: trade confirmations, withdrawal status and quiz results all render inline.

## Charts

- **Price chart:** a single 2px series in `--primary` with a dashed baseline at the range's opening price. A crosshair and dot scrub the price into the header. Arrow keys scrub too.
- **Allocation:** a thin 8px segmented bar with 2px gaps and fully rounded ends, plus a legend that always prints percentage and value.
- **Categorical order:** validated with the dataviz palette checker against both surfaces. Four stock slots, then a neutral "Other", then the USD reserve:

  | Slot | Light | Dark |
  | --- | --- | --- |
  | Stock 1 | `#2a78d6` | `#3987e5` |
  | Stock 2 | `#eb6834` | `#d95926` |
  | Stock 3 | `#1baf7a` | `#199e70` |
  | Stock 4 | `#6250d6` | `#9085e9` |
  | Other | `#8b90aa` | `#6d7298` |
  | USD reserve | `#eda100` | `#c98500` |

  The light theme passes every check: worst adjacent CVD ΔE is 9.2. Two slots fall below 3:1 contrast on white, so the legend always carries labels and values. Colour follows the entity: slots go to the top four holdings in alphabetical order, not by rank.

## Copy

Controls name their action ("Buy $5.00 of TSLA", "Withdraw $10.00"). Errors name the problem and the fix ("You have $28.00. Deposit USDT to add more."). Simulated data is always labelled: "Sample data, not real filings", "Simulated sandbox prices", "Sandbox address".
