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
export function surfaceTone(hex) {
  const l = relativeLuminance(hex)
  const ratio = (a, b) => {
    const [hi, lo] = [a, b].sort((m, n) => n - m)
    return (hi + 0.05) / (lo + 0.05)
  }
  const withCream = ratio(l, relativeLuminance(CREAM))
  const withInk = ratio(l, relativeLuminance(INK))
  return withCream > withInk ? "is-dark" : "is-light"
}
