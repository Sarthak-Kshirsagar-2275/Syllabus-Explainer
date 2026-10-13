# Syllabus Explainer plan

## Product direction

Syllabus Explainer is a calm academic companion for university students who need a confusing topic translated into plain language without losing accuracy.

## Design system

- Design movement: editorial academic minimalism with soft, modern study-tool details.
- Core principles: immediate clarity, low cognitive load, warm confidence, and readable hierarchy.
- Color philosophy: white and pale mint create a clean study surface; teal signals trust and action; coral marks guidance and progress.
- Layout paradigm: a focused editorial hero flows into a two-panel workspace rather than a busy dashboard.
- Signature elements: angled teal spark mark, numbered section labels, and rounded paper cards with subtle green shadows.
- Interaction philosophy: one obvious primary action, inline feedback, keyboard shortcut support, and no unnecessary steps.
- Animation: restrained hover lift and a small loading ellipsis; motion communicates progress without distraction.
- Typography: Newsreader for the expressive headline, DM Sans for highly legible UI and body copy.
- Brand essence: “A clearer route through difficult coursework.” Personality: patient, intelligent, encouraging.
- Brand voice: friendly and direct. Example lines: “What are you stuck on?” and “Here’s the simple version.”
- Wordmark/logo: a small angled teal tile containing a four-point spark beside the editorial wordmark.
- Signature brand color: deep study teal `#2D7769`.

## Implementation

- `frontend/` is a static HTML/CSS/JavaScript client.
- `backend/server.js` is the only Gemini client and exposes `POST /api/explain`.
- `dotenv` loads `GEMINI_API_KEY` server-side; CORS allows only the configured local frontend origin.
- The frontend displays loading, empty, copy, validation, network, and API error states.
