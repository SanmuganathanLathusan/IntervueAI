# 🚀 IntervueAI - Master Your Career Narrative

[![Demo](https://img.shields.io/badge/Demo-Watch%20Now-red?style=for-the-badge&logo=youtube)](https://www.youtube.com/watch?v=nTuEt7aevcs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)

**IntervueAI** is an elite AI-driven interview simulation and preparation platform. Precision-engineered to dismantle interview anxiety and build professional authority, it provides real-time coaching, behavioral analysis, and industry-specific feedback to help you land your dream role.


## ✨ Features

- **📄 High-Fidelity Resume Analysis**: Upload your PDF resume for instant scoring and AI-driven optimization tips.
- **🤖 Realistic Mock Interviews**: AI-generated questions (Technical, HR, Scenario-based) tailored specifically to your resume and target industry.
- **📈 Real-Time Sentiment Analysis**: Evaluation of your pace, tone, and confidence levels during interview sessions.
- **💡 Actionable Insights**: Granular post-interview reports with improved answer suggestions, strengths identification, and improvement tips.
- **💬 AI Career Coach**: Interactive chat system for on-the-go practice and career advice.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [React Context API](https://reactjs.org/docs/context.html)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: [MongoDB](https://www.mongodb.com/) (with Motor)
- **AI Engine**: [Google Gemini Pro](https://deepmind.google/technologies/gemini/)
- **Document Processing**: [PyMuPDF (fitz)](https://pymupdf.readthedocs.io/en/latest/)
- **Authentication**: JWT (python-jose) & Bcrypt (passlib)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB Atlas account or local installation
- Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/YourUsername/intervueai.git
cd intervueai
```

### 2. Backend Setup
```bash
cd fastapi_backend
# Create virtual environment
python -m venv venv
source venv/bin/activate # Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Create a .env file and add your credentials
# GEMINI_API_KEY=your_key
# MONGODB_URL=your_mongodb_url
```

### 3. Frontend Setup
```bash
cd ../client
# Install dependencies
npm install

# Run development server
npm run dev
```

---

---

## 📂 Project Structure

```text
intervuAI/
├── client/              # React + Vite Frontend
│   ├── src/             # Source files
│   └── public/          # Assets (Logos, Icons)
├── fastapi_backend/     # FastAPI Backend
│   ├── utils/           # AI & PDF helpers
│   ├── models.py        # Database schemas
│   └── main.py          # API Routes
└── uploads_data/        # Temporary storage for PDF uploads
```

---

## 🤝 Contributing

We welcome contributions from the community! Feel free to open issues or submit pull requests to help make **IntervueAI** even better.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
 
</p>
