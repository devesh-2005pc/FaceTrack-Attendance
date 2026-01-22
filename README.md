# Face-Based Attendance System (FBA)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A high-performance, real-time facial recognition attendance system designed for educational institutions. Built with a modern tech stack featuring FastAPI, React, and Supabase.

## 🚀 Features

- **Real-time Detection**: Sub-second facial recognition using DeepFace and ArcFace.
- **Mobile-First UI**: Responsive student attendance interface optimized for smartphones.
- **Teacher Dashboard**: Comprehensive controls for session management and live tracking.
- **Export Capabilities**: Download attendance reports in CSV, Excel, and PDF formats.
- **Cloud Storage**: Secure student photo management via Supabase Storage.
- **Digital Signature**: Teacher verification for session finalization.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React.
- **Backend**: FastAPI, WebSockets, Python 3.11+.
- **AI/ML**: DeepFace (ArcFace model), OpenCV, TensorFlow.
- **Database**: Supabase (PostgreSQL), Real-time subscriptions.
- **Storage**: Supabase Storage Buckets.

## 📋 Prerequisites

- Node.js 20+
- Python 3.11+
- Supabase Account

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/saahil-007/FBA.git
cd FBA
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
npm install
```

### 4. Environment Variables
Create a `.env` file in the root and `backend/` directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🚀 Deployment Guide

### Recommended Free Hosting Platforms

For a production-ready deployment under `fba{xxxx}.site`, we recommend the following:

#### 1. Frontend: **Vercel** (Best for React/Vite)
- **Why**: Fastest CDN, automatic SSL, and seamless Vite integration.
- **Steps**:
  1. Push your code to GitHub.
  2. Connect repository to Vercel.
  3. Add environment variables.
  4. Set build command: `npm run build`, Output directory: `dist`.

#### 2. Backend: **Render** (Best for Python/FastAPI)
- **Why**: Native support for Python/Uvicorn and WebSockets.
- **Steps**:
  1. Create a "Web Service" on Render.
  2. Connect your GitHub repository.
  3. Runtime: `Python`, Build Command: `pip install -r requirements.txt`.
  4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.

#### 3. Database: **Supabase** (Forever Free Tier)
- **Why**: Managed PostgreSQL and Storage without server maintenance.

### Custom Domain Setup (`fba{xxxx}.site`)
1. Purchase your domain from a registrar (e.g., Namecheap, Cloudflare).
2. In Vercel, go to **Settings > Domains** and add your domain.
3. Update your DNS records (CNAME) as provided by Vercel.

## 📄 License & Copyright

Copyright (c) 2026. All rights reserved.

Licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ for better campus management.*
