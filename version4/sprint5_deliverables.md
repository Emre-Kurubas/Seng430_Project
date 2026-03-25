# SPRINT 5: Final Polish, Usability Testing & Deployment Handover

## 1. Usability Testing (Protocol & Fix Log)
### Participant Profile
* **Target Audience:** Non-computer-science adult with university-level education.
* **Objective:** Ensure the interface is self-explanatory, clinical plain-language translations are effective, and the end-to-end flow is completely usable without developer intervention.

### Task Assessment & Times
| Task | Description | Success Criterion | Result |
|---|---|---|---|
| T1 | Open tool, switch domains in pill bar | Content updates, no errors | Pass (12s) |
| T2 | Upload CSV & open Column Mapper | Accepted, schema opens | Pass (45s) |
| T3 | Validate columns & proceed to Step 3 | Clicks save, advances | Pass (20s) |
| T4 | Apply prep settings | Success banner appears | Pass (30s) |
| T5 | Train KNN model | Metrics & confusion matrix render | Pass (65s) |
| T6 | Review feature importance | Chart renders with plain-language | Pass (15s) |
| T7 | Open Ethics tab & download PDF | Bias checks out, PDF saved | Pass (40s) |

### Usability Bug Fix Log
* **Issue 1:** Users did not notice the "Reset" button when they needed to start over.
  * *Fix:* Added two-step animation to reset button (`Reset` -> `Sure?`) to prevent accidental clicks while increasing discoverability.
* **Issue 2:** Confusion around what "Normalisation" meant in Step 3.
  * *Fix:* Added real-time animated bar charts showing exactly how raw data values are scaled to 0-1 or Z-scores, giving immediate visual feedback.
* **Issue 3:** Screen readers couldn't navigate the Step 1 Domain Selector.
  * *Fix:* Added `role="tablist"`, `role="tab"`, and `aria-selected` to the domain pills and stepper bar.

## 2. Code Maintainability & Documentation
* **Target:** ≥ 80% functions documented.
* **Status:** Achieved.
* **Details:** We have implemented comprehensive JSDoc comments (`/** ... */`) across the codebase.
  * `mlEngine.js`: Documented data prep, splitting, evaluation, and training pipelines.
  * `server/index.js`: Express endpoints are fully documented with param and return types.
  * React Components: Documented props for `App`, `Header`, `DomainSelector`, `DataExploration`, `DataPreparation`, and `ColumnMapper`.

## 3. Production Build & Lighthouse Audit
We built the app (`npm run build`) measuring Vite bundle size and chunking. 
Lazy loading (`React.lazy` + `Suspense`) has been applied to heavy components (ModelSelection, ResultsEvaluation, Explainability, EthicsBias).

* **Performance:** 92/100 (Improved via Route-level Code Splitting)
* **Accessibility:** 100/100 (ARIA landmarks, semantic `<main>`, `<header>`, proper colour contrast ratios applied over dynamic domain colours).
* **SEO:** 100/100 (Added comprehensive `<meta>` tags, open graph tags, and a `<noscript>` fallback).

## 4. Docker Deployment Handover
The application has been fully containerised for the Week 10 Jury Presentation.

### Architecture
* **Frontend:** Nginx container serving a built Vite static bundle.
* **Backend:** Node.js Express server container running the ML engine and PDF generator.
* **Reverse Proxy:** Nginx acts as an entry point, routing `/` to the frontend and `/api/` to the backend.

### Running the App
```bash
docker-compose up --build -d
```
1. Wait approx ~30 seconds for npm installs and vite builds to execute inside the Docker context.
2. The frontend is accessible at: `http://localhost:3000`
3. The backend is accessible internally and handles `/api/` calls.

This completes all requirements for Sprint 5. The project is locked, performant, and ready for final presentation.
