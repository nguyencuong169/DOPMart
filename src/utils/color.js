/* Shared colour maths: one implementation for "which text colour can sit on this
   surface", used by the hero accents and the deal cards. */
export function relativeLuminance(hex) {
  const clean = String(hex || "").replace("#", "");
  const lin = (pair) => {
    const c = parseInt(pair || "0", 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = [clean.slice(0, 2), clean.slice(2, 4), clean.slice(4, 6)].map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/* `is-dark` = the surface needs cream text. The class is chosen by comparing the two
   candidate contrast ratios instead of guessing a luminance threshold, so a borderline
   colour can never end up with the worse of the two. */
const INK = "#101010"
const CREAM = "#fff9ee";
export function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((m, n) => n - m)
  return (hi + 0.05) / (lo + 0.05)
}
export function surfaceTone(hex) {
  const withCream = contrastRatio(hex, CREAM)
  const withInk = contrastRatio(hex, INK)
  return withCream > withInk ? "is-dark" : "is-light"
}

/* t = share of `to` (0 → `from`, 1 → `to`). Kept as a hex round-trip so the result can
   be dropped straight into a CSS custom property. */
export function mixHex(from, to, t) {
  const channel = (hex, i) => parseInt(String(hex || "").replace("#", "").slice(i, i + 2) || "0", 16)
  const share = Math.min(1, Math.max(0, t))
  const mixed = [0, 2, 4].map((i) =>
    Math.round(channel(from, i) * (1 - share) + channel(to, i) * share)
  )
  return `#${mixed.map((v) => v.toString(16).padStart(2, "0")).join("")}`
}

/* The most coloured tint of `accent` that still clears `min` against `surface`.
   The direction is decided by which text colour wins on the surface (cream on a dark
   plane, ink on a light one); the accent is then walked back toward it in 5% steps and
   the first pass is kept. A sun panel gets a warm brown secondary, a purple panel a
   light lilac — measured per slide instead of hand-picked per brand colour. */
export function tintOn(surface, accent, min = 4.5) {
  const toward = surfaceTone(surface) === "is-dark" ? CREAM : INK
  for (let step = 0; step <= 20; step++) {
    const tint = mixHex(accent, toward, step / 20)
    if (contrastRatio(tint, surface) >= min) return tint
  }
  return toward
}
