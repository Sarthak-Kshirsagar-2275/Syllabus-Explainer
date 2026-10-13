Syllabus Explainer plan

Product direction
Syllabus Explainer is a calm academic companion for university students who need a confusing topic translated into plain language without losing accuracy. It now bridges the gap between static text and interactive spatial computing by providing dynamic 3D visualizations alongside academic explanations.

Design system
• Design movement: editorial academic minimalism with soft modern study tool details.
• Core principles: immediate clarity, low cognitive load, warm confidence, and readable hierarchy.
• Color philosophy: white and pale mint create a clean study surface; teal signals trust and action; coral marks guidance and progress.
• Layout paradigm: a focused editorial hero flows into a two panel workspace rather than a busy dashboard.
• Signature elements: angled teal spark mark, numbered section labels, and rounded paper cards with subtle green shadows.
• Interaction philosophy: one obvious primary action, inline feedback, keyboard shortcut support, and no unnecessary steps.
• Animation: restrained hover lift and a small loading ellipsis; motion communicates progress without distraction.
• Typography: Newsreader for the expressive headline, DM Sans for highly legible UI and body copy.
• Brand essence: A clearer route through difficult coursework. Personality: patient, intelligent, encouraging.
• Brand voice: friendly and direct. Example lines: What are you stuck on? and Here is the simple version.
• Wordmark logo: a small angled teal tile containing a four point spark beside the editorial wordmark.
• Signature brand color: deep study teal #2D7769.

Implementation
• Frontend is a static HTML CSS JavaScript client deployed on Vercel.
• Features a dynamic WebGL context using Three.js to render 3D geometries based on spatial flags.
• Backend server.js is the Express server deployed on Vercel Serverless Functions exposing POST /api/explain.
• The AI integration utilizes the Groq SDK and forces a strict JSON schema to return both markdown text and a spatial visualization flag.
• Upstash Redis acts as a distributed caching layer to bypass redundant network calls and reduce latency.
• Environment configuration loads GROQ_API_KEY, UPSTASH_REDIS_REST_URL, and UPSTASH_REDIS_REST_TOKEN securely on the server side.
• The frontend manages loading, empty, validation, network error states, and strict memory management for the 3D canvas to prevent memory leaks.