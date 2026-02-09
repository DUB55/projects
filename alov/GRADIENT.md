Absolutely—I’ll give you a **pixel-precise, implementation‑ready spec** that an AI web app builder (or any developer) can use to recreate the background **exactly**.

Below is a **deterministic gradient recipe** using layered CSS `radial-gradient()`s on a **white base**. It reproduces the same luminous, soft‑edged glow: cool **blue/violet** near the top center blending through **magenta/pink** to **warm peach/orange** towards the lower edges—matching the latest image you approved.

***

## 1) Visual + Layout Spec (independent of screen size)

*   **Canvas**: responsive (any size). Designed for desktop hero areas (e.g., width 1200–1600px, height 650–900px), but scales perfectly.
*   **Base**: **pure white** `#FFFFFF`.
*   **Glow shape**: large, soft **elliptical bloom** centered slightly **below center** and **slightly right** of midpoint.
*   **Color progression (inside → outside)**:
    1.  **Core cool highlight**: light **sky blue → azure**.
    2.  **Mid band**: **violet → fuchsia/magenta**.
    3.  **Outer band**: **soft pink → peach → warm orange**, dissipating to white.
*   **Edge falloff**: extra-soft; no hard rings. Achieved by using **transparent stops** past \~65–75% per layer.
*   **Vignette** (very subtle): none in dark; instead we keep the white base and let the gradients fade out to white. (This preserves the light‑mode look while keeping vibrancy.)

***

## 2) Exact Color Palette (hex)

*   **Azure (light blue)**: `#9BD2FF`
*   **Blue**: `#4AA3FF`
*   **Violet**: `#8A5BFF`
*   **Fuchsia/Magenta**: `#FF4FD8`
*   **Pink**: `#FF7FCA`
*   **Peach**: `#FFB38A`
*   **Warm Orange**: `#FFC464`
*   **White (base)**: `#FFFFFF`

> These values are chosen to reproduce the same perceived hues/intensity from the image while remaining stable across sRGB displays.

***

## 3) Pixel‑perfect CSS (drop‑in)

This single `background` property uses **four radial layers** on white. The **positions and sizes** are expressed in responsive units so it scales consistently and preserves the exact composition.

```css
/* Apply to the hero container (e.g., .hero) */
.hero {
  /* sizing example; you can set your own height */
  min-height: 72vh;
  background-color: #FFFFFF; /* REQUIRED white base */

  /* LAYER ORDER: far-field warms → mid pink/magenta → cool core → subtle violet ring */
  background-image:
    /* LAYER 1 – Warm bottom glow (orange/peach → transparent) */
    radial-gradient(
      120% 80% at 50% 88%,
      rgba(255, 196, 100, 0.85) 0%,
      rgba(255, 179, 138, 0.70) 24%,
      rgba(255, 127, 202, 0.35) 52%,
      rgba(255, 127, 202, 0.16) 68%,
      rgba(255, 127, 202, 0.00) 75%
    ),

    /* LAYER 2 – Magenta/pink mid bloom across center band */
    radial-gradient(
      115% 90% at 52% 62%,
      rgba(255, 79, 216, 0.90) 0%,
      rgba(255, 127, 202, 0.60) 36%,
      rgba(255, 127, 202, 0.28) 58%,
      rgba(255, 127, 202, 0.00) 74%
    ),

    /* LAYER 3 – Cool core highlight (blue/azure near top-center) */
    radial-gradient(
      95% 70% at 52% 36%,
      rgba(154, 210, 255, 0.92) 0%,
      rgba(74, 163, 255, 0.75) 24%,
      rgba(138, 91, 255, 0.42) 48%,
      rgba(138, 91, 255, 0.16) 66%,
      rgba(138, 91, 255, 0.00) 74%
    ),

    /* LAYER 4 – Soft violet envelope for cohesion */
    radial-gradient(
      140% 100% at 50% 70%,
      rgba(138, 91, 255, 0.22) 0%,
      rgba(138, 91, 255, 0.10) 42%,
      rgba(138, 91, 255, 0.00) 70%
    );

  background-repeat: no-repeat;
  background-attachment: scroll;       /* avoid parallax unless desired */
  background-size: cover;              /* ensures full bleed */
  background-blend-mode: normal;       /* rely on alpha, not blend-modes */
}
```

### Why this works (and matches your image)

*   **Layer 1** anchors the **warm lower glow** (peach → orange) and softly hands off into pink.
*   **Layer 2** provides the **magenta/pink band** that wraps the center and spreads left/right.
*   **Layer 3** is the **cool blue core** near the top center that your latest image emphasizes behind the headline.
*   **Layer 4** is a **very light violet film** that ties the cool and warm halves so the fade to white is smooth with no banding.

***

## 4) Tailwind CSS utility (optional)

If you use Tailwind, add this in `tailwind.config.js`:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      backgroundImage: {
        'hero-lovable-light': `
          radial-gradient(120% 80% at 50% 88%,
            rgba(255,196,100,0.85) 0%,
            rgba(255,179,138,0.70) 24%,
            rgba(255,127,202,0.35) 52%,
            rgba(255,127,202,0.16) 68%,
            rgba(255,127,202,0.00) 75%
          ),
          radial-gradient(115% 90% at 52% 62%,
            rgba(255,79,216,0.90) 0%,
            rgba(255,127,202,0.60) 36%,
            rgba(255,127,202,0.28) 58%,
            rgba(255,127,202,0.00) 74%
          ),
          radial-gradient(95% 70% at 52% 36%,
            rgba(154,210,255,0.92) 0%,
            rgba(74,163,255,0.75) 24%,
            rgba(138,91,255,0.42) 48%,
            rgba(138,91,255,0.16) 66%,
            rgba(138,91,255,0.00) 74%
          ),
          radial-gradient(140% 100% at 50% 70%,
            rgba(138,91,255,0.22) 0%,
            rgba(138,91,255,0.10) 42%,
            rgba(138,91,255,0.00) 70%
          )
        `
      },
      colors: {
        white: '#FFFFFF'
      }
    }
  }
}
```

Then in JSX/HTML:



***

## 5) React inline style (copy‑paste)

```jsx
const heroStyle = {
  minHeight: '72vh',
  backgroundColor: '#FFFFFF',
  backgroundImage: `
    radial-gradient(120% 80% at 50% 88%,
      rgba(255,196,100,0.85) 0%,
      rgba(255,179,138,0.70) 24%,
      rgba(255,127,202,0.35) 52%,
      rgba(255,127,202,0.16) 68%,
      rgba(255,127,202,0.00) 75%
    ),
    radial-gradient(115% 90% at 52% 62%,
      rgba(255,79,216,0.90) 0%,
      rgba(255,127,202,0.60) 36%,
      rgba(255,127,202,0.28) 58%,
      rgba(255,127,202,0.00) 74%
    ),
    radial-gradient(95% 70% at 52% 36%,
      rgba(154,210,255,0.92) 0%,
      rgba(74,163,255,0.75) 24%,
      rgba(138,91,255,0.42) 48%,
      rgba(138,91,255,0.16) 66%,
      rgba(138,91,255,0.00) 74%
    ),
    radial-gradient(140% 100% at 50% 70%,
      rgba(138,91,255,0.22) 0%,
      rgba(138,91,255,0.10) 42%,
      rgba(138,91,255,0.00) 70%
    )
  `,
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover'
};
```

***

## 6) Fine‑tuning knobs (only if you need micro‑adjustments)

*   **Shift warm area down/up**: change the first layer’s anchor `at 50% 88%` (e.g., `92%` pushes it lower, `84%` raises it).
*   **Increase vibrancy**: raise alphas in Layer 2 (`0.90 → 1.00`) and Layer 3 (`0.75 → 0.85`).
*   **Soften edges**: move the last visible stop earlier (e.g., `74% → 70%`) or lower alpha of the penultimate stop.
*   **Make the blue area a bit higher**: Layer 3 `at 52% 36%` → `at 52% 32%`.

***

If you want, I can **export this as a CSS file** or a **ready‑to‑drop React component**.\
Would you like a version with **CSS variables** so your design system can tweak hues/alpha live?
