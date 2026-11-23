/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        ui: ['"Be Vietnam Pro"', "sans-serif"],
        display: ['"Bricolage Grotesque"', '"Be Vietnam Pro"', "sans-serif"],
      },
      fontSize: {
        xs: '12px',      /* --fs-xs: labels and kickers only — never body copy */
        sm: '14px',      /* --fs-sm: description, meta */
        md: '16px',      /* --fs-md: body copy */
        lg: '20px',      /* --fs-lg: product name, card title */
        xl: 'clamp(28px, 4vw, 44px)',   /* --fs-xl: section title */
        hero: 'clamp(40px, 7vw, 88px)', /* --fs-hero: hero / page headline */
      },
      lineHeight: {
        display: '1.12', /* --lh-display: Vietnamese stacked diacritics need room above cap */
        h2: '1.2',       /* --lh-h2 */
        body: '1.5',     /* --lh-body */
      },
      letterSpacing: {
        display: '-0.02em', /* --tracking-display: tighten large headlines */
        kicker: '0.2em',    /* --tracking-kicker: airy ALL CAPS labels */
      },
      colors: {
        // brand palette (used across custom styles)
        ink: "#1a1a1a",
        cream: "#fff7e3",
        "red-ink": "#b81f2b",
        "green-ink": "#156b3d",
        yellow: "#ffd233",
        purple: "#6b2fb3",
        flame: "#ff5a1f",
        clay: "#ea5b34",
        // shadcn-vue semantic colors -> CSS variables (oklch values in style.css)
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
    },
  },
  plugins: [],
}
