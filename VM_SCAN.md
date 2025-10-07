# TradrXBridge VM scan

This report inventories the current static landing-page environment that ships with the TradrXBridge virtual machine snapshot.

## File system inventory
- `index.html` – semantic markup for the entire landing experience, organized into anchored sections for navigation.
- `style.css` – global design tokens, layout primitives, component styles, and responsive adaptations.
- `script.js` – client-side controllers for navigation, animations, counters, and form validation.
- `README.md` – project overview and usage guidance.
- `ENVIRONMENT.md` – high-level repository map and workflow notes.
- `package.json` – project metadata with placeholder `npm test` script for CI compliance.

## HTML architecture (`index.html`)
- **Structural scaffolding**: HTML5 document with `lang="en"`, descriptive metadata, favicon placeholder, and stylesheet/script references.
- **Skip link**: `a.skip-link` provides keyboard shortcut to the main content for accessibility.
- **Header**: Sticky header containing logo, nav list, and dual CTA buttons. Mobile state uses `button#menu-toggle` to toggle `data-open` state.
- **Hero section**: Intro copy, primary and secondary CTAs, trust badges, and animated KPI metrics using `.metric` components.
- **Platform grid**: Cards describing routing, surveillance, compliance, and analytics capabilities; uses `.feature-card` styling.
- **Outcomes spotlight**: Checklist of benefits and KPI panel illustrating latency, resilience, and retention improvements.
- **Workflow timeline**: Ordered steps (`.workflow-step`) representing ingest→decide→execute→assure lifecycle with numbered badges.
- **Integrations gallery**: Resource cards and integration list, each with icons, descriptions, and CTA links.
- **Insights & research**: Downloadable toolkit list and callouts for whitepapers, benchmarks, and webinars.
- **Contact form**: Validated inputs (name, email, firm, role) with inline error containers, success message region, and compliance note.
- **Footer**: Secondary navigation, compliance text, and dynamically injected year placeholder.

## CSS system (`style.css`)
- **Token layer**: `:root` variables for colors, gradients, typography scales, spacing, radii, shadows, and transition timings.
- **Base reset**: `*`, `html`, and `body` rules normalize box sizing, background, and default text rendering.
- **Layout utilities**: `.container`, `.grid`, `.stack`, `.cluster`, and `.section-heading` handle consistent spacing and breakpoints.
- **Navigation styles**: `.site-header`, `.nav-list`, `.menu-toggle`, and `.mobile-nav` define sticky behavior and mobile transitions.
- **Hero presentation**: `.hero`, `.hero-content`, `.metric-board`, and `.cta-group` manage responsive hero layout and animations.
- **Card components**: `.feature-card`, `.resource-card`, `.integration-card` share padding, elevation, and hover treatments.
- **Timeline visuals**: `.workflow`, `.workflow-step`, `.workflow-connector` craft the sequential flow with connecting lines.
- **Form styling**: `.form-grid`, `.input-group`, `.form-status`, and `.submit-button` deliver accessible focus states and validation cues.
- **Animations & states**: `.reveal`, `.reveal-visible`, `.metric[data-animated]`, and `@keyframes float` orchestrate entry and hover feedback.
- **Responsive behavior**: Media queries at 1200px, 992px, 768px, and 576px adjust grid columns, typography, and navigation layout.

## JavaScript behaviors (`script.js`)
- **Mobile menu controller**: Toggles `aria-expanded`/`data-open` states and traps focus until dismissal via escape key or link click.
- **Smooth scrolling**: Enhances anchor navigation with `scrollIntoView` and offsets for the sticky header.
- **Intersection observers**:
  - Reveal observer adds `.reveal-visible` when sections enter viewport.
  - Metric observer animates counters using `requestAnimationFrame` easing when metrics become visible.
- **Counter animation**: `animateValue` helper increments numbers toward targets with formatting for decimals and suffixes.
- **Form validation**: Checks required fields, email pattern, and toggles success/error states with accessible messaging.
- **Utility bootstrapping**: Initializes observers on DOMContentLoaded and updates footer year dynamically.

## Operational notes
- Open `index.html` directly in a browser to preview; no build steps required.
- Run `npm test` to satisfy automation; command outputs a stub message confirming absence of a test suite.
- Recommended follow-ups: connect form submissions to backend, add analytics instrumentation, and convert static assets into a componentized framework if needed.

