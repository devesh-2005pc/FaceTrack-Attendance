# HOSTING & DEPLOYMENT GUIDE

This guide provides step-by-step instructions to host the FBA system on free platforms with a custom domain (`fba{xxxx}.site`).

## 1. Domain Setup (`fba{xxxx}.site`)
1. **Purchase/Register**: Use a registrar like **Cloudflare**, **Namecheap**, or **GoDaddy**.
2. **DNS Management**: We recommend using **Cloudflare DNS** (Free) for faster performance and free SSL.

---

## 2. Backend Deployment (FastAPI)
**Platform: Render (Free Tier)**

1. **Prepare Code**:
   - Ensure `requirements.txt` is in the `backend/` folder.
   - Update `main.py` to allow CORS for your production domain.
2. **Create Service**:
   - Go to [Render](https://render.com/).
   - Select **New > Web Service**.
   - Connect your GitHub repository.
3. **Configuration**:
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables**:
   - Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

---

## 3. Frontend Deployment (React/Vite)
**Platform: Vercel (Free Tier)**

1. **Connect Repo**:
   - Go to [Vercel](https://vercel.com/).
   - Click **Add New > Project**.
   - Import your GitHub repository.
2. **Project Settings**:
   - **Framework Preset**: `Vite`.
   - **Root Directory**: `./` (or the project root).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Add `VITE_BACKEND_URL` (The URL you got from Render).

---

## 4. Custom Domain Mapping
1. **In Vercel**:
   - Go to **Settings > Domains**.
   - Enter `fba{xxxx}.site`.
   - Vercel will provide an **A record** (IP) or **CNAME**.
2. **In Your DNS Provider (e.g., Cloudflare)**:
   - Add the records provided by Vercel.
   - Set "SSL/TLS" to **Full** (if using Cloudflare).

---

## 5. Database & Storage (Supabase)
**Platform: Supabase (Free Tier)**

1. **Project Setup**:
   - Your project is already configured to use Supabase.
   - Ensure your **Storage Bucket** (`student_faces`) has "Public Access" enabled for the paths used.
2. **Authentication**:
   - Set up your **Site URL** in Supabase Auth settings to `https://fba{xxxx}.site`.

---

## 🚀 Deployment Checklist
- [ ] Backend is running on Render (Check logs for "Uvicorn running on...").
- [ ] Frontend `.env` points to the Render URL (using `wss://` for WebSockets).
- [ ] Custom domain is verified in Vercel.
- [ ] Supabase storage permissions allow image viewing.

---
*Note: The free tier of Render may "sleep" after 15 mins of inactivity. The first request after a sleep period might take 30-60 seconds to respond.*
