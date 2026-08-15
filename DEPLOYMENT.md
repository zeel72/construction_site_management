# 🚀 How to Deploy CSMS for FREE (Lifetime)

To host your Construction Site Management System entirely for free on the cloud, we will use a modern decoupled architecture: 
- **Database:** MongoDB Atlas (Free Tier)
- **Backend (Node.js API):** Render (Free Tier)
- **Frontend (React/Vite):** Vercel (Free Tier)

Everything is pre-configured in your code! Follow this step-by-step guide.

---

## 🏗️ Step 1: Push your code to GitHub
Both Vercel and Render deploy automatically from your GitHub repository.
1. Go to [GitHub](https://github.com/) and create a new private repository.
2. Open your terminal in the `construction_site_management` root folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

---

## 🗄️ Step 2: Configure MongoDB Atlas (Database)
Your database is currently configured securely, but you need to allow cloud servers to access it.
1. Go to your [MongoDB Atlas Dashboard](https://cloud.mongodb.com/).
2. On the left sidebar, click **Network Access**.
3. Click **Add IP Address**.
4. Select **Allow Access From Anywhere (`0.0.0.0/0`)** and click Confirm. *(Note: Since you use strong passwords, this is perfectly safe for a free cluster).*
5. Keep your `mongodb+srv://...` URL handy!

---

## ⚙️ Step 3: Deploy the Backend (Render)
Render offers a free tier for Node.js apps. I have already created a `render.yaml` configuration file for you to make this a 1-click process.

1. Create a free account at [Render.com](https://render.com/).
2. Click **New +** in the top right, and select **Blueprint**.
3. Connect your GitHub account and select your repository.
4. Render will automatically read the `render.yaml` file I created for you.
5. It will ask you to provide the `MONGO_URI`. Paste your Atlas link here!
   - Example: `mongodb+srv://authentication:Ppsv%402027@cluster1.3td3w4b.mongodb.net/csms_db`
6. Click **Apply**. 

*Wait a few minutes while Render builds and deploys your server. Once finished, copy the backend URL (e.g., `https://csms-backend.onrender.com`).*

---

## 🌐 Step 4: Deploy the Frontend (Vercel)
Vercel is the fastest and best place to host React apps for free. I have already created `client/vercel.json` to handle React Router perfectly!

1. Create a free account at [Vercel.com](https://vercel.com/) (Sign up with GitHub).
2. Click **Add New... -> Project**.
3. Import your GitHub repository.
4. In the configuration window:
   - **Framework Preset**: Vercel will auto-detect Vite.
   - **Root Directory**: Click "Edit" and type `client` (This is crucial!).
   - Expand **Environment Variables**:
     - Name: `VITE_API_URL`
     - Value: `https://csms-backend.onrender.com/api` *(Use the exact Render URL you copied in Step 3!)*
5. Click **Deploy**.

## 🎉 Done!
Your app is now live for free, forever! 
- Your frontend will load instantly via Vercel's global CDN.
- Your backend will securely handle API calls via Render.
- Any time you push a change to GitHub using `git push`, both Vercel and Render will automatically rebuild and update your live site!
