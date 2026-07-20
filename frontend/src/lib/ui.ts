// Shared button / pill styles.
//
// CTA pattern (Uniswap-style): tinted "ghost" fill at rest, solid fill on
// hover/press — the "Select a token" → "Select token" behaviour. Corners are
// rounded-[12px] to harmonize with the 16px cards. Class strings are written
// out in full so Tailwind's JIT scanner picks them up.

const CTA_BASE = 'font-bold rounded-[12px] transition-colors disabled:opacity-60';

// Tinted at rest, a touch stronger on hover, and solid ONLY while actively
// pressed (:active) — so the solid fill is momentary click feedback that
// reverts to the tinted look as soon as the press is released.
export const CTA_BLUE =
  `${CTA_BASE} bg-[#00A8E8]/15 text-[#00A8E8] hover:bg-[#00A8E8]/25 active:bg-[#00A8E8] active:text-white`;

export const CTA_GREEN =
  `${CTA_BASE} bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 active:bg-[#10B981] active:text-white`;

export const CTA_RED =
  `${CTA_BASE} bg-[#EF4444]/15 text-[#EF4444] hover:bg-[#EF4444]/25 active:bg-[#EF4444] active:text-white`;

// Solid variants for in-progress / confirmed feedback states.
export const CTA_BLUE_SOLID = `${CTA_BASE} bg-[#00A8E8] text-white`;
export const CTA_GREEN_SOLID = `${CTA_BASE} bg-[#10B981] text-white`;

// Segmented control (e.g. lock-period): solid brand fill when active, tinted
// ghost when inactive — same language as the CTAs.
export const seg = (active: boolean) =>
  `rounded-[12px] font-bold transition-colors ${active
    ? 'bg-[#00A8E8] text-white'
    : 'bg-[#00A8E8]/15 text-[#00A8E8] hover:bg-[#00A8E8]/25'}`;

// Uniswap-style token pill: solid rounded-full chip, logo hugging the left.
export const TOKEN_PILL =
  'flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-black/[0.06] dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/[0.14] transition-colors shrink-0 cursor-pointer';
