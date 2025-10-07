# TradrXBridge

Marketing landing page for the fictional TradrXBridge institutional trading platform. The site introduces the product story, highlights quantifiable outcomes, and provides a validated request form for demos.

## Highlights

- Hero section with animated metrics, dual call-to-action buttons, and quick value framing.
- Platform, outcomes, workflow, and resource sections built with responsive cards and checklists.
- Smooth-scrolling anchored navigation with a mobile menu and accessible skip link.
- Demo request form with inline validation, success messaging, and semantic markup.
- Viewport-triggered content reveals and data counters powered by the intersection observer API.

## Project structure

```
index.html   # Markup for all sections, navigation, and form
style.css    # Visual system, layout primitives, responsive behavior
script.js    # Navigation controls, smooth scroll, animations, form validation
package.json # Metadata with placeholder npm script
```

## Getting started

1. Clone the repository or download the source.
2. Open `index.html` directly in a browser, or serve the folder with any static file server.

## Available scripts

No dependencies are required, but an npm script is provided for CI friendliness:

```bash
npm install   # optional – installs nothing but satisfies automated workflows
npm test      # prints that automated tests are not configured for this static site
```

You can tailor the content, styles, or form handling to integrate with production systems.
