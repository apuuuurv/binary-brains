# 🌾 AgriSense: Intelligent Scheme Discovery Platform

AgriSense is a comprehensive platform designed to empower farmers by providing intelligent scheme discovery, AI-driven document verification, and a community-driven story platform. Developed by **Team Binary Brains**.

---

## 🚀 Key Features

- **🔍 Intelligent Scheme Discovery**: Personalized government scheme recommendations based on farmer profiles.
- **📄 AI Document Verification**: Automated verification of essential documents using advanced ML (OCR & Computer Vision).
- **💬 Farmer Chatbot**: An AI-powered assistant to answer agricultural queries and guide farmers.
- **🌟 Community Stories**: A platform for farmers to share success stories and learn from each other.
- **🧙 Profile Wizard**: Intuitive step-by-step profile setup for localized recommendations.
- **🛠️ Admin Panel**: Robust control center for managing farmers, schemes, and system monitoring.
- **🎭 Premium UI**: Modern, animated interface with dark mode support, smooth transitions, and high-quality 3D elements.

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS + Shadcn UI
- **Animations**: Framer Motion, GSAP, TSParticles
- **3D Graphics**: Three.js (React Three Fiber)
- **State/Routing**: React Router DOM, React Hooks

### **Backend**
- **Framework**: FastAPI (Python)
- **Authentication**: JWT-based secure auth (Google & Email)
- **Databases**: 
  - **MongoDB**: Primary store for user profiles, stories, and dynamic data.
  - **SQLite/SQLAlchemy**: Used for structured scheme data and monitoring.
- **AI/ML**: 
  - **OCR**: Tesseract, OpenCV
  - **Models**: Scikit-Learn, LightGBM, Torch (CNNs for document verification)
  - **LLM Integration**: Groq via OpenAI SDK for the Chatbot.

---

## 📂 Project Structure

```text
binary-brains/
├── backend/                # FastAPI Application
│   ├── app/                # Core logic, APIs, and ML models
│   ├── scripts/            # Database seeding and utility scripts
│   ├── uploads/            # Temporary storage for document processing
│   └── requirements.txt    # Python dependencies
├── frontend/               # React + Vite Application
│   ├── src/                # Components, Pages, and Assets
│   ├── public/             # Static assets
│   └── package.json        # Node.js dependencies
└── README.md               # Main project documentation
```

---

## ⚙️ Local Setup

### **Backend Requirements**
1.  Python 3.10+
2.  MongoDB instance (local or Atlas)
3.  Tesseract OCR installed on the system

### **Backend Setup**
1. Navigate to the `backend` directory.
2. Create a `.env` file based on the environment variables required (see `backend/.env` for reference).
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### **Frontend Setup**
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🏆 Developed By
**Team Binary Brains**
- *Innovating Agriculture through Technology.*
