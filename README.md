# 🏥 SENG 430 – Healthcare ML Training Tool

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/Emre-Kurubas/Seng430_Project)
[![GitHub Wiki](https://img.shields.io/badge/GitHub-Wiki-orange?logo=github)](https://github.com/Emre-Kurubas/Seng430_Project/wiki)

> **A 7-step Machine Learning web application supporting 20 clinical domains.**

This system empowers healthcare professionals and students to seamlessly upload datasets, preprocess data, train ML models, and evaluate results through an intuitive, interactive UI.

---

## 🚀 Tech Stack

- **Frontend:** React + Vite (Fast, modern UI)
- **Backend:** FastAPI (High-performance Python API)
- **Machine Learning:** Scikit-learn, Pandas, NumPy

---

## 📂 Repository Structure

```text
Seng430_Project/
│
├── frontend/             # React + Vite application (UI components, API integration)
├── backend/              # FastAPI backend (ML models, data processing, endpoints)
├── docs/                 # Additional project documentation
├── wiki/                 # Local copy of GitHub Wiki pages (Home, Team, Notes)
├── README.md             # Project overview and instructions
└── SETUP.md              # Local environment setup and run guide
```

---

## 📌 Project Goals

The objective of this project is to build an accessible ML workflow tool for the healthcare sector:
- **Implement 6 core ML models:**
  - K-Nearest Neighbors (KNN)
  - Support Vector Machines (SVM)
  - Decision Tree
  - Random Forest
  - Logistic Regression
  - Naive Bayes
- **Support 20 distinct clinical domains** configured for diverse healthcare datasets.
- **Provide a full 7-step ML workflow** from data upload to model evaluation.
- **Generate a downloadable certificate** upon the successful completion of a training module.

---

## 🌿 Branching Strategy & Protection Rules

We strictly follow a feature-branch workflow to maintain code quality:

- **`main`** → Protected production branch. **Direct commits are not allowed.**
- **`feature/US-XXX`** → Individual user story/feature branches.

### Workflow:
1. Create a new branch from `main` (e.g., `git checkout -b feature/US-001-login`).
2. Commit your changes.
3. Push to GitHub and open a **Pull Request (PR)** against `main`.
4. Wait for at least **1 approval** from a team member.
5. Merge the PR and delete the feature branch.

*(Note: Branch protection rules are configured on GitHub to enforce PR reviews before merging into `main`.)*

---

## 👥 Team & Roles

| Name | Role |
| :--- | :--- |
| **Cem Özal** | Lead Developer |
| **Sertaç Ataç** | QA / Documentation Lead |
| **Can Eltayeb** | Developer Scrum Master |
| **Emre Kurubaş** | Product Owner |

> 📖 **Read more about our team on the [Wiki Team Page](https://github.com/Emre-Kurubas/Seng430_Project/wiki/Team.md)**

---

## 📎 Course Information

**SENG 430** – Software Engineering Project
