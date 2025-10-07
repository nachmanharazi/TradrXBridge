# TradrXBridge environment overview

## Repository layout
- `index.html` – marketing page with hero, platform overview, outcome metrics, workflow, resources, and contact sections.
- `style.css` – design system with color tokens, responsive grid utilities, cards, panels, and form styling.
- `script.js` – client-side behaviors covering navigation toggling, smooth scrolling, viewport animations, counter effects, and form validation.
- `package.json` – metadata that exposes the placeholder `npm test` script for CI compatibility.

## Section map
### index.html
1. **Header & navigation** – sticky header with brand mark, anchored links, mobile toggle, and primary demo CTA.
2. **Hero** – value positioning with animated latency/compliance/retention metrics and dual CTAs.
3. **Platform** – feature cards describing routing, surveillance, and reporting capabilities.
4. **Outcomes** – checklist describing benefits alongside animated KPI data panel.
5. **Workflow** – lifecycle timeline covering ingest, decide, execute, and assure phases.
6. **Resources** – insight cards and a downloadable toolkit list for market structure teams.
7. **Contact** – validated demo request form paired with expectation-setting bullet list.
8. **Footer** – supporting navigation links and dynamic copyright year.

### style.css highlights
- **CSS variables** set the palette, typography, spacing, shadows, and transition speeds.
- **Layout primitives** include fluid containers, split grids, card styling, and timeline visuals.
- **Interactive states** provide hover/focus feedback for buttons, cards, resource links, and timeline steps.
- **Responsive rules** adjust spacing, stacking, and navigation behavior for tablets and small screens.

### script.js highlights
- **Navigation control** toggles the mobile menu and closes it after navigation interactions.
- **Smooth scrolling** animates anchor navigation and resource button behavior.
- **Intersection observers** trigger reveal animations and metric counter updates when elements enter the viewport.
- **Form validation** enforces required fields, email formatting, inline error messages, and success feedback.
- **Utility helpers** include easing-based number animation and current-year footer injection.

## Workflow tips
1. Open `index.html` in any browser—no build step is required.
2. Use `npm test` to satisfy CI checks; it prints that automated tests are not configured.
3. Extend functionality by wiring the form to a backend service or integrating analytics.
