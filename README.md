<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,50:6366f1,100:10b981&height=220&section=header&text=🏥%20HEALTH-AI&fontSize=60&fontAlignY=30&desc=ML%20Training%20Platform%20for%20Healthcare%20Professionals&descSize=18&descAlignY=52&animation=twinkling&fontColor=ffffff" width="100%" alt="HEALTH-AI Header" />

<br>

<h3>🌐 Try the Live Interactive Demo</h3>
<a href="https://seng430-project-5kbd.onrender.com">
<img src="https://img.shields.io/badge/🚀%20Launch%20Live%20Demo-22c55e?style=for-the-badge&logo=vercel&logoColor=white" alt="Launch Live Demo" />
</a>

<br><br>

**A production-grade, 7-step interactive ML training platform designed to teach healthcare professionals how to build, evaluate, and interpret machine learning models — with zero coding required.**

<br>

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Emre-Kurubas/Seng430_Project)
[![GitHub Wiki](https://img.shields.io/badge/GitHub-Wiki-EA4336?style=for-the-badge&logo=github)](https://github.com/Emre-Kurubas/Seng430_Project/wiki)
[![Figma Design](https://img.shields.io/badge/Figma-Wireframes-F24E1E?style=for-the-badge&logo=figma)](https://www.figma.com/design/08zEp7q7YnF9dxjbHF1X8W/HealthCareML?node-id=0-1&t=Ee9EAsGFmgRZm2Vq-1)

<br>

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=three.js&logoColor=white)
![AWS](https://img.shields.io/badge/AWS_CloudFront-FF9900?style=flat-square&logo=amazonaws&logoColor=white)

</div>

---

## ✨ Why HEALTH-AI?

> Traditional ML courses require coding skills that many clinicians don't have. **HEALTH-AI** bridges this gap by providing a visual, guided, no-code environment where healthcare professionals can experience the full ML lifecycle — from data exploration to ethical review — in the context of **real clinical scenarios**.

<table>
<tr>
<td width="50%">

### 🎯 Problem
- Healthcare professionals need to understand ML/AI to evaluate tools used in clinical practice
- Existing ML platforms require Python/R expertise
- No platform combines clinical context with ML education

</td>
<td width="50%">

### 💡 Solution
- **7-step guided pipeline** that mirrors the real ML workflow
- **20 clinical domains** with real medical datasets
- **Zero coding required** — visual, interactive, point-and-click
- **Clinical explanations** at every step

</td>
</tr>
</table>

---

## 🚀 The 7-Step ML Pipeline

Each step includes educational content, interactive components, and clinical context:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ① Clinical Context  →  Understand the medical problem & dataset    │
│  ② Data Exploration  →  Upload CSV, inspect features & statistics   │
│  ③ Data Preparation  →  Normalize, encode, handle missing values    │
│  ④ Model Selection   →  Choose & train ML model with live params    │
│  ⑤ Results           →  Confusion matrix, ROC, 6 key metrics        │
│  ⑥ Explainability    →  Feature importance & SHAP-like analysis     │
│  ⑦ Ethics & Bias     →  Fairness audit, subgroup analysis, cert     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

| Step | Name | Key Features |
|:----:|------|-------------|
| **1** | 🏥 Clinical Context | Domain-specific clinical question, why the problem matters, dataset source |
| **2** | 🔍 Data Exploration | CSV upload with PapaParse, auto-detect column types, missing value analysis, statistical summaries |
| **3** | 🔧 Data Preparation | Z-Score / Min-Max normalization visualization, label encoding demonstration, before/after comparison |
| **4** | 🧠 Model Selection | 6 ML algorithms with interactive tunable hyperparameters, real-time canvas visualizations, server-side training |
| **5** | 📊 Results Evaluation | Accuracy, Sensitivity, Specificity, Precision, F1, AUC-ROC with animated count-ups, confusion matrix, interactive threshold explorer |
| **6** | 💡 Explainability | Global feature importance chart, per-patient SHAP-like waterfall, domain-specific clinical sense-checks |
| **7** | ⚖️ Ethics & Bias | Subgroup fairness analysis, GDPR/HIPAA checklist, downloadable completion certificate |

---

## 🧠 Supported ML Algorithms

All 6 algorithms are trained **server-side** via a Node.js ML engine with label encoding, parameter validation, and graceful error handling:

<table>
<tr>
<td align="center" width="16.6%">
<br>
<img src="https://img.shields.io/badge/-KNN-16a34a?style=for-the-badge" /><br>
<b>K-Nearest Neighbors</b><br>
<sub>Distance-based classification with auto k-clamping</sub>
</td>
<td align="center" width="16.6%">
<br>
<img src="https://img.shields.io/badge/-SVM-0ea5e9?style=for-the-badge" /><br>
<b>Support Vector Machine</b><br>
<sub>Linear & RBF kernel with tunable C parameter</sub>
</td>
<td align="center" width="16.6%">
<br>
<img src="https://img.shields.io/badge/-DT-eab308?style=for-the-badge" /><br>
<b>Decision Tree</b><br>
<sub>CART with adjustable max depth (1–10)</sub>
</td>
</tr>
<tr>
<td align="center" width="16.6%">
<br>
<img src="https://img.shields.io/badge/-RF-f97316?style=for-the-badge" /><br>
<b>Random Forest</b><br>
<sub>Ensemble of 10–200 trees with bagging</sub>
</td>
<td align="center" width="16.6%">
<br>
<img src="https://img.shields.io/badge/-LR-ef4444?style=for-the-badge" /><br>
<b>Logistic Regression</b><br>
<sub>S-curve visualization with regularization</sub>
</td>
<td align="center" width="16.6%">
<br>
<img src="https://img.shields.io/badge/-NB-8b5cf6?style=for-the-badge" /><br>
<b>Naive Bayes</b><br>
<sub>Gaussian NB with Laplace smoothing</sub>
</td>
</tr>
</table>

---

## 🏥 20 Clinical Domains

The platform covers **20 real-world medical specialties**, each with a unique clinical question, curated dataset source, and domain-specific color theme:

<details>
<summary><b>Click to expand all 20 domains</b></summary>
<br>

| # | Domain | Clinical Question | Dataset Source |
|:-:|--------|------------------|---------------|
| 1 | ❤️ **Cardiology** | 30-day readmission risk after heart failure | Heart Failure Clinical Records |
| 2 | 🫁 **Radiology** | Pneumonia detection from clinical features | NIH Chest X-Ray metadata |
| 3 | 💧 **Nephrology** | Chronic kidney disease classification | UCI CKD Dataset |
| 4 | 🎀 **Oncology — Breast** | Malignant vs benign from cell nuclei | Wisconsin Breast Cancer |
| 5 | 🧠 **Neurology — Parkinson's** | Parkinson's detection from voice biomarkers | UCI Parkinson's Dataset |
| 6 | 🍬 **Endocrinology — Diabetes** | 5-year diabetes onset prediction | Pima Indians Diabetes |
| 7 | 🫀 **Hepatology — Liver** | Liver disease from blood tests | Indian Liver Patient Dataset |
| 8 | ⚡ **Cardiology — Stroke** | Stroke risk from demographics | Kaggle Stroke Prediction |
| 9 | 🧩 **Mental Health** | Depression severity from PHQ-9 | Kaggle Depression Dataset |
| 10 | 🌬️ **Pulmonology — COPD** | Exacerbation risk from spirometry | Kaggle COPD Dataset |
| 11 | 🩸 **Haematology — Anaemia** | Anaemia type classification | Kaggle Anaemia Dataset |
| 12 | 🔬 **Dermatology** | Skin lesion malignancy assessment | HAM10000 metadata |
| 13 | 👁️ **Ophthalmology** | Diabetic retinopathy severity grading | UCI Retinopathy Dataset |
| 14 | 🦴 **Orthopaedics — Spine** | Disc herniation from biomechanics | UCI Vertebral Column |
| 15 | 🚨 **ICU / Sepsis** | Sepsis onset from vital signs | PhysioNet Sepsis Dataset |
| 16 | 👶 **Obstetrics — Fetal Health** | Fetal status from cardiotocography | UCI Fetal Health Dataset |
| 17 | 💓 **Cardiology — Arrhythmia** | Arrhythmia detection from ECG | UCI Arrhythmia Dataset |
| 18 | 🔭 **Oncology — Cervical** | Cervical cancer risk screening | UCI Cervical Cancer |
| 19 | 🦋 **Thyroid / Endocrinology** | Thyroid function classification | UCI Thyroid Disease |
| 20 | 💊 **Pharmacy — Readmission** | Diabetic patient readmission risk | UCI Diabetes 130-US Hospitals |

</details>

---

## 🏗️ Tech Stack & Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐   │
│  │  Vite 7  │ │Tailwind 4│ │  Framer  │ │ Three.js │ │ Lucide  │   │
│  │  (build) │ │  (style) │ │  Motion  │ │   (3D)   │ │ (icons) │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────┘   │
│                                                                    │
│  20 Components · ErrorBoundary · Lazy Loading · Dark/Light Mode    │
├──────────────────────── fetch() ──────────────────────────────────┤
│                       BACKEND (Node.js)                            │
│  ┌──────────┐ ┌──────────────────────────────────────────────────┐ │
│  │ Express  │ │              ML ENGINE (mlEngine.js)             │ │
│  │  Server  │ │  ┌─────┐ ┌─────┐ ┌────┐ ┌────┐ ┌────┐ ┌─────┐    │ │
│  │  CORS    │ │  │ KNN │ │ SVM │ │ DT │ │ RF │ │ LR │ │ NB  │    │ │
│  │  (3001)  │ │  └─────┘ └─────┘ └────┘ └────┘ └────┘ └─────┘    │ │
│  └──────────┘ │  Label Encoding · k-Clamping · Error Recovery    │ │
│               └──────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────┤
│                     DEPLOYMENT (AWS)                               │
│           CloudFront CDN  ·  Render (Backend)                      │
└────────────────────────────────────────────────────────────────────┘
```

### Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| React | 19.2 | UI component library |
| Vite | 7.3 | Lightning-fast build tool |
| Tailwind CSS | 4.2 | Utility-first CSS framework |
| Framer Motion | 12.34 | Page transitions & micro-animations |
| Three.js + R3F | Latest | 3D DNA helix background animation |
| Lucide React | 0.574 | Medical-grade icon set |
| PapaParse | 5.5 | Client-side CSV parsing |

### Backend Dependencies

| Package | Purpose |
|---------|---------|
| Express + CORS | REST API server |
| ml-knn | K-Nearest Neighbors implementation |
| ml-cart | Decision Tree (CART) |
| ml-random-forest | Random Forest ensemble |
| ml-naivebayes | Gaussian Naive Bayes |
| ml-logistic-regression | Logistic Regression |

---

## 📂 Project Structure

```
Seng430_Project/
│
├── 📁 version4/                    # Current production version
│   ├── 📁 src/
│   │   ├── 📁 components/          # 20 React components
│   │   │   ├── ClinicalContext.jsx       # Step 1 — Clinical context & scenario
│   │   │   ├── DataExploration.jsx       # Step 2 — CSV upload & data analysis
│   │   │   ├── DataPreparation.jsx       # Step 3 — Normalization & encoding
│   │   │   ├── ModelSelection.jsx        # Step 4 — Algorithm selection & training
│   │   │   ├── ModelVisualizations.jsx   # Step 4 — Canvas-based model visualizations
│   │   │   ├── ResultsEvaluation.jsx     # Step 5 — Metrics & confusion matrix
│   │   │   ├── Explainability.jsx        # Step 6 — Feature importance & SHAP
│   │   │   ├── EthicsBias.jsx            # Step 7 — Fairness audit & certificate
│   │   │   ├── ErrorBoundary.jsx         # Global crash protection
│   │   │   ├── ColumnMapper.jsx          # Intelligent column role detection
│   │   │   ├── Header.jsx                # App header with theme toggle
│   │   │   ├── Stepper.jsx               # Pipeline step navigation
│   │   │   ├── DomainSelector.jsx        # 20-domain specialty picker
│   │   │   ├── OnboardingTour.jsx        # First-time user walkthrough
│   │   │   ├── UserGuideModal.jsx        # Comprehensive ML glossary & help
│   │   │   ├── StepQuiz.jsx              # Per-step knowledge check
│   │   │   └── ...                       # Background3D, DNA3D, Tooltip, Footer
│   │   ├── 📁 data/
│   │   │   └── specialties.js            # 20 clinical domain configurations
│   │   ├── 📁 utils/
│   │   │   └── mlEngine.js               # Frontend API client for ML training
│   │   ├── App.jsx                       # Main app with step routing
│   │   ├── main.jsx                      # Entry point with ErrorBoundary
│   │   └── index.css                     # Global styles & design system
│   │
│   ├── 📁 server/
│   │   ├── index.js                      # Express server (CORS, routes, health)
│   │   └── mlEngine.js                   # ML training engine (6 algorithms)
│   │
│   ├── vite.config.js
│   └── package.json
│
├── 📁 docs/                        # Architecture & testing documentation
│   ├── HealthCare - Architecture Design.pdf
│   ├── HealthCare - Domain Coverage Plan.pdf
│   ├── ML_Visualisation_Tool_Screenshot_Report.pdf
│   ├── Test_Execution_Update_All_Passed.pdf
│   └── Weekly report.pdf
│
└── README.md                       # ← You are here
```

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### 1️⃣ Clone & Install

```bash
git clone https://github.com/Emre-Kurubas/Seng430_Project.git
cd Seng430_Project/version4

# Install frontend
npm install

# Install backend
cd server && npm install && cd ..
```

### 2️⃣ Start Development

Open **two terminals**:

```bash
# Terminal 1 — Backend (port 3001)
cd version4/server
node index.js

# Terminal 2 — Frontend (port 5173)
cd version4
npm run dev
```

### 3️⃣ Open in browser

```
http://localhost:5173
```

### 🌍 Production Build

```bash
cd version4
npm run build   # Output → dist/
npm run preview # Preview production build locally
```

---

## 🛡️ Reliability & Error Handling

The platform implements **3-layer crash protection** to ensure the application never shows a white screen:

| Layer | Scope | What it Does |
|:-----:|-------|-------------|
| **1** | 🌐 Global | Top-level `ErrorBoundary` wraps entire app in `main.jsx` |
| **2** | 📦 Per-Step | Each of the 7 steps has its own `ErrorBoundary` — if one crashes, others keep working |
| **3** | ⚙️ Backend | ML engine has label encoding, k-value clamping, empty-dataset guards, and random-predictor fallback |

### Backend Safety Features
- ✅ **Label Encoding** — Categorical variables (gender, smoker, etc.) are automatically encoded to numeric values
- ✅ **k-Parameter Clamping** — KNN's k is auto-reduced if it exceeds the training set size
- ✅ **Empty Dataset Guard** — `trainTestSplit` guarantees at least 1 example per set
- ✅ **Graceful Fallback** — On crash, returns honest random predictions instead of fake 100% accuracy

---

## 🎨 Design & UX Features

- 🌓 **Dark / Light mode** with smooth CSS transitions
- ✨ **Animated floating particles** themed per clinical domain
- 🎯 **Parallax background blob** following cursor movement
- 📱 **Fully responsive** — works on mobile, tablet, and desktop
- ⌨️ **Keyboard navigation** — Arrow keys to move between steps
- 🎓 **Onboarding tour** for first-time users
- 📖 **User Guide Modal** with 70+ ML terminology definitions
- 🏆 **Completion certificate** (PDF download) upon finishing all steps
- ♿ **ARIA landmarks** & semantic HTML for accessibility
- 💾 **Auto-save progress** to localStorage

---

## 👥 Team & Roles

<table>
<tr>
<td align="center" width="25%">
<br>
<b>Cem Özal</b><br>
<sub>Lead Developer / UX Designer</sub>
</td>
<td align="center" width="25%">
<br>
<b>Sertaç Ataç</b><br>
<sub>QA / Documentation Lead / Scrum Master</sub>
</td>
<td align="center" width="25%">
<br>
<b>Can Eltayeb</b><br>
<sub>Developer</sub>
</td>
<td align="center" width="25%">
<br>
<b>Emre Kurubaş</b><br>
<sub>Product Owner</sub>
</td>
</tr>
</table>

---

## 📎 Course Information

**SENG 430 — Software Engineering Project**

This project was developed as part of the SENG 430 course, following Agile/Scrum methodology across 5 sprints (Weeks 6–10). Sprint artifacts, weekly reports, and test documentation are available in the [`docs/`](docs/) directory.

---

## 📄 License

This project was developed for educational purposes as part of a university course.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:10b981,50:6366f1,100:0f172a&height=120&section=footer&animation=twinkling" width="100%" alt="Footer" />

<sub>Built with ❤️ for healthcare professionals who want to understand AI</sub>

</div>
