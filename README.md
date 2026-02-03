
# 👁️ SatyaLens - AI Forensic & Deepfake Detection

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/frontend-React%20%7C%20Vite%20%7C%20Tailwind-blue)
![Python](https://img.shields.io/badge/backend-Flask%20%7C%20TensorFlow%20%7C%20OpenCV-yellow)

**SatyaLens** is an advanced, multi-layered forensic tool designed to verify digital media authenticity in the AI age. Unlike standard detectors that look at surface pixels, SatyaLens employs a proprietary **7-Layer Engine** to analyze bitstreams, metadata consistency, frequency artifacts, and semantic logic to detect deepfakes with high precision.

---

## 🚀 Features

### The 7-Layer Detection Engine
1.  **Bitstream Analysis**: Scans file structure for encoding anomalies typical of AI generation.
2.  **Metadata Consistency**: Cross-references EXIF/IPTC data with image content.
3.  **ELA Forensics**: Error Level Analysis to detect manipulation in compression levels.
4.  **Frequency Spectrum**: FFT (Fast Fourier Transform) analysis to find GAN/Diffusion upscaling artifacts.
5.  **Semantic Logic**: High-level analysis of scene lighting, shadows, and physics.
6.  **Human Presence**: Facial dynamics, blinking patterns, and lip-sync analysis.
7.  **Provenance Check**: Reverse search and digital signature verification.

### UI/UX
* **Modern "Sero" Aesthetic**: Dark mode-first, glassmorphism design.
* **Real-time Analysis**: WebSocket/Streaming updates for analysis progress.
* **Detailed Reports**: Generates comprehensive PDF forensic reports.
* **Secure Auth**: Integrated Google & Email authentication via Firebase.

---

## 🛠️ Tech Stack

### Frontend
* **Framework**: React 19 + Vite
* **Styling**: Tailwind CSS v4 + PostCSS
* **Animations**: Framer Motion
* **Icons**: Lucide React
* **Auth**: Firebase SDK

### Backend
* **Core**: Python 3.10+
* **API**: Flask
* **Computer Vision**: OpenCV, MediaPipe
* **AI/ML**: TensorFlow, Scikit-learn, PyTorch
* **Audio**: Librosa

---

## 📂 Project Structure

```text
SatyaLens/
├── backend/               # Python Flask API
│   ├── engine/            # The 7-Layer analysis modules
│   ├── models/            # Pre-trained ML models (.h5, .pkl)
│   ├── app.py             # API Entry point
│   └── requirements.txt   # Python dependencies
│
├── frontend/              # React Web Application
│   ├── src/
│   │   ├── components/    # UI Components (UploadZone, Charts)
│   │   ├── styles/        # Global CSS & Tailwind setup
│   │   └── App.jsx        # Main application logic
│   ├── index.html
│   └── vite.config.js
│
├── electron/              # Electron wrapper (optional desktop app)
└── start.bat              # One-click startup script

```

---

## ⚡ Getting Started

### Prerequisites

* **Node.js** (v18 or higher)
* **Python** (v3.10 or higher)
* **Git**

### 1. Clone the Repository

```bash
git clone [https://github.com/yourusername/satyalens.git](https://github.com/yourusername/satyalens.git)
cd satyalens

```

### 2. Backend Setup

Navigate to the backend folder and install Python dependencies.

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt

```

### 3. Frontend Setup

Navigate to the frontend folder and install Node dependencies.

```bash
cd ../frontend
npm install

```

### 4. Configuration

1. Create a `frontend/src/firebase.js` file with your Firebase credentials (see `firebase.example.js`).
2. Ensure your backend models are placed in `backend/models/`.

### 5. Running the App

You can use the provided batch scripts for easy startup on Windows:

* **Run Everything:** Double click `start.bat`
* **Frontend Only:** `start_frontend.bat`
* **Backend Only:** `start_backend.bat`

Or manually:

**Terminal 1 (Backend):**

```bash
cd backend
python app.py
# Server runs on [http://127.0.0.1:5000](http://127.0.0.1:5000) (or 4242)

```

**Terminal 2 (Frontend):**

```bash
cd frontend
npm run dev
# Client runs on http://localhost:5173

```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
Built with ❤️ by the SatyaLens Team
</p>
