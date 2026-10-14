# Laterware

Ukrainian-language website for Laterware, a web studio offering business cards, landing pages, multi-page sites, and online stores. Its premium visual system pairs Cormorant Garamond headlines with Plus Jakarta Sans, a teal accent, glass panels, and a matching navigation rail.

## Run locally

```sh
npm install
npm run dev
```

The contact form sends through EmailJS. Copy `.env.example` to `.env.local` and set `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and `VITE_EMAILJS_PUBLIC_KEY`. The request includes `subject` (`Нова заявка на розробку сайту — Laterware`) and `request_type` (`Заявка на розробку сайту`) so it is identified as a website-development inquiry, not a portfolio message. In the EmailJS dashboard, set the template subject to `{{subject}}` and update the template body to use `{{request_type}}`, `{{name}}`, `{{contact_method}}`, `{{contact_value}}`, `{{email}}`, and `{{message}}`. A static subject/body configured in EmailJS will not be overridden by values sent from the website. The local EmailJS configuration is ignored by Git. Configure the same values in the deployment environment for the production form.

Run `npm test` for the geometry and camera tests and `npm run build` for a production build. The static build is written to `dist/`.

## Spiral and navigation

`src/lib/fibonacciLayout.ts` builds a tightly packed Fibonacci spiral for the exact number of pages. Each page occupies a tile, so using fewer or more pages does not leave empty slots. The largest page sits at the outside, with smaller pages turning inward. On phones the layout continues downward; page and camera rotations keep the active page upright.

The camera fits the active page to the shorter viewport dimension and anchors it to the top-left, while following one smooth path through the spiral and turning a quarter-turn per page. Tile geometry stays fixed while the camera moves, so the active page and its neighbors retain their Fibonacci placement. Only the active page and its immediate neighbors mount page content; farther tiles show only a closed shutter, with no hidden images or form controls loaded. A directional shutter reveals content as a page becomes a neighbor and closes before that content is unmounted. Wheel, touch, keyboard, navigation rail, and hash links share the same navigation state.

Each page has its own component in `src/components/pages/`. Page kinds, content models, UI text enums, and typed page/content constants are maintained separately in `src/models/`.
