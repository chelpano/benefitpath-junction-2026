# BenefitPath

BenefitPath helps foreign residents and families in Finland navigate public support information. Describe a situation in English to search current official guidance and receive a concise summary, possible support options, factors to check, missing information, and suggested next steps with links to sources.

## Run locally

Requirements: Node.js 20 or newer, plus Exa and Google Gemini API keys.

1. Open PowerShell in the repository and install backend dependencies:

   ```powershell
   cd backend
   npm ci
   ```

2. Create a local environment file from the example, then add your own keys:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

   Set `EXA_API_KEY` and `GEMINI_API_KEY`. Leave `ALLOWED_ORIGIN` empty for local development.

3. Start the API:

   ```powershell
   npm start
   ```

   The backend runs at `http://localhost:3000` and reports healthy at `/health`.

4. Open `frontend/index.html` in a browser. The local `frontend/config.js` points the UI to `http://localhost:3000` by default.

Never commit your real `.env` file or API keys. `.env` files and `node_modules` are ignored by Git.

## Publish online

The repository is configured for a static frontend on GitHub Pages and a Node.js API on Render. GitHub Pages serves the HTML/CSS/JavaScript; Render runs Exa and Gemini requests. The GitHub Actions workflow publishes `frontend/` and writes the API URL into the generated `config.js` during deployment.

### 1. Deploy the API on Render

1. Push the repository to GitHub.
2. Sign in to Render and create a **Blueprint** from this repository (`New` → `Blueprint`). Render reads `render.yaml` from the repository root.
3. The Blueprint creates the `benefitpath-junction26-api` web service in Frankfurt on Render’s free plan. During setup, enter your own `EXA_API_KEY` and `GEMINI_API_KEY` when Render prompts for them. These values stay in Render and must never be added to GitHub.
4. After deployment finishes, copy the service’s public HTTPS URL, for example `https://your-service.onrender.com`.

The free web service is suitable for a demo, but Render spins it down after 15 minutes without traffic. The first request after an idle period can take about a minute while it starts again. See [Render’s free service limitations](https://render.com/docs/faq).

### 2. Publish the frontend with GitHub Pages

1. In GitHub, open **Settings → Pages** and set the source to **GitHub Actions**.
2. Open **Settings → Secrets and variables → Actions → Variables**. Add a repository variable named `BENEFITPATH_API_BASE`; set its value to the Render service’s base URL without `/analyze` (for example, `https://your-service.onrender.com`). This URL is public configuration, not a secret.
3. In **Settings → Pages → Build and deployment**, confirm the source is **GitHub Actions**. Push a change under `frontend/` or run the **Deploy BenefitPath to GitHub Pages** workflow from the Actions tab.
4. When the workflow succeeds, the project site is available at:

   `https://chelpano.github.io/benefitpath-junction-2026/`

The Render Blueprint allows browser requests from `https://chelpano.github.io`. If the GitHub Pages account or site origin changes, update `ALLOWED_ORIGIN` in `render.yaml` and redeploy the backend.

## How it works

- Exa searches Kela, Suomi.fi, and Job Market Finland, then retrieves source content.
- Gemini returns a compact structured answer grounded in those sources.
- Each source citation opens the matching official page.
- If Gemini is unavailable, the app still displays the Exa source links.

BenefitPath provides general information only. It does not determine eligibility or replace a decision by Kela or another public authority.

## Technology

- Exa Search and Contents APIs
- Google Gemini structured output
- Node.js backend
- HTML, CSS, and JavaScript frontend

## Hackathon

Built for the Exa Challenge at Junction 2026.
