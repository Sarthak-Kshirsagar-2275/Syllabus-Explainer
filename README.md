# Syllabus Explainer

A clean, student-friendly web app that turns confusing lecture topics into clear explanations using the Gemini API.

## Project structure

```text
syllabus-explainer/
├── backend/
│   ├── .env                 
│   ├── .gitignore
│   ├── package.json
│   └── server.js
└── frontend/
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

## Setup and run

Requires Node.js 18+.

```bash
cd syllabus-explainer/backend
npm install
npm run dev
```

In a second terminal, serve the frontend from its own directory:

```bash
cd syllabus-explainer/frontend
npx serve -l 5500
```

Open <http://localhost:5500>.

If you prefer Python for the static frontend server:

```bash
cd syllabus-explainer/frontend
python3 -m http.server 5500
```

## Security notes

- The browser only calls `http://localhost:8080/api/explain`.
- The Gemini API key is read by the Node.js backend from `backend/.env` and never sent to the browser.
- `backend/.env` is ignored by Git. Keep it private and use `.env.example` when sharing configuration.
- The backend validates the input length and returns user-friendly errors.

## API

`POST /api/explain`

```json
{ "text": "Explain photosynthesis" }
```

Response:

```json
{ "explanation": "..." }
```

`GET /api/health` returns server and Gemini configuration status without revealing the API key.
