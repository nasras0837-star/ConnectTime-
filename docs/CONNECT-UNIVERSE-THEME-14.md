# Connect Universe — Theme 14

## Design intent
A premium, energetic global community identity built around a midnight-navy canvas, electric-blue interaction color, violet depth, cyan highlights and restrained magenta accents. Preserve Connect's existing globe/CT brand mark and the established product functionality.

## Design tokens
- Background: `#080D1F`
- Surface: `#121B35`
- Raised surface: `#182444`
- Primary: `#3478FF`
- Secondary: `#8157FF`
- Cyan accent: `#24D9E8`
- Magenta accent: `#E65BFF`
- Primary text: `#F5F7FF`
- Muted text: `#AEBBD8`

## Application
- Next.js app: global theme tokens and shared component overrides in `app/globals.css`, so route-level experiences inherit the same design language.
- GitHub Pages homepage: `docs/index.html` receives matching hero, navigation, card, feed, call-to-action and footer treatments.
- Markets page: `docs/markets.html` receives matching page, panel, form, table and responsive treatments.

## Interaction and accessibility
- Keep existing routes, forms, authentication, media controls, and backend integrations unchanged.
- Maintain visible keyboard focus with a high-contrast cyan outline.
- Respect `prefers-reduced-motion`.
- Keep responsive layouts and readable contrast on dark surfaces.
- Avoid introducing new dependencies or external scripts.

## Validation
This change is CSS-only. Run the existing project checks before merge:
`npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
