# Design system: "Legal Tender"

Mode: **Operate.** People come to Dollo to get a job done, so navigation, controls and layout are the ones a fintech user already knows. The visual world lends four things only: type, palette, density and one signature move.

Two design skills shape the UI. [impeccable](https://github.com/pbakaus/impeccable) sets the visual world, the craft floor and the bans on AI-slop defaults. [apple-design](https://github.com/emilkowalski/skills/blob/main/skills/apple-design/SKILL.md) (Apple's WWDC fluid-interface guidance, translated for the web) and Emil Kowalski's [design-engineering](https://github.com/emilkowalski/skills/tree/main/skills/emil-design-eng) skill set how the UI moves, responds and layers.

## World

Dollo moves value between naira, USDT and dollars, so the app is **printed like money**. The world is security printing: pale sage security paper, deep intaglio green, engraved guilloche rosettes, microtext, serial numbers, a windowed holographic thread, and copper coins for anything earned. Every Nigerian and every dollar holder knows these marks by heart.

The world deliberately refuses the category default: a dark SaaS sidebar, white cards with soft shadows, ticker icon tiles, uniform card grids, gradient-filled charts and an indigo/neon palette. `npx impeccable detect frontend/src` reports 0 findings. The previous design had a side-tab border tell.

## Signature move: the banknote

`components/Note.tsx` prints a value as a note:

- **Ground:** intaglio green with fine cross-hatched engraving lines.
- **Guilloche:** a rosette and a woven band, generated procedurally (`components/Guilloche.tsx`). These are real hypotrochoids and phase-shifted sine waves, seeded so every user's note and every collection is unique.
- **Microtext border:** "ONE DOLLAR" in English, Yoruba (*ọkan dọla*), Igbo (*otu dollar*) and Hausa (*dala ɗaya*).
- **Serial number:** the user's Cleva account number, set as a serial in red.
- **Denomination numerals:** set in Bodoni Moda.

The note **tilts toward the pointer** on a critically damped spring. Its **windowed holographic security thread** shifts colour with the tilt angle, and a soft sheen follows the light.

The note carries across surfaces:

- **Portfolio:** the user's total value, as a green note.
- **Markets:** each sector collection is printed as its own denomination, in a different ink like naira notes: AI Revolution in violet, Top Dividend Payers in copper, Clean Energy in green, Brands You Already Use in blue.
- **Learn-to-earn:** a passed lesson *prints* a copper $1 reward note. Its engraved lines draw themselves in once, a rare and earned moment.
- **Welcome:** the hero is a $1 note, "the smallest amount you can invest".

Supporting moves:

- **Money route:** four numbered stations joined by an engraved guilloche line. While a USDT deposit is confirming, a copper pulse travels along the first leg.
- **Copper coins** (`components/Coin.tsx`) for rewards. The Learn page shows a purse of five coins, filled as they are earned.
- **Insider wire:** a dense list with rubber-stamp BUY/SELL marks and the deal size in Bodoni, replacing the card grid.
- **Hold to send:** naira withdrawals confirm by holding the button (Emil's hold-to-confirm). A copper fill creeps across linearly while the user decides (1.4s) and snaps back in 200ms on release. It works with pointer, Space and Enter.

## Tokens

Defined in `frontend/src/styles/tokens.css`. Light and dark are each chosen, not auto-inverted.

| Role | Light | Dark |
| --- | --- | --- |
| Paper `--bg` / sheet `--surface` | `#e7ece2` / `#f5f7f1` | `#09130e` / `#101d17` |
| Intaglio ink / secondary / muted | `#0f2219` / `#384b42` / `#56685f` | `#e4ede5` / `#b2c3b8` / `#8b9f93` |
| Action `--primary` (banknote green) | `#0f4a36` | `#6fcf9c` |
| Copper (rewards, hold-to-send) | `#b4692f` | `#d38749` |
| Note inks: green / violet / copper / blue | `#0f4a36` / `#362a74` / `#64341a` / `#163b6e` | slightly deeper |
| Gain / loss / warning | `#12784a` / `#b1332a` / `#7a5300` | `#5fd296` / `#ff8a7e` / `#f0c56a` |

- **Type:**
  - **Schibsted Grotesk** is the UI workhorse.
  - **Bodoni Moda**, with its optical-size axis, is for denominations, page titles, prices and money figures. Its engraved, high-contrast numerals come straight from banknote lettering.
  - **Geist Mono** is only for data read character by character: tickers, serials, addresses.
  - Prose numbers use proportional lining figures. Schibsted's tabular period is too wide.
- **Shape:** pill buttons and segmented controls, 12px inputs, and 18px notes and inset-grouped lists. There are no drop shadows on content surfaces; only notes cast a shadow, because they are objects.
- **Layout:** a paper masthead with a sliding green underline on desktop, a glass tab bar on phones, and inset-grouped ledgers (Apple's familiar grouped list) for holdings, lessons and activity.

## Feel (apple-design layer)

- **Springs, not durations.** `frontend/src/lib/motion.ts` defines Apple's damping/response pairs for Motion. UI motion is critically damped (`ui` 1.0/0.4, `snappy` 1.0/0.3). Bounce is used only after a gesture that carried momentum (`sheet` 0.8/0.3, `flick` about 0.8/0.35).
- **Respond on press.** Buttons scale to 0.97, chips to 0.95 and tab icons to 0.88 on pointer-down, in 100ms. `touch-action: manipulation` removes the tap delay. Withdraw shows a naira estimate from the last known rate on every keystroke, and the exact server quote replaces it a moment later.
- **Trade sheet on phones** (`components/Sheet.tsx`):
  - The sheet tracks the finger 1:1 from the grab point, with pointer capture.
  - Pulling past the top meets Apple's rubber-band resistance.
  - On release, the momentum projection (`v/1000 · d/(1−d)`, d = 0.998) decides between dismissing and springing back.
  - The release velocity is handed to the spring.
  - The sheet can be grabbed again mid-flight.
  - The scrim opacity follows the sheet's position continuously.
  - Escape and scrim taps dismiss it, and focus returns to the button that opened it.
- **Swipeable lessons:** cards drag horizontally, use momentum projection to choose next or back, and rubber-band at the first card. Cards enter from the side they come from and leave the way they came. A card on its way out can't be clicked.
- **Segmented controls** (`components/motion.tsx`) are iOS-style: a thumb slides between options on a spring, and the control is a real radio group or tablist with arrow-key support.
- **Rolling numbers:** the portfolio total and the money-route amounts spring from their on-screen value to the new one. A second change mid-roll continues smoothly.
- **Materials:** the mobile top bar is heavy indigo glass (92%), because it is structural. The tab bar and trade bar are light glass with content scrolling beneath, edged with a hairline. The sheet is the thickest material, with a highlight edge and a dimming scrim, because it is a focused task. The desktop rail stays solid, as the heaviest structural surface.
- **Haptics** (`navigator.vibrate`) fire only for commits, on the same frame as the visual change: order filled, deposit credited, reward earned, withdrawal sent, quiz answer, error.
- **Typography:** letter-spacing is size-specific (`--tr-*`), from +0.012em at 12px down to −0.03em on display numbers. Line-height tightens as size grows, and `font-optical-sizing: auto` is on. Spacing tokens are in rem, so layout scales with the reader's text-size setting. Geist is kept over the system font on purpose: Android OEM fonts vary widely, and money needs consistent tabular figures on every device.
- **Accessibility:**
  - `prefers-reduced-motion`: sheets and cards cross-fade instead of sliding, and numbers jump instead of rolling.
  - `prefers-reduced-transparency`: bars and sheets become solid.
  - `prefers-contrast: more`: solid materials, with defined borders on panels and controls.
- **Wayfinding and agency:** tabs are named for what they contain (Portfolio, Markets, Learn, Activity). Naira withdrawals, which can't be reversed, get an inline review step ("Send ₦14,379.86 to ADAEZE OKAFOR … can't be reversed") before the final confirm.

## Components

Pill buttons (primary, secondary, quiet, ghost; each with hover, active, disabled and loading), underlined Bodoni amount inputs with preset chips, iOS segmented controls, network radio-cards, notices, badges, inset-grouped ledger rows, definition lists, skeletons and empty states that teach the next action. Desktop has no modals. On phones, trading uses the bottom sheet, the platform-native pattern for a focused task.

## Charts

- **Price chart:** a single 2px series in banknote green, a dotted baseline at the range's opening price, and no gradient fill. A crosshair and dot scrub the price into the Bodoni header. Arrow keys scrub too.
- **Allocation:** a thin 8px segmented bar with 2px gaps, plus a legend that always prints percentage and value.
- **Categorical order:** validated with the dataviz palette checker against both new surfaces. Four stock slots, then a neutral "Other", then the USD reserve:

  | Slot | Light | Dark |
  | --- | --- | --- |
  | Stock 1 | `#2c6cc0` | `#3f86db` |
  | Stock 2 | `#c4692c` | `#d06a2c` |
  | Stock 3 | `#1b9a6c` | `#24a676` |
  | Stock 4 | `#6a55d0` | `#8676e3` |
  | Other | `#8a978f` | `#5f7068` |
  | USD reserve | `#c9a227` | `#b38a1f` |

  The light theme passes every check: worst adjacent CVD ΔE is 8.5. Only the reserve slot falls below 3:1 contrast, so the legend always carries labels and values. The dark theme passes every check. Colour follows the entity, not its rank.

## Copy

Controls name their action ("Buy $5.00 of TSLA", "Withdraw $10.00"). Errors name the problem and the fix ("You have $28.00. Deposit USDT to add more."). Simulated data is always labelled: "Sample data, not real filings", "Simulated sandbox prices", "Sandbox address".
