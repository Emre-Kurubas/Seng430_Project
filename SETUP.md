# 🛠️ Project Setup & Installation

Follow these instructions to get the **Healthcare ML Training Tool** running on your local machine.

## 📋 Prerequisites

Ensure you have the following installed before proceeding:
- **Node.js** (v18+ recommended)
- **Python** (v3.10+ recommended)
- **Git**

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/YourUsername/Seng430_Project.git
cd Seng430_Project
```

### 2. Backend Setup (FastAPI)
Navigate to the backend directory, set up a virtual environment, and install dependencies.

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run the backend server
uvicorn main:app --reload
```
*The backend API will be available at: `http://localhost:8000`*

### 3. Frontend Setup (React + Vite)
Open a new terminal, navigate to the frontend directory, install dependencies, and run the dev server.

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*The frontend application will be available at: `http://localhost:5173`*

---

## 🧪 Testing

*(Instructions for running unit and integration tests will be added here as the project develops.)*
