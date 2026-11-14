# BenefitPath

BenefitPath helps foreign residents and families in Finland find their way through public support information. Describe a situation in English to search current guidance from official Finnish sources and receive a plain-language summary with practical next steps and numbered links.

## What it does

- Searches Kela, Suomi.fi and Job Market Finland with Exa.
- Retrieves page content and asks Gemini to explain relevant information in simple English.
- Shows numbered citations that match the official source cards.
- Keeps source links visible when the AI summary is unavailable.
- Provides informational guidance only; it does not decide eligibility or replace an authority's decision.

## Run locally

Requirements: Node.js 20 or newer and API keys for Exa and Google Gemini.

1. Install backend dependencies:

   ```sh
   cd backend
   npm install
   ```

2. Create `backend/.env` from the template and add your own API keys:

   ```sh
   cp .env.example .env
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env` from the `backend` folder.

   ```env
   EXA_API_KEY=your_exa_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. Start the backend from `backend`:

   ```sh
   npm start
   ```

4. Open `frontend/index.html` in a browser. The local frontend sends requests to `http://localhost:3000`.

Never commit your real `.env` file or share API keys. The repository ignores `.env` files and `node_modules`.

## Technology

- Exa Search and Contents APIs for current web research
- Google Gemini for grounded explanations
- Node.js backend with a dependency-light HTML, CSS and JavaScript frontend

## Hackathon

Built for the Exa Challenge at Junction 2026.
